import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  if (!month) return NextResponse.json({ error: "month fehlt" }, { status: 400 });

  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));

  const [entries, absences] = await Promise.all([
    prisma.workEntry.findMany({
      where: { workDate: { gte: from, lt: to } },
      include: { user: true },
      orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
    }),
    prisma.absence.findMany({
      where: { absenceDate: { gte: from, lt: to } },
      include: { user: true },
      orderBy: [{ absenceDate: "asc" }],
    }),
  ]);

  return NextResponse.json({ entries, absences });
}