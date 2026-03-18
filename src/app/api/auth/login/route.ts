// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionCookieValue, COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

type LoginBody = {
  fullName?: unknown;
  password?: unknown;
  newPassword?: unknown;
  companySubdomain?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

function extractCompanySubdomainFromRequest(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const hostHeader = req.headers.get("host");

  const host = normalizeHost(forwardedHost ?? hostHeader ?? "");

  if (!host) return "";

  // ✅ WICHTIG: Vercel Domains ignorieren
  if (host.endsWith(".vercel.app")) {
    return "";
  }

  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "";
  }

  const parts = host.split(".");
  if (parts.length < 3) {
    return "";
  }

  return parts[0] ?? "";
}

export async function POST(req: Request): Promise<Response> {
  const raw = (await req.json().catch(() => null)) as unknown;

  const fullName = isRecord(raw)
    ? getString((raw as LoginBody).fullName).trim()
    : "";

  const password = isRecord(raw)
    ? getString((raw as LoginBody).password)
    : "";

  const newPassword = isRecord(raw)
    ? getString((raw as LoginBody).newPassword)
    : "";

  const companySubdomainFromBody = isRecord(raw)
    ? getString((raw as LoginBody).companySubdomain).trim().toLowerCase()
    : "";

  const companySubdomain =
    companySubdomainFromBody || extractCompanySubdomainFromRequest(req);

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "Name fehlt" }, { status: 400 });
  }

  const matchingUsers = await prisma.appUser.findMany({
    where: {
      fullName: {
        equals: fullName,
        mode: "insensitive",
      },
      ...(companySubdomain
        ? {
            company: {
              subdomain: companySubdomain,
            },
          }
        : {}),
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          subdomain: true,
          isDemo: true,
        },
      },
    },
    take: 10,
  });

  if (matchingUsers.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Kein Zugriff. Name ist nicht hinterlegt." },
      { status: 403 }
    );
  }

  if (!companySubdomain && matchingUsers.length > 1) {
    return NextResponse.json(
      {
        ok: false,
        error: "Name ist mehrfach vorhanden. Bitte über die richtige Firmen-URL einloggen.",
      },
      { status: 409 }
    );
  }

  const user = matchingUsers[0];

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Benutzer konnte nicht geladen werden." },
      { status: 500 }
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

      await prisma.appUser.update({
        where: { id: user.id },
        data: {
          passwordHash: hash,
          passwordUpdatedAt: new Date(),
        },
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

  const sessionValue = createSessionCookieValue({
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    companyId: user.company.id,
    companyName: user.company.name,
    companySubdomain: user.company.subdomain,
    companyIsDemo: user.company.isDemo,
  });

  const res = NextResponse.json(
    {
      ok: true,
      role: user.role,
      company: {
        id: user.company.id,
        name: user.company.name,
        subdomain: user.company.subdomain,
        isDemo: user.company.isDemo,
      },
    },
    { status: 200 }
  );

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