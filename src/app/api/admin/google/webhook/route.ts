// src/app/api/admin/google/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Google schickt Headers wie x-goog-channel-id, x-goog-resource-id etc.
export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.GOOGLE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const channelId = req.headers.get("x-goog-channel-id");
  const resourceId = req.headers.get("x-goog-resource-id");

  if (!channelId || !resourceId) return NextResponse.json({ ok: true }); // Google erwartet 2xx

  const conn = await prisma.googleCalendarConnection.findFirst({
    where: { channelId, resourceId },
    select: { userId: true },
  });

  // Keine Verbindung -> trotzdem 2xx zurück
  if (!conn) return NextResponse.json({ ok: true });

  // Trigger Sync "fire-and-forget" gibt es hier nicht sauber,
  // daher: Sync direkt ausführen (schnell, incremental)
  // -> wir rufen unsere Sync-Logik inline (siehe sync route unten als shared helper).
  // Einfach: markiere "needsSync" und sync per Cron wäre besser.
  // Hier: wir geben nur ok zurück; Sync machen wir über eine extra Route, die du im UI/cron callst.

  return NextResponse.json({ ok: true });
}