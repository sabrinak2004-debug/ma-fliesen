import { NextResponse } from "next/server";
import {
  Prisma,
  WorkEntryChangeAction,
  WorkEntryEditRequestStatus,
} from "@prisma/client";
import {
  normalizeAppUiLanguage,
  TIME_ENTRY_CORRECTION_API_TEXTS,
  translate,
} from "@/lib/i18n";
import { computeDayBreakFromGross } from "@/lib/breaks";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function toIsoDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toHHMMUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildTranslatedSnapshotValue(args: {
  value: string | null | undefined;
  sourceLanguage: string | null | undefined;
  translations: Prisma.JsonValue | null | undefined;
}): Prisma.InputJsonObject {
  return {
    value: args.value ?? "",
    sourceLanguage: args.sourceLanguage ?? null,
    translations:
      args.translations === null || args.translations === undefined
        ? null
        : args.translations,
  };
}

function buildWorkEntrySnapshot(row: {
  workDate: Date;
  startTime: Date;
  endTime: Date;
  activity: string | null;
  activitySourceLanguage?: string | null;
  activityTranslations?: Prisma.JsonValue | null;
  location: string | null;
  locationSourceLanguage?: string | null;
  locationTranslations?: Prisma.JsonValue | null;
  travelMinutes: number | null;
  grossMinutes: number | null;
  breakMinutes: number | null;
  breakAuto: boolean | null;
  workMinutes: number | null;
  noteEmployee: string | null;
  noteEmployeeSourceLanguage?: string | null;
  noteEmployeeTranslations?: Prisma.JsonValue | null;
}): Prisma.InputJsonObject {
  return {
    workDate: toIsoDateUTC(row.workDate),
    startTime: toHHMMUTC(row.startTime),
    endTime: toHHMMUTC(row.endTime),
    activity: buildTranslatedSnapshotValue({
      value: row.activity,
      sourceLanguage: row.activitySourceLanguage,
      translations: row.activityTranslations,
    }),
    location: buildTranslatedSnapshotValue({
      value: row.location,
      sourceLanguage: row.locationSourceLanguage,
      translations: row.locationTranslations,
    }),
    travelMinutes: row.travelMinutes ?? 0,
    grossMinutes: row.grossMinutes ?? 0,
    breakMinutes: row.breakMinutes ?? 0,
    breakAuto: row.breakAuto ?? false,
    workMinutes: row.workMinutes ?? 0,
    noteEmployee: buildTranslatedSnapshotValue({
      value: row.noteEmployee,
      sourceLanguage: row.noteEmployeeSourceLanguage,
      translations: row.noteEmployeeTranslations,
    }),
  };
}

async function syncDailyBreakAllocation(userId: string, workDateYMD: string): Promise<void> {
  const workDate = dateOnlyUTC(workDateYMD);

  const [entries, existingDayBreak] = await prisma.$transaction([
    prisma.workEntry.findMany({
      where: { userId, workDate },
      orderBy: [{ endTime: "asc" }, { startTime: "asc" }],
      select: { id: true, grossMinutes: true },
    }),
    prisma.dayBreak.findUnique({
      where: { userId_workDate: { userId, workDate } },
    }),
  ]);

  if (entries.length === 0) {
    if (existingDayBreak) {
      await prisma.dayBreak.delete({
        where: { userId_workDate: { userId, workDate } },
      });
    }

    return;
  }

  const dayGross = entries.reduce(
    (sum, entry) => sum + Math.max(0, entry.grossMinutes),
    0
  );
  const manualMinutes = existingDayBreak?.manualMinutes ?? 0;
  const result = computeDayBreakFromGross(dayGross, manualMinutes);

  if (existingDayBreak) {
    await prisma.dayBreak.update({
      where: { userId_workDate: { userId, workDate } },
      data: {
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      },
    });
  } else {
    await prisma.dayBreak.create({
      data: {
        userId,
        workDate,
        breakStartHHMM: null,
        breakEndHHMM: null,
        manualMinutes: 0,
        legalMinutes: result.legalBreakMinutes,
        autoSupplementMinutes: result.autoSupplementMinutes,
        effectiveMinutes: result.effectiveBreakMinutes,
      },
    });
  }

  const updates: Prisma.PrismaPromise<unknown>[] = [];
  let remainingBreak = result.effectiveBreakMinutes;

  for (const entry of [...entries].reverse()) {
    const gross = Math.max(0, entry.grossMinutes);
    const allocatedBreak = Math.min(gross, remainingBreak);
    remainingBreak -= allocatedBreak;

    updates.push(
      prisma.workEntry.update({
        where: { id: entry.id },
        data: {
          breakMinutes: allocatedBreak,
          breakAuto: allocatedBreak > 0 ? result.breakAuto : false,
          workMinutes: Math.max(0, gross - allocatedBreak),
        },
      })
    );
  }

  await prisma.$transaction(updates);
}

