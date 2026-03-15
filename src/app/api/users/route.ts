import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

type SessionLike = {
  role?: unknown;
  user?: { role?: unknown };
};

function getSessionRole(session: unknown): Role | null {
  if (typeof session !== "object" || session === null) return null;
  const s = session as SessionLike;

  const raw = s.role;

  // ✅ immer auf string normalisieren -> keine TS2367 Vergleiche mehr
  const str = typeof raw === "string" ? raw : null;

  if (str === Role.ADMIN) return Role.ADMIN;
  if (str === Role.EMPLOYEE) return Role.EMPLOYEE;

  // falls Prisma enum doch mal nicht string wäre (sehr selten), fallback:
  if (raw === Role.ADMIN) return Role.ADMIN;
  if (raw === Role.EMPLOYEE) return Role.EMPLOYEE;

  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const role = getSessionRole(session);
  if (role !== Role.ADMIN) return NextResponse.json({ ok: false }, { status: 403 });

  const users = await prisma.appUser.findMany({
    where: { isActive: true, role: Role.EMPLOYEE },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ ok: true, users });
}