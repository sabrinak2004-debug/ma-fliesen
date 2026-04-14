"use client";

import { useEffect, useMemo, useState } from "react";
import { translate, type AppUiLanguage } from "@/lib/i18n";

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

type PushOnboardingTextKey =
  | "invalidResponse"
  | "missingPublicKey"
  | "unknownError"
  | "subscriptionIncomplete"
  | "saveFailed"
  | "permissionDenied"
  | "sessionLoadFailed"
  | "activated"
  | "activationFailed"
  | "title"
  | "description"
  | "activating"
  | "activateNow"
  | "companyName"
  | "notAuthenticated"
  | "wrongCompanyContext";

const PUSH_ONBOARDING_TEXTS: Record<
  PushOnboardingTextKey,
  Record<AppUiLanguage, string>
> = {
  invalidResponse: {
    DE: "Ungültige Antwort.",
    EN: "Invalid response.",
    IT: "Risposta non valida.",
    TR: "Geçersiz yanıt.",
    SQ: "Përgjigje e pavlefshme.",
    KU: "Bersiva nederbasdar.",
  },
  missingPublicKey: {
    DE: "Public Key fehlt.",
    EN: "Public key is missing.",
    IT: "Manca la public key.",
    TR: "Public key eksik.",
    SQ: "Mungon public key.",
    KU: "Public key tune ye.",
  },
  unknownError: {
    DE: "Unbekannter Fehler.",
    EN: "Unknown error.",
    IT: "Errore sconosciuto.",
    TR: "Bilinmeyen hata.",
    SQ: "Gabim i panjohur.",
    KU: "Çewtiya nenas.",
  },
  subscriptionIncomplete: {
    DE: "Subscription unvollständig.",
    EN: "Subscription is incomplete.",
    IT: "La sottoscrizione è incompleta.",
    TR: "Abonelik eksik.",
    SQ: "Abonimi është i paplotë.",
    KU: "Abonetî ne temam e.",
  },
  saveFailed: {
    DE: "Push konnte nicht gespeichert werden.",
    EN: "Push could not be saved.",
    IT: "Impossibile salvare il push.",
    TR: "Push kaydedilemedi.",
    SQ: "Push nuk mund të ruhej.",
    KU: "Push nehat tomar kirin.",
  },
  notAuthenticated: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Non hai effettuato l'accesso.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk je i identifikuar.",
    KU: "Têketin nekiriye.",
  },
  wrongCompanyContext: {
    DE: "Falscher Firmenkontext.",
    EN: "Wrong company context.",
    IT: "Contesto aziendale errato.",
    TR: "Yanlış şirket bağlamı.",
    SQ: "Kontekst i gabuar i kompanisë.",
    KU: "Konteksta şirketa şaş e.",
  },
  permissionDenied: {
    DE: "Push wurde nicht erlaubt.",
    EN: "Push was not allowed.",
    IT: "Il push non è stato consentito.",
    TR: "Push izni verilmedi.",
    SQ: "Push nuk u lejua.",
    KU: "Destûra pushê nehat dayîn.",
  },
  sessionLoadFailed: {
    DE: "Session konnte nicht geladen werden.",
    EN: "Session could not be loaded.",
    IT: "Impossibile caricare la sessione.",
    TR: "Oturum yüklenemedi.",
    SQ: "Sesioni nuk mund të ngarkohej.",
    KU: "Danûstendin nehat barkirin.",
  },
  activated: {
    DE: "Push ist jetzt aktiviert.",
    EN: "Push is now enabled.",
    IT: "Il push è ora attivato.",
    TR: "Push artık etkin.",
    SQ: "Push tani është aktivizuar.",
    KU: "Push niha çalak e.",
  },
  activationFailed: {
    DE: "Push konnte nicht aktiviert werden.",
    EN: "Push could not be enabled.",
    IT: "Impossibile attivare il push.",
    TR: "Push etkinleştirilemedi.",
    SQ: "Push nuk mund të aktivizohej.",
    KU: "Push nehat çalak kirin.",
  },
  title: {
    DE: "Push-Benachrichtigungen aktivieren",
    EN: "Enable push notifications",
    IT: "Attiva notifiche push",
    TR: "Push bildirimlerini etkinleştir",
    SQ: "Aktivizo njoftimet push",
    KU: "Agahdariyên pushê çalak bike",
  },
  description: {
    DE: "Aktiviere Push, damit du Erinnerungen zu fehlenden Einträgen, Anträgen und Aufgaben direkt auf diesem Gerät erhältst.",
    EN: "Enable push so you receive reminders about missing entries, requests and tasks directly on this device.",
    IT: "Attiva il push per ricevere direttamente su questo dispositivo i promemoria relativi a inserimenti mancanti, richieste e attività.",
    TR: "Eksik kayıtlar, talepler ve görevlerle ilgili hatırlatmaları doğrudan bu cihazda almak için push'u etkinleştir.",
    SQ: "Aktivizo push që të marrësh kujtesa për regjistrime që mungojnë, kërkesa dhe detyra direkt në këtë pajisje.",
    KU: "Pushê çalak bike da ku hişyariyên derbarê tomarkirinên kêm, daxwaz û erkan de rasterast li ser vê cîhazê bistînî.",
  },
  activating: {
    DE: "Aktiviere...",
    EN: "Enabling...",
    IT: "Attivazione...",
    TR: "Etkinleştiriliyor...",
    SQ: "Po aktivizohet...",
    KU: "Tê çalak kirin...",
  },
  activateNow: {
    DE: "Push jetzt aktivieren",
    EN: "Enable push now",
    IT: "Attiva push ora",
    TR: "Push'u şimdi etkinleştir",
    SQ: "Aktivizo push tani",
    KU: "Pushê niha çalak bike",
  },
  companyName: {
    DE: "Firmenname:",
    EN: "Company name:",
    IT: "Nome azienda:",
    TR: "Şirket adı:",
    SQ: "Emri i kompanisë:",
    KU: "Navê pargîdaniyê:",
  },
};

