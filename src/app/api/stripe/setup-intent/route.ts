import { NextRequest } from "next/server";
import { handle, manager, fail } from "@/lib/workflows/core";
export const POST = (r: NextRequest) =>
  handle(r, (user) => {
    manager(user);
    return fail(
      "Saved-card and recurring agreement billing are awaiting provider reconciliation support. Use reviewed invoice checkout for one-time payments.",
      503,
    );
  });
export const GET = POST;
export const DELETE = POST;
