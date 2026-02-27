import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

function dateOnly(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}
function timeOnly(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // optional YYYY-MM

  let from: Date | undefined;
  let to: Date | undefined;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    to = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  }

  const entries = await prisma.workEntry.findMany({
    where: {
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    include: { user: true },
    orderBy: [{ workDate: "desc" }, { startTime: "desc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        fullName?: string;
        workDate?: string; // YYYY-MM-DD
        startTime?: string; // HH:MM
        endTime?: string; // HH:MM
        activity?: string;
        location?: string;
        distanceKm?: number | string;
        travelMinutes?: number;
      }
    | null;

  if (!body?.fullName || !body.workDate || !body.startTime || !body.endTime || !body.activity) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const distanceKmNum =
    typeof body.distanceKm === "string" ? Number(body.distanceKm.replace(",", ".")) : Number(body.distanceKm ?? 0);

  const travelMinutesNum = Number(body.travelMinutes ?? 0);

  // workMinutes berechnen
  const start = timeOnly(body.startTime);
  const end = timeOnly(body.endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

  const user = await prisma.appUser.upsert({
    where: { fullName: body.fullName },
    update: { isActive: true },
    create: { fullName: body.fullName, isActive: true },
  });

  const entry = await prisma.workEntry.create({
    data: {
      userId: user.id,
      workDate: dateOnly(body.workDate),
      startTime: timeOnly(body.startTime),
      endTime: timeOnly(body.endTime),
      activity: body.activity,
      location: body.location ?? "",
      distanceKm: new Prisma.Decimal(Number.isFinite(distanceKmNum) ? distanceKmNum : 0),
      travelMinutes: Number.isFinite(travelMinutesNum) ? travelMinutesNum : 0,
      workMinutes: diffMin,
    },
    include: { user: true },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  await prisma.workEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}