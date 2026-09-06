import crypto from "node:crypto";
import { Prisma, JobStatus, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isValidJobTransition,
  type AuthContext,
} from "@/lib/operations-governance";
import {
  audit,
  date,
  fail,
  integer,
  jobFor,
  json,
  object,
  office,
  text,
  txFor,
  version,
} from "./core";
import { checkAvailability, timeRange } from "./scheduling";
import { mediaInput } from "./ai";
export async function updateJob(
  user: AuthContext,
  id: string,
  body: Record<string, unknown>,
) {
  return txFor(user, async (tx) => {
    const job = await jobFor(tx, user, id);
    if (body.updatedAt && body.updatedAt !== job.updatedAt.toISOString())
      fail("Job changed. Reload before saving.", 409);
    if (
      user.role === "TECHNICIAN" &&
      Object.keys(body).some(
        (k) =>
          ![
            "status",
            "workPerformed",
            "customerSignature",
            "updatedAt",
          ].includes(k),
      )
    )
      fail("Technicians may update assigned execution fields only", 403);
    const status =
      body.status === undefined ? job.status : text(body.status, "status", 30);
    if (!isValidJobTransition(job.status, status))
      fail(`Invalid transition from ${job.status} to ${status}`, 409);
    if (
      user.role === "TECHNICIAN" &&
      body.status &&
      !["EN_ROUTE", "IN_PROGRESS", "ON_HOLD", "COMPLETED"].includes(status)
    )
      fail("Office status change required", 403);
    const data: Prisma.JobUpdateInput = {};
    for (const key of [
      "title",
      "description",
      "workPerformed",
      "timeWindowStart",
      "timeWindowEnd",
    ] as const)
      if (body[key] !== undefined)
        data[key] = text(
          body[key],
          key,
          key === "workPerformed" || key === "description" ? 20000 : 200,
          key === "title",
        );
    if (body.priority !== undefined) {
      if (!Object.values(Priority).includes(body.priority as Priority))
        fail("Invalid priority");
      data.priority = body.priority as Priority;
    }
    if (body.estimatedDuration !== undefined)
      data.estimatedDuration = integer(
        body.estimatedDuration,
        "duration",
        1,
        1440,
      );
    if (body.customerSignature !== undefined) {
      const sig = text(body.customerSignature, "signature", 1400000);
      mediaInput(sig, "image");
      data.customerSignature = sig;
    }
    if (
      ["COMPLETED", "INVOICED", "CANCELLED"].includes(job.status) &&
      Object.keys(data).length
    )
      fail("Closed job evidence is retained unchanged", 409);
    if (body.scheduledStart !== undefined || body.scheduledEnd !== undefined) {
      office(user);
      if (
        !["PENDING", "SCHEDULED", "DISPATCHED", "ON_HOLD"].includes(job.status)
      )
        fail("This job cannot be rescheduled", 409);
      const range = timeRange(
        body.scheduledStart ?? job.scheduledStart?.toISOString(),
        body.scheduledEnd ?? job.scheduledEnd?.toISOString(),
      );
      if (range.start < new Date()) fail("Choose a future appointment");
      for (const a of job.assignments)
        await checkAvailability(
          tx,
          user,
          a.technicianId,
          range.start,
          range.end,
          job.tradeType,
          id,
        );
      data.scheduledStart = range.start;
      data.scheduledEnd = range.end;
      await tx.bookingRequest.updateMany({
        where: { jobId: id, companyId: user.companyId, status: "CONFIRMED" },
        data: {
          startAt: range.start,
          endAt: range.end,
          version: { increment: 1 },
        },
      });
    }
    if (status !== job.status) {
      if (
        ["EN_ROUTE", "IN_PROGRESS", "DISPATCHED", "COMPLETED"].includes(
          status,
        ) &&
        !job.assignments.length
      )
        fail("Assign a technician first", 409);
      if (status === "IN_PROGRESS" && !job.actualStart)
        data.actualStart = new Date();
      if (
        ["COMPLETED", "CANCELLED"].includes(status) &&
        (await tx.timeEntry.count({ where: { jobId: id, endTime: null } }))
      )
        fail("Stop all job timers before closing the job", 409);
      if (status === "COMPLETED") {
        const work = body.workPerformed ?? job.workPerformed,
          signature = body.customerSignature ?? job.customerSignature;
        if (text(work, "work performed", 20000).length < 10)
          fail("Describe the actual work performed");
        mediaInput(signature, "image");
        const checklist = await tx.jobChecklist.findUnique({
          where: { jobId: id },
        });
        if (
          !checklist ||
          !Array.isArray(checklist.items) ||
          !checklist.items.length ||
          checklist.items.some((v) => !object(v).checked)
        )
          fail("Complete the job checklist before completion", 409);
        data.actualEnd = new Date();
        data.completedAt = new Date();
        await tx.bookingRequest.updateMany({
          where: { jobId: id },
          data: { status: "COMPLETED", version: { increment: 1 } },
        });
        if (job.propertyId)
          await tx.serviceHistory.create({
            data: {
              propertyId: job.propertyId,
              jobId: id,
              type: job.type,
              description: String(work),
              date: new Date(),
            },
          });
      }
      if (status === "CANCELLED") {
        text(body.reason, "cancellation reason", 2000);
        await tx.bookingRequest.updateMany({
          where: { jobId: id },
          data: { status: "CANCELLED", version: { increment: 1 } },
        });
      }
      if (status === "INVOICED") {
        office(user);
        if (
          !(await tx.invoice.findFirst({
            where: {
              jobId: id,
              customer: { companyId: user.companyId },
              status: { not: "VOID" },
            },
          }))
        )
          fail("Create an invoice for this job first", 409);
      }
      data.status = status as JobStatus;
    }
    const saved = await tx.job.update({ where: { id }, data });
    await audit(tx, user, "JOB_UPDATED", "Job", id, {
      from: job.status,
      to: status,
      fields: Object.keys(data),
      reason: body.reason || null,
    });
    return saved;
  });
}
export async function execution(
  user: AuthContext,
  jobId: string,
  body?: Record<string, unknown>,
  action?: string,
) {
  if (!body) {
    await jobFor(prisma, user, jobId);
    const [checklist, photos, parts, time] = await Promise.all([
      prisma.jobChecklist.findUnique({ where: { jobId } }),
      prisma.jobPhoto.findMany({
        where: { jobId },
        select: {
          id: true,
          type: true,
          caption: true,
          takenAt: true,
          mediaType: true,
          contentHash: true,
        },
        orderBy: { takenAt: "desc" },
      }),
      prisma.jobPart.findMany({
        where: { jobId },
        include: { part: { select: { name: true, partNumber: true } } },
      }),
      prisma.timeEntry.findMany({
        where: { jobId },
        orderBy: { startTime: "desc" },
      }),
    ]);
    return { checklist, photos, parts, time };
  }
  return txFor(user, async (tx) => {
    const job = await jobFor(tx, user, jobId);
    if (["COMPLETED", "INVOICED", "CANCELLED"].includes(job.status))
      fail("Closed job evidence cannot be edited", 409);
    if (action === "checklist") {
      const current = await tx.jobChecklist.findUnique({ where: { jobId } });
      if (current && current.version !== version(body.version))
        fail("Checklist changed; reload", 409);
      if (
        !Array.isArray(body.items) ||
        body.items.length < 1 ||
        body.items.length > 100
      )
        fail("Use 1–100 checklist items");
      const items = (body.items as unknown[]).map((v) => {
        const r = object(v);
        if (typeof r.checked !== "boolean") fail("Invalid checklist state");
        return {
          id: text(r.id, "item ID", 100),
          label: text(r.label, "checklist item", 300),
          checked: r.checked,
          notes: text(r.notes, "evidence note", 2000, false),
        };
      });
      if (new Set(items.map((i) => i.id)).size !== items.length)
        fail("Duplicate checklist item");
      if (user.role === "TECHNICIAN" && current) {
        const old = current.items as { id: string; label: string }[];
        if (
          old.length !== items.length ||
          old.some(
            (i) => !items.some((n) => n.id === i.id && n.label === i.label),
          )
        )
          fail("The office must change checklist requirements", 403);
      }
      const saved = await tx.jobChecklist.upsert({
        where: { jobId },
        create: {
          jobId,
          companyId: user.companyId,
          items: json(items),
          updatedById: user.id,
        },
        update: {
          items: json(items),
          updatedById: user.id,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "JOB_CHECKLIST_SAVED", "Job", jobId, {
        version: saved.version,
      });
      return saved;
    }
    if (action === "photo") {
      if (body.consent !== true)
        fail("Confirm authorization to store this job photo");
      const media = mediaInput(body.media, "image"),
        kind = text(body.type, "photo type", 30);
      if (!["BEFORE", "DURING", "AFTER", "EQUIPMENT", "PROBLEM"].includes(kind))
        fail("Invalid photo type");
      if ((await tx.jobPhoto.count({ where: { jobId } })) >= 50)
        fail("Job photo limit reached");
      const bytes = Buffer.from(media.data, "base64"),
        digest = crypto.createHash("sha256").update(bytes).digest("hex");
      const saved = await tx.jobPhoto.create({
        data: {
          jobId,
          type: kind as "DURING",
          filePath: "private",
          bytes,
          mediaType: media.mime,
          contentHash: digest,
          actorId: user.id,
          caption: text(body.caption, "caption", 1000, false),
        },
        select: { id: true, type: true, caption: true, contentHash: true },
      });
      await audit(tx, user, "JOB_PHOTO_STORED", "Job", jobId, {
        photoId: saved.id,
        contentHash: digest,
      });
      return saved;
    }
    fail("Unknown job execution action");
  });
}

export async function createJob(
  user: AuthContext,
  body: Record<string, unknown>,
) {
  office(user);
  return txFor(user, async (tx) => {
    const { JobType, TradeType, Priority } = await import("@prisma/client");
    const customerId = text(body.customerId, "customer", 100),
      customer = await tx.customer.findFirst({
        where: { id: customerId, companyId: user.companyId },
      });
    if (!customer) fail("Customer not found", 404);
    if (["DO_NOT_SERVICE", "INACTIVE"].includes(customer.status))
      fail("Customer is not available for service", 409);
    const propertyId = text(body.propertyId, "property", 100, false) || null,
      serviceTypeId =
        text(body.serviceTypeId, "service type", 100, false) || null;
    if (
      propertyId &&
      !(await tx.property.findFirst({ where: { id: propertyId, customerId } }))
    )
      fail("Property is outside this customer", 404);
    const service = serviceTypeId
      ? await tx.serviceType.findFirst({
          where: {
            id: serviceTypeId,
            companyId: user.companyId,
            isActive: true,
          },
        })
      : null;
    if (serviceTypeId && !service) fail("Service type not found", 404);
    const tradeType = text(body.tradeType || service?.tradeType, "trade", 20),
      rawType = body.type || body.jobType || "SERVICE_CALL",
      type = rawType === "SERVICE" ? "SERVICE_CALL" : String(rawType),
      priority =
        body.priority === "URGENT" ? "HIGH" : String(body.priority || "NORMAL");
    if (
      !Object.values(TradeType).includes(tradeType as never) ||
      !Object.values(JobType).includes(type as never) ||
      !Object.values(Priority).includes(priority as never)
    )
      fail("Invalid job trade, type or priority");
    if (service && service.tradeType !== tradeType)
      fail("Trade must match the selected service type");
    if (body.status && !["PENDING", "SCHEDULED"].includes(String(body.status)))
      fail("New jobs must begin pending or scheduled");
    const duration = integer(
        body.estimatedDuration || service?.defaultDuration || 60,
        "duration",
        1,
        1440,
      ),
      start = body.scheduledStart ? date(body.scheduledStart) : null,
      end = body.scheduledEnd
        ? date(body.scheduledEnd)
        : start
          ? new Date(start.getTime() + duration * 60000)
          : null;
    if (start) {
      if (start < new Date()) fail("Choose a future appointment");
      timeRange(start.toISOString(), end!.toISOString());
    }
    if (body.status === "SCHEDULED" && !start)
      fail("A scheduled job needs a time window");
    const job = await tx.job.create({
      data: {
        companyId: user.companyId,
        customerId,
        propertyId,
        serviceTypeId,
        createdById: user.id,
        jobNumber: `JOB-${crypto.randomUUID()}`,
        tradeType: tradeType as "HVAC",
        type: type as "SERVICE_CALL",
        priority: priority as "NORMAL",
        status: (body.status as "PENDING") || "PENDING",
        title: text(body.title, "title", 200),
        description: text(body.description, "description", 20000, false),
        scheduledStart: start,
        scheduledEnd: end,
        estimatedDuration: duration,
        timeWindowStart: text(body.timeWindowStart, "window start", 100, false),
        timeWindowEnd: text(body.timeWindowEnd, "window end", 100, false),
        customerPO: text(body.customerPO, "customer reference", 200, false),
        source: text(body.source, "source", 200, false),
        notes: text(body.notes, "notes", 20000, false),
        tags: Array.isArray(body.tags)
          ? body.tags.slice(0, 30).map((v) => text(v, "tag", 100))
          : [],
      },
    });
    await tx.jobChecklist.create({
      data: {
        jobId: job.id,
        companyId: user.companyId,
        updatedById: user.id,
        items: [
          {
            id: "scope",
            label: "Record the agreed work scope",
            checked: false,
            notes: "",
          },
          {
            id: "work",
            label: "Record the work actually performed",
            checked: false,
            notes: "",
          },
          {
            id: "handover",
            label: "Review completed work with the customer",
            checked: false,
            notes: "",
          },
        ],
      },
    });
    await audit(tx, user, "JOB_CREATED", "Job", job.id, {
      customerId,
      propertyId,
    });
    return job;
  });
}
