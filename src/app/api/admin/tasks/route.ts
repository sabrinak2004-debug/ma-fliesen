import { NextResponse } from "next/server";
import {
  TaskCategory,
  TaskRequiredAction,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendPushToUser } from "@/lib/webpush";

type CreateTaskBody = {
  assignedToUserId?: string;
  title?: string;
  description?: string;
  category?: string;
  requiredAction?: string;
  referenceStartDate?: string;
  referenceEndDate?: string;
};

function isTaskCategory(value: string): value is TaskCategory {
  return (
    value === "WORK_TIME" ||
    value === "VACATION" ||
    value === "SICKNESS" ||
    value === "GENERAL"
  );
}

function isTaskRequiredAction(value: string): value is TaskRequiredAction {
  return (
    value === "NONE" ||
    value === "WORK_ENTRY_FOR_DATE" ||
    value === "VACATION_ENTRY_FOR_DATE" ||
    value === "SICK_ENTRY_FOR_DATE"
  );
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseReferenceDate(value: string | null): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function toIsoDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeReferenceRange(args: {
  referenceStartDateRaw: string | null;
  referenceEndDateRaw: string | null;
}): {
  referenceDate: Date | null;
  referenceStartDate: Date | null;
  referenceEndDate: Date | null;
} | null {
  const startDate = parseReferenceDate(args.referenceStartDateRaw);
  const endDate = parseReferenceDate(args.referenceEndDateRaw ?? args.referenceStartDateRaw);

  if (args.referenceStartDateRaw && !startDate) {
    return null;
  }

  if ((args.referenceEndDateRaw ?? args.referenceStartDateRaw) && !endDate) {
    return null;
  }

  if (!startDate && !endDate) {
    return {
      referenceDate: null,
      referenceStartDate: null,
      referenceEndDate: null,
    };
  }

  if (!startDate || !endDate) {
    return null;
  }

  const startYMD = toIsoDateUTC(startDate);
  const endYMD = toIsoDateUTC(endDate);

  if (startYMD > endYMD) {
    return null;
  }

  return {
    referenceDate: startDate,
    referenceStartDate: startDate,
    referenceEndDate: endDate,
  };
}

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const [tasks, employees] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToUser: {
          companyId: admin.companyId,
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        assignedToUser: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        completedByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.appUser.findMany({
      where: {
        isActive: true,
        role: "EMPLOYEE",
        companyId: admin.companyId,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
      },
    }),
  ]);

  return NextResponse.json({ tasks, employees });
}

export async function POST(req: Request): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  let body: CreateTaskBody;
  try {
    body = (await req.json()) as CreateTaskBody;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const assignedToUserId = parseOptionalString(body.assignedToUserId);
  const title = parseOptionalString(body.title);
  const description = parseOptionalString(body.description);
  const categoryRaw = parseOptionalString(body.category);
  const requiredActionRaw = parseOptionalString(body.requiredAction) ?? "NONE";
  const referenceStartDateRaw = parseOptionalString(body.referenceStartDate);
  const referenceEndDateRaw = parseOptionalString(body.referenceEndDate);

  if (!assignedToUserId) {
    return NextResponse.json(
      { error: "assignedToUserId fehlt." },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json({ error: "Titel fehlt." }, { status: 400 });
  }

  if (!categoryRaw || !isTaskCategory(categoryRaw)) {
    return NextResponse.json(
      { error: "Ungültige Kategorie." },
      { status: 400 }
    );
  }

  if (!isTaskRequiredAction(requiredActionRaw)) {
    return NextResponse.json(
      { error: "Ungültige Pflichtaktion." },
      { status: 400 }
    );
  }

  const normalizedReferenceRange = normalizeReferenceRange({
    referenceStartDateRaw,
    referenceEndDateRaw,
  });

  if (!normalizedReferenceRange) {
    return NextResponse.json(
      { error: "Ungültiger Bezugszeitraum. Erwartet wird YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const assignedUser = await prisma.appUser.findUnique({
    where: { id: assignedToUserId },
    select: {
      id: true,
      fullName: true,
      isActive: true,
      role: true,
      companyId: true,
    },
  });

  if (!assignedUser || !assignedUser.isActive) {
    return NextResponse.json(
      { error: "Mitarbeiter nicht gefunden oder inaktiv." },
      { status: 404 }
    );
  }

  if (assignedUser.companyId !== admin.companyId) {
    return NextResponse.json(
      { error: "Keine Berechtigung für diesen Mitarbeiter." },
      { status: 403 }
    );
  }

  if (assignedUser.role !== "EMPLOYEE") {
    return NextResponse.json(
      { error: "Aufgaben können nur Mitarbeitern zugewiesen werden." },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      assignedToUserId: assignedUser.id,
      createdByUserId: admin.id,
      title,
      description,
      category: categoryRaw,
      status: TaskStatus.OPEN,
      requiredAction: requiredActionRaw,
      referenceDate: normalizedReferenceRange.referenceDate,
      referenceStartDate: normalizedReferenceRange.referenceStartDate,
      referenceEndDate: normalizedReferenceRange.referenceEndDate,
    },
    include: {
      assignedToUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  await sendPushToUser(assignedUser.id, {
    title: "Neue Aufgabe",
    body: title,
    url: "/aufgaben",
  });

  return NextResponse.json({ task }, { status: 201 });
}