import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getOAuthClient } from "@/lib/googleCalendar";

async function requireAdmin(userId: string, companyId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true, companyId: true },
  });

  return !!user && user.isActive && user.role === Role.ADMIN && user.companyId === companyId;
}

export async function GET() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  }

  const isAdmin = await requireAdmin(session.userId, session.companyId);
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung" }, { status: 403 });
  }

  const oauth = getOAuthClient();

  const state = Buffer.from(
    JSON.stringify({
      userId: session.userId,
      companyId: session.companyId,
    }),
    "utf8"
  ).toString("base64url");

  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
    state,
  });

  return NextResponse.redirect(url);
}