import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import crypto from "crypto";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  return "";
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await ctx.params;

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, isActive: true, role: true },
  });

  if (!user || !user.isActive || user.role !== "EMPLOYEE") {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);

  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: null,
    },
  });

  const origin = getOrigin(req);
  const resetUrl = origin
    ? `${origin}/reset-password?token=${rawToken}`
    : `/reset-password?token=${rawToken}`;

  return NextResponse.json({
    ok: true,
    user: { id: user.id, fullName: user.fullName },
    resetUrl,
  });
}