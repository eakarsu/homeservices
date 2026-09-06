import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import {
  withReceipt,
  txFor,
  csv,
  WorkflowError,
} from "../../src/lib/workflows/core";
import {
  assign,
  bookings,
  checkAvailability,
} from "../../src/lib/workflows/scheduling";
import { inventory } from "../../src/lib/workflows/stock";
import { purchasing } from "../../src/lib/workflows/purchasing";
import { timesheets } from "../../src/lib/workflows/time";
import { execution, updateJob } from "../../src/lib/workflows/execution";
import { records } from "../../src/lib/workflows/records";
import { workforce } from "../../src/lib/workflows/workforce";
import {
  grants,
  portalActor,
  portalData,
  reviewFromCustomer,
} from "../../src/lib/workflows/portal";
import {
  validateAuditChain,
  type AuthContext,
} from "../../src/lib/operations-governance";
if (
  !new URL(process.env.DATABASE_URL!).pathname.startsWith("/homeservices_test_")
)
  throw Error("Use the disposable database runner");
after(() => prisma.$disconnect());
async function fixture() {
  const key = crypto.randomUUID(),
    company = await prisma.company.create({
      data: {
        name: "Fixture " + key,
        timezone: "America/New_York",
        serviceArea: [],
      },
    });
  async function user(role: "ADMIN" | "OFFICE" | "TECHNICIAN") {
    return prisma.user.create({
      data: {
        companyId: company.id,
        email: crypto.randomUUID() + "@example.test",
        password: "not-a-real-password",
        firstName: role,
        lastName: "Fixture",
        role,
        emailVerified: true,
      },
    });
  }
  const admin = await user("ADMIN"),
    clerk = await user("OFFICE"),
    worker = await user("TECHNICIAN"),
    tech = await prisma.technician.create({
      data: {
        userId: worker.id,
        tradeTypes: ["HVAC"],
        certifications: [],
        schedules: {
          create: Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            startTime: "08:00",
            endTime: "17:00",
            isWorking: true,
          })),
        },
      },
    });
  const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        customerNumber: "C-" + key,
        firstName: "Fictional",
        lastName: "Customer",
        tags: [],
      },
    }),
    property = await prisma.property.create({
      data: {
        customerId: customer.id,
        address: "1 Test Lane",
        city: "Test",
        state: "NY",
        zip: "10001",
      },
    }),
    service = await prisma.serviceType.create({
      data: {
        companyId: company.id,
        name: "Test HVAC",
        tradeType: "HVAC",
        defaultDuration: 60,
      },
    }),
    truck = await prisma.truck.create({
      data: { companyId: company.id, name: "Test truck" },
    }),
    part = await prisma.part.create({
      data: {
        companyId: company.id,
        partNumber: "TEST",
        name: "Test part",
        cost: "2.35",
        price: "5.25",
        quantityOnHand: 10,
      },
    });
  await prisma.technician.update({
    where: { id: tech.id },
    data: { truckId: truck.id },
  });
  const a: AuthContext = {
      id: admin.id,
      companyId: company.id,
      role: admin.role,
    },
    o: AuthContext = { id: clerk.id, companyId: company.id, role: clerk.role },
    t: AuthContext = {
      id: worker.id,
      companyId: company.id,
      role: worker.role,
      technicianId: tech.id,
    };
  async function job(
    start = "2030-06-03T14:00:00Z",
    end = "2030-06-03T15:00:00Z",
  ) {
    return prisma.job.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        propertyId: property.id,
        serviceTypeId: service.id,
        createdById: admin.id,
        jobNumber: "J-" + crypto.randomUUID(),
        title: "Fixture job",
        tradeType: "HVAC",
        status: "SCHEDULED",
        scheduledStart: new Date(start),
        scheduledEnd: new Date(end),
        tags: [],
      },
    });
  }
  return {
    company,
    admin,
    clerk,
    worker,
    tech,
    customer,
    property,
    service,
    truck,
    part,
    a,
    o,
    t,
    job,
  };
}
const retry = (
  actor: AuthContext,
  action: string,
  input: Record<string, unknown>,
  work: () => Promise<unknown>,
  key = crypto.randomUUID(),
) => withReceipt(actor, key, action, input, work);
async function rejects(promise: Promise<unknown>, pattern: RegExp) {
  await assert.rejects(
    promise,
    (e) => e instanceof WorkflowError && pattern.test(e.message),
  );
}
test("appointments serialize concurrent assignments, enforce trades, company, leave and every shared technician window", async () => {
  const f = await fixture(),
    other = await fixture(),
    j1 = await f.job(),
    j2 = await f.job();
  const outcomes = await Promise.allSettled([
    assign(f.a, { jobId: j1.id, technicianId: f.tech.id }),
    assign(f.a, { jobId: j2.id, technicianId: f.tech.id }),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  await rejects(
    assign(other.a, { jobId: j1.id, technicianId: other.tech.id }),
    /not found/,
  );
  await rejects(
    assign(f.t, { jobId: j1.id, technicianId: f.tech.id }),
    /Office/,
  );
  await rejects(
    assign(f.a, { jobId: j1.id, technicianId: other.tech.id }),
    /not found/,
  );
  await rejects(
    txFor(f.a, (tx) =>
      checkAvailability(
        tx,
        f.a,
        f.tech.id,
        new Date("2030-06-04T14:00:00Z"),
        new Date("2030-06-04T15:00:00Z"),
        "PLUMBING",
      ),
    ),
    /required trade/,
  );
  await workforce(
    f.a,
    {
      action: "timeoff",
      technicianId: f.tech.id,
      startAt: "2030-06-04T12:00:00Z",
      endAt: "2030-06-04T21:00:00Z",
      reason: "Planned leave",
    },
    "timeoff",
  );
  await rejects(
    assign(f.a, {
      jobId: (await f.job("2030-06-04T14:00:00Z", "2030-06-04T15:00:00Z")).id,
      technicianId: f.tech.id,
    }),
    /on leave/,
  );
  await rejects(
    txFor(f.a, (tx) =>
      checkAvailability(
        tx,
        f.a,
        f.tech.id,
        new Date("2030-06-05T10:00:00Z"),
        new Date("2030-06-05T11:00:00Z"),
        "HVAC",
      ),
    ),
    /working hours/,
  );
  const input = {
      customerId: f.customer.id,
      propertyId: f.property.id,
      serviceTypeId: f.service.id,
      title: "Service request",
      startAt: "2030-06-06T14:00:00Z",
      endAt: "2030-06-06T15:00:00Z",
    },
    key = crypto.randomUUID();
  const request = (await retry(
    f.a,
    "booking",
    input,
    () => bookings(f.a, input),
    key,
  )) as { id: string; version: number };
  assert.equal(
    (
      (await retry(f.a, "booking", input, () => bookings(f.a, input), key)) as {
        id: string;
      }
    ).id,
    request.id,
  );
  await rejects(
    retry(
      f.a,
      "booking",
      { ...input, title: "changed" },
      () => bookings(f.a, input),
      key,
    ),
    /different input/,
  );
  const confirmed = (await bookings(
    f.a,
    {
      ...input,
      id: request.id,
      version: request.version,
      technicianId: f.tech.id,
    },
    "confirm",
  )) as { id: string; version: number; jobId: string };
  await rejects(
    bookings(
      f.a,
      { ...input, id: request.id, version: request.version },
      "confirm",
    ),
    /changed/,
  );
  await rejects(
    bookings(
      f.a,
      { ...input, id: request.id, version: confirmed.version },
      undefined,
      f.customer.id,
    ),
    /rescheduled by the office/,
  );
  await bookings(
    f.a,
    {
      id: request.id,
      version: confirmed.version,
      notes: "Customer requested cancellation",
    },
    "cancel",
    f.customer.id,
  );
  assert.equal(
    (await prisma.job.findUniqueOrThrow({ where: { id: confirmed.jobId } }))
      .status,
    "CANCELLED",
  );
});
test("stock retry receipts, overspend and cross-company checks, partial purchasing receipts and returns reconcile", async () => {
  const f = await fixture(),
    other = await fixture(),
    input = {
      partId: f.part.id,
      fromTruckId: "",
      toTruckId: f.truck.id,
      quantity: 7,
    },
    key = crypto.randomUUID();
  await retry(
    f.a,
    "transfer",
    input,
    () => inventory(f.a, input, "transfer"),
    key,
  );
  await retry(
    f.a,
    "transfer",
    input,
    () => inventory(f.a, input, "transfer"),
    key,
  );
  assert.equal(
    (await prisma.part.findUniqueOrThrow({ where: { id: f.part.id } }))
      .quantityOnHand,
    3,
  );
  await rejects(
    retry(
      f.a,
      "transfer",
      { ...input, quantity: 2 },
      () => inventory(f.a, input, "transfer"),
      key,
    ),
    /different input/,
  );
  const concurrent = await Promise.allSettled([
    inventory(f.a, { ...input, quantity: 2 }, "transfer"),
    inventory(f.a, { ...input, quantity: 2 }, "transfer"),
  ]);
  assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
  await rejects(
    inventory(
      f.a,
      { ...input, toTruckId: other.truck.id, quantity: 1 },
      "transfer",
    ),
    /Truck not found/,
  );
  assert.equal(
    (await prisma.part.findUniqueOrThrow({ where: { id: f.part.id } }))
      .quantityOnHand,
    1,
  );
  await rejects(
    inventory(
      f.t,
      { partId: f.part.id, quantity: 5, reason: "test" },
      "adjust",
    ),
    /Office/,
  );
  const vendor = (await records(f.a, "vendors", {
    title: "Fictional supplier",
    status: "ACTIVE",
    data: { email: "supplier@example.test" },
  })) as { id: string };
  const po = (await purchasing(f.a, {
    vendorId: vendor.id,
    items: [{ partId: f.part.id, quantity: 5, unitCost: "2.35" }],
    taxAmount: "0.75",
  })) as { id: string; version: number };
  await rejects(
    purchasing(f.o, { id: po.id, version: po.version }, "approve"),
    /Manager/,
  );
  const approved = (await purchasing(
    f.a,
    { id: po.id, version: po.version },
    "approve",
  )) as { id: string; version: number };
  const item = await prisma.purchaseOrderItem.findFirstOrThrow({
    where: { purchaseOrderId: po.id },
  });
  const receipt = {
      id: po.id,
      version: approved.version,
      requestKey: crypto.randomUUID(),
      receipts: [{ itemId: item.id, quantity: 3 }],
    },
    receiptKey = crypto.randomUUID();
  await retry(
    f.a,
    "receive",
    receipt,
    () => purchasing(f.a, receipt, "receive"),
    receiptKey,
  );
  await retry(
    f.a,
    "receive",
    receipt,
    () => purchasing(f.a, receipt, "receive"),
    receiptKey,
  );
  assert.equal(
    (await prisma.part.findUniqueOrThrow({ where: { id: f.part.id } }))
      .quantityOnHand,
    4,
  );
  const current = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: po.id },
  });
  assert.equal(current.status, "PARTIAL");
  assert.equal(current.totalAmount.toFixed(2), "12.50");
  await rejects(
    purchasing(
      f.a,
      {
        ...receipt,
        version: current.version,
        requestKey: crypto.randomUUID(),
        receipts: [{ itemId: item.id, quantity: 3 }],
      },
      "receive",
    ),
    /exceeds/,
  );
  await purchasing(
    f.a,
    {
      id: po.id,
      version: current.version,
      itemId: item.id,
      quantity: 2,
      reason: "Damaged on arrival",
      requestKey: crypto.randomUUID(),
    },
    "return",
  );
  assert.equal(
    (await prisma.part.findUniqueOrThrow({ where: { id: f.part.id } }))
      .quantityOnHand,
    2,
  );
  assert.equal(
    (
      await prisma.purchaseOrderItem.findUniqueOrThrow({
        where: { id: item.id },
      })
    ).receivedQty,
    1,
  );
});
test("field evidence, immutable completion, timers and office approvals persist with an intact audit chain", async () => {
  const f = await fixture(),
    other = await fixture(),
    job = await f.job();
  await assign(f.a, { jobId: job.id, technicianId: f.tech.id });
  await updateJob(f.t, job.id, { status: "IN_PROGRESS" });
  await rejects(execution(other.a, job.id), /not found/);
  await inventory(
    f.a,
    { partId: f.part.id, fromTruckId: "", toTruckId: f.truck.id, quantity: 2 },
    "transfer",
  );
  await inventory(
    f.t,
    {
      action: "use",
      jobId: job.id,
      partId: f.part.id,
      truckId: f.truck.id,
      quantity: 1,
    },
    "use",
  );
  const used = await prisma.jobPart.findFirstOrThrow({
    where: { jobId: job.id },
  });
  assert.equal(used.totalPrice.toFixed(2), "5.25");
  const running = (await timesheets(
    f.t,
    { jobId: job.id, type: "WORK" },
    "start",
  )) as { id: string; version: number };
  await rejects(
    timesheets(f.t, { jobId: job.id, type: "BREAK" }, "start"),
    /overlapping/,
  );
  await rejects(updateJob(f.t, job.id, { status: "COMPLETED" }), /Stop all/);
  const stopped = (await timesheets(
    f.t,
    { id: running.id, version: running.version },
    "stop",
  )) as { id: string; version: number };
  await rejects(
    timesheets(f.t, { id: stopped.id, version: stopped.version }, "approve"),
    /Office/,
  );
  await timesheets(
    f.o,
    { id: stopped.id, version: stopped.version },
    "approve",
  );
  await rejects(
    timesheets(
      f.o,
      {
        id: stopped.id,
        version: stopped.version + 1,
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date().toISOString(),
        reason: "Amend",
      },
      "correct",
    ),
    /immutable/,
  );
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1sAAAAASUVORK5CYII=";
  await execution(
    f.t,
    job.id,
    {
      items: [
        {
          id: "confirm",
          label: "Recorded actual work",
          checked: true,
          notes: "Test fixture",
        },
      ],
    },
    "checklist",
  );
  await execution(
    f.t,
    job.id,
    {
      media: png,
      type: "AFTER",
      caption: "Fictional test photo",
      consent: true,
    },
    "photo",
  );
  const complete = await updateJob(f.t, job.id, {
    status: "COMPLETED",
    workPerformed: "Fictional fixture completion only.",
    customerSignature: png,
  });
  assert.equal(complete.status, "COMPLETED");
  await rejects(
    updateJob(f.t, job.id, { workPerformed: "Replacing history" }),
    /retained unchanged/,
  );
  assert.equal(
    await prisma.serviceHistory.count({ where: { jobId: job.id } }),
    1,
  );
  const events = await prisma.auditEvent.findMany({
    where: { companyId: f.company.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  assert.equal(validateAuditChain(events), true);
  await assert.rejects(
    prisma.auditEvent.delete({ where: { id: events[0].id } }),
    /append-only/,
  );
  assert.match(csv([{ name: '=HYPERLINK("bad")' }], ["name"]), /'=HYPERLINK/);
});
test("private portal links expire and revoke, customer data remains scoped, and reviews require completed jobs", async () => {
  const f = await fixture(),
    other = await fixture(),
    job = await f.job();
  const link = (await grants(f.a, { customerId: f.customer.id, days: 7 })) as {
    url: string;
    id: string;
  };
  const token = new URL(link.url).hash.slice(1);
  const actor = await portalActor(token);
  assert.equal(actor.grant.customerId, f.customer.id);
  const data = await portalData(actor.user, actor.grant.customerId);
  assert.equal(data.jobs.length, 1);
  assert.equal(data.jobs[0].id, job.id);
  assert.ok(!JSON.stringify(data).includes("password"));
  await rejects(
    grants(other.a, { customerId: f.customer.id, days: 7 }),
    /not found/,
  );
  await rejects(
    reviewFromCustomer(f.a, f.customer.id, {
      jobId: job.id,
      rating: 5,
      comment: "Test",
    }),
    /Only completed/,
  );
  await grants(f.a, { id: link.id }, "revoke");
  await rejects(portalActor(token), /invalid or expired/);
});

test("provider message fixtures preserve acceptance vs delivery, reject opt-outs, handle uncertain outcomes and signed callback replay", async () => {
  const { messages, dispatchDelivery, recordDeliveryEvidence } =
      await import("../../src/lib/workflows/communications"),
    { providerSettings } = await import("../../src/lib/workflows/providers");
  const f = await fixture();
  process.env.INTEGRATION_ENCRYPTION_KEY = "ab".repeat(32);
  process.env.NEXTAUTH_URL = "https://home.example.test";
  await prisma.customer.update({
    where: { id: f.customer.id },
    data: { email: "customer@example.test", mobile: "+12025550123" },
  });
  await providerSettings(f.a, {
    provider: "resend",
    secret: "fixture-resend-key",
    config: {
      from: "office@example.test",
      webhookSecret:
        "whsec_" + Buffer.from("fixture-signing-key").toString("base64"),
    },
    enabled: true,
  });
  async function draft(channel = "EMAIL") {
    const input = {
      customerId: f.customer.id,
      channel,
      body: "Fictional service update",
      subject: "Fixture only",
      scheduledAt: new Date(Date.now() - 1000).toISOString(),
      contactAuthorized: true,
      requestKey: crypto.randomUUID(),
    };
    const d = (await messages(f.a, input)) as unknown as {
      id: string;
      version: number;
    };
    await messages(f.a, { id: d.id, version: d.version }, "approve");
    return d;
  }
  const d = await draft();
  let calls = 0;
  const provider: typeof fetch = async (_url, init) => {
    calls++;
    assert.match(JSON.stringify(init?.headers), /Idempotency-Key/);
    assert.equal(JSON.parse(String(init?.body)).to[0], "customer@example.test");
    await recordDeliveryEvidence(
      f.company.id,
      "resend",
      "event-early",
      "receipt-test",
      "DELIVERED",
    );
    return Response.json({ id: "receipt-test" });
  };
  const sent = await dispatchDelivery(f.a, d.id, provider);
  assert.equal(sent.status, "DELIVERED");
  assert.equal(calls, 1);
  await recordDeliveryEvidence(
    f.company.id,
    "resend",
    "event-late",
    "receipt-test",
    "SENT",
  );
  assert.equal(
    (await prisma.delivery.findUniqueOrThrow({ where: { id: d.id } })).status,
    "DELIVERED",
  );
  await rejects(dispatchDelivery(f.a, d.id, provider), /approved, due/);
  assert.equal(calls, 1);
  const uncertain = await draft();
  await dispatchDelivery(f.a, uncertain.id, async () => {
    throw Error("fixture connection reset");
  });
  assert.equal(
    (await prisma.delivery.findUniqueOrThrow({ where: { id: uncertain.id } }))
      .status,
    "UNKNOWN",
  );
  await rejects(dispatchDelivery(f.a, uncertain.id, provider), /approved, due/);
  const opted = await draft();
  await prisma.customer.update({
    where: { id: f.customer.id },
    data: { doNotEmail: true },
  });
  await rejects(dispatchDelivery(f.a, opted.id, provider), /opted out/);
  assert.equal(calls, 1);
  const twilio = await import("twilio");
  const sid = "AC" + "1".repeat(32),
    token = "fixture-twilio-auth";
  await providerSettings(f.a, {
    provider: "twilio",
    secret: token,
    config: { accountSid: sid, from: "+12025550124" },
    enabled: true,
  });
  const sms = await draft("SMS");
  await dispatchDelivery(f.a, sms.id, async (url, init) => {
    assert.match(String(url), /api.twilio.com/);
    assert.match(String(init?.body), /StatusCallback=/);
    return Response.json({ sid: "SM" + "2".repeat(32) });
  });
  const callback =
      await import("../../src/app/api/integrations/messages/[companyId]/[provider]/route"),
    { NextRequest } = await import("next/server"),
    url = `https://home.example.test/api/integrations/messages/${f.company.id}/twilio`,
    params = {
      AccountSid: sid,
      MessageSid: "SM" + "2".repeat(32),
      MessageStatus: "delivered",
    },
    signature = twilio.default.getExpectedTwilioSignature(token, url, params),
    context = {
      params: Promise.resolve({ companyId: f.company.id, provider: "twilio" }),
    };
  const bad = await callback.POST(
    new NextRequest(url, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-twilio-signature": "forged",
      },
      body: new URLSearchParams(params),
    }),
    context,
  );
  assert.equal(bad.status, 403);
  for (let i = 0; i < 2; i++) {
    const result = await callback.POST(
      new NextRequest(url, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-twilio-signature": signature,
        },
        body: new URLSearchParams(params),
      }),
      context,
    );
    assert.equal(result.status, 200);
  }
  assert.equal(
    (await prisma.delivery.findUniqueOrThrow({ where: { id: sms.id } })).status,
    "DELIVERED",
  );
});

