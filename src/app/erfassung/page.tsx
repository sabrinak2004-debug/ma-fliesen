"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import { type ErfassungTextKey, ERFASSUNG_DICTIONARY } from "@/lib/i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencil,
  faTrashCan,
  faPause,
  faInfo,
  faPenToSquare,
  faPlus,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

type MeResponse =
  | {
      ok: true;
      session: {
        userId: string;
        fullName: string;
        role: "ADMIN" | "EMPLOYEE";
        language: AppUiLanguage;
        companyId: string;
        companyName: string;
        companySubdomain: string;
        companyLogoUrl: string | null;
        primaryColor: string | null;
      } | null;
    }
  | { ok: false };

type WorkEntry = {
  id: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  createdAt: string;
  updatedAt: string;
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string;
  hasChangeReports: boolean;
  user: { id: string; fullName: string };
};

type CreateWorkEntryResponse = {
  entry: {
    id: string;
  };
};

type MonthlyConfirmationEntry = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  noteEmployee: string;
};

type MonthlyConfirmationStatusResponse = {
  ok: true;
  shouldOpen: boolean;
  reason: string;
  year: number;
  month: number;
  lastWorkday: string;
  requiredUntilAt?: string | null;
  confirmationText?: string;
  missingDates?: string[];
  entries: MonthlyConfirmationEntry[];
};

type WorkEntryChangeAction = "UPDATE" | "DELETE";

type WorkEntryChangeSnapshot = {
  [key: string]: unknown;
  workDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  activity?: unknown;
  location?: unknown;
  travelMinutes?: unknown;
  grossMinutes?: unknown;
  breakMinutes?: unknown;
  breakAuto?: unknown;
  workMinutes?: unknown;
  noteEmployee?: unknown;
};

type WorkEntryChangeReport = {
  id: string;
  action: WorkEntryChangeAction;
  reason: string;
  createdAt: string;
  changedBy: {
    id: string;
    fullName: string;
  };
  oldValues: WorkEntryChangeSnapshot;
  newValues: WorkEntryChangeSnapshot | null;
};

type WorkEntryChangeReportsResponse = {
  reports: WorkEntryChangeReport[];
};

function isWorkEntryChangeSnapshot(value: unknown): value is WorkEntryChangeSnapshot {
  return isRecord(value);
}

function isWorkEntryChangeReport(value: unknown): value is WorkEntryChangeReport {
  if (!isRecord(value)) return false;

  const changedBy = value["changedBy"];

  return (
    isString(value["id"]) &&
    (value["action"] === "UPDATE" || value["action"] === "DELETE") &&
    isString(value["reason"]) &&
    isString(value["createdAt"]) &&
    isRecord(changedBy) &&
    isString(changedBy["id"]) &&
    isString(changedBy["fullName"]) &&
    isWorkEntryChangeSnapshot(value["oldValues"]) &&
    (value["newValues"] === null || isWorkEntryChangeSnapshot(value["newValues"]))
  );
}

function isWorkEntryChangeReportsResponse(value: unknown): value is WorkEntryChangeReportsResponse {
  if (!isRecord(value)) return false;
  const reports = value["reports"];

  return Array.isArray(reports) && reports.every(isWorkEntryChangeReport);
}

type DayBreak = {
  id: string;
  workDate: string; // YYYY-MM-DD
  breakStartHHMM: string | null;
  breakEndHHMM: string | null;
  manualMinutes: number;
  legalMinutes: number;
  autoSupplementMinutes: number;
  effectiveMinutes: number;
};

type TimeEntryCorrectionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type TimeEntryCorrectionRequest = {
  id: string;
  startDate: string;
  endDate: string;
  status: TimeEntryCorrectionRequestStatus;
  noteEmployee: string;
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
};

type TimeEntryCorrectionRequestStatusResponse = {
  ok: true;
  workDate: string;
  hasActiveUnlock: boolean;
  requiresCorrectionRequest: boolean;
  currentMissingWorkdaysCount: number;
  lockedMissingWorkdaysCount: number;
  graceWorkdaysLimit: number;
  pendingRequest: {
    id: string;
    startDate: string;
    endDate: string;
    status: "PENDING";
  } | null;
  latestDecisionRequest: {
    id: string;
    startDate: string;
    endDate: string;
    status: "APPROVED" | "REJECTED";
  } | null;
  adminTaskBypass: {
    active: boolean;
    taskId: string;
    workDate: string;
    startDate: string;
    endDate: string;
  } | null;
};

function isTimeEntryCorrectionRequestStatusResponse(
  v: unknown
): v is TimeEntryCorrectionRequestStatusResponse {
  if (!isRecord(v)) return false;
  if (v["ok"] !== true) return false;
  if (!isString(v["workDate"])) return false;
  if (typeof v["hasActiveUnlock"] !== "boolean") return false;
  if (typeof v["requiresCorrectionRequest"] !== "boolean") return false;
  if (typeof v["currentMissingWorkdaysCount"] !== "number") return false;
  if (typeof v["lockedMissingWorkdaysCount"] !== "number") return false;
  if (typeof v["graceWorkdaysLimit"] !== "number") return false;

  const pendingRequest = v["pendingRequest"];
  const latestDecisionRequest = v["latestDecisionRequest"];
  const adminTaskBypass = v["adminTaskBypass"];

  const isRequestRange = (
    value: unknown
  ): value is {
    id: string;
    startDate: string;
    endDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } => {
    if (!isRecord(value)) return false;
    return (
      isString(value["id"]) &&
      isString(value["startDate"]) &&
      isString(value["endDate"]) &&
      (
        value["status"] === "PENDING" ||
        value["status"] === "APPROVED" ||
        value["status"] === "REJECTED"
      )
    );
  };

  const isAdminTaskBypass = (
    value: unknown
  ): value is {
    active: boolean;
    taskId: string;
    workDate: string;
    startDate: string;
    endDate: string;
  } => {
    if (!isRecord(value)) return false;
    return (
      typeof value["active"] === "boolean" &&
      isString(value["taskId"]) &&
      isString(value["workDate"]) &&
      isString(value["startDate"]) &&
      isString(value["endDate"])
    );
  };

  const pendingOk = pendingRequest === null || isRequestRange(pendingRequest);
  const latestOk = latestDecisionRequest === null || isRequestRange(latestDecisionRequest);
  const bypassOk = adminTaskBypass === null || isAdminTaskBypass(adminTaskBypass);

  return pendingOk && latestOk && bypassOk;
}

function toIsoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLocalized(
  language: AppUiLanguage,
  yyyyMmDd: string
): string {
  const parts = yyyyMmDd.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return yyyyMmDd;
  }

  const dt = new Date(y, m - 1, d);
  const weekday = getWeekdayShort(language, dt.getDay());

  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = String(y);

  switch (language) {
    case "EN":
      return `${weekday} ${month}/${day}/${year}`;
    case "IT":
      return `${weekday} ${day}/${month}/${year}`;
    case "TR":
      return `${weekday} ${day}.${month}.${year}`;
    case "SQ":
      return `${weekday} ${day}.${month}.${year}`;
    case "KU":
      return `${weekday} ${day}.${month}.${year}`;
    case "RO":
      return `${weekday} ${day}.${month}.${year}`;
    case "DE":
    default:
      return `${weekday} ${day}.${month}.${year}`;
  }
}

function formatHM(minutes: number) {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}min`;
}

/** Gruppierung Monat/Jahr */
function toYMD(dateStr: string): string {
  return dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;
}
function monthKeyFromWorkDate(workDate: string): string {
  return toYMD(workDate).slice(0, 7); // YYYY-MM
}
function monthLabelLocalized(
  language: AppUiLanguage,
  monthKey: string
): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return monthKey;
  }

  const monthName = getMonthName(language, m);
  return `${monthName} ${y}`;
}
function sortMonthKeysDesc(a: string, b: string): number {
  return a === b ? 0 : a > b ? -1 : 1;
}
function sortEntriesDesc(a: WorkEntry, b: WorkEntry): number {
  const da = toYMD(a.workDate);
  const db = toYMD(b.workDate);
  if (da !== db) return da > db ? -1 : 1;
  if (a.startTime !== b.startTime) return a.startTime > b.startTime ? -1 : 1;
  return 0;
}

type DayGroup = {
  date: string; // YYYY-MM-DD
  label: string;
  entries: WorkEntry[];
};

type MonthDayGroup = {
  key: string; // YYYY-MM
  label: string;
  days: DayGroup[];
};

function sortYMDDesc(a: string, b: string): number {
  return a === b ? 0 : a > b ? -1 : 1;
}

function groupByMonthThenDay(
  language: AppUiLanguage,
  entries: WorkEntry[]
): MonthDayGroup[] {
  const monthMap = new Map<string, Map<string, WorkEntry[]>>();

  for (const e of entries) {
    const day = toYMD(e.workDate);
    const month = monthKeyFromWorkDate(day);

    const dayMap = monthMap.get(month) ?? new Map<string, WorkEntry[]>();
    const arr = dayMap.get(day) ?? [];
    arr.push(e);
    dayMap.set(day, arr);

    monthMap.set(month, dayMap);
  }

  const monthKeys = Array.from(monthMap.keys()).sort(sortMonthKeysDesc);

  return monthKeys.map((mk) => {
    const dayMap = monthMap.get(mk) ?? new Map<string, WorkEntry[]>();
    const dayKeys = Array.from(dayMap.keys()).sort(sortYMDDesc);

    const days: DayGroup[] = dayKeys.map((dk) => ({
      date: dk,
      label: formatDateLocalized(language, dk),
      entries: (dayMap.get(dk) ?? []).slice().sort(sortEntriesDesc),
    }));

    return {
      key: mk,
      label: monthLabelLocalized(language, mk),
      days,
    };
  });
}

function formatPause(minutes: number): string {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  if (m < 60) return `${m} Min`;
  return formatHM(m);
}

function formatDateDayLineLocalized(
  language: AppUiLanguage,
  yyyyMmDd: string
): string {
  return formatDateLocalized(language, yyyyMmDd);
}

function formatMinutesCompact(minutes: number) {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} Min`;
  return formatHM(mins);
}

function getDisplayChangeValue(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const nestedValue = value["value"];

  if (
    typeof nestedValue === "string" ||
    typeof nestedValue === "number" ||
    typeof nestedValue === "boolean" ||
    nestedValue === null
  ) {
    return nestedValue;
  }

  return value;
}

function formatUnknownChangeValue(value: unknown): string {
  const displayValue = getDisplayChangeValue(value);

  if (displayValue === null || displayValue === undefined || displayValue === "") {
    return "—";
  }

  if (typeof displayValue === "boolean") {
    return displayValue ? "Ja" : "Nein";
  }

  if (typeof displayValue === "number") {
    return String(displayValue);
  }

  if (typeof displayValue === "string") {
    return displayValue;
  }

  return JSON.stringify(displayValue);
}

