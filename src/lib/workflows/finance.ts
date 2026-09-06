import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import { audit, fail, integer, manager, money, text, txFor } from "./core";
import { stripeFor } from "./providers";
import { invoiceFor, noPendingCheckout, noPendingRefund } from "./invoices";
type StripeFactory = (companyId: string) => Promise<Stripe>;
export async function checkout(
  user: AuthContext,
  customerId: string,
  body: Record<string, unknown>,
  factory: StripeFactory = stripeFor,
) {
  const invoiceId = text(body.invoiceId, "invoice", 100),
    requestKey = text(body.requestKey, "retry key", 128);
  const stripe = await factory(user.companyId);
  const reservation = await txFor(user, async (tx) => {
    const invoice = await invoiceFor(tx, user, invoiceId);
    await noPendingRefund(tx, invoiceId);
    if (invoice.customerId !== customerId) fail("Invoice not found", 404);
    if (
      !invoice.reviewedAt ||
      !["ISSUED", "SENT", "VIEWED", "PARTIAL", "OVERDUE"].includes(
        invoice.status,
      ) ||
      money(invoice.balanceDue.toString()) <= 0
    )
      fail(
        "A reviewed issued invoice with an outstanding balance is required",
        409,
      );
    const previous = await tx.paymentCheckout.findUnique({
      where: {
        companyId_requestKey: { companyId: user.companyId, requestKey },
      },
    });
    if (previous) {
      if (previous.invoiceId !== invoiceId)
        fail("Retry key belongs to another invoice", 409);
      return previous;
    }
    const active = await tx.paymentCheckout.findFirst({
      where: { invoiceId, status: { in: ["PENDING", "UNKNOWN"] } },
    });
    if (active) return active;
    return tx.paymentCheckout.create({
      data: {
        companyId: user.companyId,
        invoiceId,
        invoiceVersion: invoice.version,
        amountCents: money(invoice.balanceDue.toString()),
        requestKey,
      },
    });
  });
  if (reservation.sessionId) {
    const session = await stripe.checkout.sessions.retrieve(
      reservation.sessionId,
    );
    if (session.status === "open" && session.url) return { url: session.url };
    await applyCheckout(user, session);
    fail(
      "Checkout is no longer open; refresh the invoice before starting another payment",
      409,
    );
  }
  if (!["PENDING", "UNKNOWN"].includes(reservation.status))
    fail("This checkout is closed; create a new request", 409);
  if (reservation.createdAt.getTime() < Date.now() - 23 * 3600000)
    fail(
      "The retry window elapsed; reconcile the checkout with its provider session ID",
      409,
    );
  const origin = new URL(process.env.NEXTAUTH_URL || "http://localhost:3000")
    .origin;
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: reservation.id,
        metadata: {
          checkoutId: reservation.id,
          companyId: user.companyId,
          invoiceId,
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: reservation.amountCents,
              product_data: { name: "Home service invoice" },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/payment-result?result=return`,
        cancel_url: `${origin}/payment-result?result=cancelled`,
      },
      { idempotencyKey: `checkout-${reservation.id}` },
    );
    await prisma.paymentCheckout.updateMany({
      where: { id: reservation.id, status: { in: ["PENDING", "UNKNOWN"] } },
      data: { sessionId: session.id, status: "PENDING" },
    });
    if (!session.url) fail("Provider did not return a checkout URL", 502);
    return { url: session.url };
  } catch (error) {
    await prisma.paymentCheckout.updateMany({
      where: { id: reservation.id, status: "PENDING" },
      data: { status: "UNKNOWN" },
    });
    throw error;
  }
}
export async function applyCheckout(
  user: AuthContext,
  session: Stripe.Checkout.Session,
  failed = false,
) {
  return txFor(user, async (tx) => {
    if (session.metadata?.companyId !== user.companyId)
      fail("Checkout company mismatch", 409);
    const row = await tx.paymentCheckout.findFirst({
      where: { id: session.metadata.checkoutId, companyId: user.companyId },
    });
    if (
      !row ||
      row.invoiceId !== session.metadata.invoiceId ||
      session.client_reference_id !== row.id
    )
      fail("Checkout identity mismatch", 409);
    if (row.sessionId && row.sessionId !== session.id)
      fail("Provider session mismatch", 409);
    if (row.status === "PAID") return row;
    if (
      session.payment_status !== "paid" &&
      (session.status === "expired" || failed)
    )
      return tx.paymentCheckout.update({
        where: { id: row.id },
        data: { sessionId: session.id, status: failed ? "FAILED" : "EXPIRED" },
      });
    if (session.payment_status !== "paid") return row;
    if (session.currency !== "usd" || session.amount_total !== row.amountCents)
      fail("Provider payment amount or currency mismatch", 409);
    const invoice = await invoiceFor(tx, user, row.invoiceId),
      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
    if (!paymentIntentId) fail("Provider payment receipt is missing", 409);
    if (
      !invoice.reviewedAt ||
      invoice.status === "VOID" ||
      money(invoice.balanceDue.toString()) < row.amountCents
    )
      fail("Paid checkout requires manual balance reconciliation", 409);
    const existing = await tx.payment.findFirst({
      where: { stripePaymentId: paymentIntentId },
    });
    if (existing) fail("Provider payment was already applied elsewhere", 409);
    const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: row.amountCents / 100,
          method: "CREDIT_CARD",
          stripePaymentId: paymentIntentId,
          reference: session.id,
          notes: "Verified online payment",
          verifiedAt: new Date(),
          source: "STRIPE",
        },
      }),
      paid = money(invoice.paidAmount.toString()) + row.amountCents,
      balance =
        money(invoice.totalAmount.toString()) - invoice.creditCents - paid;
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: paid / 100,
        balanceDue: balance / 100,
        status: balance ? "PARTIAL" : "PAID",
        paidDate: balance ? null : new Date(),
        version: { increment: 1 },
      },
    });
    const saved = await tx.paymentCheckout.update({
      where: { id: row.id },
      data: { sessionId: session.id, paymentIntentId, status: "PAID" },
    });
    await audit(tx, user, "PAYMENT_VERIFIED", "Invoice", invoice.id, {
      source: "STRIPE",
      paymentId: payment.id,
      paymentIntentId,
      amountCents: row.amountCents,
    });
    return saved;
  });
}
export async function finance(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
  factory: StripeFactory = stripeFor,
) {
  manager(user);
  if (!body) {
    const [invoices, payments, refunds, checkouts, credits] = await Promise.all(
      [
        prisma.invoice.findMany({
          where: { customer: { companyId: user.companyId } },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            balanceDue: true,
            status: true,
            creditCents: true,
            reviewedAt: true,
            currency: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1000,
        }),
        prisma.payment.findMany({
          where: { invoice: { customer: { companyId: user.companyId } } },
          orderBy: { date: "desc" },
          take: 1000,
        }),
        prisma.paymentRefund.findMany({
          where: { companyId: user.companyId },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prisma.paymentCheckout.findMany({
          where: { companyId: user.companyId },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prisma.invoiceCredit.findMany({
          where: { companyId: user.companyId },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      ],
    );
    return { invoices, payments, refunds, checkouts, credits };
  }
  if (action === "checkout-reconcile") {
    const row = await prisma.paymentCheckout.findFirst({
      where: { id: text(body.id, "checkout", 100), companyId: user.companyId },
    });
    if (!row) fail("Checkout not found", 404);
    const reference = text(
      body.sessionId || row.sessionId,
      "provider session ID",
      150,
    );
    const stripe = await factory(user.companyId),
      session = await stripe.checkout.sessions.retrieve(reference);
    if (session.metadata?.checkoutId !== row.id)
      fail("Provider receipt belongs to another checkout");
    return applyCheckout(user, session);
  }
  if (action === "checkout-expire") {
    const row = await prisma.paymentCheckout.findFirst({
      where: { id: text(body.id, "checkout", 100), companyId: user.companyId },
    });
    if (!row?.sessionId) fail("Reconcile the provider session ID first");
    const stripe = await factory(user.companyId),
      current = await stripe.checkout.sessions.retrieve(row.sessionId);
    if (current.status !== "open") return applyCheckout(user, current);
    return applyCheckout(
      user,
      await stripe.checkout.sessions.expire(row.sessionId),
    );
  }
  if (action === "refund-reconcile") {
    const row = await prisma.paymentRefund.findFirst({
      where: { id: text(body.id, "refund", 100), companyId: user.companyId },
    });
    if (!row || row.kind !== "STRIPE") fail("Stripe refund not found", 404);
    const stripe = await factory(user.companyId),
      reference = text(
        body.providerId || row.providerId,
        "provider refund ID",
        150,
      ),
      refund = await stripe.refunds.retrieve(reference);
    return applyProviderRefund(user, refund, row.id);
  }
  if (action !== "refund") fail("Unknown finance action");
  const requestKey = text(body.requestKey, "retry key", 128),
    paymentId = text(body.paymentId, "payment", 100),
    amountCents = integer(body.amountCents, "refund amount", 1, 999999999),
    reason = text(body.reason, "refund reason", 2000),
    creditInvoice = body.creditInvoice === true;
  const originalPayment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      invoice: { customer: { companyId: user.companyId } },
    },
  });
  const refundStripe =
    originalPayment?.source === "STRIPE" ? await factory(user.companyId) : null;
  const reservation = await txFor(user, async (tx) => {
    const prior = await tx.paymentRefund.findUnique({
      where: {
        companyId_requestKey: { companyId: user.companyId, requestKey },
      },
    });
    if (prior) {
      if (
        prior.paymentId !== paymentId ||
        prior.amountCents !== amountCents ||
        prior.reason !== reason ||
        prior.creditInvoice !== creditInvoice
      )
        fail("Refund retry key was reused with different details", 409);
      return prior;
    }
    const payment = await tx.payment.findFirst({
      where: {
        id: paymentId,
        invoice: { customer: { companyId: user.companyId } },
      },
    });
    if (!payment?.verifiedAt)
      fail("Refunds require a verified payment receipt", 409);
    if (
      payment.source !== "STRIPE" &&
      !(payment.source === "MANUAL" && payment.method === "CASH")
    )
      fail("Only verified Stripe or cash refunds are supported");
    await noPendingCheckout(tx, payment.invoiceId);
    const total = await tx.paymentRefund.aggregate({
      where: { paymentId, status: { not: "FAILED" } },
      _sum: { amountCents: true },
    });
    if (
      (total._sum.amountCents || 0) + amountCents >
      money(payment.amount.toString())
    )
      fail("Refund exceeds the unrefunded payment", 409);
    if (payment.source === "MANUAL" && body.cashReturnedConfirmed !== true)
      fail("Confirm that the cash was actually handed back");
    const saved = await tx.paymentRefund.create({
      data: {
        companyId: user.companyId,
        invoiceId: payment.invoiceId,
        paymentId,
        amountCents,
        reason,
        requestKey,
        createdById: user.id,
        creditInvoice,
        kind: payment.source === "STRIPE" ? "STRIPE" : "CASH",
      },
    });
    await audit(tx, user, "REFUND_REQUESTED", "PaymentRefund", saved.id, {
      amountCents,
      creditInvoice,
      kind: saved.kind,
    });
    if (saved.kind === "CASH")
      return applyRefund(user, saved.id, null, "succeeded");
    return saved;
  });
  if (reservation.status === "SUCCEEDED" || reservation.kind === "CASH")
    return reservation;
  if (reservation.status === "FAILED")
    fail(
      "Refund was definitively rejected; start a new request after resolving the error",
      409,
    );
  const stripe = refundStripe || (await factory(user.companyId));
  if (reservation.providerId)
    return applyProviderRefund(
      user,
      await stripe.refunds.retrieve(reservation.providerId),
      reservation.id,
    );
  if (reservation.createdAt.getTime() < Date.now() - 23 * 3600000)
    fail(
      "Retry window elapsed; reconcile the refund with its provider ID",
      409,
    );
  const payment = await prisma.payment.findUniqueOrThrow({
    where: { id: reservation.paymentId },
  });
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.stripePaymentId!,
        amount: reservation.amountCents,
        metadata: { refundId: reservation.id, companyId: user.companyId },
      },
      { idempotencyKey: `refund-${reservation.id}` },
    );
    return applyProviderRefund(user, refund, reservation.id);
  } catch (error) {
    await prisma.paymentRefund.updateMany({
      where: { id: reservation.id, status: "PENDING" },
      data: { status: "UNKNOWN" },
    });
    throw error;
  }
}
export async function applyProviderRefund(
  user: AuthContext,
  refund: Stripe.Refund,
  id?: string,
) {
  return txFor(user, async (tx) => {
    const refundId = id || refund.metadata?.refundId;
    if (!refundId || refund.metadata?.companyId !== user.companyId)
      fail("Refund identity mismatch", 409);
    const row = await tx.paymentRefund.findFirst({
      where: { id: refundId, companyId: user.companyId },
    });
    if (
      !row ||
      refund.metadata?.refundId !== row.id ||
      refund.amount !== row.amountCents ||
      refund.currency !== "usd"
    )
      fail("Refund amount or identity mismatch", 409);
    const payment = await tx.payment.findUniqueOrThrow({
        where: { id: row.paymentId },
      }),
      intent =
        typeof refund.payment_intent === "string"
          ? refund.payment_intent
          : refund.payment_intent?.id;
    if (!intent || payment.stripePaymentId !== intent)
      fail("Refund payment receipt mismatch", 409);
    if (row.providerId && row.providerId !== refund.id)
      fail("Provider refund receipt mismatch", 409);
    return applyRefund(user, row.id, refund.id, refund.status || "pending");
  });
}
export async function applyRefund(
  user: AuthContext,
  id: string,
  providerId: string | null,
  status: string,
) {
  return txFor(user, async (tx) => {
    const row = await tx.paymentRefund.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!row) fail("Refund not found", 404);
    if (row.status === "SUCCEEDED") return row;
    if (row.status === "FAILED" && !["failed", "canceled"].includes(status))
      fail("Terminal refund status requires manual investigation", 409);
    const next =
      status === "succeeded"
        ? "SUCCEEDED"
        : ["failed", "canceled"].includes(status)
          ? "FAILED"
          : "PENDING";
    if (next === "SUCCEEDED") {
      const invoice = await invoiceFor(tx, user, row.invoiceId),
        paid = money(invoice.paidAmount.toString()) - row.amountCents,
        credits =
          invoice.creditCents + (row.creditInvoice ? row.amountCents : 0),
        balance = money(invoice.totalAmount.toString()) - credits - paid;
      if (
        paid < 0 ||
        balance < 0 ||
        credits > money(invoice.totalAmount.toString())
      )
        fail("Refund requires manual balance reconciliation", 409);
      if (row.creditInvoice)
        await tx.invoiceCredit.create({
          data: {
            companyId: user.companyId,
            invoiceId: invoice.id,
            amountCents: row.amountCents,
            reason: row.reason,
            actorId: row.createdById,
          },
        });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: paid / 100,
          creditCents: credits,
          balanceDue: balance / 100,
          status: balance ? (paid ? "PARTIAL" : "ISSUED") : "PAID",
          paidDate: balance ? null : invoice.paidDate,
          version: { increment: 1 },
        },
      });
    }
    const saved = await tx.paymentRefund.update({
      where: { id },
      data: {
        providerId,
        status: next,
        ...(next === "SUCCEEDED" ? { settledAt: new Date() } : {}),
      },
    });
    await audit(tx, user, "REFUND_RECONCILED", "PaymentRefund", id, {
      status: next,
      source: row.kind,
      amountCents: row.amountCents,
      providerId,
    });
    return saved;
  });
}