export async function POST(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_REQUEST_ID" },
      { status: 400 }
    );
  }

  const request = await prisma.workEntryEditRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
          language: true,
          company: {
            select: {
              subdomain: true,
            },
          },
        },
      },
      workEntry: {
        include: {
          user: {
            select: {
              companyId: true,
            },
          },
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json(
      { ok: false, error: "REQUEST_NOT_FOUND" },
      { status: 404 }
    );
  }

  const employeeLanguage = normalizeAppUiLanguage(request.user.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(employeeLanguage, key, TIME_ENTRY_CORRECTION_API_TEXTS);

  if (request.user.companyId !== admin.companyId || request.workEntry.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!request.user.isActive) {
    return NextResponse.json(
      { ok: false, error: t("employeeInactive") },
      { status: 409 }
    );
  }

  if (request.status !== WorkEntryEditRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: t("onlyPendingCanBeApproved") },
      { status: 409 }
    );
  }

  const oldUserId = request.workEntry.userId;
  const oldWorkDateYMD = toIsoDateUTC(request.workEntry.workDate);
  const oldSnapshot = buildWorkEntrySnapshot(request.workEntry);

  const start = request.requestedStartTime;
  const end = request.requestedEndTime;
  const grossMinutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60000)
  );

  const updated = await prisma.$transaction(async (tx) => {
    const updatedEntry = await tx.workEntry.update({
      where: { id: request.workEntryId },
      data: {
        workDate: request.requestedWorkDate,
        startTime: request.requestedStartTime,
        endTime: request.requestedEndTime,
        activity: request.requestedActivity,
        activitySourceLanguage: request.requestedActivitySourceLanguage,
        activityTranslations:
          request.requestedActivityTranslations === null
            ? Prisma.JsonNull
            : request.requestedActivityTranslations,
        location: request.requestedLocation,
        locationSourceLanguage: request.requestedLocationSourceLanguage,
        locationTranslations:
          request.requestedLocationTranslations === null
            ? Prisma.JsonNull
            : request.requestedLocationTranslations,
        travelMinutes: request.requestedTravelMinutes,
        grossMinutes,
        breakMinutes: 0,
        breakAuto: false,
        workMinutes: grossMinutes,
        noteEmployee: request.requestedNoteEmployee,
        noteEmployeeSourceLanguage: request.requestedNoteSourceLanguage,
        noteEmployeeTranslations:
          request.requestedNoteTranslations === null
            ? Prisma.JsonNull
            : request.requestedNoteTranslations,
      },
    });

    await tx.workEntryEditRequest.update({
      where: { id: request.id },
      data: {
        status: WorkEntryEditRequestStatus.APPROVED,
        decidedAt: new Date(),
        decidedById: admin.id,
      },
    });

    return updatedEntry;
  });

  const newWorkDateYMD = toIsoDateUTC(updated.workDate);

  await syncDailyBreakAllocation(updated.userId, newWorkDateYMD);

  if (oldUserId !== updated.userId || oldWorkDateYMD !== newWorkDateYMD) {
    await syncDailyBreakAllocation(oldUserId, oldWorkDateYMD);
  }

  const updatedFresh = await prisma.workEntry.findUnique({
    where: { id: updated.id },
  });

  if (!updatedFresh) {
    return NextResponse.json(
      { ok: false, error: "ENTRY_NOT_FOUND_AFTER_UPDATE" },
      { status: 500 }
    );
  }

  const newSnapshot = buildWorkEntrySnapshot(updatedFresh);

  await prisma.workEntryChangeReport.create({
    data: {
      workEntryId: updatedFresh.id,
      targetUserId: updatedFresh.userId,
      changedByUserId: request.userId,
      approvedByUserId: admin.id,
      action: WorkEntryChangeAction.UPDATE,
      reason: request.reason,
      reasonSourceLanguage: request.reasonSourceLanguage,
      reasonTranslations:
        request.reasonTranslations === null ? Prisma.JsonNull : request.reasonTranslations,
      oldValues: oldSnapshot,
      newValues: newSnapshot,
    },
  });

  await sendPushToUser(request.userId, {
    companyId: admin.companyId,
    companySubdomain: request.user.company.subdomain,
    title: t("workEntryEditRequestApprovedPushTitle"),
    body: t("workEntryEditRequestApprovedPushBody"),
    url: buildPushUrl(`/erfassung?entryId=${encodeURIComponent(updatedFresh.id)}`),
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: request.id,
      status: WorkEntryEditRequestStatus.APPROVED,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
    },
  });
}