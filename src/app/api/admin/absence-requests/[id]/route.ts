import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  compensation?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function isAbsenceType(v: string): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function isAbsenceDayPortion(v: string): v is AbsenceDayPortion {
  return v === "FULL_DAY" || v === "HALF_DAY";
}

function isAbsenceCompensation(v: string): v is AbsenceCompensation {
  return v === "PAID" || v === "UNPAID";
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json(
      { ok: false, error: "Fehlende Request-ID." },
      { status: 400 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: UpdateAbsenceRequestBody = isRecord(raw) ? raw : {};

  const startDateRaw = getString(body.startDate).trim();
  const endDateRaw = getString(body.endDate).trim();
  const typeRaw = getString(body.type).trim();
  const dayPortionRaw = getString(body.dayPortion).trim();
  const compensationRaw = getString(body.compensation).trim();

  if (
    !isYYYYMMDD(startDateRaw) ||
    !isYYYYMMDD(endDateRaw) ||
    !isAbsenceType(typeRaw) ||
    !isAbsenceDayPortion(dayPortionRaw) ||
    !isAbsenceCompensation(compensationRaw)
  ) {
    return NextResponse.json(
      { ok: false, error: "Ungültige Daten." },
      { status: 400 }
    );
  }

  const startDate = dateOnlyUTC(startDateRaw);
  const endDate = dateOnlyUTC(endDateRaw);

  if (endDate < startDate) {
    return NextResponse.json(
      { ok: false, error: "Ende darf nicht vor Start liegen." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && dayPortionRaw !== AbsenceDayPortion.FULL_DAY) {
    return NextResponse.json(
      { ok: false, error: "Krankheit kann nur ganztägig sein." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && compensationRaw !== AbsenceCompensation.PAID) {
    return NextResponse.json(
      { ok: false, error: "Krankheit darf nicht unbezahlt sein." },
      { status: 400 }
    );
  }

  if (dayPortionRaw === "HALF_DAY" && typeRaw !== "VACATION") {
    return NextResponse.json(
      { ok: false, error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (dayPortionRaw === "HALF_DAY" && startDateRaw !== endDateRaw) {
    return NextResponse.json(
      { ok: false, error: "Ein halber Urlaubstag darf nur für genau ein Datum bestehen." },
      { status: 400 }
    );
  }

  const existing = await prisma.absenceRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Antrag nicht gefunden." },
      { status: 404 }
    );
  }

  if (
    existing.status !== AbsenceRequestStatus.APPROVED &&
    existing.status !== AbsenceRequestStatus.PENDING
  ) {
    return NextResponse.json(
      { ok: false, error: "Nur offene oder genehmigte Anträge können geändert werden." },
      { status: 409 }
    );
  }

  const updated = await prisma.absenceRequest.update({
    where: { id: requestId },
    data: {
      startDate,
      endDate,
      type: typeRaw,
      dayPortion: dayPortionRaw,
      compensation: compensationRaw,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: updated.id,
      status: updated.status,
    },
  });
}