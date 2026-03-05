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

const BREAK_BLOCK_MIN = 15; // wenn du auf 15-Min-Blöcke runden willst

function requiredLegalBreakMinutesByGrossDay(dayGrossMinutes: number) {
  if (dayGrossMinutes > 9 * 60) return 45;
  if (dayGrossMinutes > 6 * 60) return 30;
  return 0;
}

function roundUpToBlock(mins: number, block = BREAK_BLOCK_MIN) {
  if (block <= 1) return mins;
  return Math.ceil(mins / block) * block;
}

/**
 * Erzwingt gesetzliche Pause auf TAGESBASIS:
 * - summiert grossMinutes & manuelle breakMinutes aller Einträge
 * - berechnet fehlende Pause
 * - hängt fehlende Pause an EINEN Eintrag (standard: letzter Eintrag des Tages)
 * - setzt workMinutes für alle Einträge korrekt (gross - break)
 */
async function enforceDailyLegalBreak(userId: string, workDateYMD: string) {
  const workDate = dateOnly(workDateYMD);

  const entries = await prisma.workEntry.findMany({
    where: { userId, workDate },
    orderBy: [{ endTime: "asc" }, { startTime: "asc" }], // letzter Eintrag = "spätester"
    select: { id: true, grossMinutes: true, breakMinutes: true },
  });

  if (entries.length === 0) return;

  const dayGross = entries.reduce((sum, e) => sum + (e.grossMinutes ?? 0), 0);
  const required = requiredLegalBreakMinutesByGrossDay(dayGross);

  const manualTotal = entries.reduce((sum, e) => sum + (e.breakMinutes ?? 0), 0);

  const missingRaw = Math.max(0, required - manualTotal);
  const missing = roundUpToBlock(missingRaw); // falls du exakt willst: nimm missingRaw

  // Reset: alle Einträge erstmal "nur manuell" rechnen
  await prisma.$transaction(
    entries.map((e) => {
      const manual = Math.max(0, e.breakMinutes ?? 0);
      const gross = Math.max(0, e.grossMinutes ?? 0);
      return prisma.workEntry.update({
        where: { id: e.id },
        data: {
          breakAuto: false,
          // workMinutes IMMER aus (gross - breakMinutes)
          workMinutes: Math.max(0, gross - manual),
        },
      });
    })
  );

  if (missing <= 0) return;

  // Fehlende Pause an den letzten Eintrag hängen
  const target = entries[entries.length - 1];
  const targetManual = Math.max(0, target.breakMinutes ?? 0);
  const targetGross = Math.max(0, target.grossMinutes ?? 0);

  const finalBreak = targetManual + missing;

  await prisma.workEntry.update({
    where: { id: target.id },
    data: {
      breakMinutes: finalBreak,
      breakAuto: true,
      workMinutes: Math.max(0, targetGross - finalBreak),
    },
  });
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

// ---- Tagesweise gruppieren und Pflichtpause erzwingen (für Response) ----
type Row = (typeof rows)[number];

function requiredLegalBreakMinutesByGrossDay(dayGrossMinutes: number) {
  if (dayGrossMinutes > 9 * 60) return 45;
  if (dayGrossMinutes > 6 * 60) return 30;
  return 0;
}

const groups = new Map<string, Row[]>();

for (const r of rows) {
  const ymd = toIsoDateUTC(r.workDate);
  const key = `${r.userId}|${ymd}`;
  const arr = groups.get(key) ?? [];
  arr.push(r);
  groups.set(key, arr);
}

// Für stabile "letzter Eintrag" Logik: nach Ende/Start sortieren
for (const arr of groups.values()) {
  arr.sort((a, b) => {
    const ae = a.endTime.getTime() - b.endTime.getTime();
    if (ae !== 0) return ae;
    return a.startTime.getTime() - b.startTime.getTime();
  });
}

const patched = new Map<string, { breakMinutes: number; breakAuto: boolean; workMinutes: number; grossMinutes: number }>();

for (const [key, arr] of groups.entries()) {
  const dayGross = arr.reduce((s, e) => s + (e.grossMinutes ?? 0), 0);
  const required = requiredLegalBreakMinutesByGrossDay(dayGross);

  const manualTotal = arr.reduce((s, e) => s + (e.breakMinutes ?? 0), 0);
  const missing = Math.max(0, required - manualTotal);

  // Erst: alle Einträge nur mit ihren manuellen Pausen rechnen
  for (const e of arr) {
    const gross = Math.max(0, e.grossMinutes ?? 0);
    const br = Math.max(0, e.breakMinutes ?? 0);
    patched.set(e.id, {
      grossMinutes: gross,
      breakMinutes: br,
      breakAuto: false,
      workMinutes: Math.max(0, gross - br),
    });
  }

  // Dann: fehlende Pflichtpause an letzten Eintrag hängen
  if (missing > 0) {
    const last = arr[arr.length - 1];
    const lastP = patched.get(last.id);
    if (lastP) {
      const newBreak = lastP.breakMinutes + missing;
      patched.set(last.id, {
        ...lastP,
        breakMinutes: newBreak,
        breakAuto: true,
        workMinutes: Math.max(0, lastP.grossMinutes - newBreak),
      });
    }
  }
}

// Jetzt Response bauen – aber mit gepatchten Werten
const entries: EntryDTO[] = rows.map((e) => {
  const p = patched.get(e.id);
  return {
    id: e.id,
    workDate: toIsoDateUTC(e.workDate),
    startTime: toHHMMUTC(e.startTime),
    endTime: toHHMMUTC(e.endTime),
    activity: e.activity ?? "",
    location: e.location ?? "",
    travelMinutes: e.travelMinutes ?? 0,
    grossMinutes: p?.grossMinutes ?? (e.grossMinutes ?? 0),
    breakMinutes: p?.breakMinutes ?? (e.breakMinutes ?? 0),
    breakAuto: p?.breakAuto ?? (e.breakAuto ?? false),
    workMinutes: p?.workMinutes ?? (e.workMinutes ?? 0),
    user: { id: e.user.id, fullName: e.user.fullName },
  };
});

return NextResponse.json({ entries });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;

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
      workMinutes: Math.max(0, diffMin - manualBreak),
    },
    include: { user: { select: { id: true, fullName: true } } },
  });

