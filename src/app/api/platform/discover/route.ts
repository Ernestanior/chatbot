import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { discoverAccounts } from "@/lib/meta";

// POST /api/platform/discover — discover available FB pages & IG accounts
export const POST = apiHandler(async (req, { session }) => {
  // Get user's Meta access token from NextAuth Account table
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "facebook" },
  });

  if (!account?.access_token) {
    throw new AppError("VALIDATION_ERROR", "No Meta account linked. Please re-login with Facebook.");
  }

  try {
    const accounts = await discoverAccounts(account.access_token);
    return NextResponse.json(accounts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Discovery failed";
    throw new AppError("EXTERNAL_API_ERROR", message);
  }
});
