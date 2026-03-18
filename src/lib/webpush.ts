import webpush from "web-push";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const mailto = process.env.VAPID_SUBJECT || "mailto:admin@ma-fliesen.de";

if (publicKey && privateKey) {
  webpush.setVapidDetails(mailto, publicKey, privateKey);
}

export { webpush };
type PushPayload = {
  companyId?: string;
  title: string;
  body: string;
  url: string;
};

function isVapidReady(): boolean {
  return (
    typeof process.env.VAPID_PUBLIC_KEY === "string" &&
    process.env.VAPID_PUBLIC_KEY.trim() !== "" &&
    typeof process.env.VAPID_PRIVATE_KEY === "string" &&
    process.env.VAPID_PRIVATE_KEY.trim() !== ""
  );
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!isVapidReady()) return 0;

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

  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  const results: number[] = await Promise.all(
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
          body
        );
        return 1;
      } catch {
        await prisma.pushSubscription.deleteMany({
          where: {
            endpoint: sub.endpoint,
          },
        });
        return 0;
      }
    })
  );

  return results.reduce<number>((sum, value) => sum + value, 0);
}

export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  if (!isVapidReady()) return 0;

  const admins = await prisma.pushSubscription.findMany({
    where: {
      user: {
        role: Role.ADMIN,
        isActive: true,
        ...(payload.companyId
          ? {
              companyId: payload.companyId,
            }
          : {}),
      },
    },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (admins.length === 0) return 0;

  const body = JSON.stringify(payload);
  const results: number[] = await Promise.all(
    admins.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          body
        );
        return 1;
      } catch {
        await prisma.pushSubscription.deleteMany({
          where: {
            endpoint: sub.endpoint,
          },
        });
        return 0;
      }
    })
  );
  return results.reduce<number>((sum, value) => sum + value, 0);
}