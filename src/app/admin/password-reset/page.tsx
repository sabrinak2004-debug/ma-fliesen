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
      const res = await fetch("/api/admin/password-reset-requests", {
        cache: "no-store",
        credentials: "include",
      });
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
    void load();
  }, []);

  async function createResetLink(userId: string) {
    try {
      setErr("");
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = (await res.json()) as ResetResponse;
      if (!res.ok || !data.ok) {
        setErr(!data.ok ? data.error : "Reset fehlgeschlagen");
        return;
      }

      setResetUrl(data.resetUrl);
      const expiresLabel = new Date(data.expiresAt).toLocaleString("de-DE");
      setResetInfo(`Einmalig nutzbar. Spätestens gültig bis: ${expiresLabel}`);
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
      <div className="admin-password-shell">
        <div>
          <h1 className="admin-password-title">Passwort-Reset</h1>
          <div className="admin-password-subtitle">
            Mitarbeiter klicken „Passwort vergessen“ → hier erscheinen Anfragen. Link erzeugen & senden (z.B. WhatsApp).
          </div>
        </div>

        {err ? (
          <div
            className="tenant-status-card tenant-status-card-danger"
            style={{ padding: 12, marginBottom: 16 }}
          >
            <div className="tenant-status-text-danger">{err}</div>
          </div>
        ) : null}

        {loading ? (
          <div>lädt…</div>
        ) : (
          <div className="admin-password-list">
            {rows.length === 0 ? (
              <div className="admin-password-empty">Keine offenen Anfragen.</div>
            ) : (
              rows.map((r) => (
                <div
                  key={r.id}
                  className="admin-password-row"
                >
                  <div>
                    <div className="admin-password-row-title">{r.user.fullName}</div>
                    <div className="admin-password-row-meta">
                      Anfrage: {new Date(r.createdAt).toLocaleString("de-DE")}
                      {" • "}
                      Passwort gesetzt am:{" "}
                      {r.user.passwordUpdatedAt
                        ? new Date(r.user.passwordUpdatedAt).toLocaleString("de-DE")
                        : "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => createResetLink(r.user.id)}
                    className="tenant-action-button"
                    style={{ whiteSpace: "nowrap" }}
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
            <div className="admin-password-modal-footer">
              <button
                type="button"
                onClick={copy}
                className="tenant-action-button"
              >
                Link kopieren
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="tenant-action-link"
              >
                Schließen
              </button>
            </div>
          }
        >
          <div className="admin-password-modal-stack">
            <div className="admin-password-modal-info">{resetInfo}</div>
            <div className="admin-password-modal-code">
              {resetUrl}
            </div>
            <div className="admin-password-modal-hint">
              Hinweis: Der Link kann nur einmal verwendet werden und wird nach erfolgreicher Nutzung sofort ungültig. Ohne Nutzung läuft er spätestens zum angegebenen Zeitpunkt ab.
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}