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

type MissingEmployeeSummary = {
  userId: string;
  fullName: string;
  missingDatesCount: number;
  oldestMissingDate: string;
  newestMissingDate: string;
};

type CompanyMissingSummary = {
  companyId: string;
  companySubdomain: string;
  missingEmployees: MissingEmployeeSummary[];
};

function getAdminMissingEntriesPushTitle(language: AppUiLanguage): string {
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

function getAdminMissingEntriesPushBody(args: {
  language: AppUiLanguage;
  missingEmployeesCount: number;
  employeeNames: string[];
}): string {
  const { language, missingEmployeesCount, employeeNames } = args;
  const shownNames = employeeNames.slice(0, 5).join(", ");
  const additionalCount = Math.max(employeeNames.length - 5, 0);

  const namesSuffix =
    shownNames.length > 0
      ? additionalCount > 0
        ? ` Betroffen: ${shownNames} und ${additionalCount} weitere.`
        : ` Betroffen: ${shownNames}.`
      : "";

  switch (language) {
    case "EN":
      return `${missingEmployeesCount} employee${
        missingEmployeesCount === 1 ? " is" : "s are"
      } missing work entries.${namesSuffix} Please check the admin dashboard.`;
    case "IT":
      return `Mancano registrazioni di lavoro per ${missingEmployeesCount} dipendent${
        missingEmployeesCount === 1 ? "e" : "i"
      }.${namesSuffix} Controlla la dashboard admin.`;
    case "TR":
      return `${missingEmployeesCount} çalışan için çalışma kaydı eksik.${namesSuffix} Lütfen admin panelini kontrol edin.`;
    case "SQ":
      return `Mungojnë regjistrime pune për ${missingEmployeesCount} punonjës.${namesSuffix} Ju lutem kontrolloni panelin e adminit.`;
    case "KU":
      return `Ji bo ${missingEmployeesCount} karmendan tomarên karê kêm in.${namesSuffix} Ji kerema xwe panela admin kontrol bike.`;
    case "RO":
      return `Lipsesc înregistrări de lucru pentru ${missingEmployeesCount} angajat${
        missingEmployeesCount === 1 ? "" : "i"
      }.${namesSuffix} Vă rugăm să verificați panoul de admin.`;
    case "DE":
    default:
      return `Bei ${missingEmployeesCount} Mitarbeitenden fehlen Arbeitseinträge.${namesSuffix} Bitte prüfe das Admin-Dashboard.`;
  }
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization") ?? "";
  const expected = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || authorization !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const berlinCurrentHour = berlinHour();

  if (berlinCurrentHour !== 21) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "NOT_21_BERLIN",
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

  const companySummaries = new Map<string, CompanyMissingSummary>();

  await Promise.all(
    employees.map(async (employee) => {
      const missingDates = await getMissingRequiredWorkDates(employee.id, todayYMD, {
        includeUntilDate: true,
        companyId: employee.companyId,
      });

      if (missingDates.length === 0) {
        return;
      }

      const companySubdomain = employee.company?.subdomain ?? "";
      const existingSummary = companySummaries.get(employee.companyId);

      const employeeSummary: MissingEmployeeSummary = {
        userId: employee.id,
        fullName: employee.fullName,
        missingDatesCount: missingDates.length,
        oldestMissingDate: missingDates[0],
        newestMissingDate: missingDates[missingDates.length - 1],
      };

      if (existingSummary) {
        existingSummary.missingEmployees.push(employeeSummary);
        return;
      }

      companySummaries.set(employee.companyId, {
        companyId: employee.companyId,
        companySubdomain,
        missingEmployees: [employeeSummary],
      });
    })
  );

  const summaries = Array.from(companySummaries.values());

  if (summaries.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "NO_MISSING_WORK_ENTRIES",
      todayYMD,
    });
  }

  const sendResults = await Promise.all(
    summaries.map(async (summary) => {
      const tenantIcon192 = summary.companySubdomain
        ? `/tenant-assets/${summary.companySubdomain}/icon-192.jpeg`
        : undefined;

      const tenantBadge = summary.companySubdomain
        ? `/tenant-assets/${summary.companySubdomain}/apple-touch-icon.png`
        : undefined;

      const employeeNames = summary.missingEmployees.map(
        (employee) => employee.fullName
      );

      const sentCount = await sendLocalizedPushToAdmins({
        companyId: summary.companyId,
        companySubdomain: summary.companySubdomain,
        url: "/admin/dashboard",
        icon: tenantIcon192,
        badge: tenantBadge,
        title: getAdminMissingEntriesPushTitle,
        body: (language) =>
          getAdminMissingEntriesPushBody({
            language,
            missingEmployeesCount: summary.missingEmployees.length,
            employeeNames,
          }),
      });

      return {
        companyId: summary.companyId,
        companySubdomain: summary.companySubdomain,
        sentCount,
        missingEmployeesCount: summary.missingEmployees.length,
        missingEmployees: summary.missingEmployees,
      };
    })
  );

  return NextResponse.json({
    ok: true,
    sent: sendResults.some((result) => result.sentCount > 0),
    sentCount: sendResults.reduce((sum, result) => sum + result.sentCount, 0),
    companiesCount: sendResults.length,
    totalMissingEmployeesCount: sendResults.reduce(
      (sum, result) => sum + result.missingEmployeesCount,
      0
    ),
    todayYMD,
    companies: sendResults,
  });
}