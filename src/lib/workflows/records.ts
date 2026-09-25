import { createInvoice } from "./invoices";
import { object, money, integer, json } from "./core";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  customerFor,
  fail,
  jobFor,
  office,
  manager,
  txFor,
  version,
} from "./core";
import { validateRecord } from "./catalog";

export async function records(
  user: AuthContext,
  module: string,
  body?: Record<string, unknown>,
  action?: string,
) {
  office(user);
  if (!body)
    return prisma.workflowRecord.findMany({
      where: { companyId: user.companyId, module },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
  return txFor(user, async (tx) => {
    const current = body.id
      ? await tx.workflowRecord.findFirst({
          where: { id: String(body.id), companyId: user.companyId, module },
        })
      : null;
    if (body.id && !current) fail("Record not found", 404);
    if (current && current.version !== version(body.version))
      fail("Record changed. Reload before saving.", 409);
    if (action === "convert" && module === "leads" && current) {
      if (current.customerId) return current;
      const fields = validateRecord(module, {
        ...current,
        data: current.data,
      }).data;
      const customer = await tx.customer.create({
        data: {
          companyId: user.companyId,
          customerNumber: `CUS-${crypto.randomUUID()}`,
          firstName: String(fields.firstName),
          lastName: String(fields.lastName),
          email: String(fields.email || "") || null,
          phone: String(fields.phone || "") || null,
          referralSource: String(fields.source || ""),
          referredBy: String(fields.referral || ""),
          tags: [],
        },
      });
      const saved = await tx.workflowRecord.update({
        where: { id: current.id },
        data: {
          customerId: customer.id,
          status: "WON",
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "LEAD_CONVERTED", "WorkflowRecord", saved.id, {
        customerId: customer.id,
      });
      return saved;
    }
    if (action === "bill" && module === "maintenance" && current) {
      if (current.status !== "ACTIVE" || !current.customerId) fail("Active maintenance plan with a customer required");
      const d = object(current.data), amount = money(d.billingAmount), days = integer(Number(d.billingCadenceDays),"billing interval",1,3660), tax = money(d.billingTaxPercent || 0);
      const period = new Date(String(d.nextBillingAt));
      if (!amount || !Number.isFinite(period.getTime()) || period > new Date() || tax > 10000) fail("Configure a due billing date, positive amount, interval and valid tax percent");
      const receiptId = 'maintenance-bill:' + crypto.createHash('sha256').update(current.id+period.toISOString()).digest('hex');
      if (await tx.workflowRecord.findUnique({where:{id:receiptId}})) fail("This billing period already has an invoice",409);
      const invoice = await createInvoice(user,{customerId:current.customerId,lineItems:[{description:`${current.title} — service period beginning ${period.toISOString().slice(0,10)}`,quantity:1,unitPrice:amount/100,category:"Maintenance"}],taxRate:tax/10000,notes:"Recurring maintenance billing draft; review before issue."});
      await tx.workflowRecord.create({data:{id:receiptId,companyId:user.companyId,module:"maintenance-bill",title:current.title,status:"DRAFT",customerId:current.customerId,data:json({planId:current.id,period:period.toISOString(),invoiceId:invoice.id}),createdById:user.id}});
      const next = new Date(period.getTime()+days*86400000);
      const saved = await tx.workflowRecord.update({where:{id:current.id},data:{data:json({...d,nextBillingAt:next.toISOString(),lastInvoiceId:invoice.id}),version:{increment:1}}});
      await audit(tx,user,"MAINTENANCE_INVOICE_DRAFTED","WorkflowRecord",current.id,{invoiceId:invoice.id,period:period.toISOString()});return saved;
    }
    if (action === "visit" && module === "maintenance" && current) {
      if (current.status !== "ACTIVE" || !current.customerId)
        return fail("An active plan with a customer is required");
      const d = validateRecord(module, { ...current, data: current.data }).data;
      const property = await tx.property.findFirst({
        where: {
          id: String(d.propertyId),
          customerId: current.customerId,
          customer: { companyId: user.companyId },
        },
      });
      const service = await tx.serviceType.findFirst({
        where: {
          id: String(d.serviceTypeId),
          companyId: user.companyId,
          isActive: true,
        },
      });
      if (!property || !service)
        return fail("Property or service is unavailable");
      const start = new Date(String(d.nextAt)),
        end = new Date(
          start.getTime() + (service.defaultDuration || 60) * 60000,
        );
      const job = await tx.job.create({
        data: {
          companyId: user.companyId,
          customerId: current.customerId,
          propertyId: property!.id,
          serviceTypeId: service!.id,
          createdById: user.id,
          jobNumber: `MAINT-${crypto.randomUUID()}`,
          title: current.title,
          description: String(d.notes || ""),
          tradeType: service!.tradeType,
          type: "MAINTENANCE",
          scheduledStart: start,
          scheduledEnd: end,
          tags: [],
          status: "PENDING",
        },
      });
      const next = new Date(start);
      next.setUTCDate(next.getUTCDate() + Number(d.cadenceDays));
      const saved = await tx.workflowRecord.update({
        where: { id: current.id },
        data: {
          jobId: job.id,
          data: { ...d, nextAt: next.toISOString() },
          version: { increment: 1 },
        },
      });
      await audit(
        tx,
        user,
        "MAINTENANCE_VISIT_CREATED",
        "WorkflowRecord",
        saved.id,
        { jobId: job.id },
      );
      return saved;
    }
    const data = validateRecord(module, body);
    if (
      module === "subcontractors" &&
      ["APPROVED", "SUSPENDED", "REJECTED"].includes(data.status)
    )
      manager(user);
    if (data.customerId) await customerFor(tx, user, data.customerId);
    if (data.jobId) {
      const job = await jobFor(tx, user, data.jobId);
      if (data.customerId && job.customerId !== data.customerId)
        fail("Job does not belong to the selected customer");
    }
    if (
      data.data.propertyId &&
      !(await tx.property.findFirst({
        where: {
          id: String(data.data.propertyId),
          customer: { companyId: user.companyId },
          ...(data.customerId ? { customerId: data.customerId } : {}),
        },
      }))
    )
      fail("Property not found");
    if (
      data.data.equipmentId &&
      !(await tx.equipment.findFirst({
        where: {
          id: String(data.data.equipmentId),
          property: {
            customer: { companyId: user.companyId },
            ...(data.customerId ? { customerId: data.customerId } : {}),
          },
        },
      }))
    )
      fail("Equipment not found");
    if (
      data.data.serviceTypeId &&
      !(await tx.serviceType.findFirst({
        where: {
          id: String(data.data.serviceTypeId),
          companyId: user.companyId,
        },
      }))
    )
      fail("Service type not found");
    if (
      data.data.vendorId &&
      !(await tx.workflowRecord.findFirst({
        where: {
          id: String(data.data.vendorId),
          companyId: user.companyId,
          module: "vendors",
        },
      }))
    )
      fail("Vendor not found");
    if (module === "maintenance" && !data.customerId)
      fail("Customer is required for recurring maintenance");
    const saved = current
      ? await tx.workflowRecord.update({
          where: { id: current.id },
          data: { ...data, version: { increment: 1 } },
        })
      : await tx.workflowRecord.create({
          data: {
            ...data,
            module,
            companyId: user.companyId,
            createdById: user.id,
          },
        });
    await audit(
      tx,
      user,
      current ? "WORKFLOW_UPDATED" : "WORKFLOW_CREATED",
      "WorkflowRecord",
      saved.id,
      { module, status: saved.status, version: saved.version },
    );
    return saved;
  });
}
