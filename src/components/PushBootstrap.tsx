"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getTenantAppleTouchIconHref } from "@/lib/tenantBranding";

type PushPublicKeyResponse =
  | {
      ok: true;
      publicKey: string;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function parsePushPublicKeyResponse(v: unknown): PushPublicKeyResponse {
  if (!isRecord(v)) {
    return { ok: false, error: "Ungültige Antwort." };
  }

  if (v["ok"] === true) {
    const publicKey = getStringField(v, "publicKey");
    if (!publicKey) {
      return { ok: false, error: "Public Key fehlt." };
    }

    return { ok: true, publicKey };
  }

  return {
    ok: false,
    error: getStringField(v, "error") ?? "Unbekannter Fehler.",
  };
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

type SubscriptionJson = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

type MeSession = {
  userId: string;
  companySubdomain: string;
};

type MeResponse =
  | {
      ok: true;
      session: MeSession | null;
    }
  | {
      ok: false;
      error: string;
    };

function isMeSession(v: unknown): v is MeSession {
  if (!isRecord(v)) {
    return false;
  }

  return (
    typeof v["userId"] === "string" &&
    typeof v["companySubdomain"] === "string"
  );
}

function parseMeResponse(v: unknown): MeResponse {
  if (!isRecord(v)) {
    return { ok: false, error: "Ungültige Antwort." };
  }

  if (v["ok"] === true) {
    const sessionValue = v["session"];

    if (sessionValue === null) {
      return { ok: true, session: null };
    }

    if (isMeSession(sessionValue)) {
      return { ok: true, session: sessionValue };
    }
  }

  return {
    ok: false,
    error: getStringField(v, "error") ?? "Ungültige Antwort.",
  };
}

function shouldSkipPushOnPath(pathname: string): boolean {
  const normalized = pathname.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (normalized === "/login") {
    return true;
  }

  if (normalized === "/reset-password") {
    return true;
  }

  if (normalized.startsWith("/api/")) {
    return true;
  }

  const tenantLoginMatch = /^\/[^/]+\/login$/.test(normalized);
  const tenantResetMatch = /^\/[^/]+\/reset-password$/.test(normalized);

  return tenantLoginMatch || tenantResetMatch;
}

async function sendSubscriptionToBackend(
  subscriptionJson: SubscriptionJson,
  companySubdomain: string
): Promise<void> {
  if (
    !subscriptionJson.endpoint ||
    !subscriptionJson.keys?.p256dh ||
    !subscriptionJson.keys?.auth
  ) {
    return;
  }

  await fetch("/api/push/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({
      endpoint: subscriptionJson.endpoint,
      companySubdomain,
      keys: {
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      },
    }),
  });
}

export default function PushBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function setupPush(): Promise<void> {
      if (shouldSkipPushOnPath(pathname)) return;
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;
      if (!("Notification" in window)) return;

      try {
        const meResponse = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const meJson: unknown = await meResponse.json().catch(() => ({}));
        const parsedMe = parseMeResponse(meJson);

        if (!meResponse.ok || !parsedMe.ok || !parsedMe.session) {
          return;
        }

        const companySubdomain = parsedMe.session.companySubdomain.trim().toLowerCase();

        if (!companySubdomain) {
          return;
        }
        const publicKeyResponse = await fetch("/api/push/public-key", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const publicKeyJson: unknown = await publicKeyResponse.json().catch(() => ({}));
        const parsed = parsePushPublicKeyResponse(publicKeyJson);

        if (!publicKeyResponse.ok || !parsed.ok) {
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await navigator.serviceWorker.ready;
        void getTenantAppleTouchIconHref(companySubdomain);

        if (Notification.permission !== "granted") {
          return;
        }

        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          await sendSubscriptionToBackend(
            existingSubscription.toJSON(),
            companySubdomain
          );
          return;
        }

        const applicationServerKey = base64UrlToArrayBuffer(parsed.publicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await sendSubscriptionToBackend(
          subscription.toJSON(),
          companySubdomain
        );
      } catch (error: unknown) {
        if (cancelled) return;
        console.error("Push-Setup fehlgeschlagen:", error);
      }
    }

    void setupPush();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}