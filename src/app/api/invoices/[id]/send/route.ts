import { NextRequest } from "next/server";
import {
  handle,
  bodyFor,
  withReceipt,
  txFor,
  office,
  fail,
} from "@/lib/workflows/core";
import { invoiceFor } from "@/lib/workflows/invoices";
import { messages } from "@/lib/workflows/communications";
export const POST = (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) =>
  handle(request, async (user) => {
    office(user);
    const id = (await params).id,
      body = await bodyFor(request),
      key = request.headers.get("Idempotency-Key");
    return withReceipt(user, key, "invoice.message", { id, ...body }, () =>
      txFor(user, async (tx) => {
        const invoice = await invoiceFor(tx, user, id);
        if (!invoice.reviewedAt || invoice.status === "VOID")
          fail("Issue and review the invoice first", 409);
        if (body.version !== invoice.version)
          fail("Invoice changed; reload before preparing its message", 409);
        return messages(user, {
          customerId: invoice.customerId,
          jobId: invoice.jobId,
          channel: "EMAIL",
          subject: `Invoice ${invoice.invoiceNumber}`,
          body: `Invoice ${invoice.invoiceNumber}\n${invoice.lineItems.map((l) => `${l.description}: ${l.quantity} × $${Number(l.unitPrice).toFixed(2)} = $${Number(l.totalPrice).toFixed(2)}`).join("\n")}\nTotal USD $${Number(invoice.totalAmount).toFixed(2)}\nCredits $${(invoice.creditCents / 100).toFixed(2)}\nBalance $${Number(invoice.balanceDue).toFixed(2)}\nDue ${invoice.dueDate.toISOString().slice(0, 10)}\n${invoice.terms || ""}\nContact the office for your private customer portal link.`,
          scheduledAt: new Date().toISOString(),
          contactAuthorized: body.contactAuthorized,
          requestKey: key,
        });
      }),
    );
  });
