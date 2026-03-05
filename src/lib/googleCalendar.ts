// src/lib/googleCalendar.ts
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getAuthedCalendarClient(userId: string) {
  const conn = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!conn) return null;

  const oAuth2 = getOAuthClient();
  oAuth2.setCredentials({ refresh_token: conn.refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oAuth2 });
  return { calendar, conn };
}