"use client";

import { useEffect, useMemo, useState } from "react";

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

function getStringField(
  obj: Record<string, unknown>,
  key: string
): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function isMeSession(v: unknown): v is MeSession {
  if (!isRecord(v)) return false;

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

  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
}

type SubscriptionJson = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

async function sendSubscriptionToBackend(
  subscriptionJson: SubscriptionJson,
  companySubdomain: string
): Promise<void> {
  if (
    !subscriptionJson.endpoint ||
    !subscriptionJson.keys?.p256dh ||
    !subscriptionJson.keys?.auth
  ) {
    throw new Error("Subscription unvollständig.");
  }

  const response = await fetch("/api/push/register", {
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

  if (!response.ok) {
    const json: unknown = await response.json().catch(() => ({}));
    const message =
      isRecord(json) && typeof json["error"] === "string"
        ? json["error"]
        : "Push konnte nicht gespeichert werden.";
    throw new Error(message);
  }
}

export default function PushOnboarding() {
  const [companySubdomain, setCompanySubdomain] = useState<string>("");
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | "unknown"
  >("unknown");
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [resolved, setResolved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function load(): Promise<void> {
      const supportsPush =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supportsPush) {
        if (!alive) return;
        setSupported(false);
        setPermission("unknown");
        setHasSubscription(false);
        setResolved(true);
        return;
      }

      try {
        const currentPermission = Notification.permission;

        const meResponse = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const meJson: unknown = await meResponse.json().catch(() => ({}));
        const parsedMe = parseMeResponse(meJson);

        if (!alive) return;

        if (!meResponse.ok || !parsedMe.ok || !parsedMe.session) {
          setSupported(true);
          setPermission(currentPermission);
          setHasSubscription(false);
          setResolved(true);
          return;
        }

        const normalizedSubdomain = parsedMe.session.companySubdomain
          .trim()
          .toLowerCase();
        setCompanySubdomain(normalizedSubdomain);

        const registration = await navigator.serviceWorker.register("/sw.js");
        const existingSubscription =
          await registration.pushManager.getSubscription();

        if (!alive) return;

        setSupported(true);
        setPermission(currentPermission);
        setHasSubscription(existingSubscription !== null);
        setResolved(true);
      } catch {
        if (!alive) return;
        setSupported(true);
        setPermission(Notification.permission);
        setHasSubscription(false);
        setResolved(true);
      }
    }

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const shouldShow = useMemo(() => {
    if (!resolved) return false;
    if (!supported) return false;
    if (permission === "denied") return false;
    return !hasSubscription;
  }, [resolved, supported, permission, hasSubscription]);

  async function enablePush(): Promise<void> {
    setLoading(true);
    setMessage("");

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setMessage("Push wurde nicht erlaubt.");
        return;
      }

      const meResponse = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const meJson: unknown = await meResponse.json().catch(() => ({}));
      const parsedMe = parseMeResponse(meJson);

      if (!meResponse.ok || !parsedMe.ok || !parsedMe.session) {
        throw new Error("Session konnte nicht geladen werden.");
      }

      const normalizedSubdomain = parsedMe.session.companySubdomain
        .trim()
        .toLowerCase();
      setCompanySubdomain(normalizedSubdomain);

      const publicKeyResponse = await fetch("/api/push/public-key", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const publicKeyJson: unknown = await publicKeyResponse
        .json()
        .catch(() => ({}));
      const parsedKey = parsePushPublicKeyResponse(publicKeyJson);

      if (!publicKeyResponse.ok || !parsedKey.ok) {
        throw new Error(parsedKey.ok ? "Public Key fehlt." : parsedKey.error);
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        await sendSubscriptionToBackend(
          existingSubscription.toJSON(),
          normalizedSubdomain
        );
        setHasSubscription(true);
        setResolved(true);
        setMessage("Push ist jetzt aktiviert.");
        return;
      }

      const applicationServerKey = base64UrlToArrayBuffer(parsedKey.publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await sendSubscriptionToBackend(
        subscription.toJSON(),
        normalizedSubdomain
      );

      setHasSubscription(true);
      setResolved(true);
      setMessage("Push ist jetzt aktiviert.");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Push konnte nicht aktiviert werden.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="card push-onboarding-card">
      <div className="push-onboarding-title">
        Push-Benachrichtigungen aktivieren
      </div>

      <div className="push-onboarding-text">
        Aktiviere Push, damit du Erinnerungen zu fehlenden Einträgen, Anträgen
        und Aufgaben direkt auf diesem Gerät erhältst.
      </div>

      <div className="push-onboarding-actions">
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => void enablePush()}
          disabled={loading}
        >
          {loading ? "Aktiviere..." : "Push jetzt aktivieren"}
        </button>
      </div>

      {message ? <div className="push-onboarding-message">{message}</div> : null}

      {companySubdomain ? (
        <div className="push-onboarding-company">
          Firmenname: {companySubdomain}
        </div>
      ) : null}
    </div>
  );
}