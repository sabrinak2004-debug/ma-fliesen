import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type AbsenceType = "VACATION" | "SICK";

function dateOnly(yyyyMmDd: string) {
  // Date-only in UTC
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // optional "YYYY-MM"

  let from: Date | undefined;
  let to: Date | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr); // 1..12
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  }

  // ✅ NUR für eingeloggten User
  const absences = await prisma.absence.findMany({
    where: {
      userId: session.userId,
      ...(from && to ? { absenceDate: { gte: from, lt: to } } : {}),
    },
    orderBy: [{ absenceDate: "asc" }],
  });

  return NextResponse.json({ absences });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        // ❗kein fullName mehr nötig, wir nutzen session.userId
        startDate?: string; // YYYY-MM-DD
        endDate?: string;   // YYYY-MM-DD
        type?: AbsenceType;
      }
    | null;

  if (!body?.startDate || !body?.endDate || !body?.type) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const start = dateOnly(body.startDate);
  const end = dateOnly(body.endDate);

  if (end < start) {
    return NextResponse.json({ error: "Enddatum darf nicht vor Startdatum liegen." }, { status: 400 });
  }

  const days = eachDayInclusive(start, end);

  // ✅ createMany + skipDuplicates nutzt deinen Unique-Index (userId_absenceDate_type)
  await prisma.absence.createMany({
    data: days.map((d) => ({
      userId: session.userId,
      absenceDate: d,
      type: body.type!,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, count: days.length });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  // ✅ Sicherheit: nur eigene löschen (Admin-Override kannst du später ergänzen)
  const a = await prisma.absence.findUnique({ where: { id } });
  if (!a || a.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.absence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}