test("AI requests persist evidence, receipts and actual cost; retries do not call twice; review is version-bound and budget guarded", async () => {
  const { runAssistant, reviewAssistant } =
      await import("../../src/lib/workflows/ai"),
    { digest, reserveAssistant, cancelAssistant } =
      await import("../../src/lib/workflows/assistant-requests");
  const f = await fixture(),
    other = await fixture(),
    job = await f.job();
  process.env.OPENROUTER_API_KEY = "fixture-ai-key";
  process.env.AI_WORKSPACE_DAILY_BUDGET_CENTS = "500";
  process.env.AI_WORKSPACE_RESERVE_CENTS = "100";
  await assign(f.a, { jobId: job.id, technicianId: f.tech.id });
  const input = {
    jobId: job.id,
    notes: "Use recorded work only",
    consent: true,
    requestKey: crypto.randomUUID(),
  };
  let calls = 0;
  const provider: typeof fetch = async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.provider.data_collection, "deny");
    assert.equal(body.max_tokens, 2500);
    return Response.json({
      id: "fixture-ai-receipt",
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Job is scheduled; work completion is not recorded.",
              draft: "Confirm the actual work before using this draft.",
              recommendations: [
                { text: "Review the scheduled scope.", sourceIds: [job.id] },
              ],
              uncertainties: ["Completion has not been recorded."],
            }),
          },
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 50, cost: 0.002 },
    });
  };
  const result = await runAssistant(f.a, "job-summary", input, provider),
    replayed = await runAssistant(f.a, "job-summary", input, provider);
  assert.equal(result.id, replayed.id);
  assert.equal(calls, 1);
  await rejects(
    runAssistant(f.a, "job-summary", { ...input, notes: "Changed" }, provider),
    /different AI request/,
  );
  const stored = await prisma.aIResult.findUniqueOrThrow({
    where: { id: result.id },
  });
  assert.equal(stored.costUsd?.toFixed(6), "0.002000");
  assert.equal(stored.providerReceipt, "fixture-ai-receipt");
  assert.ok(JSON.stringify(stored.input).includes(job.id));
  await rejects(
    reviewAssistant(other.a, { id: stored.id, reviewedText: "No access" }),
    /not found/,
  );
  await rejects(
    reviewAssistant(f.a, {
      id: stored.id,
      expectedHash: "stale",
      reviewedText: "Reviewed",
    }),
    /changed/,
  );
  await reviewAssistant(f.a, {
    id: stored.id,
    expectedHash: digest({ input: stored.input, output: stored.output }),
    reviewedText: "Office reviewed the draft; completion remains unverified.",
  });
  await rejects(
    reviewAssistant(f.a, {
      id: stored.id,
      expectedHash: digest({ input: stored.input, output: stored.output }),
      reviewedText: "Replace",
    }),
    /already has/,
  );
  await rejects(
    runAssistant(
      f.a,
      "job-summary",
      { ...input, requestKey: crypto.randomUUID() },
      async () =>
        Response.json({
          id: "bad-citation",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "Test",
                  draft: "",
                  recommendations: [
                    { text: "Invented source", sourceIds: [other.customer.id] },
                  ],
                  uncertainties: [],
                }),
              },
            },
          ],
        }),
    ),
    /outside/,
  );
  await rejects(
    runAssistant(
      f.a,
      "job-summary",
      { ...input, consent: false, requestKey: crypto.randomUUID() },
      provider,
    ),
    /authorization/,
  );
  const pending = await reserveAssistant(
    f.a,
    crypto.randomUUID(),
    "job-summary",
    "fixture",
    {},
  );
  await cancelAssistant(f.a, pending.request.id);
  assert.equal(
    (
      await prisma.assistantRequest.findUniqueOrThrow({
        where: { id: pending.request.id },
      })
    ).state,
    "CANCELLED",
  );
  process.env.AI_WORKSPACE_DAILY_BUDGET_CENTS = "1";
  await rejects(
    runAssistant(
      f.a,
      "job-summary",
      { ...input, requestKey: crypto.randomUUID() },
      provider,
    ),
    /budget/,
  );
  assert.equal(calls, 1);
  process.env.AI_WORKSPACE_DAILY_BUDGET_CENTS = "500";
  process.env.OPENROUTER_API_KEY = "";
});

