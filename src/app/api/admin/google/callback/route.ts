// src/app/api/admin/google/callback/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOAuthClient, registerGoogleCalendarWatch } from "@/lib/googleCalendar";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId

  if (!code || !state) {
    return NextResponse.json({ ok: false, error: "code/state fehlt" }, { status: 400 });
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
    where: { userId: state },
    create: {
      userId: state,
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
    await registerGoogleCalendarWatch({ userId: state });
  } catch (error) {
    console.error("Watch registration after callback failed:", error);
  }

  return NextResponse.redirect(`${base}/kalender?google=connected`);
}