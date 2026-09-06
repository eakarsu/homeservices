import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type { AuthContext } from "@/lib/operations-governance";
import {
  audit,
  fail,
  integer,
  jobFor,
  manager,
  money,
  office,
  text,
  txFor,
} from "./core";
export async function changeStock(
  tx: Prisma.TransactionClient,
  user: AuthContext,
  partId: string,
  truckId: string | null,
  delta: number,
  kind: string,
  sourceId: string,
) {
  const part = await tx.part.findFirst({
    where: { id: partId, companyId: user.companyId, isActive: true },
  });
  if (!part) return fail("Active part not found", 404);
  if (truckId) {
    if (
      !(await tx.truck.findFirst({
        where: { id: truckId, companyId: user.companyId, isActive: true },
      }))
    )
      fail("Truck not found", 404);
    const stock = await tx.truckStock.findUnique({
      where: { truckId_partId: { truckId, partId } },
    });
    if ((stock?.quantity || 0) + delta < 0)
      fail("Insufficient truck stock", 409);
    if(stock)await tx.truckStock.update({where:{id:stock.id},data:{quantity:{increment:delta}}});
    else await tx.truckStock.create({data:{truckId,partId,quantity:delta}});
  } else {
    if (part.quantityOnHand + delta < 0)
      fail("Insufficient warehouse stock", 409);
    await tx.part.update({
      where: { id: partId },
      data: { quantityOnHand: { increment: delta } },
    });
  }
  await tx.stockMovement.create({
    data: {
      companyId: user.companyId,
      partId,
      quantity: delta,
      kind,
      sourceId: truckId
        ? `${sourceId}:truck:${truckId}`
        : `${sourceId}:warehouse`,
      requestKey: crypto.randomUUID(),
      actorId: user.id,
    },
  });
  return part;
}
export async function inventory(
  user: AuthContext,
  body: Record<string, unknown>,
  action: string,
) {
  return txFor(user, async (tx) => {
    const partId = text(body.partId, "part", 100);
    if (action === "use") {
      const job = await jobFor(tx, user, text(body.jobId, "job", 100));
      if (job.status !== "IN_PROGRESS")
        fail("Parts usage requires a job in progress", 409);
      const truckId = text(body.truckId, "truck", 100, false) || null;
      if (user.role === "TECHNICIAN") {
        const tech = await tx.technician.findFirst({
          where: { id: user.technicianId, userId: user.id },
        });
        if (!truckId || tech?.truckId !== truckId)
          fail("Use stock from your assigned truck", 403);
      } else office(user);
      const quantity = integer(body.quantity, "quantity", 1, 10000),
        part = await changeStock(
          tx,
          user,
          partId,
          truckId,
          -quantity,
          "JOB_USAGE",
          job.id,
        );
      const total = money(part.price.toString()) * quantity;
      integer(total, "parts total", 0, 999999999);
      const used = await tx.jobPart.create({
        data: {
          jobId: job.id,
          partId,
          quantity,
          unitPrice: part.price,
          totalPrice: total / 100,
        },
      });
      await audit(tx, user, "JOB_PART_USED", "Job", job.id, {
        partId,
        quantity,
        truckId,
        jobPartId: used.id,
      });
      return used;
    }
    office(user);
    if (action === "transfer") {
      const from = text(body.fromTruckId, "source", 100, false) || null,
        to = text(body.toTruckId, "destination", 100, false) || null;
      if (from === to) fail("Choose different stock locations");
      const quantity = integer(body.quantity, "quantity", 1, 10000),
        ref = crypto.randomUUID();
      await changeStock(tx, user, partId, from, -quantity, "TRANSFER_OUT", ref);
      await changeStock(tx, user, partId, to, quantity, "TRANSFER_IN", ref);
      await audit(tx, user, "STOCK_TRANSFERRED", "Part", partId, {
        from,
        to,
        quantity,
        reference: ref,
      });
      return { success: true };
    }
    if (action !== "adjust") fail("Unknown inventory action");
    manager(user);
    const quantity = integer(body.quantity, "adjustment", -100000, 100000);
    if (!quantity) fail("Enter a non-zero adjustment");
    const reason = text(body.reason, "adjustment reason", 1000),
      truckId = text(body.truckId, "truck", 100, false) || null;
    await changeStock(
      tx,
      user,
      partId,
      truckId,
      quantity,
      "ADJUSTMENT",
      crypto.randomUUID(),
    );
    await audit(tx, user, "STOCK_ADJUSTED", "Part", partId, {
      quantity,
      truckId,
      reason,
    });
    return { success: true };
  });
}
export async function savePart(
  user: AuthContext,
  body: Record<string, unknown>,
  id?: string,
) {
  manager(user);
  return txFor(user, async (tx) => {
    const current = id
      ? await tx.part.findFirst({ where: { id, companyId: user.companyId } })
      : null;
    if (id && !current) fail("Part not found", 404);
    if (
      current &&
      body.updatedAt &&
      text(body.updatedAt, "version", 40) !== current.updatedAt.toISOString()
    )
      fail("Part changed; reload before saving", 409);
    const value = (k: string) =>
      body[k] ?? (current as unknown as Record<string, unknown>)?.[k];
    const data = {
      partNumber: text(value("partNumber"), "part number", 100),
      name: text(value("name"), "name", 200),
      description: text(value("description"), "description", 2000, false),
      category: text(value("category"), "category", 100, false),
      manufacturer: text(value("manufacturer"), "manufacturer", 200, false),
      warehouseLocation: text(
        value("warehouseLocation"),
        "warehouse location",
        100,
        false,
      ),
      cost: money(String(value("cost") ?? 0)) / 100,
      price: money(String(value("price") ?? 0)) / 100,
      reorderLevel: integer(
        Number(value("reorderLevel") ?? 0),
        "reorder level",
      ),
      reorderQty: integer(Number(value("reorderQty") ?? 0), "reorder quantity"),
      isActive: value("isActive") !== false,
    };
    const quantity =
      body.quantityOnHand === undefined
        ? current?.quantityOnHand || 0
        : integer(Number(body.quantityOnHand), "warehouse quantity");
    if (current && quantity !== current.quantityOnHand)
      fail(
        "Use the stock adjustment workflow with a reason to change quantities",
        409,
      );
    if (
      !data.isActive &&
      current &&
      (current.quantityOnHand > 0 ||
        (await tx.truckStock.count({
          where: { partId: current.id, quantity: { gt: 0 } },
        })))
    )
      fail("Reconcile remaining stock before archiving the part", 409);
    const saved = current
      ? await tx.part.update({ where: { id }, data })
      : await tx.part.create({
          data: {
            ...data,
            quantityOnHand: quantity,
            companyId: user.companyId,
          },
        });
    if (!current && quantity)
      await tx.stockMovement.create({
        data: {
          companyId: user.companyId,
          partId: saved.id,
          quantity,
          kind: "OPENING_BALANCE",
          sourceId: "warehouse",
          requestKey: crypto.randomUUID(),
          actorId: user.id,
        },
      });
    await audit(tx, user, "PART_SAVED", "Part", saved.id, {
      created: !current,
    });
    return saved;
  });
}
