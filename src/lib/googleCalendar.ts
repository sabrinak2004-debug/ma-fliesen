// src/lib/googleCalendar.ts
import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";

export type AuthedCalendarClient = {
  calendar: calendar_v3.Calendar;
  conn: {
    id: string;
    userId: string;
    refreshToken: string;
    calendarId: string;
    syncToken: string | null;
    channelId: string | null;
    resourceId: string | null;
    channelExpiration: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth Umgebungsvariablen fehlen.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getAuthedCalendarClient(
  userId: string
): Promise<AuthedCalendarClient | null> {
  const conn = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });

  if (!conn) return null;

  const oAuth2 = getOAuthClient();
  oAuth2.setCredentials({ refresh_token: conn.refreshToken });

  const calendar = google.calendar({
    version: "v3",
    auth: oAuth2,
  });

  return { calendar, conn };
}