// src/app/api/admin/google/callback/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOAuthClient, registerGoogleCalendarWatch } from "@/lib/googleCalendar";

type OAuthState = {
  userId: string;
  companyId: string;
};

function parseOAuthState(rawState: string): OAuthState | null {
  try {
    const decoded = Buffer.from(rawState, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (
      typeof record.userId !== "string" ||
      typeof record.companyId !== "string"
    ) {
      return null;
    }

    return {
      userId: record.userId,
      companyId: record.companyId,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ ok: false, error: "code/state fehlt" }, { status: 400 });
  }

  const parsedState = parseOAuthState(state);

  if (!parsedState) {
    return NextResponse.json({ ok: false, error: "Ungültiger state." }, { status: 400 });
  }

  const adminUser = await prisma.appUser.findUnique({
    where: { id: parsedState.userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyId: true,
    },
  });

  if (
    !adminUser ||
    !adminUser.isActive ||
    adminUser.role !== "ADMIN" ||
    adminUser.companyId !== parsedState.companyId
  ) {
    return NextResponse.json(
      { ok: false, error: "Admin/Firma ungültig." },
      { status: 403 }
    );
  }

  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);

  // refresh_token kommt nur beim ersten consent zuverlässig -> prompt: "consent" oben ist wichtig
  if (!tokens.refresh_token) {
    return NextResponse.json(
      { ok: false, error: "Kein refresh_token erhalten. Bitte Verbindung trennen und erneut verbinden." },
      { status: 400 }
    );
  }

  await prisma.googleCalendarConnection.upsert({
    where: { userId: parsedState.userId },
    create: {
      userId: parsedState.userId,
      refreshToken: tokens.refresh_token,
      calendarId: "primary",
    },
    update: {
      refreshToken: tokens.refresh_token,
      calendarId: "primary",
      syncToken: null,
      channelId: null,
      resourceId: null,
      channelExpiration: null,
    },
  });

  const base = process.env.APP_BASE_URL || "http://localhost:3000";

  try {
    await registerGoogleCalendarWatch({ userId: parsedState.userId });
  } catch (error) {
    console.error("Watch registration after callback failed:", error);
  }

  return NextResponse.redirect(`${base}/kalender?google=connected`);
}