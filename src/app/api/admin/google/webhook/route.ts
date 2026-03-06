// src/app/api/admin/google/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncGoogleCalendarToApp } from "@/lib/googleCalendar";

function isExpectedToken(headerToken: string | null): boolean {
  const expected = process.env.GOOGLE_WEBHOOK_SECRET;
  return !!expected && !!headerToken && headerToken === expected;
}

export async function POST(req: Request) {
  const token = req.headers.get("x-goog-channel-token");
  if (!isExpectedToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const channelId = req.headers.get("x-goog-channel-id");
  const resourceId = req.headers.get("x-goog-resource-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  if (!channelId || !resourceId) {
    return NextResponse.json({ ok: true });
  }

  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  const conn = await prisma.googleCalendarConnection.findFirst({
    where: { channelId, resourceId },
    select: { userId: true },
  });

  if (!conn) {
    return NextResponse.json({ ok: true });
  }

  try {
    await syncGoogleCalendarToApp({ userId: conn.userId });
  } catch (error) {
    console.error("Webhook Google sync failed:", error);

    await prisma.googleCalendarConnection.update({
      where: { userId: conn.userId },
      data: { syncToken: null },
    });
  }

  return NextResponse.json({ ok: true });
}