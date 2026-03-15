import { NextResponse } from "next/server";
import { TimeEntryCorrectionRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";
import { webpush } from "@/lib/webpush";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  const vapidReady =
    typeof process.env.VAPID_PUBLIC_KEY === "string" &&
    process.env.VAPID_PUBLIC_KEY.trim() !== "" &&
    typeof process.env.VAPID_PRIVATE_KEY === "string" &&
    process.env.VAPID_PRIVATE_KEY.trim() !== "";

  if (!vapidReady) return;

  const subs = await prisma.pushSubscription.findMany({
    where: {
      userId,
      user: {
        isActive: true,
      },
    },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch {
        await prisma.pushSubscription.deleteMany({
          where: {
            endpoint: sub.endpoint,
          },
        });
      }
    })
  );
}

export async function POST(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const params = await context.params;
  const requestId = params.id.trim();

  if (!requestId) {
    return NextResponse.json(
      { ok: false, error: "Fehlende Request-ID." },
      { status: 400 }
    );
  }

  const existing = await prisma.timeEntryCorrectionRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          isActive: true,
          companyId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Antrag nicht gefunden." },
      { status: 404 }
    );
  }

  if (existing.user.companyId !== admin.companyId) {
    return NextResponse.json(
      { ok: false, error: "Antrag gehört nicht zu deiner Firma." },
      { status: 403 }
    );
  }


  if (!existing.user.isActive) {
    return NextResponse.json(
      { ok: false, error: "Mitarbeiter ist nicht aktiv." },
      { status: 409 }
    );
  }

  if (existing.status !== TimeEntryCorrectionRequestStatus.PENDING) {
    return NextResponse.json(
      { ok: false, error: "Nur offene Anträge können abgelehnt werden." },
      { status: 409 }
    );
  }

  const updated = await prisma.timeEntryCorrectionRequest.update({
    where: { id: existing.id },
    data: {
      status: TimeEntryCorrectionRequestStatus.REJECTED,
      decidedAt: new Date(),
      decidedById: admin.id,
    },
  });

  await sendPushToUser(
    existing.userId,
    "Nachtragsantrag abgelehnt",
    "Dein Nachtragsantrag wurde abgelehnt.",
    "/erfassung"
  );

  return NextResponse.json({
    ok: true,
    request: {
      id: existing.id,
      status: updated.status,
      decidedAt: updated.decidedAt?.toISOString() ?? null,
      decidedBy: {
        id: admin.id,
        fullName: admin.fullName,
      },
      user: {
        id: existing.user.id,
        fullName: existing.user.fullName,
      },
      startDate: existing.startDate.toISOString(),
      endDate: existing.endDate.toISOString(),
    },
  });
}