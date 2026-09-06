import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { configuredProvider, stripeFor } from "@/lib/workflows/providers";
import { applyCheckout, applyProviderRefund } from "@/lib/workflows/finance";
import { json, txFor } from "@/lib/workflows/core";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  let event: Stripe.Event;
  try {
    const c = await configuredProvider(companyId, "stripe"),
      stripe = await stripeFor(companyId);
    if (
      !c.credentials.webhookSecret ||
      !request.headers.get("stripe-signature")
    )
      throw new Error("Missing signature");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing payload");
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 100000) {
        await reader.cancel();
        throw new Error("Payload exceeds limit");
      }
      chunks.push(value);
    }
    event = stripe.webhooks.constructEvent(
      Buffer.concat(chunks),
      request.headers.get("stripe-signature")!,
      String(c.credentials.webhookSecret),
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature or configuration" },
      { status: 400 },
    );
  }
  const actor = await prisma.user.findFirst({
    where: { companyId, role: "ADMIN", isActive: true },
  });
  if (!actor)
    return NextResponse.json(
      { error: "Business unavailable" },
      { status: 503 },
    );
  const user = { id: actor.id, companyId, role: actor.role },
    externalId = crypto
      .createHash("sha256")
      .update(companyId + ":" + event.id)
      .digest("hex"),
    payload = json({ type: event.type, eventId: event.id });
  try {
    await txFor(user, async (tx) => {
      const where = { provider_externalId: { provider: "stripe", externalId } },
        prior = await tx.providerEvent.findUnique({ where });
      if (prior?.status === "PROCESSED") return;
      const record = await tx.providerEvent.upsert({
        where,
        create: {
          provider: "stripe",
          externalId,
          companyId,
          status: "PROCESSING",
          payload,
          attempts: 1,
        },
        update: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      if (
        ["refund.created", "refund.updated", "refund.failed"].includes(
          event.type,
        )
      )
        await applyProviderRefund(user, event.data.object as Stripe.Refund);
      if (
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
          "checkout.session.async_payment_failed",
          "checkout.session.expired",
        ].includes(event.type)
      )
        await applyCheckout(
          user,
          event.data.object as Stripe.Checkout.Session,
          event.type === "checkout.session.async_payment_failed",
        );
      await tx.providerEvent.update({
        where: { id: record.id },
        data: { status: "PROCESSED", lastError: null },
      });
    });
    return NextResponse.json({ received: true });
  } catch {
    await txFor(user, async (tx) => {
      const where = { provider_externalId: { provider: "stripe", externalId } },
        prior = await tx.providerEvent.findUnique({ where });
      if (prior?.status === "PROCESSED") return;
      await tx.providerEvent.upsert({
        where,
        create: {
          provider: "stripe",
          externalId,
          companyId,
          status: "FAILED",
          payload,
          lastError: "Reconciliation failed",
        },
        update: { status: "FAILED", lastError: "Reconciliation failed" },
      });
    });
    return NextResponse.json(
      { error: "Payment reconciliation failed; retry required" },
      { status: 500 },
    );
  }
}
