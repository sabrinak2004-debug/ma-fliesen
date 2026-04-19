"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import {
  translate,
  toHtmlLang,
  type AppUiLanguage,
  type AdminVacationRequestsTextKey,
  ADMIN_VACATION_REQUESTS_UI_TEXTS,
} from "@/lib/i18n";
import { Hourglass, CircleCheckBig, Ban, TreePalm, Wallet } from "lucide-react";

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
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
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
  accruedVacationDays: number;
  usedVacationDaysYtd: number;
  reservedPaidVacationDays: number;
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
        accruedVacationDays: number;
        usedVacationDaysYtd: number;
        reservedPaidVacationDays: number;
        remainingVacationDays: number;
      };
    }
  | {
      error: string;
    };

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
      v["language"] === "RO") &&
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
  const paidVacationUnits = v["paidVacationUnits"];
  const unpaidVacationUnits = v["unpaidVacationUnits"];
  const autoUnpaidBecauseNoBalance = v["autoUnpaidBecauseNoBalance"];
  const compensationLockedBySystem = v["compensationLockedBySystem"];
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
    typeof paidVacationUnits !== "number" ||
    !Number.isFinite(paidVacationUnits) ||
    typeof unpaidVacationUnits !== "number" ||
    !Number.isFinite(unpaidVacationUnits) ||
    typeof autoUnpaidBecauseNoBalance !== "boolean" ||
    typeof compensationLockedBySystem !== "boolean" ||
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
  const accruedVacationDays = getNumberField(v, "accruedVacationDays");
  const usedVacationDaysYtd = getNumberField(v, "usedVacationDaysYtd");
  const remainingVacationDays = getNumberField(v, "remainingVacationDays");
  const reservedPaidVacationDays = getNumberField(v, "reservedPaidVacationDays");

  return (
    !!userId &&
    !!fullName &&
    accruedVacationDays !== null &&
    usedVacationDaysYtd !== null &&
    reservedPaidVacationDays !== null &&
    remainingVacationDays !== null
  );
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

  const totalsAccruedVacationDays = getNumberField(totalsRaw, "accruedVacationDays");
  const totalsUsedVacationDaysYtd = getNumberField(totalsRaw, "usedVacationDaysYtd");
  const totalsRemainingVacationDays = getNumberField(totalsRaw, "remainingVacationDays");

  const totalsReservedPaidVacationDays = getNumberField(
    totalsRaw,
    "reservedPaidVacationDays"
  );

  if (
    totalsAccruedVacationDays === null ||
    totalsUsedVacationDaysYtd === null ||
    totalsReservedPaidVacationDays === null ||
    totalsRemainingVacationDays === null
  ) {
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
      accruedVacationDays: totalsAccruedVacationDays,
      usedVacationDaysYtd: totalsUsedVacationDaysYtd,
      reservedPaidVacationDays: totalsReservedPaidVacationDays,
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

function formatVacationSignedDays(value: number): string {
  if (value < 0) {
    return `−${formatVacationDays(Math.abs(value))}`;
  }

  return formatVacationDays(value);
}

function formatDateLocalized(ymd: string, language: AppUiLanguage): string {
  const normalized = ymd.length >= 10 ? ymd.slice(0, 10) : ymd;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return ymd;

  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));

  return new Intl.DateTimeFormat(toHtmlLang(language), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatDateTimeLocalized(
  iso: string | null,
  language: AppUiLanguage
): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(toHtmlLang(language), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function rangeLabel(
  startDate: string,
  endDate: string,
  language: AppUiLanguage
): string {
  if (startDate === endDate) return formatDateLocalized(startDate, language);
  return `${formatDateLocalized(startDate, language)} – ${formatDateLocalized(startDate === endDate ? startDate : endDate, language)}`;
}

function portionLabel(dayPortion: AbsenceDayPortion): string {
  return dayPortion === "HALF_DAY" ? "0,5 Tag" : "1 Tag";
}

function countWeekdaysInclusive(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const start = new Date(Date.UTC(sy, (sm || 1) - 1, sd || 1));
  const end = new Date(Date.UTC(ey, (em || 1) - 1, ed || 1));

  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getUTCDay();
    if (day >= 1 && day <= 5) {
      count += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

function getRequestedVacationDays(item: AbsenceRequestItem): number {
  if (item.dayPortion === "HALF_DAY") {
    return 0.5;
  }

  return countWeekdaysInclusive(item.startDate, item.endDate);
}

function localizedDayLabel(value: number, language: AppUiLanguage): string {
  return translate(
    language,
    Math.abs(value) === 1 ? "day" : "days",
    ADMIN_VACATION_REQUESTS_UI_TEXTS
  );
}

function localizedLowerCompensationLabel(
  compensation: AbsenceCompensation,
  language: AppUiLanguage
): string {
  const label = translate(
    language,
    compensation === "UNPAID" ? "unpaid" : "paid",
    ADMIN_VACATION_REQUESTS_UI_TEXTS
  );

  return label.toLocaleLowerCase(toHtmlLang(language));
}

function compensationSummaryLabel(
  item: AbsenceRequestItem,
  language: AppUiLanguage
): string {
  const paidDays = item.paidVacationUnits / 2;
  const unpaidDays = item.unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return `${formatVacationDays(paidDays)} ${localizedLowerCompensationLabel("PAID", language)} · ${formatVacationDays(unpaidDays)} ${localizedLowerCompensationLabel("UNPAID", language)}`;
  }

  if (paidDays > 0) {
    return translate(language, "paid", ADMIN_VACATION_REQUESTS_UI_TEXTS);
  }

  if (unpaidDays > 0) {
    return translate(language, "unpaid", ADMIN_VACATION_REQUESTS_UI_TEXTS);
  }

  return compensationLabel(item.compensation, language);
}

function mixedCompensationHint(
  item: AbsenceRequestItem,
  language: AppUiLanguage
): string | null {
  const paidDays = item.paidVacationUnits / 2;
  const unpaidDays = item.unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return `${translate(language, "ofWhich", ADMIN_VACATION_REQUESTS_UI_TEXTS)} ${formatVacationDays(paidDays)} ${localizedDayLabel(paidDays, language)} ${localizedLowerCompensationLabel("PAID", language)} ${translate(language, "and", ADMIN_VACATION_REQUESTS_UI_TEXTS)} ${formatVacationDays(unpaidDays)} ${localizedDayLabel(unpaidDays, language)} ${localizedLowerCompensationLabel("UNPAID", language)}.`;
  }

  return null;
}

function totalRequestedVacationDays(item: AbsenceRequestItem): number {
  return (item.paidVacationUnits + item.unpaidVacationUnits) / 2;
}

function compensationBreakdownLabel(
  item: AbsenceRequestItem,
  language: AppUiLanguage
): string | null {
  const paidDays = item.paidVacationUnits / 2;
  const unpaidDays = item.unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return `${formatVacationDays(paidDays)} ${localizedDayLabel(paidDays, language)} ${translate(language, "ofWhich", ADMIN_VACATION_REQUESTS_UI_TEXTS)} ${localizedLowerCompensationLabel("PAID", language)} · ${formatVacationDays(unpaidDays)} ${localizedDayLabel(unpaidDays, language)} ${translate(language, "ofWhich", ADMIN_VACATION_REQUESTS_UI_TEXTS)} ${localizedLowerCompensationLabel("UNPAID", language)}`;
  }

  if (paidDays > 0) {
    return `${formatVacationDays(paidDays)} ${localizedDayLabel(paidDays, language)} ${translate(language, "ofWhich", ADMIN_VACATION_REQUESTS_UI_TEXTS)} ${localizedLowerCompensationLabel("PAID", language)}`;
  }

  if (unpaidDays > 0) {
    return `${formatVacationDays(unpaidDays)} ${localizedDayLabel(unpaidDays, language)} ${translate(language, "ofWhich", ADMIN_VACATION_REQUESTS_UI_TEXTS)} ${localizedLowerCompensationLabel("UNPAID", language)}`;
  }

  return null;
}

function getEditedRequestedVacationUnits(
  startDate: string,
  endDate: string,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === "HALF_DAY") {
    return 1;
  }

  return countWeekdaysInclusive(startDate, endDate) * 2;
}

