import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  date,
  fail,
  jobFor,
  office,
  text,
  txFor,
  version,
} from "./core";

export async function timesheets(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
) {
  if (!body)
    return prisma.timeEntry.findMany({
      where: {
        job: { companyId: user.companyId },
        ...(user.role === "TECHNICIAN"
          ? { technicianId: user.technicianId || "none" }
          : {}),
      },
      include: {
        job: { select: { title: true, jobNumber: true } },
        technician: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { startTime: "desc" },
      take: 1000,
    });
  return txFor(user, async (tx) => {
    if (action === "start" || action === "manual") {
      const job = await jobFor(tx, user, text(body.jobId, "job", 100));
      if (["CANCELLED", "INVOICED"].includes(job.status))
        fail("This job is closed");
      const technicianId =
        user.role === "TECHNICIAN"
          ? user.technicianId
          : text(body.technicianId, "technician", 100);
      if (
        !technicianId ||
        !job.assignments.some((a) => a.technicianId === technicianId)
      )
        return fail("Technician must be assigned to the job", 403);
      const start =
          action === "start" ? new Date() : date(body.startTime, "start time"),
        end = action === "manual" ? date(body.endTime, "end time") : null;
      if (
        start > new Date() ||
        (end &&
          (end <= start ||
            end > new Date() ||
            end.getTime() - start.getTime() > 86400000))
      )
        fail(
          "Invalid time range; entries must be in the past and at most 24 hours",
        );
      const existing = await tx.timeEntry.findFirst({
        where: {
          technicianId,
          startTime: { lt: end || new Date("9999-01-01") },
          OR: [{ endTime: null }, { endTime: { gt: start } }],
        },
      });
      if (existing)
        fail("This technician already has an overlapping time entry", 409);
      const type = text(body.type || "WORK", "time type", 20);
      if (!["WORK", "TRAVEL", "BREAK"].includes(type))
        fail("Invalid time type");
      const entry = await tx.timeEntry.create({
        data: {
          jobId: job.id,
          technicianId,
          type: type as "WORK",
          startTime: start,
          endTime: end,
          duration: end
            ? Math.round((end.getTime() - start.getTime()) / 60000)
            : null,
          notes: text(body.notes, "notes", 2000, false),
          approvalStatus: end ? "SUBMITTED" : "DRAFT",
        },
      });
      await audit(tx, user, "TIME_STARTED", "TimeEntry", entry.id, {
        jobId: job.id,
      });
      return entry;
    }
    const entry = await tx.timeEntry.findFirst({
      where: {
        id: text(body.id, "entry", 100),
        job: { companyId: user.companyId },
      },
    });
    if (!entry) return fail("Time entry not found", 404);
    if (user.role === "TECHNICIAN" && entry.technicianId !== user.technicianId)
      fail("Time entry not found", 404);
    if (entry.version !== version(body.version))
      fail("Time entry changed. Reload before saving.", 409);
    if (action === "correct") {
      office(user);
      if (entry.approvalStatus === "APPROVED")
        fail("Approved time is immutable", 409);
      const start = date(body.startTime),
        end = date(body.endTime);
      if (
        end <= start ||
        end > new Date() ||
        end.getTime() - start.getTime() > 86400000
      )
        fail("Correction must be a past interval of at most 24 hours");
      if (
        await tx.timeEntry.findFirst({
          where: {
            id: { not: entry.id },
            technicianId: entry.technicianId,
            startTime: { lt: end },
            OR: [{ endTime: null }, { endTime: { gt: start } }],
          },
        })
      )
        fail("Correction overlaps another time entry", 409);
      const saved = await tx.timeEntry.update({
        where: { id: entry.id },
        data: {
          startTime: start,
          endTime: end,
          duration: Math.round((end.getTime() - start.getTime()) / 60000),
          approvalStatus: "SUBMITTED",
          reviewedAt: null,
          reviewedById: null,
          reviewNote: null,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "TIME_CORRECTED", "TimeEntry", entry.id, {
        reason: text(body.reason, "correction reason", 2000),
        previousStart: entry.startTime,
        previousEnd: entry.endTime,
        start,
        end,
      });
      return saved;
    }
    if (action === "stop") {
      if (entry.endTime) fail("Time entry is already stopped", 409);
      const end = new Date(),
        duration = Math.round(
          (end.getTime() - entry.startTime.getTime()) / 60000,
        );
      if (duration > 1440)
        fail("Timer exceeds 24 hours; an office correction is required", 409);
      const saved = await tx.timeEntry.update({
        where: { id: entry.id },
        data: {
          endTime: end,
          duration,
          approvalStatus: "SUBMITTED",
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "TIME_STOPPED", "TimeEntry", entry.id, {
        duration,
      });
      return saved;
    }
    office(user);
    if (!["approve", "reject"].includes(action || ""))
      fail("Unknown timesheet action");
    if (!entry.endTime) fail("Stop the timer before reviewing it");
    if (entry.approvalStatus === "APPROVED")
      fail("Approved time entries are retained unchanged", 409);
    if (
      entry.technicianId &&
      (await tx.technician.findFirst({
        where: { id: entry.technicianId, userId: user.id },
      }))
    )
      fail("Another office user must approve your timesheet", 403);
    const saved = await tx.timeEntry.update({
      where: { id: entry.id },
      data: {
        approvalStatus: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedById: user.id,
        reviewNote: text(
          body.reviewNote,
          "review note",
          2000,
          action === "reject",
        ),
        version: { increment: 1 },
      },
    });
    await audit(tx, user, "TIME_REVIEWED", "TimeEntry", entry.id, {
      status: saved.approvalStatus,
    });
    return saved;
  });
}
