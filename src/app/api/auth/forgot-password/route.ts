import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const fullName = isRecord(body) ? getString(body.fullName).trim() : "";
  if (fullName.length < 3) {
    return NextResponse.json({ ok: false, error: "Name fehlt/zu kurz" }, { status: 400 });
  }

  const user = await prisma.appUser.findUnique({
    where: { fullName },
    select: { id: true, role: true, isActive: true },
  });

  // bewusst gleiche Antwort auch bei Nicht-Fund (keine Info-Leaks)
  if (!user || !user.isActive || user.role !== Role.EMPLOYEE) {
    return NextResponse.json({ ok: true });
  }

  // ✅ Dedupe: wenn schon eine offene Anfrage existiert, keine zweite anlegen
  const open = await prisma.passwordResetRequest.findFirst({
    where: { userId: user.id, status: "OPEN" },
    select: { id: true },
  });

  if (!open) {
    await prisma.passwordResetRequest.create({
      data: { userId: user.id },
    });
  }

  return NextResponse.json({ ok: true });
}