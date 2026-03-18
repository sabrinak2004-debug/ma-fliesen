// src/app/api/admin/google/watch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { registerGoogleCalendarWatch } from "@/lib/googleCalendar";

async function requireAdmin(userId: string, companyId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, companyId: true },
  });

  return !!user && user.isActive && user.role === Role.ADMIN && user.companyId === companyId;
}

export async function POST() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json(
      { ok: false, error: "Nicht eingeloggt" },
      { status: 401 }
    );
  }

  const isAdmin = await requireAdmin(session.userId, session.companyId);
  if (!isAdmin) {
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