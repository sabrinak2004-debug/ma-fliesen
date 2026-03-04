import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7); // YYYY-MM

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

  const absences = await prisma.absence.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.userId }),
      absenceDate: { gte: from, lt: to },
    },
  });

  const byUser = users.map((u) => {
    const e = entries.filter((x) => x.userId === u.id);
    const a = absences.filter((x) => x.userId === u.id);

    return {
      fullName: u.fullName,
      role: u.role,
      entriesCount: e.length,
      workMinutes: e.reduce((s, x) => s + x.workMinutes, 0),
      travelMinutes: e.reduce((s, x) => s + x.travelMinutes, 0),
      vacationDays: a.filter((x) => x.type === "VACATION").length,
      sickDays: a.filter((x) => x.type === "SICK").length,
    };
  });

  const targetMinutes = 160 * 60;

  return NextResponse.json({
    month,
    targetMinutes,
    byUser,
    totals: {
      entriesCount: entries.length,
      workMinutes: byUser.reduce((s, u) => s + u.workMinutes, 0),
      travelMinutes: byUser.reduce((s, u) => s + u.travelMinutes, 0),
      vacationDays: byUser.reduce((s, u) => s + u.vacationDays, 0),
      sickDays: byUser.reduce((s, u) => s + u.sickDays, 0),
    },
    isAdmin,
  });
}