function formatChangeReportDate(language: AppUiLanguage, iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

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
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

const CHANGE_REPORT_FIELD_KEYS = [
  "workDate",
  "startTime",
  "endTime",
  "activity",
  "location",
  "travelMinutes",
  "workMinutes",
  "breakMinutes",
  "noteEmployee",
] as const;

type ChangeReportFieldKey = (typeof CHANGE_REPORT_FIELD_KEYS)[number];

function normalizeChangeCompareValue(value: unknown): string {
  const displayValue = getDisplayChangeValue(value);

  if (displayValue === null || displayValue === undefined) {
    return "";
  }

  if (typeof displayValue === "string") {
    return displayValue.trim();
  }

  if (typeof displayValue === "number" || typeof displayValue === "boolean") {
    return String(displayValue);
  }

  return JSON.stringify(displayValue);
}

function getChangedReportFields(
  report: WorkEntryChangeReport
): ChangeReportFieldKey[] {
  if (report.action === "DELETE") {
    return [...CHANGE_REPORT_FIELD_KEYS].filter((key) => {
      return normalizeChangeCompareValue(report.oldValues[key]) !== "";
    });
  }

  if (!report.newValues) {
    return [];
  }

  return CHANGE_REPORT_FIELD_KEYS.filter((key) => {
    const oldValue = normalizeChangeCompareValue(report.oldValues[key]);
    const newValue = normalizeChangeCompareValue(report.newValues?.[key]);

    return oldValue !== newValue;
  });
}

function getChangeFieldLabel(
  language: AppUiLanguage,
  key: ChangeReportFieldKey
): string {
  switch (key) {
    case "workDate":
      return translate(language, "date", ERFASSUNG_DICTIONARY);
    case "startTime":
      return translate(language, "start", ERFASSUNG_DICTIONARY);
    case "endTime":
      return translate(language, "end", ERFASSUNG_DICTIONARY);
    case "activity":
      return translate(language, "performedActivity", ERFASSUNG_DICTIONARY);
    case "location":
      return translate(language, "location", ERFASSUNG_DICTIONARY);
    case "travelMinutes":
      return translate(language, "travelMinutes", ERFASSUNG_DICTIONARY);
    case "workMinutes":
      return translate(language, "netWorkTime", ERFASSUNG_DICTIONARY);
    case "breakMinutes":
      return translate(language, "break", ERFASSUNG_DICTIONARY);
    case "noteEmployee":
      return translate(language, "note", ERFASSUNG_DICTIONARY);
    default:
      return key;
  }
}

function hasCompleteTimeRange(startHHMM: string, endHHMM: string): boolean {
  return /^\d{2}:\d{2}$/.test(startHHMM) && /^\d{2}:\d{2}$/.test(endHHMM);
}


function hasMeaningfulEntryInput(params: {
  startTime: string;
  endTime: string;
}): boolean {
  const { startTime, endTime } = params;
  return hasCompleteTimeRange(startTime, endTime);
}

type EditForm = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  activity: string;
  location: string;
  travelMinutes: string;
  noteEmployee: string;
  userFullName: string;
};

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(":").map((x) => Number(x));
  const [eh, em] = endHHMM.split(":").map((x) => Number(x));
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return Math.max(0, end - start);
}

type EntryTimeDefaults = {
  startTime: string;
  endTime: string;
};

const DEFAULT_ENTRY_START_TIME = "07:00";
const DEFAULT_ENTRY_END_TIME = "14:00";
const FOLLOW_UP_ENTRY_MINUTES = 120;

function hhmmToMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hourValue, minuteValue] = value.split(":");
  const hours = Number(hourValue);
  const minutes = Number(minuteValue);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesToHHMM(totalMinutes: number): string {
  const clampedMinutes = Math.min(23 * 60 + 59, Math.max(0, Math.round(totalMinutes)));
  const hours = Math.floor(clampedMinutes / 60);
  const minutes = clampedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getNextEntryTimeDefaults(
  entries: WorkEntry[],
  workDate: string
): EntryTimeDefaults {
  const entriesForDay = entries
    .filter((entry) => toYMD(entry.workDate) === workDate)
    .map((entry) => {
      const endMinutes = hhmmToMinutes(entry.endTime);
      const startMinutes = hhmmToMinutes(entry.startTime);

      if (endMinutes === null || startMinutes === null) {
        return null;
      }

      return {
        startMinutes,
        endMinutes,
      };
    })
    .filter((entry): entry is { startMinutes: number; endMinutes: number } => entry !== null)
    .sort((a, b) => {
      if (a.endMinutes !== b.endMinutes) {
        return a.endMinutes - b.endMinutes;
      }

      return a.startMinutes - b.startMinutes;
    });

  if (entriesForDay.length === 0) {
    return {
      startTime: DEFAULT_ENTRY_START_TIME,
      endTime: DEFAULT_ENTRY_END_TIME,
    };
  }

  const lastEntry = entriesForDay[entriesForDay.length - 1];
  const defaultEndMinutes = hhmmToMinutes(DEFAULT_ENTRY_END_TIME) ?? 14 * 60;
  const nextStartMinutes = lastEntry.endMinutes;
  const nextEndMinutes =
    nextStartMinutes < defaultEndMinutes
      ? defaultEndMinutes
      : nextStartMinutes + FOLLOW_UP_ENTRY_MINUTES;

  return {
    startTime: minutesToHHMM(nextStartMinutes),
    endTime: minutesToHHMM(Math.max(nextStartMinutes, nextEndMinutes)),
  };
}

function legalBreakMinutes(grossMinutes: number): number {
  if (!Number.isFinite(grossMinutes) || grossMinutes <= 0) return 0;
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

type DayTotals = {
  grossDay: number;
  legalBreak: number;
  manualBreak: number;
  autoSupplement: number;
  effectiveBreak: number;
  breakAuto: boolean;
  netDay: number;
};

function computeManualBreakMinutes(startHHMM: string, endHHMM: string): number {
  if (!startHHMM || !endHHMM) return 0;
  return minutesBetween(startHHMM, endHHMM);
}

function computeEffectiveDayBreak(grossDay: number, manualBreak: number): DayTotals {
  const gross = Math.max(0, Math.round(grossDay));
  const manual = Math.max(0, Math.round(manualBreak));
  const legal = legalBreakMinutes(gross);
  const effective = Math.min(gross, Math.max(manual, legal));
  const autoSupplement = Math.max(0, effective - Math.min(manual, effective));

  return {
    grossDay: gross,
    legalBreak: legal,
    manualBreak: Math.min(manual, gross),
    autoSupplement,
    effectiveBreak: effective,
    breakAuto: autoSupplement > 0,
    netDay: Math.max(0, gross - effective),
  };
}

function computeDayTotals(
  entries: WorkEntry[],
  dayBreakMap: Map<string, DayBreak>,
  ymd: string,
  additionalGross: number,
  manualBreakOverride: number | null
): DayTotals {
  const grossExisting = entries
    .filter((e) => toYMD(e.workDate) === ymd)
    .reduce((sum, entry) => sum + (Number.isFinite(entry.grossMinutes) ? entry.grossMinutes : 0), 0);

  const grossDay = Math.max(0, Math.round(grossExisting + Math.max(0, Math.round(additionalGross))));
  const existingDayBreak = dayBreakMap.get(ymd);
  const manualBreak =
    manualBreakOverride !== null
      ? manualBreakOverride
      : existingDayBreak?.manualMinutes ?? 0;

  return computeEffectiveDayBreak(grossDay, manualBreak);
}

function buildDayTotalsMap(entries: WorkEntry[], dayBreakMap: Map<string, DayBreak>): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>();
  const days = new Set(entries.map((e) => toYMD(e.workDate)));

  for (const day of days) {
    map.set(day, computeDayTotals(entries, dayBreakMap, day, 0, null));
  }

  return map;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isCreateWorkEntryResponse(value: unknown): value is CreateWorkEntryResponse {
  if (!isRecord(value)) {
    return false;
  }

  const entry = value["entry"];

  return isRecord(entry) && isString(entry["id"]);
}

function isMonthlyConfirmationEntry(value: unknown): value is MonthlyConfirmationEntry {
  return (
    isRecord(value) &&
    isString(value["id"]) &&
    isString(value["workDate"]) &&
    isString(value["startTime"]) &&
    isString(value["endTime"]) &&
    isString(value["activity"]) &&
    isString(value["location"]) &&
    typeof value["travelMinutes"] === "number" &&
    typeof value["grossMinutes"] === "number" &&
    typeof value["breakMinutes"] === "number" &&
    typeof value["workMinutes"] === "number" &&
    isString(value["noteEmployee"])
  );
}

function isMonthlyConfirmationStatusResponse(
  value: unknown
): value is MonthlyConfirmationStatusResponse {
  return (
    isRecord(value) &&
    value["ok"] === true &&
    typeof value["shouldOpen"] === "boolean" &&
    isString(value["reason"]) &&
    typeof value["year"] === "number" &&
    typeof value["month"] === "number" &&
    isString(value["lastWorkday"]) &&
    Array.isArray(value["entries"]) &&
    value["entries"].every(isMonthlyConfirmationEntry) &&
    (
      value["requiredUntilAt"] === undefined ||
      value["requiredUntilAt"] === null ||
      isString(value["requiredUntilAt"])
    ) &&
    (
      value["confirmationText"] === undefined ||
      isString(value["confirmationText"])
    )
  );
}

function replaceTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

function getAdditionalEntryHintText(args: {
  language: AppUiLanguage;
  entryCount: number;
  startTime: string;
  endTime: string;
}): string {
  const entryLabel =
    args.entryCount === 1 ? "ein Eintrag" : `${args.entryCount} Einträge`;

  switch (args.language) {
    case "EN":
      return `There is already ${args.entryCount === 1 ? "one entry" : `${args.entryCount} entries`} for this day. The times have been preset for another possible assignment on this day: ${args.startTime}–${args.endTime}.`;
    case "IT":
      return `Per questo giorno è già presente ${args.entryCount === 1 ? "una registrazione" : `${args.entryCount} registrazioni`}. Gli orari sono stati preimpostati per un ulteriore possibile intervento in questo giorno: ${args.startTime}–${args.endTime}.`;
    case "TR":
      return `Bu gün için zaten ${args.entryCount === 1 ? "bir kayıt" : `${args.entryCount} kayıt`} var. Saatler, aynı gün içinde olası başka bir görev için önceden ayarlandı: ${args.startTime}–${args.endTime}.`;
    case "SQ":
      return `Për këtë ditë ekziston tashmë ${args.entryCount === 1 ? "një hyrje" : `${args.entryCount} hyrje`}. Orët janë paracaktuar për një angazhim tjetër të mundshëm në këtë ditë: ${args.startTime}–${args.endTime}.`;
    case "KU":
      return `Ji bo vê rojê jixwe ${args.entryCount === 1 ? "tometek" : `${args.entryCount} tomar`} heye. Dem ji bo karekî din ê gengaz di vê rojê de hatine amadekirin: ${args.startTime}–${args.endTime}.`;
    case "RO":
      return `Pentru această zi există deja ${args.entryCount === 1 ? "o înregistrare" : `${args.entryCount} înregistrări`}. Orele au fost presetate pentru o posibilă altă intervenție în această zi: ${args.startTime}–${args.endTime}.`;
    case "DE":
    default:
      return `Für diesen Tag ist bereits ${entryLabel} vorhanden. Die Zeiten wurden für einen weiteren möglichen Einsatz an diesem Tag voreingestellt: ${args.startTime}–${args.endTime}.`;
  }
}

function getMonthName(language: AppUiLanguage, month: number): string {
  const keys = [
    "monthJanuary",
    "monthFebruary",
    "monthMarch",
    "monthApril",
    "monthMay",
    "monthJune",
    "monthJuly",
    "monthAugust",
    "monthSeptember",
    "monthOctober",
    "monthNovember",
    "monthDecember",
  ] as const;

  const key = keys[month - 1];
  return key ? translate(language, key, ERFASSUNG_DICTIONARY) : String(month);
}

function getWeekdayShort(language: AppUiLanguage, weekdayIndex: number): string {
  const keys = [
    "weekdaySundayShort",
    "weekdayMondayShort",
    "weekdayTuesdayShort",
    "weekdayWednesdayShort",
    "weekdayThursdayShort",
    "weekdayFridayShort",
    "weekdaySaturdayShort",
  ] as const;

  const key = keys[weekdayIndex];
  return key ? translate(language, key, ERFASSUNG_DICTIONARY) : "";
}

function getLegalBreakHintLines(language: AppUiLanguage): string[] {
  return [
    translate(language, "legalBreakHeadline", ERFASSUNG_DICTIONARY),
    translate(language, "legalBreakAfterSixHours", ERFASSUNG_DICTIONARY),
    translate(language, "legalBreakAfterNineHours", ERFASSUNG_DICTIONARY),
  ];
}

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;

  const userId = v.userId;
  const fullName = v.fullName;
  const role = v.role;
  const language = v.language;
  const companyId = v.companyId;
  const companyName = v.companyName;
  const companySubdomain = v.companySubdomain;
  const companyLogoUrl = v.companyLogoUrl;
  const primaryColor = v.primaryColor;

  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN") &&
    (language === "DE" ||
      language === "EN" ||
      language === "IT" ||
      language === "TR" ||
      language === "SQ" ||
      language === "KU" ||
      language === "RO") &&
    typeof companyId === "string" &&
    typeof companyName === "string" &&
    typeof companySubdomain === "string" &&
    (typeof companyLogoUrl === "string" || companyLogoUrl === null) &&
    (typeof primaryColor === "string" || primaryColor === null)
  );
}

