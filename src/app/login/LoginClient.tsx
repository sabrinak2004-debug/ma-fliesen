"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  applyTenantHeadBranding,
  applyTenantThemeToDocument,
  getTenantAppleTouchIconHref,
  getTenantManifestHref,
  getTenantThemeStyle,
  resetTenantThemeOnDocument,
  resolveTenantTheme,
  type TenantTheme,
} from "@/lib/tenantBranding";
import Link from "next/link";

type Role = "ADMIN" | "EMPLOYEE";

type PrecheckResponse =
  | { ok: true; allowed: true; role: Role; needsPasswordSetup: boolean }
  | { ok: false; allowed: false }
  | { ok: false; error: string };

type LoginResponse = { ok: true; role?: Role } | { ok: false; error: string };

type ForgotResponse = { ok: true } | { ok: false; error: string };

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type PublicBrand = {
  displayName: string;
  subtitle: string;
  badgeText: string;
  logoUrl: string | null;
  primaryColor: string | null;
  companySubdomain: string;
};

type LoginClientProps = {
  companySubdomainOverride?: string;
  initialBrand?: PublicBrand;
};

function extractCompanySubdomainFromBrowser(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const host = window.location.hostname.trim().toLowerCase();

  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "";
  }

  if (host.endsWith(".vercel.app")) {
    return "";
  }

  const parts = host.split(".");
  return parts[0] ?? "";
}

function normalizeLogoSrc(
  value: string | null,
  companySubdomain: string
): string | null {
  if (value) {
    const trimmed = value.trim();

    if (trimmed !== "") {
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("data:")
      ) {
        return trimmed;
      }

      return `/${trimmed}`;
    }
  }

  const normalizedSubdomain = companySubdomain.trim().toLowerCase();

  if (normalizedSubdomain) {
    return `/tenant-assets/${normalizedSubdomain}/icon-512.jpeg`;
  }

  return null;
}

