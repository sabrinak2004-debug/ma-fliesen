// src/app/api/admin/dashboard/remind-admin-missing/route.ts
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendLocalizedPushToAdmins } from "@/lib/webpush";
import {
  berlinHour,
  berlinTodayYMD,
  getMissingRequiredWorkDates,
} from "@/lib/timesheetLock";
import type { AppUiLanguage } from "@/lib/i18n";

type AdminMissingTodaySummary = {
  companyId: string;
  companySubdomain: string;
  missingEmployeesCount: number;
};

function getLocalizedAdminMissingPushTitle(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Missing work entries";
    case "IT":
      return "Registrazioni di lavoro mancanti";
    case "TR":
      return "Eksik çalışma kayıtları";
    case "SQ":
      return "Regjistrime pune që mungojnë";
    case "KU":
      return "Tomarên karê yên winda";
    case "RO":
      return "Înregistrări de lucru lipsă";
    case "DE":
    default:
      return "Fehlende Arbeitseinträge";
  }
}

function getLocalizedAdminMissingPushBody(
  language: AppUiLanguage,
  missingEmployeesCount: number
): string {
  switch (language) {
    case "EN":
      return missingEmployeesCount === 1
        ? "By 8:00 PM, 1 employee has not entered any work entries today."
        : `By 8:00 PM, ${missingEmployeesCount} employees have not entered any work entries today.`;
    case "IT":
      return missingEmployeesCount === 1
        ? "Entro le 20:00, 1 dipendente non ha inserito alcuna registrazione di lavoro oggi."
        : `Entro le 20:00, ${missingEmployeesCount} dipendenti non hanno inserito alcuna registrazione di lavoro oggi.`;
    case "TR":
      return missingEmployeesCount === 1
        ? "Saat 20:00'ye kadar 1 çalışan bugün çalışma kaydı girmedi."
        : `Saat 20:00'ye kadar ${missingEmployeesCount} çalışan bugün çalışma kaydı girmedi.`;
    case "SQ":
      return missingEmployeesCount === 1
        ? "Deri në orën 20:00, 1 punonjës nuk ka regjistruar asnjë hyrje pune sot."
        : `Deri në orën 20:00, ${missingEmployeesCount} punonjës nuk kanë regjistruar asnjë hyrje pune sot.`;
    case "KU":
      return missingEmployeesCount === 1
        ? "Heta saet 20:00, 1 karmend îro tu tomarê karê nekiriye."
        : `Heta saet 20:00, ${missingEmployeesCount} karmendan îro tu tomarê karê nekiriye.`;
    case "RO":
      return missingEmployeesCount === 1
        ? "Până la ora 20:00, 1 angajat nu a introdus nicio înregistrare de lucru astăzi."
        : `Până la ora 20:00, ${missingEmployeesCount} angajați nu au introdus nicio înregistrare de lucru astăzi.`;
    case "DE":
    default:
      return missingEmployeesCount === 1
        ? "Bis 21 Uhr hat 1 Mitarbeiter heute keinen Arbeitseintrag erfasst."
        : `Bis 21 Uhr haben ${missingEmployeesCount} Mitarbeiter heute keine Arbeitseinträge erfasst.`;
  }
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || authorization !== expected) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const berlinCurrentHour = berlinHour();

  if (berlinCurrentHour !== 20) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "NOT_20_BERLIN",
      berlinCurrentHour,
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
      companyId: true,
      company: {
        select: {
          subdomain: true,
        },
      },
    },
    orderBy: [{ companyId: "asc" }, { fullName: "asc" }],
  });

  const employeeResults = await Promise.all(
    employees.map(async (employee) => {
      const missingDates = await getMissingRequiredWorkDates(
        employee.id,
        todayYMD,
        {
          includeUntilDate: true,
        }
      );

      return {
        userId: employee.id,
        companyId: employee.companyId,
        companySubdomain: employee.company?.subdomain ?? "",
        isMissingToday: missingDates.includes(todayYMD),
      };
    })
  );

  const adminSummaryMap = new Map<string, AdminMissingTodaySummary>();

  for (const item of employeeResults) {
    if (!item.isMissingToday) {
      continue;
    }

    const existing = adminSummaryMap.get(item.companyId);

    if (existing) {
      existing.missingEmployeesCount += 1;
      continue;
    }

    adminSummaryMap.set(item.companyId, {
      companyId: item.companyId,
      companySubdomain: item.companySubdomain,
      missingEmployeesCount: 1,
    });
  }

  const adminSummaries = Array.from(adminSummaryMap.values());

  if (adminSummaries.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "NO_MISSING_WORK_ENTRIES_TODAY",
      missingEmployeesCount: 0,
    });
  }

  const adminPushResults = await Promise.all(
    adminSummaries.map(async (summary) => {
      const tenantIcon192 = summary.companySubdomain
        ? `/tenant-assets/${summary.companySubdomain}/icon-192.jpeg`
        : undefined;

      const tenantBadge = summary.companySubdomain
        ? `/tenant-assets/${summary.companySubdomain}/apple-touch-icon.png`
        : undefined;

      const sentCount = await sendLocalizedPushToAdmins({
        companyId: summary.companyId,
        companySubdomain: summary.companySubdomain,
        url: "/admin/dashboard",
        icon: tenantIcon192,
        badge: tenantBadge,
        title: (language) => getLocalizedAdminMissingPushTitle(language),
        body: (language) =>
          getLocalizedAdminMissingPushBody(
            language,
            summary.missingEmployeesCount
          ),
      });

      return {
        companyId: summary.companyId,
        companySubdomain: summary.companySubdomain,
        missingEmployeesCount: summary.missingEmployeesCount,
        sentCount,
      };
    })
  );

  const adminPushSentCount = adminPushResults.reduce(
    (sum, item) => sum + item.sentCount,
    0
  );

  return NextResponse.json({
    ok: true,
    sent: adminPushSentCount > 0,
    adminPushSentCount,
    missingCompaniesCount: adminSummaries.length,
    missingEmployeesCount: adminSummaries.reduce(
      (sum, summary) => sum + summary.missingEmployeesCount,
      0
    ),
    adminSummaries: adminPushResults,
  });
}