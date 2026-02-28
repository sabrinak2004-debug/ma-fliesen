// src/app/api/auth/precheck/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fullName = (url.searchParams.get("fullName") ?? "").trim();

  // Für Live-Search im UI: leere Eingabe => kein Fehler, sondern "nicht erlaubt"
  if (!fullName) {
    return NextResponse.json({ ok: true, allowed: false }, { status: 200 });
  }

  const user = await prisma.appUser.findUnique({ where: { fullName } });

  if (!user || !user.isActive) {
    return NextResponse.json({ ok: true, allowed: false }, { status: 200 });
  }

  const needsPasswordSetup = user.role === Role.EMPLOYEE && !user.passwordHash;

  return NextResponse.json(
    {
      ok: true,
      allowed: true,
      role: user.role, // "ADMIN" | "EMPLOYEE"
      needsPasswordSetup,
    },
    { status: 200 }
  );
}