import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { stableJson } from "@/lib/operations-governance";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/apiAuth";
import { validFollowUpOrigin } from "@/lib/follow-ups";
import { appendAuditEvent } from "@/lib/audit-events";
import { canReadJob, type AuthContext } from "@/lib/operations-governance";

export class WorkflowError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function fail(message: string, status = 400): never {
  throw new WorkflowError(message, status);
}
export const officeRoles = ["ADMIN", "MANAGER", "DISPATCHER", "OFFICE"];
export function office(user: AuthContext) {
  if (!officeRoles.includes(user.role)) fail("Office access required", 403);
}
export function manager(user: AuthContext) {
  if (!["ADMIN", "MANAGER"].includes(user.role))
    fail("Manager access required", 403);
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Expected an object");
  return value as Record<string, unknown>;
}
export function text(
  value: unknown,
  name: string,
  max = 500,
  required = true,
): string {
  if (!required && (value === undefined || value === null || value === ""))
    return "";
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    return fail(`Invalid ${name}`);
  return value.trim();
}
export function integer(
  value: unknown,
  name: string,
  min = 0,
  max = 1000000,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    return fail(`Invalid ${name}`);
  return value;
}
export function money(value: unknown): number {
  if (
    !["number", "string"].includes(typeof value) ||
    !/^\d+(\.\d{1,2})?$/.test(String(value))
  )
    return fail("Amount must have at most two decimal places");
  return integer(Math.round(Number(value) * 100), "amount", 0, 999999999);
}
export function date(value: unknown, name = "date"): Date {
  const raw = text(value, name, 40);
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(raw))
    return fail(`${name} requires an explicit timezone`);
  const result = new Date(raw);
  if (!Number.isFinite(result.getTime())) return fail(`Invalid ${name}`);
  return result;
}
export function version(value: unknown) {
  return integer(value, "version", 1);
}
export function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}
const transactions = new AsyncLocalStorage<{
  tx: Prisma.TransactionClient;
  companyId: string;
}>();
export async function txFor<T>(
  user: AuthContext,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const current = transactions.getStore();
  if (current) {
    if (current.companyId !== user.companyId)
      fail("Transaction scope mismatch", 403);
    return fn(current.tx);
  }
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Company" WHERE id = ${user.companyId} FOR UPDATE`;
      const actor = await tx.user.findFirst({
        where: { id: user.id, companyId: user.companyId, isActive: true },
        select: { role: true },
      });
      if (!actor || actor.role !== user.role)
        fail("Account access changed; sign in again", 403);
      return transactions.run({ tx, companyId: user.companyId }, () => fn(tx));
    },
    { timeout: 20000, maxWait: 10000 },
  );
}
export async function withReceipt(
  user: AuthContext,
  key: unknown,
  action: string,
  input: unknown,
  work: () => Promise<unknown>,
) {
  const token = text(key, "retry key", 128);
  if (!/^[\w:-]{8,128}$/.test(token))
    fail("A valid Idempotency-Key is required");
  const digest = (v: unknown) =>
      createHash("sha256").update(stableJson(v)).digest("hex"),
    id = digest([user.companyId, user.id, token]),
    inputHash = digest([action, input]);
  return txFor(user, async (tx) => {
    const previous = await tx.workflowMutation.findUnique({ where: { id } });
    if (previous) {
      if (previous.inputHash !== inputHash)
        fail("Retry key was used with different input", 409);
      return previous.response;
    }
    const result = await work();
    await tx.workflowMutation.create({
      data: {
        id,
        companyId: user.companyId,
        actorId: user.id,
        action,
        inputHash,
        response: json(result),
      },
    });
    return result;
  });
}
export const audit = (
  tx: Prisma.TransactionClient,
  user: AuthContext,
  action: string,
  entityType: string,
  entityId: string,
  payload: unknown,
) =>
  appendAuditEvent(tx, {
    companyId: user.companyId,
    actorId: user.id,
    action,
    entityType,
    entityId,
    payload: json(payload),
  });
export async function jobFor(
  tx: Prisma.TransactionClient,
  user: AuthContext,
  id: string,
) {
  const job = await tx.job.findFirst({
    where: { id, companyId: user.companyId },
    include: { assignments: { select: { technicianId: true } } },
  });
  if (!job || !canReadJob(user, job)) return fail("Job not found", 404);
  return job;
}
export async function customerFor(
  tx: Prisma.TransactionClient,
  user: AuthContext,
  id: string,
) {
  const customer = await tx.customer.findFirst({
    where: { id, companyId: user.companyId },
  });
  return customer || fail("Customer not found", 404);
}
export async function bodyFor(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 1500000)
    return fail("Request too large", 413);
  const reader = request.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  if (reader)
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1500000) {
        await reader.cancel();
        fail("Request too large", 413);
      }
      chunks.push(value);
    }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return object(JSON.parse(raw));
  } catch (error) {
    if (error instanceof WorkflowError) throw error;
    return fail("Invalid JSON");
  }
}
export async function handle(
  request: NextRequest,
  fn: (user: AuthContext) => Promise<unknown>,
) {
  try {
    const user = await getAuthUser(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (
      !["GET", "HEAD"].includes(request.method) &&
      !validFollowUpOrigin(
        request.headers.get("origin"),
        process.env.NEXTAUTH_URL || request.url,
        process.env.NODE_ENV !== "production",
      )
    )
      fail("Invalid origin", 403);
    const result = await fn(user);
    return result instanceof Response
      ? result
      : NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkflowError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    )
      return NextResponse.json(
        {
          error:
            "This operation conflicts with an existing record. Refresh and retry.",
        },
        { status: 409 },
      );
    console.error(
      "Workflow request failed",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to complete the request" },
      { status: 500 },
    );
  }
}
export function csv(rows: Record<string, unknown>[], columns: string[]) {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return (
      '"' + (/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"'
    );
  };
  return [
    columns.map(escape).join(","),
    ...rows.map((row) => columns.map((key) => escape(row[key])).join(",")),
  ].join("\r\n");
}
