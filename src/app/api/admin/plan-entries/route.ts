import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

type PostBody = {
  id?: string;
  userId: string;
  workDate: string; // YYYY-MM-DD
  startHHMM: string; // "07:00"
  endHHMM: string; // "16:00"
  activity: string;
  location?: string;
  travelMinutes?: number;

  // ✅ bleibt am PlanEntry:
  noteEmployee?: string;
};

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart"); // Montag YYYY-MM-DD
  if (!weekStart) return NextResponse.json({ error: "weekStart missing" }, { status: 400 });

  const start = parseYMD(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const entries = await prisma.planEntry.findMany({
    where: {
      workDate: { gte: start, lt: end },
      user: {
        companyId: admin.companyId,
      },
    },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ workDate: "asc" }, { startHHMM: "asc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Partial<PostBody>;

  const { id, userId, workDate, startHHMM, endHHMM, activity, location, travelMinutes, noteEmployee } = body ?? {};

  // PlanEntry-Felder (Admin-Notiz ist NICHT mehr hier)
  if (!userId || !workDate || !startHHMM || !endHHMM || !activity) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const targetUser = await prisma.appUser.findUnique({
    where: { id: String(userId) },
    select: {
      id: true,
      companyId: true,
      isActive: true,
      role: true,
    },
  });

  if (!targetUser || !targetUser.isActive) {
    return NextResponse.json({ error: "Mitarbeiter nicht gefunden." }, { status: 404 });
  }

  if (targetUser.companyId !== admin.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetUser.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Planung nur für Mitarbeiter erlaubt." }, { status: 400 });
  }

  const data = {
    userId: String(userId),
    workDate: parseYMD(String(workDate)),
    startHHMM: String(startHHMM),
    endHHMM: String(endHHMM),
    activity: String(activity),
    location: location ? String(location) : "",
    travelMinutes: Number(travelMinutes ?? 0),

    // ✅ Mitarbeiter-Notiz am PlanEntry
    noteEmployee: noteEmployee ? String(noteEmployee) : null,
  };

  if (id) {
    const existingEntry = await prisma.planEntry.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "PlanEntry not found" }, { status: 404 });
    }

    if (existingEntry.user.companyId !== admin.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const saved = id
    ? await prisma.planEntry.update({ where: { id: String(id) }, data })
    : await prisma.planEntry.create({ data });

  return NextResponse.json({ ok: true, entry: saved });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  const existingEntry = await prisma.planEntry.findUnique({
    where: { id: String(id) },
    select: {
      id: true,
      user: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!existingEntry) {
    return NextResponse.json({ error: "PlanEntry not found" }, { status: 404 });
  }

  if (existingEntry.user.companyId !== admin.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.planEntry.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}