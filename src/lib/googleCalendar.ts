// src/lib/googleCalendar.ts
import { google, type calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

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

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyId: true,
    },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    return null;
  }

  const oAuth2 = getOAuthClient();
  oAuth2.setCredentials({ refresh_token: conn.refreshToken });

  const calendar = google.calendar({
    version: "v3",
    auth: oAuth2,
  });

  return { calendar, conn };
}

type SyncGoogleEventArgs = {
  userId: string;
};

type RegisterGoogleWatchArgs = {
  userId: string;
};

export async function registerGoogleCalendarWatch({
  userId,
}: RegisterGoogleWatchArgs): Promise<void> {
  const client = await getAuthedCalendarClient(userId);
  if (!client) {
    throw new Error("Google nicht verbunden");
  }

  const { calendar, conn } = client;

  const appBaseUrl = process.env.APP_BASE_URL;
  const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET;

  if (!appBaseUrl || !webhookSecret) {
    throw new Error("APP_BASE_URL oder GOOGLE_WEBHOOK_SECRET fehlt");
  }

  const webhookAddress = `${appBaseUrl}/api/admin/google/webhook`;
  const channelId = randomUUID();

  const response = await calendar.events.watch({
    calendarId: conn.calendarId || "primary",
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: webhookAddress,
      token: webhookSecret,
    },
  });

  const resourceId = response.data.resourceId ?? null;
  const expirationRaw = response.data.expiration ?? null;

  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      channelId,
      resourceId,
      channelExpiration: expirationRaw
        ? new Date(Number(expirationRaw))
        : null,
    },
  });
}

export async function syncGoogleCalendarToApp({
  userId,
}: SyncGoogleEventArgs): Promise<void> {
  const client = await getAuthedCalendarClient(userId);
  if (!client) {
    throw new Error("Google nicht verbunden");
  }

  const { calendar, conn } = client;

  let pageToken: string | undefined = undefined;
  let nextSyncToken: string | undefined = undefined;

  do {
    const response: { data: calendar_v3.Schema$Events } =
      await calendar.events.list({
        calendarId: conn.calendarId || "primary",
        singleEvents: true,
        showDeleted: true,
        maxResults: 250,
        pageToken,
        syncToken: conn.syncToken || undefined,
      });

    const items: calendar_v3.Schema$Event[] = Array.isArray(response.data.items)
      ? response.data.items
      : [];

    for (const ev of items) {
      const gId = ev.id ?? null;
      const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : null;
      const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : null;

      if (!gId) continue;

      if (ev.status === "cancelled") {
        await prisma.calendarEvent.deleteMany({
          where: {
            userId,
            googleEventId: gId,
          },
        });
        continue;
      }

      if (!start || !end) continue;

      const title = ev.summary?.trim() || "(Ohne Titel)";
      const location = ev.location?.trim() || null;
      const notes = ev.description?.trim() || null;

      await prisma.calendarEvent.upsert({
        where: { googleEventId: gId },
        create: {
          userId,
          title,
          startAt: start,
          endAt: end,
          location,
          notes,
          googleEventId: gId,
          googleICalUID: ev.iCalUID ?? null,
          googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
          googleEtag: ev.etag ?? null,
          syncSource: "GOOGLE",
          lastSyncedAt: new Date(),
        },
        update: {
          title,
          startAt: start,
          endAt: end,
          location,
          notes,
          googleICalUID: ev.iCalUID ?? null,
          googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
          googleEtag: ev.etag ?? null,
          syncSource: "GOOGLE",
          lastSyncedAt: new Date(),
        },
      });
    }

    pageToken = response.data.nextPageToken ?? undefined;
    nextSyncToken = response.data.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  if (nextSyncToken) {
    await prisma.googleCalendarConnection.update({
      where: { userId },
      data: { syncToken: nextSyncToken },
    });
  }
}