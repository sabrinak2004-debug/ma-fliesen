"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { Info, Stethoscope } from "lucide-react";
import { TreePalm } from "lucide-react";
import {
  ADMIN_DASHBOARD_UI_TEXTS,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";
import { Download, ClipboardList, ClockAlert, TriangleAlert, UserRoundCheck, CalendarX2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrashCan, faInfo, faPenToSquare, faHammer } from "@fortawesome/free-solid-svg-icons";
import UnpaidIcon from "@/components/icons/UnpaidIcon";

/* =========================
   Types (Dashboard Timeline)
   ========================= */

type AdminTimelineWork = {
  type: "WORK";
  id: string;
  date: string; // YYYY-MM-DD
  startHHMM: string; // HH:MM
  endHHMM: string; // HH:MM
  activity: string | null;
  location: string | null;
  travelMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  workMinutes: number;
  noteEmployee: string | null;
};

type AdminTimelineAbsence = {
  type: "VACATION" | "SICK";
  date: string; // YYYY-MM-DD
  dayPortion: "FULL_DAY" | "HALF_DAY";
  compensation: "PAID" | "UNPAID";
};

type AdminTimelineItem = AdminTimelineWork | AdminTimelineAbsence;

type AdminDayBreak = {
  workDate: string;
  breakStartHHMM: string | null;
  breakEndHHMM: string | null;
  manualMinutes: number;
  legalMinutes: number;
  autoSupplementMinutes: number;
  effectiveMinutes: number;
};

type AdminEmployeeTimeline = {
  userId: string;
  fullName: string;
  items: AdminTimelineItem[];
  dayBreaks: AdminDayBreak[];
};

/* =========================
   Types (UI Subcategories)
   ========================= */

type CatKey = "WORK" | "SICK" | "VACATION";
type CatState = Record<CatKey, boolean>;

const defaultCatState: CatState = { WORK: false, SICK: false, VACATION: false };

/* =========================
   Types (Dashboard + Overview)
   ========================= */

type DashboardCards = {
  plannedToday: number;
  absencesToday: number;
  missingToday: number;
  missingWeek: number;
  monthWorkMinutes: number;
  employeesActive: number;
  overdueMissingGeneral: number;
};

type DashboardPersonRow = {
  userId: string;
  fullName: string;
};

type DashboardAbsenceRow = {
  userId: string;
  fullName: string;
  type: "VACATION" | "SICK";
};

type DashboardOverdueMissingRow = {
  userId: string;
  fullName: string;
  missingDatesCount: number;
  oldestMissingDate: string;
  newestMissingDate: string;
};

type AdminDashboardApiOk = {
  ok: true;
  todayIso: string;
  weekRange: { from: string; to: string };
  monthRange: { from: string; to: string };
  cards: DashboardCards;
  todayActiveEmployees: DashboardPersonRow[];
  todayMissingEmployees: DashboardPersonRow[];
  todayAbsentEmployees: DashboardAbsenceRow[];
  overdueMissingEmployees: DashboardOverdueMissingRow[];
  employeesTimeline: AdminEmployeeTimeline[];
};

type OverviewByUserRow = {
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  entriesCount: number;
  workMinutes: number;
  travelMinutes: number;
  vacationDays: number;
  sickDays: number;
  vacationMinutes: number;
  sickMinutes: number;
  unpaidAbsenceDays: number;
  unpaidAbsenceMinutes: number;
  baseTargetMinutes: number;
  targetMinutes: number;
  netTargetMinutes: number;
  holidayMinutes: number;
};

type OverviewApiResponse = {
  month: string;
  byUser: OverviewByUserRow[];
  totals: {
    entriesCount: number;
    workMinutes: number;
    travelMinutes: number;
    vacationDays: number;
    sickDays: number;
    vacationMinutes: number;
    sickMinutes: number;
    unpaidAbsenceDays: number;
    unpaidAbsenceMinutes: number;
    baseTargetMinutes: number;
    targetMinutes: number;
    netTargetMinutes: number;
    holidayMinutes: number;
  };
  isAdmin: boolean;
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
  if (!isRecord(v)) return false;

  return (
    isString(v["userId"]) &&
    isString(v["fullName"]) &&
    (v["role"] === "ADMIN" || v["role"] === "EMPLOYEE") &&
    (v["language"] === "DE" ||
      v["language"] === "EN" ||
      v["language"] === "IT" ||
      v["language"] === "TR" ||
      v["language"] === "SQ" ||
      v["language"] === "KU" ||
      v["language"] === "RO" ) &&
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

/* =========================
   Type Guards
   ========================= */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isDashboardPersonRow(v: unknown): v is DashboardPersonRow {
  if (!isRecord(v)) return false;
  return isString(v["userId"]) && isString(v["fullName"]);
}

function isDashboardAbsenceRow(v: unknown): v is DashboardAbsenceRow {
  if (!isRecord(v)) return false;
  return (
    isString(v["userId"]) &&
    isString(v["fullName"]) &&
    (v["type"] === "VACATION" || v["type"] === "SICK")
  );
}

function isDashboardOverdueMissingRow(v: unknown): v is DashboardOverdueMissingRow {
  if (!isRecord(v)) return false;
  return (
    isString(v["userId"]) &&
    isString(v["fullName"]) &&
    isNumber(v["missingDatesCount"]) &&
    isString(v["oldestMissingDate"]) &&
    isString(v["newestMissingDate"])
  );
}

function isAdminDashboardOk(v: unknown): v is AdminDashboardApiOk {
  if (!isRecord(v)) return false;
  if (v.ok !== true) return false;

  const cards = v["cards"];
  const weekRange = v["weekRange"];
  const monthRange = v["monthRange"];
  const employeesTimeline = v["employeesTimeline"];
  const todayActiveEmployees = v["todayActiveEmployees"];
  const todayMissingEmployees = v["todayMissingEmployees"];
  const todayAbsentEmployees = v["todayAbsentEmployees"];
  const overdueMissingEmployees = v["overdueMissingEmployees"];

  if (!isRecord(cards) || !isRecord(weekRange) || !isRecord(monthRange)) return false;
  if (!Array.isArray(employeesTimeline)) return false;
  if (!Array.isArray(todayActiveEmployees)) return false;
  if (!Array.isArray(todayMissingEmployees)) return false;
  if (!Array.isArray(todayAbsentEmployees)) return false;
  if (!Array.isArray(overdueMissingEmployees)) return false;

  return (
    isString(v["todayIso"]) &&
    isString(weekRange["from"]) &&
    isString(weekRange["to"]) &&
    isString(monthRange["from"]) &&
    isString(monthRange["to"]) &&
    isNumber(cards["plannedToday"]) &&
    isNumber(cards["absencesToday"]) &&
    isNumber(cards["missingToday"]) &&
    isNumber(cards["missingWeek"]) &&
    isNumber(cards["monthWorkMinutes"]) &&
    isNumber(cards["employeesActive"]) &&
    isNumber(cards["overdueMissingGeneral"]) &&
    todayActiveEmployees.every(isDashboardPersonRow) &&
    todayMissingEmployees.every(isDashboardPersonRow) &&
    todayAbsentEmployees.every(isDashboardAbsenceRow) &&
    overdueMissingEmployees.every(isDashboardOverdueMissingRow)
  );
}

function isOverviewRow(v: unknown): v is OverviewByUserRow {
  if (!isRecord(v)) return false;
  return (
    isString(v["fullName"]) &&
    (v["role"] === "EMPLOYEE" || v["role"] === "ADMIN") &&
    isNumber(v["entriesCount"]) &&
    isNumber(v["workMinutes"]) &&
    isNumber(v["travelMinutes"]) &&
    isNumber(v["vacationDays"]) &&
    isNumber(v["sickDays"]) &&
    isNumber(v["vacationMinutes"]) &&
    isNumber(v["sickMinutes"]) &&
    isNumber(v["unpaidAbsenceDays"]) &&
    isNumber(v["unpaidAbsenceMinutes"]) &&
    isNumber(v["baseTargetMinutes"]) &&
    isNumber(v["targetMinutes"]) &&
    isNumber(v["netTargetMinutes"]) &&
    isNumber(v["holidayMinutes"])
  );
}

function isOverviewApiResponse(v: unknown): v is OverviewApiResponse {
  if (!isRecord(v)) return false;
  const totals = v["totals"];
  const byUser = v["byUser"];
  if (!isRecord(totals) || !Array.isArray(byUser)) return false;

  return (
    isString(v["month"]) &&
    typeof v["isAdmin"] === "boolean" &&
    byUser.every(isOverviewRow) &&
    isNumber(totals["entriesCount"]) &&
    isNumber(totals["workMinutes"]) &&
    isNumber(totals["travelMinutes"]) &&
    isNumber(totals["vacationDays"]) &&
    isNumber(totals["sickDays"]) &&
    isNumber(totals["vacationMinutes"]) &&
    isNumber(totals["sickMinutes"]) &&
    isNumber(totals["unpaidAbsenceDays"]) &&
    isNumber(totals["unpaidAbsenceMinutes"]) &&
    isNumber(totals["baseTargetMinutes"]) &&
    isNumber(totals["targetMinutes"]) &&
    isNumber(totals["netTargetMinutes"]) &&
    isNumber(totals["holidayMinutes"])
  );
}

function localizeRemindMissingError(
  language: AppUiLanguage,
  message: string
): string {
  switch (message) {
    case "NOT_LOGGED_IN":
      return translate(language, "remindMissingNotLoggedIn", ADMIN_DASHBOARD_UI_TEXTS);
    case "FORBIDDEN":
      return translate(language, "remindMissingForbidden", ADMIN_DASHBOARD_UI_TEXTS);
    case "INVALID_BODY":
      return translate(language, "remindMissingInvalidBody", ADMIN_DASHBOARD_UI_TEXTS);
    case "EMPLOYEE_ID_MISSING":
      return translate(language, "remindMissingEmployeeIdMissing", ADMIN_DASHBOARD_UI_TEXTS);
    case "EMPLOYEE_NOT_FOUND":
      return translate(language, "remindMissingEmployeeNotFound", ADMIN_DASHBOARD_UI_TEXTS);
    case "NO_OVERDUE_MISSING_WORK_ENTRIES":
      return translate(language, "remindMissingNoOverdueEntries", ADMIN_DASHBOARD_UI_TEXTS);
    case "NO_ACTIVE_PUSH_SUBSCRIPTION":
      return translate(language, "remindMissingNoPushSubscription", ADMIN_DASHBOARD_UI_TEXTS);
    default:
      return message;
  }
}

/* =========================
   Helpers (Dates, Formatting)
   ========================= */

function monthKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function currentYear(): string {
  return String(new Date().getFullYear());
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0);
  return String(last.getDate()).padStart(2, "0");
}

type ExportMode = "MONTH" | "YEAR" | "RANGE";
type ExportTarget = "ALL" | "SINGLE_EMPLOYEE";
function formatHM(minutes: number): string {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}min`;
}

function formatHours1(minutes: number): string {
  const h = minutes / 60;
  return `${h.toFixed(1)}h`;
}

function formatHoursInfoFromMinutes(minutes: number): string {
  return `${String((minutes / 60).toFixed(1)).replace(".", ",")}h`;
}

function formatDate(iso: string, language: AppUiLanguage): string {
  const normalized = iso.length >= 10 ? iso.slice(0, 10) : iso;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return iso;

  const [y, m, d] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));

  const locale =
    language === "EN"
      ? "en-GB"
      : language === "IT"
      ? "it-IT"
      : language === "TR"
      ? "tr-TR"
      : language === "SQ"
      ? "sq-AL"
      : language === "KU"
      ? "ku"
      : language === "RO"
      ? "ro-RO"
      : "de-DE";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatMinutesCompact(minutes: number): string {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} min`;
  return formatHM(mins);
}

function absenceTypeLabel(
  type: "VACATION" | "SICK",
  language: AppUiLanguage
): string {
  return type === "VACATION"
    ? translate(language, "vacation", ADMIN_DASHBOARD_UI_TEXTS).replace(":", "")
    : translate(language, "sick", ADMIN_DASHBOARD_UI_TEXTS).replace(":", "");
}

function overdueRangeLabel(
  oldestMissingDate: string,
  newestMissingDate: string,
  language: AppUiLanguage
): string {
  return oldestMissingDate === newestMissingDate
    ? formatDate(oldestMissingDate, language)
    : `${formatDate(oldestMissingDate, language)} – ${formatDate(newestMissingDate, language)}`;
}

function getDayBreakForDate(dayBreaks: AdminDayBreak[], workDate: string): AdminDayBreak | null {
  return dayBreaks.find((item) => item.workDate === workDate) ?? null;
}

function buildFallbackDayBreakFromItems(workDate: string, items: AdminTimelineWork[]): AdminDayBreak | null {
  const effectiveMinutes = items.reduce((sum, item) => sum + Math.max(0, item.breakMinutes), 0);

  if (effectiveMinutes <= 0) {
    return null;
  }

  const autoSupplementMinutes = items.reduce(
    (sum, item) => sum + (item.breakAuto ? Math.max(0, item.breakMinutes) : 0),
    0
  );

  const manualMinutes = Math.max(0, effectiveMinutes - autoSupplementMinutes);

  return {
    workDate,
    breakStartHHMM: null,
    breakEndHHMM: null,
    manualMinutes,
    legalMinutes: 0,
    autoSupplementMinutes,
    effectiveMinutes,
  };
}

function groupWorkItemsByDay(items: AdminTimelineWork[]): Record<string, AdminTimelineWork[]> {
  const grouped: Record<string, AdminTimelineWork[]> = {};

  const sorted = items
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startHHMM !== b.startHHMM) return a.startHHMM.localeCompare(b.startHHMM);
      return a.endHHMM.localeCompare(b.endHHMM);
    });

  for (const it of sorted) {
    const day = it.date;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(it);
  }

  return grouped;
}

