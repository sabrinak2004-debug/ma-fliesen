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
  console.log("[forgot-password] fullName:", fullName);
  console.log("[forgot-password] createdNewRequest:", createdNewRequest);

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

    console.log("[forgot-password] adminSubscriptions count:", adminSubscriptions.length);

    const results = await Promise.allSettled(
      adminSubscriptions.map(async (sub) => {
        try {
          console.log("[forgot-password] sending push to subscription:", sub.id);

          const result = await webpush.sendNotification(
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

          console.log("[forgot-password] push sent successfully:", sub.id, result.statusCode);
          return { ok: true, subId: sub.id, statusCode: result.statusCode };
        } catch (err) {
          console.error("[forgot-password] push send failed for subscription:", sub.id, err);

          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          }).catch((deleteErr) => {
            console.error("[forgot-password] deleting invalid subscription failed:", sub.id, deleteErr);
          });

          return { ok: false, subId: sub.id };
        }
      })
    );

    console.log("[forgot-password] push results:", results);
  }

  return NextResponse.json({ ok: true });
}