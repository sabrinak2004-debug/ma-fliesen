// src/app/api/admin/dashboard/remind-admin-missing/route.ts
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/webpush";
import { berlinHour, berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || authorization !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const berlinCurrentHour = berlinHour();
  if (berlinCurrentHour < 18) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "Vor 18:00 Uhr Berlin-Zeit werden keine Mitarbeiter-Erinnerungen gesendet.",
    });
  }

  const todayYMD = berlinTodayYMD();

  const employees = await prisma.appUser.findMany({
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
  });

  const results = await Promise.all(
    employees.map(async (employee) => {
      const missingDates = await getMissingRequiredWorkDates(employee.id, todayYMD);

      if (missingDates.length === 0) {
        return {
          userId: employee.id,
          fullName: employee.fullName,
          missingDatesCount: 0,
          oldestMissingDate: null,
          sentCount: 0,
        };
      }

      if (missingDates.length < 5) {
        return {
          userId: employee.id,
          fullName: employee.fullName,
          missingDatesCount: missingDates.length,
          oldestMissingDate: missingDates[0],
          sentCount: 0,
        };
      }

      const oldestMissingDate = missingDates[0];
      const newestMissingDate = missingDates[missingDates.length - 1];
      const rangeLabel =
        oldestMissingDate === newestMissingDate
          ? oldestMissingDate
          : `${oldestMissingDate} bis ${newestMissingDate}`;

      const sentCount = await sendPushToUser(employee.id, {
        title: "Fehlende Arbeitseinträge",
        body: `Dir fehlen noch Arbeitseinträge für ${rangeLabel}. Bitte stelle jetzt einen Nachtragsantrag, falls du die Tage nicht mehr selbst eintragen kannst.`,
        url: "/erfassung",
      });

      return {
        userId: employee.id,
        fullName: employee.fullName,
        missingDatesCount: missingDates.length,
        oldestMissingDate,
        sentCount,
      };
    })
  );

  const notifiedEmployees = results.filter((item) => item.sentCount > 0);

  return NextResponse.json({
    ok: true,
    sent: notifiedEmployees.length > 0,
    sentCount: notifiedEmployees.reduce((sum, item) => sum + item.sentCount, 0),
    notifiedEmployeesCount: notifiedEmployees.length,
    notifiedEmployees: notifiedEmployees.map((item) => ({
      userId: item.userId,
      fullName: item.fullName,
      missingDatesCount: item.missingDatesCount,
      oldestMissingDate: item.oldestMissingDate,
    })),
  });
}