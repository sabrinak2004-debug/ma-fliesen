import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function dateOnly(yyyyMmDd: string) {
  // Date-only in UTC
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
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

  const absences = await prisma.absence.findMany({
    where: {
      ...(from && to ? { absenceDate: { gte: from, lt: to } } : {}),
    },
    include: { user: true },
    orderBy: [{ absenceDate: "asc" }],
  });

  return NextResponse.json({ absences });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { fullName?: string; absenceDate?: string; type?: "VACATION" | "SICK" }
    | null;

  if (!body?.fullName || !body?.absenceDate || !body?.type) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const user = await prisma.appUser.upsert({
    where: { fullName: body.fullName },
    update: { isActive: true },
    create: { fullName: body.fullName, isActive: true },
  });

  const absence = await prisma.absence.upsert({
    where: {
      userId_absenceDate_type: {
        userId: user.id,
        absenceDate: dateOnly(body.absenceDate),
        type: body.type,
      },
    },
    update: {},
    create: {
      userId: user.id,
      absenceDate: dateOnly(body.absenceDate),
      type: body.type,
    },
    include: { user: true },
  });

  return NextResponse.json({ absence });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  await prisma.absence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}