import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { stableJson, type AuthContext } from "@/lib/operations-governance";
import { fail, integer, text, txFor, audit } from "./core";
export const digest = (v: unknown) =>
  crypto.createHash("sha256").update(stableJson(v)).digest("hex");
export function assistantPolicy() {
  return {
    dailyMicros:
      integer(
        Number(process.env.AI_WORKSPACE_DAILY_BUDGET_CENTS || 500),
        "AI daily budget cents",
        1,
        100000,
      ) * 10000,
    reservationMicros:
      integer(
        Number(process.env.AI_WORKSPACE_RESERVE_CENTS || 100),
        "AI request reservation cents",
        1,
        10000,
      ) * 10000,
    hourlyCalls: 20,
  };
}
export async function reserveAssistant(
  user: AuthContext,
  key: unknown,
  mode: string,
  model: string,
  input: unknown,
) {
  const token = text(key, "retry key", 128);
  if (!/^[\w:-]{8,128}$/.test(token)) fail("A valid retry key is required");
  const id = digest([user.id, user.companyId, token]),
    inputHash = digest(input),
    policy = assistantPolicy();
  return txFor(user, async (tx) => {
    const prior = await tx.assistantRequest.findUnique({ where: { id } });
    if (prior) {
      if (
        prior.inputHash !== inputHash ||
        prior.feature !== mode ||
        prior.model !== model
      )
        fail("Retry key was used for a different AI request", 409);
      return { request: prior, created: false };
    }
    const stale = new Date(Date.now() - 120000);
    await tx.assistantRequest.updateMany({
      where: {
        companyId: user.companyId,
        state: "PROCESSING",
        createdAt: { lt: stale },
      },
      data: { state: "UNKNOWN" },
    });
    if (
      (await tx.assistantRequest.count({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      })) >= policy.hourlyCalls
    )
      fail("AI hourly request limit reached", 429);
    if (
      (await tx.assistantRequest.count({
        where: { companyId: user.companyId, state: "PROCESSING" },
      })) >= 2
    )
      fail("Two AI requests are already running for this company", 429);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const previous = await tx.assistantRequest.findMany({
        where: { companyId: user.companyId, createdAt: { gte: today } },
        select: { budgetMicros: true, actualMicros: true },
      }),
      spent = previous.reduce(
        (s, r) => s + (r.actualMicros ?? r.budgetMicros),
        0,
      );
    if (spent + policy.reservationMicros > policy.dailyMicros)
      fail("AI workspace daily budget allowance reached", 429);
    const request = await tx.assistantRequest.create({
      data: {
        id,
        companyId: user.companyId,
        userId: user.id,
        feature: mode,
        model,
        inputHash,
        budgetMicros: policy.reservationMicros,
      },
    });
    await audit(tx, user, "AI_REQUEST_RESERVED", "AssistantRequest", id, {
      mode,
      model,
      budgetMicros: policy.reservationMicros,
    });
    return { request, created: true };
  });
}
export async function cancelAssistant(user: AuthContext, id: string) {
  return txFor(user, async (tx) => {
    const row = await tx.assistantRequest.findFirst({
      where: {
        id,
        companyId: user.companyId,
        ...(user.role === "TECHNICIAN" ? { userId: user.id } : {}),
      },
    });
    if (!row) fail("AI request not found", 404);
    if (row.state !== "PROCESSING") fail("Request is no longer running", 409);
    await tx.assistantRequest.update({
      where: { id },
      data: { state: "CANCELLED" },
    });
    await audit(tx, user, "AI_REQUEST_CANCELLED", "AssistantRequest", id, {});
    return {
      cancelled: true,
      note: "Provider processing may already have incurred a charge; any late draft will be discarded.",
    };
  });
}
export async function boundedProviderJson(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) fail("Empty provider response", 502);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 150000) {
      await reader.cancel();
      fail("Provider output exceeds the response limit", 502);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    fail("Provider returned malformed JSON", 502);
  }
}
