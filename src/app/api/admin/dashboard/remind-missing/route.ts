// src/app/api/admin/dashboard/remind-missing/route.ts
import { NextResponse } from "next/server";
import { Role, TaskCategory, TaskRequiredAction, TaskStatus } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLocalizedPushToAdmins, sendPushToUser } from "@/lib/webpush";
import { berlinHour, berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";
import { normalizeAppUiLanguage, type AppUiLanguage } from "@/lib/i18n";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function formatDateForLanguage(language: AppUiLanguage, iso: string): string {
  const normalized = iso.length >= 10 ? iso.slice(0, 10) : iso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return iso;
  }

  const [year, month, day] = normalized.split("-");

  switch (language) {
    case "EN":
      return `${month}/${day}/${year}`;
    case "IT":
      return `${day}/${month}/${year}`;
    case "TR":
      return `${day}.${month}.${year}`;
    case "SQ":
      return `${day}.${month}.${year}`;
    case "KU":
      return `${day}.${month}.${year}`;
    case "RO":
      return `${day}.${month}.${year}`;
    case "DE":
    default:
      return `${day}.${month}.${year}`;
  }
}

function getLocalizedWorkTaskTitle(
  language: AppUiLanguage,
  referenceDate: string,
  isSingleDay: boolean
): string {
  const dateLabel = formatDateForLanguage(language, referenceDate);

  switch (language) {
    case "EN":
      return isSingleDay
        ? `Add work time for ${dateLabel}`
        : `Add work times from ${dateLabel}`;
    case "IT":
      return isSingleDay
        ? `Inserisci l'orario di lavoro per il ${dateLabel}`
        : `Inserisci gli orari di lavoro a partire dal ${dateLabel}`;
    case "TR":
      return isSingleDay
        ? `${dateLabel} için çalışma süresini gir`
        : `${dateLabel} tarihinden itibaren çalışma sürelerini gir`;
    case "SQ":
      return isSingleDay
        ? `Regjistro kohën e punës për ${dateLabel}`
        : `Regjistro kohët e punës nga ${dateLabel}`;
    case "KU":
      return isSingleDay
        ? `Dema karê ji bo ${dateLabel} binivîse`
        : `Demên karê ji ${dateLabel} û pê ve binivîse`;
    case "RO":
      return isSingleDay
        ? `Adaugă timpul de lucru pentru ${dateLabel}`
        : `Adaugă timpii de lucru începând cu ${dateLabel}`;
    case "DE":
    default:
      return isSingleDay
        ? `Arbeitszeit für ${referenceDate} nachtragen`
        : `Arbeitszeiten ab ${referenceDate} nachtragen`;
  }
}

