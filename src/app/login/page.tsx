"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

<Image
  src="/logo-ma-fliesen.jpng"
  alt="MA Fliesen"
  width={200}
  height={80}
  priority
  style={{ marginBottom: 20 }}
/>

const ADMIN_NAMES = ["martin meinhold", "sandra meinhold"];

function normName(v: string) {
  return v.trim().toLowerCase();
}

type LoginResponse =
  | { ok: true }
  | { ok: false; error: string };

export default function LoginPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPassword = useMemo(() => ADMIN_NAMES.includes(normName(fullName)), [fullName]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    if (!name) {
      setError("Bitte Namen eingeben.");
      return;
    }
    if (needsPassword && !password) {
      setError("Bitte Passwort eingeben.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, password: needsPassword ? password : undefined }),
      });

      const data = (await res.json()) as unknown;

      // safe parse
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

  return (
    <div style={{ padding: "40px 0" }}>
      <div className="container-app">
        <div className="card card-olive" style={{ padding: 20, width: "min(620px, 100%)", margin: "0 auto" }}>
          <div className="brand" style={{ marginBottom: 14 }}>
            <div className="brand-badge">M</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>MA Fliesen</div>
              <div style={{ color: "var(--muted)" }}>Zeiterfassung</div>
            </div>
          </div>

          <div className="hr" style={{ margin: "14px 0" }} />

          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <div className="label">Mitarbeitername</div>
              <input
                className="input"
                placeholder="Vor- und Nachname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {needsPassword && (
              <div style={{ marginBottom: 12 }}>
                <div className="label">Passwort (nur Geschäftsführung)</div>
                <input
                  className="input"
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
                <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
              </div>
            )}

            <button className="btn btn-accent" disabled={busy} style={{ width: "100%" }}>
              {busy ? "Bitte warten..." : "Weiter"}
            </button>

            <div style={{ color: "var(--muted-2)", marginTop: 10, fontSize: 12 }}>
              Tipp: Bei normalen Mitarbeitern reicht der Name. Bei Martin/Sandra wird ein Passwort abgefragt.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}