import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getAuthedCalendarClient } from "@/lib/googleCalendar";
import {
  utcFromLocalDateTime,
  toGoogleDateTime,
  toIsoDateUTC,
  toHHMMUTC,
} from "@/lib/time";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(v: Record<string, unknown>, key: string): string {
  const x = v[key];
  return typeof x === "string" ? x : "";
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
    select: { id: true, role: true, isActive: true, companyId: true },
  });

  if (!user || !user.isActive || user.role !== Role.ADMIN || !user.companyId) {
    return null;
  }

  return user;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  const admin = await requireAdmin(session.userId);
  if (!admin) return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });

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
    rangeFrom = utcFromLocalDateTime(date, "00:00");
    rangeTo = utcFromLocalDateTime(date, "23:59");
  } else {
    if (!from || !to) {
      return NextResponse.json({ ok: false, error: "from/to oder date fehlt" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ ok: false, error: "from/to Format muss YYYY-MM-DD sein" }, { status: 400 });
    }
    rangeFrom = utcFromLocalDateTime(from, "00:00");
    rangeTo = utcFromLocalDateTime(to, "23:59");
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

  const startAt = utcFromLocalDateTime(date, startHHMM);
  const endAt = utcFromLocalDateTime(date, endHHMM);
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
      syncSource: "APP",
    },
  });

  try {
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
            dateTime: toGoogleDateTime(created.startAt),
            timeZone: "Europe/Berlin",
          },
          end: {
            dateTime: toGoogleDateTime(created.endAt),
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
  } catch (error) {
    console.error("Google create sync failed:", error);
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