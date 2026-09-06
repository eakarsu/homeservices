import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";
import {
  handle,
  bodyFor,
  withReceipt,
  txFor,
  fail,
} from "@/lib/workflows/core";
import { changeInvoice, invoiceFor } from "@/lib/workflows/invoices";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await invoiceFor(prisma, user, (await params).id);
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: (await params).id,
        customer: {
          companyId: user.companyId,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
            billingAddress: true,
            billingCity: true,
            billingState: true,
            billingZip: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: "asc" },
        },
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const PUT = (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) =>
  handle(request, async (user) => {
    const id = (await params).id,
      body = await bodyFor(request);
    return withReceipt(
      user,
      request.headers.get("Idempotency-Key"),
      "invoice.change",
      { id, ...body },
      () => changeInvoice(user, id, body),
    );
  });
export const DELETE = (request: NextRequest) =>
  handle(request, () =>
    fail(
      "Invoice history is retained. Use the reviewed void or credit action.",
      405,
    ),
  );
