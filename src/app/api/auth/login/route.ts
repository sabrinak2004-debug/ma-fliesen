// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionCookieValue, COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

type Body =
  | { fullName?: unknown; password?: unknown } // normal login
  | { fullName?: unknown; newPassword?: unknown }; // first-time setup (Employee)

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  const raw = (await req.json().catch(() => null)) as unknown;

  const fullName = isRecord(raw)
  ? getString((raw as Body).fullName).trim().toLowerCase()
  : "";
  const password = isRecord(raw) ? getString((raw as { password?: unknown }).password) : "";
  const newPassword = isRecord(raw) ? getString((raw as { newPassword?: unknown }).newPassword) : "";

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "Name fehlt" }, { status: 400 });
  }

  const user = await prisma.appUser.findFirst({
    where: {
      fullName: {
        equals: fullName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
      passwordHash: true,
      companyId: true,
    },
  });


  // Name ist die Whitelist -> nur wer im Seed/Backend existiert, darf rein
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Kein Zugriff. Name ist nicht hinterlegt." },
      { status: 403 }
    );
  }
  if (!user.isActive) {
    return NextResponse.json({ ok: false, error: "User inaktiv" }, { status: 403 });
  }

  // EMPLOYEE: beim ersten Mal Passwort setzen, danach immer prüfen
  if (user.role === Role.EMPLOYEE) {
    const needsSetup = !user.passwordHash;

    if (needsSetup) {
      if (!newPassword) {
        return NextResponse.json({ ok: false, error: "Passwort-Setup erforderlich." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { ok: false, error: "Passwort muss mind. 8 Zeichen haben." },
          { status: 400 }
        );
      }

      const hash = await bcrypt.hash(newPassword, 12);

      // Race-Schutz: setze Passwort nur, wenn noch keines vorhanden ist
      await prisma.appUser.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });
    } else {
      if (!password) {
        return NextResponse.json({ ok: false, error: "Passwort fehlt" }, { status: 400 });
      }
      // user.passwordHash ist hier sicher gesetzt, aber TS mag's manchmal trotzdem:
      if (!user.passwordHash) {
        return NextResponse.json({ ok: false, error: "Passwort nicht initialisiert." }, { status: 500 });
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "Falsches Passwort" }, { status: 401 });
      }
    }
  }

  // ADMIN: immer Passwort prüfen
  if (user.role === Role.ADMIN) {
    if (!password) {
      return NextResponse.json({ ok: false, error: "Passwort fehlt" }, { status: 400 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ ok: false, error: "Admin-Passwort nicht initialisiert" }, { status: 500 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Falsches Passwort" }, { status: 401 });
    }
  }

  if (!user.companyId) {
    return NextResponse.json(
      { ok: false, error: "User ist noch keiner Firma zugeordnet." },
      { status: 500 }
    );
  }

  const sessionValue = createSessionCookieValue({
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    companyId: user.companyId,
  });


  const res = NextResponse.json({ ok: true, role: user.role }, { status: 200 });

  res.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  });

  return res;
}