"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type UserRow = {
  id: string;
  fullName: string;
};

type UsersResponse =
  | { ok: true; users: UserRow[] }
  | { ok: false; error: string };

type ResetResponse =
  | {
      ok: true;
      resetUrl: string;
      expiresAt: string;
      user: { id: string; fullName: string };
    }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUserRow(value: unknown): value is UserRow {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["fullName"] === "string"
  );
}

function parseUsersResponse(value: unknown): UsersResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value["ok"] === true && Array.isArray(value["users"])) {
    const users = value["users"];
    if (!users.every(isUserRow)) {
      return null;
    }

    return { ok: true, users };
  }

  if (value["ok"] === false && typeof value["error"] === "string") {
    return { ok: false, error: value["error"] };
  }

  return null;
}

function isResetSuccessResponse(
  value: unknown
): value is Extract<ResetResponse, { ok: true }> {
  return (
    isRecord(value) &&
    value["ok"] === true &&
    typeof value["resetUrl"] === "string" &&
    typeof value["expiresAt"] === "string" &&
    isRecord(value["user"]) &&
    typeof value["user"]["id"] === "string" &&
    typeof value["user"]["fullName"] === "string"
  );
}

function parseResetResponse(value: unknown): ResetResponse | null {
  if (isResetSuccessResponse(value)) {
    return value;
  }

  if (isRecord(value) && value["ok"] === false && typeof value["error"] === "string") {
    return { ok: false, error: value["error"] };
  }

  return null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [resetInfo, setResetInfo] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadUsers(): Promise<void> {
      try {
        setLoading(true);
        setErr("");

        const response = await fetch("/api/admin/users", {
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => null);
        const data = parseUsersResponse(json);

        if (!alive) return;

        if (!response.ok || !data || !data.ok) {
          setErr("Konnte Mitarbeiter nicht laden.");
          setUsers([]);
          return;
        }

        setUsers(data.users);
      } catch {
        if (!alive) return;
        setErr("Konnte Mitarbeiter nicht laden.");
        setUsers([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void loadUsers();

    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(
    () => [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, "de")),
    [users]
  );

  async function createResetLink(userId: string): Promise<void> {
    try {
      setErr("");

      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const json: unknown = await response.json().catch(() => null);
      const data = parseResetResponse(json);

      if (!response.ok || !data || !data.ok) {
        const message =
          data && !data.ok ? data.error : "Reset fehlgeschlagen.";
        setErr(message);
        return;
      }

      setResetUrl(data.resetUrl);
      setResetInfo(
        `Gültig bis: ${new Date(data.expiresAt).toLocaleString("de-DE")}`
      );
      setModalOpen(true);
    } catch {
      setErr("Reset fehlgeschlagen.");
    }
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setResetInfo((previous) =>
        previous.includes("Kopiert")
          ? previous
          : `${previous} • Kopiert ✅`
      );
    } catch {
      setResetInfo((previous) => `${previous} • Kopieren nicht möglich`);
    }
  }

  return (
    <AppShell activeLabel="Mitarbeiter">
      <div className="admin-users-shell">
        <h1 className="admin-users-title">Mitarbeiter</h1>

        <div className="admin-users-subtitle">
          Reset-Link erstellen und dem Mitarbeiter schicken
          (z. B. per WhatsApp).
        </div>

        {err ? (
          <div className="tenant-status-card tenant-status-card-danger admin-users-error">
            <div className="tenant-status-text-danger">{err}</div>
          </div>
        ) : null}

        {loading ? (
          <div className="tenant-soft-panel">Lädt...</div>
        ) : (
          <div className="admin-users-list">
            {sorted.length === 0 ? (
              <div className="admin-users-empty">
                Keine Mitarbeiter gefunden.
              </div>
            ) : (
              sorted.map((user) => (
                <div key={user.id} className="admin-users-row">
                  <div className="admin-users-name">{user.fullName}</div>

                  <button
                    type="button"
                    onClick={() => void createResetLink(user.id)}
                    className="btn"
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
            <div className="modal-footer-row">
              <button
                type="button"
                onClick={() => void copyLink()}
                className="btn"
              >
                Link kopieren
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn"
              >
                Schließen
              </button>
            </div>
          }
        >
          <div className="admin-users-modal-stack">
            <div className="admin-users-modal-meta">{resetInfo}</div>

            <div className="admin-users-modal-code">{resetUrl}</div>

            <div className="admin-users-modal-hint">
              Hinweis: Link ist einmalig. Danach ist er ungültig.
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}