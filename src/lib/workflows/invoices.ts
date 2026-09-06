import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  customerFor,
  date,
  fail,
  integer,
  jobFor,
  manager,
  money,
  object,
  office,
  text,
  txFor,
  version,
} from "./core";
export function invoiceTotals(body: Record<string, unknown>) {
  if (
    !Array.isArray(body.lineItems) ||
    !body.lineItems.length ||
    body.lineItems.length > 100
  )
    fail("Use 1–100 invoice lines");
  const items = body.lineItems.map((value, index) => {
      const line = object(value),
        quantity = money(line.quantity),
        unitPrice = money(line.unitPrice);
      if (!quantity) fail("Line quantity must be positive");
      const totalPrice = Number(
        (BigInt(quantity) * BigInt(unitPrice) + BigInt(50)) / BigInt(100),
      );
      integer(totalPrice, "line total", 0, 999999999);
      return {
        description: text(line.description, "description", 1000),
        quantity: quantity / 100,
        unitPrice: unitPrice / 100,
        totalPrice: totalPrice / 100,
        category: text(line.category, "category", 100, false),
        sortOrder: index,
      };
    }),
    subtotal = items.reduce((s, i) => s + Math.round(i.totalPrice * 100), 0),
    rawRate = String(body.taxRate ?? 0);
  if (!/^(?:0(?:\.\d{1,4})?|1(?:\.0{1,4})?)$/.test(rawRate))
    fail("Tax rate must be a fraction from 0 to 1 with up to four decimals");
  const rate = Math.round(Number(rawRate) * 10000),
    tax = Number(
      (BigInt(subtotal) * BigInt(rate) + BigInt(5000)) / BigInt(10000),
    ),
    total = subtotal + tax;
  integer(total, "invoice total", 1, 999999999);
  return {
    items,
    subtotal: subtotal / 100,
    taxRate: rate / 10000,
    taxAmount: tax / 100,
    totalAmount: total / 100,
  };
}
export async function invoiceFor(
  tx: Prisma.TransactionClient,
  user: AuthContext,
  id: string,
) {
  const row = await tx.invoice.findFirst({
    where: { id, customer: { companyId: user.companyId } },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) fail("Invoice not found", 404);
  if (user.role === "TECHNICIAN") {
    if (!row.jobId) fail("Invoice not found", 404);
    await jobFor(tx, user, row.jobId);
  }
  return row;
}
export async function noPendingRefund(
  tx: Prisma.TransactionClient,
  id: string,
) {
  if (
    await tx.paymentRefund.count({
      where: { invoiceId: id, status: { in: ["PENDING", "UNKNOWN"] } },
    })
  )
    fail("Reconcile the pending refund before changing this balance", 409);
}
export async function noPendingCheckout(
  tx: Prisma.TransactionClient,
  id: string,
) {
  if (
    await tx.paymentCheckout.count({
      where: { invoiceId: id, status: { in: ["PENDING", "UNKNOWN"] } },
    })
  )
    fail(
      "Reconcile or expire the online checkout before changing this balance",
      409,
    );
  await noPendingRefund(tx, id);
}
export async function createInvoice(
  user: AuthContext,
  body: Record<string, unknown>,
) {
  office(user);
  return txFor(user, async (tx) => {
    const customer = await customerFor(
        tx,
        user,
        text(body.customerId, "customer", 100),
      ),
      jobId = text(body.jobId, "job", 100, false) || null;
    if (jobId && (await jobFor(tx, user, jobId)).customerId !== customer.id)
      fail("Job belongs to a different customer");
    if (body.status && body.status !== "DRAFT")
      fail("Invoices start as drafts and require review before issue");
    const totals = invoiceTotals(body),
      dueDate = body.dueDate
        ? date(
            /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate))
              ? `${body.dueDate}T23:59:59Z`
              : body.dueDate,
          )
        : new Date(Date.now() + 30 * 86400000);
    const { items, ...amounts } = totals;
    const row = await tx.invoice.create({
      data: {
        invoiceNumber: "INV-" + crypto.randomUUID(),
        customerId: customer.id,
        jobId,
        dueDate,
        ...amounts,
        balanceDue: totals.totalAmount,
        notes: text(body.notes, "notes", 20000, false),
        terms: text(body.terms, "terms", 20000, false),
        lineItems: { create: items },
      },
    });
    await audit(tx, user, "INVOICE_DRAFT_CREATED", "Invoice", row.id, {
      amountCents: money(row.totalAmount.toString()),
      jobId,
    });
    return row;
  });
}
export async function changeInvoice(
  user: AuthContext,
  id: string,
  body: Record<string, unknown>,
) {
  office(user);
  return txFor(user, async (tx) => {
    const row = await invoiceFor(tx, user, id);
    if (body.version !== row.version)
      fail("Invoice changed; reload before saving", 409);
    const action = String(body.action || "edit");
    await noPendingCheckout(tx, id);
    if (action === "issue") {
      manager(user);
      if (row.status !== "DRAFT" || row.reviewedAt)
        fail("Only a draft can be issued", 409);
      if (body.reviewConfirmed !== true)
        fail("Confirm review of scope, quantities, prices and tax");
      const totals = invoiceTotals({
        lineItems: row.lineItems.map((l) => ({
          ...l,
          quantity: l.quantity.toString(),
          unitPrice: l.unitPrice.toString(),
        })),
        taxRate: row.taxRate.toString(),
      });
      if (["subtotal","taxAmount","totalAmount"].some(k=>money(totals[k as "totalAmount"])!==money(row[k as "totalAmount"].toString())) || row.lineItems.some((l,n)=>money(l.totalPrice.toString())!==money(totals.items[n].totalPrice)))
        fail("Invoice totals do not reconcile; correct the draft first", 409);
      const saved = await tx.invoice.update({
        where: { id },
        data: {
          status: "ISSUED",
          reviewedAt: new Date(),
          reviewedById: user.id,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "INVOICE_ISSUED", "Invoice", id, {
        version: saved.version,
        totalCents: money(row.totalAmount.toString()),
        currency: row.currency,
      });
      return saved;
    }
    if (action === "void") {
      manager(user);
      if (
        money(row.paidAmount.toString()) ||
        (await tx.payment.count({ where: { invoiceId: id } }))
      )
        fail("Paid invoices require refunds or credits, not voiding", 409);
      if (row.status === "VOID") fail("Invoice is already void", 409);
      const saved = await tx.invoice.update({
        where: { id },
        data: { status: "VOID", balanceDue: 0, version: { increment: 1 } },
      });
      await audit(tx, user, "INVOICE_VOIDED", "Invoice", id, {
        reason: text(body.reason, "void reason", 2000),
      });
      return saved;
    }
    if (action === "credit") {
      manager(user);
      if (!row.reviewedAt || ["DRAFT", "VOID"].includes(row.status))
        fail("Only a reviewed issued invoice can be credited", 409);
      const amount = money(body.amount),
        balance = money(row.balanceDue.toString());
      if (!amount || amount > balance)
        fail(
          "Credit exceeds the outstanding balance; refund paid funds separately",
          409,
        );
      const note = await tx.invoiceCredit.create({
        data: {
          companyId: user.companyId,
          invoiceId: id,
          amountCents: amount,
          reason: text(body.reason, "credit reason", 2000),
          actorId: user.id,
        },
      });
      const remaining = balance - amount;
      await tx.invoice.update({
        where: { id },
        data: {
          creditCents: { increment: amount },
          balanceDue: remaining / 100,
          status: remaining ? row.status : "PAID",
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "INVOICE_CREDITED", "Invoice", id, {
        creditId: note.id,
        amountCents: amount,
      });
      return note;
    }
    if (action !== "edit") fail("Unknown invoice action");
    if (row.status !== "DRAFT" || row.reviewedAt)
      fail(
        "Issued invoice amounts and terms are retained unchanged; use a credit note",
        409,
      );
    const data: Prisma.InvoiceUpdateInput = { version: { increment: 1 } };
    for (const k of ["notes", "terms"] as const)
      if (body[k] !== undefined) data[k] = text(body[k], k, 20000, false);
    if (body.dueDate)
      data.dueDate = date(
        /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate))
          ? `${body.dueDate}T23:59:59Z`
          : body.dueDate,
      );
    if (body.lineItems) {
      const { items, ...amounts } = invoiceTotals(body);
      Object.assign(data, amounts, {
        balanceDue: amounts.totalAmount,
        lineItems: { deleteMany: {}, create: items },
      });
    }
    if (body.status && body.status !== "DRAFT")
      fail("Use the reviewed issue, payment or void action to change status");
    const saved = await tx.invoice.update({ where: { id }, data });
    await audit(tx, user, "INVOICE_DRAFT_EDITED", "Invoice", id, {
      version: saved.version,
    });
    return saved;
  });
}
export async function recordPayment(
  user: AuthContext,
  id: string,
  body: Record<string, unknown>,
) {
  office(user);
  return txFor(user, async (tx) => {
    const row = await invoiceFor(tx, user, id);
    if (
      !row.reviewedAt ||
      !["ISSUED", "SENT", "VIEWED", "PARTIAL", "OVERDUE"].includes(row.status)
    )
      fail("Issue a reviewed invoice before recording a payment", 409);
    await noPendingCheckout(tx, id);
    const amount = money(body.amount),
      method = text(body.method, "payment method", 30);
    if (!["CASH", "CHECK", "ACH"].includes(method))
      fail("Card payments require a verified provider receipt");
    if (body.receivedConfirmed !== true)
      fail("Confirm that these funds have actually been received");
    if (amount <= 0 || amount > money(row.balanceDue.toString()))
      fail("Payment exceeds the outstanding balance", 409);
    const reference = text(
        body.reference,
        "payment reference",
        300,
        method !== "CASH",
      ),
      payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount: amount / 100,
          method: method as "CASH",
          reference,
          notes: text(body.notes, "notes", 2000, false),
          verifiedAt: new Date(),
          actorId: user.id,
          source: "MANUAL",
        },
      }),
      paid = money(row.paidAmount.toString()) + amount,
      balance = money(row.totalAmount.toString()) - row.creditCents - paid;
    await tx.invoice.update({
      where: { id },
      data: {
        paidAmount: paid / 100,
        balanceDue: balance / 100,
        status: balance ? "PARTIAL" : "PAID",
        paidDate: balance ? null : new Date(),
        version: { increment: 1 },
      },
    });
    await audit(tx, user, "PAYMENT_RECORDED", "Invoice", id, {
      paymentId: payment.id,
      amountCents: amount,
      method,
      reference,
    });
    return payment;
  });
}
