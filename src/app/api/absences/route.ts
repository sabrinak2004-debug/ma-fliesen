import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AbsenceType, Role } from "@prisma/client";

type AbsenceBody = {
  startDate?: unknown; // YYYY-MM-DD
  endDate?: unknown;   // YYYY-MM-DD
  type?: unknown;      // "VACATION" | "SICK"
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function dateOnly(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function eachDayInclusive(from: Date, to: Date) {
  const res: Date[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    res.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return res;
}

function isAbsenceType(v: string): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

type AbsenceDTO = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
  user: { id: string; fullName: string };
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;
  const userWhere = isAdmin ? {} : { userId: session.userId };

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // optional "YYYY-MM"

  let from: Date | undefined;
  let to: Date | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  }

  const rows = await prisma.absence.findMany({
    where: {
      ...userWhere,
      ...(from && to ? { absenceDate: { gte: from, lt: to } } : {}),
    },
    // ✅ IMMER include user, damit Name immer da ist (auch für Employee)
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ absenceDate: "asc" }],
  });

  // ✅ Date sauber als YYYY-MM-DD ausgeben
  const absences: AbsenceDTO[] = rows.map((a) => ({
    id: a.id,
    absenceDate: toIsoDateUTC(a.absenceDate),
    type: a.type === "SICK" ? "SICK" : "VACATION",
    user: { id: a.user.id, fullName: a.user.fullName },
  }));

  return NextResponse.json({ absences });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: AbsenceBody = isRecord(raw) ? (raw as AbsenceBody) : {};

  const startDate = getString(body.startDate);
  const endDate = getString(body.endDate);
  const typeStr = getString(body.type);

  if (!startDate || !endDate || !typeStr || !isAbsenceType(typeStr)) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const start = dateOnly(startDate);
  const end = dateOnly(endDate);

  if (end < start) {
    return NextResponse.json({ error: "Enddatum darf nicht vor Startdatum liegen." }, { status: 400 });
  }

  const days = eachDayInclusive(start, end);

  await prisma.absence.createMany({
    data: days.map((d) => ({
      userId: session.userId,
      absenceDate: d,
      type: typeStr,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, count: days.length });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const a = await prisma.absence.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  if (!isAdmin && a.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.absence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}