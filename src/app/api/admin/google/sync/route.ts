// src/app/api/admin/google/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getAuthedCalendarClient } from "@/lib/googleCalendar";
import type { calendar_v3 } from "googleapis";

async function requireAdmin(userId: string) {
  const u = await prisma.appUser.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
  return !!u && u.isActive && u.role === Role.ADMIN;
}

export async function POST() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  if (!(await requireAdmin(session.userId))) return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });

  const client = await getAuthedCalendarClient(session.userId);
  if (!client) return NextResponse.json({ ok: false, error: "Google nicht verbunden" }, { status: 400 });

  const { calendar, conn } = client;

  // incremental sync:
  // - 1. Mal ohne syncToken (initial load)
  // - danach mit conn.syncToken
  let pageToken: string | undefined = undefined;
  let nextSyncToken: string | undefined = undefined;

  try {
    do {
      const rawResponse = await calendar.events.list({
        calendarId: conn.calendarId || "primary",
        singleEvents: true,
        showDeleted: true,
        maxResults: 250,
        pageToken,
        syncToken: conn.syncToken || undefined,
      });

      const listResponse = rawResponse as { data: calendar_v3.Schema$Events };
      const items = Array.isArray(listResponse.data.items) ? listResponse.data.items : [];

      for (const ev of items) {
        // wir syncen nur "timed events"
        const gId = ev.id || null;
        const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : null;
        const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : null;

        if (!gId) continue;

        // gelöschte events entfernen
        if (ev.status === "cancelled") {
          await prisma.calendarEvent.deleteMany({
            where: { userId: session.userId, googleEventId: gId },
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
            userId: session.userId,
            title,
            startAt: start,
            endAt: end,
            location,
            notes,

            googleEventId: gId,
            googleICalUID: ev.iCalUID || null,
            googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
            googleEtag: ev.etag || null,
            syncSource: "GOOGLE",
            lastSyncedAt: new Date(),
          },
          update: {
            title,
            startAt: start,
            endAt: end,
            location,
            notes,

            googleICalUID: ev.iCalUID || null,
            googleUpdatedAt: ev.updated ? new Date(ev.updated) : null,
            googleEtag: ev.etag || null,
            syncSource: "GOOGLE",
            lastSyncedAt: new Date(),
          },
        });
      }

      pageToken = listResponse.data.nextPageToken || undefined;
      nextSyncToken = listResponse.data.nextSyncToken || nextSyncToken;
    } while (pageToken);

    if (nextSyncToken) {
      await prisma.googleCalendarConnection.update({
        where: { userId: session.userId },
        data: { syncToken: nextSyncToken },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    await prisma.googleCalendarConnection.update({
      where: { userId: session.userId },
      data: { syncToken: null },
    });

    return NextResponse.json(
      { ok: false, error: "Sync fehlgeschlagen (syncToken reset). Bitte erneut syncen." },
      { status: 500 }
    );
  }
}