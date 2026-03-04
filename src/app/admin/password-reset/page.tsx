"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  createdAt: string;
  user: { id: string; fullName: string; passwordUpdatedAt: string | null };
};

type RequestsResponse = { requests: RequestRow[] } | { error: string };

type ResetResponse =
  | { ok: true; resetUrl: string; expiresAt: string; user: { id: string; fullName: string } }
  | { ok: false; error: string };

export default function AdminPasswordResetPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [resetInfo, setResetInfo] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch("/api/admin/password-reset-requests", { cache: "no-store" });
      const data = (await res.json()) as RequestsResponse;
      if (!res.ok || "error" in data) {
        setErr("Konnte Anfragen nicht laden.");
        setRows([]);
        return;
      }
      setRows(data.requests ?? []);
    } catch {
      setErr("Konnte Anfragen nicht laden.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createResetLink(userId: string) {
    try {
      setErr("");
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as ResetResponse;
      if (!res.ok || !data.ok) {
        setErr(!data.ok ? data.error : "Reset fehlgeschlagen");
        return;
      }

      setResetUrl(data.resetUrl);
      setResetInfo(`Gültig bis: ${new Date(data.expiresAt).toLocaleString("de-DE")}`);
      setModalOpen(true);

      // danach Liste aktualisieren (damit Requests ggf. verschwinden, wenn du sie bei reset schließen willst)
      await load();
    } catch {
      setErr("Reset fehlgeschlagen");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setResetInfo((p) => (p.includes("Kopiert") ? p : `${p} • Kopiert ✅`));
    } catch {
      setResetInfo((p) => `${p} • Kopieren nicht möglich`);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Passwort-Reset</h1>
        <div style={{ opacity: 0.75, marginBottom: 16 }}>
          Mitarbeiter klicken „Passwort vergessen“ → hier erscheinen Anfragen. Link erzeugen & senden (z.B. WhatsApp).
        </div>

        {err ? (
          <div style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", marginBottom: 16 }}>
            {err}
          </div>
        ) : null}

        {loading ? (
          <div>lädt…</div>
        ) : (
          <div style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, overflow: "hidden" }}>
            {rows.length === 0 ? (
              <div style={{ padding: 14, opacity: 0.8 }}>Keine offenen Anfragen.</div>
            ) : (
              rows.map((r, idx) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.user.fullName}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Anfrage: {new Date(r.createdAt).toLocaleString("de-DE")}
                      {" • "}
                      Passwort gesetzt am:{" "}
                      {r.user.passwordUpdatedAt ? new Date(r.user.passwordUpdatedAt).toLocaleString("de-DE") : "—"}
                    </div>
                  </div>

                  <button
                    onClick={() => createResetLink(r.user.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Reset-Link erstellen
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <Modal
          open={modalOpen}
          title="Reset-Link"
          onClose={() => setModalOpen(false)}
          footer={
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={copy}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
              >
                Link kopieren
              </button>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }}
              >
                Schließen
              </button>
            </div>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ opacity: 0.8 }}>{resetInfo}</div>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                wordBreak: "break-all",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13,
              }}
            >
              {resetUrl}
            </div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              Hinweis: Link ist einmalig. Danach ist er ungültig.
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}