import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const fullName = (body?.fullName ?? "").trim();
  const password = (body?.password ?? "").toString();

  if (!fullName) {
    return NextResponse.json({ error: "Name fehlt" }, { status: 400 });
  }

  // User holen
  let user = await prisma.appUser.findUnique({ where: { fullName } });

  // Wenn nicht vorhanden: als Mitarbeiter anlegen (ohne Passwort)
  if (!user) {
    user = await prisma.appUser.create({
      data: {
        fullName,
        role: Role.EMPLOYEE,
        isActive: true,
      },
    });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: "User inaktiv" }, { status: 403 });
  }

  // Admin? -> Passwort nötig
  if (user.role === Role.ADMIN) {
    if (!password) {
      return NextResponse.json({ requiresPassword: true }, { status: 200 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ error: "Admin-Passwort nicht initialisiert" }, { status: 500 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Falsches Passwort", requiresPassword: true }, { status: 401 });
    }
  }

  // Session setzen
  setSession({
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
  });
await setSession({
  userId: user.id,
  fullName: user.fullName,
  role: user.role,
});

  return NextResponse.json({ ok: true, role: user.role }, { status: 200 });
}