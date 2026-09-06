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
  office,
  text,
  txFor,
  version,
} from "./core";

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}
export function timeRange(start: unknown, end: unknown) {
  const a = date(start, "start time"),
    b = date(end, "end time");
  if (
    b.getTime() - a.getTime() < 60000 ||
    b.getTime() - a.getTime() > 24 * 3600000
  )
    fail("Appointment must last between 1 minute and 24 hours");
  return { start: a, end: b };
}
export async function checkAvailability(
  tx: Prisma.TransactionClient,
  user: AuthContext,
  technicianId: string,
  start: Date,
  end: Date,
  tradeType: string,
  excludeJobId?: string,
) {
  const tech = await tx.technician.findFirst({
    where: {
      id: technicianId,
      user: { companyId: user.companyId, isActive: true },
    },
    include: { schedules: true },
  });
  if (!tech) return fail("Technician not found", 404);
  if (
    !tech.tradeTypes.includes(tradeType as never) &&
    !tech.tradeTypes.includes("GENERAL")
  )
    fail("Technician does not have the required trade");
  const company = await tx.company.findUniqueOrThrow({
    where: { id: user.companyId },
  });
  const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: company.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (k: string) => p.find((v) => v.type === k)?.value || "";
    return {
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
        get("weekday"),
      ),
      time: `${get("hour")}:${get("minute")}`,
      date: `${get("year")}-${get("month")}-${get("day")}`,
    };
  };
  const a = parts(start),
    b = parts(end),
    schedule = tech.schedules.find((s) => s.dayOfWeek === a.day);
  if (
    !schedule ||
    !schedule.isWorking ||
    a.date !== b.date ||
    a.time < schedule.startTime ||
    b.time > schedule.endTime
  )
    fail("Time is outside the technician’s working hours", 409);
  if (
    await tx.technicianTimeOff.count({
      where: {
        technicianId,
        companyId: user.companyId,
        startAt: { lt: end },
        endAt: { gt: start },
      },
    })
  )
    fail("Technician is on leave during this window", 409);
  const conflict = await tx.job.findFirst({
    where: {
      companyId: user.companyId,
      ...(excludeJobId ? { id: { not: excludeJobId } } : {}),
      status: { notIn: ["CANCELLED", "COMPLETED", "INVOICED"] },
      assignments: { some: { technicianId } },
      scheduledStart: { lt: end },
      OR: [{ scheduledEnd: { gt: start } }, { scheduledEnd: null }],
    },
  });
  if (conflict) fail("Technician already has a job in this time window", 409);
  return tech;
}
export async function bookings(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
  portalCustomerId?: string,
) {
  if (!portalCustomerId) office(user);
  if (!body)
    return prisma.bookingRequest.findMany({
      where: {
        companyId: user.companyId,
        ...(portalCustomerId ? { customerId: portalCustomerId } : {}),
      },
      orderBy: { startAt: "desc" },
      take: 500,
    });
  return txFor(user, async (tx) => {
    const current = body.id
      ? await tx.bookingRequest.findFirst({
          where: {
            id: String(body.id),
            companyId: user.companyId,
            ...(portalCustomerId ? { customerId: portalCustomerId } : {}),
          },
        })
      : null;
    if (body.id && !current) fail("Booking not found", 404);
    if (current && current.version !== version(body.version))
      fail("Booking changed. Reload before saving.", 409);
    if (current && ["CANCELLED", "COMPLETED"].includes(current.status))
      fail("This booking is closed", 409);
    if (action === "cancel" && current) {
      if (current.jobId) {
        const j = await tx.job.findUniqueOrThrow({
          where: { id: current.jobId },
        });
        if (["IN_PROGRESS", "COMPLETED", "INVOICED"].includes(j.status))
          fail("Contact the office to change work already in progress", 409);
        await tx.job.update({
          where: { id: j.id },
          data: { status: "CANCELLED" },
        });
      }
      const saved = await tx.bookingRequest.update({
        where: { id: current.id },
        data: {
          status: "CANCELLED",
          notes: text(body.notes, "cancellation reason", 2000),
          version: { increment: 1 },
        },
      });
      await audit(
        tx,
        user,
        "BOOKING_CANCELLED",
        "BookingRequest",
        saved.id,
        {},
      );
      return saved;
    }
    const customerId =
      portalCustomerId ||
      text(body.customerId ?? current?.customerId, "customer", 100);
    const customer = await customerFor(tx, user, customerId);
    if (customer.status === "DO_NOT_SERVICE")
      fail("Customer is marked do not service", 409);
    const service = await tx.serviceType.findFirst({
      where: {
        id: text(
          body.serviceTypeId ?? current?.serviceTypeId,
          "service type",
          100,
        ),
        companyId: user.companyId,
        isActive: true,
      },
    });
    if (!service) return fail("Service type not found", 404);
    const propertyId =
      text(body.propertyId ?? current?.propertyId, "property", 100, false) ||
      null;
    if (
      propertyId &&
      !(await tx.property.findFirst({ where: { id: propertyId, customerId } }))
    )
      fail("Property does not belong to this customer");
    const range = timeRange(
      body.startAt ?? current?.startAt.toISOString(),
      body.endAt ?? current?.endAt.toISOString(),
    );
    if (range.start < new Date()) fail("Choose a future appointment");
    const technicianId = portalCustomerId
      ? current?.technicianId || null
      : text(
          body.technicianId ?? current?.technicianId,
          "technician",
          100,
          false,
        ) || null;
    const confirming =
      !portalCustomerId &&
      (action === "confirm" || current?.status === "CONFIRMED");
    if (confirming && !technicianId)
      fail("Select a technician to confirm the booking");
    if (technicianId)
      await checkAvailability(
        tx,
        user,
        technicianId,
        range.start,
        range.end,
        service.tradeType,
        current?.jobId || undefined,
      );
    if (
      current?.jobId &&
      (customerId !== current.customerId ||
        propertyId !== current.propertyId ||
        service.id !== current.serviceTypeId)
    )
      fail(
        "Confirmed visit identity cannot be changed; cancel and create a new booking",
        409,
      );
    const payload = {
      customerId,
      propertyId,
      serviceTypeId: service.id,
      technicianId,
      title: text(body.title ?? current?.title ?? service.name, "title", 200),
      notes: text(body.notes ?? current?.notes, "notes", 4000, false),
      startAt: range.start,
      endAt: range.end,
      status: confirming ? "CONFIRMED" : "REQUESTED",
    };
    let jobId = current?.jobId || null;
    if (current?.jobId) {
      const j = await tx.job.findUniqueOrThrow({
        where: { id: current.jobId },
      });
      if (
        ["IN_PROGRESS", "COMPLETED", "INVOICED", "CANCELLED"].includes(j.status)
      )
        fail("Job is no longer available for rescheduling", 409);
      // Recheck every assigned technician when changing a shared job's window.
      const assigned = await tx.jobAssignment.findMany({
        where: { jobId: j.id },
      });
      for (const a of assigned)
        if (a.technicianId !== technicianId)
          await checkAvailability(
            tx,
            user,
            a.technicianId,
            range.start,
            range.end,
            service.tradeType,
            j.id,
          );
      if (portalCustomerId)
        fail("A confirmed visit must be rescheduled by the office", 409);
      await tx.job.update({
        where: { id: j.id },
        data: {
          scheduledStart: range.start,
          scheduledEnd: range.end,
          title: payload.title,
        },
      });
    } else if (confirming) {
      const j = await tx.job.create({
        data: {
          companyId: user.companyId,
          customerId,
          propertyId,
          serviceTypeId: service.id,
          tradeType: service.tradeType,
          createdById: user.id,
          jobNumber: `BOOK-${crypto.randomUUID()}`,
          title: payload.title,
          description: payload.notes,
          status: "SCHEDULED",
          scheduledStart: range.start,
          scheduledEnd: range.end,
          tags: [],
        },
      });
      jobId = j.id;
    }
    if (confirming && jobId && technicianId)
      await tx.jobAssignment.upsert({
        where: { jobId_technicianId: { jobId, technicianId } },
        update: {},
        create: { jobId, technicianId, isPrimary: !current?.jobId },
      });
    const saved = current
      ? await tx.bookingRequest.update({
          where: { id: current.id },
          data: { ...payload, jobId, version: { increment: 1 } },
        })
      : await tx.bookingRequest.create({
          data: {
            ...payload,
            jobId,
            companyId: user.companyId,
            createdById: user.id,
          },
        });
    await audit(
      tx,
      user,
      current ? "BOOKING_UPDATED" : "BOOKING_CREATED",
      "BookingRequest",
      saved.id,
      { status: saved.status, jobId },
    );
    return saved;
  });
}
export async function assign(user: AuthContext, body: Record<string, unknown>) {
  office(user);
  return txFor(user, async (tx) => {
    const job = await tx.job.findFirst({
      where: { id: text(body.jobId, "job", 100), companyId: user.companyId },
    });
    if (!job) return fail("Job not found", 404);
    if (body.updatedAt && body.updatedAt !== job.updatedAt.toISOString())
      fail("Job changed; reload", 409);
    if (!["PENDING", "SCHEDULED", "DISPATCHED", "ON_HOLD"].includes(job.status))
      fail("This job cannot be reassigned", 409);
    const start = body.startAt ? date(body.startAt) : job.scheduledStart,
      end = body.endAt ? date(body.endAt) : job.scheduledEnd;
    if (!start || !end || end <= start)
      fail("Set a valid appointment start and end first");
    if (start! < new Date() || end!.getTime() - start!.getTime() > 86400000)
      fail("Choose a future appointment of at most 24 hours");
    const existing = await tx.jobAssignment.findMany({
      where: { jobId: job.id },
    });
    for (const a of existing)
      await checkAvailability(
        tx,
        user,
        a.technicianId,
        start!,
        end!,
        job.tradeType,
        job.id,
      );
    const technicianId = text(body.technicianId, "technician", 100);
    const tech = await checkAvailability(
      tx,
      user,
      technicianId,
      start!,
      end!,
      job.tradeType,
      job.id,
    );
    const assignment = await tx.jobAssignment.upsert({
      where: { jobId_technicianId: { jobId: job.id, technicianId } },
      update: {},
      create: {
        jobId: job.id,
        technicianId,
        isPrimary: !(await tx.jobAssignment.count({
          where: { jobId: job.id },
        })),
      },
    });
    await tx.job.update({
      where: { id: job.id },
      data: {
        scheduledStart: start,
        scheduledEnd: end,
        status: job.status === "PENDING" ? "SCHEDULED" : job.status,
      },
    });
    await tx.bookingRequest.updateMany({
      where: { jobId: job.id, status: "CONFIRMED" },
      data: { startAt: start!, endAt: end!, version: { increment: 1 } },
    });
    await audit(tx, user, "JOB_ASSIGNED", "Job", job.id, {
      technicianId: tech.id,
    });
    return assignment;
  });
}
