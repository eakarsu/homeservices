import { NextRequest } from "next/server";
import { handle, bodyFor, withReceipt } from "@/lib/workflows/core";
import { recordPayment } from "@/lib/workflows/invoices";
export const POST = (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) =>
  handle(request, async (user) => {
    const id = (await params).id,
      body = await bodyFor(request);
    return withReceipt(
      user,
      request.headers.get("Idempotency-Key"),
      "invoice.payment",
      { id, ...body },
      () => recordPayment(user, id, body),
    );
  });