/* =========================
   Absence grouping (ranges)
   ========================= */

type AbsenceRange = {
  type: "VACATION" | "SICK";
  compensation: "PAID" | "UNPAID";
  from: string;
  to: string;
  dayPortion: "FULL_DAY" | "HALF_DAY";
  days: number;
};

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function absenceDayValue(dayPortion: "FULL_DAY" | "HALF_DAY"): number {
  return dayPortion === "HALF_DAY" ? 0.5 : 1;
}

function formatDayCount(days: number, language: AppUiLanguage): string {
  if (days === 0.5) {
    return translate(language, "halfDay", ADMIN_DASHBOARD_UI_TEXTS);
  }

  if (Number.isInteger(days)) {
    return `${days} ${
      days === 1
        ? translate(language, "day", ADMIN_DASHBOARD_UI_TEXTS)
        : translate(language, "days", ADMIN_DASHBOARD_UI_TEXTS)
    }`;
  }

  return `${String(days).replace(".", ",")} ${translate(
    language,
    "days",
    ADMIN_DASHBOARD_UI_TEXTS
  )}`;
}

function groupAbsenceRanges(items: AdminTimelineItem[]): AbsenceRange[] {
  const abs = items
    .filter((i): i is AdminTimelineAbsence => i.type === "VACATION" || i.type === "SICK")
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const res: AbsenceRange[] = [];

  for (const it of abs) {
    const last = res[res.length - 1];

    if (!last) {
      res.push({
        type: it.type,
        compensation: it.compensation ?? "PAID",
        from: it.date,
        to: it.date,
        dayPortion: it.dayPortion,
        days: absenceDayValue(it.dayPortion),
      });
      continue;
    }

    const expectedNext = addDaysIso(last.to, 1);

    const mayMergeFullDays =
      last.type === it.type &&
      last.compensation === (it.compensation ?? "PAID") &&
      last.dayPortion === "FULL_DAY" &&
      it.dayPortion === "FULL_DAY" &&
      it.date === expectedNext;

    if (mayMergeFullDays) {
      last.to = it.date;
      last.days += 1;
      continue;
    }

    res.push({
      type: it.type,
      compensation: it.compensation ?? "PAID",
      from: it.date,
      to: it.date,
      dayPortion: it.dayPortion,
      days: absenceDayValue(it.dayPortion),
    });
  }

  return res;
}

