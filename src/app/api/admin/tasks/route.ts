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
  referenceDate?: string;
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
  const referenceDateRaw = parseOptionalString(body.referenceDate);

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

  const referenceDate = parseReferenceDate(referenceDateRaw);
  if (referenceDateRaw && !referenceDate) {
    return NextResponse.json(
      { error: "Ungültiges Datum. Erwartet wird YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const assignedUser = await prisma.appUser.findFirst({
    where: {
      id: assignedToUserId,
      companyId: admin.companyId,
    },
    select: {
      id: true,
      fullName: true,
      isActive: true,
      role: true,
    },
  });

  if (!assignedUser || !assignedUser.isActive) {
    return NextResponse.json(
      { error: "Mitarbeiter nicht gefunden oder inaktiv." },
      { status: 404 }
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
      referenceDate,
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