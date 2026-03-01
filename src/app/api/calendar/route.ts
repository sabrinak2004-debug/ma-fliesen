import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type PlanPreviewItem = {
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;
  const userWhere = isAdmin ? {} : { userId: session.userId };

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  if (!month) return NextResponse.json({ error: "month fehlt" }, { status: 400 });

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month Format muss YYYY-MM sein" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));

  const [entries, absences, planEntries] = await Promise.all([
    prisma.workEntry.findMany({
      where: { ...userWhere, workDate: { gte: from, lt: to } },
      orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    }),
    prisma.absence.findMany({
      // ✅ bleibt wie bei dir (tagesbasiert über absenceDate)
      where: { ...userWhere, absenceDate: { gte: from, lt: to } },
      orderBy: [{ absenceDate: "asc" }],
    }),
    prisma.planEntry.findMany({
      // ✅ PlanEntries im Monat
      where: { ...userWhere, workDate: { gte: from, lt: to } },
      select: {
        workDate: true,
        startHHMM: true,
        endHHMM: true,
        activity: true,
        location: true,
      },
      orderBy: [{ workDate: "asc" }, { startHHMM: "asc" }],
    }),
  ]);

  // Frontend erwartet: { ok: true, days: CalendarDay[] }

  // bisher:
  const workSet = new Set(entries.map((e) => toIsoDateUTC(e.workDate)));
  const vacSet = new Set(
    absences.filter((a) => a.type === "VACATION").map((a) => toIsoDateUTC(a.absenceDate))
  );
  const sickSet = new Set(
    absences.filter((a) => a.type === "SICK").map((a) => toIsoDateUTC(a.absenceDate))
  );

  // ✅ neu: Plan map + set
  const planMap = new Map<string, PlanPreviewItem[]>();
  for (const p of planEntries) {
    const key = toIsoDateUTC(p.workDate);
    const list = planMap.get(key) ?? [];
    list.push({
      startHHMM: p.startHHMM,
      endHHMM: p.endHHMM,
      activity: p.activity ?? "",
      location: p.location ?? "",
    });
    planMap.set(key, list);
  }
  const planSet = new Set(planMap.keys());

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dd = String(i + 1).padStart(2, "0");
    const date = `${month}-${dd}`;

    const plans = planMap.get(date) ?? [];
    const planPreview =
      plans.length === 0
        ? null
        : plans
            .slice(0, 2) // max 2 Einträge in der Vorschau
            .map((x) => {
              const base = `${x.startHHMM}–${x.endHHMM} ${x.activity}`.trim();
              return x.location ? `${base} · ${x.location}` : base;
            })
            .join(" | ");

    return {
      date,

      // ✅ wichtig: Einfärben soll Plan direkt anzeigen:
      // - Für Mitarbeiter: hasWork kann ruhig "WorkEntry ODER PlanEntry" sein
      // - Für Admin: bleibt aggregiert (über userWhere = {})
      hasWork: workSet.has(date) || planSet.has(date),

      hasVacation: vacSet.has(date),
      hasSick: sickSet.has(date),

      // ✅ neu:
      hasPlan: planSet.has(date),
      planPreview,
    };
  });

  return NextResponse.json({ ok: true, days });
}