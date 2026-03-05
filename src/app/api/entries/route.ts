import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

function dateOnly(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}
function timeOnly(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
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

function berlinTodayYMD(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${d}`;
}

function assertEmployeeMayEditDate(role: Role, workDateYMD: string) {
  if (role === Role.ADMIN) return;

  const today = berlinTodayYMD();
  if (workDateYMD !== today) {
    throw new Error("Du kannst Einträge nur am selben Tag bearbeiten.");
  }
}


type EntryBody = {
  id?: unknown;

  // ✅ NEU: optional userId (nur Admin sinnvoll)
  userId?: unknown;

  workDate?: unknown; // YYYY-MM-DD
  startTime?: unknown; // HH:MM
  endTime?: unknown; // HH:MM
  activity?: unknown;
  location?: unknown;
  travelMinutes?: unknown;
  breakMinutes?: unknown; // optional: Pause in Minuten
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function getNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type EntryDTO = {
  id: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  user: { id: string; fullName: string };
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;
  const userWhere = isAdmin ? {} : { userId: session.userId };

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // optional YYYY-MM

  let from: Date | undefined;
  let to: Date | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  }

  const rows = await prisma.workEntry.findMany({
    where: {
      ...userWhere,
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ workDate: "desc" }, { startTime: "desc" }],
  });

  const entries: EntryDTO[] = rows.map((e) => ({
    id: e.id,
    workDate: toIsoDateUTC(e.workDate),
    startTime: toHHMMUTC(e.startTime),
    endTime: toHHMMUTC(e.endTime),
    activity: e.activity ?? "",
    location: e.location ?? "",
    travelMinutes: e.travelMinutes ?? 0,
    workMinutes: e.workMinutes ?? 0,
    grossMinutes: e.grossMinutes ?? 0,
    breakMinutes: e.breakMinutes ?? 0,
    breakAuto: e.breakAuto ?? false,
    user: { id: e.user.id, fullName: e.user.fullName },
  }));

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;
    if (isAdmin) {
    return NextResponse.json({ error: "Admins dürfen keine Arbeitszeiten erfassen." }, { status: 403 });
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? (raw as EntryBody) : {};

  // ✅ Admin darf bearbeiten, aber Start/Ende (und standardmäßig auch Datum) bleiben wie in DB
  const workDate = getString(body.workDate);
  const startTime = getString(body.startTime);
  const endTime = getString(body.endTime);
  const activity = getString(body.activity).trim();
  const location = getString(body.location).trim();

  if (!workDate || !startTime || !endTime || !activity) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }
  // ✅ Lock: Mitarbeiter darf nur "heute" (Europe/Berlin) anlegen
  try {
    assertEmployeeMayEditDate(session.role, workDate);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Nicht erlaubt";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const breakInput = getNumber(body.breakMinutes);
  const manualBreak = Number.isFinite(breakInput) && breakInput > 0 ? Math.max(0, Math.round(breakInput)) : 0;

  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  // ✅ DEFAULT: immer Session-User
  let targetUserId = session.userId;

  // ✅ Admin darf optional userId mitgeben (z.B. später per Dropdown)
  if (isAdmin) {
    const requestedUserId = getString(body.userId).trim();
    if (requestedUserId) {
      const u = await prisma.appUser.findUnique({ where: { id: requestedUserId } });
      if (!u || !u.isActive) {
        return NextResponse.json({ error: "Mitarbeiter nicht gefunden oder inaktiv." }, { status: 400 });
      }
      targetUserId = u.id;
    }
  }

  const created = await prisma.workEntry.create({
    data: {
      userId: targetUserId,
      workDate: dateOnly(workDate),
      startTime: timeOnly(startTime),
      endTime: timeOnly(endTime),
      activity,
      location,
      travelMinutes: travelMinutesNum,
      grossMinutes: diffMin,
      breakMinutes: manualBreak,
      breakAuto: false,
      workMinutes: diffMin,
    },
    include: { user: { select: { id: true, fullName: true } } },
  });

  const entry: EntryDTO = {
    id: created.id,
    workDate: toIsoDateUTC(created.workDate),
    startTime: toHHMMUTC(created.startTime),
    endTime: toHHMMUTC(created.endTime),
    activity: created.activity ?? "",
    location: created.location ?? "",
    travelMinutes: created.travelMinutes ?? 0,
    workMinutes: created.workMinutes ?? 0,
    grossMinutes: created.grossMinutes ?? 0,
    breakMinutes: created.breakMinutes ?? 0,
    breakAuto: created.breakAuto ?? false,
    user: { id: created.user.id, fullName: created.user.fullName },
  };

  return NextResponse.json({ entry });
}

/**
 * ✅ UPDATE / Bearbeiten
 * Erwartet JSON:
 * {
 *   id: string,
 *   userId?: string (nur Admin, optional um User zu wechseln),
 *   workDate: YYYY-MM-DD,
 *   startTime: HH:MM,
 *   endTime: HH:MM,
 *   activity: string,
 *   location?: string,
 *   travelMinutes?: number|string
 * }
 */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const isAdmin = session.role === Role.ADMIN;


  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? (raw as EntryBody) : {};

  const id = getString(body.id).trim();
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const existing = await prisma.workEntry.findUnique({
    where: { id },
    include: { user: { select: { id: true, fullName: true, isActive: true } } },
  });

  if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (!isAdmin && existing.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  // ✅ Lock nur für EMPLOYEE
  if (!isAdmin) {
    const existingYMD = toIsoDateUTC(existing.workDate);
    try {
      assertEmployeeMayEditDate(session.role, existingYMD);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Nicht erlaubt";
      return NextResponse.json({ error: msg }, { status: 403 });
    }
  }

  // ✅ Admin darf bearbeiten, aber Start/Ende (und standardmäßig auch Datum) bleiben wie in DB
  const workDate = isAdmin ? toIsoDateUTC(existing.workDate) : getString(body.workDate);
  const startTime = isAdmin ? toHHMMUTC(existing.startTime) : getString(body.startTime);
  const endTime = isAdmin ? toHHMMUTC(existing.endTime) : getString(body.endTime);
  const activity = getString(body.activity).trim();
  const location = getString(body.location).trim();

  if (!workDate || !startTime || !endTime || !activity) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  // ✅ Lock nur für EMPLOYEE (Admin ändert Datum hier ohnehin nicht)
  if (!isAdmin) {
    try {
      assertEmployeeMayEditDate(session.role, workDate);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Nicht erlaubt";
      return NextResponse.json({ error: msg }, { status: 403 });
    }
  }

  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const breakInput = getNumber(body.breakMinutes);
  const manualBreak = Number.isFinite(breakInput) && breakInput > 0 ? Math.max(0, Math.round(breakInput)) : 0;

  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  let targetUserId = existing.userId;

  // ✅ Admin darf optional umhängen via userId
  if (isAdmin) {
    const requestedUserId = getString(body.userId).trim();
    if (requestedUserId) {
      const u = await prisma.appUser.findUnique({ where: { id: requestedUserId } });
      if (!u || !u.isActive) {
        return NextResponse.json({ error: "Mitarbeiter nicht gefunden oder inaktiv." }, { status: 400 });
      }
      targetUserId = u.id;
    }
  }

  const updated = await prisma.workEntry.update({
    where: { id },
    data: {
      userId: targetUserId,
      workDate: dateOnly(workDate),
      startTime: timeOnly(startTime),
      endTime: timeOnly(endTime),
      activity,
      location,
      travelMinutes: travelMinutesNum,
      grossMinutes: diffMin,
      breakMinutes: manualBreak,
      breakAuto: false,
      workMinutes: diffMin,
    },
    include: { user: { select: { id: true, fullName: true } } },
  });

  const entry: EntryDTO = {
    id: updated.id,
    workDate: toIsoDateUTC(updated.workDate),
    startTime: toHHMMUTC(updated.startTime),
    endTime: toHHMMUTC(updated.endTime),
    activity: updated.activity ?? "",
    location: updated.location ?? "",
    travelMinutes: updated.travelMinutes ?? 0,
    workMinutes: updated.workMinutes ?? 0,
    grossMinutes: updated.grossMinutes ?? 0,
    breakMinutes: updated.breakMinutes ?? 0,
    breakAuto: updated.breakAuto ?? false,
    user: { id: updated.user.id, fullName: updated.user.fullName },
  };

  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const e = await prisma.workEntry.findUnique({ where: { id } });
  if (!e) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (!isAdmin && e.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  // ✅ Lock nur für EMPLOYEE, Admin darf immer löschen
  if (!isAdmin) {
    const ymd = toIsoDateUTC(e.workDate);
    try {
      assertEmployeeMayEditDate(session.role, ymd);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nicht erlaubt";
      return NextResponse.json({ error: msg }, { status: 403 });
    }
  }

  await prisma.workEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}