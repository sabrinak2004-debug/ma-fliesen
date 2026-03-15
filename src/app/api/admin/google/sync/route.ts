// src/app/api/admin/google/sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { syncGoogleCalendarToApp } from "@/lib/googleCalendar";

async function requireAdmin(userId: string) {
  const u = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true, companyId: true },
  });

  if (!u || !u.isActive || u.role !== Role.ADMIN || !u.companyId) {
    return null;
  }

  return u;
}

export async function POST() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt" },
      { status: 401 }
    );
  }

  const admin = await requireAdmin(session.userId);
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Keine Berechtigung" },
      { status: 403 }
    );
  }

  try {
    await syncGoogleCalendarToApp({ userId: session.userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await prisma.googleCalendarConnection.update({
      where: { userId: session.userId },
      data: { syncToken: null },
    });

    console.error("Manual Google sync failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Sync fehlgeschlagen (syncToken reset). Bitte erneut syncen.",
      },
      { status: 500 }
    );
  }
}