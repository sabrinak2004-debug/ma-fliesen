"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import {
  ADMIN_PASSWORD_RESET_UI_TEXTS,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";

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

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isAppLanguage(v: unknown): v is AppUiLanguage {
  return (
    v === "DE" ||
    v === "EN" ||
    v === "IT" ||
    v === "TR" ||
    v === "SQ" ||
    v === "KU" ||
    v === "RO"

  );
}

function isAdminSessionDTO(v: unknown): v is AdminSessionDTO {
  return (
    isRecord(v) &&
    isString(v["userId"]) &&
    isString(v["fullName"]) &&
    (v["role"] === "ADMIN" || v["role"] === "EMPLOYEE") &&
    isAppLanguage(v["language"]) &&
    isString(v["companyId"]) &&
    isString(v["companyName"]) &&
    isString(v["companySubdomain"]) &&
    (isString(v["companyLogoUrl"]) || v["companyLogoUrl"] === null) &&
    (isString(v["primaryColor"]) || v["primaryColor"] === null)
  );
}

function parseMeSession(v: unknown): AdminSessionDTO | null {
  if (!isRecord(v)) return null;
  const session = v["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

export default function AdminPasswordResetPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [language, setLanguage] = useState<AppUiLanguage>("DE");

  function t(key: keyof typeof ADMIN_PASSWORD_RESET_UI_TEXTS): string {
    return translate(language, key, ADMIN_PASSWORD_RESET_UI_TEXTS);
  }

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
        setErr(t("loadError"));
        setRows([]);
        return;
      }
      setRows(data.requests ?? []);
    } catch {
      setErr(t("loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const meResponse = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const meData: unknown = await meResponse.json().catch(() => ({}));
        if (!alive) return;

        const session = parseMeSession(meData);
        if (session) {
          setLanguage(session.language);
        }
      } catch {
        if (!alive) return;
      }

      if (alive) {
        await load();
      }
    })();

    return () => {
      alive = false;
    };
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
        setErr(!data.ok ? data.error : t("resetFailed"));
        return;
      }

      setResetUrl(data.resetUrl);
      const expiresLabel = new Date(data.expiresAt).toLocaleString("de-DE");
      setResetInfo(`${t("singleUseUntil")} ${expiresLabel}`);
      setModalOpen(true);

      // danach Liste aktualisieren (damit Requests ggf. verschwinden, wenn du sie bei reset schließen willst)
      await load();
    } catch {
      setErr(t("resetFailed"));
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setResetInfo((p) => (p.includes(t("copied")) ? p : `${p} • ${t("copied")}`));
    } catch {
      setResetInfo((p) => `${p} • ${t("copyNotPossible")}`);
    }
  }

  return (
    <AppShell>
      <div className="admin-password-shell">
        <div>
          <h1 className="admin-password-title">{t("pageTitle")}</h1>
          <div className="admin-password-subtitle">
            {t("pageSubtitle")}
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
          <div>{t("loading")}</div>
        ) : (
          <div className="admin-password-list">
            {rows.length === 0 ? (
              <div className="admin-password-empty">{t("noOpenRequests")}</div>
            ) : (
              rows.map((r) => (
                <div
                  key={r.id}
                  className="admin-password-row"
                >
                  <div>
                    <div className="admin-password-row-title">{r.user.fullName}</div>
                    <div className="admin-password-row-meta">
                      {t("requestPrefix")} {new Date(r.createdAt).toLocaleString("de-DE")}
                      {" • "}
                      {t("passwordSetAt")}
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
            <div className="admin-password-modal-footer">
              <button
                type="button"
                onClick={copy}
                className="tenant-action-button"
              >
                {t("copyLink")}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="tenant-action-link"
              >
                {t("close")}
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
              {t("hint")}
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}