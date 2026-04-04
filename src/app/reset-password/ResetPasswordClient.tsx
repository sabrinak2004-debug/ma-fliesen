"use client";

import { useEffect, useRef, useState } from "react";

type ApiResponse = { ok: true } | { ok: false; error: string };

type ResetPasswordClientProps = {
  token: string;
  companySubdomain: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiResponse(value: unknown): ApiResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value["ok"] === true) {
    return { ok: true };
  }

  if (value["ok"] === false && typeof value["error"] === "string") {
    return { ok: false, error: value["error"] };
  }

  return null;
}

export default function ResetPasswordClient({
  token,
  companySubdomain,
}: ResetPasswordClientProps) {
  const redirectTimerRef = useRef<number | null>(null);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function submit(): Promise<void> {
    setMsg("");

    if (!token) {
      setMsg("Token fehlt (Link ist ungültig).");
      return;
    }

    if (pw1.length < 8) {
      setMsg("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (pw1 !== pw2) {
      setMsg("Passwörter stimmen nicht überein.");
      return;
    }

    try {
      setBusy(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: pw1,
          companySubdomain,
        }),
      });

      const json: unknown = await response.json().catch(() => null);
      const data = parseApiResponse(json);

      if (!response.ok || !data || !data.ok) {
        setMsg(
          data && !data.ok ? data.error : "Reset fehlgeschlagen."
        );
        return;
      }

      setMsg("Passwort wurde gesetzt. Du kannst dich jetzt einloggen.");

      redirectTimerRef.current = window.setTimeout(() => {
        if (companySubdomain) {
          window.location.replace(`/${companySubdomain}/login`);
          return;
        }

        window.location.replace("/login");
      }, 800);
    } catch {
      setMsg("Reset fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="reset-password-shell">
      <div className="card card-olive reset-password-card">
        <h1 className="reset-password-title">Neues Passwort setzen</h1>

        {companySubdomain ? (
          <div className="reset-password-company">
            Firmenzugang: {companySubdomain}
          </div>
        ) : null}

        {!token ? (
          <div className="reset-password-empty">
            Token fehlt. Bitte den Link vom Admin erneut anfordern.
          </div>
        ) : (
          <div className="reset-password-form">
            <div className="reset-password-field">
              <div className="reset-password-label">Neues Passwort</div>
              <input
                value={pw1}
                onChange={(event) => setPw1(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="input"
              />
            </div>

            <div className="reset-password-field">
              <div className="reset-password-label">
                Passwort bestätigen
              </div>
              <input
                value={pw2}
                onChange={(event) => setPw2(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="input"
              />
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="btn btn-accent"
            >
              {busy ? "Speichern..." : "Passwort speichern"}
            </button>

            {msg ? <div className="reset-password-message">{msg}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}