// src/app/api/admin/dashboard/remind-admin-missing/route.ts
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/webpush";

function dateOnlyLocalIso(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function sendPushToAdmins(title: string, body: string, url: string): Promise<number> {
  const vapidReady =
    typeof process.env.VAPID_PUBLIC_KEY === "string" &&
    process.env.VAPID_PUBLIC_KEY.trim() !== "" &&
    typeof process.env.VAPID_PRIVATE_KEY === "string" &&
    process.env.VAPID_PRIVATE_KEY.trim() !== "";

  if (!vapidReady) return 0;

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

  if (admins.length === 0) return 0;

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  let successCount = 0;

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

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || authorization !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const todayIso = dateOnlyLocalIso(new Date());
  const todayDate = new Date(`${todayIso}T00:00:00.000Z`);

  const [employees, absentToday, workedToday] = await Promise.all([
    prisma.appUser.findMany({
      where: {
        role: Role.EMPLOYEE,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
      },
      orderBy: {
        fullName: "asc",
      },
    }),
    prisma.absence.findMany({
      where: {
        absenceDate: todayDate,
      },
      select: {
        userId: true,
      },
    }),
    prisma.workEntry.findMany({
      where: {
        workDate: todayDate,
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    }),
  ]);

  const absentSet = new Set(absentToday.map((row) => row.userId));
  const workedSet = new Set(workedToday.map((row) => row.userId));

  const missingEmployees = employees.filter(
    (employee) => !absentSet.has(employee.id) && !workedSet.has(employee.id)
  );

  if (missingEmployees.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: false,
      missingCount: 0,
    });
  }

  const previewNames = missingEmployees.slice(0, 3).map((employee) => employee.fullName).join(", ");
  const moreCount = Math.max(0, missingEmployees.length - 3);

  const body =
    moreCount > 0
      ? `${missingEmployees.length} fehlende Einträge heute, z. B. ${previewNames} + ${moreCount} weitere.`
      : `${missingEmployees.length} fehlende Einträge heute: ${previewNames}.`;

  const sentCount = await sendPushToAdmins(
    "Fehlende Zeiteinträge",
    body,
    "/admin/dashboard"
  );

  return NextResponse.json({
    ok: true,
    sent: sentCount > 0,
    sentCount,
    missingCount: missingEmployees.length,
  });
}