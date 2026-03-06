import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getAuthedCalendarClient } from "@/lib/googleCalendar";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(v: Record<string, unknown>, key: string): string {
  const x = v[key];
  return typeof x === "string" ? x : "";
}

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function toHHMMUTC(d: Date) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function dateTimeUTCFromYMDHHMM(ymd: string, hhmm: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return null;

  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;

  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0));
}

type CalendarEventDTO = {
  id: string;
  date: string; // YYYY-MM-DD
  startHHMM: string;
  endHHMM: string;
  title: string;
  location: string | null;
  notes: string | null;
};

async function requireAdmin(sessionUserId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: sessionUserId },
    select: { role: true, isActive: true },
  });
  return !!user && user.isActive && user.role === Role.ADMIN;
}

// ✅ Next kann params als Promise liefern -> deshalb await
type Ctx = { params: Promise<{ id: string }> } | { params: { id: string } };

async function getIdFromCtx(ctx: Ctx): Promise<string> {
  const p = (ctx as { params: Promise<{ id: string }> }).params;
  if (typeof (p as unknown as { then?: unknown })?.then === "function") {
    const awaited = await (p as Promise<{ id: string }>);
    return awaited.id;
  }
  return (ctx as { params: { id: string } }).params.id;
}

export async function PUT(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = await requireAdmin(session.userId);
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });

  const id = await getIdFromCtx(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "id fehlt" }, { status: 400 });

  const existing = await prisma.calendarEvent.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Termin nicht gefunden" }, { status: 404 });

  const body: unknown = await req.json().catch(() => null);
  if (!isRecord(body)) return NextResponse.json({ ok: false, error: "Ungültige Daten" }, { status: 400 });

  const date = getString(body, "date").trim();
  const startHHMM = getString(body, "startHHMM").trim();
  const endHHMM = getString(body, "endHHMM").trim();
  const title = getString(body, "title").trim();
  const locationRaw = getString(body, "location").trim();
  const notesRaw = getString(body, "notes").trim();

  if (!date || !startHHMM || !endHHMM || !title) {
    return NextResponse.json({ ok: false, error: "date, startHHMM, endHHMM, title sind Pflicht" }, { status: 400 });
  }

  const startAt = dateTimeUTCFromYMDHHMM(date, startHHMM);
  const endAt = dateTimeUTCFromYMDHHMM(date, endHHMM);
  if (!startAt || !endAt) return NextResponse.json({ ok: false, error: "Ungültiges Datum/Zeit" }, { status: 400 });
  if (endAt <= startAt) return NextResponse.json({ ok: false, error: "Ende muss nach Start liegen" }, { status: 400 });

  const updated = await prisma.calendarEvent.update({
    where: { id: existing.id },
    data: {
      title,
      startAt,
      endAt,
      location: locationRaw ? locationRaw : null,
      notes: notesRaw ? notesRaw : null,
      syncSource: "APP",
    },
  });

  try {
    const googleClient = await getAuthedCalendarClient(session.userId);

    if (googleClient) {
      const { calendar, conn } = googleClient;

      const requestBody = {
        summary: updated.title,
        location: updated.location ?? undefined,
        description: updated.notes ?? undefined,
        start: {
          dateTime: updated.startAt.toISOString(),
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: updated.endAt.toISOString(),
          timeZone: "Europe/Berlin",
        },
      };

      console.log("Updating Google event:", updated.googleEventId);

      if (updated.googleEventId) {
        const googleUpdated = await calendar.events.update({
          calendarId: conn.calendarId || "primary",
          eventId: updated.googleEventId,
          requestBody,
        });

        await prisma.calendarEvent.update({
          where: { id: updated.id },
          data: {
            googleICalUID: googleUpdated.data.iCalUID ?? null,
            googleUpdatedAt: googleUpdated.data.updated
              ? new Date(googleUpdated.data.updated)
              : null,
            googleEtag: googleUpdated.data.etag ?? null,
            syncSource: "APP",
            lastSyncedAt: new Date(),
          },
        });
      } else {
        const googleCreated = await calendar.events.insert({
          calendarId: conn.calendarId || "primary",
          requestBody,
        });

        if (googleCreated.data.id) {
          await prisma.calendarEvent.update({
            where: { id: updated.id },
            data: {
              googleEventId: googleCreated.data.id,
              googleICalUID: googleCreated.data.iCalUID ?? null,
              googleUpdatedAt: googleCreated.data.updated
                ? new Date(googleCreated.data.updated)
                : null,
              googleEtag: googleCreated.data.etag ?? null,
              syncSource: "APP",
              lastSyncedAt: new Date(),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Google update sync failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Termin wurde in der App gespeichert, aber nicht in Google aktualisiert.",
        details: error instanceof Error ? error.message : "Unbekannter Google-Fehler",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    event: {
      id: updated.id,
      date: toIsoDateUTC(updated.startAt),
      startHHMM: toHHMMUTC(updated.startAt),
      endHHMM: toHHMMUTC(updated.endAt),
      title: updated.title,
      location: updated.location ?? null,
      notes: updated.notes ?? null,
    } satisfies CalendarEventDTO,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = await requireAdmin(session.userId);
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });

  const id = await getIdFromCtx(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "id fehlt" }, { status: 400 });

  const existing = await prisma.calendarEvent.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, googleEventId: true },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Termin nicht gefunden" }, { status: 404 });

  try {
    const googleClient = await getAuthedCalendarClient(session.userId);

    if (googleClient && existing.googleEventId) {
      const { calendar, conn } = googleClient;

      await calendar.events.delete({
        calendarId: conn.calendarId || "primary",
        eventId: existing.googleEventId,
      });
    }
  } catch (error) {
    console.error("Google delete sync failed:", error);
  }

  await prisma.calendarEvent.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}