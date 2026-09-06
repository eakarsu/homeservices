import { NextRequest } from "next/server";
import { handle, fail } from "@/lib/workflows/core";
export const PATCH = (request: NextRequest) =>
  handle(request, () =>
    fail(
      "Review each invoice individually to issue, credit or void it. Payments require actual receipts.",
      405,
    ),
  );
export const DELETE = PATCH;
