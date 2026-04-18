import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
import {
  normalizeAppUiLanguage,
  TIME_ENTRY_CORRECTION_API_TEXTS,
  translate,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { getMissingRequiredWorkDates } from "@/lib/timesheetLock";
import { buildPushUrl, sendPushToUser } from "@/lib/webpush";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toIsoDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateOnlyUTC(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function addUtcDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
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

  const existing = await prisma.timeEntryCorrectionRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
          language: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "REQUEST_NOT_FOUND" },
      { status: 404 }
    );
  }
  const employeeLanguage = normalizeAppUiLanguage(existing.user.language);
  const t = (key: keyof typeof TIME_ENTRY_CORRECTION_API_TEXTS) =>
    translate(employeeLanguage, key, TIME_ENTRY_CORRECTION_API_TEXTS);

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  if (!existing.user.isActive) {
    return NextResponse.json(
      { ok: false, error: t("employeeInactive") },
      { status: 409 }
    );
  }

  if (existing.status !== TimeEntryCorrectionRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: t("onlyPendingCanBeApproved") },
      { status: 409 }
    );
  }

  const requestStartDateYMD = toIsoDateUTC(existing.startDate);
  const requestEndDateYMD = toIsoDateUTC(existing.endDate);
  const missingDatesInRange = await getMissingRequiredWorkDates(
    existing.userId,
    toIsoDateUTC(addUtcDays(existing.endDate, 1)),
    {
      companyId: admin.companyId,
    }
  );

  const unlockDates = missingDatesInRange
    .filter(
      (ymd) => ymd >= requestStartDateYMD && ymd <= requestEndDateYMD
    )
    .map((ymd) => dateOnlyUTC(ymd));

  const txResult = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.timeEntryCorrectionRequest.update({
      where: { id: existing.id },
      data: {
        status: TimeEntryCorrectionRequestStatus.APPROVED,
        decidedAt: new Date(),
        decidedById: admin.id,
      },
    });

    let unlockedDays = 0;

    for (const day of unlockDates) {
      await tx.timeEntryUnlock.upsert({
        where: {
          userId_workDate: {
            userId: existing.userId,
            workDate: day,
          },
        },
        update: {
          requestId: existing.id,
          usedAt: null,
          expiresAt: null,
        },
        create: {
          userId: existing.userId,
          workDate: day,
          requestId: existing.id,
          expiresAt: null,
          usedAt: null,
        },
      });

      unlockedDays += 1;
    }

    return {
      updatedRequest,
      unlockedDays,
    };
  });

  const startDate = requestStartDateYMD;
  const endDate = requestEndDateYMD;
  const dateLabel = startDate === endDate ? startDate : `${startDate} bis ${endDate}`;

  await sendPushToUser(existing.userId, {
    title: t("approvedPushTitle"),
    body: t("approvedPushBody").replace("{dateLabel}", dateLabel),
    url: buildPushUrl(`/erfassung?syncDate=${encodeURIComponent(startDate)}`),
  });

  return NextResponse.json({
    ok: true,
    request: {
      id: existing.id,
      status: txResult.updatedRequest.status,
      decidedAt: txResult.updatedRequest.decidedAt?.toISOString() ?? null,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
      user: {
        id: existing.user.id,
        fullName: existing.user.fullName,
      },
      startDate,
      endDate,
    },
    unlockedDays: txResult.unlockedDays,
  });
}