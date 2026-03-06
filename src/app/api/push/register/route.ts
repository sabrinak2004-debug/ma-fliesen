import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt." }, { status: 401 });
  }

  const me = await prisma.appUser.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!me || !me.isActive || me.role !== Role.ADMIN) {
    return NextResponse.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "Ungültiger Body." }, { status: 400 });
  }

  const endpoint = getString(body.endpoint).trim();
  const keys = isRecord(body.keys) ? body.keys : {};
  const p256dh = getString(keys.p256dh).trim();
  const auth = getString(keys.auth).trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ ok: false, error: "Subscription unvollständig." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: me.id,
      p256dh,
      auth,
    },
    create: {
      userId: me.id,
      endpoint,
      p256dh,
      auth,
    },
  });

  return NextResponse.json({ ok: true });
}