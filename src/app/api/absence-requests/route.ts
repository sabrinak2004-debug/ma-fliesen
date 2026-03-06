import { NextResponse } from "next/server";
import { AbsenceRequestStatus, AbsenceType, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/webpush";

type CreateAbsenceRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  type?: unknown;
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

function isAbsenceType(v: string): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
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

async function sendPushToAdmins(title: string, body: string, url: string): Promise<void> {
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

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt." }, { status: 401 });
  }

  const me = await prisma.appUser.findUnique({
    where: { id: session.userId },
    select: { id: true, isActive: true, role: true },
  });

  if (!me || !me.isActive) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = (searchParams.get("month") ?? "").trim();

  const whereBase = { userId: me.id };

  const where =
    month && /^\d{4}-\d{2}$/.test(month)
      ? {
          ...whereBase,
          startDate: {
            lt: new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)),
          },
          endDate: {
            gte: new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)),
          },
        }
      : whereBase;

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
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((r) => ({
      id: r.id,
      startDate: toIsoDateUTC(r.startDate),
      endDate: toIsoDateUTC(r.endDate),
      type: r.type,
      status: r.status,
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
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt." }, { status: 401 });
  }

  const me = await prisma.appUser.findUnique({
    where: { id: session.userId },
    select: { id: true, fullName: true, isActive: true, role: true },
  });

  if (!me || !me.isActive) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  if (me.role !== Role.EMPLOYEE) {
    return NextResponse.json({ ok: false, error: "Nur Mitarbeiter können Anträge erstellen." }, { status: 403 });
  }

  let rawBody: unknown = null;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const body: CreateAbsenceRequestBody = isRecord(rawBody) ? rawBody : {};

  const startDate = getString(body.startDate).trim();
  const endDate = getString(body.endDate).trim();
  const type = getString(body.type).trim();
  const noteEmployee = getString(body.noteEmployee).trim();

  if (!startDate || !endDate || !type) {
    return NextResponse.json({ ok: false, error: "Startdatum, Enddatum und Typ sind erforderlich." }, { status: 400 });
  }

  if (!isYYYYMMDD(startDate) || !isYYYYMMDD(endDate)) {
    return NextResponse.json({ ok: false, error: "Datum muss im Format YYYY-MM-DD sein." }, { status: 400 });
  }

  if (!isAbsenceType(type)) {
    return NextResponse.json({ ok: false, error: "Ungültiger Abwesenheitstyp." }, { status: 400 });
  }

  const start = dateOnlyUTC(startDate);
  const end = dateOnlyUTC(endDate);

  if (end < start) {
    return NextResponse.json({ ok: false, error: "Enddatum darf nicht vor Startdatum liegen." }, { status: 400 });
  }

  const overlappingApprovedAbsence = await prisma.absence.findFirst({
    where: {
      userId: me.id,
      absenceDate: {
        gte: start,
        lte: end,
      },
    },
    select: { id: true },
  });

  if (overlappingApprovedAbsence) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Zeitraum existiert bereits eine bestätigte Abwesenheit." },
      { status: 409 }
    );
  }

  const overlappingPendingRequest = await prisma.absenceRequest.findFirst({
    where: {
      userId: me.id,
      status: AbsenceRequestStatus.PENDING,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { id: true },
  });

  if (overlappingPendingRequest) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Zeitraum existiert bereits ein offener Antrag." },
      { status: 409 }
    );
  }

  const created = await prisma.absenceRequest.create({
    data: {
      userId: me.id,
      startDate: start,
      endDate: end,
      type,
      status: AbsenceRequestStatus.PENDING,
      noteEmployee: noteEmployee || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const typeLabel = created.type === "VACATION" ? "Urlaubsantrag" : "Krankheitsantrag";
  const dateLabel =
    startDate === endDate ? startDate : `${startDate} bis ${endDate}`;

  await sendPushToAdmins(
    "Neuer Abwesenheitsantrag",
    `${me.fullName}: ${typeLabel} für ${dateLabel}`,
    created.type === "VACATION" ? "/admin/urlaubsantraege" : "/admin/krankheitsantraege"
  );

  return NextResponse.json({
    ok: true,
    request: {
      id: created.id,
      startDate: toIsoDateUTC(created.startDate),
      endDate: toIsoDateUTC(created.endDate),
      type: created.type,
      status: created.status,
      noteEmployee: created.noteEmployee ?? "",
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      user: {
        id: created.user.id,
        fullName: created.user.fullName,
      },
    },
  });
}