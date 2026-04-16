// src/app/api/admin/dashboard/remind-admin-missing/route.ts
import { NextResponse } from "next/server";
import { Role, TaskCategory, TaskRequiredAction, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/webpush";
import { berlinHour, berlinTodayYMD, getMissingRequiredWorkDates } from "@/lib/timesheetLock";
import { normalizeAppUiLanguage, type AppUiLanguage } from "@/lib/i18n";

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
    case "DE":
    default:
      return `${day}.${month}.${year}`;
    case "RO":
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
    case "DE":
    default:
      return isSingleDay
        ? `Arbeitszeit für ${referenceDate} nachtragen`
        : `Arbeitszeiten ab ${referenceDate} nachtragen`;
    case "RO":
      return isSingleDay
        ? `Adaugă timpul de lucru pentru ${dateLabel}`
        : `Adaugă timpii de lucru începând cu ${dateLabel}`;
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
      case "DE":
      default:
        return `Bitte trage deine fehlende Arbeitszeit für ${referenceDate} in der App nach.`;
      case "RO":
        return `Vă rugăm să adăugați în aplicație timpul de lucru lipsă pentru ${referenceDateLabel}.`;
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
      return `You still have missing work entries for ${rangeLabel}. Please open your tasks and start with the oldest missing day.`;
    case "IT":
      return `Hai ancora registrazioni di lavoro mancanti per ${rangeLabel}. Apri le tue attività e inizia dal giorno mancante più vecchio.`;
    case "TR":
      return `${rangeLabel} için hâlâ eksik çalışma kayıtlarınız var. Lütfen görevlerinizi açın ve en eski eksik günle başlayın.`;
    case "SQ":
      return `Ju mungojnë ende regjistrime pune për ${rangeLabel}. Ju lutem hapni detyrat tuaja dhe filloni me ditën më të vjetër që mungon.`;
    case "KU":
      return `Hîn jî ji bo ${rangeLabel} tomarên karê te kêm in. Ji kerema xwe erkên xwe veke û bi roja herî kevn a winda dest pê bike.`;
    case "RO":
      return `Încă vă lipsesc înregistrări de lucru pentru ${rangeLabel}. Vă rugăm să deschideți sarcinile și să începeți cu cea mai veche zi care lipsește.`;
    case "DE":
    default:
      return `Dir fehlen noch Arbeitseinträge für ${oldestMissingDate === newestMissingDate ? oldestMissingDate : `${oldestMissingDate} bis ${newestMissingDate}`}. Bitte öffne deine Aufgaben und beginne mit dem ältesten fehlenden Tag.`;
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
  if (berlinCurrentHour < 18) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "BEFORE_18_BERLIN",
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
      language: true,
      company: {
        select: {
          subdomain: true,
        },
      },
    },
    orderBy: [{ companyId: "asc" }, { fullName: "asc" }],
  });

  const results = await Promise.all(
    employees.map(async (employee) => {
      const language = normalizeAppUiLanguage(employee.language);
      const missingDates = await getMissingRequiredWorkDates(employee.id, todayYMD);

      if (missingDates.length === 0) {
        return {
          userId: employee.id,
          fullName: employee.fullName,
          companyId: employee.companyId,
          missingDatesCount: 0,
          oldestMissingDate: null as string | null,
          sentCount: 0,
          referenceDate: null as string | null,
          taskCreated: false,
        };
      }

      if (missingDates.length < 5) {
        return {
          userId: employee.id,
          fullName: employee.fullName,
          companyId: employee.companyId,
          missingDatesCount: missingDates.length,
          oldestMissingDate: missingDates[0],
          sentCount: 0,
          referenceDate: null as string | null,
          taskCreated: false,
        };
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
        const systemAdmin = await prisma.appUser.findFirst({
          where: {
            role: Role.ADMIN,
            isActive: true,
            companyId: employee.companyId,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
          },
        });

        if (systemAdmin) {
          const createdTask = await prisma.task.create({
            data: {
              assignedToUserId: employee.id,
              createdByUserId: systemAdmin.id,
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
      }

      const companySubdomain = employee.company?.subdomain ?? "";
      const tenantIcon192 = companySubdomain
        ? `/tenant-assets/${companySubdomain}/icon-192.jpeg`
        : undefined;
      const tenantBadge = companySubdomain
        ? `/tenant-assets/${companySubdomain}/apple-touch-icon.png`
        : undefined;

      const sentCount = await sendPushToUser(employee.id, {
        companyId: employee.companyId,
        companySubdomain,
        title: getLocalizedPushTitle(language),
        body: getLocalizedPushBody(language, oldestMissingDate, newestMissingDate),
        url: "/aufgaben",
        icon: tenantIcon192,
        badge: tenantBadge,
      });

      return {
        userId: employee.id,
        fullName: employee.fullName,
        companyId: employee.companyId,
        missingDatesCount: missingDates.length,
        oldestMissingDate,
        sentCount,
        referenceDate,
        taskCreated: Boolean(createdTaskId),
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
      companyId: item.companyId,
      missingDatesCount: item.missingDatesCount,
      oldestMissingDate: item.oldestMissingDate,
      referenceDate: item.referenceDate,
      taskCreated: item.taskCreated,
    })),
  });
}