"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type UserRow = { id: string; fullName: string };

type UsersResponse = { users: UserRow[] } | { error: string };

type ResetResponse =
  | {
      ok: true;
      resetUrl: string;
      expiresAt: string;
      user: { id: string; fullName: string };
    }
  | { ok: false; error: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [resetInfo, setResetInfo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        const data = (await res.json()) as UsersResponse;

        if (!res.ok || "error" in data) {
          setErr("Konnte Mitarbeiter nicht laden.");
          setUsers([]);
          return;
        }
        setUsers(data.users ?? []);
      } catch {
        setErr("Konnte Mitarbeiter nicht laden.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(
    () => [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, "de")),
    [users]
  );

  async function createResetLink(userId: string) {
    try {
      setErr("");
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = (await res.json()) as ResetResponse;

      if (!res.ok || !data.ok) {
        const msg = data.ok ? "Reset fehlgeschlagen" : data.error || "Reset fehlgeschlagen";
        setErr(msg);
        return;
      }

      setResetUrl(data.resetUrl);
      setResetInfo(`Gültig bis: ${new Date(data.expiresAt).toLocaleString("de-DE")}`);
      setModalOpen(true);
    } catch {
      setErr("Reset fehlgeschlagen");
    }
  }

  async function copyLink() {
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
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Mitarbeiter</h1>
        <div style={{ opacity: 0.75, marginBottom: 16 }}>
          Reset-Link erstellen und dem Mitarbeiter schicken (z.B. WhatsApp).
        </div>

        {err ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        ) : null}

        {loading ? (
          <div>lädt…</div>
        ) : (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {sorted.length === 0 ? (
              <div style={{ padding: 14, opacity: 0.8 }}>Keine Mitarbeiter gefunden.</div>
            ) : (
              sorted.map((u, idx) => (
                <div
                  key={u.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                  <button
                    onClick={() => createResetLink(u.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      cursor: "pointer",
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
                onClick={copyLink}
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