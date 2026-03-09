import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assertEmployeeMayEditDate, berlinTodayYMD, consumeTimeEntryUnlock } from "@/lib/timesheetLock";
import { computeDayBreakFromGross, minutesBetweenHHMM } from "@/lib/breaks";

function dateOnly(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type DayBreakBody = {
  userId?: unknown;
  workDate?: unknown;
  breakStartHHMM?: unknown;
  breakEndHHMM?: unknown;
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

type SyncEntryRow = {
  id: string;
  grossMinutes: number;
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

  const reversedEntries: SyncEntryRow[] = [...entries].reverse();

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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const workDate = url.searchParams.get("workDate");

  let from: Date | undefined;
  let to: Date | undefined;

  if (workDate && /^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    from = dateOnly(workDate);
    const [yStr, mStr, dStr] = workDate.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    to = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  }

  const rows = await prisma.dayBreak.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    orderBy: [{ workDate: "desc" }],
  });

  const dayBreaks: DayBreakDTO[] = rows.map((row) => ({
    id: row.id,
    workDate: toIsoDateUTC(row.workDate),
    breakStartHHMM: row.breakStartHHMM,
    breakEndHHMM: row.breakEndHHMM,
    manualMinutes: row.manualMinutes,
    legalMinutes: row.legalMinutes,
    autoSupplementMinutes: row.autoSupplementMinutes,
    effectiveMinutes: row.effectiveMinutes,
  }));

  return NextResponse.json({ dayBreaks });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;
  const raw = (await req.json().catch(() => null)) as unknown;
  const body: DayBreakBody = isRecord(raw) ? raw : {};

  const workDate = getString(body.workDate).trim();
  const breakStartHHMM = getString(body.breakStartHHMM).trim();
  const breakEndHHMM = getString(body.breakEndHHMM).trim();

  if (!workDate || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    return NextResponse.json({ error: "Ungültiges Datum." }, { status: 400 });
  }

  if ((breakStartHHMM && !breakEndHHMM) || (!breakStartHHMM && breakEndHHMM)) {
    return NextResponse.json({ error: "Bitte Pause von und bis vollständig eingeben." }, { status: 400 });
  }

  if (breakStartHHMM && !/^\d{2}:\d{2}$/.test(breakStartHHMM)) {
    return NextResponse.json({ error: "Pause-Beginn ist ungültig." }, { status: 400 });
  }

  if (breakEndHHMM && !/^\d{2}:\d{2}$/.test(breakEndHHMM)) {
    return NextResponse.json({ error: "Pause-Ende ist ungültig." }, { status: 400 });
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

  const manualMinutes =
    breakStartHHMM && breakEndHHMM ? minutesBetweenHHMM(breakStartHHMM, breakEndHHMM) : 0;

  const workDateValue = dateOnly(workDate);

  await prisma.dayBreak.upsert({
    where: {
      userId_workDate: {
        userId: targetUserId,
        workDate: workDateValue,
      },
    },
    update: {
      breakStartHHMM: breakStartHHMM || null,
      breakEndHHMM: breakEndHHMM || null,
      manualMinutes,
    },
    create: {
      userId: targetUserId,
      workDate: workDateValue,
      breakStartHHMM: breakStartHHMM || null,
      breakEndHHMM: breakEndHHMM || null,
      manualMinutes,
      legalMinutes: 0,
      autoSupplementMinutes: 0,
      effectiveMinutes: 0,
    },
  });

  await syncDailyBreakAllocation(targetUserId, workDate);

  if (!isAdmin && workDate !== berlinTodayYMD()) {
    await consumeTimeEntryUnlock(session.userId, workDate);
  }

  const fresh = await prisma.dayBreak.findUnique({
    where: {
      userId_workDate: {
        userId: targetUserId,
        workDate: workDateValue,
      },
    },
  });

  if (!fresh) {
    return NextResponse.json({ error: "Trage erst deine Arbeitzeit für diesen Tag ein" }, { status: 500 });
  }

  const dayBreak: DayBreakDTO = {
    id: fresh.id,
    workDate: toIsoDateUTC(fresh.workDate),
    breakStartHHMM: fresh.breakStartHHMM,
    breakEndHHMM: fresh.breakEndHHMM,
    manualMinutes: fresh.manualMinutes,
    legalMinutes: fresh.legalMinutes,
    autoSupplementMinutes: fresh.autoSupplementMinutes,
    effectiveMinutes: fresh.effectiveMinutes,
  };

  return NextResponse.json({ dayBreak });
}