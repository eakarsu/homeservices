import { NextRequest } from "next/server";
import { handle, bodyFor, office, text } from "@/lib/workflows/core";
import { prisma } from "@/lib/prisma";
import { invoiceFor } from "@/lib/workflows/invoices";
import { checkout } from "@/lib/workflows/finance";
export const POST = (request: NextRequest) =>
  handle(request, async (user) => {
    office(user);
    const body = await bodyFor(request),
      invoice = await invoiceFor(
        prisma,
        user,
        text(body.invoiceId, "invoice", 100),
      );
    return checkout(user, invoice.customerId, {
      ...body,
      requestKey: request.headers.get("Idempotency-Key"),
    });
  });
