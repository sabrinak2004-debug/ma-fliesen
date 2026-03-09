import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assertEmployeeMayEditDate } from "@/lib/timesheetLock";
import { computeDayBreakFromGross } from "@/lib/breaks";

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

type EntryBody = {
  id?: unknown;
  userId?: unknown;
  workDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  activity?: unknown;
  location?: unknown;
  travelMinutes?: unknown;
  noteEmployee?: unknown;
};

type EntryDTO = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string;
  user: { id: string; fullName: string };
};

type DayBreakDTO = {
  id: string;
  workDate: string;
  breakStartHHMM: string | null;
  breakEndHHMM: string | null;
  manualMinutes: number;
  legalMinutes: number;
  autoSupplementMinutes: number;
  effectiveMinutes: number;
};

type WorkEntryRow = {
  id: string;
  userId: string;
  workDate: Date;
  startTime: Date;
  endTime: Date;
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string | null;
  user: {
    id: string;
    fullName: string;
  };
};

async function syncDailyBreakAllocation(userId: string, workDateYMD: string) {
  const workDate = dateOnly(workDateYMD);

  const [entries, existingDayBreak] = await prisma.$transaction([
    prisma.workEntry.findMany({
      where: { userId, workDate },
      orderBy: [{ endTime: "asc" }, { startTime: "asc" }],
      select: { id: true, grossMinutes: true },
    }),
    prisma.dayBreak.findUnique({
      where: { userId_workDate: { userId, workDate } },
    }),
  ]);

  if (entries.length === 0) {
    if (existingDayBreak) {
      await prisma.dayBreak.delete({
        where: { userId_workDate: { userId, workDate } },
      });
    }
    return;
  }

  const dayGross = entries.reduce((sum, entry) => sum + Math.max(0, entry.grossMinutes), 0);
  const manualMinutes = existingDayBreak?.manualMinutes ?? 0;
  const result = computeDayBreakFromGross(dayGross, manualMinutes);

  if (existingDayBreak) {
    await prisma.dayBreak.update({
      where: { userId_workDate: { userId, workDate } },
      data: {
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      },
    });
  } else {
    await prisma.dayBreak.create({
      data: {
        userId,
        workDate,
        breakStartHHMM: null,
        breakEndHHMM: null,
        manualMinutes: 0,
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      },
    });
  }

  const updates: Prisma.PrismaPromise<unknown>[] = [];
  let remainingBreak = result.effectiveBreakMinutes;

  const reversedEntries = [...entries].reverse();

  for (const entry of reversedEntries) {
    const gross = Math.max(0, entry.grossMinutes);
    const allocatedBreak = Math.min(gross, remainingBreak);
    remainingBreak -= allocatedBreak;

    updates.push(
      prisma.workEntry.update({
        where: { id: entry.id },
        data: {
          breakMinutes: allocatedBreak,
          breakAuto: allocatedBreak > 0 ? result.breakAuto : false,
          workMinutes: Math.max(0, gross - allocatedBreak),
        },
      })
    );
  }

  await prisma.$transaction(updates);
}