test("reviewed invoices use exact totals, durable cash receipts, credits and bounded refunds", async () => {
  const { createInvoice, changeInvoice, recordPayment, invoiceTotals } =
      await import("../../src/lib/workflows/invoices"),
    { finance } = await import("../../src/lib/workflows/finance"),
    f = await fixture(),
    other = await fixture();
  assert.equal(
    invoiceTotals({
      lineItems: [
        {
          description: "Fractional work",
          quantity: "1.25",
          unitPrice: "10.01",
          totalPrice: 9999,
        },
      ],
      taxRate: "0.0825",
    }).totalAmount,
    13.54,
  );
  const body = {
      customerId: f.customer.id,
      lineItems: [
        {
          description: "Reviewed labor",
          quantity: "2",
          unitPrice: "50.00",
          totalPrice: 1,
        },
      ],
      taxRate: "0.1",
    },
    draft = await createInvoice(f.a, body);
  assert.equal(Number(draft.totalAmount), 110);
  await assert.rejects(
    () => createInvoice(f.a, { ...body, customerId: other.customer.id }),
    /not found/i,
  );
  await assert.rejects(
    () =>
      recordPayment(f.o, draft.id, {
        amount: "110",
        method: "CASH",
        receivedConfirmed: true,
      }),
    /reviewed/i,
  );
  await assert.rejects(
    () =>
      changeInvoice(f.o, draft.id, {
        action: "issue",
        version: 1,
        reviewConfirmed: true,
      }),
    /manager/i,
  );
  await changeInvoice(f.a, draft.id, {
    action: "issue",
    version: 1,
    reviewConfirmed: true,
  });
  await assert.rejects(
    () =>
      changeInvoice(f.a, draft.id, {
        action: "edit",
        version: 1,
        notes: "stale",
      }),
    /changed/i,
  );
  await assert.rejects(
    () =>
      recordPayment(f.a, draft.id, {
        amount: "110",
        method: "CREDIT_CARD",
        receivedConfirmed: true,
      }),
    /provider/i,
  );
  const key = crypto.randomUUID(),
    input = { amount: "60", method: "CASH", receivedConfirmed: true },
    pay = () =>
      withReceipt(f.a, key, "test.payment", input, () =>
        recordPayment(f.a, draft.id, input),
      ),
    paid: any = await pay();
  assert.equal(((await pay()) as any).id, paid.id);
  assert.equal(
    await prisma.payment.count({ where: { invoiceId: draft.id } }),
    1,
  );
  await assert.rejects(
    () => recordPayment(f.a, draft.id, { ...input, amount: "51" }),
    /exceeds/i,
  );
  const row = await prisma.invoice.findUniqueOrThrow({
    where: { id: draft.id },
  });
  await changeInvoice(f.a, draft.id, {
    action: "credit",
    version: row.version,
    amount: "10",
    reason: "Scope reduced",
  });
  const refundInput = {
    requestKey: crypto.randomUUID(),
    paymentId: paid.id,
    amountCents: 2000,
    reason: "Returned service deposit",
    creditInvoice: true,
    cashReturnedConfirmed: true,
  };
  const refunded: any = await finance(f.a, refundInput, "refund");
  assert.equal(refunded.status, "SUCCEEDED");
  assert.equal(
    ((await finance(f.a, refundInput, "refund")) as any).id,
    refunded.id,
  );
  const after = await prisma.invoice.findUniqueOrThrow({
    where: { id: draft.id },
  });
  assert.equal(Number(after.paidAmount), 40);
  assert.equal(after.creditCents, 3000);
  assert.equal(Number(after.balanceDue), 40);
  await assert.rejects(
    () => finance(f.a, { ...refundInput, amountCents: 1 }, "refund"),
    /different/i,
  );
  await assert.rejects(
    () =>
      finance(
        f.a,
        { ...refundInput, requestKey: crypto.randomUUID(), amountCents: 4001 },
        "refund",
      ),
    /exceeds/i,
  );
  await assert.rejects(
    () =>
      prisma.invoiceCredit.updateMany({
        where: { invoiceId: draft.id },
        data: { reason: "rewrite" },
      }),
    /append-only/i,
  );
  assert.equal(
    validateAuditChain(
      await prisma.auditEvent.findMany({
        where: { companyId: f.company.id },
        orderBy: { createdAt: "asc" },
      }),
    ),
    true,
  );
});

