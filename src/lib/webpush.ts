import webpush from "web-push";
import { Role } from "@prisma/client";
import { normalizeAppUiLanguage, type AppUiLanguage } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const mailto = process.env.VAPID_SUBJECT || "mailto:admin@ma-fliesen.de";

if (publicKey && privateKey) {
  webpush.setVapidDetails(mailto, publicKey, privateKey);
}

export { webpush };

export type PushPayload = {
  companyId?: string;
  companySubdomain?: string;
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
};

function isVapidReady(): boolean {
  return (
    typeof process.env.VAPID_PUBLIC_KEY === "string" &&
    process.env.VAPID_PUBLIC_KEY.trim() !== "" &&
    typeof process.env.VAPID_PRIVATE_KEY === "string" &&
    process.env.VAPID_PRIVATE_KEY.trim() !== ""
  );
}

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type LocalizedAdminPushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  language: string | null;
};

async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload
): Promise<number> {
  if (!isVapidReady()) return 0;
  if (subscriptions.length === 0) return 0;

  const body = JSON.stringify(payload);

  const results: number[] = await Promise.all(
    subscriptions.map(async (sub) => {
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

async function sendLocalizedPushToSubscriptions(
  subscriptions: LocalizedAdminPushSubscriptionRow[],
  payloadFactory: (language: AppUiLanguage) => PushPayload
): Promise<number> {
  if (!isVapidReady()) return 0;
  if (subscriptions.length === 0) return 0;

  const results: number[] = await Promise.all(
    subscriptions.map(async (sub) => {
      const language = normalizeAppUiLanguage(sub.language);
      const payload = payloadFactory(language);
      const body = JSON.stringify(payload);

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

export function buildPushUrl(path: string): string {
  const normalized = path.trim();

  if (!normalized) return "/";

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
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

  return sendPushToSubscriptions(subs, payload);
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

  return sendPushToSubscriptions(admins, payload);
}

export async function sendLocalizedPushToAdmins(args: {
  companyId?: string;
  companySubdomain?: string;
  url: string;
  icon?: string;
  badge?: string;
  title: (language: AppUiLanguage) => string;
  body: (language: AppUiLanguage) => string;
}): Promise<number> {
  if (!isVapidReady()) return 0;

  const admins = await prisma.pushSubscription.findMany({
    where: {
      user: {
        role: Role.ADMIN,
        isActive: true,
        ...(args.companyId
          ? {
              companyId: args.companyId,
            }
          : {}),
      },
    },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
      user: {
        select: {
          language: true,
        },
      },
    },
  });

  const localizedSubscriptions: LocalizedAdminPushSubscriptionRow[] = admins.map(
    (admin) => ({
      endpoint: admin.endpoint,
      p256dh: admin.p256dh,
      auth: admin.auth,
      language: admin.user.language,
    })
  );

  return sendLocalizedPushToSubscriptions(
    localizedSubscriptions,
    (language: AppUiLanguage) => ({
      companyId: args.companyId,
      companySubdomain: args.companySubdomain,
      title: args.title(language),
      body: args.body(language),
      url: args.url,
      icon: args.icon,
      badge: args.badge,
    })
  );
}