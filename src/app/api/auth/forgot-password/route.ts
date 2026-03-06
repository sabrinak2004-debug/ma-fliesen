import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { webpush } from "@/lib/webpush";

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

  let createdNewRequest = false;

  if (!open) {
    await prisma.passwordResetRequest.create({
      data: { userId: user.id },
    });
    createdNewRequest = true;
  }

  if (createdNewRequest) {
    const adminSubscriptions = await prisma.pushSubscription.findMany({
      where: {
        user: {
          role: Role.ADMIN,
          isActive: true,
        },
      },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    await Promise.allSettled(
      adminSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title: "MA-Fliesen App",
              body: `${fullName} möchte sein Passwort zurücksetzen.`,
              url: "/admin/dashboard",
            })
          );
        } catch {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          }).catch(() => {});
        }
      })
    );
  }

  return NextResponse.json({ ok: true });
}