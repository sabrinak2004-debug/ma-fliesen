import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getAuthedCalendarClient } from "@/lib/googleCalendar";
import {
  utcFromLocalDateTime,
  toGoogleDateTime,
  toIsoDateUTC,
  toHHMMUTC
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


async function requireAdmin(sessionUserId: string, sessionCompanyId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyId: true,
    },
  });

  if (!user || !user.isActive || user.role !== Role.ADMIN) {
    return null;
  }

  if (user.companyId !== sessionCompanyId) {
    return null;
  }

  return user;
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
  if (!session?.userId || !session.companyId) {
    return NextResponse.json({ ok: false, error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const admin = await requireAdmin(session.userId, session.companyId);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const id = await getIdFromCtx(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });

  const existing = await prisma.calendarEvent.findFirst({
    where: {
      id,
      userId: admin.id,
      user: {
        companyId: admin.companyId,
      },
    },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "APPOINTMENT_NOT_FOUND" }, { status: 404 });

  const body: unknown = await req.json().catch(() => null);
  if (!isRecord(body)) return NextResponse.json({ ok: false, error: "INVALID_DATA" }, { status: 400 });

  const date = getString(body, "date").trim();
  const startHHMM = getString(body, "startHHMM").trim();
  const endHHMM = getString(body, "endHHMM").trim();
  const title = getString(body, "title").trim();
  const locationRaw = getString(body, "location").trim();
  const notesRaw = getString(body, "notes").trim();

  if (!date || !startHHMM || !endHHMM || !title) {
    return NextResponse.json({ ok: false, error: "MISSING_REQUIRED_FIELDS" }, { status: 400 });
  }

  const startAt = utcFromLocalDateTime(date, startHHMM);
  const endAt = utcFromLocalDateTime(date, endHHMM);
  if (!startAt || !endAt) return NextResponse.json({ ok: false, error: "INVALID_DATE_TIME" }, { status: 400 });
  if (endAt <= startAt) return NextResponse.json({ ok: false, error: "END_MUST_BE_AFTER_START" }, { status: 400 });

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
    const googleClient = await getAuthedCalendarClient(admin.id);

    if (googleClient) {
      const { calendar, conn } = googleClient;

    const requestBody = {
      summary: updated.title,
      location: updated.location ?? undefined,
      description: updated.notes ?? undefined,
      start: {
        dateTime: toGoogleDateTime(updated.startAt),
        timeZone: "Europe/Berlin",
      },
      end: {
        dateTime: toGoogleDateTime(updated.endAt),
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
        error: "GOOGLE_SYNC_UPDATE_FAILED",
        details: error instanceof Error ? error.message : "UNKNOWN_GOOGLE_ERROR",
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
  if (!session?.userId || !session.companyId) {
    return NextResponse.json({ ok: false, error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const admin = await requireAdmin(session.userId, session.companyId);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const id = await getIdFromCtx(ctx);
  if (!id) return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });

  const existing = await prisma.calendarEvent.findFirst({
    where: {
      id,
      userId: admin.id,
      user: {
        companyId: admin.companyId,
      },
    },
    select: { id: true, googleEventId: true },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "APPOINTMENT_NOT_FOUND" }, { status: 404 });

  try {
    const googleClient = await getAuthedCalendarClient(admin.id);

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