function getLocalizedWorkTaskDescription(args: {
  language: AppUiLanguage;
  referenceDate: string;
  oldestMissingDate: string;
  newestMissingDate: string;
  missingDatesCount: number;
}): string {
  const {
    language,
    referenceDate,
    oldestMissingDate,
    newestMissingDate,
    missingDatesCount,
  } = args;

  const referenceDateLabel = formatDateForLanguage(language, referenceDate);
  const fromLabel = formatDateForLanguage(language, oldestMissingDate);
  const toLabel = formatDateForLanguage(language, newestMissingDate);

  if (missingDatesCount === 1) {
    switch (language) {
      case "EN":
        return `Please add your missing work time for ${referenceDateLabel} in the app.`;
      case "IT":
        return `Inserisci nell'app il tuo orario di lavoro mancante per il ${referenceDateLabel}.`;
      case "TR":
        return `Lütfen uygulamada ${referenceDateLabel} için eksik çalışma sürenizi girin.`;
      case "SQ":
        return `Ju lutem shtoni në aplikacion kohën tuaj të munguar të punës për ${referenceDateLabel}.`;
      case "KU":
        return `Ji kerema xwe dema karê xwe ya winda ji bo ${referenceDateLabel} di sepanê de binivîse.`;
      case "RO":
        return `Vă rugăm să adăugați în aplicație timpul de lucru lipsă pentru ${referenceDateLabel}.`;
      case "DE":
      default:
        return `Bitte trage deine fehlende Arbeitszeit für ${referenceDate} in der App nach.`;
    }
  }

  switch (language) {
    case "EN":
      return `You are missing work time entries for multiple days (${fromLabel} to ${toLabel}). Please start with the oldest open day ${referenceDateLabel}.`;
    case "IT":
      return `Mancano registrazioni dell'orario di lavoro per più giorni (${fromLabel} fino al ${toLabel}). Inizia dal giorno aperto più vecchio: ${referenceDateLabel}.`;
    case "TR":
      return `Birden fazla gün için çalışma süresi kaydınız eksik (${fromLabel} ile ${toLabel} arası). Lütfen en eski açık gün olan ${referenceDateLabel} ile başlayın.`;
    case "SQ":
      return `Ju mungojnë regjistrimet e kohës së punës për disa ditë (${fromLabel} deri më ${toLabel}). Ju lutem filloni me ditën më të vjetër të hapur ${referenceDateLabel}.`;
    case "KU":
      return `Ji bo çend rojan tomarên dema karê te kêm in (${fromLabel} heta ${toLabel}). Ji kerema xwe bi roja herî kevn a vekirî ${referenceDateLabel} dest pê bike.`;
    case "RO":
      return `Vă lipsesc înregistrări ale timpului de lucru pentru mai multe zile (${fromLabel} până la ${toLabel}). Vă rugăm să începeți cu cea mai veche zi deschisă ${referenceDateLabel}.`;
    case "DE":
    default:
      return `Dir fehlen Arbeitszeiteinträge für mehrere Tage (${oldestMissingDate} bis ${newestMissingDate}). Bitte beginne mit dem ältesten offenen Tag ${referenceDate}.`;
  }
}

function getLocalizedPushTitle(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Reminder: missing work entries";
    case "IT":
      return "Promemoria: registrazioni di lavoro mancanti";
    case "TR":
      return "Hatırlatma: eksik çalışma kayıtları";
    case "SQ":
      return "Kujtesë: regjistrime pune që mungojnë";
    case "KU":
      return "Bîranîn: tomarên karê yên winda";
    case "RO":
      return "Memento: înregistrări de lucru lipsă";
    case "DE":
    default:
      return "Erinnerung fehlende Arbeitseinträge";
  }
}

function getLocalizedPushBody(
  language: AppUiLanguage,
  oldestMissingDate: string,
  newestMissingDate: string
): string {
  const fromLabel = formatDateForLanguage(language, oldestMissingDate);
  const toLabel = formatDateForLanguage(language, newestMissingDate);
  const rangeLabel = fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;

  switch (language) {
    case "EN":
      return `You still have missing work entries for ${rangeLabel}. Please check your tasks and add the oldest missing day first.`;
    case "IT":
      return `Hai ancora registrazioni di lavoro mancanti per ${rangeLabel}. Controlla le tue attività e inserisci prima il giorno mancante più vecchio.`;
    case "TR":
      return `${rangeLabel} için hâlâ eksik çalışma kayıtlarınız var. Lütfen görevlerinizi kontrol edin ve önce en eski eksik günü girin.`;
    case "SQ":
      return `Ju mungojnë ende regjistrime pune për ${rangeLabel}. Ju lutem kontrolloni detyrat tuaja dhe regjistroni më parë ditën më të vjetër që mungon.`;
    case "KU":
      return `Hîn jî ji bo ${rangeLabel} tomarên karê te kêm in. Ji kerema xwe erkên xwe kontrol bike û pêşî roja herî kevn a winda binivîse.`;
    case "RO":
      return `Încă vă lipsesc înregistrări de lucru pentru ${rangeLabel}. Vă rugăm să verificați sarcinile și să adăugați prima data cea mai veche zi care lipsește.`;
    case "DE":
    default:
      return `Dir fehlen noch Arbeitseinträge für ${oldestMissingDate === newestMissingDate ? oldestMissingDate : `${oldestMissingDate} bis ${newestMissingDate}`}. Bitte prüfe deine Aufgaben und trage zuerst den ältesten fehlenden Tag nach.`;
  }
}

