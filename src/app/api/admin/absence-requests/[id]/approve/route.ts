import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { webpush } from "@/lib/webpush";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ApproveAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  compensation?: unknown;
};

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function eachDayInclusive(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(from);

  while (cur <= to) {
    out.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return out;
}

function portionLabel(
  type: AbsenceType,
  dayPortion: AbsenceDayPortion,
  startDate: string,
  endDate: string
): string {
  if (type === "VACATION" && dayPortion === "HALF_DAY") {
    return `halber Urlaubstag am ${startDate}`;
  }
  if (startDate === endDate) return startDate;
  return `${startDate} bis ${endDate}`;
}

async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  const vapidReady =
    typeof process.env.VAPID_PUBLIC_KEY === "string" &&
    process.env.VAPID_PUBLIC_KEY.trim() !== "" &&
    typeof process.env.VAPID_PRIVATE_KEY === "string" &&
    process.env.VAPID_PRIVATE_KEY.trim() !== "";

  if (!vapidReady) return;

  const subs = await prisma.pushSubscription.findMany({
    where: {
      userId,
      user: {
        isActive: true,
      },
    },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch {
        await prisma.pushSubscription.deleteMany({
          where: {
            endpoint: sub.endpoint,
          },
        });
      }
    })
  );
}

export async function POST(req: Request, context: RouteContext) {
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
  const body: ApproveAbsenceRequestBody = isRecord(raw) ? raw : {};

  const existing = await prisma.absenceRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Antrag nicht gefunden." },
      { status: 404 }
    );
  }

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      { ok: false, error: "Mitarbeiter ist nicht aktiv." },
      { status: 409 }
    );
  }

  if (existing.status !== AbsenceRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: "Nur offene Anträge können genehmigt werden." },
      { status: 409 }
    );
  }

  const startDateRaw = getString(body.startDate).trim();
  const endDateRaw = getString(body.endDate).trim();
  const typeRaw = getString(body.type).trim();
  const dayPortionRaw = getString(body.dayPortion).trim();
  const compensationRaw = getString(body.compensation).trim();

  const finalType: AbsenceType = isAbsenceType(typeRaw)
    ? typeRaw
    : existing.type;

  const finalStartDate: Date =
    isYYYYMMDD(startDateRaw) ? dateOnlyUTC(startDateRaw) : existing.startDate;

  const finalEndDate: Date =
    isYYYYMMDD(endDateRaw) ? dateOnlyUTC(endDateRaw) : existing.endDate;

  let finalDayPortion: AbsenceDayPortion = isAbsenceDayPortion(dayPortionRaw)
    ? dayPortionRaw
    : existing.dayPortion;

  let finalCompensation: AbsenceCompensation = isAbsenceCompensation(compensationRaw)
    ? compensationRaw
    : existing.compensation;

  if (finalType === AbsenceType.SICK) {
    finalDayPortion = AbsenceDayPortion.FULL_DAY;
    finalCompensation = AbsenceCompensation.PAID;
  }

  if (finalEndDate < finalStartDate) {
    return NextResponse.json(
      { ok: false, error: "Ende darf nicht vor Start liegen." },
      { status: 400 }
    );
  }

  if (
    finalType !== AbsenceType.VACATION &&
    finalDayPortion === AbsenceDayPortion.HALF_DAY
  ) {
    return NextResponse.json(
      { ok: false, error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (
    finalDayPortion === AbsenceDayPortion.HALF_DAY &&
    toIsoDateUTC(finalStartDate) !== toIsoDateUTC(finalEndDate)
  ) {
    return NextResponse.json(
      { ok: false, error: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden." },
      { status: 400 }
    );
  }

  const conflictingAbsence = await prisma.absence.findFirst({
    where: {
      userId: existing.userId,
      absenceDate: {
        gte: finalStartDate,
        lte: finalEndDate,
      },
    },
    select: {
      id: true,
      absenceDate: true,
      type: true,
      dayPortion: true,
    },
  });

  if (conflictingAbsence) {
    return NextResponse.json(
      {
        ok: false,
        error: "Im Zeitraum existiert bereits eine bestätigte Abwesenheit.",
      },
      { status: 409 }
    );
  }

  const days = eachDayInclusive(finalStartDate, finalEndDate);

  const txResult = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.absenceRequest.update({
      where: { id: existing.id },
      data: {
        startDate: finalStartDate,
        endDate: finalEndDate,
        type: finalType,
        dayPortion: finalDayPortion,
        compensation: finalCompensation,
        status: AbsenceRequestStatus.APPROVED,
        decidedAt: new Date(),
        decidedById: admin.id,
      },
    });

    const createdAbsences = await tx.absence.createMany({
      data: days.map((day) => ({
        userId: existing.userId,
        absenceDate: day,
        type: finalType,
        dayPortion: finalDayPortion,
        compensation: finalCompensation,
      })),
      skipDuplicates: true,
    });

    return {
      updatedRequest,
      createdAbsences,
    };
  });

  const typeLabel =
    finalType === AbsenceType.VACATION ? "Urlaubsantrag" : "Krankheitsantrag";

  const compensationLabel =
    finalCompensation === AbsenceCompensation.UNPAID ? "unbezahlt" : "bezahlt";

  const startDate = toIsoDateUTC(finalStartDate);
  const endDate = toIsoDateUTC(finalEndDate);

  const dateLabel = portionLabel(
    finalType,
    finalDayPortion,
    startDate,
    endDate
  );

  await sendPushToUser(
    existing.userId,
    "Antrag genehmigt",
    `Dein ${typeLabel.toLowerCase()} wurde genehmigt (${dateLabel}, ${compensationLabel}).`,
    "/kalender"
  );

  return NextResponse.json({
    ok: true,
    request: {
      id: existing.id,
      status: txResult.updatedRequest.status,
      decidedAt: txResult.updatedRequest.decidedAt?.toISOString() ?? null,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
      user: {
        id: existing.user.id,
        fullName: existing.user.fullName,
      },
      type: finalType,
      dayPortion: finalDayPortion,
      compensation: finalCompensation,
      startDate,
      endDate,
    },
    createdAbsenceDays: txResult.createdAbsences.count,
    requestedDays: days.length,
  });
}