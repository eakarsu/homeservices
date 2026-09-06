import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import { audit, customerFor, fail, integer, office, text, txFor } from "./core";
export async function grants(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
) {
  office(user);
  if (!body)
    return prisma.portalGrant.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        customerId: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  return txFor(user, async (tx) => {
    if (action === "revoke") {
      const row = await tx.portalGrant.findFirst({
        where: { id: text(body.id, "grant", 100), companyId: user.companyId },
      });
      if (!row) fail("Access link not found", 404);
      const saved = await tx.portalGrant.update({
        where: { id: row!.id },
        data: { revokedAt: new Date() },
      });
      await audit(
        tx,
        user,
        "PORTAL_ACCESS_REVOKED",
        "PortalGrant",
        saved.id,
        {},
      );
      return { id: saved.id, revoked: true };
    }
    const customer = await customerFor(
        tx,
        user,
        text(body.customerId, "customer", 100),
      ),
      token = crypto.randomBytes(32).toString("hex"),
      days = integer(body.days || 7, "expiry days", 1, 30);
    const saved = await tx.portalGrant.create({
      data: {
        companyId: user.companyId,
        customerId: customer.id,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + days * 86400000),
        createdById: user.id,
      },
    });
    await audit(tx, user, "PORTAL_ACCESS_CREATED", "PortalGrant", saved.id, {
      customerId: customer.id,
      days,
    });
    return {
      id: saved.id,
      url: `${new URL(process.env.NEXTAUTH_URL || "http://localhost:3000").origin}/portal#${token}`,
      expiresAt: saved.expiresAt,
    };
  });
}
export async function portalActor(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    return fail("Access link is invalid or expired", 404);
  const grant = await prisma.portalGrant.findFirst({
    where: {
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!grant) return fail("Access link is invalid or expired", 404);
  const issuer = await prisma.user.findFirst({
    where: {
      id: grant.createdById,
      companyId: grant.companyId,
      isActive: true,
      role: { in: ["ADMIN", "MANAGER", "DISPATCHER", "OFFICE"] },
    },
  });
  if (!issuer) return fail("Access link is no longer active", 404);
  return {
    grant,
    user: {
      id: issuer.id,
      companyId: issuer.companyId,
      role: issuer.role,
    } as AuthContext,
  };
}
export async function portalData(user: AuthContext, customerId: string) {
  const customer = await customerFor(prisma, user, customerId);
  const [jobs, invoices, bookings, services, properties, reviews] =
    await Promise.all([
      prisma.job.findMany({
        where: { companyId: user.companyId, customerId },
        select: {
          id: true,
          jobNumber: true,
          title: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
          completedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.invoice.findMany({
        where: {
          customerId,
          customer: { companyId: user.companyId },
          status: { notIn: ["DRAFT", "VOID"] },
        },
        select: {
          id: true,
          invoiceNumber: true,
          reviewedAt:true,creditCents:true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          balanceDue: true,
          dueDate: true,
          lineItems: {
            select: {
              description: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
        take: 100,
      }),
      prisma.bookingRequest.findMany({
        where: { companyId: user.companyId, customerId },
        select: {
          id: true,
          title: true,
          status: true,
          version: true,
          startAt: true,
          endAt: true,
          serviceTypeId: true,
          propertyId: true,
        },
        orderBy: { startAt: "desc" },
        take: 100,
      }),
      prisma.serviceType.findMany({
        where: { companyId: user.companyId, isActive: true },
        select: { id: true, name: true, defaultDuration: true },
      }),
      prisma.property.findMany({
        where: { customerId },
        select: { id: true, name: true, address: true },
      }),
      prisma.customerReview.findMany({
        where: { companyId: user.companyId, customerId },
      }),
    ]);
  return {
    timezone: (
      await prisma.company.findUniqueOrThrow({
        where: { id: user.companyId },
        select: { timezone: true },
      })
    ).timezone,
    customer: {
      name:
        [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
        customer.companyName,
      doNotEmail: customer.doNotEmail,
      doNotText: customer.doNotText,
    },
    jobs,
    invoices,
    bookings,
    services,
    properties,
    reviews,
  };
}
export async function reviewFromCustomer(
  user: AuthContext,
  customerId: string,
  body: Record<string, unknown>,
) {
  return txFor(user, async (tx) => {
    const job = await tx.job.findFirst({
      where: {
        id: text(body.jobId, "job", 100),
        customerId,
        companyId: user.companyId,
        status: { in: ["COMPLETED", "INVOICED"] },
      },
    });
    if (!job) return fail("Only completed jobs can be reviewed", 404);
    const row = await tx.customerReview.create({
      data: {
        companyId: user.companyId,
        customerId,
        jobId: job.id,
        rating: integer(body.rating, "rating", 1, 5),
        comment: text(body.comment, "comment", 2000, false),
      },
    });
    await audit(
      tx,
      user,
      "CUSTOMER_REVIEW_RECEIVED",
      "CustomerReview",
      row.id,
      { jobId: job.id, rating: row.rating },
    );
    return row;
  });
}