function requestDurationLabel(
  item: AbsenceRequestItem,
  language: AppUiLanguage
): string {
  if (item.dayPortion === "HALF_DAY") {
    return `${translate(language, "halfVacationDay", ADMIN_VACATION_REQUESTS_UI_TEXTS)} · ${formatDateLocalized(item.startDate, language)} · ${portionLabel(item.dayPortion)}`;
  }

  const days = countDaysInclusive(item.startDate, item.endDate);
  return `${rangeLabel(item.startDate, item.endDate, language)} · ${days} ${days === 1 ? translate(language, "day", ADMIN_VACATION_REQUESTS_UI_TEXTS) : translate(language, "days", ADMIN_VACATION_REQUESTS_UI_TEXTS)}`;
}

function compensationLabel(
  compensation: AbsenceCompensation,
  language: AppUiLanguage
): string {
  return translate(
    language,
    compensation === "UNPAID" ? "unpaid" : "paid",
    ADMIN_VACATION_REQUESTS_UI_TEXTS
  );
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
    return translate(language, "statusOpen", ADMIN_VACATION_REQUESTS_UI_TEXTS);
  }

  if (status === "APPROVED") {
    return translate(language, "statusApproved", ADMIN_VACATION_REQUESTS_UI_TEXTS);
  }

  return translate(language, "statusRejected", ADMIN_VACATION_REQUESTS_UI_TEXTS);
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

