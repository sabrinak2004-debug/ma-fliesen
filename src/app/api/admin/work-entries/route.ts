import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import type { Prisma } from "@prisma/client";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function timeToDbTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = new Date(0);
  // TIME-only: Datum ist egal
  t.setUTCHours(h, m, 0, 0);
  return t;
}

function minutesBetween(startHHMM: string, endHHMM: string) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return Math.max(0, end - start);
}

function legalBreakMinutes(grossMinutes: number): number {
  if (!Number.isFinite(grossMinutes) || grossMinutes <= 0) return 0;
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

function normalizeBreakMinutes(input: number | undefined, grossMinutes: number): { breakMinutes: number; breakAuto: boolean } {
  const safeGross = Math.max(0, Math.round(grossMinutes));
  const inVal = typeof input === "number" && Number.isFinite(input) ? input : 0;

  if (inVal <= 0) return { breakMinutes: legalBreakMinutes(safeGross), breakAuto: true };

  const b = Math.max(0, Math.round(inVal));
  return { breakMinutes: Math.min(b, safeGross), breakAuto: false };
}

function hhmmFromTime(dt: Date) {
  const h = String(dt.getUTCHours()).padStart(2, "0");
  const m = String(dt.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// ✅ Typ für findMany-Ergebnis (inkl. user select)
type WorkEntryWithUser = Prisma.WorkEntryGetPayload<{
  include: { user: { select: { id: true; fullName: true } } };
}>;

type WorkEntryUI = {
  id: string;
  userId: string;
  workDate: Date;
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  user: { id: string; fullName: string };
};

type WorkEntryPostBody = {
  id?: string;
  userId: string;
  workDate: string;   // YYYY-MM-DD
  startHHMM: string;  // "07:00"
  endHHMM: string;    // "16:00"
  activity: string;
  location?: string;
  travelMinutes?: number;
  breakMinutes?: number;
};

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart"); // Montag YYYY-MM-DD
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart missing" }, { status: 400 });
  }

  const start = parseYMD(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const entries: WorkEntryWithUser[] = await prisma.workEntry.findMany({
    where: { workDate: { gte: start, lt: end } },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ workDate: "asc" }, { startTime: "asc" }],
  });

  const ui: WorkEntryUI[] = entries.map((e) => ({
    id: e.id,
    userId: e.userId,
    workDate: e.workDate,
    startHHMM: hhmmFromTime(e.startTime),
    endHHMM: hhmmFromTime(e.endTime),
    activity: e.activity,
    location: e.location,
    travelMinutes: e.travelMinutes,
    workMinutes: e.workMinutes,
    grossMinutes: e.grossMinutes ?? 0,
    breakMinutes: e.breakMinutes ?? 0,
    breakAuto: e.breakAuto ?? false,
    user: e.user,
  }));

  return NextResponse.json({ entries: ui });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Partial<WorkEntryPostBody>;

  const {
    id,
    userId,
    workDate,
    startHHMM,
    endHHMM,
    activity,
    location,
    travelMinutes,
  } = body ?? {};

  if (!userId || !workDate || !startHHMM || !endHHMM || !activity) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const grossMinutes = minutesBetween(startHHMM, endHHMM);
  if (grossMinutes <= 0) {
    return NextResponse.json({ error: "endHHMM must be after startHHMM" }, { status: 400 });
  }

  const brk = normalizeBreakMinutes(body.breakMinutes, grossMinutes);
  const netMinutes = Math.max(0, grossMinutes - brk.breakMinutes);

  const data: Prisma.WorkEntryUncheckedCreateInput = {
    userId: String(userId),
    workDate: parseYMD(String(workDate)),
    startTime: timeToDbTime(String(startHHMM)),
    endTime: timeToDbTime(String(endHHMM)),
    activity: String(activity),
    location: location ? String(location) : "",
    travelMinutes: travelMinutes ?? 0,
    grossMinutes,
    breakMinutes: brk.breakMinutes,
    breakAuto: brk.breakAuto,
    workMinutes: netMinutes,
  };

  const saved = id
    ? await prisma.workEntry.update({ where: { id: String(id) }, data })
    : await prisma.workEntry.create({ data });

  return NextResponse.json({ ok: true, entry: saved });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  await prisma.workEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}