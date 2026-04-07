import { NextResponse } from "next/server";
import { type AppLanguage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  createSessionCookieValue,
  getSession,
} from "@/lib/auth";
import { normalizeAppUiLanguage } from "@/lib/i18n";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(req: Request): Promise<Response> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  let body: unknown = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Body." },
      { status: 400 }
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Body." },
      { status: 400 }
    );
  }

  const language = normalizeAppUiLanguage(
    getString(body["language"]).trim().toUpperCase()
  );

  const user = await prisma.appUser.update({
    where: { id: session.userId },
    data: {
      language: language as AppLanguage,
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
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    language,
    companyId: user.company.id,
    companyName: user.company.name,
    companySubdomain: user.company.subdomain,
    companyIsDemo: user.company.isDemo,
  });

  const response = NextResponse.json({
    ok: true,
    language,
  });

  response.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  });

  return response;
}