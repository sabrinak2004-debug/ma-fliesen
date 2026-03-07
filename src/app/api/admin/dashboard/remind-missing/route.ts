// src/app/api/admin/dashboard/remind-missing/route.ts
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/webpush";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function dateOnlyLocalIso(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function sendPushToUser(userId: string, title: string, body: string, url: string): Promise<number> {
  const vapidReady =
    typeof process.env.VAPID_PUBLIC_KEY === "string" &&
    process.env.VAPID_PUBLIC_KEY.trim() !== "" &&
    typeof process.env.VAPID_PRIVATE_KEY === "string" &&
    process.env.VAPID_PRIVATE_KEY.trim() !== "";

  if (!vapidReady) return 0;

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

  if (subs.length === 0) return 0;

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  let successCount = 0;

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
        successCount += 1;
      } catch {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: sub.endpoint },
        });
      }
    })
  );

  return successCount;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt." }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const userId = getString(body["userId"]).trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Mitarbeiter-ID fehlt." }, { status: 400 });
  }

  const employee = await prisma.appUser.findFirst({
    where: {
      id: userId,
      role: Role.EMPLOYEE,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ ok: false, error: "Mitarbeiter nicht gefunden." }, { status: 404 });
  }

  const todayIso = dateOnlyLocalIso(new Date());
  const todayDate = new Date(`${todayIso}T00:00:00.000Z`);

  const [absenceToday, workToday] = await Promise.all([
    prisma.absence.findFirst({
      where: {
        userId: employee.id,
        absenceDate: todayDate,
      },
      select: { id: true },
    }),
    prisma.workEntry.findFirst({
      where: {
        userId: employee.id,
        workDate: todayDate,
      },
      select: { id: true },
    }),
  ]);

  if (absenceToday) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Mitarbeiter ist heute eine Abwesenheit eingetragen." },
      { status: 409 }
    );
  }

  if (workToday) {
    return NextResponse.json(
      { ok: false, error: "Der Mitarbeiter hat seine Arbeitszeit heute bereits eingetragen." },
      { status: 409 }
    );
  }

  const sentCount = await sendPushToUser(
    employee.id,
    "Erinnerung Arbeitszeit",
    "Bitte trage deine Arbeitszeit für heute noch ein. Deadline: spätestens 23:30 Uhr.",
    "/erfassung"
  );

  if (sentCount === 0) {
    return NextResponse.json(
      { ok: false, error: "Für diesen Mitarbeiter ist keine aktive Push-Subscription vorhanden." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId: employee.id,
    fullName: employee.fullName,
    sentCount,
  });
}