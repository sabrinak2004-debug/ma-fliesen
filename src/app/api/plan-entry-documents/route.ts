import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const planEntryId = url.searchParams.get("planEntryId");
  if (!planEntryId) return NextResponse.json({ error: "planEntryId missing" }, { status: 400 });

  const entry = await prisma.planEntry.findUnique({
    where: { id: planEntryId },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (entry.user.companyId !== session.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin && entry.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const docs = await prisma.planEntryDocument.findMany({
    where: { planEntryId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      planEntryId: true,
      title: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, documents: docs });
}