/* =========================
   Accordion toggles
   ========================= */

function toggleUser(openUsers: Set<string>, id: string): Set<string> {
  const next = new Set(openUsers);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function toggleCat(prev: Record<string, CatState>, userId: string, cat: CatKey): Record<string, CatState> {
  const cur = prev[userId] ?? defaultCatState;
  return {
    ...prev,
    [userId]: {
      ...cur,
      [cat]: !cur[cat],
    },
  };
}

function toggleWorkDay(openDays: Set<string>, key: string): Set<string> {
  const next = new Set(openDays);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

/* =========================
   Download / Share Helpers
   ========================= */

function getFileNameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = disposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (plainMatch && plainMatch[1]) return plainMatch[1];

  const plainNoQuotesMatch = disposition.match(/filename\s*=\s*([^;]+)/i);
  if (plainNoQuotesMatch && plainNoQuotesMatch[1]) return plainNoQuotesMatch[1].trim();

  return fallback;
}

function guessExportFallbackName(url: string): string {
  if (url.includes("scope=year")) return "export.zip";
  if (url.includes("scope=month")) return "export.csv";
  return "export.csv";
}

type NavigatorWithShare = Navigator & {
  share?: (data?: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
};

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ipod") ||
    ua.includes("mobile")
  );
}

/* =========================
   Page
   ========================= */

