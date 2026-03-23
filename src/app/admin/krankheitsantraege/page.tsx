"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type AbsenceType = "VACATION" | "SICK";

type AbsenceRequestItem = {
  id: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  status: RequestStatus;
  noteEmployee: string;
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

type AdminRequestsResponse =
  | {
      ok: true;
      requests: AbsenceRequestItem[];
      grouped: {
        pending: AbsenceRequestItem[];
        approved: AbsenceRequestItem[];
        rejected: AbsenceRequestItem[];
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

function isAbsenceType(v: unknown): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function isAbsenceRequestItem(v: unknown): v is AbsenceRequestItem {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const startDate = getStringField(v, "startDate");
  const endDate = getStringField(v, "endDate");
  const type = v["type"];
  const status = v["status"];
  const noteEmployee = getStringField(v, "noteEmployee");
  const createdAt = getStringField(v, "createdAt");
  const updatedAt = getStringField(v, "updatedAt");
  const decidedAtRaw = v["decidedAt"];
  const userRaw = v["user"];
  const decidedByRaw = v["decidedBy"];

  if (
    !id ||
    !startDate ||
    !endDate ||
    !isAbsenceType(type) ||
    !isRequestStatus(status) ||
    noteEmployee === null ||
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

  let decidedBy: AbsenceRequestItem["decidedBy"] = null;
  if (decidedByRaw !== null) {
    if (!isRecord(decidedByRaw)) return false;
    const decidedById = getStringField(decidedByRaw, "id");
    const decidedByFullName = getStringField(decidedByRaw, "fullName");
    if (!decidedById || !decidedByFullName) return false;
    decidedBy = { id: decidedById, fullName: decidedByFullName };
  }

  return true;
}

function parseAdminRequestsResponse(v: unknown): AdminRequestsResponse {
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

  const requests = requestsRaw.filter(isAbsenceRequestItem);
  const pending = pendingRaw.filter(isAbsenceRequestItem);
  const approved = approvedRaw.filter(isAbsenceRequestItem);
  const rejected = rejectedRaw.filter(isAbsenceRequestItem);

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

function formatDateDE(ymd: string): string {
  const normalized = ymd.length >= 10 ? ymd.slice(0, 10) : ymd;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return ymd;

  const [y, m, d] = normalized.split("-");
  return `${d}.${m}.${y}`;
}

function formatDateTimeDE(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

function rangeLabel(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDateDE(startDate);
  return `${formatDateDE(startDate)} – ${formatDateDE(endDate)}`;
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

function statusLabel(status: RequestStatus): string {
  if (status === "PENDING") return "Offen";
  if (status === "APPROVED") return "Genehmigt";
  return "Abgelehnt";
}

function statusStyle(status: RequestStatus): React.CSSProperties {
  if (status === "PENDING") {
    return {
      background: "rgba(255, 196, 0, 0.12)",
      border: "1px solid rgba(255, 196, 0, 0.28)",
      color: "rgba(255, 220, 120, 0.98)",
    };
  }

  if (status === "APPROVED") {
    return {
      background: "rgba(184, 207, 58, 0.12)",
      border: "1px solid rgba(184, 207, 58, 0.28)",
      color: "rgba(210, 230, 120, 0.98)",
    };
  }

  return {
    background: "rgba(224, 75, 69, 0.12)",
    border: "1px solid rgba(224, 75, 69, 0.28)",
    color: "rgba(255, 150, 145, 0.98)",
  };
}

function cardBorder(status: RequestStatus): string {
  if (status === "PENDING") return "rgba(255, 196, 0, 0.24)";
  if (status === "APPROVED") return "rgba(184, 207, 58, 0.24)";
  return "rgba(224, 75, 69, 0.24)";
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

export default function KrankheitsantraegePage() {
  const router = useRouter();
  const [items, setItems] = useState<AbsenceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<{
    id: string;
    action: "delete" | "approve" | "reject" | "save";
  } | null>(null);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");

  async function loadRequests() {
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("type", "SICK");

      if (selectedMonth) {
        params.set("month", selectedMonth);
      }

      if (selectedUserId) {
        params.set("userId", selectedUserId);
      }

      const response = await fetch(`/api/admin/absence-requests?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: unknown = await response.json().catch(() => ({}));
      const parsed = parseAdminRequestsResponse(json);

      if (!response.ok || !parsed.ok) {
        setItems([]);
        setError(parsed.ok ? "Krankheitsanträge konnten nicht geladen werden." : parsed.error);
        window.dispatchEvent(new Event("admin-requests-changed"));
        return;
      }

      setItems(parsed.requests);
    } catch {
      setItems([]);
      setError("Netzwerkfehler beim Laden der Krankheitsanträge.");
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
    setBusyAction({ id, action: "approve" });
    setError(null);

    try {
      const target = items.find((item) => item.id === id);
      if (!target) {
        setError("Antrag nicht gefunden.");
        return;
      }

      const startDate = editingItemId === id ? editStartDate : target.startDate;
      const endDate = editingItemId === id ? editEndDate : target.endDate;

      const response = await fetch(`/api/admin/absence-requests/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          type: "SICK",
          dayPortion: "FULL_DAY",
          compensation: "PAID",
        }),
      });

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : "Genehmigung fehlgeschlagen.";
        setError(message);
        return;
      }

      cancelEditing();
      await loadRequests();
    } catch {
      setError("Netzwerkfehler bei der Genehmigung.");
    } finally {
      setBusyAction(null);
    }
  }

  async function rejectRequest(id: string) {
    setBusyAction({ id, action: "reject" });
    setError(null);

    try {
      const response = await fetch(`/api/admin/absence-requests/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        credentials: "include",
      });

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : "Ablehnung fehlgeschlagen.";
        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError("Netzwerkfehler bei der Ablehnung.");
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteRequest(id: string) {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm("Möchtest du diesen Krankheitsantrag wirklich dauerhaft löschen?")
        : false;

    if (!confirmed) return;

    setBusyAction({ id, action: "delete" });
    setError(null);

    try {
      const response = await fetch(`/api/admin/absence-requests/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : "Löschen fehlgeschlagen.";
        setError(message);
        return;
      }

      if (editingItemId === id) {
        cancelEditing();
      }

      await loadRequests();

    } catch {
      setError("Netzwerkfehler beim Löschen.");
    } finally {
      setBusyAction(null);
    }
  }

  function startEditing(item: AbsenceRequestItem) {
  setEditingItemId(item.id);
  setEditStartDate(item.startDate);
  setEditEndDate(item.endDate);
  setError(null);
}

function cancelEditing() {
  setEditingItemId(null);
  setEditStartDate("");
  setEditEndDate("");
}

async function saveApprovedChange(id: string) {
  setBusyAction({ id, action: "save" });
  setError(null);

  try {
    const target = items.find((item) => item.id === id);
    if (!target) {
      setError("Antrag nicht gefunden.");
      return;
    }

    const patchResponse = await fetch("/api/absences", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: target.startDate,
        to: target.endDate,
        type: target.type,
        dayPortion: "FULL_DAY",
        compensation: "PAID",
        newStartDate: editStartDate,
        newEndDate: editEndDate,
        newType: "SICK",
        newDayPortion: "FULL_DAY",
        newCompensation: "PAID",
        userId: target.user.id,
      }),
    });

    const patchJson: unknown = await patchResponse.json().catch(() => ({}));

    if (!patchResponse.ok) {
      const message =
        isRecord(patchJson) && typeof patchJson["error"] === "string"
          ? patchJson["error"]
          : "Änderung fehlgeschlagen.";
      setError(message);
      return;
    }

    const requestUpdateResponse = await fetch(`/api/admin/absence-requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: editStartDate,
        endDate: editEndDate,
        type: "SICK",
        dayPortion: "FULL_DAY",
        compensation: "PAID",
      }),
    });

    const requestUpdateJson: unknown = await requestUpdateResponse.json().catch(() => ({}));

    if (!requestUpdateResponse.ok) {
      const message =
        isRecord(requestUpdateJson) && typeof requestUpdateJson["error"] === "string"
          ? requestUpdateJson["error"]
          : "Antragsdaten konnten nicht aktualisiert werden.";
      setError(message);
      return;
    }

    cancelEditing();
    await loadRequests();
  } catch {
    setError("Netzwerkfehler bei der Änderung.");
  } finally {
    setBusyAction(null);
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
    if (!selectedUserId) return "Alle Mitarbeiter";
    return users.find((user) => user.id === selectedUserId)?.fullName ?? "Ausgewählter Mitarbeiter";
  }, [users, selectedUserId]);

  function renderRequestCard(item: AbsenceRequestItem) {
    const isDeleting = busyAction?.id === item.id && busyAction.action === "delete";
    const isApproving = busyAction?.id === item.id && busyAction.action === "approve";
    const isRejecting = busyAction?.id === item.id && busyAction.action === "reject";
    const isSaving = busyAction?.id === item.id && busyAction.action === "save";
    const isBusy = busyAction?.id === item.id;
    const isEditing = editingItemId === item.id;
    const days = countDaysInclusive(item.startDate, item.endDate);

    return (
      <div
        key={item.id}
        className="card"
        style={{
          padding: 16,
          borderColor: cardBorder(item.status),
          background: "rgba(0,0,0,0.20)",
        }}
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
              🤒 Krank · {rangeLabel(item.startDate, item.endDate)} · {days} {days === 1 ? "Tag" : "Tage"}
            </div>

            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...statusStyle(item.status),
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {statusLabel(item.status)}
              </span>

              <span
                style={{
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--muted)",
                }}
              >
                Erstellt: {formatDateTimeDE(item.createdAt)}
              </span>

              {item.decidedAt ? (
                <span
                  style={{
                    borderRadius: 999,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--muted)",
                  }}
                >
                  Entscheidung: {formatDateTimeDE(item.decidedAt)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div>
            <div className="label">Zeitraum</div>

            {isEditing ? (
              <div className="modal-grid-2">
                <div className="modal-field">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>Start</div>
                  <input
                    className="input modal-date-input"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className="modal-field">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>Ende</div>
                  <input
                    className="input modal-date-input"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                {rangeLabel(item.startDate, item.endDate)}
              </div>
            )}
          </div>

          <div>
            <div className="label">Mitarbeiter-Notiz</div>
            <div
              className="input"
              style={{
                minHeight: 90,
                display: "block",
                paddingTop: 12,
                whiteSpace: "pre-wrap",
                lineHeight: 1.45,
                opacity: item.noteEmployee.trim() ? 1 : 0.7,
              }}
            >
              {item.noteEmployee.trim() || "Keine Notiz vorhanden."}
            </div>
          </div>

          <div>
            <div className="label">Bearbeitet von</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {item.decidedBy ? item.decidedBy.fullName : "Noch nicht entschieden"}
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
          {isEditing ? (
            <>
              <button
                className="btn"
                type="button"
                disabled={isBusy}
                onClick={cancelEditing}
                style={{
                  flex: "1 1 200px",
                  minWidth: 0,
                }}
              >
                Abbrechen
              </button>

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
                {isDeleting ? "Löscht..." : "Löschen"}
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
                    {isRejecting ? "Verarbeitet..." : "Ablehnen"}
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
                    {isApproving ? "Verarbeitet..." : "Korrigieren & genehmigen"}
                  </button>
                </>
              ) : item.status === "APPROVED" ? (
                <button
                  className="btn btn-accent"
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    void saveApprovedChange(item.id);
                  }}
                  style={{
                    flex: "1 1 200px",
                    minWidth: 0,
                  }}
                >
                  {isSaving ? "Speichert..." : "Änderungen speichern"}
                </button>
              ) : null}
            </>
          ) : (
            <>
              {item.status !== "REJECTED" ? (
                <button
                  className="btn"
                  type="button"
                  disabled={isBusy}
                  onClick={() => startEditing(item)}
                  style={{
                    flex: "1 1 200px",
                    minWidth: 0,
                  }}
                >
                  Bearbeiten
                </button>
              ) : null}

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
                {isDeleting ? "Löscht..." : "Löschen"}
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
                    {isRejecting ? "Verarbeitet..." : "Ablehnen"}
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
                    {isApproving ? "Verarbeitet..." : "Genehmigen"}
                  </button>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel="#wirkönnendas">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ color: "var(--muted)" }}>Lädt Krankheitsanträge...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">Offene Krankheitsanträge</div>
            <div className="big">{pendingItems.length}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🤒</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Genehmigt</div>
            <div className="big">{approvedItems.length}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>✅</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Abgelehnt</div>
            <div className="big">{rejectedItems.length}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>⛔</div>
        </div>
      </div>

      <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div
          className="section-title"
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}
        >
          <span style={{ color: "var(--accent)" }}>🤒</span>
          Krankheitsanträge
        </div>

        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          Hier siehst du alle Krankheitsanträge deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.
        </div>
        <div
          className="mobile-2col"
          style={{
            marginTop: 16,
          }}
        >
          <div style={{ minWidth: 0, width: "100%" }}>
            <div className="label">Mitarbeiter</div>
            <select
              className="input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                display: "block",
                maxWidth: "100%",
                borderRadius: 18,
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              <option value="">Alle Mitarbeiter</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 0, width: "100%", overflow: "hidden" }}>
            <div className="label">Monat</div>
            <input
              className="input"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                display: "block",
                maxWidth: "100%",
                borderRadius: 18,
                appearance: "none",
                WebkitAppearance: "none",
                overflow: "hidden",
              }}
            />
          </div>
        </div>
      </div>


        {error ? (
          <div
            className="card"
            style={{
              padding: 12,
              marginTop: 14,
              borderColor: "rgba(224, 75, 69, 0.35)",
            }}
          >
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        ) : null}
    


      {loading ? (
        <div className="card" style={{ padding: 18 }}>
          Lädt Krankheitsanträge...
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <details
            open
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.16)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                listStyle: "none",
                padding: "14px 16px",
                fontWeight: 900,
                userSelect: "none",
              }}
            >
              {sectionTitle("Offen", pendingItems.length)}
            </summary>

            <div style={{ padding: "0 12px 12px 12px", display: "grid", gap: 12 }}>
              {pendingItems.length === 0 ? (
                <div className="card" style={{ padding: 14, opacity: 0.85 }}>
                  Keine offenen Krankheitsanträge.
                </div>
              ) : (
                pendingItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.16)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                listStyle: "none",
                padding: "14px 16px",
                fontWeight: 900,
                userSelect: "none",
              }}
            >
              {sectionTitle(`Genehmigt – ${selectedUserLabel}`, approvedItems.length)}
            </summary>

            <div style={{ padding: "0 12px 12px 12px", display: "grid", gap: 12 }}>
              {approvedItems.length === 0 ? (
                <div className="card" style={{ padding: 14, opacity: 0.85 }}>
                  Keine genehmigten Krankheitsanträge.
                </div>
              ) : (
                approvedItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.16)",
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                listStyle: "none",
                padding: "14px 16px",
                fontWeight: 900,
                userSelect: "none",
              }}
            >
              {sectionTitle(`Abgelehnt – ${selectedUserLabel}`, rejectedItems.length)}
            </summary>

            <div style={{ padding: "0 12px 12px 12px", display: "grid", gap: 12 }}>
              {rejectedItems.length === 0 ? (
                <div className="card" style={{ padding: 14, opacity: 0.85 }}>
                  Keine abgelehnten Krankheitsanträge.
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