function currentYearValue(): string {
  return String(new Date().getFullYear());
}

function currentMonthOnlyValue(): string {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

function formatMonthLabel(ym: string, language: AppUiLanguage): string {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;

  const [year, month] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, 1));

  return new Intl.DateTimeFormat(toHtmlLang(language), {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
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
  const [selectedResturlaubMonth, setSelectedResturlaubMonth] = useState<string>(currentMonthOnlyValue());
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
  const [accruedVacationDays, setAccruedVacationDays] = useState<number>(0);
  const [usedVacationDaysYtd, setUsedVacationDaysYtd] = useState<number>(0);
  const [reservedPaidVacationDays, setReservedPaidVacationDays] = useState<number>(0);
  const [resturlaubLoading, setResturlaubLoading] = useState<boolean>(true);
  const [resturlaubError, setResturlaubError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editType, setEditType] = useState<AbsenceType>("VACATION");
  const [editDayPortion, setEditDayPortion] = useState<AbsenceDayPortion>("FULL_DAY");
  const [editCompensation, setEditCompensation] = useState<AbsenceCompensation>("PAID");
  const language: AppUiLanguage = session?.language ?? "DE";

  const t = (key: AdminVacationRequestsTextKey): string =>
    translate(language, key, ADMIN_VACATION_REQUESTS_UI_TEXTS);

  const resturlaubMonthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const value = String(index + 1).padStart(2, "0");
      const date = new Date(Date.UTC(2026, index, 1));

      return {
        value,
        label: new Intl.DateTimeFormat(toHtmlLang(language), {
          month: "long",
          timeZone: "Europe/Berlin",
        }).format(date),
      };
    });
  }, [language]);

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

  async function loadRemainingVacationKpi() {
    if (!session || session.role !== "ADMIN") return;

    setResturlaubLoading(true);
    setResturlaubError(null);

    try {
      const params = new URLSearchParams();
      params.set("month", `${selectedResturlaubYear}-${selectedResturlaubMonth}`);

      const response = await fetch(`/api/overview?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: unknown = await response.json().catch(() => ({}));
      const parsed = parseOverviewResponse(json);

      if (!response.ok || "error" in parsed) {
        setRemainingVacationDays(0);
        setResturlaubError(t("remainingLoadError"));
        return;
      }

      if (selectedResturlaubUserId) {
        const selectedUser = parsed.byUser.find(
          (user) => user.userId === selectedResturlaubUserId
        );

        setAccruedVacationDays(selectedUser?.accruedVacationDays ?? 0);
        setUsedVacationDaysYtd(selectedUser?.usedVacationDaysYtd ?? 0);
        setReservedPaidVacationDays(selectedUser?.reservedPaidVacationDays ?? 0);
        setRemainingVacationDays(selectedUser?.remainingVacationDays ?? 0);
        return;
      }

      setAccruedVacationDays(parsed.totals.accruedVacationDays);
      setUsedVacationDaysYtd(parsed.totals.usedVacationDaysYtd);
      setReservedPaidVacationDays(parsed.totals.reservedPaidVacationDays);
      setRemainingVacationDays(parsed.totals.remainingVacationDays);
    } catch {
      setAccruedVacationDays(0);
      setUsedVacationDaysYtd(0);
      setReservedPaidVacationDays(0);
      setRemainingVacationDays(0);
      setResturlaubError(t("remainingNetworkError"));
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
  selectedResturlaubMonth,
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
      setResturlaubError(t("remainingNetworkError"));
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
            : t("approveFailed");
        setError(message);
        return;
      }

      cancelEditing();
      await loadRequests();
    } catch {
      setError(t("approveNetworkError"));
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
            : t("rejectFailed");
        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("rejectNetworkError"));
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteRequest(id: string) {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(t("deleteConfirm"))
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
            : t("deleteFailed");
        setError(message);
        return;
      }

      if (editingItemId === id) {
        cancelEditing();
      }

      await loadRequests();
    } catch {
      setError(t("deleteNetworkError"));
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
      setResturlaubError(t("remainingNetworkError"));
        return;
      }

      const nextRequestedVacationUnits =
        editType === "VACATION"
          ? getEditedRequestedVacationUnits(editStartDate, editEndDate, editDayPortion)
          : 0;

      const nextPaidVacationUnits =
        editType === "VACATION"
          ? editCompensation === "PAID"
            ? nextRequestedVacationUnits
            : 0
          : 0;

      const nextUnpaidVacationUnits =
        editType === "VACATION"
          ? editCompensation === "UNPAID"
            ? nextRequestedVacationUnits
            : 0
          : 0;

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
          oldPaidVacationUnits: target.paidVacationUnits,
          oldUnpaidVacationUnits: target.unpaidVacationUnits,
          newStartDate: editStartDate,
          newEndDate: editEndDate,
          newType: editType,
          newDayPortion: editDayPortion,
          newCompensation: editCompensation,
          newPaidVacationUnits: nextPaidVacationUnits,
          newUnpaidVacationUnits: nextUnpaidVacationUnits,          
          userId: target.user.id,
        }),
      });

      const patchJson: unknown = await patchResponse.json().catch(() => ({}));

      if (!patchResponse.ok) {
        const message =
          isRecord(patchJson) && typeof patchJson["error"] === "string"
            ? patchJson["error"]
            : t("changeFailed");
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
          paidVacationUnits: nextPaidVacationUnits,
          unpaidVacationUnits: nextUnpaidVacationUnits,          
        }),
      });

      const requestUpdateJson: unknown = await requestUpdateResponse.json().catch(() => ({}));

      if (!requestUpdateResponse.ok) {
        const message =
          isRecord(requestUpdateJson) && typeof requestUpdateJson["error"] === "string"
            ? requestUpdateJson["error"]
            : t("updateFailed");
        setError(message);
        return;
      }

      cancelEditing();
      await loadRequests();
    } catch {
      setError(t("changeNetworkError"));
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
    if (!selectedRequestUserId) return t("allEmployees");
    return (
      users.find((user) => user.id === selectedRequestUserId)?.fullName ??
      t("selectedEmployee")
    );
  }, [users, selectedRequestUserId, language]);

  const selectedResturlaubUserLabel = useMemo(() => {
    if (!selectedResturlaubUserId) return t("allEmployees");
    return (
      users.find((user) => user.id === selectedResturlaubUserId)?.fullName ??
      t("selectedEmployee")
    );
  }, [users, selectedResturlaubUserId, language]);

  const showFilteredEmployeeResturlaub = selectedResturlaubUserId !== "";

  function renderRequestCard(item: AbsenceRequestItem) {
    const isDeleting = busyAction?.id === item.id && busyAction.action === "delete";
    const isApproving = busyAction?.id === item.id && busyAction.action === "approve";
    const isRejecting = busyAction?.id === item.id && busyAction.action === "reject";
    const isSaving = busyAction?.id === item.id && busyAction.action === "save";
    const isBusy = busyAction?.id === item.id;
    const isEditing = editingItemId === item.id;
    const isMixedCompensation =
      item.paidVacationUnits > 0 && item.unpaidVacationUnits > 0;
    const requestedDays = totalRequestedVacationDays(item);
    const durationText =
      item.dayPortion === "HALF_DAY"
        ? `🌴 ${t("typeVacation")} · ${formatDateLocalized(item.startDate, language)} · 0,5 ${t("day")}`
        : `🌴 ${t("typeVacation")} · ${rangeLabel(item.startDate, item.endDate, language)} · ${formatVacationDays(requestedDays)} ${requestedDays === 1 ? t("day") : t("days")}`;

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
              {durationText}
            </div>

            {item.type === "VACATION" ? (
              <div className="admin-workflow-breakdown-text">
                {compensationBreakdownLabel(item, language) ??
                  compensationSummaryLabel(item, language)}
              </div>
            ) : null}

            {item.type === "VACATION" && item.autoUnpaidBecauseNoBalance ? (
              <div className="admin-workflow-mixed-hint">
                {mixedCompensationHint(item, language)
                  ? `${t("mixedCompensationPrefix")} ${mixedCompensationHint(item, language)}`
                  : t("insufficientPaidVacationHint")}
              </div>
            ) : null}

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={statusClassName(item.status)}>
                {statusLabel(item.status, language)}
              </span>

              <span className="admin-workflow-meta-chip">
                {t("createdAt")} {formatDateTimeLocalized(item.createdAt, language)}
              </span>

              {item.decidedAt ? (
                <span className="admin-workflow-meta-chip">
                  {t("decisionAt")} {formatDateTimeLocalized(item.decidedAt, language)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div>
            <div className="label">{t("period")}</div>

            {isEditing ? (
              <div className="modal-grid-2">
                <div className="modal-field">
                  <div className="label admin-workflow-sub-label">{t("start")}</div>
                  <input
                    className="input modal-date-input"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>

                <div className="modal-field">
                  <div className="label admin-workflow-sub-label">{t("end")}</div>
                  <input
                    className="input modal-date-input"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="input admin-workflow-readonly-input">
                {item.dayPortion === "HALF_DAY"
                  ? `${formatDateLocalized(item.startDate, language)} (${t("halfVacationDay")})`
                  : rangeLabel(item.startDate, item.endDate, language)}
              </div>
            )}
          </div>

          <div className="modal-grid-2">
            <div className="modal-field">
              <div className="label">{t("type")}</div>
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
                  <option value="VACATION">{t("typeVacation")}</option>
                  <option value="SICK">{t("typeSick")}</option>
                </select>
              ) : (
                <div className="input admin-workflow-readonly-input">
                  {item.type === "VACATION" ? t("typeVacation") : t("typeSick")}
                </div>
              )}
            </div>

            <div className="modal-field">
              <div className="label">{t("scope")}</div>
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
                  <option value="FULL_DAY">{t("fullDay")}</option>
                  <option value="HALF_DAY">{t("halfDay")}</option>
                </select>
              ) : (
                <div className="input admin-workflow-readonly-input">
                  {item.dayPortion === "HALF_DAY" ? t("halfDay") : t("fullDay")}
                </div>
              )}
            </div>
          </div>

          <div className="modal-grid-1">
            <div className="modal-field">
              <div className="label">{t("compensation")}</div>
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
                  <option value="PAID">{t("paid")}</option>
                  <option value="UNPAID">{t("unpaid")}</option>
                </select>
              ) : (
                <div className="input">
                  <div>
                    {formatVacationDays(totalRequestedVacationDays(item))} {totalRequestedVacationDays(item) === 1 ? t("day") : t("days")} {t("total")}
                  </div>

                  {compensationBreakdownLabel(item, language) ? (
                    <div className="admin-workflow-breakdown-text">
                      {compensationBreakdownLabel(item, language)}
                    </div>
                  ) : null}
                </div>
              )}
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
                {t("cancel")}
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
                {isDeleting ? t("deleting") : t("delete")}
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
                    {isRejecting ? t("processing") : t("reject")}
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
                    {isApproving ? t("processing") : t("approveCorrected")}
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
                  {isSaving ? t("saving") : t("saveChanges")}
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
                  {t("edit")}
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
                {isDeleting ? t("deleting") : t("delete")}
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
                    {isRejecting ? t("processing") : t("reject")}
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
                    {isApproving ? t("processing") : t("approve")}
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
          <div style={{ width: "100%" }}>
            <div className="small">{t("remainingVacation")}</div>
            <div className="big">
              {resturlaubLoading
                ? "…"
                : showFilteredEmployeeResturlaub
                  ? formatVacationSignedDays(remainingVacationDays)
                  : formatVacationDays(remainingVacationDays)}
            </div>

            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              {selectedResturlaubUserLabel}
            </div>

            <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
              {resturlaubLoading
                ? t("loadingVacationAccount")
                : showFilteredEmployeeResturlaub
                  ? `${formatVacationDays(reservedPaidVacationDays)} ${t("approvedPaidOfAccrued")} ${formatVacationDays(accruedVacationDays)} ${t("days")} ${t("paid")}`
                  : `${formatVacationDays(usedVacationDaysYtd)} ${t("usedOfAccrued")} ${formatVacationDays(accruedVacationDays)} ${t("days")}`}
            </div>
            {showFilteredEmployeeResturlaub ? (
              <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                {t("alreadyTaken")} {formatVacationDays(usedVacationDaysYtd)} {t("days")}
              </div>
            ) : null}

            <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
              {t("asOf")} {formatMonthLabel(`${selectedResturlaubYear}-${selectedResturlaubMonth}`, language)}
            </div>

            <div
              style={{
                marginTop: 10,
                display: "grid",
                gap: 8,
              }}
            >
              <select
                className="input admin-workflow-filter-input"
                value={selectedResturlaubUserId}
                onChange={(e) => setSelectedResturlaubUserId(e.target.value)}
              >
                <option value="">{t("allEmployees")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>

              <select
                className="input admin-workflow-filter-input"
                value={selectedResturlaubYear}
                onChange={(e) => setSelectedResturlaubYear(e.target.value)}
              >
                {resturlaubYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {t("vacationYear")} {year}
                  </option>
                ))}
              </select>

              <select
                className="input admin-workflow-filter-input"
                value={selectedResturlaubMonth}
                onChange={(e) => setSelectedResturlaubMonth(e.target.value)}
              >
                {resturlaubMonthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {t("asOfMonth")} {month.label}
                  </option>
                ))}
              </select>
            </div>

            {resturlaubError ? (
              <div className="admin-workflow-error-text" style={{ marginTop: 8, fontSize: 12 }}>
                {resturlaubError}
              </div>
            ) : null}
          </div>

          <div className="admin-workflow-kpi-icon"><TreePalm /><Wallet /></div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("pendingRequestsKpi")}</div>
            <div className="big">{pendingItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon"><Hourglass /></div>
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
          <div className="admin-workflow-kpi-icon"><Ban /></div>
        </div>
      </div>

      <div className="card card-olive admin-workflow-filter-shell">
        <div className="section-title admin-workflow-filter-title">
          <span className="admin-workflow-filter-icon"><TreePalm /></span>
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
              value={selectedRequestUserId}
              onChange={(e) => setSelectedRequestUserId(e.target.value)}
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
              {sectionTitle(t("openSection"), pendingItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {pendingItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyOpen")}
                </div>
              ) : (
                pendingItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(`${t("approvedSection")} – ${selectedRequestUserLabel}`, approvedItems.length)}
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
              {sectionTitle(`${t("rejectedSection")} – ${selectedRequestUserLabel}`, rejectedItems.length)}
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