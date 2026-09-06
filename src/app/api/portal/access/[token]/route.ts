import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  WorkflowError,
  bodyFor,
  fail,
  withReceipt,
  txFor,
  audit,
} from "@/lib/workflows/core";
import {
  portalActor,
  portalData,
  reviewFromCustomer,
} from "@/lib/workflows/portal";
import { bookings } from "@/lib/workflows/scheduling";
import { checkout } from "@/lib/workflows/finance";
import { validFollowUpOrigin } from "@/lib/follow-ups";
async function run(request: NextRequest, params: Promise<{ token: string }>) {
  try {
    const { user, grant } = await portalActor((await params).token);
    if (request.method === "GET")
      return NextResponse.json(await portalData(user, grant.customerId), {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      });
    if (
      !validFollowUpOrigin(
        request.headers.get("origin"),
        process.env.NEXTAUTH_URL || request.url,
        process.env.NODE_ENV !== "production",
      )
    )
      fail("Invalid origin", 403);
    const body = await bodyFor(request);
    let result;
    if (body.action === "review")
      result = await withReceipt(
        user,
        request.headers.get("Idempotency-Key"),
        "portal.review",
        { grantId: grant.id, ...body },
        () => reviewFromCustomer(user, grant.customerId, body),
      );
    else if (body.action === "checkout")
      result = await checkout(user, grant.customerId, {
        ...body,
        requestKey: request.headers.get("Idempotency-Key"),
      });
    else if (body.action === "preferences") {
      if (
        typeof body.doNotEmail !== "boolean" ||
        typeof body.doNotText !== "boolean"
      )
        fail("Invalid contact preferences");
      result = await txFor(user, async (tx) => {
        const saved = await tx.customer.update({
          where: { id: grant.customerId },
          data: {
            doNotEmail: body.doNotEmail as boolean,
            doNotText: body.doNotText as boolean,
          },
          select: { doNotEmail: true, doNotText: true },
        });
        await audit(
          tx,
          user,
          "CUSTOMER_CONTACT_PREFERENCES",
          "Customer",
          grant.customerId,
          { portalGrantId: grant.id, ...saved },
        );
        return saved;
      });
    } else if (["book", "cancel"].includes(String(body.action)))
      result = await withReceipt(
        user,
        request.headers.get("Idempotency-Key"),
        "portal.booking",
        { grantId: grant.id, ...body },
        () =>
          bookings(
            user,
            body,
            body.action === "cancel" ? "cancel" : undefined,
            grant.customerId,
          ),
      );
    else fail("Unknown portal action");
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof WorkflowError
            ? e.message
            : "Unable to complete portal request",
      },
      { status: e instanceof WorkflowError ? e.status : 500 },
    );
  }
}
export const GET = (
  r: NextRequest,
  c: { params: Promise<{ token: string }> },
) => run(r, c.params);
export const POST = GET;
