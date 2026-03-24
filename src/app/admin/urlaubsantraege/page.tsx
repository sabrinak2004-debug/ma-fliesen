"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
type AbsenceType = "VACATION" | "SICK";
type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";
type AbsenceCompensation = "PAID" | "UNPAID";

type AbsenceRequestItem = {
  id: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: RequestStatus;
  compensation: AbsenceCompensation;
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

type OverviewUserItem = {
  userId: string;
  fullName: string;
  remainingVacationDays: number;
};

type OverviewResponse =
  | {
      month: string;
      annualVacationDays: number;
      dailyTargetMinutes: number;
      workingDaysInMonth: number;
      holidayCountInMonth: number;
      isAdmin: boolean;
      byUser: OverviewUserItem[];
      totals: {
        remainingVacationDays: number;
      };
    }
  | {
      error: string;
    };

type AdminRequestsResponse = {
  ok: true;
  requests: AbsenceRequestItem[];
  grouped: {
    pending: AbsenceRequestItem[];
    approved: AbsenceRequestItem[];
    rejected: AbsenceRequestItem[];
  };
} | {
  ok: false;
  error: string;
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

function isAbsenceDayPortion(v: unknown): v is AbsenceDayPortion {
  return v === "FULL_DAY" || v === "HALF_DAY";
}

function isAbsenceCompensation(v: unknown): v is AbsenceCompensation {
  return v === "PAID" || v === "UNPAID";
}

function isAbsenceRequestItem(v: unknown): v is AbsenceRequestItem {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const startDate = getStringField(v, "startDate");
  const endDate = getStringField(v, "endDate");
  const type = v["type"];
  const dayPortion = v["dayPortion"];
  const status = v["status"];
  const compensation = v["compensation"];
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
  !isAbsenceDayPortion(dayPortion) ||
  !isAbsenceCompensation(compensation) ||
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

function getNumberField(obj: Record<string, unknown>, key: string): number | null {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isOverviewUserItem(v: unknown): v is OverviewUserItem {
  if (!isRecord(v)) return false;

  const userId = getStringField(v, "userId");
  const fullName = getStringField(v, "fullName");
  const remainingVacationDays = getNumberField(v, "remainingVacationDays");

  return !!userId && !!fullName && remainingVacationDays !== null;
}

function parseOverviewResponse(v: unknown): OverviewResponse {
  if (!isRecord(v)) {
    return { error: "Unerwartete Antwort." };
  }

  const error = getStringField(v, "error");
  if (error) {
    return { error };
  }

  const month = getStringField(v, "month");
  const annualVacationDays = getNumberField(v, "annualVacationDays");
  const dailyTargetMinutes = getNumberField(v, "dailyTargetMinutes");
  const workingDaysInMonth = getNumberField(v, "workingDaysInMonth");
  const holidayCountInMonth = getNumberField(v, "holidayCountInMonth");
  const isAdmin = v["isAdmin"];
  const byUserRaw = v["byUser"];
  const totalsRaw = v["totals"];

  if (
    !month ||
    annualVacationDays === null ||
    dailyTargetMinutes === null ||
    workingDaysInMonth === null ||
    holidayCountInMonth === null ||
    typeof isAdmin !== "boolean" ||
    !Array.isArray(byUserRaw) ||
    !isRecord(totalsRaw)
  ) {
    return { error: "Unerwartete Antwort." };
  }

  const totalsRemainingVacationDays = getNumberField(totalsRaw, "remainingVacationDays");
  if (totalsRemainingVacationDays === null) {
    return { error: "Unerwartete Antwort." };
  }

  const byUser = byUserRaw.filter(isOverviewUserItem);

  return {
    month,
    annualVacationDays,
    dailyTargetMinutes,
    workingDaysInMonth,
    holidayCountInMonth,
    isAdmin,
    byUser,
    totals: {
      remainingVacationDays: totalsRemainingVacationDays,
    },
  };
}

function formatVacationDays(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
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

function portionLabel(dayPortion: AbsenceDayPortion): string {
  return dayPortion === "HALF_DAY" ? "0,5 Tag" : "1 Tag";
}

function requestDurationLabel(item: AbsenceRequestItem): string {
  if (item.dayPortion === "HALF_DAY") {
    return `Halber Urlaubstag · ${formatDateDE(item.startDate)} · ${portionLabel(item.dayPortion)}`;
  }

  const days = countDaysInclusive(item.startDate, item.endDate);
  return `${rangeLabel(item.startDate, item.endDate)} · ${days} ${days === 1 ? "Tag" : "Tage"}`;
}

function compensationLabel(compensation: AbsenceCompensation): string {
  return compensation === "UNPAID" ? "Unbezahlt" : "Bezahlt";
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

function currentYearValue(): string {
  return String(new Date().getFullYear());
}

export default function UrlaubsantraegePage() {
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
  const [selectedRequestUserId, setSelectedRequestUserId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue());

  const [selectedResturlaubUserId, setSelectedResturlaubUserId] = useState<string>("");
  const [selectedResturlaubYear, setSelectedResturlaubYear] = useState<string>(currentYearValue());
  const resturlaubYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      String(currentYear + 1),
      String(currentYear),
      String(currentYear - 1),
      String(currentYear - 2),
      String(currentYear - 3),
    ];
  }, []);
  const [remainingVacationDays, setRemainingVacationDays] = useState<number>(0);
  const [resturlaubLoading, setResturlaubLoading] = useState<boolean>(true);
  const [resturlaubError, setResturlaubError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editType, setEditType] = useState<AbsenceType>("VACATION");
  const [editDayPortion, setEditDayPortion] = useState<AbsenceDayPortion>("FULL_DAY");
  const [editCompensation, setEditCompensation] = useState<AbsenceCompensation>("PAID");

  async function loadRequests() {
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("type", "VACATION");

      if (selectedMonth) {
        params.set("month", selectedMonth);
      }

      if (selectedRequestUserId) {
        params.set("userId", selectedRequestUserId);
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
        setError(parsed.ok ? "Urlaubsanträge konnten nicht geladen werden." : parsed.error);
        window.dispatchEvent(new Event("admin-requests-changed"));
        return;
      }

      setItems(parsed.requests);
      window.dispatchEvent(new Event("admin-requests-changed"));
    } catch {
      setItems([]);
      setError("Netzwerkfehler beim Laden der Urlaubsanträge.");
      window.dispatchEvent(new Event("admin-requests-changed"));
    } finally {
      setLoading(false);
    }
  }

async function loadRemainingVacationKpi() {
  if (!session || session.role !== "ADMIN") return;

  setResturlaubLoading(true);
  setResturlaubError(null);

  try {
    const params = new URLSearchParams();
    params.set("month", `${selectedResturlaubYear}-12`);

    const response = await fetch(`/api/overview?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const json: unknown = await response.json().catch(() => ({}));
    const parsed = parseOverviewResponse(json);

    if (!response.ok || "error" in parsed) {
      setRemainingVacationDays(0);
      setResturlaubError("Resturlaub konnte nicht geladen werden.");
      return;
    }

    if (selectedResturlaubUserId) {
      const selectedUser = parsed.byUser.find(
        (user) => user.userId === selectedResturlaubUserId
      );

      setRemainingVacationDays(selectedUser?.remainingVacationDays ?? 0);
      return;
    }

    setRemainingVacationDays(parsed.totals.remainingVacationDays);
  } catch {
    setRemainingVacationDays(0);
    setResturlaubError("Netzwerkfehler beim Laden des Resturlaubs.");
  } finally {
    setResturlaubLoading(false);
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
}, [selectedRequestUserId, selectedMonth, sessionChecked, session?.role, session?.companyId]);

useEffect(() => {
  if (!sessionChecked) return;
  if (!session || session.role !== "ADMIN") return;
  void loadRemainingVacationKpi();
}, [
  selectedResturlaubUserId,
  selectedResturlaubYear,
  sessionChecked,
  session?.role,
  session?.companyId,
]);

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
      const type = editingItemId === id ? editType : target.type;
      const dayPortion = editingItemId === id ? editDayPortion : target.dayPortion;
      const compensation = editingItemId === id ? editCompensation : target.compensation;

      const response = await fetch(`/api/admin/absence-requests/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        body: JSON.stringify({
          startDate,
          endDate,
          type,
          dayPortion,
          compensation,
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
        ? window.confirm("Möchtest du diesen Urlaubsantrag wirklich dauerhaft löschen?")
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
    setEditType(item.type);
    setEditDayPortion(item.dayPortion);
    setEditCompensation(item.compensation);
    setError(null);
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditStartDate("");
    setEditEndDate("");
    setEditType("VACATION");
    setEditDayPortion("FULL_DAY");
    setEditCompensation("PAID");
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
          dayPortion: target.dayPortion,
          compensation: target.compensation,
          newStartDate: editStartDate,
          newEndDate: editEndDate,
          newType: editType,
          newDayPortion: editDayPortion,
          newCompensation: editCompensation,
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
          type: editType,
          dayPortion: editDayPortion,
          compensation: editCompensation,
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

  const selectedRequestUserLabel = useMemo(() => {
    if (!selectedRequestUserId) return "Alle Mitarbeiter";
    return (
      users.find((user) => user.id === selectedRequestUserId)?.fullName ??
      "Ausgewählter Mitarbeiter"
    );
  }, [users, selectedRequestUserId]);

  const selectedResturlaubUserLabel = useMemo(() => {
    if (!selectedResturlaubUserId) return "Alle Mitarbeiter";
    return (
      users.find((user) => user.id === selectedResturlaubUserId)?.fullName ??
      "Ausgewählter Mitarbeiter"
    );
  }, [users, selectedResturlaubUserId]);

  function renderRequestCard(item: AbsenceRequestItem) {
    const isDeleting = busyAction?.id === item.id && busyAction.action === "delete";
    const isApproving = busyAction?.id === item.id && busyAction.action === "approve";
    const isRejecting = busyAction?.id === item.id && busyAction.action === "reject";
    const isSaving = busyAction?.id === item.id && busyAction.action === "save";
    const isBusy = busyAction?.id === item.id;
    const isEditing = editingItemId === item.id;
    const days = countDaysInclusive(item.startDate, item.endDate);
    const durationText =
      item.dayPortion === "HALF_DAY"
        ? `🌴 Urlaub · ${formatDateDE(item.startDate)} · 0,5 Tag · ${compensationLabel(item.compensation)}`
        : `🌴 Urlaub · ${rangeLabel(item.startDate, item.endDate)} · ${days} ${days === 1 ? "Tag" : "Tage"} · ${compensationLabel(item.compensation)}`;

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
              {durationText}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                {item.dayPortion === "HALF_DAY"
                  ? `${formatDateDE(item.startDate)} (halber Urlaubstag)`
                  : rangeLabel(item.startDate, item.endDate)}
              </div>
            )}
          </div>

          <div className="modal-grid-2">
            <div className="modal-field">
              <div className="label">Typ</div>
              {isEditing ? (
                <select
                  className="input"
                  value={editType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "VACATION" || value === "SICK") {
                      setEditType(value);
                      if (value === "SICK") {
                        setEditDayPortion("FULL_DAY");
                        setEditCompensation("PAID");
                      }
                    }
                  }}
                >
                  <option value="VACATION">Urlaub</option>
                  <option value="SICK">Krankheit</option>
                </select>
              ) : (
                <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                  {item.type === "VACATION" ? "Urlaub" : "Krankheit"}
                </div>
              )}
            </div>

            <div className="modal-field">
              <div className="label">Umfang</div>
              {isEditing ? (
                <select
                  className="input"
                  value={editDayPortion}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "FULL_DAY" || value === "HALF_DAY") {
                      setEditDayPortion(value);
                      if (value === "HALF_DAY") {
                        setEditEndDate(editStartDate);
                      }
                    }
                  }}
                  disabled={editType === "SICK"}
                >
                  <option value="FULL_DAY">Ganzer Tag</option>
                  <option value="HALF_DAY">Halber Tag</option>
                </select>
              ) : (
                <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                  {item.dayPortion === "HALF_DAY" ? "Halber Tag" : "Ganzer Tag"}
                </div>
              )}
            </div>
          </div>

          <div className="modal-grid-1">
            <div className="modal-field">
              <div className="label">Vergütung</div>
              {isEditing ? (
                <select
                  className="input"
                  value={editCompensation}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "PAID" || value === "UNPAID") {
                      setEditCompensation(value);
                    }
                  }}
                  disabled={editType === "SICK"}
                >
                  <option value="PAID">Bezahlt</option>
                  <option value="UNPAID">Unbezahlt</option>
                </select>
              ) : (
                <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                  {compensationLabel(item.compensation)}
                </div>
              )}
            </div>
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
          style={{
            marginTop: 14,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {isEditing ? (
            <>
              <button
                className="btn"
                type="button"
                disabled={isBusy}
                onClick={cancelEditing}
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
          <div style={{ color: "var(--muted)" }}>Lädt Urlaubsanträge...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div style={{ width: "100%" }}>
            <div className="small">Resturlaub</div>
            <div className="big">
              {resturlaubLoading ? "…" : formatVacationDays(remainingVacationDays)}
            </div>

            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              {selectedResturlaubUserLabel}
            </div>

            <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
              Stand für das ausgewählte Urlaubsjahr
            </div>

            <div
              style={{
                marginTop: 10,
                display: "grid",
                gap: 8,
              }}
            >
              <select
                className="input"
                value={selectedResturlaubUserId}
                onChange={(e) => setSelectedResturlaubUserId(e.target.value)}
                style={{
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  display: "block",
                  maxWidth: "100%",
                  borderRadius: 14,
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

              <select
                className="input"
                value={selectedResturlaubYear}
                onChange={(e) => setSelectedResturlaubYear(e.target.value)}
                style={{
                  width: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  display: "block",
                  maxWidth: "100%",
                  borderRadius: 14,
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              >
                {resturlaubYearOptions.map((year) => (
                  <option key={year} value={year}>
                    Urlaubsjahr {year}
                  </option>
                ))}
              </select>
            </div>

            {resturlaubError ? (
              <div style={{ marginTop: 8, color: "rgba(224, 75, 69, 0.95)", fontSize: 12 }}>
                {resturlaubError}
              </div>
            ) : null}
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22, alignSelf: "flex-start" }}>🏖️</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Offene Urlaubsanträge</div>
            <div className="big">{pendingItems.length}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌴</div>
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
          <span style={{ color: "var(--accent)" }}>🌴</span>
          Urlaubsanträge
        </div>

        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          Hier siehst du alle Urlaubsanträge deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.
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
              value={selectedRequestUserId}
              onChange={(e) => setSelectedRequestUserId(e.target.value)}
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
      </div>

      {loading ? (
        <div className="card" style={{ padding: 18 }}>
          Lädt Urlaubsanträge...
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
                  Keine offenen Urlaubsanträge für diesen Filter.
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
              {sectionTitle(`Genehmigt – ${selectedRequestUserLabel}`, approvedItems.length)}
            </summary>

            <div style={{ padding: "0 12px 12px 12px", display: "grid", gap: 12 }}>
              {approvedItems.length === 0 ? (
                <div className="card" style={{ padding: 14, opacity: 0.85 }}>
                  Keine genehmigten Urlaubsanträge für diesen Filter.
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
              {sectionTitle(`Abgelehnt – ${selectedRequestUserLabel}`, rejectedItems.length)}
            </summary>

            <div style={{ padding: "0 12px 12px 12px", display: "grid", gap: 12 }}>
              {rejectedItems.length === 0 ? (
                <div className="card" style={{ padding: 14, opacity: 0.85 }}>
                  Keine abgelehnten Urlaubsanträge für diesen Filter.
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