type MeApiResponse = { session: SessionData | null };

function isMeApiResponse(v: unknown): v is MeApiResponse {
  return isRecord(v) && "session" in v && (v.session === null || isSessionData(v.session));
}

function isPastWorkDate(dateYMD: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYMD)) return false;
  return dateYMD < toIsoDateLocal(new Date());
}

function toBerlinDateYMDFromIso(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function addDaysToYMD(dateYMD: string, days: number): string {
  const [yearValue, monthValue, dayValue] = dateYMD.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return "";
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return toIsoDateLocal(date);
}

function requiresEditRequestForEntry(entry: {
  createdAt: string;
}): boolean {
  const today = toIsoDateLocal(new Date());
  const createdDateYMD = toBerlinDateYMDFromIso(entry.createdAt);

  if (!createdDateYMD) {
    return true;
  }

  const firstBlockedDateYMD = addDaysToYMD(createdDateYMD, 3);

  if (!firstBlockedDateYMD) {
    return true;
  }

  return today >= firstBlockedDateYMD;
}

function formatCorrectionRange(
  language: AppUiLanguage,
  startDate: string,
  endDate: string
): string {
  const formattedStart = formatDateLocalized(language, startDate);
  const formattedEnd = formatDateLocalized(language, endDate);

  return startDate === endDate
    ? formattedStart
    : `${formattedStart} ${translate(language, "to", ERFASSUNG_DICTIONARY)} ${formattedEnd}`;
}

function getMonthlyConfirmationTitle(
  language: AppUiLanguage,
  monthLabel: string
): string {
  switch (language) {
    case "EN":
      return `Confirm work entries for ${monthLabel}`;
    case "IT":
      return `Conferma le registrazioni di lavoro per ${monthLabel}`;
    case "TR":
      return `${monthLabel} çalışma kayıtlarını onayla`;
    case "SQ":
      return `Konfirmo regjistrimet e punës për ${monthLabel}`;
    case "KU":
      return `Tomarên karê ji bo ${monthLabel} piştrast bike`;
    case "RO":
      return `Confirmați înregistrările de lucru pentru ${monthLabel}`;
    case "DE":
    default:
      return `Arbeitszeiten für ${monthLabel} bestätigen`;
  }
}

function getMonthlyConfirmationIntro(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Please review the entries listed below. They are initially collapsed and can be opened individually.";
    case "IT":
      return "Controlla le registrazioni elencate di seguito. All'inizio sono chiuse e possono essere aperte singolarmente.";
    case "TR":
      return "Lütfen aşağıdaki kayıtları kontrol edin. Kayıtlar başlangıçta kapalıdır ve tek tek açılabilir.";
    case "SQ":
      return "Ju lutem kontrolloni regjistrimet më poshtë. Ato janë fillimisht të mbyllura dhe mund të hapen veçmas.";
    case "KU":
      return "Ji kerema xwe tomarên jêrîn kontrol bike. Di destpêkê de girtî ne û dikarin yek bi yek bên vekirin.";
    case "RO":
      return "Vă rugăm să verificați înregistrările de mai jos. Inițial sunt pliate și pot fi deschise individual.";
    case "DE":
    default:
      return "Bitte prüfe die unten aufgeführten Einträge. Sie sind zunächst eingeklappt und können einzeln geöffnet werden.";
  }
}

function getMonthlyConfirmationLegalNotice(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "By confirming, you declare that the listed entries are correct to the best of your knowledge. Intentionally or negligently false information may have consequences.";
    case "IT":
      return "Con la conferma dichiari che le registrazioni elencate sono corrette secondo scienza e coscienza. Informazioni intenzionalmente o negligentemente errate possono avere conseguenze.";
    case "TR":
      return "Onaylayarak, listelenen kayıtların bildiğiniz kadarıyla doğru olduğunu beyan edersiniz. Kasıtlı veya ihmalkâr şekilde yanlış bilgi verilmesi sonuçlar doğurabilir.";
    case "SQ":
      return "Me konfirmimin deklaroni se regjistrimet e listuara janë të sakta sipas njohurive tuaja më të mira. Të dhënat qëllimisht ose nga pakujdesia të pasakta mund të kenë pasoja.";
    case "KU":
      return "Bi piştrastkirinê tu radigihînî ku tomarên lîstekirî li gor zanîna te rast in. Agahiyên bi qest an bi bêhişyarî şaş dikarin encamên xwe hebin.";
    case "RO":
      return "Prin confirmare declarați că înregistrările listate sunt corecte după cunoștința dumneavoastră. Informațiile false intenționate sau din neglijență pot avea consecințe.";
    case "DE":
    default:
      return "Mit der Bestätigung erklärst du, dass die aufgeführten Einträge nach bestem Wissen und Gewissen korrekt sind. Vorsätzlich oder fahrlässig falsche Angaben können Konsequenzen haben.";
  }
}

function getMonthlyConfirmationRejectReasonLabel(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Reason for rejection";
    case "IT":
      return "Motivo del rifiuto";
    case "TR":
      return "Reddetme nedeni";
    case "SQ":
      return "Arsyeja e refuzimit";
    case "KU":
      return "Sedema redkirinê";
    case "RO":
      return "Motivul respingerii";
    case "DE":
    default:
      return "Grund der Ablehnung";
  }
}

function getMonthlyConfirmationRejectReasonPlaceholder(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Please describe what still needs to be corrected.";
    case "IT":
      return "Descrivi cosa deve ancora essere corretto.";
    case "TR":
      return "Lütfen neyin düzeltilmesi gerektiğini açıklayın.";
    case "SQ":
      return "Ju lutem përshkruani çfarë duhet korrigjuar ende.";
    case "KU":
      return "Ji kerema xwe binivîse ka çi hêj divê were rastkirin.";
    case "RO":
      return "Vă rugăm să descrieți ce mai trebuie corectat.";
    case "DE":
    default:
      return "Bitte beschreibe, was noch korrigiert werden muss.";
  }
}

function getMonthlyConfirmationConfirmButton(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Confirm entries";
    case "IT":
      return "Conferma registrazioni";
    case "TR":
      return "Kayıtları onayla";
    case "SQ":
      return "Konfirmo regjistrimet";
    case "KU":
      return "Tomaran piştrast bike";
    case "RO":
      return "Confirmați înregistrările";
    case "DE":
    default:
      return "Einträge bestätigen";
  }
}

function getMonthlyConfirmationRejectButton(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Reject";
    case "IT":
      return "Rifiuta";
    case "TR":
      return "Reddet";
    case "SQ":
      return "Refuzo";
    case "KU":
      return "Red bike";
    case "RO":
      return "Respinge";
    case "DE":
    default:
      return "Ablehnen";
  }
}

function getMonthlyConfirmationRejectedTaskHint(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "After rejection, a task will be created. You must confirm the work entries by 22:00 today.";
    case "IT":
      return "Dopo il rifiuto verrà creata un'attività. Devi confermare le registrazioni entro le 22:00 di oggi.";
    case "TR":
      return "Reddettikten sonra bir görev oluşturulur. Çalışma kayıtlarını bugün saat 22:00'ye kadar onaylamalısınız.";
    case "SQ":
      return "Pas refuzimit krijohet një detyrë. Duhet t'i konfirmoni regjistrimet deri sot në orën 22:00.";
    case "KU":
      return "Piştî redkirinê erkek tê çêkirin. Divê tu tomarên karê heta îro saet 22:00 piştrast bikî.";
    case "RO":
      return "După respingere va fi creată o sarcină. Trebuie să confirmați înregistrările astăzi până la ora 22:00.";
    case "DE":
    default:
      return "Nach der Ablehnung wird eine Aufgabe erstellt. Du musst die Arbeitszeiten spätestens heute bis 22:00 Uhr bestätigen.";
  }
}

function getMonthlyConfirmationReasonRequired(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Please enter a reason for the rejection.";
    case "IT":
      return "Inserisci un motivo per il rifiuto.";
    case "TR":
      return "Lütfen reddetme nedeni girin.";
    case "SQ":
      return "Ju lutem shkruani një arsye për refuzimin.";
    case "KU":
      return "Ji kerema xwe sedema redkirinê binivîse.";
    case "RO":
      return "Vă rugăm să introduceți un motiv pentru respingere.";
    case "DE":
    default:
      return "Bitte gib einen Grund für die Ablehnung an.";
  }
}

function getMonthlyConfirmationError(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Monthly confirmation could not be processed.";
    case "IT":
      return "Impossibile elaborare la conferma mensile.";
    case "TR":
      return "Aylık onay işlenemedi.";
    case "SQ":
      return "Konfirmimi mujor nuk mund të përpunohej.";
    case "KU":
      return "Piştrastkirina mehane nehat xebitandin.";
    case "RO":
      return "Confirmarea lunară nu a putut fi procesată.";
    case "DE":
    default:
      return "Monatsbestätigung konnte nicht verarbeitet werden.";
  }
}

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ErfassungPageInner />
    </React.Suspense>
  );
}

function ErfassungPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = React.useCallback(
    (key: ErfassungTextKey): string =>
      translate(language, key, ERFASSUNG_DICTIONARY),
    [language]
  );
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meResolved, setMeResolved] = useState(false);

  // Create-Form (ohne fullName)
  const [workDate, setWorkDate] = useState<string>(() => toIsoDateLocal(new Date()));
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("14:00");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [travelMinutes, setTravelMinutes] = useState<string>("0");
  const [noteEmployee, setNoteEmployee] = useState("");
  const [showSyncToast, setShowSyncToast] = useState(false);

  const [dayBreaks, setDayBreaks] = useState<DayBreak[]>([]);
  const [breakStartHHMM, setBreakStartHHMM] = useState("");
  const [breakEndHHMM, setBreakEndHHMM] = useState("");
  const [breakSaving, setBreakSaving] = useState(false);
  const [breakError, setBreakError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("ALLE");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editChangeReason, setEditChangeReason] = useState("");
  const [edit, setEdit] = useState<EditForm | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteEntry, setNoteEntry] = useState<WorkEntry | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEntry, setDetailsEntry] = useState<WorkEntry | null>(null);

  const [changeReportsOpen, setChangeReportsOpen] = useState(false);
  const [changeReportsLoading, setChangeReportsLoading] = useState(false);
  const [changeReportsError, setChangeReportsError] = useState<string | null>(null);
  const [changeReportsEntry, setChangeReportsEntry] = useState<WorkEntry | null>(null);
  const [changeReports, setChangeReports] = useState<WorkEntryChangeReport[]>([]);

  const [highlightedEntryId, setHighlightedEntryId] = useState<string>("");
  const openedPushEntryIdRef = useRef<string>("");

  const [breakInfoOpen, setBreakInfoOpen] = useState(false);
  const [breakInfoDate, setBreakInfoDate] = useState<string>("");
  const [breakInfoManualStart, setBreakInfoManualStart] = useState<string>("");
  const [breakInfoManualEnd, setBreakInfoManualEnd] = useState<string>("");
  const [breakInfoManualMinutes, setBreakInfoManualMinutes] = useState<number>(0);
  const [breakInfoLegalMinutes, setBreakInfoLegalMinutes] = useState<number>(0);
  const [breakInfoAutoMinutes, setBreakInfoAutoMinutes] = useState<number>(0);
  const [breakInfoEffectiveMinutes, setBreakInfoEffectiveMinutes] = useState<number>(0);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionRequests, setCorrectionRequests] = useState<TimeEntryCorrectionRequest[]>([]);
  const [loadingCorrectionRequests, setLoadingCorrectionRequests] = useState(false);
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] =
    useState<TimeEntryCorrectionRequestStatusResponse | null>(null);
  const sourceTaskId = useMemo(() => {
    const value = searchParams.get("sourceTaskId");
    return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
  }, [searchParams]);

  const confirmMonthParam = useMemo(() => {
    const value = searchParams.get("confirmMonth");
    return typeof value === "string" && /^\d{4}-\d{2}$/.test(value)
      ? value
      : "";
  }, [searchParams]);

  const syncDateParam = useMemo(() => {
    const value = searchParams.get("syncDate");
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : "";
  }, [searchParams]);

  const pushEntryIdParam = useMemo(() => {
    const value = searchParams.get("entryId");
    return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
  }, [searchParams]);

  const hasAdminTaskBypassForSelectedDate =
    selectedCorrectionStatus?.adminTaskBypass?.active === true &&
    selectedCorrectionStatus.adminTaskBypass.workDate === workDate;
  const syncActivityParam = useMemo(() => {
    const value = searchParams.get("syncActivity");
    return typeof value === "string" ? value.trim() : "";
  }, [searchParams]);

  const syncLocationParam = useMemo(() => {
    const value = searchParams.get("syncLocation");
    return typeof value === "string" ? value.trim() : "";
  }, [searchParams]);

  const syncToastMessage = useMemo(() => {
    if (sourceTaskId) {
      return t("syncTaskTaken");
    }

    if (syncDateParam && !syncActivityParam && !syncLocationParam) {
      return t("syncDateTaken");
    }

    if (syncDateParam) {
      return t("syncPlanTaken");
    }

    return t("syncPlanTaken");
  }, [sourceTaskId, syncDateParam, syncActivityParam, syncLocationParam, t]);
  const [loadingSelectedCorrectionStatus, setLoadingSelectedCorrectionStatus] = useState(false);

  const [monthlyConfirmationOpen, setMonthlyConfirmationOpen] = useState(false);
  const [monthlyConfirmationLoading, setMonthlyConfirmationLoading] = useState(false);
  const [monthlyConfirmationSaving, setMonthlyConfirmationSaving] = useState(false);
  const [monthlyConfirmationError, setMonthlyConfirmationError] = useState<string | null>(null);
  const [monthlyConfirmationData, setMonthlyConfirmationData] =
    useState<MonthlyConfirmationStatusResponse | null>(null);
  const [monthlyConfirmationRejectReason, setMonthlyConfirmationRejectReason] = useState("");

  const grossPreviewMinutes = useMemo(() => minutesBetween(startTime, endTime), [startTime, endTime]);
  const isEntryPreviewActive = useMemo(() => {
    return hasMeaningfulEntryInput({
      startTime,
      endTime,
    });
  }, [startTime, endTime]);

  const entriesForSelectedDay = useMemo(() => {
    return entries
      .filter((entry) => toYMD(entry.workDate) === workDate)
      .sort((a, b) => {
        const startCompare = a.startTime.localeCompare(b.startTime);

        if (startCompare !== 0) {
          return startCompare;
        }

        return a.endTime.localeCompare(b.endTime);
      });
  }, [entries, workDate]);

  const hasSavedEntriesForSelectedDay = entriesForSelectedDay.length > 0;

  const additionalEntryHintText = useMemo(() => {
    if (!hasSavedEntriesForSelectedDay) {
      return "";
    }

    return getAdditionalEntryHintText({
      language,
      entryCount: entriesForSelectedDay.length,
      startTime,
      endTime,
    });
  }, [
    hasSavedEntriesForSelectedDay,
    language,
    entriesForSelectedDay.length,
    startTime,
    endTime,
  ]);

  const shouldShowEntryComputation = useMemo(() => {
    return isEntryPreviewActive;
  }, [isEntryPreviewActive]);

  const shouldShowBreakComputation = useMemo(() => {
    return hasSavedEntriesForSelectedDay;
  }, [hasSavedEntriesForSelectedDay]);

  const dayBreakMap = useMemo(() => {
    const map = new Map<string, DayBreak>();
    for (const item of dayBreaks) {
      map.set(item.workDate, item);
    }
    return map;
  }, [dayBreaks]);

  const selectedDayBreak = useMemo(() => {
    return dayBreakMap.get(workDate) ?? null;
  }, [dayBreakMap, workDate]);

  const currentBreakFormManualMinutes = useMemo(() => {
    return computeManualBreakMinutes(breakStartHHMM, breakEndHHMM);
  }, [breakStartHHMM, breakEndHHMM]);

  const dayPreview = useMemo(() => {
    if (!shouldShowEntryComputation) {
      return null;
    }

    const overrideManual =
      breakStartHHMM && breakEndHHMM ? currentBreakFormManualMinutes : 0;

    return computeDayTotals(entries, dayBreakMap, workDate, grossPreviewMinutes, overrideManual);
  }, [
    shouldShowEntryComputation,
    entries,
    dayBreakMap,
    workDate,
    grossPreviewMinutes,
    breakStartHHMM,
    breakEndHHMM,
    currentBreakFormManualMinutes,
  ]);

  useEffect(() => {
    const syncActivity = searchParams.get("syncActivity");
    const syncLocation = searchParams.get("syncLocation");

    const hasSyncValues =
      syncDateParam !== "" ||
      (typeof syncActivity === "string" && syncActivity.trim() !== "") ||
      (typeof syncLocation === "string" && syncLocation.trim() !== "") ||
      sourceTaskId !== "";

    if (!hasSyncValues) {
      return;
    }

    if (syncDateParam) {
      setWorkDate(syncDateParam);
    }

    if (typeof syncActivity === "string" && syncActivity.trim() !== "") {
      setActivity(syncActivity);
    }

    if (typeof syncLocation === "string" && syncLocation.trim() !== "") {
      setLocation(syncLocation);
    }

    const nextWorkDate = syncDateParam || workDate;
    applyEntryTimeDefaultsForDate(nextWorkDate, entries);
    setShowSyncToast(true);
  }, [searchParams, sourceTaskId, syncDateParam]);

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      const r = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const j: unknown = await r.json().catch(() => ({}));

      if (!alive) return;

      if (!isMeApiResponse(j) || !j.session) {
        router.replace("/login");
        return;
      }

      if (j.session.role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }

      setLanguage(j.session.language);

      setMe({
        ok: true,
        session: {
          userId: j.session.userId,
          fullName: j.session.fullName,
          role: j.session.role,
          language: j.session.language,
          companyId: j.session.companyId,
          companyName: j.session.companyName,
          companySubdomain: j.session.companySubdomain,
          companyLogoUrl: j.session.companyLogoUrl,
          primaryColor: j.session.primaryColor,
        },
      });
    } catch {
      if (!alive) return;
      router.replace("/login");
      return;
    } finally {
      if (alive) {
        setMeResolved(true);
      }
    }
  })();

  return () => {
    alive = false;
  };
}, [router]);

  async function loadEntries(): Promise<WorkEntry[]> {
    setLoadingEntries(true);

    try {
      const r = await fetch("/api/entries", {
        credentials: "include",
      });

      const j = (await r.json()) as unknown;

      const entriesList =
        typeof j === "object" &&
        j !== null &&
        "entries" in j &&
        Array.isArray((j as { entries: unknown }).entries)
          ? ((j as { entries: WorkEntry[] }).entries ?? [])
          : [];

      const dayBreakList =
        typeof j === "object" &&
        j !== null &&
        "dayBreaks" in j &&
        Array.isArray((j as { dayBreaks: unknown }).dayBreaks)
          ? ((j as { dayBreaks: DayBreak[] }).dayBreaks ?? [])
          : [];

      setEntries(entriesList);
      setDayBreaks(dayBreakList);

      return entriesList;
    } finally {
      setLoadingEntries(false);
    }
  }

  async function loadCorrectionRequests() {
    setLoadingCorrectionRequests(true);
    try {
      const r = await fetch("/api/time-entry-correction-requests", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const j = (await r.json()) as unknown;

      const requestsList =
        typeof j === "object" &&
        j !== null &&
        "requests" in j &&
        Array.isArray((j as { requests: unknown }).requests)
          ? ((j as { requests: TimeEntryCorrectionRequest[] }).requests ?? [])
          : [];

      setCorrectionRequests(requestsList);
    } finally {
      setLoadingCorrectionRequests(false);
    }
  }
  const loadSelectedCorrectionStatus = React.useCallback(async (dateYMD: string) => {
    if (!isPastWorkDate(dateYMD)) {
      setSelectedCorrectionStatus(null);
      return;
    }

    setLoadingSelectedCorrectionStatus(true);
    try {
      const params = new URLSearchParams();
      params.set("workDate", dateYMD);

      if (sourceTaskId) {
        params.set("sourceTaskId", sourceTaskId);
      }

      const r = await fetch(
        `/api/time-entry-correction-requests/status?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const j = (await r.json()) as unknown;

      if (!r.ok || !isTimeEntryCorrectionRequestStatusResponse(j)) {
        setSelectedCorrectionStatus(null);
        return;
      }

      setSelectedCorrectionStatus(j);
    } finally {
      setLoadingSelectedCorrectionStatus(false);
    }
  }, [sourceTaskId]);

  const monthlyConfirmationWasRejected =
    monthlyConfirmationData?.reason === "REJECTED_NEEDS_CONFIRMATION";

  const monthlyConfirmationMonthLabel = useMemo(() => {
    const year = monthlyConfirmationData?.year ?? Number(confirmMonthParam.slice(0, 4));
    const month = monthlyConfirmationData?.month ?? Number(confirmMonthParam.slice(5, 7));

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return "";
    }

    return `${getMonthName(language, month)} ${year}`;
  }, [monthlyConfirmationData, confirmMonthParam, language]);

  const loadMonthlyConfirmationStatus = React.useCallback(async (
    explicitMonth?: string
  ) => {
    setMonthlyConfirmationLoading(true);
    setMonthlyConfirmationError(null);

    try {
      const params = new URLSearchParams();
      const monthToCheck = explicitMonth || confirmMonthParam;

      if (monthToCheck && /^\d{4}-\d{2}$/.test(monthToCheck)) {
        params.set("month", monthToCheck);
      }

      const url = params.toString()
        ? `/api/monthly-work-entry-confirmations/status?${params.toString()}`
        : "/api/monthly-work-entry-confirmations/status";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok || !isMonthlyConfirmationStatusResponse(data)) {
        setMonthlyConfirmationData(null);
        return;
      }

      setMonthlyConfirmationData(data);

      if (data.shouldOpen) {
        setMonthlyConfirmationOpen(true);
      }
    } finally {
      setMonthlyConfirmationLoading(false);
    }
  }, [confirmMonthParam]);

  function applyEntryTimeDefaultsForDate(
    nextWorkDate: string,
    nextEntries: WorkEntry[]
  ) {
    const defaults = getNextEntryTimeDefaults(nextEntries, nextWorkDate);

    setStartTime(defaults.startTime);
    setEndTime(defaults.endTime);
  }

  useEffect(() => {
    void (async () => {
      const loadedEntries = await loadEntries();
      applyEntryTimeDefaultsForDate(workDate, loadedEntries);
      await loadCorrectionRequests();
    })();
  }, []);

  useEffect(() => {
    if (!me || !me.ok || me.session?.role !== "EMPLOYEE") {
      return;
    }

    void loadMonthlyConfirmationStatus();
  }, [me, loadMonthlyConfirmationStatus]);

  useEffect(() => {
    void loadSelectedCorrectionStatus(workDate);
  }, [workDate, sourceTaskId, loadSelectedCorrectionStatus]);

    useEffect(() => {
    setBreakStartHHMM(selectedDayBreak?.breakStartHHMM ?? "");
    setBreakEndHHMM(selectedDayBreak?.breakEndHHMM ?? "");
    setBreakError(null);
  }, [selectedDayBreak, workDate]);

  async function saveEntry() {
    setError(null);

    if (!activity.trim()) return setError(t("enterActivity"));
    if (!location.trim()) return setError(t("enterLocation"));
    if (!me || !me.ok) return setError(t("loginAgain"));

    setSaving(true);
    try {
      const payload = {
        workDate,
        startTime,
        endTime,
        activity: activity.trim(),
        location: location.trim(),
        travelMinutes: Number(travelMinutes) || 0,
        noteEmployee: noteEmployee.trim(),
        sourceTaskId: sourceTaskId || null,
      };

      const r = await fetch("/api/entries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await r.text();

      let j: unknown = null;

      try {
        j = responseText ? (JSON.parse(responseText) as unknown) : null;
      } catch {
        j = null;
      }

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : responseText.trim() || t("saveFailed");

        setError(msg);
        return;
      }

      const createdEntryId = isCreateWorkEntryResponse(j) ? j.entry.id : "";

      setActivity("");
      setLocation("");
      setTravelMinutes("0");
      setNoteEmployee("");

      const refreshedEntries = await loadEntries();
      applyEntryTimeDefaultsForDate(workDate, refreshedEntries);

      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
      await loadMonthlyConfirmationStatus(workDate.slice(0, 7));

      if (createdEntryId) {
        const createdEntry = refreshedEntries.find((entry) => entry.id === createdEntryId);

        if (createdEntry) {
          const createdEntryYear = toYMD(createdEntry.workDate).slice(0, 4);

          if (/^\d{4}$/.test(createdEntryYear)) {
            setSelectedYear(createdEntryYear);
          }

          window.setTimeout(() => {
            scrollToEntryInList(createdEntry);
          }, 280);
        }
      }
    } catch {
      setError(t("networkSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/entries?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    await loadEntries();
  }

  function openEditModal(e: WorkEntry) {
    setEditError(null);
    setEditSuccess(null);
    setEditChangeReason("");
    setEdit({
      id: e.id,
      userFullName: e.user?.fullName ?? t("unknown"),
      workDate: toYMD(e.workDate),
      startTime: e.startTime,
      endTime: e.endTime,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      activity: e.activity ?? "",
      location: e.location ?? "",
      travelMinutes: String(e.travelMinutes ?? 0),
      noteEmployee: e.noteEmployee ?? "",
    });
    setEditOpen(true);
  }

  function openNoteModal(e: WorkEntry) {
  setNoteEntry(e);
  setNoteOpen(true);
}

  function openDetailsModal(e: WorkEntry) {
    setDetailsEntry(e);
    setDetailsOpen(true);
  }

  async function openChangeReportsModal(e: WorkEntry) {
    setChangeReportsEntry(e);
    setChangeReports([]);
    setChangeReportsError(null);
    setChangeReportsOpen(true);
    setChangeReportsLoading(true);

    try {
      const response = await fetch(`/api/entries/${encodeURIComponent(e.id)}/change-reports`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok || !isWorkEntryChangeReportsResponse(data)) {
        setChangeReportsError(t("changeReportLoadFailed"));
        return;
      }

      setChangeReports(data.reports);
    } catch {
      setChangeReportsError(t("changeReportLoadFailed"));
    } finally {
      setChangeReportsLoading(false);
    }
  }

  function scrollToEntryInList(entry: WorkEntry) {
    const monthKey = monthKeyFromWorkDate(entry.workDate);
    const dayKey = toYMD(entry.workDate);

    document
      .querySelectorAll<HTMLDetailsElement>("[data-entry-month]")
      .forEach((details) => {
        details.open = false;
      });

    document
      .querySelectorAll<HTMLDetailsElement>("[data-entry-day]")
      .forEach((details) => {
        details.open = false;
      });

    const monthDetails = document.querySelector<HTMLDetailsElement>(
      `[data-entry-month="${monthKey}"]`
    );

    if (monthDetails) {
      monthDetails.open = true;
    }

    const dayDetails = document.querySelector<HTMLDetailsElement>(
      `[data-entry-day="${dayKey}"]`
    );

    if (dayDetails) {
      dayDetails.open = true;
    }

    window.setTimeout(() => {
      const entryElement = document.querySelector<HTMLElement>(
        `[data-work-entry-id="${entry.id}"]`
      );

      if (!entryElement) {
        return;
      }

      entryElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setHighlightedEntryId(entry.id);

      window.setTimeout(() => {
        setHighlightedEntryId((current) => (current === entry.id ? "" : current));
      }, 4500);
    }, 220);
  }

  useEffect(() => {
    if (!pushEntryIdParam || loadingEntries) {
      return;
    }

    if (openedPushEntryIdRef.current === pushEntryIdParam) {
      return;
    }

    const targetEntry = entries.find((entry) => entry.id === pushEntryIdParam);

    if (!targetEntry) {
      return;
    }

    openedPushEntryIdRef.current = pushEntryIdParam;
    scrollToEntryInList(targetEntry);
  }, [pushEntryIdParam, loadingEntries, entries]);

  function openBreakInfoModal(dayBreak: DayBreak | null, date: string) {
    setBreakInfoDate(date);
    setBreakInfoManualStart(dayBreak?.breakStartHHMM ?? "");
    setBreakInfoManualEnd(dayBreak?.breakEndHHMM ?? "");
    setBreakInfoManualMinutes(dayBreak?.manualMinutes ?? 0);
    setBreakInfoLegalMinutes(dayBreak?.legalMinutes ?? 0);
    setBreakInfoAutoMinutes(dayBreak?.autoSupplementMinutes ?? 0);
    setBreakInfoEffectiveMinutes(dayBreak?.effectiveMinutes ?? 0);
    setBreakInfoOpen(true);
  }

  async function submitEditRequest() {
    if (!edit) return;

    setEditError(null);
    setEditSuccess(null);

    if (!edit.activity.trim()) return setEditError(t("enterActivity"));
    if (!edit.location.trim()) return setEditError(t("enterLocation"));
    if (!edit.workDate || !edit.startTime || !edit.endTime) {
      return setEditError(t("dateStartEndMissing"));
    }

    if (!editChangeReason.trim()) {
      return setEditError(t("editRequestReasonRequired"));
    }

    setEditSaving(true);

    try {
      const response = await fetch("/api/work-entry-edit-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workEntryId: edit.id,
          requestedWorkDate: edit.workDate,
          requestedStartTime: edit.startTime,
          requestedEndTime: edit.endTime,
          requestedActivity: edit.activity.trim(),
          requestedLocation: edit.location.trim(),
          requestedTravelMinutes: Number(edit.travelMinutes) || 0,
          requestedNoteEmployee: edit.noteEmployee.trim(),
          reason: editChangeReason.trim(),
        }),
      });

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("editRequestCreateFailed");

        setEditError(message);
        return;
      }

      setEditSuccess(t("editRequestSentSuccess"));
      setEditChangeReason("");
      await loadEntries();
      window.dispatchEvent(new Event("admin-requests-changed"));
    } catch {
      setEditError(t("networkEditRequestError"));
    } finally {
      setEditSaving(false);
    }
  }

  async function saveEdit() {
    if (!edit) return;
    if (requiresEditRequestForEntry(edit)) {
      await submitEditRequest();
      return;
    }
    setEditError(null);
    if (!edit.activity.trim()) return setEditError(t("enterActivity"));
    if (!edit.location.trim()) return setEditError(t("enterLocation"));
    if (!edit.workDate || !edit.startTime || !edit.endTime) {
      return setEditError(t("dateStartEndMissing"));
    }

    setEditSaving(true);
    try {
      const payload = {
        id: edit.id,
        workDate: edit.workDate,
        startTime: edit.startTime,
        endTime: edit.endTime,
        activity: edit.activity.trim(),
        location: edit.location.trim(),
        travelMinutes: Number(edit.travelMinutes) || 0,
        noteEmployee: edit.noteEmployee.trim(),
      };

      const r = await fetch("/api/entries", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await r.text();

      let j: unknown = null;

      try {
        j = responseText ? (JSON.parse(responseText) as unknown) : null;
      } catch {
        j = null;
      }

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : responseText.trim() || t("changesSaveFailed");

        setEditError(msg);
        return;
      }

      const updated =
        typeof j === "object" && j !== null && "entry" in j && typeof (j as { entry: unknown }).entry === "object"
          ? ((j as { entry: WorkEntry }).entry as WorkEntry)
          : null;

      if (updated) {
        setEntries((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        await loadEntries();
        await loadCorrectionRequests();
        await loadSelectedCorrectionStatus(edit.workDate);
      }

      setEditOpen(false);
      setEdit(null);
    } catch {
      setEditError(t("networkSaveError"));
    } finally {
      setEditSaving(false);
    }
  }

    async function saveDayBreak() {
    setBreakError(null);

    if ((breakStartHHMM && !breakEndHHMM) || (!breakStartHHMM && breakEndHHMM)) {
      setBreakError(t("saveBreakIncomplete"));
      return;
    }

    setBreakSaving(true);
    try {
      const r = await fetch("/api/day-breaks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDate,
          breakStartHHMM,
          breakEndHHMM,
        }),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : t("saveBreakFailed");
        setBreakError(msg);
        return;
      }
      await loadEntries();
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
      await loadMonthlyConfirmationStatus(workDate.slice(0, 7));
    } catch {
      setBreakError(t("networkBreakSaveError"));
    } finally {
      setBreakSaving(false);
    }
  }
  async function submitCorrectionRequest() {
    setCorrectionError(null);
    setCorrectionSuccess(null);

    if (!canCreateCorrectionRequest) {
      setCorrectionError(t("correctionPastOnly"));
      return;
    }

    if (hasActiveUnlockForSelectedDate) {
      setCorrectionError(t("correctionUnlockAlreadyExists"));
      return;
    }

    if (pendingCorrectionRequestForSelectedDate) {
      setCorrectionError(t("correctionPendingAlreadyExists"));
      return;
    }

    setCorrectionSaving(true);
    try {
      const r = await fetch("/api/time-entry-correction-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: workDate,
          noteEmployee: correctionNote.trim(),
          sourceTaskId: sourceTaskId || null,
        }),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : t("correctionCreateFailed");
        setCorrectionError(msg);
        return;
      }

      setCorrectionSuccess(t("correctionSentSuccess"));
      setCorrectionNote("");
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setCorrectionError(t("networkCorrectionError"));
    } finally {
      setCorrectionSaving(false);
    }
  }

  const groupedEntries = useMemo(() => groupByMonthThenDay(language, entries), [language, entries]);

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        entries
          .map((entry) => toYMD(entry.workDate).slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year))
      )
    ).sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));

    return years;
  }, [entries]);

  const filteredGroupedEntries = useMemo(() => {
    if (selectedYear === "ALLE") return groupedEntries;
    return groupedEntries.filter((group) => group.key.startsWith(`${selectedYear}-`));
  }, [groupedEntries, selectedYear]);

  const dayTotalsMap = useMemo(() => buildDayTotalsMap(entries, dayBreakMap), [entries, dayBreakMap]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

    const breakPreviewText = useMemo(() => {
    if (!shouldShowBreakComputation) {
      return {
        rightValue: "",
        detailLines: getLegalBreakHintLines(language),      
      };
    }

    const selectedBreak = dayBreakMap.get(workDate) ?? null;
    const dayTotals = computeDayTotals(entries, dayBreakMap, workDate, 0, null);

    if (dayTotals.legalBreak === 0) {
      return {
        rightValue: "",
        detailLines: getLegalBreakHintLines(language),      
      };
    }

    if (!selectedBreak || selectedBreak.manualMinutes <= 0) {
      return {
        rightValue: formatPause(dayTotals.legalBreak),
        detailLines: [
          `${t("legalBreakAutoApplied")} ${formatPause(dayTotals.legalBreak)}`,
          `${t("gross")} ${formatHM(dayTotals.grossDay)} · ${t("net")} ${formatHM(dayTotals.netDay)}`,
        ],
      };
    }

    if (selectedBreak.manualMinutes < dayTotals.legalBreak) {
      return {
        rightValue: formatPause(dayTotals.effectiveBreak),
        detailLines: [
          `${t("manualBreak")}: ${formatPause(selectedBreak.manualMinutes)}`,
          `${t("autoCompleted")}: ${formatPause(dayTotals.autoSupplement)}`,
          `${t("legallyRequired")}: ${formatPause(dayTotals.legalBreak)}`,
        ],
      };
    }

    return {
      rightValue: formatPause(dayTotals.effectiveBreak),
      detailLines: [
        `${t("manualBreak")}: ${formatPause(selectedBreak.manualMinutes)}`,
        `${t("legallyRequired")}: ${formatPause(dayTotals.legalBreak)}`,
        `${t("gross")} ${formatHM(dayTotals.grossDay)} · ${t("net")} ${formatHM(dayTotals.netDay)}`,
      ],
    };
  }, [shouldShowBreakComputation, dayBreakMap, workDate, entries, t]);

    useEffect(() => {
    if (selectedYear !== "ALLE") return;
    const currentYear = String(new Date().getFullYear());
    if (availableYears.includes(currentYear)) {
      setSelectedYear(currentYear);
    }
  }, [availableYears, selectedYear]);

  const editPreview = useMemo(() => {
    if (!edit) {
      return {
        grossEntry: 0,
        grossDay: 0,
        effectiveBreak: 0,
        breakAuto: true,
        netDay: 0,
      };
    }

    const grossEntry = minutesBetween(edit.startTime, edit.endTime);
    const entriesWithoutThis = entries.filter((entry) => entry.id !== edit.id);
    const day = computeDayTotals(entriesWithoutThis, dayBreakMap, edit.workDate, grossEntry, null);

    return {
      grossEntry,
      grossDay: day.grossDay,
      effectiveBreak: day.effectiveBreak,
      breakAuto: day.breakAuto,
      netDay: day.netDay,
    };
  }, [edit, entries, dayBreakMap]);

  const meName = me && me.ok && me.session ? me.session.fullName : "";

  const canCreateCorrectionRequest = useMemo(() => {
    return Boolean(me && me.ok && isPastWorkDate(workDate));
  }, [me, workDate]);

  const pendingCorrectionRequestForSelectedDate = useMemo(() => {
    return correctionRequests.find((request) => {
      if (request.status !== "PENDING") return false;
      return request.startDate <= workDate && request.endDate >= workDate;
    }) ?? null;
  }, [correctionRequests, workDate]);

  const hasActiveUnlockForSelectedDate =
    selectedCorrectionStatus?.hasActiveUnlock ?? false;

  const requiresCorrectionRequestForSelectedDate =
    selectedCorrectionStatus?.requiresCorrectionRequest ?? false;

  const currentMissingWorkdaysCount =
    selectedCorrectionStatus?.currentMissingWorkdaysCount ?? 0;

  const graceWorkdaysLimit =
    selectedCorrectionStatus?.graceWorkdaysLimit ?? 5;

  const latestDecisionRequestForSelectedDate =
    selectedCorrectionStatus?.latestDecisionRequest ?? null;

  const shouldShowCorrectionRequestButton = useMemo(() => {
    if (!canCreateCorrectionRequest) return false;
    if (hasAdminTaskBypassForSelectedDate) return false;
    if (!requiresCorrectionRequestForSelectedDate) return false;
    if (hasActiveUnlockForSelectedDate) return false;
    if (pendingCorrectionRequestForSelectedDate) return false;
    return true;
  }, [
    canCreateCorrectionRequest,
    hasAdminTaskBypassForSelectedDate,
    requiresCorrectionRequestForSelectedDate,
    hasActiveUnlockForSelectedDate,
    pendingCorrectionRequestForSelectedDate,
  ]);
  const correctionProgressText = useMemo(() => {
    if (!canCreateCorrectionRequest) return null;

    if (hasAdminTaskBypassForSelectedDate) {
      return t("noCorrectionBecauseAdminTask");
    }

    if (hasActiveUnlockForSelectedDate) return null;
    if (pendingCorrectionRequestForSelectedDate) return null;

    if (requiresCorrectionRequestForSelectedDate) {
      return replaceTemplate(t("currentMissingDaysNeedsRequest"), {
        current: currentMissingWorkdaysCount,
        limit: graceWorkdaysLimit,
      });
    }

    return replaceTemplate(t("currentMissingDaysUntilLock"), {
      current: currentMissingWorkdaysCount,
      limit: graceWorkdaysLimit,
    });
  }, [
    canCreateCorrectionRequest,
    hasAdminTaskBypassForSelectedDate,
    hasActiveUnlockForSelectedDate,
    pendingCorrectionRequestForSelectedDate,
    requiresCorrectionRequestForSelectedDate,
    currentMissingWorkdaysCount,
    graceWorkdaysLimit,
    t,
  ]);

  async function confirmMonthlyWorkEntries(): Promise<void> {
    if (!monthlyConfirmationData) {
      return;
    }

    setMonthlyConfirmationSaving(true);
    setMonthlyConfirmationError(null);

    try {
      const response = await fetch("/api/monthly-work-entry-confirmations/confirm", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: monthlyConfirmationData.year,
          month: monthlyConfirmationData.month,
          sourceTaskId: sourceTaskId || null,
        }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : getMonthlyConfirmationError(language);

        setMonthlyConfirmationError(message);
        return;
      }

      setMonthlyConfirmationOpen(false);
      setMonthlyConfirmationData(null);
      setMonthlyConfirmationRejectReason("");
      await loadEntries();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks-changed"));
      }
    } catch {
      setMonthlyConfirmationError(getMonthlyConfirmationError(language));
    } finally {
      setMonthlyConfirmationSaving(false);
    }
  }

  async function rejectMonthlyWorkEntries(): Promise<void> {
    if (!monthlyConfirmationData) {
      return;
    }

    if (!monthlyConfirmationRejectReason.trim()) {
      setMonthlyConfirmationError(getMonthlyConfirmationReasonRequired(language));
      return;
    }

    setMonthlyConfirmationSaving(true);
    setMonthlyConfirmationError(null);

    try {
      const response = await fetch("/api/monthly-work-entry-confirmations/reject", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: monthlyConfirmationData.year,
          month: monthlyConfirmationData.month,
          rejectionReason: monthlyConfirmationRejectReason.trim(),
        }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : getMonthlyConfirmationError(language);

        setMonthlyConfirmationError(message);
        return;
      }

      setMonthlyConfirmationError(null);
      await loadMonthlyConfirmationStatus();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks-changed"));
      }
    } catch {
      setMonthlyConfirmationError(getMonthlyConfirmationError(language));
    } finally {
      setMonthlyConfirmationSaving(false);
    }
  }

  if (!meResolved) {
    return (
      <AppShell activeLabel="#wirkönnendas">
        <div className="card tenant-status-card tenant-status-card-neutral" style={{ padding: 14 }}>
          <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="#wirkönnendas">

      {/* CREATE */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}><FontAwesomeIcon icon={faPlus} style={{strokeWidth:"4"}}/></span> {t("createEntry")}
        </div>

        {error && (
          <div
            className="card tenant-status-card tenant-status-card-danger"
            style={{ padding: 12, marginBottom: 12 }}
          >
            <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
              {error}
            </span>
          </div>
        )}

        {/* ✅ Name nur anzeigen (automatisch aus Session), kein Input mehr */}
        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("employee")}</div>
          <div
            className="input tenant-readonly-input"
            style={{
              opacity: meName ? 1 : 0.7,
            }}
          >
            {meName || "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            {t("entryAssignedAutomatically")}
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">{t("date")}</div>

            <input
              className="input erfassung-date-desktop"
              type="date"
              value={workDate}
              onChange={(e) => {
                const nextWorkDate = e.target.value;

                setWorkDate(nextWorkDate);
                applyEntryTimeDefaultsForDate(nextWorkDate, entries);
              }}
            />

            <div className="date-display-input erfassung-date-mobile">
              <div className="date-display-value">{formatDateLocalized(language, workDate)}</div>
              <input
                className="date-display-native-input"
                type="date"
                value={workDate}
                onChange={(e) => {
                  const nextWorkDate = e.target.value;

                  setWorkDate(nextWorkDate);
                  applyEntryTimeDefaultsForDate(nextWorkDate, entries);
                }}
                aria-label={t("selectDate")}
              />
            </div>
          </div>
          <div />
        </div>

        {canCreateCorrectionRequest ? (
          <div
            className={`card tenant-status-card ${
              hasActiveUnlockForSelectedDate
                ? "tenant-status-card-success"
                : pendingCorrectionRequestForSelectedDate
                ? "tenant-status-card-info"
                : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                ? "tenant-status-card-danger"
                : "tenant-status-card-warning"
            }`}
            style={{
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div
                className={
                  hasActiveUnlockForSelectedDate
                    ? "tenant-status-text-success"
                    : pendingCorrectionRequestForSelectedDate
                    ? "tenant-status-text-info"
                    : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                    ? "tenant-status-text-danger"
                    : "tenant-status-text-warning"
                }
                style={{ fontWeight: 800 }}
              >
                {t("selectedPastDay")}
              </div>

              {loadingSelectedCorrectionStatus ? (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {t("statusLoading")}
                </div>
              ) : hasAdminTaskBypassForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {t("noCorrectionBecauseAdminTask")}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {t("directEntryPossible")} {formatDateLocalized(language, workDate)}.
                    {selectedCorrectionStatus?.adminTaskBypass?.startDate &&
                      selectedCorrectionStatus?.adminTaskBypass?.endDate &&
                      selectedCorrectionStatus.adminTaskBypass.startDate !==
                        selectedCorrectionStatus.adminTaskBypass.endDate
                        ? ` ${t("releasedRangeFromTo")} ${formatCorrectionRange(
                            language,
                            selectedCorrectionStatus.adminTaskBypass.startDate,
                            selectedCorrectionStatus.adminTaskBypass.endDate
                          )}.`
                        : ""}
                  </div>
                </>
              ) : hasActiveUnlockForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {t("adminReleasedDay")}
                  </div>

                  {latestDecisionRequestForSelectedDate?.status === "APPROVED" ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {t("approvedRange")}{" "}
                      {formatCorrectionRange(
                        language,
                        latestDecisionRequestForSelectedDate.startDate,
                        latestDecisionRequestForSelectedDate.endDate
                      )}
                    </div>
                  ) : null}
                </>
              ) : pendingCorrectionRequestForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {t("pendingCorrectionExists")}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {t("pendingRange")}{" "}
                    {formatCorrectionRange(
                      language,
                      pendingCorrectionRequestForSelectedDate.startDate,
                      pendingCorrectionRequestForSelectedDate.endDate
                    )}
                  </div>
                </>
              ) : latestDecisionRequestForSelectedDate?.status === "REJECTED" ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {t("lastCorrectionRejected")}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {t("lastDecisionFor")}{" "}
                    {formatCorrectionRange(
                      language,
                      latestDecisionRequestForSelectedDate.startDate,
                      latestDecisionRequestForSelectedDate.endDate
                    )}
                  </div>

                  {shouldShowCorrectionRequestButton ? (
                    <div>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setCorrectionError(null);
                          setCorrectionSuccess(null);
                          setCorrectionOpen(true);
                        }}
                      >
                        {t("sendNewCorrectionRequest")}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {requiresCorrectionRequestForSelectedDate
                      ? t("correctionRequiredNow")
                      : t("correctionNotRequiredNow")}
                  </div>

                  {correctionProgressText ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {correctionProgressText}
                    </div>
                  ) : null}

                  {shouldShowCorrectionRequestButton ? (
                    <div>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setCorrectionError(null);
                          setCorrectionSuccess(null);
                          setCorrectionOpen(true);
                        }}
                      >
                        {t("sendCorrectionRequest")}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}

        {additionalEntryHintText ? (
          <div
            className="card tenant-status-card tenant-status-card-info"
            style={{
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div
              className="tenant-status-text-info"
              style={{
                fontWeight: 800,
                lineHeight: 1.45,
              }}
            >
              {additionalEntryHintText}
            </div>
          </div>
        ) : null}

        <div className="row erfassung-time-row" style={{ marginBottom: 12 }}>
          <div className="erfassung-time-field">
            <div className="label">{t("start")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="erfassung-time-field">
            <div className="label">{t("end")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="tenant-computation-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="tenant-computation-head">
              <div style={{ color: "var(--muted)" }}>{t("workTimeCalculated")}</div>
              <div className="tenant-computation-value">
                {dayPreview ? formatHM(dayPreview.netDay) : ""}
              </div>
            </div>

            {!dayPreview ? (
              <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
                {getLegalBreakHintLines(language).map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : dayPreview.legalBreak > 0 ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                <div>{t("gross")} {formatHM(dayPreview.grossDay)} · {t("legalBreak")} {formatPause(dayPreview.legalBreak)} · {t("net")} {formatHM(dayPreview.netDay)}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
                <div>{t("gross")} {formatHM(dayPreview.grossDay)} · {t("net")} {formatHM(dayPreview.netDay)}</div>
                {getLegalBreakHintLines(language).map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("activityPerformed")} *</div>
          <textarea
            className="textarea"
            placeholder={t("activityPlaceholder")}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("location")} *</div>
          <input
            className="input"
            placeholder={t("locationPlaceholder")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("noteForAdmin")}</div>
          <textarea
            className="textarea"
            placeholder={t("notePlaceholder")}
            value={noteEmployee}
            onChange={(e) => setNoteEmployee(e.target.value)}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            {t("noteOptionalVisibleToAdmin")}
          </div>
        </div>

        <div className="label" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">{t("travelMinutes")}</div>
            <input
              className="input"
              inputMode="numeric"
              value={travelMinutes}
              onChange={(e) => setTravelMinutes(e.target.value)}
            />
          </div>
        </div>


        <div className="erfassung-dual-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              const resetWorkDate = syncDateParam || toIsoDateLocal(new Date());

              setWorkDate(resetWorkDate);
              applyEntryTimeDefaultsForDate(resetWorkDate, entries);
              setActivity("");
              setLocation("");
              setTravelMinutes("0");
              setNoteEmployee("");
              setError(null);
            }}
          >
            {t("cancel")}
          </button>

          <button
            className="btn btn-accent"
            type="button"
            onClick={saveEntry}
            disabled={saving}
          >
            {saving ? t("saving") : t("saveEntry")}
          </button>
        </div>
      </div>

            <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}><FontAwesomeIcon icon={faPause} /></span> {t("breakCapture")}
        </div>

        {breakError ? (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{breakError}</span>
          </div>
        ) : null}

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("date")}</div>
          <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
            {formatDateLocalized(language, workDate)}
          </div>
        </div>

        <div className="row erfassung-time-row" style={{ marginBottom: 12 }}>
          <div className="erfassung-time-field">
            <div className="label">{t("breakFrom")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={breakStartHHMM}
              onChange={(e) => setBreakStartHHMM(e.target.value)}
            />
          </div>
          <div className="erfassung-time-field">
            <div className="label">{t("breakTo")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={breakEndHHMM}
              onChange={(e) => setBreakEndHHMM(e.target.value)}
            />
          </div>
        </div>

        <div className="tenant-computation-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="tenant-computation-head">
              <div style={{ color: "var(--muted)" }}>{t("breakCalculation")}</div>
              <div className="tenant-computation-value">
                {breakPreviewText.rightValue}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
              {breakPreviewText.detailLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          {t("breakRuleInfo")}
        </div>

        <div className="erfassung-dual-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              setBreakStartHHMM("");
              setBreakEndHHMM("");
              setBreakError(null);
            }}
          >
            {t("reset")}
          </button>

          <button
            className="btn btn-accent"
            type="button"
            onClick={saveDayBreak}
            disabled={breakSaving}
          >
            {breakSaving ? t("saving") : t("saveBreak")}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="card" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div className="section-title" style={{ marginBottom: 0 }}>
            {t("allEntries")}
          </div>

          <div style={{ minWidth: 160 }}>
            <div className="label">{t("year")}</div>
            <select
              className="input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALLE">{t("allYears")}</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {loadingEntries ? (
            <div
              className="card"
              style={{
                padding: 14,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              {t("loadingEntries")}
            </div>
          ) : null}

          {!loadingEntries && filteredGroupedEntries.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 14,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >{t("noEntriesForYear")}
            </div>
          ) : null}
          {filteredGroupedEntries.map((m) => (
            <details
              key={m.key}
              open={m.key === currentMonthKey}
              className="tenant-list-shell"
              data-entry-month={m.key}
            >
              <summary
                style={{
                  cursor: "pointer",
                  listStyle: "none",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  userSelect: "none",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {m.label}
                  <span style={{ opacity: 0.7, fontWeight: 600, marginLeft: 8 }}>
                    ({m.days.reduce((s, d) => s + d.entries.length, 0)})
                  </span>
                </div>

                <div style={{ opacity: 0.7, fontSize: 12 }}>{t("expandCollapse")}</div>
              </summary>

              <div style={{ padding: "0 0 12px 0", display: "grid", gap: 10 }}>
                {m.days.map((d) => {
                  const totals = dayTotalsMap.get(d.date);
                  const pauseMin = totals ? totals.effectiveBreak : 0;
                  const netDay = totals ? totals.netDay : 0;

                  return (
                    <details
                      key={`${m.key}-${d.date}`}
                      className="tenant-list-shell-inner"
                      data-entry-day={d.date}
                      style={{
                        margin: "0 12px",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          listStyle: "none",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          userSelect: "none",
                        }}
                      >
                        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                          <div style={{ fontWeight: 900 }}>
                            {formatDateDayLineLocalized(language, d.date)}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                              fontSize: 12,
                              color: "var(--muted)",
                            }}
                          >
                            <span>
                              {d.entries.length} {d.entries.length === 1 ? t("entry") : t("entries")}
                            </span>

                            <span style={{ opacity: 0.5 }}>·</span>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                openBreakInfoModal(dayBreakMap.get(d.date) ?? null, d.date);
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
                              {formatPause(pauseMin)} {t("break")}
                            </button>
                          </div>
                        </div>

                        <div style={{ fontWeight: 900, color: "var(--accent)", flexShrink: 0 }}>
                          {formatHM(netDay)}
                        </div>
                      </summary>

                      <div style={{ display: "grid", gap: 12, padding: "10px 0 12px 0" }}>
                        {d.entries.map((e) => {
                          const hasTravel = (e.travelMinutes ?? 0) > 0;

                          return (
                            <div
                              key={e.id}
                              className="tenant-entry-row"
                              data-work-entry-id={e.id}
                              style={{
                                outline:
                                  highlightedEntryId === e.id
                                    ? "2px solid var(--accent)"
                                    : "none",
                                boxShadow:
                                  highlightedEntryId === e.id
                                    ? "0 0 0 6px color-mix(in srgb, var(--accent) 18%, transparent)"
                                    : undefined,
                                transition: "outline 180ms ease, box-shadow 180ms ease",
                              }}
                            >
                              <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                                <div style={{ fontWeight: 1100, color: "var(--accent)" }}>
                                  {formatHM(e.workMinutes ?? 0)}
                                </div>

                                <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}>
                                  {e.startTime}–{e.endTime} {t("oClock")}
                                </div>

                                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                  {e.activity?.trim() ? e.activity : t("noActivityStored")}
                                </div>

                                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                  {e.location?.trim() ? e.location : t("noLocationStored")}
                                </div>

                                {hasTravel ? (
                                  <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                    {t("travelTime")} {formatMinutesCompact(e.travelMinutes)}
                                  </div>
                                ) : null}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  justifyContent: "flex-end",
                                  alignSelf: "flex-start",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => openDetailsModal(e)}
                                  title={t("showDetails")}
                                  className="tenant-icon-button tenant-icon-button-success"
                                >
                                  <FontAwesomeIcon icon={faInfo} /> {t("details")}
                                </button>

                                {e.noteEmployee.trim() ? (
                                  <button
                                    type="button"
                                    onClick={() => openNoteModal(e)}
                                    title={t("showNote")}
                                    className="tenant-icon-button tenant-icon-button-info"
                                  >
                                    <FontAwesomeIcon icon={faPenToSquare} /> {t("note")}
                                  </button>
                                ) : null}

                                {e.hasChangeReports ? (
                                  <button
                                    type="button"
                                    onClick={() => openChangeReportsModal(e)}
                                    title={t("changes")}
                                    className="tenant-icon-button tenant-icon-button-info"
                                  >
                                    <FontAwesomeIcon icon={faClockRotateLeft} /> {t("changes")}
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => openEditModal(e)}
                                  title={t("edit")}
                                  className="tenant-icon-button tenant-icon-button-neutral"
                                >
                                  <FontAwesomeIcon icon={faPencil} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteEntry(e.id)}
                                  title={t("delete")}
                                  className="tenant-icon-button tenant-icon-button-danger"
                                >
                                  <FontAwesomeIcon icon={faTrashCan} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>

            <Modal
        open={detailsOpen}
        title={t("workTimeDetails")}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsEntry(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setDetailsOpen(false);
                setDetailsEntry(null);
              }}
            >
              {t("close")}
            </button>
          </div>
        }
      >
        {!detailsEntry ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">{t("dateAndTime")}</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatDateLocalized(language, toYMD(detailsEntry.workDate))} · {detailsEntry.startTime}–{detailsEntry.endTime}
              </div>
            </div>

            <div>
              <div className="label">{t("netWorkTime")}</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatHM(detailsEntry.workMinutes ?? 0)}
              </div>
            </div>

            <div>
              <div className="label">{t("siteOrAddress")}</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {detailsEntry.location?.trim() ? detailsEntry.location : "—"}
              </div>
            </div>

            <div>
              <div className="label">{t("performedActivity")}</div>
              <div
                className="input tenant-note-surface"
              >
                {detailsEntry.activity?.trim() ? detailsEntry.activity : "—"}
              </div>
            </div>

            <div>
              <div className="label">{t("travelTime")}</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatMinutesCompact(detailsEntry.travelMinutes ?? 0)}
              </div>
            </div>
          </div>
        )}
      </Modal>

            <Modal
        open={breakInfoOpen}
        title={t("breakDetails")}
        onClose={() => setBreakInfoOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => setBreakInfoOpen(false)}
            >
              {t("close")}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="label">{t("date")}</div>            
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatDateLocalized(language, breakInfoDate)}
            </div>
          </div>

          <div>
            <div className="label">{t("manualBreak")}</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {breakInfoManualStart && breakInfoManualEnd
                ? `${breakInfoManualStart}–${breakInfoManualEnd} · ${formatMinutesCompact(breakInfoManualMinutes)}`
                : breakInfoManualMinutes > 0
                ? formatMinutesCompact(breakInfoManualMinutes)
                : t("noManualBreak")}
            </div>
          </div>

          <div>
            <div className="label">{t("legallyRequired")}</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatMinutesCompact(breakInfoLegalMinutes)}
            </div>
          </div>

          <div>
            <div className="label">{t("autoCompleted")}</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {breakInfoAutoMinutes > 0 ? formatMinutesCompact(breakInfoAutoMinutes) : t("noAutoCompletion")}
            </div>
          </div>

          <div>
            <div className="label">{t("effectiveBreakTotal")}</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatMinutesCompact(breakInfoEffectiveMinutes)}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        title={t("noteForAdmin")}
        onClose={() => {
          setNoteOpen(false);
          setNoteEntry(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setNoteOpen(false);
                setNoteEntry(null);
              }}
            >
              {t("close")}
            </button>
          </div>
        }
      >
        {!noteEntry ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">{t("date")}</div>             
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatDateLocalized(language, toYMD(noteEntry.workDate))} · {noteEntry.startTime}–{noteEntry.endTime}
              </div>
            </div>

            <div>
              <div className="label">{t("note")}</div>
              <div
                className="input tenant-note-surface-tall"
              >
                {noteEntry.noteEmployee.trim() || t("noNote")}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={correctionOpen}
        title={t("sendCorrectionRequest")}
        onClose={() => {
          setCorrectionOpen(false);
          setCorrectionError(null);
          setCorrectionSuccess(null);
        }}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setCorrectionOpen(false);
                setCorrectionError(null);
                setCorrectionSuccess(null);
              }}
            >
              {t("close")}
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={submitCorrectionRequest}
              disabled={correctionSaving}
            >
              {correctionSaving ? t("sending") : t("sendRequest")}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {correctionError ? (
        <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 12 }}>
          <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
                {correctionError}
              </span>
            </div>
          ) : null}

          {correctionSuccess ? (
          <div className="card tenant-status-card tenant-status-card-success" style={{ padding: 12 }}>
            <span className="tenant-status-text-success" style={{ fontWeight: 700 }}>
                {correctionSuccess}
              </span>
            </div>
          ) : null}

          <div>
            <div className="label">{t("selectedDate")}</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatDateLocalized(language, workDate)}
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {t("serverDeterminesCorrectionRange")}
          </div>

          <div>
            <div className="label">{t("noteForAdmin")}</div>
            <textarea
              className="textarea"
              placeholder={t("optionalReasonPlaceholder")}
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
            />
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {loadingSelectedCorrectionStatus || loadingCorrectionRequests
              ? t("existingCorrectionInfoLoading")
              : hasAdminTaskBypassForSelectedDate
              ? t("noCorrectionBecauseAdminTask")
              : hasActiveUnlockForSelectedDate
              ? t("activeUnlockAlreadyExists")
              : pendingCorrectionRequestForSelectedDate
              ? replaceTemplate(t("existingCorrectionHint"), {
                  range: formatCorrectionRange(
                    language,
                    pendingCorrectionRequestForSelectedDate.startDate,
                    pendingCorrectionRequestForSelectedDate.endDate
                  ),
                })
              : requiresCorrectionRequestForSelectedDate
              ? replaceTemplate(t("currentMissingDaysNeedsRequest"), {
                  current: currentMissingWorkdaysCount,
                  limit: graceWorkdaysLimit,
                })
              : replaceTemplate(t("currentMissingDaysUntilLock"), {
                  current: currentMissingWorkdaysCount,
                  limit: graceWorkdaysLimit,
                })}
          </div>
        </div>
      </Modal>

      <Modal
        open={changeReportsOpen}
        title={t("changeReportTitle")}
        onClose={() => {
          setChangeReportsOpen(false);
          setChangeReportsEntry(null);
          setChangeReports([]);
          setChangeReportsError(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setChangeReportsOpen(false);
                setChangeReportsEntry(null);
                setChangeReports([]);
                setChangeReportsError(null);
              }}
            >
              {t("close")}
            </button>
          </div>
        }
        maxWidth={760}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {changeReportsEntry ? (
            <div className="tenant-status-card tenant-status-card-info" style={{ padding: 12 }}>
              <div className="tenant-status-text-info" style={{ fontWeight: 800 }}>
                {formatDateLocalized(language, toYMD(changeReportsEntry.workDate))} ·{" "}
                {changeReportsEntry.startTime}–{changeReportsEntry.endTime}
              </div>
            </div>
          ) : null}

          {changeReportsLoading ? (
            <div style={{ color: "var(--muted)" }}>{t("loadingChangeReports")}</div>
          ) : null}

          {changeReportsError ? (
            <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 12 }}>
              <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
                {changeReportsError}
              </span>
            </div>
          ) : null}

          {!changeReportsLoading && !changeReportsError && changeReports.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>{t("noChangeReports")}</div>
          ) : null}

          {changeReports.map((report) => {
            const changedFields = getChangedReportFields(report);

            return (
              <div
                key={report.id}
                style={{
                  display: "grid",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 1000 }}>
                    {report.action === "DELETE" ? t("entryDeleted") : t("entryUpdated")}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 800 }}>
                    {formatChangeReportDate(language, report.createdAt)}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{t("changedBy")}</span>
                    <div style={{ fontWeight: 900 }}>{report.changedBy.fullName}</div>
                  </div>

                  <div>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{t("changeReason")}</span>
                    <div style={{ whiteSpace: "pre-wrap", fontWeight: 800 }}>
                      {report.reason}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 900 }}>
                    {t("changedFields")}
                  </div>

                  {changedFields.map((fieldKey) => (
                    <div
                      key={`${report.id}-${fieldKey}`}
                      style={{
                        display: "grid",
                        gap: 6,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "var(--input-bg)",
                      }}
                    >
                      <div style={{ fontWeight: 1000 }}>
                        {getChangeFieldLabel(language, fieldKey)}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("oldValue")}</div>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {formatUnknownChangeValue(report.oldValues[fieldKey])}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{t("newValue")}</div>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {report.newValues
                              ? formatUnknownChangeValue(report.newValues[fieldKey])
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ✅ EDIT MODAL */}
      <Modal
        open={editOpen}
        title={edit && requiresEditRequestForEntry(edit) ? t("editRequestTitle") : t("editEntry")}
        onClose={() => {
          setEditOpen(false);
          setEdit(null);
          setEditError(null);
          setEditSuccess(null);
          setEditChangeReason("");
        }}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEdit(null);
                setEditError(null);
                setEditSuccess(null);
                setEditChangeReason("");
              }}
            >
              {t("cancel")}
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={saveEdit}
              disabled={editSaving}
            >
              {editSaving
                ? t("saving")
                : edit && requiresEditRequestForEntry(edit)
                ? t("sendEditRequest")
                : t("saveChanges")}
            </button>
          </div>
        }
      >
        {!edit ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            {editError ? (
          <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 12 }}>
            <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
              {editError}
            </span>
            {editSuccess ? (
              <div className="card tenant-status-card tenant-status-card-success" style={{ padding: 12 }}>
                <span className="tenant-status-text-success" style={{ fontWeight: 700 }}>
                  {editSuccess}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

            <div>
              <div className="label">{t("employee")}</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {edit.userFullName}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {t("employeeManagedServerSide")}
              </div>
            </div>

            <div className="modal-grid-1">
              <div className="modal-field">
                <div className="label">{t("date")}</div>                
                <input
                  className="input modal-date-input"
                  type="date"
                  value={edit.workDate}
                  onChange={(e) => setEdit((p) => (p ? { ...p, workDate: e.target.value } : p))}
                />
              </div>
            </div>

            <div
              className="modal-grid-2-compact"
              style={{
                width: "100%",
                minWidth: 0,
              }}
            >
              <div
                className="modal-field"
                style={{
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <div className="label">{t("start")}</div>
                <input
                  className="input"
                  type="time"
                  value={edit.startTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, startTime: e.target.value } : p))}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                className="modal-field"
                style={{
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <div className="label">{t("end")}</div>
                <input
                  className="input"
                  type="time"
                  value={edit.endTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, endTime: e.target.value } : p))}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div className="tenant-computation-card">
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ color: "var(--muted)" }}>{t("workTimeCalculated")}</div>
                  <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(editPreview.netDay)}</div>
                </div>
                <div style={{ marginTop: 2, fontSize: 12, color: "var(--muted)" }}>
                  {replaceTemplate(t("dayGrossBreakNet"), {
                    gross: formatHM(editPreview.grossDay),
                    breakValue: formatPause(editPreview.effectiveBreak),
                    netValue: formatHM(editPreview.netDay),
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="label">{t("performedActivity")} *</div>
              <textarea
                className="textarea"
                value={edit.activity}
                onChange={(e) => setEdit((p) => (p ? { ...p, activity: e.target.value } : p))}
                required
              />
            </div>

            <div>
              <div className="label">{t("location")} *</div>
              <input
                className="input"
                value={edit.location}
                onChange={(e) => setEdit((p) => (p ? { ...p, location: e.target.value } : p))}
                required
              />
            </div>

            <div>
              <div className="label">{t("noteForAdmin")}</div>
              <textarea
                className="textarea"
                value={edit.noteEmployee}
                onChange={(e) => setEdit((p) => (p ? { ...p, noteEmployee: e.target.value } : p))}
                placeholder={t("notePlaceholder")}
              />
            </div>

            {requiresEditRequestForEntry(edit) ? (
              <>
                <div className="card tenant-status-card tenant-status-card-warning" style={{ padding: 12 }}>
                  <div className="tenant-status-text-warning" style={{ fontWeight: 800 }}>
                    {t("editRequestRequiredForOldEntry")}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    {t("editRequestDescription")}
                  </div>
                </div>

                <div>
                  <div className="label">{t("editRequestReason")} *</div>
                  <textarea
                    className="textarea"
                    value={editChangeReason}
                    onChange={(event) => setEditChangeReason(event.target.value)}
                    placeholder={t("editRequestReasonPlaceholder")}
                    required
                  />
                </div>
              </>
            ) : null}

            <div className="modal-grid-1">
              <div className="modal-field">
                <div className="label">{t("travelMinutes")}</div>
                <input
                  className="input"
                  inputMode="numeric"
                  value={edit.travelMinutes}
                  onChange={(e) => setEdit((p) => (p ? { ...p, travelMinutes: e.target.value } : p))}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={monthlyConfirmationOpen && Boolean(monthlyConfirmationData)}
        title={getMonthlyConfirmationTitle(language, monthlyConfirmationMonthLabel)}
        onClose={() => {
          if (monthlyConfirmationWasRejected) {
            setMonthlyConfirmationOpen(false);
          }
        }}
        disableBackdropClose={!monthlyConfirmationWasRejected}
        disableEscapeClose={!monthlyConfirmationWasRejected}
        hideCloseButton={!monthlyConfirmationWasRejected}
        maxWidth={860}
        zIndex={7000}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn"
              type="button"
              onClick={rejectMonthlyWorkEntries}
              disabled={monthlyConfirmationSaving || monthlyConfirmationLoading}
            >
              {getMonthlyConfirmationRejectButton(language)}
            </button>

            <button
              className="btn btn-accent"
              type="button"
              onClick={confirmMonthlyWorkEntries}
              disabled={monthlyConfirmationSaving || monthlyConfirmationLoading}
            >
              {monthlyConfirmationSaving
                ? t("saving")
                : getMonthlyConfirmationConfirmButton(language)}
            </button>
          </div>
        }
      >
        {!monthlyConfirmationData ? null : (
          <div style={{ display: "grid", gap: 14 }}>
            {monthlyConfirmationError ? (
              <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 12 }}>
                <span className="tenant-status-text-danger" style={{ fontWeight: 800 }}>
                  {monthlyConfirmationError}
                </span>
              </div>
            ) : null}

            <div className="card tenant-status-card tenant-status-card-info" style={{ padding: 12 }}>
              <div className="tenant-status-text-info" style={{ fontWeight: 900, lineHeight: 1.45 }}>
                {getMonthlyConfirmationIntro(language)}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {monthlyConfirmationData.entries.map((entry) => (
                <details
                  key={entry.id}
                  className="tenant-list-shell-inner"
                  style={{
                    padding: 0,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      listStyle: "none",
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 1000 }}>
                        {formatDateLocalized(language, entry.workDate)}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {entry.startTime}–{entry.endTime} {t("oClock")}
                      </div>
                    </div>

                    <div style={{ color: "var(--accent)", fontWeight: 1000 }}>
                      {formatHM(entry.workMinutes)}
                    </div>
                  </summary>

                  <div style={{ display: "grid", gap: 10, padding: "0 14px 14px" }}>
                    <div>
                      <div className="label">{t("performedActivity")}</div>
                      <div className="input tenant-note-surface">
                        {entry.activity.trim() || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="label">{t("location")}</div>
                      <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                        {entry.location.trim() || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div className="label">{t("gross")}</div>
                        <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                          {formatHM(entry.grossMinutes)}
                        </div>
                      </div>

                      <div>
                        <div className="label">{t("break")}</div>
                        <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                          {formatPause(entry.breakMinutes)}
                        </div>
                      </div>

                      <div>
                        <div className="label">{t("net")}</div>
                        <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                          {formatHM(entry.workMinutes)}
                        </div>
                      </div>

                      <div>
                        <div className="label">{t("travelMinutes")}</div>
                        <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.9 }}>
                          {formatMinutesCompact(entry.travelMinutes)}
                        </div>
                      </div>
                    </div>

                    {entry.noteEmployee.trim() ? (
                      <div>
                        <div className="label">{t("note")}</div>
                        <div className="input tenant-note-surface">
                          {entry.noteEmployee}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>

            <div className="card tenant-status-card tenant-status-card-warning" style={{ padding: 12 }}>
              <div className="tenant-status-text-warning" style={{ fontWeight: 900, lineHeight: 1.5 }}>
                {getMonthlyConfirmationLegalNotice(language)}
              </div>
            </div>

            <div>
              <div className="label">
                {getMonthlyConfirmationRejectReasonLabel(language)}
              </div>
              <textarea
                className="textarea"
                value={monthlyConfirmationRejectReason}
                onChange={(event) => setMonthlyConfirmationRejectReason(event.target.value)}
                placeholder={getMonthlyConfirmationRejectReasonPlaceholder(language)}
              />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {getMonthlyConfirmationRejectedTaskHint(language)}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {showSyncToast && (
        <Toast message={syncToastMessage} />
      )}
    </AppShell>
  );
}