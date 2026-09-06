import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import { audit, fail, json, manager, object, text, txFor } from "./core";

export const providerNames = [
  "stripe",
  "resend",
  "twilio",
  "quickbooks",
  "maps",
  "samsara",
];
function encryptionKey() {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!raw || !/^[a-f0-9]{64}$/i.test(raw))
    return fail(
      "Set INTEGRATION_ENCRYPTION_KEY to a random 32-byte hex key before storing provider credentials",
      503,
    );
  return Buffer.from(raw, "hex");
}
export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  return [
    iv.toString("hex"),
    cipher.update(value, "utf8", "hex") + cipher.final("hex"),
    cipher.getAuthTag().toString("hex"),
  ].join(".");
}
export function decryptSecret(value: string) {
  const [iv, encrypted, tag] = value.split("."),
    decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv, "hex"),
    );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}
export async function connection(
  companyId: string,
  provider: string,
  db: Prisma.TransactionClient = prisma,
) {
  const c = await db.integrationConnection.findUnique({
    where: { companyId_provider: { companyId, provider } },
  });
  if (!c?.enabled)
    return fail(`Configure and enable ${provider} in Integrations first`, 503);
  return {
    ...c,
    config: object(c.config),
    secret: decryptSecret(c.encryptedSecret),
  };
}
export async function providerSettings(
  user: AuthContext,
  body?: Record<string, unknown>,
) {
  manager(user);
  if (!body)
    return prisma.integrationConnection.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        provider: true,
        config: true,
        enabled: true,
        updatedAt: true,
      },
    });
  const provider = text(body.provider, "provider", 30);
  if (!providerNames.includes(provider)) fail("Unsupported provider");
  const config = object(body.config),
    allowed: Record<string, string[]> = {
      stripe: ["webhookSecret"],
      resend: ["from", "webhookSecret"],
      twilio: ["accountSid", "from"],
      quickbooks: ["realmId", "environment", "incomeAccountId"],
      maps: [],
      samsara: [],
    };
  const safe: Record<string, string> = {};
  for (const key of allowed[provider])
    if (config[key]) safe[key] = text(config[key], key, 500);
  // Webhook secrets must be encrypted alongside API keys, never returned in config.
  const existing = await prisma.integrationConnection.findUnique({
    where: { companyId_provider: { companyId: user.companyId, provider } },
  });
  const secret = text(body.secret, "API credential", 20000, false);
  if (!secret && !existing) fail("Provider credentials are required");
  const secretData: Record<string, unknown> = existing
    ? object(JSON.parse(decryptSecret(existing.encryptedSecret)))
    : {};
  const previousToken = secretData.token;
  if (secret) secretData.token = secret;
  if (safe.webhookSecret) {
    secretData.webhookSecret = safe.webhookSecret;
    delete safe.webhookSecret;
  }
  if (
    provider === "quickbooks" &&
    !["sandbox", "production"].includes(safe.environment)
  )
    fail("Choose sandbox or production");
  if (
    provider === "twilio" &&
    (!/^AC[0-9a-f]{32}$/i.test(safe.accountSid || "") ||
      !/^\+[1-9]\d{7,14}$/.test(safe.from || ""))
  )
    fail("Twilio requires a valid account SID and sender number");
  if (provider === "resend" && !safe.from) fail("Email sender is required");
  if (typeof body.enabled !== "boolean") fail("Enabled must be true or false");
  const saved = await txFor(user, async (tx) => {
    const latest = await tx.integrationConnection.findUnique({
      where: { companyId_provider: { companyId: user.companyId, provider } },
    });
    if (
      latest &&
      (!existing || latest.updatedAt.getTime() !== existing.updatedAt.getTime())
    )
      fail("Connection changed; reload before saving", 409);
    if (
      ["resend", "twilio"].includes(provider) &&
      (await tx.delivery.count({
        where: {
          companyId: user.companyId,
          channel: provider === "resend" ? "EMAIL" : "SMS",
          status: { in: ["PROCESSING", "ACCEPTED", "SENT", "UNKNOWN"] },
        },
      }))
    )
      fail(
        "Reconcile outstanding deliveries before changing this connection",
        409,
      );

    if (provider === "stripe" && existing) {
      const unresolved =
        (await tx.paymentCheckout.count({
          where: {
            companyId: user.companyId,
            status: { in: ["PENDING", "UNKNOWN"] },
          },
        })) +
        (await tx.paymentRefund.count({
          where: {
            companyId: user.companyId,
            status: { in: ["PENDING", "UNKNOWN"] },
          },
        }));
      if (unresolved)
        fail(
          "Reconcile pending payments and refunds before changing Stripe settings",
          409,
        );
      if (
        secret &&
        secret !== previousToken &&
        (await tx.paymentCheckout.count({
          where: { companyId: user.companyId },
        }))
      )
        fail(
          "Payment history exists. Changing the Stripe credential requires account verification and receipt migration.",
          409,
        );
    }
    const row = await tx.integrationConnection.upsert({
      where: { companyId_provider: { companyId: user.companyId, provider } },
      create: {
        companyId: user.companyId,
        provider,
        config: safe,
        encryptedSecret: encryptSecret(JSON.stringify(secretData)),
        enabled: body.enabled === true,
      },
      update: {
        config: safe,
        encryptedSecret: encryptSecret(JSON.stringify(secretData)),
        enabled: body.enabled === true,
      },
    });
    await audit(
      tx,
      user,
      "INTEGRATION_CONFIGURED",
      "IntegrationConnection",
      row.id,
      { provider, enabled: row.enabled },
    );
    return row;
  });
  return { id: saved.id, provider, config: safe, enabled: saved.enabled };
}
export async function configuredProvider(
  companyId: string,
  provider: string,
  db: Prisma.TransactionClient = prisma,
) {
  const c = await connection(companyId, provider, db);
  return { ...c, credentials: object(JSON.parse(c.secret)) };
}
export async function stripeFor(companyId: string) {
  const c = await configuredProvider(companyId, "stripe");
  return new Stripe(String(c.credentials.token), {
    apiVersion: "2025-02-24.acacia",
    timeout: 15000,
    maxNetworkRetries: 1,
  });
}
export async function providerFetch(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    return fail(`Provider returned HTTP ${response.status}`, 502);
  return response.json();
}
