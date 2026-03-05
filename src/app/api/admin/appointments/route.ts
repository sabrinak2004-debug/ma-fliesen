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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = await requireAdmin(session.userId);
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  let rangeFrom: Date | null = null;
  let rangeTo: Date | null = null;

  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: "date Format muss YYYY-MM-DD sein" }, { status: 400 });
    }
    // Ganzer Tag in UTC: [00:00, 24:00)
    rangeFrom = dateTimeUTCFromYMDHHMM(date, "00:00");
    const nextDay = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)) + 1));
    rangeTo = nextDay;
  } else {
    if (!from || !to) {
      return NextResponse.json({ ok: false, error: "from/to oder date fehlt" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ ok: false, error: "from/to Format muss YYYY-MM-DD sein" }, { status: 400 });
    }
    rangeFrom = dateTimeUTCFromYMDHHMM(from, "00:00");
    rangeTo = dateTimeUTCFromYMDHHMM(to, "00:00");
  }

  if (!rangeFrom || !rangeTo) {
    return NextResponse.json({ ok: false, error: "Ungültiger Zeitraum" }, { status: 400 });
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: session.userId,
      startAt: { gte: rangeFrom, lt: rangeTo },
    },
    orderBy: [{ startAt: "asc" }],
  });

  const dto: CalendarEventDTO[] = events.map((e) => ({
    id: e.id,
    date: toIsoDateUTC(e.startAt),
    startHHMM: toHHMMUTC(e.startAt),
    endHHMM: toHHMMUTC(e.endAt),
    title: e.title,
    location: e.location ?? null,
    notes: e.notes ?? null,
  }));

  return NextResponse.json({ ok: true, events: dto });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = await requireAdmin(session.userId);
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });

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

  const created = await prisma.calendarEvent.create({
    data: {
      userId: session.userId,
      title,
      startAt,
      endAt,
      location: locationRaw ? locationRaw : null,
      notes: notesRaw ? notesRaw : null,
    },
  });

    // ===== App -> Google Sync (create) =====
  const googleClient = await getAuthedCalendarClient(session.userId);

  if (googleClient) {
    const { calendar, conn } = googleClient;

    const googleCreated = await calendar.events.insert({
      calendarId: conn.calendarId || "primary",
      requestBody: {
        summary: created.title,
        location: created.location ?? undefined,
        description: created.notes ?? undefined,
        start: {
          dateTime: created.startAt.toISOString(),
          timeZone: "Europe/Berlin",
        },
        end: {
          dateTime: created.endAt.toISOString(),
          timeZone: "Europe/Berlin",
        },
      },
    });

    if (googleCreated.data.id) {
      await prisma.calendarEvent.update({
        where: { id: created.id },
        data: {
          googleEventId: googleCreated.data.id,
          googleICalUID: googleCreated.data.iCalUID ?? null,
          googleUpdatedAt: googleCreated.data.updated ? new Date(googleCreated.data.updated) : null,
          googleEtag: googleCreated.data.etag ?? null,
          syncSource: "APP",
          lastSyncedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    event: {
      id: created.id,
      date: toIsoDateUTC(created.startAt),
      startHHMM: toHHMMUTC(created.startAt),
      endHHMM: toHHMMUTC(created.endAt),
      title: created.title,
      location: created.location ?? null,
      notes: created.notes ?? null,
    } satisfies CalendarEventDTO,
  });
}