test("Stripe fixtures reconcile exact receipts once, retain unknown outcomes, and validate signed callbacks", async () => {
  const { createInvoice, changeInvoice, recordPayment } =
      await import("../../src/lib/workflows/invoices"),
    { checkout, applyCheckout, finance, applyProviderRefund } =
      await import("../../src/lib/workflows/finance"),
    f = await fixture();
  const draft = await createInvoice(f.a, {
    customerId: f.customer.id,
    lineItems: [{ description: "Repair", quantity: 1, unitPrice: "100" }],
    taxRate: 0,
  });
  await changeInvoice(f.a, draft.id, {
    action: "issue",
    version: 1,
    reviewConfirmed: true,
  });
  let creates = 0,
    session: any;
  const fake: any = {
    checkout: {
      sessions: {
        create: async (input: any, opts: any) => {
          creates++;
          assert.match(opts.idempotencyKey, /^checkout-/);
          session = {
            id: "cs_test_" + crypto.randomUUID(),
            status: "open",
            url: "https://checkout.stripe.com/c/pay/test",
            metadata: input.metadata,
            client_reference_id: input.client_reference_id,
            payment_status: "unpaid",
            currency: "usd",
            amount_total: 10000,
            payment_intent: "pi_" + crypto.randomUUID(),
          };
          return session;
        },
        retrieve: async () => session,
      },
    },
    refunds: {
      create: async (input: any) => ({
        id: "re_" + crypto.randomUUID(),
        amount: input.amount,
        currency: "usd",
        payment_intent: input.payment_intent,
        metadata: input.metadata,
        status: "succeeded",
      }),
    },
  };
  const factory = async () => fake,
    key = crypto.randomUUID();
  await checkout(
    f.a,
    f.customer.id,
    { invoiceId: draft.id, requestKey: key },
    factory,
  );
  await checkout(
    f.a,
    f.customer.id,
    { invoiceId: draft.id, requestKey: key },
    factory,
  );
  assert.equal(creates, 1);
  await assert.rejects(
    () =>
      recordPayment(f.a, draft.id, {
        amount: 1,
        method: "CASH",
        receivedConfirmed: true,
      }),
    /checkout/i,
  );
  await assert.rejects(
    () =>
      applyCheckout(f.a, {
        ...session,
        payment_status: "paid",
        amount_total: 9999,
      }),
    /amount/i,
  );
  await assert.rejects(
    () =>
      applyCheckout(f.a, {
        ...session,
        payment_status: "paid",
        client_reference_id: "other",
      }),
    /identity/i,
  );
  session = { ...session, status: "complete", payment_status: "paid" };
  await Promise.all([applyCheckout(f.a, session), applyCheckout(f.a, session)]);
  assert.equal(
    await prisma.payment.count({ where: { invoiceId: draft.id } }),
    1,
  );
  const payment = await prisma.payment.findFirstOrThrow({
    where: { invoiceId: draft.id },
  });
  await assert.rejects(()=>prisma.payment.update({where:{id:payment.id},data:{amount:1}}),/append-only/i);
  assert.equal(payment.source, "STRIPE");
  assert.ok(payment.verifiedAt);
  const refund: any = await finance(
    f.a,
    {
      requestKey: crypto.randomUUID(),
      paymentId: payment.id,
      amountCents: 2500,
      reason: "Partial return",
      creditInvoice: false,
    },
    "refund",
    factory,
  );
  assert.equal(refund.status, "SUCCEEDED");
  let after = await prisma.invoice.findUniqueOrThrow({
    where: { id: draft.id },
  });
  assert.equal(Number(after.balanceDue), 25);
  await assert.rejects(
    () =>
      applyProviderRefund(f.a, {
        id: refund.providerId,
        metadata: { companyId: f.company.id, refundId: refund.id },
        amount: 2501,
        currency: "usd",
        payment_intent: payment.stripePaymentId,
        status: "succeeded",
      } as any),
    /amount/i,
  );
  // Verify real SDK signature parsing on the HTTP callback with fixture receipts.
  const { providerSettings } =
    await import("../../src/lib/workflows/providers");
  process.env.INTEGRATION_ENCRYPTION_KEY =
    process.env.INTEGRATION_ENCRYPTION_KEY || "12".repeat(32);
  const secret = "whsec_fixture_only";
  await providerSettings(f.a, {
    provider: "stripe",
    config: { webhookSecret: secret },
    secret: "sk_test_fixture_only",
    enabled: true,
  });
  const Stripe = (await import("stripe")).default,
    stripe = new Stripe("sk_test_fixture_only"),
    { POST } =
      await import("../../src/app/api/integrations/stripe/[companyId]/route"),
    { NextRequest } = await import("next/server");
  const event = {
      id: "evt_" + crypto.randomUUID(),
      object: "event",
      type: "checkout.session.completed",
      data: { object: session },
    },
    payload = JSON.stringify(event),
    signature = stripe.webhooks.generateTestHeaderString({ payload, secret }),
    invoke = (sig: string) =>
      POST(
        new NextRequest(
          "http://localhost/api/integrations/stripe/" + f.company.id,
          {
            method: "POST",
            headers: { "stripe-signature": sig },
            body: payload,
          },
        ),
        { params: Promise.resolve({ companyId: f.company.id }) },
      );
  assert.equal((await invoke("forged")).status, 400);
  assert.equal((await invoke(signature)).status, 200);
  assert.equal((await invoke(signature)).status, 200);
  assert.equal(
    await prisma.payment.count({ where: { invoiceId: draft.id } }),
    1,
  );
  const unknownDraft = await createInvoice(f.a, {
    customerId: f.customer.id,
    lineItems: [{ description: "Second repair", quantity: 1, unitPrice: 10 }],
    taxRate: 0,
  });
  await changeInvoice(f.a, unknownDraft.id, {
    action: "issue",
    version: 1,
    reviewConfirmed: true,
  });
  await assert.rejects(
    () =>
      checkout(
        f.a,
        f.customer.id,
        { invoiceId: unknownDraft.id, requestKey: crypto.randomUUID() },
        async () =>
          ({
            checkout: {
              sessions: {
                create: async () => {
                  throw Error("fixture timeout");
                },
              },
            },
          }) as any,
      ),
    /timeout/,
  );
  assert.equal(
    (
      await prisma.paymentCheckout.findFirstOrThrow({
        where: { invoiceId: unknownDraft.id },
      })
    ).status,
    "UNKNOWN",
  );
});