function tPushOnboarding(
  language: AppUiLanguage,
  key: PushOnboardingTextKey
): string {
  return translate(language, key, PUSH_ONBOARDING_TEXTS);
}

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

function parseMeResponse(
  v: unknown,
  language: AppUiLanguage
): MeResponse {
  if (!isRecord(v)) {
    return { ok: false, error: tPushOnboarding(language, "invalidResponse") };
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
    error:
      getStringField(v, "error") ??
      tPushOnboarding(language, "invalidResponse"),
  };
}

function parsePushPublicKeyResponse(
  v: unknown,
  language: AppUiLanguage
): PushPublicKeyResponse {
  if (!isRecord(v)) {
    return { ok: false, error: tPushOnboarding(language, "invalidResponse") };
  }

  if (v["ok"] === true) {
    const publicKey = getStringField(v, "publicKey");
    if (!publicKey) {
      return { ok: false, error: tPushOnboarding(language, "missingPublicKey") };
    }

    return { ok: true, publicKey };
  }

  const backendError = getStringField(v, "error");

  switch (backendError) {
    case "PUSH_NOT_AUTHENTICATED":
      return { ok: false, error: tPushOnboarding(language, "notAuthenticated") };
    case "PUSH_PUBLIC_KEY_MISSING":
      return { ok: false, error: tPushOnboarding(language, "missingPublicKey") };
    default:
      return {
        ok: false,
        error: backendError ?? tPushOnboarding(language, "unknownError"),
      };
  }
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
  companySubdomain: string,
  language: AppUiLanguage
): Promise<void> {
  if (
    !subscriptionJson.endpoint ||
    !subscriptionJson.keys?.p256dh ||
    !subscriptionJson.keys?.auth
  ) {
    throw new Error(tPushOnboarding(language, "subscriptionIncomplete"));
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
    const backendError =
      isRecord(json) && typeof json["error"] === "string"
        ? json["error"]
        : "";

    switch (backendError) {
      case "PUSH_NOT_AUTHENTICATED":
        throw new Error(tPushOnboarding(language, "notAuthenticated"));
      case "PUSH_SUBSCRIPTION_INCOMPLETE":
        throw new Error(tPushOnboarding(language, "subscriptionIncomplete"));
      case "PUSH_WRONG_COMPANY_CONTEXT":
        throw new Error(tPushOnboarding(language, "wrongCompanyContext"));
      default:
        throw new Error(tPushOnboarding(language, "saveFailed"));
    }
  }
}

export default function PushOnboarding({
  language,
}: {
  language: AppUiLanguage;
}) {
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
        const parsedMe = parseMeResponse(meJson, language);

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
  }, [language]);

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
        setMessage(tPushOnboarding(language, "permissionDenied"));
        return;
      }

      const meResponse = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const meJson: unknown = await meResponse.json().catch(() => ({}));
      const parsedMe = parseMeResponse(meJson, language);

      if (!meResponse.ok || !parsedMe.ok || !parsedMe.session) {
        throw new Error(tPushOnboarding(language, "sessionLoadFailed"));
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
      const parsedKey = parsePushPublicKeyResponse(publicKeyJson, language);

      if (!publicKeyResponse.ok || !parsedKey.ok) {
        throw new Error(
          parsedKey.ok
            ? tPushOnboarding(language, "missingPublicKey")
            : parsedKey.error
        );
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        await sendSubscriptionToBackend(
          existingSubscription.toJSON(),
          normalizedSubdomain,
          language
        );
        setHasSubscription(true);
        setResolved(true);
        setMessage(tPushOnboarding(language, "activated"));
        return;
      }

      const applicationServerKey = base64UrlToArrayBuffer(parsedKey.publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await sendSubscriptionToBackend(
        subscription.toJSON(),
        normalizedSubdomain,
        language
      );

      setHasSubscription(true);
      setResolved(true);
      setMessage(tPushOnboarding(language, "activated"));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : tPushOnboarding(language, "activationFailed");
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
        {tPushOnboarding(language, "title")}
      </div>

      <div className="push-onboarding-text">
        {tPushOnboarding(language, "description")}
      </div>

      <div className="push-onboarding-actions">
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => void enablePush()}
          disabled={loading}
        >
          {loading
            ? tPushOnboarding(language, "activating")
            : tPushOnboarding(language, "activateNow")}
        </button>
      </div>

      {message ? <div className="push-onboarding-message">{message}</div> : null}

      {companySubdomain ? (
        <div className="push-onboarding-company">
          {tPushOnboarding(language, "companyName")} {companySubdomain}
        </div>
      ) : null}
    </div>
  );
}