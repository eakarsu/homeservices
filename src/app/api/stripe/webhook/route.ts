import { NextResponse } from "next/server";
export const POST = () =>
  NextResponse.json(
    {
      error:
        "Configure the signed company webhook at /api/integrations/stripe/{companyId}.",
    },
    { status: 410 },
  );
