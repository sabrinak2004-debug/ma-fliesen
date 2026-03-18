"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = { ok: true } | { ok: false; error: string };

type ResetPasswordClientProps = {
  token: string;
  companySubdomain: string;
};

export default function ResetPasswordClient({
  token,
  companySubdomain,
}: ResetPasswordClientProps) {
  const router = useRouter();
  const redirectTimerRef = useRef<number | null>(null);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  async function submit() {
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: pw1,
          companySubdomain,
        }),
      });

      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) {
        setMsg(!data.ok ? data.error : "Reset fehlgeschlagen");
        return;
      }

      setMsg("Passwort wurde gesetzt. Du kannst dich jetzt einloggen.");
      redirectTimerRef.current = window.setTimeout(() => {
        if (companySubdomain) {
          router.push(`/${companySubdomain}/login`);
          return;
        }

        router.push("/login");
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
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Neues Passwort setzen</h1>
        {companySubdomain ? (
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
            Firmenzugang: {companySubdomain}
          </div>
        ) : null}

        {!token ? (
          <div style={{ opacity: 0.85 }}>Token fehlt. Bitte den Link vom Admin erneut anfordern.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Neues Passwort</div>
              <input
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                type="password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Passwort bestätigen</div>
              <input
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                type="password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>

            <button
              onClick={submit}
              disabled={busy}
              style={{
                padding: "12px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.10)",
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "speichern…" : "Passwort speichern"}
            </button>

            {msg ? <div style={{ opacity: 0.9 }}>{msg}</div> : null}
          </div>
        )}
      </div>
  );
}