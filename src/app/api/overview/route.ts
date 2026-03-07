import { NextResponse } from "next/server";
import { AbsenceDayPortion, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeDayBreakFromGross } from "@/lib/breaks";

function isoDayUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type DayAgg = {
  gross: number;
  manualBreak: number;
};

function absencePortionValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === AbsenceDayPortion.HALF_DAY ? 0.5 : 1;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month Format muss YYYY-MM sein" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));

  const users = await prisma.appUser.findMany({
    where: isAdmin ? { isActive: true } : { id: session.userId, isActive: true },
    orderBy: { fullName: "asc" },
  });

  const entries = await prisma.workEntry.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      workDate: { gte: from, lt: to },
    },
  });

  const dayBreaks = await prisma.dayBreak.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      workDate: { gte: from, lt: to },
    },
  });

  const absences = await prisma.absence.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      absenceDate: { gte: from, lt: to },
    },
  });

  const dayBreakMap = new Map<string, number>();

  for (const row of dayBreaks) {
    const key = `${row.userId}|${isoDayUTC(row.workDate)}`;
    dayBreakMap.set(key, row.manualMinutes);
  }

  const byUser = users.map((user) => {
    const userEntries = entries.filter((entry) => entry.userId === user.id);
    const userAbsences = absences.filter((absence) => absence.userId === user.id);

    const dayMap = new Map<string, DayAgg>();

    for (const row of userEntries) {
      const dayKey = isoDayUTC(row.workDate);
      const current = dayMap.get(dayKey) ?? { gross: 0, manualBreak: 0 };
      current.gross += Math.max(0, row.grossMinutes ?? 0);
      dayMap.set(dayKey, current);
    }

    for (const [dayKey, current] of dayMap.entries()) {
      const manual = dayBreakMap.get(`${user.id}|${dayKey}`) ?? 0;
      current.manualBreak = manual;
      dayMap.set(dayKey, current);
    }

    let netMinutesSum = 0;

    for (const value of dayMap.values()) {
      const result = computeDayBreakFromGross(value.gross, value.manualBreak);
      netMinutesSum += result.netDayMinutes;
    }

    return {
      fullName: user.fullName,
      role: user.role,
      entriesCount: userEntries.length,
      workMinutes: netMinutesSum,
      travelMinutes: userEntries.reduce((sum, row) => sum + (row.travelMinutes ?? 0), 0),
      vacationDays: userAbsences
        .filter((row) => row.type === "VACATION")
        .reduce((sum, row) => sum + absencePortionValue(row.dayPortion), 0),
      sickDays: userAbsences
        .filter((row) => row.type === "SICK")
        .reduce((sum, row) => sum + absencePortionValue(row.dayPortion), 0),
    };
  });

  const targetMinutes = 160 * 60;

  return NextResponse.json({
    month,
    targetMinutes,
    byUser,
    totals: {
      entriesCount: entries.length,
      workMinutes: byUser.reduce((sum, user) => sum + user.workMinutes, 0),
      travelMinutes: byUser.reduce((sum, user) => sum + user.travelMinutes, 0),
      vacationDays: byUser.reduce((sum, user) => sum + user.vacationDays, 0),
      sickDays: byUser.reduce((sum, user) => sum + user.sickDays, 0),
    },
    isAdmin,
  });
}