export default function LoginClient({
  companySubdomainOverride,
  initialBrand,
}: LoginClientProps) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPassword2, setShowNewPassword2] = useState(false);

  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);
  const [companySubdomain, setCompanySubdomain] = useState(
    companySubdomainOverride ?? ""
  );

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const nameTrim = useMemo(() => fullName.trim(), [fullName]);

  const fallbackBrand: PublicBrand = {
    displayName: "Mitarbeiterportal",
    subtitle: "Digitale Zeiterfassung & Einsatzplanung",
    badgeText: "Portal",
    logoUrl: null,
    primaryColor: "#b8cf3a",
    companySubdomain: "",
  };

  const brand = initialBrand ?? fallbackBrand;
  const logoSrc = normalizeLogoSrc(
    brand.logoUrl,
    companySubdomainOverride ?? companySubdomain ?? ""
  );

    const effectiveCompanySubdomain =
    companySubdomain || companySubdomainOverride || "";

  const legalBasePath = effectiveCompanySubdomain
    ? `/${effectiveCompanySubdomain}`
    : "";

  const privacyHref = `${legalBasePath}/datenschutz`;
  const termsHref = `${legalBasePath}/nutzungsbedingungen`;

  const reqIdRef = useRef(0);
    const serverTheme: TenantTheme = resolveTenantTheme(
    effectiveCompanySubdomain,
    brand.primaryColor
  );

  const pageThemeStyle = getTenantThemeStyle(serverTheme);

  useEffect(() => {
    if (companySubdomainOverride) {
      setCompanySubdomain(companySubdomainOverride);
      return;
    }

    setCompanySubdomain(extractCompanySubdomainFromBrowser());
  }, [companySubdomainOverride]);

  useEffect(() => {
    const effectiveSubdomain = companySubdomainOverride ?? companySubdomain;
    const loginTheme = resolveTenantTheme(
      effectiveSubdomain,
      brand.primaryColor
    );

    applyTenantThemeToDocument(loginTheme);

    applyTenantHeadBranding({
      title: `${brand.displayName} Mitarbeiterportal`,
      themeColor: loginTheme.bg,
      appName: brand.displayName,
      manifestHref: getTenantManifestHref(effectiveSubdomain),
      appleTouchIconHref: getTenantAppleTouchIconHref(effectiveSubdomain),
    });

    return () => {
      resetTenantThemeOnDocument();
    };
  }, [
    brand.displayName,
    brand.primaryColor,
    companySubdomain,
    companySubdomainOverride,
  ]);

  useEffect(() => {
    const myId = ++reqIdRef.current;

    (async () => {
      setError(null);
      setForgotInfo(null);
      setAllowed(null);
      setRole(null);
      setNeedsSetup(false);

      setPassword("");
      setNewPassword("");
      setNewPassword2("");

      setShowPassword(false);
      setShowNewPassword(false);
      setShowNewPassword2(false);

      if (nameTrim.length < 3) {
        return;
      }

      setChecking(true);

      try {
        await wait(250);

        const params = new URLSearchParams({
          fullName: nameTrim,
        });

        if (companySubdomain) {
          params.set("companySubdomain", companySubdomain);
        }

        const response = await fetch(`/api/auth/precheck?${params.toString()}`);
        const json = (await response.json()) as PrecheckResponse;

        if (reqIdRef.current !== myId) {
          return;
        }

        if (typeof json === "object" && json !== null && "ok" in json && json.ok === true) {
          setAllowed(true);
          setRole(json.role);
          setNeedsSetup(json.needsPasswordSetup);
        } else {
          setAllowed(false);
        }
      } catch {
        if (reqIdRef.current !== myId) {
          return;
        }

        setAllowed(false);
      } finally {
        if (reqIdRef.current === myId) {
          setChecking(false);
        }
      }
    })();
  }, [nameTrim, companySubdomain]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setForgotInfo(null);

    if (!nameTrim) {
      setError("Bitte Namen eingeben.");
      return;
    }

    if (allowed === false) {
      setError("Kein Zugriff. Name ist nicht hinterlegt.");
      return;
    }

    if (checking || allowed === null) {
      setError("Bitte kurz warten – Zugriff wird geprüft.");
      return;
    }

    if (needsSetup) {
      if (newPassword.length < 8) {
        setError("Passwort muss mind. 8 Zeichen haben.");
        return;
      }

      if (newPassword !== newPassword2) {
        setError("Passwörter stimmen nicht überein.");
        return;
      }
    } else {
      if (!password) {
        setError("Bitte Passwort eingeben.");
        return;
      }
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          needsSetup
            ? { fullName: nameTrim, newPassword, companySubdomain }
            : { fullName: nameTrim, password, companySubdomain }
        ),
      });

      const data = (await res.json()) as unknown;

      const parsed: LoginResponse =
        typeof data === "object" && data !== null && "ok" in data
          ? (data as LoginResponse)
          : { ok: false, error: "Unerwartete Antwort vom Server." };

      if (!res.ok || !parsed.ok) {
        setError(!parsed.ok ? parsed.error : "Login fehlgeschlagen.");
        return;
      }

      window.location.replace(
        parsed.role === "ADMIN" ? "/admin/dashboard" : "/erfassung"
      );
    } catch {
      setError("Netzwerkfehler beim Login.");
    } finally {
      setBusy(false);
    }
  }

  async function requestForgotPassword() {
    setError(null);
    setForgotInfo(null);

    if (nameTrim.length < 3) {
      setForgotInfo("Bitte zuerst deinen Namen eingeben.");
      return;
    }

    if (checking || allowed === null) {
      setForgotInfo("Bitte kurz warten – Zugriff wird geprüft.");
      return;
    }

    setForgotBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: nameTrim,
          companySubdomain,
        }),
      });

      const data = (await res.json()) as unknown;

      const parsed: ForgotResponse =
        isRecord(data) && typeof data.ok === "boolean"
          ? (data as ForgotResponse)
          : { ok: false, error: "Unerwartete Antwort vom Server." };

      if (!res.ok || !parsed.ok) {
        setForgotInfo(!parsed.ok ? parsed.error : "Anfrage fehlgeschlagen.");
        return;
      }

      setForgotInfo(
        "Anfrage wurde erstellt. Bitte wende dich an den Admin – er sendet dir einen Reset-Link."
      );
    } catch {
      setForgotInfo("Netzwerkfehler. Bitte später erneut versuchen.");
    } finally {
      setForgotBusy(false);
    }
  }

  const statusText = useMemo(() => {
    if (nameTrim.length < 3) {
      return "";
    }

    if (checking) {
      return "Prüfe Zugriff...";
    }

    if (allowed === false) {
      return "Name nicht hinterlegt.";
    }

    if (allowed === true && role) {
      const resolvedRole = role === "ADMIN" ? "Admin" : "Mitarbeiter";
      return `Zugriff OK. (${resolvedRole})`;
    }

    return "";
  }, [nameTrim.length, checking, allowed, role]);

  const eyeBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    color: "var(--muted-2)",
    lineHeight: 1,
    fontSize: 16,
  };

  return (
    <div
      style={{
        ...pageThemeStyle,
        minHeight: "100dvh",
        backgroundColor: "var(--bg)",
        backgroundImage:
          "radial-gradient(1200px 600px at 10% 10%, var(--accent-soft), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(var(--accent-rgb), 0.06), transparent 60%)",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "1200px 600px, 900px 600px",
        backgroundPosition: "0 0, 100% 0",
      }}
    >
      <div style={{ padding: "40px 0" }}>
        <div className="container-app">
        <div
          className="card card-olive"
          style={{
            padding: 20,
            width: "min(620px, 100%)",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div
              style={{
                width: 220,
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${brand.displayName} Logo`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  className="brand-logo-fallback"
                  style={{
                    width: 140,
                    height: 40,
                    fontSize: 12,
                  }}
                >
                  {brand.displayName}
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ color: "var(--muted)" }}>{brand.subtitle}</div>
            {companySubdomain ? (
              <div style={{ color: "var(--muted-2)", fontSize: 12, marginTop: 6 }}>
                Firmenzugang: {companySubdomain}
              </div>
            ) : null}
          </div>

          <div className="hr" style={{ margin: "14px 0" }} />

          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <div className="label">Mitarbeitername</div>
              <input
                className="input"
                placeholder="Vor- und Nachname (muss hinterlegt sein)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
              <div style={{ color: "var(--muted-2)", fontSize: 12, marginTop: 6 }}>
                {statusText}
              </div>
            </div>

            {allowed && role === "EMPLOYEE" && needsSetup ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div className="label">Passwort festlegen (nur beim ersten Mal)</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Neues Passwort (mind. 8 Zeichen)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      style={eyeBtnStyle}
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div className="label">Passwort wiederholen</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showNewPassword2 ? "text" : "password"}
                      placeholder="Passwort wiederholen"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword2((prev) => !prev)}
                      aria-label={showNewPassword2 ? "Passwort verbergen" : "Passwort anzeigen"}
                      style={eyeBtnStyle}
                    >
                      {showNewPassword2 ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            {allowed && !needsSetup ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">Passwort</div>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    style={eyeBtnStyle}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={requestForgotPassword}
                    disabled={forgotBusy}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--muted-2)",
                      cursor: forgotBusy ? "not-allowed" : "pointer",
                      fontSize: 12,
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {forgotBusy ? "Anfrage wird erstellt..." : "Passwort vergessen?"}
                  </button>
                </div>
              </div>
            ) : null}

            {(error || forgotInfo) && (
              <div
                className={`card app-inline-alert ${
                  error ? "app-inline-alert-danger" : "app-inline-alert-neutral"
                }`}
              >
                <span style={{ fontWeight: 700 }}>
                  {error ?? forgotInfo}
                </span>
              </div>
            )}

            <button
              className="btn btn-accent"
              disabled={busy || checking || allowed !== true}
              style={{ width: "100%" }}
            >
              {busy ? "Bitte warten..." : needsSetup ? "Passwort speichern & Login" : "Login"}
            </button>

            <div className="login-legal-links">
              <Link href={privacyHref} className="login-legal-link">
                Datenschutz
              </Link>

              <span className="login-legal-separator">•</span>

              <Link href={termsHref} className="login-legal-link">
                Nutzungsbedingungen
              </Link>
            </div>

            <div style={{ color: "var(--muted-2)", marginTop: 10, fontSize: 12 }}>
              Nur hinterlegte Mitarbeiter können sich anmelden. Beim ersten Login wird ein
              Passwort festgelegt.
            </div>
          </form>
                </div>
      </div>
    </div>
  );
}
