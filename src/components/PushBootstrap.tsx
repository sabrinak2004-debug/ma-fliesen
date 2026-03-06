"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

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

async function sendSubscriptionToBackend(subscriptionJson: SubscriptionJson): Promise<void> {
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
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;
      if (!("Notification" in window)) return;

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        const permission = Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

        if (permission !== "granted") {
          return;
        }

        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          await sendSubscriptionToBackend(existingSubscription.toJSON());
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
          console.error(
            "Push Public Key konnte nicht geladen werden:",
            parsed.ok ? "Unbekannter Fehler" : parsed.error
          );
          return;
        }

        const applicationServerKey = base64UrlToArrayBuffer(parsed.publicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await sendSubscriptionToBackend(subscription.toJSON());
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