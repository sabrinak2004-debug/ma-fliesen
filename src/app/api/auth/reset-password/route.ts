import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

type ResetPasswordBody = {
  token?: unknown;
  newPassword?: unknown;
  companySubdomain?: unknown;
};

export async function POST(req: Request): Promise<Response> {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const token = isRecord(body)
    ? getString((body as ResetPasswordBody).token).trim()
    : "";

  const newPassword = isRecord(body)
    ? getString((body as ResetPasswordBody).newPassword)
    : "";

  const companySubdomain = isRecord(body)
    ? getString((body as ResetPasswordBody).companySubdomain).trim().toLowerCase()
    : "";


  if (!token) {
    return NextResponse.json({ ok: false, error: "RESET_TOKEN_MISSING" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: "RESET_PASSWORD_TOO_SHORT" },
      { status: 400 }
    );
  }

  const tokenHash = sha256Hex(token);
  const now = new Date();

  const prt = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      usedAt: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          isActive: true,
          company: {
            select: {
              subdomain: true,
            },
          },
        },
      },
    },
  });

  if (!prt) {
    return NextResponse.json({ ok: false, error: "RESET_TOKEN_INVALID" }, { status: 400 });
  }

  if (prt.usedAt) {
    return NextResponse.json(
      { ok: false, error: "RESET_TOKEN_ALREADY_USED" },
      { status: 400 }
    );
  }

  if (prt.expiresAt && prt.expiresAt.getTime() < now.getTime()) {
    return NextResponse.json(
      { ok: false, error: "RESET_TOKEN_EXPIRED" },
      { status: 400 }
    );
  }

  if (!prt.user.isActive) {
    return NextResponse.json(
      { ok: false, error: "RESET_USER_INACTIVE" },
      { status: 400 }
    );
  }

  if (
    companySubdomain &&
    prt.user.company.subdomain !== companySubdomain
  ) {
    return NextResponse.json(
      { ok: false, error: "RESET_TOKEN_WRONG_COMPANY" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: prt.userId },
      data: { passwordHash, passwordUpdatedAt: now },
    }),
    prisma.passwordResetToken.update({
      where: { id: prt.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetRequest.updateMany({
      where: { userId: prt.userId, status: "OPEN" },
      data: { status: "DONE", doneAt: now },
    }),
  ]);

  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  res.headers.set("Cache-Control", "no-store");

  return res;
}