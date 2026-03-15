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
  note: string; // darf auch leer sein (optional)
};

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const weekStart = url.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "weekStart missing" }, { status: 400 });

  const start = parseYMD(weekStart);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  const notes = await prisma.adminNote.findMany({
    where: { workDate: { gte: start, lt: end } },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: [{ workDate: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Partial<PostBody>;
  const { id, userId, workDate, note } = body ?? {};

  if (!userId || !workDate) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const data = {
    userId: String(userId),
    workDate: parseYMD(String(workDate)),
    note: typeof note === "string" ? note : "",
  };

  // Wenn id vorhanden -> Update
  if (id) {
    const saved = await prisma.adminNote.update({
      where: { id: String(id) },
      data: { note: data.note, workDate: data.workDate, userId: data.userId },
    });
    return NextResponse.json({ ok: true, note: saved });
  }

  // Sonst: 1 Notiz pro (userId, workDate) -> Upsert über Unique
  const saved = await prisma.adminNote.upsert({
    where: {
      userId_workDate: {
        userId: data.userId,
        workDate: data.workDate,
      },
    },
    create: data,
    update: { note: data.note },
  });

  return NextResponse.json({ ok: true, note: saved });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });

  await prisma.adminNote.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}