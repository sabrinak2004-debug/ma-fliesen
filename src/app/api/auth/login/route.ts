// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionCookieValue, COOKIE_NAME } from "@/lib/auth";
import { Role, type AppLanguage } from "@prisma/client";
import { normalizeAppUiLanguage } from "@/lib/i18n";

type LoginBody = {
  fullName?: unknown;
  password?: unknown;
  newPassword?: unknown;
  companySubdomain?: unknown;
  language?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeAppLanguage(value: AppLanguage | null | undefined): AppLanguage {
  if (
    value === "DE" ||
    value === "EN" ||
    value === "IT" ||
    value === "TR" ||
    value === "SQ" ||
    value === "KU"
  ) {
    return value;
  }

  return "DE";
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

  const requestedLanguage = normalizeAppUiLanguage(
    isRecord(raw) ? getString((raw as LoginBody).language).trim().toUpperCase() : ""
  );

  const companySubdomain =
    companySubdomainFromBody || extractCompanySubdomainFromRequest(req);

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "AUTH_LOGIN_NAME_MISSING" }, { status: 400 });
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
      { ok: false, error: "AUTH_LOGIN_NAME_NOT_ALLOWED" },
      { status: 403 }
    );
  }

  if (!companySubdomain && matchingUsers.length > 1) {
    return NextResponse.json(
      {
        ok: false,
        error: "AUTH_LOGIN_AMBIGUOUS_NAME",
      },
      { status: 409 }
    );
  }

  const user = matchingUsers[0];

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "AUTH_LOGIN_USER_LOAD_FAILED" },
      { status: 500 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json({ ok: false, error: "AUTH_LOGIN_USER_INACTIVE" }, { status: 403 });
  }

  // EMPLOYEE: beim ersten Mal Passwort setzen, danach immer prüfen
  if (user.role === Role.EMPLOYEE) {
    const needsSetup = !user.passwordHash;

    if (needsSetup) {
      if (!newPassword) {
        return NextResponse.json({ ok: false, error: "AUTH_LOGIN_PASSWORD_SETUP_REQUIRED" }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { ok: false, error: "AUTH_LOGIN_PASSWORD_TOO_SHORT" },
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
        return NextResponse.json({ ok: false, error: "AUTH_LOGIN_PASSWORD_MISSING" }, { status: 400 });
      }
      // user.passwordHash ist hier sicher gesetzt, aber TS mag's manchmal trotzdem:
      if (!user.passwordHash) {
        return NextResponse.json({ ok: false, error: "AUTH_LOGIN_PASSWORD_NOT_INITIALIZED" }, { status: 500 });
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "AUTH_LOGIN_WRONG_PASSWORD" }, { status: 401 });
      }
    }
  }

  // ADMIN: immer Passwort prüfen
  if (user.role === Role.ADMIN) {
    if (!password) {
      return NextResponse.json({ ok: false, error: "AUTH_LOGIN_PASSWORD_MISSING" }, { status: 400 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ ok: false, error: "AUTH_LOGIN_ADMIN_PASSWORD_NOT_INITIALIZED" }, { status: 500 });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "AUTH_LOGIN_WRONG_PASSWORD" }, { status: 401 });
    }
  }

  const updatedUser =
    user.language === requestedLanguage
      ? user
      : await prisma.appUser.update({
          where: { id: user.id },
          data: {
            language: requestedLanguage as AppLanguage,
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
        });

  const sessionValue = createSessionCookieValue({
    userId: updatedUser.id,
    fullName: updatedUser.fullName,
    role: updatedUser.role,
    language: normalizeAppUiLanguage(updatedUser.language),
    companyId: updatedUser.company.id,
    companyName: updatedUser.company.name,
    companySubdomain: updatedUser.company.subdomain,
    companyIsDemo: updatedUser.company.isDemo,
  });

  const res = NextResponse.json(
    {
      ok: true,
      role: updatedUser.role,
      language: normalizeAppUiLanguage(updatedUser.language),
      company: {
        id: updatedUser.company.id,
        name: updatedUser.company.name,
        subdomain: updatedUser.company.subdomain,
        isDemo: updatedUser.company.isDemo,
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