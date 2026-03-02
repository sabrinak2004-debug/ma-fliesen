"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ⚠️ WICHTIG: bei dir heißt die Rolle "EMPLOYEE", nicht "USER"
type Role = "ADMIN" | "EMPLOYEE";

type PrecheckResponse =
  | { ok: true; allowed: true; role: Role; needsPasswordSetup: boolean }
  | { ok: false; allowed: false }
  | { ok: false; error: string };

type LoginResponse = { ok: true; role?: Role } | { ok: false; error: string };

type ForgotResponse = { ok: true } | { ok: false; error: string };

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function LoginPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  // ✅ Passwort anzeigen (Toggle)
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPassword2, setShowNewPassword2] = useState(false);

  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Passwort vergessen
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const nameTrim = useMemo(() => fullName.trim(), [fullName]);

  // verhindert, dass alte Precheck-Antworten neuere überschreiben
  const reqIdRef = useRef(0);

  // ✅ Precheck sobald Name „halbwegs“ steht
  useEffect(() => {
    const myId = ++reqIdRef.current;

    (async () => {
      // Reset UI state bei Namensänderung
      setError(null);
      setForgotInfo(null);
      setAllowed(null);
      setRole(null);
      setNeedsSetup(false);

      // Passwortfelder zurücksetzen, wenn Name sich ändert
      setPassword("");
      setNewPassword("");
      setNewPassword2("");

      // Toggle zurücksetzen
      setShowPassword(false);
      setShowNewPassword(false);
      setShowNewPassword2(false);

      if (nameTrim.length < 3) return;

      setChecking(true);
      try {
        await wait(250);
        const r = await fetch(`/api/auth/precheck?fullName=${encodeURIComponent(nameTrim)}`);
        const j = (await r.json()) as PrecheckResponse;

        // wenn inzwischen eine neuere Anfrage läuft -> ignorieren
        if (reqIdRef.current !== myId) return;

        if (typeof j === "object" && j !== null && "ok" in j && j.ok === true) {
          setAllowed(true);
          setRole(j.role);
          setNeedsSetup(j.needsPasswordSetup);
        } else {
          setAllowed(false);
        }
      } catch {
        // Netzwerk/Server Fehler -> nicht freigeben
        if (reqIdRef.current !== myId) return;
        setAllowed(false);
      } finally {
        if (reqIdRef.current === myId) setChecking(false);
      }
    })();
  }, [nameTrim]);

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

    // Wenn precheck noch läuft oder noch nicht entschieden:
    if (checking || allowed === null) {
      setError("Bitte kurz warten – Zugriff wird geprüft.");
      return;
    }

    // Mitarbeiter-Erstlogin: Passwort setzen
    if (needsSetup) {
      if (newPassword.length < 6) {
        setError("Passwort muss mind. 6 Zeichen haben.");
        return;
      }
      if (newPassword !== newPassword2) {
        setError("Passwörter stimmen nicht überein.");
        return;
      }
    } else {
      // normaler Login: Passwort erforderlich (Admin immer, Mitarbeiter nach Setup auch)
      if (!password) {
        setError("Bitte Passwort eingeben.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsSetup ? { fullName: nameTrim, newPassword } : { fullName: nameTrim, password }),
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

      router.replace("/erfassung");
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

    // Wenn gerade geprüft wird: kurz warten
    if (checking || allowed === null) {
      setForgotInfo("Bitte kurz warten – Zugriff wird geprüft.");
      return;
    }

    // Optional: wenn Name nicht hinterlegt, trotzdem keine Details leaken
    setForgotBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: nameTrim }),
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

      // Wichtig: immer gleiche Erfolgsmeldung (keine Info-Leaks)
      setForgotInfo("Anfrage wurde erstellt. Bitte wende dich an den Admin – er sendet dir einen Reset-Link.");
    } catch {
      setForgotInfo("Netzwerkfehler. Bitte später erneut versuchen.");
    } finally {
      setForgotBusy(false);
    }
  }

  const statusText = useMemo(() => {
    if (nameTrim.length < 3) return "";
    if (checking) return "Prüfe Zugriff...";
    if (allowed === false) return "Name nicht hinterlegt.";
    if (allowed === true && role) {
      const r = role === "ADMIN" ? "Admin" : "Mitarbeiter";
      return `Zugriff OK. (${r})`;
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
    <div style={{ padding: "40px 0" }}>
      <div className="container-app">
        <div className="card card-olive" style={{ padding: 20, width: "min(620px, 100%)", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Image
              src="/logo-ma-fliesen.jpeg"
              alt="MA Fliesen Logo"
              width={220}
              height={80}
              priority
              style={{ objectFit: "contain" }}
            />
          </div>

          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>MA Fliesen Mitarbeiterportal</div>
            <div style={{ color: "var(--muted)" }}>Digitale Zeiterfassung & Einsatzplanung</div>
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
              <div style={{ color: "var(--muted-2)", fontSize: 12, marginTop: 6 }}>{statusText}</div>
            </div>

            {/* Erstes Setzen für Mitarbeiter */}
            {allowed && role === "EMPLOYEE" && needsSetup ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div className="label">Passwort festlegen (nur beim ersten Mal)</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Neues Passwort (mind. 6 Zeichen)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
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
                      onClick={() => setShowNewPassword2((p) => !p)}
                      aria-label={showNewPassword2 ? "Passwort verbergen" : "Passwort anzeigen"}
                      style={eyeBtnStyle}
                    >
                      {showNewPassword2 ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            {/* Normales Passwortfeld (Admins immer, Mitarbeiter nach Setup) */}
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
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    style={eyeBtnStyle}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* ✅ Passwort vergessen: nur anzeigen, wenn normales Passwortfeld sichtbar ist */}
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
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
                {error ? (
                  <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
                ) : (
                  <span style={{ color: "var(--muted-2)", fontWeight: 700 }}>{forgotInfo}</span>
                )}
              </div>
            )}

            <button className="btn btn-accent" disabled={busy || checking || allowed !== true} style={{ width: "100%" }}>
              {busy ? "Bitte warten..." : needsSetup ? "Passwort speichern & Login" : "Login"}
            </button>

            <div style={{ color: "var(--muted-2)", marginTop: 10, fontSize: 12 }}>
              Nur hinterlegte Mitarbeiter können sich anmelden. Beim ersten Login wird ein Passwort festgelegt.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}