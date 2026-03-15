// src/app/api/admin/google/watch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { registerGoogleCalendarWatch } from "@/lib/googleCalendar";

async function requireAdmin(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true, companyId: true },
  });

  if (!user || !user.isActive || user.role !== Role.ADMIN || !user.companyId) {
    return null;
  }

  return user;
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
    await registerGoogleCalendarWatch({ userId: session.userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Google watch registration failed:", error);

    return NextResponse.json(
      { ok: false, error: "Watch-Registrierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}