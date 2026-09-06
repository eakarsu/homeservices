import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

import { prisma } from "@/lib/prisma";
import { handle, bodyFor, withReceipt } from "@/lib/workflows/core";
import { createInvoice } from "@/lib/workflows/invoices";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || 10),
    );
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {
      customer: {
        companyId: user.companyId,
      },
    };

    if (user.role === "TECHNICIAN")
      where.job = {
        assignments: { some: { technicianId: user.technicianId || "none" } },
      };
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { firstName: { contains: search, mode: "insensitive" } } },
        { customer: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Sort support
    const sort = searchParams.get("sort");
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort) {
      const [field, direction] = sort.split(":");
      const allowedFields = [
        "invoiceNumber",
        "status",
        "totalAmount",
        "dueDate",
        "createdAt",
        "balanceDue",
      ];
      if (allowedFields.includes(field)) {
        orderBy = { [field]: direction === "asc" ? "asc" : "desc" };
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
          },
          job: {
            select: {
              id: true,
              jobNumber: true,
            },
          },
          payments: true,
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Invoices list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = (request: NextRequest) =>
  handle(request, async (user) => {
    const body = await bodyFor(request);
    return withReceipt(
      user,
      request.headers.get("Idempotency-Key"),
      "invoice.create",
      body,
      () => createInvoice(user, body),
    );
  });
