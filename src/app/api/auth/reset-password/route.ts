import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";


function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const token = isRecord(body) ? getString(body.token).trim() : "";
  const newPassword = isRecord(body) ? getString(body.newPassword) : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Token fehlt" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Passwort muss mindestens 8 Zeichen haben" },
      { status: 400 }
    );
  }

  const tokenHash = sha256Hex(token);
  const now = new Date();

  const prt = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!prt) {
    return NextResponse.json({ ok: false, error: "Ungültiger Token" }, { status: 400 });
  }
  if (prt.usedAt) {
    return NextResponse.json(
      { ok: false, error: "Token wurde bereits verwendet" },
      { status: 400 }
    );
  }
  if (prt.expiresAt <= now) {
    return NextResponse.json({ ok: false, error: "Token ist abgelaufen" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
  prisma.appUser.update({
    where: { id: prt.userId },
    data: { passwordHash, passwordUpdatedAt: now }, // ✅ NEU
  }),
  prisma.passwordResetToken.update({
    where: { id: prt.id },
    data: { usedAt: now },
  }),
  // Optional: offene Requests automatisch schließen
  prisma.passwordResetRequest.updateMany({
    where: { userId: prt.userId, status: "OPEN" },
    data: { status: "DONE", doneAt: now },
  }),
]);

  return NextResponse.json({ ok: true });
}