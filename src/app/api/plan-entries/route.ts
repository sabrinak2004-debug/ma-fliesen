// src/app/api/plan-entries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function parseYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Wir kennen das genaue Shape von SessionData nicht,
 * deshalb lesen wir userId robust und typesafe aus.
 */
function extractUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;

  // Fall 1: session.user.id
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

  // Fall 2: session.userId
  if (
    "userId" in session &&
    typeof (session as { userId?: unknown }).userId === "string"
  ) {
    return (session as { userId: string }).userId;
  }

  // Fall 3: session.id (manche Auth-Systeme)
  if (
    "id" in session &&
    typeof (session as { id?: unknown }).id === "string"
  ) {
    return (session as { id: string }).id;
  }

  return null;
}

export async function GET(req: Request) {
  const session = await getSession();
  const userId = extractUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from/to missing" }, { status: 400 });
  }

  const start = parseYMD(from);
  const end = parseYMD(to);

  const entries = await prisma.planEntry.findMany({
    where: {
      userId,
      workDate: { gte: start, lt: end },
    },
    orderBy: [{ startHHMM: "asc" }],
  });

  return NextResponse.json({ entries });
}