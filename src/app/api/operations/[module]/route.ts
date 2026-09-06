import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handle,
  bodyFor,
  office,
  manager,
  fail,
  text,
  withReceipt,
  csv,
} from "@/lib/workflows/core";
import { finance } from "@/lib/workflows/finance";
import { records } from "@/lib/workflows/records";
import { recordModules } from "@/lib/workflows/definitions";
import { bookings, assign } from "@/lib/workflows/scheduling";
import { timesheets } from "@/lib/workflows/time";
import { purchasing } from "@/lib/workflows/purchasing";
import { workforce } from "@/lib/workflows/workforce";
import { inventory } from "@/lib/workflows/stock";
import { grants } from "@/lib/workflows/portal";
import { messages } from "@/lib/workflows/communications";
import { providerSettings } from "@/lib/workflows/providers";
type Context = { params: Promise<{ module: string }> };
export const GET = (request: NextRequest, context: Context) =>
  handle(request, async (user) => {
    const { module } = await context.params;
    if (module === "lookups") {
      const jobWhere = {
        companyId: user.companyId,
        ...(user.role === "TECHNICIAN"
          ? {
              assignments: {
                some: { technicianId: user.technicianId || "none" },
              },
            }
          : {}),
      };
      const [company, jobs, technicians, parts, trucks] = await Promise.all([
        prisma.company.findUniqueOrThrow({
          where: { id: user.companyId },
          select: { name: true, timezone: true },
        }),
        prisma.job.findMany({
          where: jobWhere,
          select: {
            id: true,
            title: true,
            jobNumber: true,
            customerId: true,
            status: true,
            updatedAt: true,
            scheduledStart: true,
            scheduledEnd: true,
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prisma.technician.findMany({
          where: {
            user: { companyId: user.companyId, isActive: true },
            ...(user.role === "TECHNICIAN"
              ? { id: user.technicianId || "none" }
              : {}),
          },
          select: {
            id: true,
            truckId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.part.findMany({
          where: { companyId: user.companyId, isActive: true },
          select: {
            id: true,
            name: true,
            partNumber: true,
            price: true,
            cost: true,
            quantityOnHand: true,
          },
          take: 1000,
        }),
        prisma.truck.findMany({
          where: {
            companyId: user.companyId,
            isActive: true,
            ...(user.role === "TECHNICIAN"
              ? { technicians: { some: { id: user.technicianId || "none" } } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            stock: { select: { partId: true, quantity: true } },
          },
        }),
      ]);
      if (user.role === "TECHNICIAN")
        return {
          company,
          role: user.role,
          jobs,
          technicians,
          parts: parts.map(({ cost, ...p }) => p),
          trucks,
          customers: [],
          properties: [],
          serviceTypes: [],
          equipment: [],
          vendors: [],
        };
      office(user);
      const [customers, properties, serviceTypes, equipment, vendors] =
        await Promise.all([
          prisma.customer.findMany({
            where: { companyId: user.companyId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
            },
            take: 1000,
          }),
          prisma.property.findMany({
            where: { customer: { companyId: user.companyId } },
            select: { id: true, address: true, customerId: true },
            take: 1000,
          }),
          prisma.serviceType.findMany({
            where: { companyId: user.companyId, isActive: true },
            select: { id: true, name: true, defaultDuration: true },
            take: 500,
          }),
          prisma.equipment.findMany({
            where: { property: { customer: { companyId: user.companyId } } },
            select: {
              id: true,
              type: true,
              brand: true,
              model: true,
              propertyId: true,
            },
            take: 1000,
          }),
          prisma.workflowRecord.findMany({
            where: {
              companyId: user.companyId,
              module: "vendors",
              status: "ACTIVE",
            },
            select: { id: true, title: true },
            take: 500,
          }),
        ]);
      return {
        company,
        role: user.role,
        jobs,
        technicians,
        parts,
        trucks,
        customers,
        properties,
        serviceTypes,
        equipment,
        vendors,
      };
    }
    if (module === "timesheets") {
      const rows = await timesheets(user);
      if (!Array.isArray(rows)) fail("Invalid timesheet result", 500);
      if (request.nextUrl.searchParams.get("format") === "csv") {
        office(user);
        const approved = rows.filter((r) => r.approvalStatus === "APPROVED");
        return new Response(
          csv(
            approved.map((r) => ({
              id: r.id,
              technician: `${r.technician.user.firstName} ${r.technician.user.lastName}`,
              job: r.job.jobNumber,
              start: r.startTime.toISOString(),
              end: r.endTime?.toISOString(),
              type: r.type,
              minutes: r.duration,
              approvedBy: r.reviewedById,
            })),
            [
              "id",
              "technician",
              "job",
              "start",
              "end",
              "type",
              "minutes",
              "approvedBy",
            ],
          ),
          {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition":
                'attachment; filename="approved-timesheets.csv"',
              "Cache-Control": "no-store",
            },
          },
        );
      }
      return rows;
    }
    office(user);
    if (module === "finance") return finance(user);
    if (module === "bookings") return bookings(user);
    if (module === "purchasing") return purchasing(user);
    if (module === "workforce") return workforce(user);
    if (module === "communications") return messages(user);
    if (module === "portal") return grants(user);
    if (module === "integrations") return providerSettings(user);
    if (module === "reviews")
      return prisma.customerReview.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
    if (module === "stock")
      return prisma.stockMovement.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
    if (Object.hasOwn(recordModules, module)) return records(user, module);
    return fail("Workflow not found", 404);
  });
export const POST = (request: NextRequest, context: Context) =>
  handle(request, async (user) => {
    const { module } = await context.params,
      body = await bodyFor(request),
      action = text(body.action, "action", 40, false),
      key = request.headers.get("Idempotency-Key");
    if (module === "finance")
      return finance(user, { ...body, requestKey: key }, action);
    if (module === "portal") return grants(user, body, action);
    if (module === "integrations") return providerSettings(user, body);
    if (module === "communications" && ["dispatch", "refresh"].includes(action))
      return messages(user, body, action);
    return withReceipt(user, key, `${module}.${action}`, body, async () => {
      const input = { ...body, requestKey: key };
      if (module === "bookings") return bookings(user, input, action);
      if (module === "timesheets") return timesheets(user, input, action);
      if (module === "purchasing") return purchasing(user, input, action);
      if (module === "workforce") return workforce(user, input, action);
      if (module === "stock") return inventory(user, input, action);
      if (module === "dispatch") return assign(user, input);
      if (module === "communications") return messages(user, input, action);
      if (Object.hasOwn(recordModules, module))
        return records(user, module, input, action);
      return fail("Workflow not found", 404);
    });
  });
