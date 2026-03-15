import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getOAuthClient } from "@/lib/googleCalendar";

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

export async function GET() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  }

  const admin = await requireAdmin(session.userId);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });
  }

  const oauth = getOAuthClient();

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state: session.userId,
  });

  return NextResponse.redirect(url);
}