export default function AdminDashboardPage() {
  const router = useRouter();
  const ym = useMemo(() => monthKey(new Date()), []);
  const [month, setMonth] = useState<string>(ym);

  const [dash, setDash] = useState<AdminDashboardApiOk | null>(null);
  const [overview, setOverview] = useState<OverviewApiResponse | null>(null);
  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [openUsers, setOpenUsers] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Record<string, CatState>>({});
  const [openWorkDays, setOpenWorkDays] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [reloadTick, setReloadTick] = useState(0);

  type KpiModalKind = "ACTIVE" | "MISSING" | "ABSENT" | "OVERDUE_GENERAL" | null;
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalKind, setKpiModalKind] = useState<KpiModalKind>(null);
  const [remindLoadingUserId, setRemindLoadingUserId] = useState<string>("");
  const [remindErr, setRemindErr] = useState<string>("");
  const [remindSuccess, setRemindSuccess] = useState<string>("");

  // Export Modal State
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("MONTH");
  const [exportMonth, setExportMonth] = useState<string>(ym);
  const [exportYear, setExportYear] = useState<string>(currentYear());
  const [rangeFrom, setRangeFrom] = useState<string>(`${ym}-01`);
  const [rangeTo, setRangeTo] = useState<string>(`${ym}-${lastDayOfMonth(ym)}`);
  const [exportTarget, setExportTarget] = useState<ExportTarget>("ALL");
  const [exportEmployeeId, setExportEmployeeId] = useState<string>("");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportActionError, setExportActionError] = useState<string>("");
  const language: AppUiLanguage = session?.language ?? "DE";

  function t(key: keyof typeof ADMIN_DASHBOARD_UI_TEXTS): string {
    return translate(language, key, ADMIN_DASHBOARD_UI_TEXTS);
  }

  const employeeOptions = useMemo(() => {
    const seen = new Set<string>();

    return (dash?.employeesTimeline ?? [])
      .filter((u) => {
        if (seen.has(u.userId)) return false;
        seen.add(u.userId);
        return true;
      })
      .map((u) => ({ id: u.userId, name: u.fullName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dash]);

  const exportTargetError = useMemo(() => {
    if (exportTarget !== "SINGLE_EMPLOYEE") return "";
    if (!exportEmployeeId) return t("employeeRequired");

    const exists = employeeOptions.some((u) => u.id === exportEmployeeId);
    if (!exists) return t("employeeUnavailable");

    return "";
  }, [exportTarget, exportEmployeeId, employeeOptions]);

  // Admin Edit WorkEntry Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string>("");

  const [editEntryId, setEditEntryId] = useState<string>("");
  const [editUserLabel, setEditUserLabel] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");

  const [editActivity, setEditActivity] = useState<string>("");
  const [editLocation, setEditLocation] = useState<string>("");
  const [editTravelMinutes, setEditTravelMinutes] = useState<string>("0");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUserLabel, setDetailsUserLabel] = useState<string>("");
  const [detailsDate, setDetailsDate] = useState<string>("");
  const [detailsTime, setDetailsTime] = useState<string>("");
  const [detailsActivity, setDetailsActivity] = useState<string>("");
  const [detailsLocation, setDetailsLocation] = useState<string>("");
  const [detailsTravelMinutes, setDetailsTravelMinutes] = useState<number>(0);
  const [detailsWorkMinutes, setDetailsWorkMinutes] = useState<number>(0);

  const [breakInfoOpen, setBreakInfoOpen] = useState(false);
  const [breakInfoUserLabel, setBreakInfoUserLabel] = useState<string>("");
  const [breakInfoDate, setBreakInfoDate] = useState<string>("");
  const [breakInfoManualStart, setBreakInfoManualStart] = useState<string>("");
  const [breakInfoManualEnd, setBreakInfoManualEnd] = useState<string>("");
  const [breakInfoManualMinutes, setBreakInfoManualMinutes] = useState<number>(0);
  const [breakInfoLegalMinutes, setBreakInfoLegalMinutes] = useState<number>(0);
  const [breakInfoAutoMinutes, setBreakInfoAutoMinutes] = useState<number>(0);
  const [breakInfoEffectiveMinutes, setBreakInfoEffectiveMinutes] = useState<number>(0);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteUserLabel, setNoteUserLabel] = useState<string>("");
  const [noteDate, setNoteDate] = useState<string>("");
  const [noteTime, setNoteTime] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: string[] = [];
    for (let y = now - 2; y <= now + 1; y++) arr.push(String(y));
    return arr;
  }, []);

  const rangeError = useMemo(() => {
    if (exportMode !== "RANGE") return "";
    if (!rangeFrom || !rangeTo) return t("rangeFromToRequired");
    if (rangeFrom > rangeTo) return t("rangeFromAfterTo");
    return "";
  }, [exportMode, rangeFrom, rangeTo, language]);

  function buildExportUrl(): string | null {
    if (exportTarget === "SINGLE_EMPLOYEE" && exportTargetError) return null;
    if (exportMode === "RANGE" && rangeError) return null;

    const params = new URLSearchParams();

    if (exportTarget === "SINGLE_EMPLOYEE") {
      params.set("group", "singleEmployee");
      params.set("userId", exportEmployeeId);
    } else {
      params.set("group", "all");
    }

    if (exportMode === "MONTH") {
      params.set("scope", "month");
      params.set("month", exportMonth);
    } else if (exportMode === "YEAR") {
      params.set("scope", "year");
      params.set("year", exportYear);
    } else {
      params.set("from", rangeFrom);
      params.set("to", rangeTo);
    }

    return `/api/admin/export?${params.toString()}`;
  }

  async function downloadExport(url: string): Promise<void> {
    setExportBusy(true);
    setExportActionError("");

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        let message = t("exportDownloadError");

        try {
          const data: unknown = await response.json();
          if (isRecord(data) && isString(data["error"])) {
            message = data["error"];
          }
        } catch {
          // ignore
        }

        setExportActionError(message);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const fallbackName = guessExportFallbackName(url);
      const fileName = getFileNameFromDisposition(disposition, fallbackName);

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportOpen(false);

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch {
      setExportActionError(t("exportDownloadError"));
    } finally {
      setExportBusy(false);
    }
  }

  async function shareOrSaveExport(url: string): Promise<void> {
    setExportBusy(true);
    setExportActionError("");

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        let message = t("exportOpenError");

        try {
          const data: unknown = await response.json();
          if (isRecord(data) && isString(data["error"])) {
            message = data["error"];
          }
        } catch {
          // ignore
        }

        setExportActionError(message);
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const fallbackName = guessExportFallbackName(url);
      const fileName = getFileNameFromDisposition(disposition, fallbackName);
      const mimeType = blob.type || "application/octet-stream";

      const file = new File([blob], fileName, {
        type: mimeType,
        lastModified: Date.now(),
      });

      const shareNavigator = navigator as NavigatorWithShare;

      if (
        typeof shareNavigator.share === "function" &&
        typeof shareNavigator.canShare === "function" &&
        shareNavigator.canShare({ files: [file] })
      ) {
        await shareNavigator.share({
          title: fileName,
          files: [file],
        });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch {
      setExportActionError(t("exportShareError"));
    } finally {
      setExportBusy(false);
    }
  }

  const openKpiModal = (kind: Exclude<KpiModalKind, null>) => {
    setKpiModalKind(kind);
    setRemindErr("");
    setRemindSuccess("");
    setKpiModalOpen(true);
  };

  const closeKpiModal = () => {
    setKpiModalOpen(false);
    setKpiModalKind(null);
    setRemindLoadingUserId("");
    setRemindErr("");
    setRemindSuccess("");
  };

  async function sendMissingReminder(userId: string, fullName: string) {
    setRemindLoadingUserId(userId);
    setRemindErr("");
    setRemindSuccess("");

    try {
      const r = await fetch("/api/admin/dashboard/remind-missing", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const j: unknown = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg =
          isRecord(j) && isString(j["error"])
            ? localizeRemindMissingError(language, j["error"])
            : t("pushSendError");
        setRemindErr(msg);
        return;
      }

      setRemindSuccess(`${t("pushSuccessPrefix")} ${fullName}`);
      setReloadTick((x) => x + 1);
    } catch {
      setRemindErr(t("pushNetworkError"));
    } finally {
      setRemindLoadingUserId("");
    }
  }

  const openExportModal = () => {
    setExportMode("MONTH");
    setExportMonth(month);
    setExportYear(currentYear());
    setRangeFrom(`${month}-01`);
    setRangeTo(`${month}-${lastDayOfMonth(month)}`);
    setExportTarget("ALL");
    setExportEmployeeId("");
    setExportActionError("");
    setExportBusy(false);
    setExportOpen(true);
  };

  const doExport = async (mode: "OPEN" | "SHARE") => {
    const url = buildExportUrl();
    if (!url) return;

    if (mode === "OPEN") {
      await downloadExport(url);
      return;
    }

    await shareOrSaveExport(url);
  };

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
        setSession(null);
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
    let alive = true;

    (async () => {
      if (!sessionChecked) return;
      if (!session || session.role !== "ADMIN") return;

      setLoading(true);
      setErr("");

      try {
        const [rd, ro] = await Promise.all([
          fetch(`/api/admin/dashboard?month=${encodeURIComponent(month)}`, { credentials: "include" }),
          fetch(`/api/overview?month=${encodeURIComponent(month)}`, { credentials: "include" }),
        ]);

        const jd: unknown = await rd.json().catch(() => ({}));
        const jo: unknown = await ro.json().catch(() => ({}));

        if (!alive) return;

        if (!rd.ok) {
          const msg = isRecord(jd) && isString(jd["error"]) ? jd["error"] : t("dashboardLoadError");
          setErr(msg);
          setDash(null);
          setOverview(null);
          return;
        }

        if (!isAdminDashboardOk(jd)) {
          setErr(t("unexpectedDashboardResponse"));
          setDash(null);
          setOverview(null);
          return;
        }

        if (!ro.ok || !isOverviewApiResponse(jo) || jo.isAdmin !== true) {
          setDash(jd);
          setOverview(null);
          return;
        }

        setDash(jd);
        setOverview(jo);
      } catch {
        if (!alive) return;
        setErr(t("networkLoadError"));
        setDash(null);
        setOverview(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [month, reloadTick, sessionChecked, session?.role]);

  const exportFooter = (
    <>
      <button
        type="button"
        onClick={() => setExportOpen(false)}
        disabled={exportBusy}
        className="btn"
        style={{
          cursor: exportBusy ? "not-allowed" : "pointer",
          opacity: exportBusy ? 0.7 : 1,
        }}
      >
        {t("cancel")}
      </button>

      <button
        type="button"
        onClick={() => void doExport(isMobileDevice() ? "SHARE" : "OPEN")}
        disabled={Boolean(rangeError) || Boolean(exportTargetError) || exportBusy}
        className="btn btn-accent"
        style={{
          cursor:
            rangeError || exportTargetError || exportBusy
              ? "not-allowed"
              : "pointer",
          opacity: rangeError || exportTargetError || exportBusy ? 0.7 : 1,
        }}
        title={isMobileDevice() ? t("shareOrSaveTitle") : t("downloadTitle")}
      >
        {isMobileDevice() ? t("shareOrSave") : t("download")}
      </button>
    </>
  );

  function openEditWork(uName: string, it: AdminTimelineWork) {
    setEditErr("");
    setEditEntryId(it.id);
    setEditUserLabel(uName);
    setEditDate(it.date);
    setEditTime(`${it.startHHMM}–${it.endHHMM}`);
    setEditActivity(it.activity ?? "");
    setEditLocation(it.location ?? "");
    setEditTravelMinutes(String(it.travelMinutes ?? 0));
    setEditOpen(true);
  }

  function openEmployeeNote(uName: string, it: AdminTimelineWork) {
    setNoteUserLabel(uName);
    setNoteDate(it.date);
    setNoteTime(`${it.startHHMM}–${it.endHHMM}`);
    setNoteText(it.noteEmployee ?? "");
    setNoteOpen(true);
  }

  function openWorkDetails(uName: string, it: AdminTimelineWork) {
    setDetailsUserLabel(uName);
    setDetailsDate(it.date);
    setDetailsTime(`${it.startHHMM}–${it.endHHMM}`);
    setDetailsActivity(it.activity ?? "");
    setDetailsLocation(it.location ?? "");
    setDetailsTravelMinutes(it.travelMinutes ?? 0);
    setDetailsWorkMinutes(it.workMinutes ?? 0);
    setDetailsOpen(true);
  }

  function openDayBreakInfo(uName: string, date: string, dayBreak: AdminDayBreak | null) {
    setBreakInfoUserLabel(uName);
    setBreakInfoDate(date);
    setBreakInfoManualStart(dayBreak?.breakStartHHMM ?? "");
    setBreakInfoManualEnd(dayBreak?.breakEndHHMM ?? "");
    setBreakInfoManualMinutes(dayBreak?.manualMinutes ?? 0);
    setBreakInfoLegalMinutes(dayBreak?.legalMinutes ?? 0);
    setBreakInfoAutoMinutes(dayBreak?.autoSupplementMinutes ?? 0);
    setBreakInfoEffectiveMinutes(dayBreak?.effectiveMinutes ?? 0);
    setBreakInfoOpen(true);
  }

  async function saveEditWork() {
    if (!editEntryId) return;

    setEditSaving(true);
    setEditErr("");

    const travel = Number(editTravelMinutes.replace(",", "."));
    const travelMinutes = Number.isFinite(travel) ? Math.max(0, Math.round(travel)) : 0;

    try {
      const r = await fetch("/api/entries", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editEntryId,
          activity: editActivity,
          location: editLocation,
          travelMinutes,
        }),
      });

      const j: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = isRecord(j) && isString(j["error"]) ? j["error"] : t("saveFailed");
        setEditErr(msg);
        return;
      }

      setEditOpen(false);
      setReloadTick((x) => x + 1);
    } catch {
      setEditErr(t("saveNetworkError"));
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteWorkEntry(entryId: string) {
    const ok =
      typeof window !== "undefined" ? window.confirm(t("deleteConfirm")) : false;
    if (!ok) return;

    try {
      const r = await fetch(`/api/entries?id=${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = isRecord(j) && isString(j["error"]) ? j["error"] : t("deleteFailed");
        setErr(msg);
        return;
      }

      setReloadTick((x) => x + 1);
    } catch {
      setErr(t("deleteNetworkError"));
    }
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel={t("dashboard")}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel={t("dashboard")}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("monthForOverviewAndExport")}</div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input"
          />
        </div>

        <div style={{ display: "flex", alignItems: "end", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/admin/tasks"
            className="tenant-action-link inline-flex items-center justify-center gap-2 leading-none"
            style={{
              fontWeight: 900,
            }}
            title={t("manageTasks")}
          >
            <ClipboardList className="w-[18px] h-[18px] shrink-0"/>
            <span className="leading-none">{t("manageTasks")}</span>
          </Link>

          <button
            onClick={openExportModal}
            type="button"
            className="btn btn-accent inline-flex items-center justify-center gap-2 leading-none"
            style={{ fontWeight: 900 }}
            title={t("exportAdmin")}
          >
          <Download className="w-[18px] h-[18px] shrink-0" />
            <span className="leading-none">Export</span>
          </button>

          <Modal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            title={t("exportAdmin")}
            footer={exportFooter}
            maxWidth={720}
          >
            <div style={{ display: "grid", gap: 12 }}>
              {exportActionError ? (
                <div className="tenant-status-card tenant-status-card-danger">
                  <div className="tenant-status-text-danger">{exportActionError}</div>
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {([
                  { key: "MONTH", label: t("monthCsv") },
                  { key: "YEAR", label: t("yearZip") },
                  { key: "RANGE", label: t("rangeCsv") },
                ] as Array<{ key: ExportMode; label: string }>).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setExportMode(m.key)}
                    className={exportMode === m.key ? "pill pill-active" : "pill"}
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("exportTarget")}</div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setExportTarget("ALL");
                      setExportEmployeeId("");
                    }}
                    className={exportTarget === "ALL" ? "pill pill-active" : "pill"}
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {t("allCombined")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportTarget("SINGLE_EMPLOYEE")}
                    className={exportTarget === "SINGLE_EMPLOYEE" ? "pill pill-active" : "pill"}
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {t("singleEmployee")}
                  </button>
                </div>
              </div>

              {exportTarget === "SINGLE_EMPLOYEE" ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectEmployee")}</div>
                  <select
                    value={exportEmployeeId}
                    onChange={(e) => setExportEmployeeId(e.target.value)}
                    className="select"
                  >
                    <option value="" style={{ color: "black" }}>
                      {t("pleaseChoose")}
                    </option>
                    {employeeOptions.map((u) => (
                      <option key={u.id} value={u.id} style={{ color: "black" }}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  {exportTargetError ? (
                    <div className="tenant-status-text-danger" style={{ fontSize: 12 }}>
                      {exportTargetError}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {exportMode === "MONTH" ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectMonth")}</div>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="input"
                  />
                </div>
              ) : null}

              {exportMode === "YEAR" ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectYear")}</div>
                  <select
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value)}
                    className="select"
                  >
                    {years.map((y) => (
                      <option key={y} value={y} style={{ color: "black" }}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {exportMode === "RANGE" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectRange")}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input
                      type="date"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                      className="input"
                    />
                    <input
                      type="date"
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                      className="input"
                    />
                  </div>

                  {rangeError ? (
                    <div className="tenant-status-text-danger" style={{ fontSize: 12 }}>
                      {rangeError}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Modal>
        </div>
      </div>

      <Modal
        open={kpiModalOpen}
        onClose={closeKpiModal}
        title={
          kpiModalKind === "ACTIVE"
            ? t("activeEmployeesModal")
            : kpiModalKind === "MISSING"
            ? t("missingEntriesTodayModal")
            : kpiModalKind === "ABSENT"
            ? t("absencesTodayModal")
            : kpiModalKind === "OVERDUE_GENERAL"
            ? t("missingEntriesGeneralModal")
            : ""
        }
        footer={
          <button
            type="button"
            onClick={closeKpiModal}
            className="btn"
          >
            {t("close")}
          </button>
        }
        maxWidth={720}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {remindErr ? (
            <div className="tenant-status-card tenant-status-card-danger">
              <div className="tenant-status-text-danger">{remindErr}</div>
            </div>
          ) : null}

          {remindSuccess ? (
            <div className="tenant-status-card tenant-status-card-success">
              <div className="tenant-status-text-success">{remindSuccess}</div>
            </div>
          ) : null}

          {kpiModalKind === "ACTIVE" ? (
            (dash?.todayActiveEmployees ?? []).length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(dash?.todayActiveEmployees ?? []).map((person) => (
                  <div
                    key={person.userId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "var(--surface)",
                      fontWeight: 900,
                    }}
                  >
                    <div>{person.fullName}</div>
                    <div style={{ color: "var(--muted-2)", fontSize: 12 }}>{t("active")}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>{t("noActiveEmployees")}</div>
            )
          ) : null}

          {kpiModalKind === "MISSING" ? (
            (dash?.todayMissingEmployees ?? []).length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(dash?.todayMissingEmployees ?? []).map((person) => (
                  <div
                    key={person.userId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "var(--surface)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{person.fullName}</div>
                    <div style={{ color: "var(--muted-2)", fontSize: 12, fontWeight: 900 }}>
                      {t("openToday")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>{t("noMissingEntriesToday")}</div>
            )
          ) : null}

          {kpiModalKind === "ABSENT" ? (
            (dash?.todayAbsentEmployees ?? []).length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(dash?.todayAbsentEmployees ?? []).map((person) => (
                  <div
                    key={`${person.userId}-${person.type}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "var(--surface)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{person.fullName}</div>
                    <div style={{ color: "var(--muted-2)", fontSize: 12, fontWeight: 900 }}>
                      {absenceTypeLabel(person.type, language)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>{t("noAbsencesToday")}</div>
            )
          ) : null}
          {kpiModalKind === "OVERDUE_GENERAL" ? (
            (dash?.overdueMissingEmployees ?? []).length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {(dash?.overdueMissingEmployees ?? []).map((person) => (
                  <div
                    key={person.userId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "var(--surface)",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                      <div style={{ fontWeight: 900 }}>{person.fullName}</div>
                      <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                        {person.missingDatesCount} {t("overdueDays")} · {overdueRangeLabel(person.oldestMissingDate, person.newestMissingDate, language)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => sendMissingReminder(person.userId, person.fullName)}
                      disabled={remindLoadingUserId === person.userId}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(184,207,58,0.35)",
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                        cursor: remindLoadingUserId === person.userId ? "not-allowed" : "pointer",
                        fontWeight: 1000,
                        opacity: remindLoadingUserId === person.userId ? 0.7 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {remindLoadingUserId === person.userId ? t("sending") : t("sendPush")}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>{t("noGeneralOverdueMissingEntries")}</div>
            )
          ) : null}
        </div>
      </Modal>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={t("workDetailsTitle")}
        footer={
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            className="btn"
          >
            {t("close")}
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("employee")}</div>
            <div style={{ fontWeight: 1000 }}>{detailsUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("dateAndTime")}</div>
            <div style={{ fontWeight: 1000 }}>
              {formatDate(detailsDate, language)} · {detailsTime}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("netWorkTime")}</div>
            <div style={{ fontWeight: 1000 }}>{formatHM(detailsWorkMinutes)}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("siteOrAddress")}</div>
            <div style={{ fontWeight: 1000 }}>{detailsLocation || t("dash")}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("executedActivity")}</div>
            <div style={{ fontWeight: 1000 }}>{detailsActivity || t("dash")}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("travelTime")}</div>
            <div style={{ fontWeight: 1000 }}>{formatMinutesCompact(detailsTravelMinutes)}</div>
          </div>
        </div>
      </Modal>

      <Modal
        open={breakInfoOpen}
        onClose={() => setBreakInfoOpen(false)}
        title={t("breakDetailsTitle")}
        footer={
          <button
            type="button"
            onClick={() => setBreakInfoOpen(false)}
            className="btn"
          >
            {t("close")}
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("employee")}</div>
            <div style={{ fontWeight: 1000 }}>{breakInfoUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("date")}</div>
            <div style={{ fontWeight: 1000 }}>{formatDate(breakInfoDate, language)}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("manualBreak")}</div>
            <div style={{ fontWeight: 1000 }}>
              {breakInfoManualStart && breakInfoManualEnd
                ? `${breakInfoManualStart}–${breakInfoManualEnd} · ${formatMinutesCompact(breakInfoManualMinutes)}`
                : breakInfoManualMinutes > 0
                ? formatMinutesCompact(breakInfoManualMinutes)
                : t("noNoteAvailable")}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("legallyRequired")}</div>
            <div style={{ fontWeight: 1000 }}>{formatMinutesCompact(breakInfoLegalMinutes)}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("autoSupplemented")}</div>
            <div style={{ fontWeight: 1000 }}>
              {breakInfoAutoMinutes > 0 ? formatMinutesCompact(breakInfoAutoMinutes) : t("noAutoSupplement")}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("effectiveBreakTotal")}</div>
            <div style={{ fontWeight: 1000 }}>{formatMinutesCompact(breakInfoEffectiveMinutes)}</div>
          </div>
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={t("employeeNoteTitle")}
        footer={
          <button
            type="button"
            onClick={() => setNoteOpen(false)}
            className="btn"
          >
            {t("close")}
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("employee")}</div>
            <div style={{ fontWeight: 1000 }}>{noteUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("dateAndTime")}</div>
            <div style={{ fontWeight: 1000 }}>
              {formatDate(noteDate, language)} · {noteTime}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("note")}</div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "var(--input-bg)",
                color: "rgba(255,255,255,0.92)",
                minHeight: 90,
              }}
            >
              {noteText.trim() ? noteText : t("noNoteAvailable")}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => (editSaving ? null : setEditOpen(false))}
        title={t("editWorkTitle")}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
              className="btn"
              style={{
                cursor: editSaving ? "not-allowed" : "pointer",
                opacity: editSaving ? 0.7 : 1,
              }}
            >
              {t("cancel")}
            </button>

            <button
              type="button"
              onClick={saveEditWork}
              disabled={editSaving}
              className="btn btn-accent"
              style={{
                cursor: editSaving ? "not-allowed" : "pointer",
                opacity: editSaving ? 0.7 : 1,
              }}
            >
              {editSaving ? t("saving") : t("save")}
            </button>
          </>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("employee")}</div>
            <div style={{ fontWeight: 1000 }}>{editUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("dateAndTimeNotEditable")}</div>
            <div style={{ fontWeight: 1000 }}>
              {formatDate(editDate, language)} · {editTime}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("activity")}</div>
            <input
              value={editActivity}
              onChange={(e) => setEditActivity(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "var(--input-bg)",
                color: "rgba(255,255,255,0.92)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("location")}</div>
            <input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "var(--input-bg)",
                color: "rgba(255,255,255,0.92)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("travelTimeMinutes")}</div>
              <input
                inputMode="numeric"
                value={editTravelMinutes}
                onChange={(e) => setEditTravelMinutes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "var(--input-bg)",
                  color: "rgba(255,255,255,0.92)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {editErr ? <div style={{ color: "rgba(224,75,69,0.95)", fontWeight: 900 }}>{editErr}</div> : null}
        </div>
      </Modal>

      {err ? (
        <div
          className="tenant-status-card tenant-status-card-danger"
          style={{ marginBottom: 12 }}
        >
          <div className="tenant-status-text-danger">{err}</div>
        </div>
      ) : null}

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("ACTIVE")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          title={t("openActiveEmployeesList")}
        >
          <div>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="small">{t("activeEmployees")}</div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--muted-2)",
                    lineHeight: 1,
                  }}
                >
                  <span>{t("details")}</span>
                  <Info size={14} />
                </div>
              </div>

            <div className="big">{dash?.cards.employeesActive ?? t("dash")}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}><UserRoundCheck style={{color: "var(--tenant-icon-muted)"}}/></div>
        </div>

        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("MISSING")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          title={t("openMissingEntriesList")}
        >
          <div>
           <div style={{ display: "grid", gap: 6 }}>
            <div className="small">{t("missingEntriesToday")}</div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--muted-2)",
                lineHeight: 1,
              }}
            >
              <span>{t("details")}</span>
              <Info size={14} />
            </div>
          </div>

            <div className="big">{dash?.cards.missingToday ?? t("dash")}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}><ClockAlert /></div>
        </div>

        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("ABSENT")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          title={t("openAbsencesList")}
        >
          <div>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="small">{t("absencesToday")}</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted-2)",
                  lineHeight: 1,
                }}
              >
                <span>{t("details")}</span>
                <Info size={14} />
              </div>
            </div>

            <div className="big">{dash?.cards.absencesToday ?? t("dash")}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>
            <CalendarX2 style={{color: "var(--tenant-icon-muted)"}}/>
          </div>
        </div>
        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("OVERDUE_GENERAL")}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          title={t("openGeneralMissingEntriesList")}
        >
          <div>
            <div style={{ display: "grid", gap: 6 }}>
              <div className="small">{t("missingEntriesGeneral")}</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--muted-2)",
                  lineHeight: 1,
                }}
              >
                <span>{t("details")}</span>
                <Info size={14} />
              </div>
            </div>

            <div className="big">{dash?.cards.overdueMissingGeneral ?? t("dash")}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}><TriangleAlert/></div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>
          {t("monthTotal")}
        </div>

        <div className="admin-month-summary">
          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>{t("workTimeTotal")}</span>
            <b>{overview ? formatHours1(overview.totals.workMinutes) : "—"}</b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>{t("vacation")}</span>
            <b>
              {overview
                ? `${String(overview.totals.vacationDays).replace(".", ",")} (${formatHoursInfoFromMinutes(
                    overview.totals.vacationMinutes
                  )})`
                : "—"}
            </b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>{t("sick")}</span>
            <b>
              {overview
                ? `${String(overview.totals.sickDays).replace(".", ",")} (${formatHoursInfoFromMinutes(
                    overview.totals.sickMinutes
                  )})`
                : "—"}
            </b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>{t("unpaidVacation")}</span>
            <b>
              {overview
                ? `${String(overview.totals.unpaidAbsenceDays).replace(".", ",")} (${formatHoursInfoFromMinutes(
                    overview.totals.unpaidAbsenceMinutes
                  )})`
                : "—"}
            </b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>{t("overtimeGross")}</span>
            <b>
              {overview
                ? formatHoursInfoFromMinutes(overview.totals.workMinutes - overview.totals.targetMinutes)
                : "—"}
            </b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>{t("entries")}</span>
            <b>{overview ? overview.totals.entriesCount : "—"}</b>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>{t("byEmployee")}</div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
        ) : !dash ? (
          <div style={{ color: "var(--muted)" }}>{t("noDashboardData")}</div>
        ) : dash.employeesTimeline.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>{t("noEmployeesInPeriod")}</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {dash.employeesTimeline
              .slice()
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
              .map((u) => {
                const open = openUsers.has(u.userId);

                const totalWorkMinutes = u.items
                  .filter((i): i is AdminTimelineWork => i.type === "WORK")
                  .reduce((sum, it) => sum + it.workMinutes, 0);

                return (
                  <div
                    key={u.userId}
                    className="list-item"
                    style={{
                      listStyle: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        cursor: "pointer",
                        fontWeight: 900,
                      }}
                      onClick={() => setOpenUsers((prev) => toggleUser(prev, u.userId))}
                      title={t("expandCollapseTitle")}
                    >
                      <div>{open ? "▼ " : "▶ "} {u.fullName}</div>
                      <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(totalWorkMinutes)}</div>
                    </div>

                    {open ? (
                      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                        {(() => {
                          if (u.items.length === 0) {
                            return <div style={{ color: "var(--muted)" }}>{t("noEntries")}</div>;
                          }

                          const workItems = u.items
                            .filter((i): i is AdminTimelineWork => i.type === "WORK")
                            .slice()
                            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

                          const rangesAll = groupAbsenceRanges(u.items);
                          const sickRanges = rangesAll.filter((r) => r.type === "SICK");
                          const vacationRanges = rangesAll.filter((r) => r.type === "VACATION");

                          const cat = openCats[u.userId] ?? defaultCatState;

                          const sectionHeader = (key: CatKey, label: string, countText: string, icon?:React.ReactNode) => (
                            <div
                              onClick={() => setOpenCats((prev) => toggleCat(prev, u.userId, key))}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "var(--surface)",
                                fontWeight: 1000,
                              }}
                              title={t("expandCollapseTitle")}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ opacity: 0.9 }}>{cat[key] ? "▼" : "▶"}</span>
                                {icon ? (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      lineHeight: 0,
                                    }}
                                  >
                                    {icon}
                                  </span>
                                ) : null}
                                <span>{label}</span>
                              </div>
                              <div style={{ color: "var(--muted-2)", fontWeight: 900, fontSize: 12 }}>{countText}</div>
                            </div>
                          );

                          return (
                            <div style={{ display: "grid", gap: 10 }}>
                              {sectionHeader(
                                "WORK",
                                t("workTimes"),
                                `${workItems.length} ${workItems.length === 1 ? t("entry") : t("entriesPlural")}`,
                                <FontAwesomeIcon icon={faHammer} />
                              )}
                              {cat.WORK ? (
                                workItems.length > 0 ? (
                                  <div style={{ display: "grid", gap: 10 }}>
                                    {Object.entries(groupWorkItemsByDay(workItems)).map(([dayKey, dayItems]) => {
                                      const dayToggleKey = `${u.userId}__${dayKey}`;
                                      const dayOpen = openWorkDays.has(dayToggleKey);

                                      const dayTotalMinutes = dayItems.reduce((sum, it) => sum + it.workMinutes, 0);
                                      const dayEntriesCount = dayItems.length;
                                      const storedDayBreak = getDayBreakForDate(u.dayBreaks, dayKey);
                                      const dayBreak = storedDayBreak ?? buildFallbackDayBreakFromItems(dayKey, dayItems);
                                      const dayPauseMinutes = dayBreak?.effectiveMinutes ?? 0;

                                      return (
                                        <div
                                          key={dayKey}
                                          style={{
                                            display: "grid",
                                            gap: 6,
                                            padding: "10px 12px",
                                            borderRadius: 12,
                                            background: "color-mix(in srgb, var(--surface) 70%, transparent)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                          }}
                                        >
                                          <div
                                            onClick={() => setOpenWorkDays((prev) => toggleWorkDay(prev, dayToggleKey))}
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              gap: 10,
                                              cursor: "pointer",
                                              padding: "8px 10px",
                                              borderRadius: 10,
                                              background: "var(--surface)",
                                              border: "1px solid rgba(255,255,255,0.06)",
                                              fontWeight: 1000,
                                            }}
                                            title={t("expandCollapseTitle")}
                                          >
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                              <span>{dayOpen ? "▼" : "▶"}</span>
                                              <span>{formatDate(dayKey, language)}</span>
                                              <span style={{ opacity: 0.5 }}>·</span>
                                              <span style={{ color: "var(--accent)" }}>{formatHM(dayTotalMinutes)}</span>
                                              <span style={{ opacity: 0.5 }}>·</span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openDayBreakInfo(u.fullName, dayKey, dayBreak);
                                                }}
                                                style={{
                                                  padding: 0,
                                                  border: "none",
                                                  background: "transparent",
                                                  color: "rgba(255,255,255,0.92)",
                                                  cursor: "pointer",
                                                  fontWeight: 900,
                                                }}
                                                title={t("showBreakDetails")}
                                              >
                                                {formatMinutesCompact(dayPauseMinutes)} {t("pause")}
                                              </button>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                              <div style={{ color: "var(--muted-2)", fontSize: 12, fontWeight: 900 }}>
                                                {dayEntriesCount} {dayEntriesCount === 1 ? t("entry") : t("entriesPlural")}
                                              </div>
                                            </div>
                                          </div>

                                          {dayOpen ? (
                                            <div style={{ display: "grid", gap: 6, paddingLeft: 10 }}>
                                              {dayItems.map((it) => (
                                                <div
                                                  key={it.id}
                                                  style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 10,
                                                    padding: "8px 10px",
                                                    borderRadius: 10,
                                                    background: "color-mix(in srgb, var(--surface) 70%, transparent)",
                                                    border: "1px solid rgba(255,255,255,0.06)",
                                                  }}
                                                >
                                                  <div style={{ display: "grid", gap: 2 }}>
                                                    <div style={{ fontWeight: 1100, color: "var(--accent)" }}>
                                                      {formatHM(it.workMinutes)}
                                                    </div>

                                                    <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                                      {it.location && it.location.trim()
                                                        ? it.location
                                                        : t("noSiteOrAddress")}
                                                    </div>
                                                  </div>

                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 8,
                                                      flexWrap: "wrap",
                                                      justifyContent: "flex-end",
                                                    }}
                                                  >
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openWorkDetails(u.fullName, it);
                                                      }}
                                                      title={t("showDetails")}
                                                      style={{
                                                        padding: "6px 10px",
                                                        borderRadius: 10,
                                                        border: "1px solid rgba(184,207,58,0.28)",
                                                        background: "rgba(184,207,58,0.10)",
                                                        color: "var(--accent)",
                                                        cursor: "pointer",
                                                        fontWeight: 900,
                                                      }}
                                                    >
                                                      <FontAwesomeIcon icon={faInfo} /> {t("details")}
                                                    </button>

                                                    {it.noteEmployee && it.noteEmployee.trim() ? (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          openEmployeeNote(u.fullName, it);
                                                        }}
                                                        title={t("showEmployeeNote")}
                                                        style={{
                                                          padding: "6px 10px",
                                                          borderRadius: 10,
                                                          border: "1px solid rgba(90,167,255,0.28)",
                                                          background: "rgba(90,167,255,0.10)",
                                                          color: "rgba(90,167,255,0.95)",
                                                          cursor: "pointer",
                                                          fontWeight: 900,
                                                        }}
                                                      >
                                                        <FontAwesomeIcon icon={faPenToSquare} /> {t("note")}
                                                      </button>
                                                    ) : null}

                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditWork(u.fullName, it);
                                                      }}
                                                      title={t("editWithoutTime")}
                                                      style={{
                                                        padding: "6px 10px",
                                                        borderRadius: 10,
                                                        border: "1px solid rgba(255,255,255,0.14)",
                                                        background: "var(--surface-strong)",
                                                        color: "rgba(255,255,255,0.9)",
                                                        cursor: "pointer",
                                                        fontWeight: 900,
                                                      }}
                                                    >
                                                      <FontAwesomeIcon icon={faPencil} />
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteWorkEntry(it.id);
                                                      }}
                                                      title={t("delete")}
                                                      style={{
                                                        padding: "6px 10px",
                                                        borderRadius: 10,
                                                        border: "1px solid rgba(224,75,69,0.35)",
                                                        background: "rgba(224,75,69,0.10)",
                                                        color: "rgba(224,75,69,0.95)",
                                                        cursor: "pointer",
                                                        fontWeight: 1000,
                                                      }}
                                                    >
                                                      <FontAwesomeIcon icon={faTrashCan} />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ color: "var(--muted)", paddingLeft: 6 }}>{t("noWorkTimesInMonth")}</div>
                                )
                              ) : null}

                              {sectionHeader(
                                "SICK",
                                t("sickness"),
                                `${sickRanges.length} ${sickRanges.length === 1 ? t("period") : t("periods")}`,
                                <Stethoscope style={{opacity:2}}/>
                              )}
                              {cat.SICK ? (
                                sickRanges.length > 0 ? (
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {sickRanges.map((r, idx) => {
                                      const from = formatDate(r.from, language);
                                      const to = formatDate(r.to, language);
                                      const text =
                                        r.dayPortion === "HALF_DAY"
                                          ? `${from} · ${formatDayCount(r.days, language)}`
                                          : r.from === r.to
                                          ? `${from} · ${formatDayCount(r.days, language)}`
                                          : `${from}–${to} · ${formatDayCount(r.days, language)}`;

                                      return (
                                        <div
                                          key={`s-${idx}`}
                                          style={{
                                            padding: "8px 10px",
                                            borderRadius: 10,
                                            fontWeight: 1100,
                                            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                                            border: "1px solid rgba(224,75,69,0.14)",
                                          }}
                                        >
                                          <Stethoscope />
                                          {t("sickLabel")} · {text}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ color: "var(--muted)", paddingLeft: 6 }}>{t("noSickDaysInMonth")}</div>
                                )
                              ) : null}

                              {sectionHeader(
                                "VACATION",
                                t("vacationLabel"),
                                `${vacationRanges.length} ${vacationRanges.length === 1 ? t("period") : t("periods")}`,
                                <TreePalm 
                                  style={{
                                    opacity: 500,
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              {cat.VACATION ? (
                                vacationRanges.length > 0 ? (
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {vacationRanges.map((r, idx) => {
                                      const from = formatDate(r.from, language);
                                      const to = formatDate(r.to, language);
                                      const text =
                                        r.dayPortion === "HALF_DAY"
                                          ? `${from} · ${formatDayCount(r.days, language)}`
                                          : r.from === r.to
                                          ? `${from} · ${formatDayCount(r.days, language)}`
                                          : `${from}–${to} · ${formatDayCount(r.days, language)}`;

                                      return (
                                        <div
                                          key={`v-${idx}`}
                                          style={{
                                            padding: "8px 10px",
                                            borderRadius: 10,
                                            fontWeight: 1100,
                                            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                                            border: "1px solid var(--brand-vacation-border)",
                                          }}
                                        >
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 8,
                                            }}
                                          >
                                            <TreePalm 
                                              style={{
                                              opacity: 500,
                                              flexShrink: 0,
                                              flex: "0 0 auto" }} 
                                            />
                                            <span>
                                              {r.compensation === "UNPAID"
                                                ? t("vacationUnpaidLabel")
                                                : t("vacationLabel")}{" "}
                                              · {text}
                                            </span>
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ color: "var(--muted)", paddingLeft: 6 }}>{t("noVacationInMonth")}</div>
                                )
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-month-summary {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .admin-month-summary-item {
          color: var(--muted);
        }

        @media (max-width: 768px) {
          .admin-month-summary {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .admin-month-summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 12px;
            background: var(--surface);
            border: 1px solid var(--border);
          }

          .admin-month-summary-item span {
            min-width: 0;
          }

          .admin-month-summary-item b {
            flex-shrink: 0;
            text-align: right;
          }
        }
      `}</style>
    </AppShell>
  );
}