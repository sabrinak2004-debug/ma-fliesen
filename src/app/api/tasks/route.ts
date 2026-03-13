import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");

  const tasks = await prisma.task.findMany({
    where: {
      assignedToUserId: session.userId,
      ...(statusParam === "OPEN"
        ? { status: "OPEN" }
        : statusParam === "COMPLETED"
          ? { status: "COMPLETED" }
          : {}),
    },
    orderBy: [
      { status: "asc" },
      { referenceDate: "desc" },
      { createdAt: "desc" },
    ],
    include: {
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
  });

  return NextResponse.json({ tasks });
}