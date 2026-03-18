import { NextResponse } from "next/server";
import {
  AbsenceCompensation,
  AbsenceDayPortion,
  AbsenceRequestStatus,
  AbsenceType,
  Role,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/webpush";

type CreateAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
  dayPortion?: unknown;
  noteEmployee?: unknown;
  compensation?: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isYYYYMM(v: string): boolean {
  return /^\d{4}-\d{2}$/.test(v);
}

function isYYYYMMDD(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
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

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function sendPushToAdmins(
  companyId: string,
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

  const admins = await prisma.pushSubscription.findMany({
    where: {
      user: {
        role: Role.ADMIN,
        isActive: true,
        companyId,
      },
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  await Promise.all(
    admins.map(async (sub) => {
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
          where: { endpoint: sub.endpoint },
        });
      }
    })
  );
}

function mapRequest(r: {
  id: string;
  startDate: Date;
  endDate: Date;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  noteEmployee: string | null;
  createdAt: Date;
  updatedAt: Date;
  decidedAt: Date | null;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
}) {
  return {
    id: r.id,
    startDate: toIsoDateUTC(r.startDate),
    endDate: toIsoDateUTC(r.endDate),
    type: r.type,
    dayPortion: r.dayPortion,
    status: r.status,
    compensation: r.compensation,
    noteEmployee: r.noteEmployee ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    user: {
      id: r.user.id,
      fullName: r.user.fullName,
    },
    decidedBy: r.decidedBy
      ? {
          id: r.decidedBy.id,
          fullName: r.decidedBy.fullName,
        }
      : null,
  };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const monthParam = (searchParams.get("month") ?? "").trim();

  const where: {
    userId: string;
    startDate?: { lt: Date };
    endDate?: { gte: Date };
  } = {
    userId: session.userId,
  };

  if (monthParam) {
    if (!isYYYYMM(monthParam)) {
      return NextResponse.json(
        { ok: false, error: "month muss YYYY-MM sein." },
        { status: 400 }
      );
    }

    const year = Number(monthParam.slice(0, 4));
    const month = Number(monthParam.slice(5, 7));

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    where.startDate = { lt: nextMonthStart };
    where.endDate = { gte: monthStart };
  }

  const requests = await prisma.absenceRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map(mapRequest),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: CreateAbsenceRequestBody = isRecord(raw)
    ? raw
    : {};

  const startDate = getString(body.startDate).trim();
  const endDate = getString(body.endDate).trim();
  const typeRaw = getString(body.type).trim();
  const dayPortionRaw = getString(body.dayPortion).trim();
  const noteEmployee = getString(body.noteEmployee).trim();
  const compensationRaw = getString(body.compensation).trim();

  if (!isYYYYMMDD(startDate) || !isYYYYMMDD(endDate)) {
    return NextResponse.json(
      { ok: false, error: "Start- und Enddatum müssen YYYY-MM-DD sein." },
      { status: 400 }
    );
  }

  if (!isAbsenceType(typeRaw)) {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Abwesenheitstyp." },
      { status: 400 }
    );
  }

  const dayPortion: AbsenceDayPortion =
    isAbsenceDayPortion(dayPortionRaw) ? dayPortionRaw : AbsenceDayPortion.FULL_DAY;

  const compensation: AbsenceCompensation =
    isAbsenceCompensation(compensationRaw) ? compensationRaw : AbsenceCompensation.PAID;

  const start = dateOnlyUTC(startDate);
  const end = dateOnlyUTC(endDate);

  if (end < start) {
    return NextResponse.json(
      { ok: false, error: "Ende darf nicht vor Start liegen." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && dayPortion !== AbsenceDayPortion.FULL_DAY) {
    return NextResponse.json(
      { ok: false, error: "Krankheit kann nur ganztägig beantragt werden." },
      { status: 400 }
    );
  }

  if (typeRaw === "SICK" && compensation !== AbsenceCompensation.PAID) {
    return NextResponse.json(
      { ok: false, error: "Krankheit darf nicht als unbezahlt beantragt werden." },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    typeRaw !== "VACATION"
  ) {
    return NextResponse.json(
      { ok: false, error: "Halbe Tage sind nur für Urlaub erlaubt." },
      { status: 400 }
    );
  }

  if (
    dayPortion === AbsenceDayPortion.HALF_DAY &&
    startDate !== endDate
  ) {
    return NextResponse.json(
      { ok: false, error: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden." },
      { status: 400 }
    );
  }

  const conflictingApprovedAbsence = await prisma.absence.findFirst({
    where: {
      userId: session.userId,
      absenceDate: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingApprovedAbsence) {
    return NextResponse.json(
      {
        ok: false,
        error: "Im gewünschten Zeitraum existiert bereits eine bestätigte Abwesenheit.",
      },
      { status: 409 }
    );
  }

  const conflictingPendingRequest = await prisma.absenceRequest.findFirst({
    where: {
      userId: session.userId,
      status: AbsenceRequestStatus.PENDING,
      startDate: {
        lte: end,
      },
      endDate: {
        gte: start,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingPendingRequest) {
    return NextResponse.json(
      {
        ok: false,
        error: "Für diesen Zeitraum existiert bereits ein offener Antrag.",
      },
      { status: 409 }
    );
  }

  const created = await prisma.absenceRequest.create({
    data: {
      userId: session.userId,
      startDate: start,
      endDate: end,
      type: typeRaw,
      dayPortion,
      status: AbsenceRequestStatus.PENDING,
      compensation,
      noteEmployee: noteEmployee || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const typeLabel = typeRaw === "VACATION" ? "Urlaub" : "Krankheit";
  const compensationLabel =
    typeRaw === "VACATION"
      ? compensation === AbsenceCompensation.UNPAID
        ? "unbezahlt"
        : "bezahlt"
      : "";

  const dateLabel =
    dayPortion === AbsenceDayPortion.HALF_DAY
      ? `halber Urlaubstag am ${startDate}`
      : startDate === endDate
        ? startDate
        : `${startDate} bis ${endDate}`;

  await sendPushToAdmins(
    session.companyId,
    "Neuer Abwesenheitsantrag",
    `${session.fullName} hat ${typeLabel.toLowerCase()} beantragt (${dateLabel}${typeRaw === "VACATION" ? `, ${compensationLabel}` : ""}).`,
    "/admin/urlaubsantraege"
  );

  return NextResponse.json({
    ok: true,
    request: mapRequest(created),
  });
}