function buildPatchedEntries(rows: WorkEntryRow[], dayBreakMap: Map<string, DayBreakDTO>) {
  const groups = new Map<string, WorkEntryRow[]>();

  for (const row of rows) {
    const ymd = toIsoDateUTC(row.workDate);
    const key = `${row.userId}|${ymd}`;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const patched = new Map<
    string,
    {
      grossMinutes: number;
      breakMinutes: number;
      breakAuto: boolean;
      workMinutes: number;
    }
  >();

  for (const [key, arr] of groups.entries()) {
    const ymd = key.split("|")[1];
    const dayBreak = dayBreakMap.get(key);

    const dayGross = arr.reduce((sum, row) => sum + Math.max(0, row.grossMinutes), 0);
    const manualMinutes = dayBreak?.manualMinutes ?? 0;
    const result = computeDayBreakFromGross(dayGross, manualMinutes);

    const sortedAsc = [...arr].sort((a, b) => {
      const endDiff = a.endTime.getTime() - b.endTime.getTime();
      if (endDiff !== 0) return endDiff;
      return a.startTime.getTime() - b.startTime.getTime();
    });

    for (const row of sortedAsc) {
      const gross = Math.max(0, row.grossMinutes);
      patched.set(row.id, {
        grossMinutes: gross,
        breakMinutes: 0,
        breakAuto: false,
        workMinutes: gross,
      });
    }

    let remainingBreak = result.effectiveBreakMinutes;
    const reversedEntries = [...sortedAsc].reverse();

    for (const row of reversedEntries) {
      const current = patched.get(row.id);
      if (!current) continue;

      const allocatedBreak = Math.min(current.grossMinutes, remainingBreak);
      remainingBreak -= allocatedBreak;

      patched.set(row.id, {
        grossMinutes: current.grossMinutes,
        breakMinutes: allocatedBreak,
        breakAuto: allocatedBreak > 0 ? result.breakAuto : false,
        workMinutes: Math.max(0, current.grossMinutes - allocatedBreak),
      });
    }

    if (!dayBreakMap.has(key)) {
      dayBreakMap.set(key, {
        id: `virtual-${key}`,
        workDate: ymd,
        breakStartHHMM: null,
        breakEndHHMM: null,
        manualMinutes: 0,
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      });
    }
  }

  return patched;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;
  const userWhere = isAdmin ? {} : { userId: session.userId };

  const url = new URL(req.url);
  const month = url.searchParams.get("month");

  let from: Date | undefined;
  let to: Date | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  }

  const rows = await prisma.workEntry.findMany({
    where: {
      ...userWhere,
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ workDate: "desc" }, { startTime: "desc" }],
  });

  const dayBreakRows = await prisma.dayBreak.findMany({
    where: {
      ...userWhere,
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    orderBy: [{ workDate: "desc" }],
  });

  const dayBreakMap = new Map<string, DayBreakDTO>();

  for (const row of dayBreakRows) {
    const key = `${row.userId}|${toIsoDateUTC(row.workDate)}`;
    dayBreakMap.set(key, {
      id: row.id,
      workDate: toIsoDateUTC(row.workDate),
      breakStartHHMM: row.breakStartHHMM,
      breakEndHHMM: row.breakEndHHMM,
      manualMinutes: row.manualMinutes,
      legalMinutes: row.legalMinutes,
      autoSupplementMinutes: row.autoSupplementMinutes,
      effectiveMinutes: row.effectiveMinutes,
    });
  }

  const typedRows: WorkEntryRow[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    workDate: row.workDate,
    startTime: row.startTime,
    endTime: row.endTime,
    activity: row.activity ?? "",
    location: row.location ?? "",
    travelMinutes: row.travelMinutes ?? 0,
    workMinutes: row.workMinutes ?? 0,
    grossMinutes: row.grossMinutes ?? 0,
    breakMinutes: row.breakMinutes ?? 0,
    breakAuto: row.breakAuto ?? false,
    noteEmployee: row.noteEmployee ?? "",
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
    },
  }));

  const patched = buildPatchedEntries(typedRows, dayBreakMap);

  const entries: EntryDTO[] = typedRows.map((row) => {
    const p = patched.get(row.id);

    return {
      id: row.id,
      workDate: toIsoDateUTC(row.workDate),
      startTime: toHHMMUTC(row.startTime),
      endTime: toHHMMUTC(row.endTime),
      activity: row.activity,
      location: row.location,
      travelMinutes: row.travelMinutes,
      grossMinutes: p?.grossMinutes ?? row.grossMinutes,
      breakMinutes: p?.breakMinutes ?? row.breakMinutes,
      breakAuto: p?.breakAuto ?? row.breakAuto,
      workMinutes: p?.workMinutes ?? row.workMinutes,
      noteEmployee: row.noteEmployee ?? "",
      user: {
        id: row.user.id,
        fullName: row.user.fullName,
      },
    };
  });

  const dayBreaks = Array.from(dayBreakMap.values()).sort((a, b) => (a.workDate === b.workDate ? 0 : a.workDate > b.workDate ? -1 : 1));

  return NextResponse.json({ entries, dayBreaks });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;
  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? raw : {};

  const workDate = getString(body.workDate).trim();
  const startTime = getString(body.startTime).trim();
  const endTime = getString(body.endTime).trim();
  const activity = getString(body.activity).trim();
  const location = getString(body.location).trim();
  const noteEmployee = getString(body.noteEmployee).trim();

  if (!workDate || !startTime || !endTime || !activity) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  try {
    await assertEmployeeMayEditDate({
      role: session.role,
      userId: session.userId,
      workDateYMD: workDate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nicht erlaubt";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  let targetUserId = session.userId;

  if (isAdmin) {
    const requestedUserId = getString(body.userId).trim();
    if (requestedUserId) {
      const user = await prisma.appUser.findUnique({ where: { id: requestedUserId } });
      if (!user || !user.isActive) {
        return NextResponse.json({ error: "Mitarbeiter nicht gefunden oder inaktiv." }, { status: 400 });
      }
      targetUserId = user.id;
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
      breakMinutes: 0,
      breakAuto: false,
      workMinutes: diffMin,
      noteEmployee: noteEmployee || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  await syncDailyBreakAllocation(targetUserId, workDate);

  const createdFresh = await prisma.workEntry.findUnique({
    where: { id: created.id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
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
    noteEmployee: createdFresh.noteEmployee ?? "",
    user: { id: createdFresh.user.id, fullName: createdFresh.user.fullName },
  };

  return NextResponse.json({ entry });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;
  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? raw : {};

  const id = getString(body.id).trim();
  if (!id) {
    return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  }

  const existing = await prisma.workEntry.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  if (!isAdmin && existing.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  if (!isAdmin) {
    const existingYMD = toIsoDateUTC(existing.workDate);
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: existingYMD,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nicht erlaubt";
      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const workDate = isAdmin ? toIsoDateUTC(existing.workDate) : getString(body.workDate).trim();
  const startTime = isAdmin ? toHHMMUTC(existing.startTime) : getString(body.startTime).trim();
  const endTime = isAdmin ? toHHMMUTC(existing.endTime) : getString(body.endTime).trim();

  const activity = isAdmin
    ? getString(body.activity).trim() || (existing.activity ?? "")
    : getString(body.activity).trim();

  const location = isAdmin
    ? getString(body.location).trim() || (existing.location ?? "")
    : getString(body.location).trim();

  const noteEmployee = isAdmin
    ? existing.noteEmployee ?? ""
    : getString(body.noteEmployee).trim();

  if (!isAdmin && (!workDate || !startTime || !endTime || !activity)) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  if (!isAdmin) {
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: workDate,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nicht erlaubt";
      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  let targetUserId = existing.userId;

  if (isAdmin) {
    const requestedUserId = getString(body.userId).trim();
    if (requestedUserId) {
      const user = await prisma.appUser.findUnique({ where: { id: requestedUserId } });
      if (!user || !user.isActive) {
        return NextResponse.json({ error: "Mitarbeiter nicht gefunden oder inaktiv." }, { status: 400 });
      }
      targetUserId = user.id;
    }
  }

  const oldWorkDateYMD = toIsoDateUTC(existing.workDate);
  const oldUserId = existing.userId;

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
      breakMinutes: 0,
      breakAuto: false,
      workMinutes: diffMin,
      noteEmployee: noteEmployee || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  await syncDailyBreakAllocation(targetUserId, workDate);

  if (oldUserId !== targetUserId || oldWorkDateYMD !== workDate) {
    await syncDailyBreakAllocation(oldUserId, oldWorkDateYMD);
  }

  const updatedFresh = await prisma.workEntry.findUnique({
    where: { id: updated.id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!updatedFresh) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 500 });
  }

  const entry: EntryDTO = {
    id: updatedFresh.id,
    workDate: toIsoDateUTC(updatedFresh.workDate),
    startTime: toHHMMUTC(updatedFresh.startTime),
    endTime: toHHMMUTC(updatedFresh.endTime),
    activity: updatedFresh.activity ?? "",
    location: updatedFresh.location ?? "",
    travelMinutes: updatedFresh.travelMinutes ?? 0,
    workMinutes: updatedFresh.workMinutes ?? 0,
    grossMinutes: updatedFresh.grossMinutes ?? 0,
    breakMinutes: updatedFresh.breakMinutes ?? 0,
    breakAuto: updatedFresh.breakAuto ?? false,
    noteEmployee: updatedFresh.noteEmployee ?? "",
    user: { id: updatedFresh.user.id, fullName: updatedFresh.user.fullName },
  };

  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  }

  const entry = await prisma.workEntry.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  if (!isAdmin && entry.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  if (!isAdmin) {
    const ymd = toIsoDateUTC(entry.workDate);
    try {
      await assertEmployeeMayEditDate({
        role: session.role,
        userId: session.userId,
        workDateYMD: ymd,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nicht erlaubt";
      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  const deleted = await prisma.workEntry.delete({ where: { id } });
  const ymd = toIsoDateUTC(deleted.workDate);

  await syncDailyBreakAllocation(deleted.userId, ymd);

  return NextResponse.json({ ok: true });
}