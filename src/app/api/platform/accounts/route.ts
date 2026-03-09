import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  exchangeLongLivedToken,
  subscribePageWebhook,
  unsubscribePageWebhook,
} from "@/lib/meta";

// GET /api/platform/accounts?brandId=xxx — list connected accounts
export const GET = apiHandler(async (req, { session }) => {
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此品牌");
  }

  const accounts = await prisma.platformAccount.findMany({
    where: { brandId },
    select: {
      id: true,
      platform: true,
      platformUserId: true,
      platformName: true,
      isActive: true,
      tokenExpiresAt: true,
      scopes: true,
      createdAt: true,
    },
  });

  return NextResponse.json(accounts);
});

// POST /api/platform/accounts — connect a platform account
export const POST = apiHandler(async (req, { session }) => {
  const { brandId, platform, platformUserId, platformName, accessToken } = await req.json();

  if (!brandId || !platform || !platformUserId || !accessToken) {
    throw new AppError("VALIDATION_ERROR", "Missing required fields");
  }

  // Verify ownership
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new AppError("FORBIDDEN", "无权操作此品牌");
  }

  // Exchange for long-lived token
  let longToken = accessToken;
  let expiresAt: Date | null = null;
  try {
    const result = await exchangeLongLivedToken(accessToken);
    longToken = result.access_token;
    if (result.expires_in && !isNaN(result.expires_in)) {
      expiresAt = new Date(Date.now() + result.expires_in * 1000);
    }
  } catch {
    // If exchange fails, use original token (may be short-lived)
  }

  // Encrypt token before storing
  const encryptedToken = encrypt(longToken);

  // Upsert account
  const account = await prisma.platformAccount.upsert({
    where: {
      platform_platformUserId: { platform, platformUserId },
    },
    update: {
      brandId,
      platformName,
      accessToken: encryptedToken,
      tokenExpiresAt: expiresAt,
      isActive: true,
    },
    create: {
      brandId,
      platform,
      platformUserId,
      platformName,
      accessToken: encryptedToken,
      tokenExpiresAt: expiresAt,
      scopes: [],
    },
  });

  // Subscribe to webhooks for FB pages
  if (platform === "FACEBOOK") {
    await subscribePageWebhook(platformUserId, longToken);
  }

  return NextResponse.json({
    id: account.id,
    platform: account.platform,
    platformName: account.platformName,
    isActive: account.isActive,
  });
});

// DELETE /api/platform/accounts — disconnect a platform account
export const DELETE = apiHandler(async (req, { session }) => {
  const { accountId } = await req.json();
  if (!accountId) {
    throw new AppError("VALIDATION_ERROR", "accountId required");
  }

  const account = await prisma.platformAccount.findUnique({
    where: { id: accountId },
    include: { brand: { include: { members: true } } },
  });
  if (!account) {
    throw new AppError("NOT_FOUND", "账号不存在");
  }

  const isMember = account.brand.members.some(
    (m) => m.userId === session.user.id && ["OWNER", "ADMIN"].includes(m.role)
  );
  if (!isMember) {
    throw new AppError("FORBIDDEN", "无权操作此账号");
  }

  // Unsubscribe webhooks
  if (account.platform === "FACEBOOK") {
    try {
      const token = decrypt(account.accessToken);
      await unsubscribePageWebhook(account.platformUserId, token);
    } catch {
      // Best effort
    }
  }

  await prisma.platformAccount.delete({ where: { id: accountId } });

  return NextResponse.json({ success: true });
});