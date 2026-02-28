import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Prisma, Role } from "@prisma/client";

function dateOnly(yyyyMmDd: string) {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}
function timeOnly(hhmm: string) {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

type EntryBody = {
  // Admin kann für andere buchen (optional)
  fullName?: unknown;

  workDate?: unknown; // YYYY-MM-DD
  startTime?: unknown; // HH:MM
  endTime?: unknown; // HH:MM
  activity?: unknown;
  location?: unknown;
  distanceKm?: unknown;
  travelMinutes?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;
  const userWhere = isAdmin ? {} : { userId: session.userId };

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
      ...userWhere,
      ...(from && to ? { workDate: { gte: from, lt: to } } : {}),
    },
    include: isAdmin ? { user: true } : undefined,
    orderBy: [{ workDate: "desc" }, { startTime: "desc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: EntryBody = isRecord(raw) ? (raw as EntryBody) : {};

  const workDate = getString(body.workDate);
  const startTime = getString(body.startTime);
  const endTime = getString(body.endTime);
  const activity = getString(body.activity).trim();
  const location = getString(body.location);

  if (!workDate || !startTime || !endTime || !activity) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  // Work minutes berechnen
  const start = timeOnly(startTime);
  const end = timeOnly(endTime);
  const diffMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

  const distanceKmNum = getNumber(body.distanceKm);
  const travelMinutesNum = Math.max(0, Math.round(getNumber(body.travelMinutes)));

  // Ziel-User bestimmen
  let targetUserId = session.userId;

  if (isAdmin) {
    const fullName = getString(body.fullName).trim();
    if (fullName) {
      const u = await prisma.appUser.findUnique({ where: { fullName } });
      if (!u || !u.isActive) {
        return NextResponse.json({ error: "Mitarbeiter nicht gefunden oder inaktiv." }, { status: 400 });
      }
      targetUserId = u.id;
    }
  }

  const entry = await prisma.workEntry.create({
    data: {
      userId: targetUserId,
      workDate: dateOnly(workDate),
      startTime: timeOnly(startTime),
      endTime: timeOnly(endTime),
      activity,
      location,
      distanceKm: new Prisma.Decimal(distanceKmNum),
      travelMinutes: travelMinutesNum,
      workMinutes: diffMin,
    },
    include: isAdmin ? { user: true } : undefined,
  });

  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const isAdmin = session.role === Role.ADMIN;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });

  const e = await prisma.workEntry.findUnique({ where: { id } });
  if (!e) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  // Employee darf nur eigene löschen, Admin darf alle.
  if (!isAdmin && e.userId !== session.userId) {
    return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
  }

  await prisma.workEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}