// ✅ Tagespause für diesen User+Tag neu berechnen (wegen mehreren Einträgen am Tag)
await enforceDailyLegalBreak(targetUserId, workDate);

// ✅ Eintrag nochmal frisch laden (weil enforceDailyLegalBreak break/workMinutes ändern kann)
const createdFresh = await prisma.workEntry.findUnique({
  where: { id: created.id },
  include: { user: { select: { id: true, fullName: true } } },
});

if (!createdFresh) {
  return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 500 });
}

  const entry: EntryDTO = {
    id: createdFresh.id,
    workDate: toIsoDateUTC(createdFresh.workDate),
    startTime: toHHMMUTC(createdFresh.startTime),
    endTime: toHHMMUTC(createdFresh.endTime),
    activity: createdFresh.activity ?? "",
    location: createdFresh.location ?? "",
    travelMinutes: createdFresh.travelMinutes ?? 0,
    workMinutes: createdFresh.workMinutes ?? 0,
    grossMinutes: createdFresh.grossMinutes ?? 0,
    breakMinutes: createdFresh.breakMinutes ?? 0,
    breakAuto: createdFresh.breakAuto ?? false,
    user: { id: createdFresh.user.id, fullName: createdFresh.user.fullName },
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

  // ✅ Admin darf bearbeiten, aber NICHT Datum/Zeit ändern:
  // Admin braucht daher KEINE workDate/startTime/endTime im Body.
  const workDate = isAdmin ? toIsoDateUTC(existing.workDate) : getString(body.workDate);
  const startTime = isAdmin ? toHHMMUTC(existing.startTime) : getString(body.startTime);
  const endTime = isAdmin ? toHHMMUTC(existing.endTime) : getString(body.endTime);

  // Felder, die Admin ändern darf (alles andere bleibt wie in DB)
  const activity = isAdmin ? getString(body.activity).trim() || (existing.activity ?? "") : getString(body.activity).trim();
  const location = isAdmin ? getString(body.location).trim() || (existing.location ?? "") : getString(body.location).trim();

  // Für EMPLOYEE bleiben deine Pflichtfelder bestehen
  if (!isAdmin && (!workDate || !startTime || !endTime || !activity)) {
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
      workMinutes: Math.max(0, diffMin - manualBreak),
    },
    include: { user: { select: { id: true, fullName: true } } },
  });

  // ✅ Tagespause neu berechnen (weil dieser Tag mehrere Einträge hat)
await enforceDailyLegalBreak(targetUserId, workDate);

// ✅ Eintrag frisch laden (kann sich geändert haben)
const updatedFresh = await prisma.workEntry.findUnique({
  where: { id: updated.id },
  include: { user: { select: { id: true, fullName: true } } },
});

if (!updatedFresh) {
  return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 500 });
}

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

  const deleted = await prisma.workEntry.delete({ where: { id } });

  // ✅ nach Delete Tagespause neu berechnen (falls noch Einträge am Tag existieren)
  const ymd = toIsoDateUTC(deleted.workDate);
  await enforceDailyLegalBreak(deleted.userId, ymd);

  return NextResponse.json({ ok: true });
}