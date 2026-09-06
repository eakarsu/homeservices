import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  customerFor,
  date,
  fail,
  office,
  text,
  txFor,
  version,
  jobFor,
  json,
} from "./core";
import { configuredProvider } from "./providers";
import { boundedProviderJson, digest } from "./assistant-requests";
export function checkContact(
  customer: {
    doNotEmail: boolean;
    doNotText: boolean;
    email: string | null;
    phone: string | null;
    mobile: string | null;
  },
  channel: string,
) {
  const recipient =
    channel === "EMAIL" ? customer.email : customer.mobile || customer.phone;
  if (
    !recipient ||
    (channel === "EMAIL" && customer.doNotEmail) ||
    (channel === "SMS" && customer.doNotText)
  )
    fail("Customer has opted out or has no address for this channel", 409);
  if (
    (channel === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) ||
    (channel === "SMS" && !/^\+[1-9]\d{7,14}$/.test(recipient))
  )
    fail("A valid email or phone number with country code is required");
  return recipient;
}
export async function messages(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
) {
  office(user);
  if (!body)
    return prisma.delivery.findMany({
      where: { companyId: user.companyId },
      orderBy: { scheduledAt: "desc" },
      take: 500,
    });
  if (action === "dispatch")
    return dispatchDelivery(user, text(body.id, "message", 100));
  if (action === "refresh")
    return refreshDelivery(user, text(body.id, "message", 100));
  return txFor(user, async (tx) => {
    const current = body.id
      ? await tx.delivery.findFirst({
          where: {
            id: text(body.id, "message", 100),
            companyId: user.companyId,
          },
        })
      : null;
    if (body.id && !current) fail("Message not found", 404);
    if (current && current.version !== version(body.version))
      fail("Message changed; reload before saving", 409);
    if (action === "cancel" && current) {
      if (!["DRAFT", "QUEUED", "REJECTED"].includes(current.status))
        fail("This message is no longer cancellable", 409);
      const saved = await tx.delivery.update({
        where: { id: current.id },
        data: { status: "CANCELLED", version: { increment: 1 } },
      });
      await audit(tx, user, "MESSAGE_CANCELLED", "Delivery", saved.id, {});
      return saved;
    }
    if (action === "approve" && current) {
      if (!["DRAFT", "REJECTED"].includes(current.status))
        fail("Only drafts and rejected requests may be queued", 409);
      if (!current.contactAuthorized)
        fail("Contact authorization must be confirmed");
      const customer = await customerFor(tx, user, current.customerId),
        recipient = checkContact(customer, current.channel);
      const saved = await tx.delivery.update({
        where: { id: current.id },
        data: {
          status: "QUEUED",
          recipient,
          approvedAt: new Date(),
          approvedById: user.id,
          lastError: null,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "MESSAGE_APPROVED", "Delivery", saved.id, {
        recipient,
      });
      return saved;
    }
    if (current && current.status !== "DRAFT")
      fail("Only draft messages may be edited", 409);
    if (body.contactAuthorized !== true)
      fail("Confirm authorization to contact this customer about this service");
    const customerId = text(body.customerId, "customer", 100),
      customer = await customerFor(tx, user, customerId),
      channel = text(body.channel, "channel", 20);
    if (!["EMAIL", "SMS"].includes(channel)) fail("Choose email or SMS");
    checkContact(customer, channel);
    const jobId = text(body.jobId, "job", 100, false) || null;
    if (jobId && (await jobFor(tx, user, jobId)).customerId !== customerId)
      fail("Job does not belong to customer");
    const data = {
        customerId,
        jobId,
        channel,
        subject: text(body.subject, "subject", 200, false),
        body: text(body.body, "message", channel === "SMS" ? 1600 : 10000),
        scheduledAt: date(body.scheduledAt, "scheduled time"),
        contactAuthorized: true,
      },
      requestKey = text(
        body.requestKey ?? current?.requestKey,
        "retry key",
        128,
      );
    const saved = current
      ? await tx.delivery.update({
          where: { id: current.id },
          data: { ...data, version: { increment: 1 } },
        })
      : await tx.delivery.create({
          data: {
            ...data,
            companyId: user.companyId,
            createdById: user.id,
            requestKey,
          },
        });
    await audit(tx, user, "MESSAGE_DRAFT_SAVED", "Delivery", saved.id, {
      customerId,
      channel,
      contactAuthorized: true,
    });
    return saved;
  });
}
export async function dispatchDelivery(
  user: AuthContext,
  id: string,
  fetcher: typeof fetch = fetch,
) {
  office(user);
  const claimed = await txFor(user, async (tx) => {
    await tx.delivery.updateMany({
      where: {
        companyId: user.companyId,
        status: "PROCESSING",
        updatedAt: { lt: new Date(Date.now() - 120000) },
      },
      data: {
        status: "UNKNOWN",
        lastError:
          "Interrupted delivery; reconcile provider records before sending again",
      },
    });
    const row = await tx.delivery.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!row) fail("Message not found", 404);
    if (
      row.status !== "QUEUED" ||
      !row.approvedById ||
      !row.contactAuthorized ||
      row.scheduledAt > new Date()
    )
      fail(
        "The message must be approved, due and authorized before sending",
        409,
      );
    if (
      !(await tx.user.findFirst({
        where: {
          id: row.approvedById,
          companyId: user.companyId,
          isActive: true,
          role: { in: ["ADMIN", "MANAGER", "DISPATCHER", "OFFICE"] },
        },
      }))
    )
      fail("The approver is no longer authorized", 403);
    const customer = await customerFor(tx, user, row.customerId),
      recipient = checkContact(customer, row.channel);
    if (recipient !== row.recipient)
      fail("Customer address changed; create and review a new draft", 409);
    const provider = await configuredProvider(
      user.companyId,
      row.channel === "EMAIL" ? "resend" : "twilio",
      tx,
    );
    if (
      row.channel === "SMS" &&
      !process.env.NEXTAUTH_URL?.startsWith("https://") &&
      process.env.NODE_ENV !== "test"
    )
      fail("SMS delivery requires an HTTPS callback origin", 503);
    await tx.delivery.update({
      where: { id },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        version: { increment: 1 },
      },
    });
    await audit(tx, user, "MESSAGE_DISPATCH_STARTED", "Delivery", id, {
      channel: row.channel,
      attempt: row.attempts + 1,
    });
    return { row, provider, recipient };
  });
  const { row, provider, recipient } = claimed,
    callback = new URL(
      `/api/integrations/messages/${user.companyId}/twilio`,
      process.env.NEXTAUTH_URL || "http://localhost:3000",
    ).toString();
  try {
    const response = await fetcher(
      row.channel === "EMAIL"
        ? "https://api.resend.com/emails"
        : `https://api.twilio.com/2010-04-01/Accounts/${provider.config.accountSid}/Messages.json`,
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers:
          row.channel === "EMAIL"
            ? {
                Authorization: `Bearer ${provider.credentials.token}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `${row.id}-${row.attempts + 1}`,
              }
            : {
                Authorization:
                  "Basic " +
                  Buffer.from(
                    `${provider.config.accountSid}:${provider.credentials.token}`,
                  ).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
              },
        body:
          row.channel === "EMAIL"
            ? JSON.stringify({
                from: provider.config.from,
                to: [recipient],
                subject: row.subject || "Service update",
                text: row.body,
              })
            : new URLSearchParams({
                From: String(provider.config.from),
                To: recipient,
                Body: row.body,
                StatusCallback: callback,
              }).toString(),
      },
    );
    if (!response.ok) {
      const status =
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 408 &&
        response.status !== 409
          ? "REJECTED"
          : "UNKNOWN";
      await prisma.delivery.updateMany({
        where: { id, status: "PROCESSING" },
        data: {
          status,
          lastError: `Provider HTTP ${response.status}; ${status === "REJECTED" ? "request rejected" : "outcome uncertain"}`,
        },
      });
      return { id, status };
    }
    const receipt = await boundedProviderJson(response),
      providerId = String(receipt.id || receipt.sid || "");
    if (!providerId || providerId.length > 150)
      throw Error("Missing provider reference");
    return txFor(user, async (tx) => {
      await tx.delivery.update({
        where: { id },
        data: { status: "ACCEPTED", providerId, lastError: null },
      });
      await tx.communication.create({
        data: {
          customerId: row.customerId,
          type: row.channel as "EMAIL" | "SMS",
          direction: "outbound",
          subject: row.subject,
          message: row.body,
          status: "accepted",
        },
      });
      // A callback can arrive before the API response. Replay already authenticated evidence.
      const early = await tx.providerEvent.findMany({
        where: {
          companyId: user.companyId,
          provider: `message:${row.channel === "EMAIL" ? "resend" : "twilio"}`,
          payload: { path: ["providerId"], equals: providerId },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      });
      for (const e of early)
        await applyDeliveryEvidence(
          tx,
          id,
          (e.payload as { status: string }).status,
        );
      await audit(tx, user, "MESSAGE_ACCEPTED", "Delivery", id, { providerId });
      return tx.delivery.findUniqueOrThrow({ where: { id } });
    });
  } catch {
    await prisma.delivery.updateMany({
      where: { id, status: "PROCESSING" },
      data: {
        status: "UNKNOWN",
        lastError:
          "Delivery outcome uncertain. Do not resend until reconciled with provider records.",
      },
    });
    return { id, status: "UNKNOWN" };
  }
}
async function applyDeliveryEvidence(
  tx: Prisma.TransactionClient,
  id: string,
  status: string,
) {
  const row = await tx.delivery.findUniqueOrThrow({ where: { id } });
  if (["CANCELLED", "DELIVERED", "UNDELIVERED"].includes(row.status)) return;
  await tx.delivery.update({
    where: { id },
    data: {
      status,
      lastError:
        status === "UNDELIVERED" ? "Provider reported delivery failure" : null,
      version: { increment: 1 },
    },
  });
}
export async function recordDeliveryEvidence(
  companyId: string,
  provider: string,
  externalId: string,
  providerId: string,
  status: string,
) {
  if (
    !["resend", "twilio"].includes(provider) ||
    !["ACCEPTED", "SENT", "DELIVERED", "UNDELIVERED"].includes(status)
  )
    fail("Invalid delivery evidence");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Company" WHERE id=${companyId} FOR UPDATE`;
    const providerKey = `message:${provider}`,
      eventId = digest([companyId, externalId]);
    if (
      await tx.providerEvent.findUnique({
        where: {
          provider_externalId: { provider: providerKey, externalId: eventId },
        },
      })
    )
      return;
    const payload = { providerId, status };
    await tx.providerEvent.create({
      data: {
        provider: providerKey,
        externalId: eventId,
        companyId,
        status: "PROCESSED",
        payload,
      },
    });
    const row = await tx.delivery.findFirst({
      where: {
        companyId,
        channel: provider === "resend" ? "EMAIL" : "SMS",
        providerId,
      },
    });
    if (row) await applyDeliveryEvidence(tx, row.id, status);
  });
}
export async function refreshDelivery(
  user: AuthContext,
  id: string,
  fetcher: typeof fetch = fetch,
) {
  office(user);
  const row = await prisma.delivery.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!row?.providerId) fail("A provider reference is required");
  const provider = row.channel === "EMAIL" ? "resend" : "twilio",
    c = await configuredProvider(user.companyId, provider),
    r = await fetcher(
      provider === "resend"
        ? `https://api.resend.com/emails/${encodeURIComponent(row.providerId)}`
        : `https://api.twilio.com/2010-04-01/Accounts/${c.config.accountSid}/Messages/${encodeURIComponent(row.providerId)}.json`,
      {
        headers: {
          Authorization:
            provider === "resend"
              ? `Bearer ${c.credentials.token}`
              : "Basic " +
                Buffer.from(
                  `${c.config.accountSid}:${c.credentials.token}`,
                ).toString("base64"),
        },
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
  if (!r.ok) fail("Unable to read provider delivery status", 502);
  const data = await boundedProviderJson(r),
    status = deliveryStatus(String(data.last_event || data.status));
  if (status)
    await recordDeliveryEvidence(
      user.companyId,
      provider,
      digest([row.providerId, status]),
      row.providerId,
      status,
    );
  return prisma.delivery.findUniqueOrThrow({ where: { id } });
}
export function deliveryStatus(value: string) {
  return ["delivered", "email.delivered", "read"].includes(value)
    ? "DELIVERED"
    : [
          "failed",
          "undelivered",
          "bounced",
          "email.bounced",
          "email.failed",
        ].includes(value)
      ? "UNDELIVERED"
      : ["sent", "email.sent"].includes(value)
        ? "SENT"
        : ["accepted", "queued", "sending", "scheduled"].includes(value)
          ? "ACCEPTED"
          : null;
}
