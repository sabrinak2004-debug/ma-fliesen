import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fullName = (url.searchParams.get("fullName") ?? "").trim();

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "Name fehlt" }, { status: 400 });
  }

  const user = await prisma.appUser.findUnique({ where: { fullName } });

  if (!user || !user.isActive) {
    return NextResponse.json({ ok: false, allowed: false }, { status: 200 });
  }

  const needsPasswordSetup = user.role === Role.EMPLOYEE && !user.passwordHash;

  return NextResponse.json({
    ok: true,
    allowed: true,
    role: user.role === Role.ADMIN ? "ADMIN" : "USER",
    needsPasswordSetup,
  });
}