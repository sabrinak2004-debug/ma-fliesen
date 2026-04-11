"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import {
  translate,
  type AppUiLanguage,
  type AdminUsersTextKey,
  ADMIN_USERS_UI_TEXTS,
} from "@/lib/i18n";

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

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: "DE" | "EN" | "IT" | "TR" | "SQ" | "KU";
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isAdminSessionDTO(v: unknown): v is AdminSessionDTO {
  return (
    isRecord(v) &&
    typeof v["userId"] === "string" &&
    typeof v["fullName"] === "string" &&
    (v["role"] === "ADMIN" || v["role"] === "EMPLOYEE") &&
    (v["language"] === "DE" ||
      v["language"] === "EN" ||
      v["language"] === "IT" ||
      v["language"] === "TR" ||
      v["language"] === "SQ" ||
      v["language"] === "KU") &&
    typeof v["companyId"] === "string" &&
    typeof v["companyName"] === "string" &&
    typeof v["companySubdomain"] === "string" &&
    (typeof v["companyLogoUrl"] === "string" || v["companyLogoUrl"] === null) &&
    (typeof v["primaryColor"] === "string" || v["primaryColor"] === null)
  );
}

function parseMeSession(v: unknown): AdminSessionDTO | null {
  if (!isRecord(v)) return null;
  const session = v["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [language, setLanguage] = useState<AppUiLanguage>("DE");

  const [modalOpen, setModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const t = (key: AdminUsersTextKey): string =>
    translate(language, key, ADMIN_USERS_UI_TEXTS);

  useEffect(() => {
    let alive = true;

    async function loadSession(): Promise<void> {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => null);
        const session = parseMeSession(json);

        if (!alive || !session) return;

        setLanguage(session.language);
      } catch {
        if (!alive) return;
      }
    }

    void loadSession();

    return () => {
      alive = false;
    };
  }, []);

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
          setErr(t("loadError"));
          setUsers([]);
          return;
        }

        setUsers(data.users);
      } catch {
        if (!alive) return;
        setErr(t("loadError"));
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
    () => [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, language.toLowerCase())),
    [users, language]
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
          data && !data.ok ? data.error : t("resetFailed");
        setErr(message);
        return;
      }

      setResetUrl(data.resetUrl);
      setResetInfo(
        `${t("validUntil")} ${new Date(data.expiresAt).toLocaleString(language.toLowerCase())}`
      );
      setModalOpen(true);
    } catch {
      setErr(t("resetFailed"));
    }
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setResetInfo((previous) =>
        previous.includes(t("copied"))
          ? previous
          : `${previous} • ${t("copied")}`
      );
    } catch {
      setResetInfo((previous) => `${previous} • ${t("copyNotPossible")}`);
    }
  }

  return (
    <AppShell activeLabel={t("activeLabel")}>
      <div className="admin-users-shell">
        <h1 className="admin-users-title">{t("pageTitle")}</h1>

        <div className="admin-users-subtitle">
          {t("pageSubtitle")}
        </div>

        {err ? (
          <div className="tenant-status-card tenant-status-card-danger admin-users-error">
            <div className="tenant-status-text-danger">{err}</div>
          </div>
        ) : null}

        {loading ? (
          <div className="tenant-soft-panel">{t("loading")}</div>
        ) : (
          <div className="admin-users-list">
            {sorted.length === 0 ? (
              <div className="admin-users-empty">
                {t("empty")}
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
                    {t("createResetLink")}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <Modal
          open={modalOpen}
          title={t("resetLinkTitle")}
          onClose={() => setModalOpen(false)}
          footer={
            <div className="modal-footer-row">
              <button
                type="button"
                onClick={() => void copyLink()}
                className="btn"
              >
                {t("copyLink")}
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn"
              >
                {t("close")}
              </button>
            </div>
          }
        >
          <div className="admin-users-modal-stack">
            <div className="admin-users-modal-meta">{resetInfo}</div>

            <div className="admin-users-modal-code">{resetUrl}</div>

            <div className="admin-users-modal-hint">
              {t("hint")}
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}