type AdminMissingSummary = {
  companyId: string;
  companySubdomain: string;
  missingEmployeesCount: number;
  missingEntriesCount: number;
  employeeNames: string[];
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

function buildEmployeeNamePreview(names: string[]): string {
  const visibleNames = names.slice(0, 5);
  const remainingCount = Math.max(0, names.length - visibleNames.length);

  if (remainingCount === 0) {
    return visibleNames.join(", ");
  }

  return `${visibleNames.join(", ")} und ${remainingCount} weitere`;
}

function getLocalizedAdminMissingPushBody(
  language: AppUiLanguage,
  summary: AdminMissingSummary
): string {
  const employeePreview = buildEmployeeNamePreview(summary.employeeNames);

  switch (language) {
    case "EN":
      return summary.missingEmployeesCount === 1
        ? `1 employee is missing work entries: ${employeePreview}.`
        : `${summary.missingEmployeesCount} employees are missing work entries: ${employeePreview}.`;
    case "IT":
      return summary.missingEmployeesCount === 1
        ? `A 1 dipendente mancano registrazioni di lavoro: ${employeePreview}.`
        : `A ${summary.missingEmployeesCount} dipendenti mancano registrazioni di lavoro: ${employeePreview}.`;
    case "TR":
      return summary.missingEmployeesCount === 1
        ? `1 çalışanın çalışma kaydı eksik: ${employeePreview}.`
        : `${summary.missingEmployeesCount} çalışanın çalışma kaydı eksik: ${employeePreview}.`;
    case "SQ":
      return summary.missingEmployeesCount === 1
        ? `1 punonjësi i mungojnë regjistrimet e punës: ${employeePreview}.`
        : `${summary.missingEmployeesCount} punonjësve u mungojnë regjistrimet e punës: ${employeePreview}.`;
    case "KU":
      return summary.missingEmployeesCount === 1
        ? `Ji 1 karmendî tomarên karê kêm in: ${employeePreview}.`
        : `Ji ${summary.missingEmployeesCount} karmendan tomarên karê kêm in: ${employeePreview}.`;
    case "RO":
      return summary.missingEmployeesCount === 1
        ? `Unui angajat îi lipsesc înregistrări de lucru: ${employeePreview}.`
        : `${summary.missingEmployeesCount} angajați au înregistrări de lucru lipsă: ${employeePreview}.`;
    case "DE":
    default:
      return summary.missingEmployeesCount === 1
        ? `Bei 1 Mitarbeiter fehlen Arbeitseinträge: ${employeePreview}.`
        : `Bei ${summary.missingEmployeesCount} Mitarbeitern fehlen Arbeitseinträge: ${employeePreview}.`;
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
        fullName: employee.fullName,
        companyId: employee.companyId,
        companySubdomain: employee.company?.subdomain ?? "",
        missingDatesCount: missingDates.length,
      };
    })
  );

  const adminSummaryMap = new Map<string, AdminMissingSummary>();

  for (const item of employeeResults) {
    if (item.missingDatesCount <= 0) {
      continue;
    }

    const existing = adminSummaryMap.get(item.companyId);

    if (existing) {
      existing.missingEmployeesCount += 1;
      existing.missingEntriesCount += item.missingDatesCount;
      existing.employeeNames.push(item.fullName);
      continue;
    }

    adminSummaryMap.set(item.companyId, {
      companyId: item.companyId,
      companySubdomain: item.companySubdomain,
      missingEmployeesCount: 1,
      missingEntriesCount: item.missingDatesCount,
      employeeNames: [item.fullName],
    });
  }

  const adminSummaries = Array.from(adminSummaryMap.values());

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
        body: (language) => getLocalizedAdminMissingPushBody(language, summary),
      });

      return {
        companyId: summary.companyId,
        companySubdomain: summary.companySubdomain,
        missingEmployeesCount: summary.missingEmployeesCount,
        missingEntriesCount: summary.missingEntriesCount,
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
    missingEntriesCount: adminSummaries.reduce(
      (sum, summary) => sum + summary.missingEntriesCount,
      0
    ),
    adminSummaries: adminPushResults,
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const userId = getString(body["userId"]).trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "EMPLOYEE_ID_MISSING" }, { status: 400 });
  }

  const employee = await prisma.appUser.findFirst({
    where: {
      id: userId,
      role: Role.EMPLOYEE,
      isActive: true,
      companyId: session.companyId,
    },
    select: {
      id: true,
      fullName: true,
      language: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ ok: false, error: "EMPLOYEE_NOT_FOUND" }, { status: 404 });
  }

  const language = normalizeAppUiLanguage(employee.language);
  const todayYMD = berlinTodayYMD();
  const missingDates = await getMissingRequiredWorkDates(employee.id, todayYMD);

  if (missingDates.length === 0) {
    return NextResponse.json(
      { ok: false, error: "NO_OVERDUE_MISSING_WORK_ENTRIES" },
      { status: 409 }
    );
  }

  const oldestMissingDate = missingDates[0];
  const newestMissingDate = missingDates[missingDates.length - 1];
  const referenceDate = oldestMissingDate;

  const existingTask = await prisma.task.findFirst({
    where: {
      assignedToUserId: employee.id,
      category: TaskCategory.WORK_TIME,
      status: TaskStatus.OPEN,
      requiredAction: TaskRequiredAction.WORK_ENTRY_FOR_DATE,
      referenceDate: dateOnlyUTC(referenceDate),
    },
    select: {
      id: true,
    },
  });

  let createdTaskId: string | null = null;

  if (!existingTask) {
    const createdTask = await prisma.task.create({
      data: {
        assignedToUserId: employee.id,
        createdByUserId: session.userId,
        title: getLocalizedWorkTaskTitle(language, referenceDate, missingDates.length === 1),
        description: getLocalizedWorkTaskDescription({
          language,
          referenceDate,
          oldestMissingDate,
          newestMissingDate,
          missingDatesCount: missingDates.length,
        }),
        category: TaskCategory.WORK_TIME,
        status: TaskStatus.OPEN,
        requiredAction: TaskRequiredAction.WORK_ENTRY_FOR_DATE,
        referenceDate: dateOnlyUTC(referenceDate),
      },
      select: {
        id: true,
      },
    });

    createdTaskId = createdTask.id;
  }

  const tenantIcon192 = `/tenant-assets/${session.companySubdomain}/icon-192.jpeg`;
  const tenantBadge = `/tenant-assets/${session.companySubdomain}/apple-touch-icon.png`;

  const sentCount = await sendPushToUser(employee.id, {
    companyId: session.companyId,
    companySubdomain: session.companySubdomain,
    title: getLocalizedPushTitle(language),
    body: getLocalizedPushBody(language, oldestMissingDate, newestMissingDate),
    url: "/aufgaben",
    icon: tenantIcon192,
    badge: tenantBadge,
  });

  if (sentCount === 0) {
    return NextResponse.json(
      { ok: false, error: "NO_ACTIVE_PUSH_SUBSCRIPTION" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    userId: employee.id,
    fullName: employee.fullName,
    sentCount,
    missingDatesCount: missingDates.length,
    oldestMissingDate,
    newestMissingDate,
    referenceDate,
    taskCreated: Boolean(createdTaskId),
    taskId: createdTaskId,
  });
}