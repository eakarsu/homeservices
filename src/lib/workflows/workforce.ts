import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  date,
  fail,
  integer,
  manager,
  object,
  office,
  text,
  txFor,
} from "./core";
export async function workforce(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
) {
  if (!body) {
    office(user);
    return {
      technicians: await prisma.technician.findMany({
        where: { user: { companyId: user.companyId } },
        select: {
          id: true,
          tradeTypes: true,
          truckId: true,
          status: true,
          schedules: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          updatedAt: true,
        },
      }),
      timeOff: await prisma.technicianTimeOff.findMany({
        where: {
          companyId: user.companyId,
          endAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        orderBy: { startAt: "asc" },
        take: 500,
      }),
    };
  }
  manager(user);
  return txFor(user, async (tx) => {
    const tech = await tx.technician.findFirst({
      where: {
        id: text(body.technicianId, "technician", 100),
        user: { companyId: user.companyId },
      },
    });
    if (!tech) return fail("Technician not found", 404);
    if (action === "remove-timeoff") {
      const row = await tx.technicianTimeOff.findFirst({
        where: {
          id: text(body.id, "time off", 100),
          companyId: user.companyId,
          technicianId: tech.id,
        },
      });
      if (!row) fail("Time off not found", 404);
      await tx.technicianTimeOff.delete({ where: { id: row!.id } });
      await audit(tx, user, "TIME_OFF_REMOVED", "Technician", tech.id, {
        reason: text(body.reason, "reason", 1000),
        timeOffId: row!.id,
      });
      return { removed: true };
    }
    if (action === "timeoff") {
      const start = date(body.startAt),
        end = date(body.endAt);
      if (end <= start || end.getTime() - start.getTime() > 366 * 86400000)
        fail("Invalid time-off range");
      if (
        await tx.job.count({
          where: {
            companyId: user.companyId,
            assignments: { some: { technicianId: tech.id } },
            status: { notIn: ["CANCELLED", "COMPLETED", "INVOICED"] },
            scheduledStart: { lt: end },
            OR: [{ scheduledEnd: { gt: start } }, { scheduledEnd: null }],
          },
        })
      )
        fail("Reassign conflicting jobs before adding time off", 409);
      const row = await tx.technicianTimeOff.create({
        data: {
          companyId: user.companyId,
          technicianId: tech.id,
          startAt: start,
          endAt: end,
          reason: text(body.reason, "reason", 1000),
          createdById: user.id,
        },
      });
      await audit(tx, user, "TIME_OFF_CREATED", "Technician", tech.id, {
        timeOffId: row.id,
      });
      return row;
    }
    if (action !== "hours") fail("Unknown workforce action");
    if (body.updatedAt !== tech.updatedAt.toISOString())
      fail("Technician changed; reload", 409);
    if (!Array.isArray(body.schedules) || body.schedules.length !== 7)
      fail("Set all seven working days");
    const schedules = body.schedules.map((v) => {
      const row = object(v),
        dayOfWeek = integer(row.dayOfWeek, "day", 0, 6),
        startTime = text(row.startTime, "opening time", 5),
        endTime = text(row.endTime, "closing time", 5);
      if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) ||
        typeof row.isWorking !== "boolean" ||
        (row.isWorking && endTime <= startTime)
      )
        fail("Invalid working hours");
      return { dayOfWeek, startTime, endTime, isWorking: row.isWorking };
    });
    if (new Set(schedules.map((s) => s.dayOfWeek)).size !== 7)
      fail("Duplicate working day");
    // Refuse changes which would silently invalidate existing future assignments.
    const company = await tx.company.findUniqueOrThrow({
        where: { id: user.companyId },
      }),
      future = await tx.job.findMany({
        where: {
          companyId: user.companyId,
          assignments: { some: { technicianId: tech.id } },
          status: { notIn: ["COMPLETED", "INVOICED", "CANCELLED"] },
          scheduledStart: { gte: new Date() },
        },
        select: { scheduledStart: true, scheduledEnd: true },
      });
    for (const job of future) {
      if (!job.scheduledEnd)
        fail("Finish existing job appointment windows first", 409);
      const a = localParts(job.scheduledStart!, company.timezone),
        b = localParts(job.scheduledEnd, company.timezone),
        day = schedules.find((s) => s.dayOfWeek === a.day)!;
      if (
        !day.isWorking ||
        a.date !== b.date ||
        a.time < day.startTime ||
        b.time > day.endTime
      )
        fail("Reassign jobs outside the proposed working hours first", 409);
    }
    await tx.techSchedule.deleteMany({ where: { technicianId: tech.id } });
    await tx.techSchedule.createMany({
      data: schedules.map((s) => ({ ...s, technicianId: tech.id })),
    });
    await tx.technician.update({
      where: { id: tech.id },
      data: { updatedAt: new Date() },
    });
    await audit(tx, user, "WORKING_HOURS_CHANGED", "Technician", tech.id, {
      schedules,
    });
    return { saved: true };
  });
}
export function localParts(d: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d),
    get = (k: string) => parts.find((p) => p.type === k)?.value || "";
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    ),
    time: `${get("hour")}:${get("minute")}`,
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}
