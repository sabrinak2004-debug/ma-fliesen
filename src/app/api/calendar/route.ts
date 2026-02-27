import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  if (!month) return NextResponse.json({ error: "month fehlt" }, { status: 400 });

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month Format muss YYYY-MM sein" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));

  // ✅ NUR eingeloggter User
  const [entries, absences] = await Promise.all([
    prisma.workEntry.findMany({
      where: { userId: session.userId, workDate: { gte: from, lt: to } },
      orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    }),
    prisma.absence.findMany({
      where: { userId: session.userId, absenceDate: { gte: from, lt: to } },
      orderBy: [{ absenceDate: "asc" }],
    }),
  ]);

  // ✅ Dein Kalender-Frontend erwartet: { ok: true, days: CalendarDay[] }
  const workSet = new Set(entries.map((e) => toIsoDateUTC(e.workDate)));
  const vacSet = new Set(absences.filter((a) => a.type === "VACATION").map((a) => toIsoDateUTC(a.absenceDate)));
  const sickSet = new Set(absences.filter((a) => a.type === "SICK").map((a) => toIsoDateUTC(a.absenceDate)));

  // alle Tage im Monat ausgeben (damit Grid sauber markiert)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dd = String(i + 1).padStart(2, "0");
    const date = `${month}-${dd}`;
    return {
      date,
      hasWork: workSet.has(date),
      hasVacation: vacSet.has(date),
      hasSick: sickSet.has(date),
    };
  });

  return NextResponse.json({ ok: true, days });
}