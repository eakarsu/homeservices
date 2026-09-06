import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  fail,
  integer,
  manager,
  money,
  object,
  office,
  text,
  txFor,
  version,
} from "./core";

export async function purchasing(
  user: AuthContext,
  body?: Record<string, unknown>,
  action?: string,
) {
  office(user);
  if (!body)
    return prisma.purchaseOrder.findMany({
      where: { companyId: user.companyId },
      include: {
        items: {
          include: { part: { select: { name: true, partNumber: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  return txFor(user, async (tx) => {
    const current = body.id
      ? await tx.purchaseOrder.findFirst({
          where: { id: String(body.id), companyId: user.companyId },
          include: { items: true },
        })
      : null;
    if (body.id && !current) fail("Purchase order not found", 404);
    if (action === "return" && current) {
      manager(user);
      if (current.version !== version(body.version))
        fail("Order changed; reload", 409);
      const reason = text(body.reason, "return reason", 2000),
        itemId = text(body.itemId, "order item", 100),
        quantity = integer(body.quantity, "return quantity", 1),
        item = current.items.find((i) => i.id === itemId);
      if (!item || quantity > item.receivedQty)
        fail("Return exceeds received quantity", 409);
      const part = await tx.part.findFirst({
        where: { id: item!.partId, companyId: user.companyId },
      });
      if (!part || part.quantityOnHand < quantity)
        fail("Insufficient warehouse stock for return", 409);
      await tx.part.update({
        where: { id: part!.id },
        data: { quantityOnHand: { decrement: quantity } },
      });
      await tx.purchaseOrderItem.update({
        where: { id: item!.id },
        data: { receivedQty: { decrement: quantity } },
      });
      await tx.stockMovement.create({
        data: {
          companyId: user.companyId,
          partId: part!.id,
          quantity: -quantity,
          kind: "PURCHASE_RETURN",
          sourceId: current.id,
          requestKey: text(body.requestKey, "retry key", 100),
          actorId: user.id,
        },
      });
      const saved = await tx.purchaseOrder.update({
        where: { id: current.id },
        data: {
          status: "PARTIAL",
          receivedDate: null,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "PURCHASE_RETURNED", "PurchaseOrder", current.id, {
        itemId,
        quantity,
        reason,
      });
      return saved;
    }
    if (action === "receive" && current) {
      const requestKey = text(body.requestKey, "request key", 100);
      if (current.version !== version(body.version))
        fail("Order changed; reload before receiving", 409);
      if (!["ORDERED", "PARTIAL"].includes(current.status))
        fail("Approve the order before receiving stock", 409);
      if (!Array.isArray(body.receipts) || !body.receipts.length)
        fail("At least one receipt is required");
      const seen = new Set<string>();
      for (const raw of body.receipts as unknown[]) {
        const row = object(raw),
          itemId = text(row.itemId, "order item", 100),
          quantity = integer(row.quantity, "quantity", 1);
        if (seen.has(itemId)) fail("Duplicate receipt line");
        seen.add(itemId);
        const item = current.items.find((i) => i.id === itemId);
        if (!item) fail("Order line not found");
        if (item!.receivedQty + quantity > item!.quantity)
          fail("Receipt exceeds the ordered quantity", 409);
        if (
          !(await tx.part.findFirst({
            where: { id: item!.partId, companyId: user.companyId },
          }))
        )
          fail("Part not found", 404);
        await tx.purchaseOrderItem.update({
          where: { id: itemId },
          data: { receivedQty: { increment: quantity } },
        });
        await tx.part.update({
          where: { id: item!.partId },
          data: { quantityOnHand: { increment: quantity } },
        });
        await tx.stockMovement.create({
          data: {
            companyId: user.companyId,
            partId: item!.partId,
            quantity,
            kind: "PURCHASE_RECEIPT",
            sourceId: current.id,
            requestKey: requestKey + ":" + itemId,
            actorId: user.id,
          },
        });
      }
      const lines = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: current.id },
        }),
        done = lines.every((i) => i.receivedQty === i.quantity);
      const saved = await tx.purchaseOrder.update({
        where: { id: current.id },
        data: {
          status: done ? "RECEIVED" : "PARTIAL",
          receivedDate: done ? new Date() : null,
          version: { increment: 1 },
        },
      });
      await audit(tx, user, "PURCHASE_RECEIVED", "PurchaseOrder", current.id, {
        requestKey,
      });
      return saved;
    }
    if (current && current.version !== version(body.version))
      fail("Order changed. Reload before saving.", 409);
    if (action === "approve" && current) {
      manager(user);
      if (current.status !== "DRAFT" || !current.items.length)
        fail("Only a draft order with items can be approved");
      const saved = await tx.purchaseOrder.update({
        where: { id: current.id },
        data: {
          status: "ORDERED",
          approvedById: user.id,
          approvedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await audit(
        tx,
        user,
        "PURCHASE_APPROVED",
        "PurchaseOrder",
        current.id,
        {},
      );
      return saved;
    }
    if (action === "cancel" && current) {
      if (!["DRAFT", "ORDERED"].includes(current.status))
        fail("Received orders cannot be cancelled");
      const saved = await tx.purchaseOrder.update({
        where: { id: current.id },
        data: { status: "CANCELLED", version: { increment: 1 } },
      });
      await audit(
        tx,
        user,
        "PURCHASE_CANCELLED",
        "PurchaseOrder",
        current.id,
        {},
      );
      return saved;
    }
    if (current && current.status !== "DRAFT")
      fail("Only draft orders can be edited");
    const vendor = await tx.workflowRecord.findFirst({
      where: {
        id: text(body.vendorId, "vendor", 100),
        companyId: user.companyId,
        module: "vendors",
        status: "ACTIVE",
      },
    });
    if (!vendor) fail("Active vendor required");
    if (
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 100
    )
      fail("Use 1–100 order lines");
    let subtotal = 0;
    const items = [];
    for (const raw of body.items as unknown[]) {
      const row = object(raw),
        partId = text(row.partId, "part", 100),
        quantity = integer(row.quantity, "quantity", 1),
        cost = money(row.unitCost);
      if (
        !(await tx.part.findFirst({
          where: { id: partId, companyId: user.companyId },
        }))
      )
        fail("Part not found", 404);
      subtotal += cost * quantity;
      items.push({
        partId,
        quantity,
        unitCost: cost / 100,
        totalCost: (cost * quantity) / 100,
      });
    }
    integer(subtotal, "order subtotal", 0, 999999999);
    const tax = money(body.taxAmount || 0),
      data = {
        vendorId: vendor!.id,
        vendorName: vendor!.title,
        subtotal: subtotal / 100,
        taxAmount: tax / 100,
        totalAmount: (subtotal + tax) / 100,
        notes: text(body.notes, "notes", 2000, false),
      };
    integer(subtotal + tax, "order total", 0, 999999999);
    if (current)
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: current.id },
      });
    const saved = current
      ? await tx.purchaseOrder.update({
          where: { id: current.id },
          data: {
            ...data,
            version: { increment: 1 },
            items: { create: items },
          },
        })
      : await tx.purchaseOrder.create({
          data: {
            ...data,
            companyId: user.companyId,
            poNumber: `PO-${crypto.randomUUID()}`,
            items: { create: items },
          },
        });
    await audit(tx, user, "PURCHASE_DRAFT_SAVED", "PurchaseOrder", saved.id, {
      subtotal,
      tax,
    });
    return saved;
  });
}
