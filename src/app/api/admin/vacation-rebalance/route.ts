import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rebalanceAutoUnpaidVacationRequestsForYear } from "@/app/api/absence-requests/route";

export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = req.headers.get("authorization")?.trim();

  if (!secret) {
    return false;
  }

  return authorization === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json(
      { ok: false, error: "Nicht autorisiert." },
      { status: 401 }
    );
  }

  const now = new Date();
  const year = now.getUTCFullYear();

  const users = await prisma.appUser.findMany({
    where: {
      role: Role.EMPLOYEE,
      isActive: true,
    },
    select: {
      id: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  let processedUsers = 0;

  for (const user of users) {
    await rebalanceAutoUnpaidVacationRequestsForYear(user.id, year, now);
    processedUsers += 1;
  }

  return NextResponse.json({
    ok: true,
    year,
    processedUsers,
    executedAt: now.toISOString(),
  });
}