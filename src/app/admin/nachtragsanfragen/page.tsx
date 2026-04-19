"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  ADMIN_CORRECTION_REQUESTS_UI_TEXTS,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";
import { CircleCheckBig } from 'lucide-react';
import { CircleX } from 'lucide-react';

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type TimeEntryCorrectionRequestItem = {
  id: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  noteEmployee: string;
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
};

type UserOption = {
  id: string;
  fullName: string;
};

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: "DE" | "EN" | "IT" | "TR" | "SQ" | "KU" | "RO";
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isAdminSessionDTO(v: unknown): v is AdminSessionDTO {
  return (
    isRecord(v) &&
    getStringField(v, "userId") !== null &&
    getStringField(v, "fullName") !== null &&
    (v["role"] === "ADMIN" || v["role"] === "EMPLOYEE") &&
    (v["language"] === "DE" ||
      v["language"] === "EN" ||
      v["language"] === "IT" ||
      v["language"] === "TR" ||
      v["language"] === "SQ" ||
      v["language"] === "KU" ||
      v["language"] === "RO" ) &&
    getStringField(v, "companyId") !== null &&
    getStringField(v, "companyName") !== null &&
    getStringField(v, "companySubdomain") !== null &&
    (getStringField(v, "companyLogoUrl") !== null || v["companyLogoUrl"] === null) &&
    (getStringField(v, "primaryColor") !== null || v["primaryColor"] === null)
  );
}

