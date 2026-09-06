import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handle,
  bodyFor,
  text,
  withReceipt,
  jobFor,
} from "@/lib/workflows/core";
import { runAssistant, reviewAssistant, aiModes } from "@/lib/workflows/ai";
import {
  assistantPolicy,
  cancelAssistant,
  digest,
} from "@/lib/workflows/assistant-requests";
export const GET = (request: NextRequest) =>
  handle(request, async (user) => {
    const scope = {
      companyId: user.companyId,
      ...(user.role === "TECHNICIAN" ? { userId: user.id } : {}),
    };
    const results = await prisma.aIResult.findMany({
      where: {
        ...scope,
        id: {
          in: (
            await prisma.assistantRequest.findMany({
              where: { ...scope, resultId: { not: null } },
              select: { resultId: true },
            })
          ).flatMap((r) => (r.resultId ? [r.resultId] : [])),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const permitted = [];
    for (const r of results) {
      if (user.role === "TECHNICIAN") {
        if (!r.jobId) continue;
        try {
          await jobFor(prisma, user, r.jobId);
        } catch {
          continue;
        }
      }
      permitted.push({
        ...r,
        expectedHash: digest({ input: r.input, output: r.output }),
      });
    }
    return {
      configured: !!process.env.OPENROUTER_API_KEY,
      policy: assistantPolicy(),
      modes: aiModes.filter(
        (m) =>
          user.role !== "TECHNICIAN" ||
          [
            "job-summary",
            "diagnostics",
            "photo-intake",
            "document-search",
          ].includes(m.slug),
      ),
      results: permitted,
      requests: await prisma.assistantRequest.findMany({
        where: {
          companyId: user.companyId,
          ...(user.role === "TECHNICIAN" ? { userId: user.id } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    };
  });
export const POST = (request: NextRequest) =>
  handle(request, async (user) => {
    const body = await bodyFor(request),
      key = request.headers.get("Idempotency-Key");
    if (body.action === "review")
      return withReceipt(user, key, "assistant.review", body, () =>
        reviewAssistant(user, body),
      );
    if (body.action === "cancel")
      return cancelAssistant(user, text(body.id, "request ID", 100));
    return runAssistant(user, text(body.mode, "mode", 100), {
      ...body,
      requestKey: key,
    });
  });
