import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function extractUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;

  if ("user" in session) {
    const user = (session as { user?: unknown }).user;
    if (
      user &&
      typeof user === "object" &&
      "id" in user &&
      typeof (user as { id: unknown }).id === "string"
    ) {
      return (user as { id: string }).id;
    }
  }

  if ("userId" in session && typeof (session as { userId?: unknown }).userId === "string") {
    return (session as { userId: string }).userId;
  }

  if ("id" in session && typeof (session as { id?: unknown }).id === "string") {
    return (session as { id: string }).id;
  }

  return null;
}

export async function GET(req: Request) {
  const session = await getSession();
  const sessionUserId = extractUserId(session);

  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.appUser.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      role: true,
      isActive: true,
      companyId: true,
    },
  });

  if (!me || !me.isActive) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const userIdParam = url.searchParams.get("userId");

  if (!from || !to) {
    return NextResponse.json({ error: "from/to missing" }, { status: 400 });
  }

  const start = parseYMD(from);
  const end = parseYMD(to);

  let targetUserId = sessionUserId;

  if (me.role === Role.ADMIN && userIdParam) {
    const targetUser = await prisma.appUser.findFirst({
      where: {
        id: userIdParam,
        isActive: true,
        role: Role.EMPLOYEE,
        companyId: me.companyId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
        fullName: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 });
    }

    targetUserId = targetUser.id;
  }

  const entries = await prisma.planEntry.findMany({
    where: {
      userId: targetUserId,
      workDate: { gte: start, lt: end },
      user: {
        companyId: me.companyId,
      },
    },
    orderBy: [{ startHHMM: "asc" }],
    select: {
      id: true,
      userId: true,
      workDate: true,
      startHHMM: true,
      endHHMM: true,
      activity: true,
      location: true,
      travelMinutes: true,
      noteEmployee: true,
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  return NextResponse.json({ entries });
}