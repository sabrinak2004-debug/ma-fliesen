import { NextResponse } from "next/server";
import {
  Role,
  TimeEntryCorrectionRequestStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/webpush";
import {
  berlinTodayYMD,
  getMissingRequiredWorkDates,
  requiresTimeEntryUnlock,
} from "@/lib/timesheetLock";

type CreateTimeEntryCorrectionRequestBody = {
  targetDate?: unknown;
  noteEmployee?: unknown;
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

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addUtcDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

async function sendPushToAdmins(
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
      },
    },
    select: {
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
  status: TimeEntryCorrectionRequestStatus;
  noteEmployee: string | null;
  noteAdmin: string | null;
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
    status: r.status,
    noteEmployee: r.noteEmployee ?? "",
    noteAdmin: r.noteAdmin ?? "",
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

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const requests = await prisma.timeEntryCorrectionRequest.findMany({
    where: {
      userId: session.userId,
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
    orderBy: [{ createdAt: "desc" }],
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

  if (session.role !== Role.EMPLOYEE) {
    return NextResponse.json(
      { ok: false, error: "Nur Mitarbeiter können Nachtragsanträge stellen." },
      { status: 403 }
    );
  }

  const raw = (await req.json().catch(() => null)) as unknown;
  const body: CreateTimeEntryCorrectionRequestBody = isRecord(raw) ? raw : {};

  const targetDate = getString(body.targetDate).trim();
  const noteEmployee = getString(body.noteEmployee).trim();

  if (!isYYYYMMDD(targetDate)) {
    return NextResponse.json(
      { ok: false, error: "targetDate muss YYYY-MM-DD sein." },
      { status: 400 }
    );
  }

  const today = berlinTodayYMD();

  if (targetDate >= today) {
    return NextResponse.json(
      { ok: false, error: "Ein Nachtragsantrag ist nur für vergangene Tage möglich." },
      { status: 400 }
    );
  }

  const missingDates = await getMissingRequiredWorkDates(
    session.userId,
    today
  );

  const lockedMissingDates = missingDates.filter((dateYMD) =>
    requiresTimeEntryUnlock(dateYMD, today)
  );

  if (lockedMissingDates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Aktuell gibt es keine gesperrten fehlenden Arbeitseinträge." },
      { status: 409 }
    );
  }

  if (!lockedMissingDates.includes(targetDate)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Für dieses Datum ist aktuell noch kein Nachtragsantrag erforderlich oder das Datum gehört nicht zu den gesperrten fehlenden Arbeitstagen.",
      },
      { status: 409 }
    );
  }

  const startDateYMD = lockedMissingDates[0];
  const endDateYMD = lockedMissingDates[lockedMissingDates.length - 1];

  const startDate = dateOnlyUTC(startDateYMD);
  const endDate = dateOnlyUTC(endDateYMD);

  const existingPending = await prisma.timeEntryCorrectionRequest.findFirst({
    where: {
      userId: session.userId,
      status: TimeEntryCorrectionRequestStatus.PENDING,
      startDate: {
        lte: endDate,
      },
      endDate: {
        gte: startDate,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingPending) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Zeitraum existiert bereits ein offener Nachtragsantrag." },
      { status: 409 }
    );
  }

  const created = await prisma.timeEntryCorrectionRequest.create({
    data: {
      userId: session.userId,
      startDate,
      endDate,
      status: TimeEntryCorrectionRequestStatus.PENDING,
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

  const dateLabel =
    startDateYMD === endDateYMD
      ? startDateYMD
      : `${startDateYMD} bis ${endDateYMD}`;

  await sendPushToAdmins(
    "Neuer Nachtragsantrag",
    `${session.fullName} hat einen Nachtragsantrag für ${dateLabel} gestellt.`,
    "/admin/nachtragsanfragen"
  );

  return NextResponse.json({
    ok: true,
    request: mapRequest(created),
  });
}