function parseMeSession(v: unknown): AdminSessionDTO | null {
  if (!isRecord(v)) return null;
  const session = v["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

type AdminCorrectionRequestsResponse =
  | {
      ok: true;
      requests: TimeEntryCorrectionRequestItem[];
      grouped: {
        pending: TimeEntryCorrectionRequestItem[];
        approved: TimeEntryCorrectionRequestItem[];
        rejected: TimeEntryCorrectionRequestItem[];
      };
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function isRequestStatus(v: unknown): v is RequestStatus {
  return v === "PENDING" || v === "APPROVED" || v === "REJECTED";
}

function isTimeEntryCorrectionRequestItem(v: unknown): v is TimeEntryCorrectionRequestItem {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const startDate = getStringField(v, "startDate");
  const endDate = getStringField(v, "endDate");
  const status = v["status"];
  const noteEmployee = getStringField(v, "noteEmployee");
  const noteAdmin = getStringField(v, "noteAdmin");
  const createdAt = getStringField(v, "createdAt");
  const updatedAt = getStringField(v, "updatedAt");
  const decidedAtRaw = v["decidedAt"];
  const userRaw = v["user"];
  const decidedByRaw = v["decidedBy"];

  if (
    !id ||
    !startDate ||
    !endDate ||
    !isRequestStatus(status) ||
    noteEmployee === null ||
    noteAdmin === null ||
    !createdAt ||
    !updatedAt
  ) {
    return false;
  }

  if (!isRecord(userRaw)) return false;
  const userId = getStringField(userRaw, "id");
  const userFullName = getStringField(userRaw, "fullName");
  if (!userId || !userFullName) return false;

  const decidedAt = decidedAtRaw === null || typeof decidedAtRaw === "string" ? decidedAtRaw : undefined;
  if (decidedAt === undefined) return false;

  let decidedBy: TimeEntryCorrectionRequestItem["decidedBy"] = null;
  if (decidedByRaw !== null) {
    if (!isRecord(decidedByRaw)) return false;
    const decidedById = getStringField(decidedByRaw, "id");
    const decidedByFullName = getStringField(decidedByRaw, "fullName");
    if (!decidedById || !decidedByFullName) return false;
    decidedBy = { id: decidedById, fullName: decidedByFullName };
  }

  return true;
}

function parseAdminCorrectionRequestsResponse(v: unknown): AdminCorrectionRequestsResponse {
  if (!isRecord(v)) {
    return { ok: false, error: "Unerwartete Antwort." };
  }

  if (v["ok"] !== true) {
    const error = getStringField(v, "error") ?? "Unerwartete Antwort.";
    return { ok: false, error };
  }

  const requestsRaw = v["requests"];
  const groupedRaw = v["grouped"];

  if (!Array.isArray(requestsRaw) || !isRecord(groupedRaw)) {
    return { ok: false, error: "Unerwartete Antwort." };
  }

  const pendingRaw = groupedRaw["pending"];
  const approvedRaw = groupedRaw["approved"];
  const rejectedRaw = groupedRaw["rejected"];

  if (!Array.isArray(pendingRaw) || !Array.isArray(approvedRaw) || !Array.isArray(rejectedRaw)) {
    return { ok: false, error: "Unerwartete Antwort." };
  }

  const requests = requestsRaw.filter(isTimeEntryCorrectionRequestItem);
  const pending = pendingRaw.filter(isTimeEntryCorrectionRequestItem);
  const approved = approvedRaw.filter(isTimeEntryCorrectionRequestItem);
  const rejected = rejectedRaw.filter(isTimeEntryCorrectionRequestItem);

  return {
    ok: true,
    requests,
    grouped: {
      pending,
      approved,
      rejected,
    },
  };
}

function formatDate(ymd: string, language: AppUiLanguage): string {
  const normalized = ymd.length >= 10 ? ymd.slice(0, 10) : ymd;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return ymd;

  const [y, m, d] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatDateTime(iso: string | null, language: AppUiLanguage): string {
  if (!iso) {
    return translate(language, "activeLabel", ADMIN_CORRECTION_REQUESTS_UI_TEXTS) === ""
      ? "—"
      : "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatDash(): string {
  return "—";
}

function rangeLabel(
  startDate: string,
  endDate: string,
  language: AppUiLanguage
): string {
  if (startDate === endDate) return formatDate(startDate, language);
  return `${formatDate(startDate, language)} – ${formatDate(endDate, language)}`;
}

function countDaysInclusive(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const start = new Date(Date.UTC(sy, (sm || 1) - 1, sd || 1));
  const end = new Date(Date.UTC(ey, (em || 1) - 1, ed || 1));

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / 86400000) + 1;
}

function statusLabel(status: RequestStatus, language: AppUiLanguage): string {
  if (status === "PENDING") {
    return translate(language, "open", ADMIN_CORRECTION_REQUESTS_UI_TEXTS);
  }

  if (status === "APPROVED") {
    return translate(language, "approved", ADMIN_CORRECTION_REQUESTS_UI_TEXTS);
  }

  return translate(language, "rejected", ADMIN_CORRECTION_REQUESTS_UI_TEXTS);
}

function statusClassName(status: RequestStatus): string {
  if (status === "PENDING") {
    return "admin-workflow-status-chip admin-workflow-status-chip-pending";
  }

  if (status === "APPROVED") {
    return "admin-workflow-status-chip admin-workflow-status-chip-approved";
  }

  return "admin-workflow-status-chip admin-workflow-status-chip-rejected";
}

function requestCardClassName(status: RequestStatus): string {
  if (status === "PENDING") {
    return "card admin-workflow-card admin-workflow-card-pending";
  }

  if (status === "APPROVED") {
    return "card admin-workflow-card admin-workflow-card-approved";
  }

  return "card admin-workflow-card admin-workflow-card-rejected";
}

function sectionTitle(label: string, count: number): string {
  return `${label} (${count})`;
}

function currentMonthValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function NachtragsanfragenPage() {
  const router = useRouter();
  const [items, setItems] = useState<TimeEntryCorrectionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue());
  const language: AppUiLanguage = session?.language ?? "DE";

  function t(key: keyof typeof ADMIN_CORRECTION_REQUESTS_UI_TEXTS): string {
    return translate(language, key, ADMIN_CORRECTION_REQUESTS_UI_TEXTS);
  }

  async function loadRequests() {
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (selectedMonth) {
        params.set("month", selectedMonth);
      }

      if (selectedUserId) {
        params.set("userId", selectedUserId);
      }

      const response = await fetch(`/api/admin/time-entry-correction-requests?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: unknown = await response.json().catch(() => ({}));
      const parsed = parseAdminCorrectionRequestsResponse(json);

      if (!response.ok || !parsed.ok) {
        setItems([]);
        setError(parsed.ok ? t("loadError") : parsed.error);
        window.dispatchEvent(new Event("admin-requests-changed"));
        return;
      }

      setItems(parsed.requests);
      window.dispatchEvent(new Event("admin-requests-changed"));
    } catch {
      setItems([]);
      setError(t("networkLoadError"));
      window.dispatchEvent(new Event("admin-requests-changed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json().catch(() => ({}));

        if (!alive) return;

        const parsed = parseMeSession(data);

        if (!parsed) {
          setSession(null);
          return;
        }

        if (parsed.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        setSession(parsed);
      } catch {
        if (!alive) return;
        router.replace("/login");
        return;
      } finally {
        if (alive) {
          setSessionChecked(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!session || session.role !== "ADMIN") return;
    void loadRequests();
  }, [selectedUserId, selectedMonth, sessionChecked, session?.role, session?.companyId]);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => ({}));

        if (!response.ok || !isRecord(json) || json["ok"] !== true) {
          if (active) setUsers([]);
          return;
        }

        const usersRaw = json["users"];
        if (!Array.isArray(usersRaw)) {
          if (active) setUsers([]);
          return;
        }

        const parsedUsers: UserOption[] = [];

        for (const entry of usersRaw) {
          if (!isRecord(entry)) continue;
          const id = getStringField(entry, "id");
          const fullName = getStringField(entry, "fullName");
          if (!id || !fullName) continue;
          parsedUsers.push({ id, fullName });
        }

        if (active) {
          setUsers(parsedUsers);
        }
      } catch {
        if (active) setUsers([]);
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  async function approveRequest(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/time-entry-correction-requests/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        credentials: "include",
      });

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("approveFailed");
        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("approveNetworkError"));
    } finally {
      setBusyId(null);
    }
  }

  async function rejectRequest(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/time-entry-correction-requests/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        credentials: "include",
      });

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("rejectFailed");
        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("rejectNetworkError"));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRequest(id: string) {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(t("deleteConfirm"))
        : false;

    if (!confirmed) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/time-entry-correction-requests/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("deleteFailed");
        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("deleteNetworkError"));
    } finally {
      setBusyId(null);
    }
  }

  const pendingItems = useMemo(
    () => items.filter((item) => item.status === "PENDING"),
    [items]
  );

  const approvedItems = useMemo(
    () => items.filter((item) => item.status === "APPROVED"),
    [items]
  );

  const rejectedItems = useMemo(
    () => items.filter((item) => item.status === "REJECTED"),
    [items]
  );

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserId) return t("allEmployees");
    return users.find((user) => user.id === selectedUserId)?.fullName ?? t("selectedEmployee");
  }, [users, selectedUserId, language]);

  function renderRequestCard(item: TimeEntryCorrectionRequestItem) {
    const isBusy = busyId === item.id;
    const days = countDaysInclusive(item.startDate, item.endDate);

    return (
      <div
        key={item.id}
        className={requestCardClassName(item.status)}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {item.user.fullName}
            </div>

            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
              🕘 {t("request")} · {rangeLabel(item.startDate, item.endDate, language)} · {days}{" "}
              {days === 1 ? t("day") : t("days")}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={statusClassName(item.status)}>
                {statusLabel(item.status, language)}
              </span>

              <span className="admin-workflow-meta-chip">
                {t("createdAt")} {formatDateTime(item.createdAt, language)}
              </span>

              {item.decidedAt ? (
                <span className="admin-workflow-meta-chip">
                  {t("decisionAt")} {formatDateTime(item.decidedAt, language)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div>
            <div className="label">{t("period")}</div>
            <div className="input admin-workflow-readonly-input">
              {rangeLabel(item.startDate, item.endDate, language)}
            </div>
          </div>

          <div>
            <div className="label">{t("employeeNote")}</div>
            <div
              className={`input admin-workflow-note-input${
                item.noteEmployee.trim() ? "" : " admin-workflow-note-input-empty"
              }`}
            >
              {item.noteEmployee.trim() || t("noNote")}
            </div>
          </div>

          <div>
            <div className="label">{t("adminNote")}</div>
            <div
              className={`input admin-workflow-note-input${
                item.noteAdmin.trim() ? "" : " admin-workflow-note-input-empty"
              }`}
            >
              {item.noteAdmin.trim() || t("noNote")}
            </div>
          </div>

          <div>
            <div className="label">{t("processedBy")}</div>
            <div className="input admin-workflow-readonly-input-muted">
              {item.decidedBy ? item.decidedBy.fullName : t("notDecidedYet")}
            </div>
          </div>
        </div>

        <div
          className="mobile-actions card-action-group"
          style={{
            marginTop: 14,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <button
            className="btn btn-danger"
            type="button"
            disabled={isBusy}
            onClick={() => {
              void deleteRequest(item.id);
            }}
            style={{
              flex: "1 1 200px",
              minWidth: 0,
            }}
          >
            {isBusy ? t("deleting") : t("delete")}
          </button>

          {item.status === "PENDING" ? (
            <>
              <button
                className="btn btn-danger"
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void rejectRequest(item.id);
                }}
                style={{
                  flex: "1 1 200px",
                  minWidth: 0,
                }}
              >
                {isBusy ? t("processing") : t("reject")}
              </button>

              <button
                className="btn btn-accent"
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void approveRequest(item.id);
                }}
                style={{
                  flex: "1 1 200px",
                  minWidth: 0,
                }}
              >
                {isBusy ? t("processing") : t("approve")}
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel={t("activeLabel")}>
        <div className="card admin-workflow-loading-card">
          <div className="admin-workflow-filter-text">{t("loadingInitial")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel={t("activeLabel")}>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">{t("pendingRequestsKpi")}</div>
            <div className="big">{pendingItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon">🕘</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("approvedKpi")}</div>
            <div className="big">{approvedItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon"><CircleCheckBig /></div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("rejectedKpi")}</div>
            <div className="big">{rejectedItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon"><CircleX /></div>
        </div>
      </div>

      <div className="card card-olive admin-workflow-filter-shell">
        <div className="section-title admin-workflow-filter-title">
          <span className="admin-workflow-filter-icon">🕘</span>
          {t("pageTitle")}
        </div>

        <div className="admin-workflow-filter-text">
          {t("pageDescription")}
        </div>

        <div className="admin-workflow-filter-grid">
          <div className="admin-workflow-filter-field">
            <div className="label">{t("employee")}</div>
            <select
              className="input admin-workflow-filter-input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">{t("allEmployees")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-workflow-filter-field">
            <div className="label">{t("month")}</div>
            <input
              className="input admin-workflow-filter-input"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="card admin-workflow-error-card">
            <span className="admin-workflow-error-text">{error}</span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="card admin-workflow-loading-card">
          {t("loadingInitial")}
        </div>
      ) : (
        <div className="admin-workflow-shell">
          <details open className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(t("open"), pendingItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {pendingItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyPending")}
                </div>
              ) : (
                pendingItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(`${t("approved")} – ${selectedUserLabel}`, approvedItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {approvedItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyApproved")}
                </div>
              ) : (
                approvedItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(`${t("rejected")} – ${selectedUserLabel}`, rejectedItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {rejectedItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyRejected")}
                </div>
              ) : (
                rejectedItems.map(renderRequestCard)
              )}
            </div>
          </details>
        </div>
      )}
    </AppShell>
  );
}