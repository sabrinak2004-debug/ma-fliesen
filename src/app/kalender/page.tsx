"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import { type KalenderTextKey, KALENDER_DICTIONARY } from "@/lib/i18n";
import {
  CalendarDays,
  Sparkles,
  Crown,
  Trees,
  Briefcase,
  Users,
  Flower2,
  Sun,
  PartyPopper,
  TreePalm,
  Plus,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStethoscope, faPencil, faTrashCan, faPenToSquare, faShare, faFilePdf, faMapPin, faCarSide } from "@fortawesome/free-solid-svg-icons";
import { Stethoscope } from "lucide-react";

type CalendarDay = {
  date: string;
  hasWork: boolean;
  hasVacation: boolean;
  hasSick: boolean;
  hasDoctorAppointment: boolean;
  doctorAppointmentPreview: string | null;
  hasPlan: boolean;
  planPreview: string | null;
  hasHoliday: boolean;
  holidayName: string | null;
};

type CalendarResponse = { ok: true; days: CalendarDay[] } | { ok: false; error: string };

type AbsenceType = "VACATION" | "SICK";
type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";
type AbsenceCompensation = "PAID" | "UNPAID";
type SickLeaveKind = "SICK_LEAVE" | "DOCTOR_APPOINTMENT";
type AbsenceTimeMode = "FULL_DAY" | "TIME_RANGE";

type AbsenceDTO = {
  id: string;
  absenceDate: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
  sickLeaveKind: SickLeaveKind | null;
  timeMode: AbsenceTimeMode;
  startTime: string | null;
  endTime: string | null;
  paidMinutes: number;
  user: { id: string; fullName: string };
};

type PlanEntry = {
  id: string;
  userId: string;
  workDate: string;
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;
  noteEmployee?: string | null;
  user?: {
    id: string;
    fullName: string;
  } | null;
};

type AbsenceRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type AbsenceRequestDTO = {
  id: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  sickLeaveKind: SickLeaveKind | null;
  timeMode: AbsenceTimeMode;
  startTime: string | null;
  endTime: string | null;
  paidMinutes: number;
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

type AbsenceRequestBlock = {
  id: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  sickLeaveKind: SickLeaveKind | null;
  timeMode: AbsenceTimeMode;
  startTime: string | null;
  endTime: string | null;
  paidMinutes: number;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  start: string;
  end: string;
  noteEmployee: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
};

type AbsenceRequestsResponseParsed = {
  requests: AbsenceRequestDTO[];
  remainingPaidVacationDaysForMonth: number;
};

type SessionDTO = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl?: string | null;
  primaryColor?: string | null;
};

type CalendarEventDTO = {
  id: string;
  date: string;
  startHHMM: string;
  endHHMM: string;
  title: string;
  location: string | null;
  notes: string | null;
};

type EventCategory = "KUNDE" | "BAUSTELLE" | "INTERN" | "PRIVAT";
type AdminApptMode = "create-global" | "create-from-day" | "edit";
type CalendarViewMode = "MONTH" | "WEEK";

function replaceTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function getBooleanField(obj: Record<string, unknown>, key: string): boolean | null {
  const v = obj[key];
  return typeof v === "boolean" ? v : null;
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

function isSickLeaveKind(v: unknown): v is SickLeaveKind {
  return v === "SICK_LEAVE" || v === "DOCTOR_APPOINTMENT";
}

function isAbsenceTimeMode(v: unknown): v is AbsenceTimeMode {
  return v === "FULL_DAY" || v === "TIME_RANGE";
}

function isHHMM(v: string): boolean {
  return /^\d{2}:\d{2}$/.test(v);
}

function minutesBetweenHHMM(startHHMM: string, endHHMM: string): number {
  if (!isHHMM(startHHMM) || !isHHMM(endHHMM)) {
    return 0;
  }

  const [startHour, startMinute] = startHHMM.split(":").map(Number);
  const [endHour, endMinute] = endHHMM.split(":").map(Number);

  return Math.max(0, endHour * 60 + endMinute - (startHour * 60 + startMinute));
}

const DAILY_TARGET_MINUTES = 8 * 60;

function isDoctorAppointmentTimeRangeAbsence(absence: AbsenceDTO): boolean {
  return (
    absence.type === "SICK" &&
    absence.sickLeaveKind === "DOCTOR_APPOINTMENT" &&
    absence.timeMode === "TIME_RANGE"
  );
}

function absenceDayValue(absence: AbsenceDTO): number {
  if (isDoctorAppointmentTimeRangeAbsence(absence)) {
    return Math.max(0, absence.paidMinutes) / DAILY_TARGET_MINUTES;
  }

  return absence.dayPortion === "HALF_DAY" ? 0.5 : 1;
}

function formatAbsenceDayValue(
  language: AppUiLanguage,
  value: number
): string {
  const rounded = Math.round(value * 100) / 100;

  const formatted = rounded.toLocaleString(
    language === "DE" ? "de-DE" : "en-US",
    {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
      maximumFractionDigits: 2,
    }
  );

  const label = translate(
    language,
    Math.abs(rounded) === 1 ? "dayLabel" : "daysLabel",
    KALENDER_DICTIONARY
  );

  return `${formatted} ${label}`;
}

function formatPaidMinutesAsHM(minutes: number): string {
  const safeMinutes = Number.isFinite(minutes)
    ? Math.max(0, Math.round(minutes))
    : 0;

  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  return `${hours}h ${String(mins).padStart(2, "0")}min`;
}

function doctorAppointmentLabel(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Doctor appointment";
    case "IT":
      return "Visita medica";
    case "TR":
      return "Doktor randevusu";
    case "SQ":
      return "Takim te mjeku";
    case "KU":
      return "Hevdîtina bijîşk";
    case "RO":
      return "Programare la medic";
    case "DE":
    default:
      return "Arzttermin";
  }
}

function doctorAppointmentQuestion(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Doctor appointment?";
    case "IT":
      return "Visita medica?";
    case "TR":
      return "Doktor randevusu mu?";
    case "SQ":
      return "Takim te mjeku?";
    case "KU":
      return "Hevdîtina bijîşk?";
    case "RO":
      return "Programare la medic?";
    case "DE":
    default:
      return "Arzttermin?";
  }
}

function timeRangeLabel(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Specific time period";
    case "IT":
      return "Periodo specifico";
    case "TR":
      return "Belirli zaman aralığı";
    case "SQ":
      return "Periudhë e caktuar";
    case "KU":
      return "Demekî diyar";
    case "RO":
      return "Interval orar";
    case "DE":
    default:
      return "Bestimmter Zeitraum";
  }
}

function fullDayLabel(language: AppUiLanguage): string {
  switch (language) {
    case "EN":
      return "Full day";
    case "IT":
      return "Intera giornata";
    case "TR":
      return "Tam gün";
    case "SQ":
      return "Gjithë dita";
    case "KU":
      return "Hemû roj";
    case "RO":
      return "Toată ziua";
    case "DE":
    default:
      return "Ganztägig";
  }
}

function isCalendarDay(v: unknown): v is CalendarDay {
  if (!isRecord(v)) return false;
  const date = getStringField(v, "date");
  const hasWork = getBooleanField(v, "hasWork");
  const hasVacation = getBooleanField(v, "hasVacation");
  const hasSick = getBooleanField(v, "hasSick");
  const hasDoctorAppointment = getBooleanField(v, "hasDoctorAppointment");
  const doctorAppointmentPreviewRaw = v["doctorAppointmentPreview"];
  const doctorAppointmentPreview =
    doctorAppointmentPreviewRaw === null || typeof doctorAppointmentPreviewRaw === "string"
      ? doctorAppointmentPreviewRaw
      : undefined;
  const hasPlan = getBooleanField(v, "hasPlan");
  const planPreviewRaw = v["planPreview"];
  const planPreview =
    planPreviewRaw === null || typeof planPreviewRaw === "string" ? planPreviewRaw : undefined;
  const hasHoliday = getBooleanField(v, "hasHoliday");
  const holidayNameRaw = v["holidayName"];
  const holidayName =
    holidayNameRaw === null || typeof holidayNameRaw === "string" ? holidayNameRaw : undefined;

  return (
    typeof date === "string" &&
    typeof hasWork === "boolean" &&
    typeof hasVacation === "boolean" &&
    typeof hasSick === "boolean" &&
    typeof hasDoctorAppointment === "boolean" &&
    (doctorAppointmentPreview === null || typeof doctorAppointmentPreview === "string") &&
    typeof hasPlan === "boolean" &&
    typeof hasHoliday === "boolean" &&
    (planPreview === null || typeof planPreview === "string") &&
    (holidayName === null || typeof holidayName === "string")
  );
}

function parseCalendarResponse(
  j: unknown,
  language: AppUiLanguage
): CalendarResponse {
  if (!isRecord(j)) {
    return {
      ok: false,
      error: translate(language, "unexpectedResponse", KALENDER_DICTIONARY),
    };
  }

  const okVal = j["ok"];
  if (okVal === true) {
    const days = j["days"];
    if (!Array.isArray(days)) {
      return {
        ok: false,
        error: translate(language, "unexpectedResponse", KALENDER_DICTIONARY),
      };
    }
    return { ok: true, days: days.filter(isCalendarDay) };
  }

  const err = j["error"];
  if (typeof err === "string" && err.trim()) return { ok: false, error: err };

  return {
    ok: false,
    error: translate(language, "unexpectedResponse", KALENDER_DICTIONARY),
  };
}

function isAbsenceDTO(v: unknown): v is AbsenceDTO {
  if (!isRecord(v)) return false;
  const id = getStringField(v, "id");
  const absenceDate = getStringField(v, "absenceDate");
  const type = v["type"];
  const dayPortion = v["dayPortion"];
  const compensation = v["compensation"];
  const sickLeaveKind = v["sickLeaveKind"];
  const timeMode = v["timeMode"];
  const startTime = v["startTime"];
  const endTime = v["endTime"];
  const paidMinutes = v["paidMinutes"];
  const user = v["user"];

  if (!id || !absenceDate || !isAbsenceType(type) || !isAbsenceDayPortion(dayPortion)|| !isAbsenceCompensation(compensation)||!isAbsenceTimeMode(timeMode) ||
    !(sickLeaveKind === null || isSickLeaveKind(sickLeaveKind)) ||
    !(startTime === null || typeof startTime === "string") ||
    !(endTime === null || typeof endTime === "string") ||
    typeof paidMinutes !== "number" ||
    !Number.isFinite(paidMinutes)) {
    return false;
  }
  if (!isRecord(user)) return false;
  const uid = getStringField(user, "id");
  const fullName = getStringField(user, "fullName");
  return !!uid && !!fullName;
}

function parseAbsencesResponse(j: unknown): AbsenceDTO[] {
  if (!isRecord(j)) return [];
  const abs = j["absences"];
  if (!Array.isArray(abs)) return [];
  return abs.filter(isAbsenceDTO);
}

function isAbsenceRequestStatus(v: unknown): v is AbsenceRequestStatus {
  return v === "PENDING" || v === "APPROVED" || v === "REJECTED";
}

function isAbsenceRequestDTO(v: unknown): v is AbsenceRequestDTO {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const startDate = getStringField(v, "startDate");
  const endDate = getStringField(v, "endDate");
  const type = v["type"];
  const dayPortion = v["dayPortion"];
  const compensation = v["compensation"];
  const sickLeaveKind = v["sickLeaveKind"];
  const timeMode = v["timeMode"];
  const startTime = v["startTime"];
  const endTime = v["endTime"];
  const paidMinutes = v["paidMinutes"];
  const paidVacationUnits = v["paidVacationUnits"];
  const unpaidVacationUnits = v["unpaidVacationUnits"];
  const autoUnpaidBecauseNoBalance = getBooleanField(v, "autoUnpaidBecauseNoBalance");
  const compensationLockedBySystem = getBooleanField(v, "compensationLockedBySystem");
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
    !isAbsenceDayPortion(dayPortion) ||
    !isAbsenceCompensation(compensation) ||
    !(sickLeaveKind === null || isSickLeaveKind(sickLeaveKind)) ||
    !isAbsenceTimeMode(timeMode) ||
    !(startTime === null || typeof startTime === "string") ||
    !(endTime === null || typeof endTime === "string") ||
    typeof paidMinutes !== "number" ||
    !Number.isFinite(paidMinutes) ||
    typeof paidVacationUnits !== "number" ||
    !Number.isFinite(paidVacationUnits) ||
    typeof unpaidVacationUnits !== "number" ||
    !Number.isFinite(unpaidVacationUnits) ||
    typeof autoUnpaidBecauseNoBalance !== "boolean" ||
    typeof compensationLockedBySystem !== "boolean" ||
    !isAbsenceRequestStatus(status) ||
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

  if (!(decidedAtRaw === null || typeof decidedAtRaw === "string")) return false;

  if (decidedByRaw !== null) {
    if (!isRecord(decidedByRaw)) return false;
    const decidedById = getStringField(decidedByRaw, "id");
    const decidedByFullName = getStringField(decidedByRaw, "fullName");
    if (!decidedById || !decidedByFullName) return false;
  }

  return true;
}

function parseAbsenceRequestsResponse(j: unknown): AbsenceRequestsResponseParsed {
  if (!isRecord(j)) {
    return {
      requests: [],
      remainingPaidVacationDaysForMonth: 0,
    };
  }

  if (j["ok"] !== true) {
    return {
      requests: [],
      remainingPaidVacationDaysForMonth: 0,
    };
  }

  const requests = j["requests"];
  const balanceRaw = j["vacationRequestBalance"];

  const remainingPaidVacationDaysForMonth =
    isRecord(balanceRaw) && typeof balanceRaw["remainingPaidVacationDaysForMonth"] === "number"
      ? balanceRaw["remainingPaidVacationDaysForMonth"]
      : 0;

  if (!Array.isArray(requests)) {
    return {
      requests: [],
      remainingPaidVacationDaysForMonth,
    };
  }

  return {
    requests: requests.filter(isAbsenceRequestDTO),
    remainingPaidVacationDaysForMonth,
  };
}

function isPlanEntry(v: unknown): v is PlanEntry {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const userId = getStringField(v, "userId");
  const workDate = getStringField(v, "workDate");
  const startHHMM = getStringField(v, "startHHMM");
  const endHHMM = getStringField(v, "endHHMM");
  const activity = getStringField(v, "activity");
  const location = getStringField(v, "location");

  const travelRaw = v["travelMinutes"];
  const travelMinutes = typeof travelRaw === "number" ? travelRaw : null;

  const noteRaw = v["noteEmployee"];
  const noteEmployee = noteRaw === null || typeof noteRaw === "string" ? noteRaw : undefined;

  const userRaw = v["user"];
  let userIsValid = true;

  if (userRaw !== undefined && userRaw !== null) {
    if (!isRecord(userRaw)) {
      userIsValid = false;
    } else {
      const userEntryId = getStringField(userRaw, "id");
      const userFullName = getStringField(userRaw, "fullName");
      userIsValid = typeof userEntryId === "string" && typeof userFullName === "string";
    }
  }

  return (
    typeof id === "string" &&
    typeof userId === "string" &&
    typeof workDate === "string" &&
    typeof startHHMM === "string" &&
    typeof endHHMM === "string" &&
    typeof activity === "string" &&
    typeof location === "string" &&
    typeof travelMinutes === "number" &&
    (noteEmployee === undefined || noteEmployee === null || typeof noteEmployee === "string") &&
    userIsValid
  );
}

function parsePlanEntriesResponse(j: unknown): PlanEntry[] {
  if (!isRecord(j)) return [];
  const entries = j["entries"];
  if (!Array.isArray(entries)) return [];
  return entries.filter(isPlanEntry);
}

function isSessionDTO(v: unknown): v is SessionDTO {
  if (!isRecord(v)) return false;

  const userId = getStringField(v, "userId");
  const fullName = getStringField(v, "fullName");
  const role = getStringField(v, "role");
  const language = getStringField(v, "language");
  const companyId = getStringField(v, "companyId");
  const companyName = getStringField(v, "companyName");
  const companySubdomain = getStringField(v, "companySubdomain");

  const companyLogoUrlRaw = v["companyLogoUrl"];
  const primaryColorRaw = v["primaryColor"];

  const companyLogoUrl =
    companyLogoUrlRaw === undefined ||
    companyLogoUrlRaw === null ||
    typeof companyLogoUrlRaw === "string";

  const primaryColor =
    primaryColorRaw === undefined ||
    primaryColorRaw === null ||
    typeof primaryColorRaw === "string";

  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "ADMIN" || role === "EMPLOYEE") &&
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
    companyLogoUrl &&
    primaryColor
  );
}

function parseMeResponse(j: unknown): SessionDTO | null {
  if (!isRecord(j)) return null;
  const session = j["session"];
  if (session === null) return null;
  return isSessionDTO(session) ? session : null;
}

function isCalendarEventDTO(v: unknown): v is CalendarEventDTO {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const date = getStringField(v, "date");
  const startHHMM = getStringField(v, "startHHMM");
  const endHHMM = getStringField(v, "endHHMM");
  const title = getStringField(v, "title");

  const locRaw = v["location"];
  const notesRaw = v["notes"];
  const location = locRaw === null || typeof locRaw === "string" ? locRaw : undefined;
  const notes = notesRaw === null || typeof notesRaw === "string" ? notesRaw : undefined;

  return (
    typeof id === "string" &&
    typeof date === "string" &&
    typeof startHHMM === "string" &&
    typeof endHHMM === "string" &&
    typeof title === "string" &&
    (location === null || typeof location === "string") &&
    (notes === null || typeof notes === "string")
  );
}

function parseAppointmentsResponse(j: unknown): CalendarEventDTO[] {
  if (!isRecord(j)) return [];
  if (j["ok"] !== true) return [];
  const events = j["events"];
  if (!Array.isArray(events)) return [];
  return events.filter(isCalendarEventDTO);
}

function extractErrorMessage(j: unknown, fallback: string): string {
  if (!isRecord(j)) return fallback;
  const e = j["error"];
  return typeof e === "string" && e.trim() ? e : fallback;
}

function mapPlanEntriesError(
  language: AppUiLanguage,
  error: string | null | undefined,
  fallback: string
): string {
  switch (error) {
    case "PLAN_ENTRIES_UNAUTHORIZED":
      return translate(language, "planEntriesUnauthorized", KALENDER_DICTIONARY);
    case "PLAN_ENTRIES_FORBIDDEN":
      return translate(language, "planEntriesForbidden", KALENDER_DICTIONARY);
    case "PLAN_ENTRIES_FROM_TO_MISSING":
      return translate(language, "planEntriesFromToMissing", KALENDER_DICTIONARY);
    case "PLAN_ENTRIES_EMPLOYEE_NOT_FOUND":
      return translate(language, "planEntriesEmployeeNotFound", KALENDER_DICTIONARY);
    default:
      return fallback;
  }
}

function monthKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function addMonths(d: Date, diff: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + diff);
  return x;
}

function addDaysYMD(ymd: string, diff: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + diff);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDateTitle(ymd: string, language: AppUiLanguage): string {
  const [y, m, d] = ymd.split("-").map(Number);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return ymd;
  }

  const weekdayKeys = [
    "mondayLong",
    "tuesdayLong",
    "wednesdayLong",
    "thursdayLong",
    "fridayLong",
    "saturdayLong",
    "sundayLong",
  ] as const;

  const monthKeys = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ] as const;

  const dt = new Date(y, m - 1, d);
  const weekdayKey = weekdayKeys[(dt.getDay() + 6) % 7];
  const monthKey = monthKeys[m - 1];

  const weekday = translate(language, weekdayKey, KALENDER_DICTIONARY);
  const monthName = translate(language, monthKey, KALENDER_DICTIONARY);

  return `${weekday}, ${String(d).padStart(2, "0")}. ${monthName} ${y}`;
}

function dateInRange(date: string, start: string, end: string): boolean {
  return start <= date && date <= end;
}

function getRequestedSickDays(
  start: string,
  end: string
): number {
  if (!start || !end || end < start) {
    return 0;
  }

  const startDate = ymdToDateLocal(start);
  const endDate = ymdToDateLocal(end);

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const ymd = toYMDLocal(current);

    if (!isBadenWuerttembergNonWorkingHolidayYMD(ymd)) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

function getRequestedVacationDays(
  start: string,
  end: string,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === "HALF_DAY") {
    const startDate = ymdToDateLocal(start);
    const day = startDate.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (!isWeekday || isBadenWuerttembergNonWorkingHolidayYMD(start)) {
      return 0;
    }

    return 0.5;
  }

  const startDate = ymdToDateLocal(start);
  const endDate = ymdToDateLocal(end);

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const ymd = toYMDLocal(current);
    const day = current.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday && !isBadenWuerttembergNonWorkingHolidayYMD(ymd)) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

function toYMDLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ymdToDateLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysLocal(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getEasterSundayDateLocal(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function getBadenWuerttembergNonWorkingHolidaySet(year: number): Set<string> {
  const holidayDates = new Set<string>([
    `${year}-01-01`,
    `${year}-01-06`,
    `${year}-05-01`,
    `${year}-10-03`,
    `${year}-11-01`,
    `${year}-12-25`,
    `${year}-12-26`,
  ]);

  const easterSunday = getEasterSundayDateLocal(year);

  holidayDates.add(toYMDLocal(addDaysLocal(easterSunday, -2)));
  holidayDates.add(toYMDLocal(addDaysLocal(easterSunday, 1)));
  holidayDates.add(toYMDLocal(addDaysLocal(easterSunday, 39)));
  holidayDates.add(toYMDLocal(addDaysLocal(easterSunday, 50)));
  holidayDates.add(toYMDLocal(addDaysLocal(easterSunday, 60)));

  return holidayDates;
}

function isBadenWuerttembergNonWorkingHolidayYMD(ymd: string): boolean {
  const [year] = ymd.split("-").map(Number);

  if (!Number.isFinite(year)) {
    return false;
  }

  return getBadenWuerttembergNonWorkingHolidaySet(year).has(ymd);
}

function getExcludedSickHolidayDates(
  start: string,
  end: string
): string[] {
  if (!start || !end || end < start) {
    return [];
  }

  const startDate = ymdToDateLocal(start);
  const endDate = ymdToDateLocal(end);
  const excludedDates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const ymd = toYMDLocal(current);

    if (isBadenWuerttembergNonWorkingHolidayYMD(ymd)) {
      excludedDates.push(ymd);
    }

    current.setDate(current.getDate() + 1);
  }

  return excludedDates;
}

function getExcludedVacationHolidayDates(
  start: string,
  end: string,
  dayPortion: AbsenceDayPortion
): string[] {
  if (!start || !end || end < start) {
    return [];
  }

  if (dayPortion === "HALF_DAY") {
    const startDate = ymdToDateLocal(start);
    const day = startDate.getDay();
    const isWeekday = day >= 1 && day <= 5;

    return isWeekday && isBadenWuerttembergNonWorkingHolidayYMD(start)
      ? [start]
      : [];
  }

  const startDate = ymdToDateLocal(start);
  const endDate = ymdToDateLocal(end);
  const excludedDates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const ymd = toYMDLocal(current);
    const day = current.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday && isBadenWuerttembergNonWorkingHolidayYMD(ymd)) {
      excludedDates.push(ymd);
    }

    current.setDate(current.getDate() + 1);
  }

  return excludedDates;
}

function holidayExclusionHint(
  language: AppUiLanguage,
  dates: string[]
): string {
  const labels: Record<AppUiLanguage, string> = {
    DE:
      dates.length === 1
        ? "Dieser gesetzliche Feiertag wird automatisch nicht als Urlaubstag mitgezählt:"
        : "Diese gesetzlichen Feiertage werden automatisch nicht als Urlaubstage mitgezählt:",
    EN:
      dates.length === 1
        ? "This public holiday is automatically not counted as a vacation day:"
        : "These public holidays are automatically not counted as vacation days:",
    IT:
      dates.length === 1
        ? "Questo giorno festivo legale non viene conteggiato automaticamente come giorno di ferie:"
        : "Questi giorni festivi legali non vengono conteggiati automaticamente come giorni di ferie:",
    TR:
      dates.length === 1
        ? "Bu resmî tatil otomatik olarak izin günü sayılmaz:"
        : "Bu resmî tatiller otomatik olarak izin günü sayılmaz:",
    SQ:
      dates.length === 1
        ? "Kjo festë zyrtare nuk llogaritet automatikisht si ditë pushimi:"
        : "Këto festa zyrtare nuk llogariten automatikisht si ditë pushimi:",
    KU:
      dates.length === 1
        ? "Ev cejna fermî bixweber wekî roja bêhnvedanê nayê hesibandin:"
        : "Ev cejnên fermî bixweber wekî rojên bêhnvedanê nayên hesibandin:",
    RO:
      dates.length === 1
        ? "Această sărbătoare legală nu este numărată automat ca zi de vacanță:"
        : "Aceste sărbători legale nu sunt numărate automat ca zile de vacanță:",
  };

  return `${labels[language]} ${dates.join(", ")}`;
}

function sickHolidayExclusionHint(
  language: AppUiLanguage,
  dates: string[]
): string {
  const labels: Record<AppUiLanguage, string> = {
    DE:
      dates.length === 1
        ? "Dieser gesetzliche Feiertag wird automatisch nicht als Krankheitstag eingetragen:"
        : "Diese gesetzlichen Feiertage werden automatisch nicht als Krankheitstage eingetragen:",
    EN:
      dates.length === 1
        ? "This public holiday is automatically not recorded as a sick day:"
        : "These public holidays are automatically not recorded as sick days:",
    IT:
      dates.length === 1
        ? "Questo giorno festivo legale non viene registrato automaticamente come giorno di malattia:"
        : "Questi giorni festivi legali non vengono registrati automaticamente come giorni di malattia:",
    TR:
      dates.length === 1
        ? "Bu resmî tatil otomatik olarak hastalık günü olarak kaydedilmez:"
        : "Bu resmî tatiller otomatik olarak hastalık günü olarak kaydedilmez:",
    SQ:
      dates.length === 1
        ? "Kjo festë zyrtare nuk regjistrohet automatikisht si ditë sëmundjeje:"
        : "Këto festa zyrtare nuk regjistrohen automatikisht si ditë sëmundjeje:",
    KU:
      dates.length === 1
        ? "Ev cejna fermî bixweber wekî roja nexweşiyê nayê tomar kirin:"
        : "Ev cejnên fermî bixweber wekî rojên nexweşiyê nayên tomar kirin:",
    RO:
      dates.length === 1
        ? "Această sărbătoare legală nu este înregistrată automat ca zi de boală:"
        : "Aceste sărbători legale nu sunt înregistrate automat ca zile de boală:",
  };

  return `${labels[language]} ${dates.join(", ")}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

function buildRequestBlocks(requests: AbsenceRequestDTO[]): AbsenceRequestBlock[] {
  return requests
    .map((r) => ({
      id: r.id,
      type: r.type,
      dayPortion: r.dayPortion,
      status: r.status,
      compensation: r.compensation,
      sickLeaveKind: r.sickLeaveKind,
      timeMode: r.timeMode,
      startTime: r.startTime,
      endTime: r.endTime,
      paidMinutes: r.paidMinutes,
      paidVacationUnits: r.paidVacationUnits,
      unpaidVacationUnits: r.unpaidVacationUnits,
      autoUnpaidBecauseNoBalance: r.autoUnpaidBecauseNoBalance,
      compensationLockedBySystem: r.compensationLockedBySystem,
      start: r.startDate,
      end: r.endDate,
      noteEmployee: r.noteEmployee,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      decidedAt: r.decidedAt,
      decidedBy: r.decidedBy,
    }))
    .sort((a, b) => {
      if (a.start !== b.start) return a.start < b.start ? -1 : 1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
}

function requestStatusLabel(
  language: AppUiLanguage,
  status: AbsenceRequestStatus
): string {
  if (status === "PENDING") {
    return translate(language, "statusOpen", KALENDER_DICTIONARY);
  }

  if (status === "APPROVED") {
    return translate(language, "statusApproved", KALENDER_DICTIONARY);
  }

  return translate(language, "statusRejected", KALENDER_DICTIONARY);
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

function vacationDayLabel(
  value: number,
  language: AppUiLanguage
): string {
  return translate(
    language,
    Math.abs(value) === 1 ? "dayLabel" : "daysLabel",
    KALENDER_DICTIONARY
  );
}

function getRequestCompensationSummary(
  language: AppUiLanguage,
  paidVacationUnits: number,
  unpaidVacationUnits: number,
  compensation: AbsenceCompensation
): string {
  const paidDays = paidVacationUnits / 2;
  const unpaidDays = unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return replaceTemplate(
      translate(language, "daysPaidDaysUnpaid", KALENDER_DICTIONARY),
      {
        paid: formatVacationDays(paidDays),
        unpaid: formatVacationDays(unpaidDays),
      }
    );
  }

  if (paidDays > 0) {
    return translate(language, "paid", KALENDER_DICTIONARY);
  }

  if (unpaidDays > 0) {
    return translate(language, "unpaid", KALENDER_DICTIONARY);
  }

  return compensation === "PAID"
    ? translate(language, "paid", KALENDER_DICTIONARY)
    : translate(language, "unpaid", KALENDER_DICTIONARY);
}

function getRequestCompensationHint(
  language: AppUiLanguage,
  paidVacationUnits: number,
  unpaidVacationUnits: number
): string | null {
  const paidDays = paidVacationUnits / 2;
  const unpaidDays = unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return replaceTemplate(
      translate(language, "ofWhichPaidUnpaid", KALENDER_DICTIONARY),
      {
        paid: formatVacationDays(paidDays),
        unpaid: formatVacationDays(unpaidDays),
      }
    );
  }

  return null;
}

function getAbsenceCompensationSummary(
  language: AppUiLanguage,
  absences: AbsenceDTO[]
): string | null {
  const vacationAbsences = absences.filter((a) => a.type === "VACATION");

  if (vacationAbsences.length === 0) {
    return null;
  }

  const paidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "PAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  const unpaidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "UNPAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  return getRequestCompensationSummary(language, paidUnits, unpaidUnits, "PAID");
}

function getAbsenceCompensationBreakdown(
  language: AppUiLanguage,
  absences: AbsenceDTO[]
): string | null {
  const vacationAbsences = absences.filter((a) => a.type === "VACATION");

  if (vacationAbsences.length === 0) {
    return null;
  }

  const paidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "PAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  const unpaidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "UNPAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  const paidDays = paidUnits / 2;
  const unpaidDays = unpaidUnits / 2;

    if (paidDays > 0 && unpaidDays > 0) {
    return replaceTemplate(
      translate(language, "daysPaidDaysUnpaid", KALENDER_DICTIONARY),
      {
        paid: formatVacationDays(paidDays),
        unpaid: formatVacationDays(unpaidDays),
      }
    );
  }

  if (paidDays > 0) {
    return `${formatVacationDays(paidDays)} ${translate(language, "paid", KALENDER_DICTIONARY)}`;
  }

  if (unpaidDays > 0) {
    return `${formatVacationDays(unpaidDays)} ${translate(language, "unpaid", KALENDER_DICTIONARY)}`;
  }

  return null;
}

function requestBlockLabel(
  language: AppUiLanguage,
  b: AbsenceRequestBlock
): React.ReactNode {
  const isVacation = b.type === "VACATION";

  const icon = isVacation ? (
    <TreePalm/>
  ) : (
    <Stethoscope size={14} style={{ flex: "0 0 auto" }} />
  );

  if (isVacation && b.dayPortion === "HALF_DAY") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span>
          {replaceTemplate(
            translate(language, "vacationRequestHalfDay", KALENDER_DICTIONARY),
            { date: b.start }
          )}
        </span>
      </span>
    );
  }

  const isDoctorAppointmentTimeRange =
    b.type === "SICK" &&
    b.sickLeaveKind === "DOCTOR_APPOINTMENT" &&
    b.timeMode === "TIME_RANGE";

  const name = isVacation
    ? translate(language, "vacationRequest", KALENDER_DICTIONARY)
    : isDoctorAppointmentTimeRange
      ? doctorAppointmentLabel(language)
      : translate(language, "sicknessRequest", KALENDER_DICTIONARY);

  const span = b.start === b.end ? b.start : `${b.start}–${b.end}`;
  const timeRange =
    isDoctorAppointmentTimeRange && b.startTime && b.endTime
      ? ` · ${b.startTime}–${b.endTime}`
      : "";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon}
      <span>
        {name} ({span}{timeRange})
      </span>
    </span>
  );
}

const CAT_STORAGE_KEY = "mafliesen_admin_event_categories_v1";

function isEventCategory(v: unknown): v is EventCategory {
  return v === "KUNDE" || v === "BAUSTELLE" || v === "INTERN" || v === "PRIVAT";
}

function safeReadCategoryMap(): Record<string, EventCategory> {
  try {
    const raw = window.localStorage.getItem(CAT_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const out: Record<string, EventCategory> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === "string" && isEventCategory(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function safeWriteCategoryMap(map: Record<string, EventCategory>): void {
  try {
    window.localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function categoryLabel(language: AppUiLanguage, c: EventCategory): string {
  if (c === "KUNDE") return translate(language, "customer", KALENDER_DICTIONARY);
  if (c === "BAUSTELLE") return translate(language, "site", KALENDER_DICTIONARY);
  if (c === "INTERN") return translate(language, "internal", KALENDER_DICTIONARY);
  return translate(language, "private", KALENDER_DICTIONARY);
}

function categoryDotStyle(c: EventCategory): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    flex: "0 0 auto",
    marginTop: 4,
    boxShadow: "0 0 0 3px var(--brand-neutral-card-bg)",
  };

  if (c === "KUNDE") return { ...base, background: "var(--brand-work-border)" };
  if (c === "BAUSTELLE") return { ...base, background: "var(--brand-vacation-border)" };
  if (c === "INTERN") return { ...base, background: "var(--brand-holiday-border)" };
  return { ...base, background: "var(--brand-sick-border)" };
}

function pillClassName(): string {
  return "calendar-pill";
}

function getHolidayIcon(name: string | null): React.ReactNode {
  if (!name) return <CalendarDays size={14} />;

  const n = name.toLowerCase();

  if (n.includes("neujahr")) {
    return <Sparkles size={14} />;
  }

  if (n.includes("heilige drei könige")) {
    return <Crown size={14} />;
  }

  if (n.includes("karfreitag")) {
    return <Sun size={14} />;
  }

  if (n.includes("ostermontag") || n.includes("ostern")) {
    return <Flower2 size={14} />;
  }

  if (n.includes("christi himmelfahrt")) {
    return <Sun size={14} />;
  }

  if (n.includes("pfingstmontag")) {
    return <Flower2 size={14} />;
  }

  if (n.includes("fronleichnam")) {
    return <Trees size={14} />;
  }

  if (n.includes("tag der arbeit")) {
    return <Briefcase size={14} />;
  }

  if (n.includes("tag der deutschen einheit")) {
    return <Users size={14} />;
  }

  if (n.includes("allerheiligen")) {
    return <Trees size={14} />;
  }

  if (n.includes("weihnacht")) {
    return <Trees size={14} />;
  }

  return <PartyPopper size={14} />;
}

function holidayDotColor(): string {
  return "var(--brand-holiday-border)";
}

function smallDot(color: string): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    boxShadow: "0 0 0 3px var(--brand-neutral-card-bg)",
    flex: "0 0 auto",
  };
}

type KalenderPageProps = {
  forceAdminOwnCalendar?: boolean;
};

function parseAbsenceTypeParam(value: string | null): AbsenceType | undefined {
  if (value === "VACATION" || value === "SICK") {
    return value;
  }

  return undefined;
}

function parseAbsenceDayPortionParam(value: string | null): AbsenceDayPortion | undefined {
  if (value === "FULL_DAY" || value === "HALF_DAY") {
    return value;
  }

  return undefined;
}

function parseAbsenceCompensationParam(value: string | null): AbsenceCompensation | undefined {
  if (value === "PAID" || value === "UNPAID") {
    return value;
  }

  return undefined;
}

type OpenDayPrefill = {
  absenceStart?: string;
  absenceEnd?: string;
  absenceType?: AbsenceType;
  absenceDayPortion?: AbsenceDayPortion;
  absenceCompensation?: AbsenceCompensation;
};

function KalenderPageInner({
  forceAdminOwnCalendar = false,
}: KalenderPageProps) {
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = (key: KalenderTextKey): string =>
    translate(language, key, KALENDER_DICTIONARY);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const didConsumeOpenParamsRef = useRef(false);
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");

  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<SessionDTO | null>(null);

  type UserOption = { id: string; fullName: string };

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [monthAbsences, setMonthAbsences] = useState<AbsenceDTO[]>([]);
  const [absLoading, setAbsLoading] = useState(false);
  const [monthRequests, setMonthRequests] = useState<AbsenceRequestDTO[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [requestNote, setRequestNote] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [dayPlans, setDayPlans] = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [adminEmployeeDayPlans, setAdminEmployeeDayPlans] = useState<PlanEntry[]>([]);
  const [adminEmployeePlansLoading, setAdminEmployeePlansLoading] = useState(false);
  const [adminEmployeePlansError, setAdminEmployeePlansError] = useState<string | null>(null);

  const [absenceStart, setAbsenceStart] = useState<string>("");
  const [absenceEnd, setAbsenceEnd] = useState<string>("");
  const [absenceType, setAbsenceType] = useState<AbsenceType>("VACATION");
  const [absenceDayPortion, setAbsenceDayPortion] = useState<AbsenceDayPortion>("FULL_DAY");
  const [absenceCompensation, setAbsenceCompensation] = useState<AbsenceCompensation>("PAID");
  const [sickLeaveKind, setSickLeaveKind] = useState<SickLeaveKind>("SICK_LEAVE");
  const [absenceTimeMode, setAbsenceTimeMode] = useState<AbsenceTimeMode>("FULL_DAY");
  const [absenceStartTime, setAbsenceStartTime] = useState<string>("09:00");
  const [absenceEndTime, setAbsenceEndTime] = useState<string>("11:00");
  const [remainingPaidVacationDaysForMonth, setRemainingPaidVacationDaysForMonth] = useState<number>(0);
  const [compensationLockedBySystem, setCompensationLockedBySystem] = useState<boolean>(false);
  const [selectedRequestBlock, setSelectedRequestBlock] = useState<AbsenceRequestBlock | null>(null);

    const requestedVacationDaysPreview = useMemo(() => {
    if (absenceType !== "VACATION") {
      return 0;
    }

    if (!absenceStart || !absenceEnd || absenceEnd < absenceStart) {
      return 0;
    }

    return getRequestedVacationDays(
      absenceStart,
      absenceEnd,
      absenceDayPortion
    );
  }, [absenceStart, absenceEnd, absenceType, absenceDayPortion]);

  const unpaidVacationDaysPreview = useMemo(() => {
    if (absenceType !== "VACATION") {
      return 0;
    }

    return Math.max(
      0,
      requestedVacationDaysPreview - remainingPaidVacationDaysForMonth
    );
  }, [
    absenceType,
    requestedVacationDaysPreview,
    remainingPaidVacationDaysForMonth,
  ]);

  const paidVacationDaysPreview = useMemo(() => {
    if (absenceType !== "VACATION") {
      return 0;
    }

    return Math.max(
      0,
      requestedVacationDaysPreview - unpaidVacationDaysPreview
    );
  }, [absenceType, requestedVacationDaysPreview, unpaidVacationDaysPreview]);

  const excludedVacationHolidayDatesPreview = useMemo(() => {
    if (absenceType !== "VACATION") {
      return [];
    }

    return getExcludedVacationHolidayDates(
      absenceStart,
      absenceEnd,
      absenceDayPortion
    );
  }, [absenceStart, absenceEnd, absenceType, absenceDayPortion]);

  const excludedSickHolidayDatesPreview = useMemo(() => {
    if (absenceType !== "SICK") {
      return [];
    }

    return getExcludedSickHolidayDates(
      absenceStart,
      absenceEnd
    );
  }, [absenceStart, absenceEnd, absenceType]);

  const [dayAppointments, setDayAppointments] = useState<CalendarEventDTO[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  const [adminMode, setAdminMode] = useState<AdminApptMode>("create-from-day");

  const [apptEditingId, setApptEditingId] = useState<string | null>(null);
  const [apptCategory, setApptCategory] = useState<EventCategory>("KUNDE");
  const [apptTitle, setApptTitle] = useState<string>("");
  const [apptDate, setApptDate] = useState<string>("");
  const [apptStart, setApptStart] = useState<string>("08:00");
  const [apptEnd, setApptEnd] = useState<string>("09:00");
  const [apptLocation, setApptLocation] = useState<string>("");
  const [apptNotes, setApptNotes] = useState<string>("");

  const [categoryMap, setCategoryMap] = useState<Record<string, EventCategory>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => monthKey(cursor), [cursor]);
  const isAdmin = forceAdminOwnCalendar || session?.role === "ADMIN";
  const isAdminOwnCalendar = isAdmin && !selectedUserId;
  const isAdminViewingEmployee = isAdmin && !!selectedUserId;
  const showEmployeeCalendarLegend = !isAdminOwnCalendar;

  const title = useMemo(() => {
    if (viewMode === "WEEK") {
      const ws = startOfWeekMonday(cursor);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);

      const fmt = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${dd}.${mm}.${yyyy}`;
      };

      return `${fmt(ws)} – ${fmt(we)}`;
    }

    const monthKeys = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ] as const;

    const monthKey = monthKeys[cursor.getMonth()];
    const monthLabel = translate(language, monthKey, KALENDER_DICTIONARY);

    return `${monthLabel} ${cursor.getFullYear()}`;
  }, [cursor, language, viewMode]);

  const weekMeta = useMemo(() => {
    if (viewMode !== "WEEK") return null;

    const ws = startOfWeekMonday(cursor);
    const kw = getISOWeek(ws);

    return { kw, ws };
  }, [cursor, viewMode]);

  const todayYMD = useMemo(() => toYMDLocal(new Date()), []);
  function jumpToToday(): void {
    const now = new Date();
    setCursor(now);

    if (open) {
      setSelectedDate(toYMDLocal(now));
    }
  }

  useEffect(() => {
    let alive = true;

    fetch("/api/me", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!alive) return;

        const parsed = parseMeResponse(j);
        if (parsed?.language) {
          setLanguage(parsed.language);
        }

        if (forceAdminOwnCalendar) {
          if (parsed && parsed.role === "ADMIN") {
            setSession(parsed);
            return;
          }

          setSession({
            userId: "",
            fullName: "",
            role: "ADMIN",
            language: "DE",
            companyId: "",
            companyName: "",
            companySubdomain: "",
            companyLogoUrl: null,
            primaryColor: null,
          });
          return;
        }

        setSession(parsed);
      })
      .catch(() => {
        if (!alive) return;

        if (forceAdminOwnCalendar) {
          setSession({
            userId: "",
            fullName: "",
            role: "ADMIN",
            language: "DE",
            companyId: "",
            companyName: "",
            companySubdomain: "",
            companyLogoUrl: null,
            primaryColor: null,
          });
          return;
        }

        setSession(null);
      });

    return () => {
      alive = false;
    };
  }, [forceAdminOwnCalendar]);

  useEffect(() => {
    if (!isAdmin) return;

    fetch("/api/users")
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!isRecord(j) || j["ok"] !== true) return;
        const list = j["users"];
        if (!Array.isArray(list)) return;

        const parsed: UserOption[] = [];
        for (const it of list) {
          if (!isRecord(it)) continue;
          const id = getStringField(it, "id");
          const fullName = getStringField(it, "fullName");
          if (id && fullName) parsed.push({ id, fullName });
        }
        setUsers(parsed);
      })
      .catch(() => setUsers([]));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    setCategoryMap(safeReadCategoryMap());
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    safeWriteCategoryMap(categoryMap);
  }, [categoryMap, isAdmin]);

  async function loadCalendar(): Promise<void> {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ month: ym });
      if (isAdminViewingEmployee && selectedUserId) qs.set("userId", selectedUserId);
      const r = await fetch(`/api/calendar?${qs.toString()}`);
      const j: unknown = await r.json();
      const parsed = parseCalendarResponse(j, language);
      setData(parsed.ok ? parsed.days : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadAbsencesMonth(): Promise<void> {
    setAbsLoading(true);
    try {
      const params = new URLSearchParams({ month: ym });

      if (isAdminViewingEmployee && selectedUserId) {
        params.set("userId", selectedUserId);
      }

      const r = await fetch(`/api/absences?${params.toString()}`);
      const j: unknown = await r.json();
      setMonthAbsences(r.ok ? parseAbsencesResponse(j) : []);
    } finally {
      setAbsLoading(false);
    }
  }

  async function loadRequestsMonth(): Promise<void> {
    setReqLoading(true);
    try {
      const r = await fetch(`/api/absence-requests?${new URLSearchParams({ month: ym }).toString()}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setMonthRequests([]);
        setRemainingPaidVacationDaysForMonth(0);
        return;
      }

      const parsed = parseAbsenceRequestsResponse(j);
      setMonthRequests(parsed.requests);
      setRemainingPaidVacationDaysForMonth(parsed.remainingPaidVacationDaysForMonth);
    } finally {
      setReqLoading(false);
    }
  }

  async function reloadMonthAll(): Promise<void> {
    if (isAdminViewingEmployee) {
      await Promise.all([loadCalendar(), loadAbsencesMonth()]);
      return;
    }

    if (isAdminOwnCalendar) {
      await loadCalendar();
      return;
    }

    await Promise.all([loadCalendar(), loadAbsencesMonth(), loadRequestsMonth()]);
  }

  useEffect(() => {
    void reloadMonthAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, session?.role, selectedUserId]);

  useEffect(() => {
    if (!open || !selectedDate || !isAdminViewingEmployee) return;
    void loadAdminEmployeePlansForDay(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedUserId, open, isAdminViewingEmployee]);

  useEffect(() => {
    if (selectedRequestBlock) return;
    if (absenceType !== "VACATION") {
      setCompensationLockedBySystem(false);
      return;
    }

    const requiredDays = getRequestedVacationDays(
      absenceStart,
      absenceEnd,
      absenceDayPortion
    );

    const mustForceUnpaid =
      remainingPaidVacationDaysForMonth + 1e-9 < requiredDays;

    if (mustForceUnpaid) {
      setAbsenceCompensation("PAID");
      setCompensationLockedBySystem(true);
      return;
    }

    setCompensationLockedBySystem(false);
  }, [
    absenceStart,
    absenceEnd,
    absenceType,
    absenceDayPortion,
    remainingPaidVacationDaysForMonth,
    selectedRequestBlock,
  ]);

  const dayMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);
  const requestBlocks = useMemo(
    () => (isAdmin ? [] : buildRequestBlocks(monthRequests)),
    [monthRequests, isAdmin]
  );

  const requestBlocksForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];
    return requestBlocks.filter((b) => b.status === "PENDING" && dateInRange(selectedDate, b.start, b.end));
  }, [requestBlocks, selectedDate, isAdmin]);

  const confirmedAbsencesForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];

    const selectedDayInfo = dayMap.get(selectedDate);

    if (selectedDayInfo?.hasHoliday) {
      return [];
    }

    return monthAbsences.filter((a) => a.absenceDate === selectedDate);
  }, [dayMap, monthAbsences, selectedDate, isAdmin]);

  const grid = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);

    const firstDay = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
    for (let i = 0; i < firstDay; i += 1) cells.push({ date: "", day: 0, inMonth: false });

    for (let d = 1; d <= daysInMonth; d += 1) {
      const dd = String(d).padStart(2, "0");
      const date = `${ym}-${dd}`;
      cells.push({ date, day: d, inMonth: true });
    }

    while (cells.length < 42) cells.push({ date: "", day: 0, inMonth: false });
    return cells;
  }, [ym]);

  const weekDays = useMemo(() => {
    const ws = startOfWeekMonday(cursor);
    const out: Array<{ date: string; label: string; dayNum: string; isToday: boolean }> = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      const ymd = toYMDLocal(d);
      const weekdayShort = [
        t("weekShortMon"),
        t("weekShortTue"),
        t("weekShortWed"),
        t("weekShortThu"),
        t("weekShortFri"),
        t("weekShortSat"),
        t("weekShortSun"),
      ] as const;
      const weekdayIndex = (d.getDay() + 6) % 7;
      const label = weekdayShort[weekdayIndex] ?? "";
      const dayNum = String(d.getDate()).padStart(2, "0");
      out.push({ date: ymd, label, dayNum, isToday: ymd === todayYMD });
    }
    return out;
  }, [cursor, todayYMD]);

  const loadPlansForDay = useCallback(async (date: string): Promise<void> => {
    setPlansLoading(true);
    setPlansError(null);

    try {
      const to = addDaysYMD(date, 1);
      const r = await fetch(`/api/plan-entries?from=${encodeURIComponent(date)}&to=${encodeURIComponent(to)}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setDayPlans([]);
        setPlansError(
          mapPlanEntriesError(
            language,
            isRecord(j) && typeof j["error"] === "string" ? j["error"] : null,
            t("planCouldNotBeLoaded")
          )
        );
        return;
      }

      setDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setDayPlans([]);
      setPlansError(t("networkPlanLoadError"));
    } finally {
      setPlansLoading(false);
    }
  }, [language, t]);

  const loadAdminEmployeePlansForDay = useCallback(async (date: string): Promise<void> => {
    if (!selectedUserId) {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError(null);
      setAdminEmployeePlansLoading(false);
      return;
    }

    setAdminEmployeePlansLoading(true);
    setAdminEmployeePlansError(null);

    try {
      const to = addDaysYMD(date, 1);
      const qs = new URLSearchParams({
        from: date,
        to,
        userId: selectedUserId,
      });

      const r = await fetch(`/api/plan-entries?${qs.toString()}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setAdminEmployeeDayPlans([]);
        setAdminEmployeePlansError(
          mapPlanEntriesError(
            language,
            isRecord(j) && typeof j["error"] === "string" ? j["error"] : null,
            t("employeePlanCouldNotBeLoaded")
          )
        );
        return;
      }

      setAdminEmployeeDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError(
        t("networkEmployeePlanLoadError")
      );
    } finally {
      setAdminEmployeePlansLoading(false);
    }
  }, [language, selectedUserId, t]);

  const loadAppointmentsForDay = useCallback(async (date: string): Promise<void> => {
    setApptLoading(true);
    setApptError(null);

    try {
      const r = await fetch(`/api/admin/appointments?date=${encodeURIComponent(date)}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setDayAppointments([]);
        setApptError(extractErrorMessage(j, t("appointmentsCouldNotBeLoaded")));
        return;
      }

      const list = parseAppointmentsResponse(j)
        .slice()
        .sort((a, b) => (a.startHHMM < b.startHHMM ? -1 : a.startHHMM > b.startHHMM ? 1 : 0));

      setDayAppointments(list);
    } catch {
      setDayAppointments([]);
      setApptError(t("networkAppointmentsLoadError"));
    } finally {
      setApptLoading(false);
    }
  }, [t]);

  function resetAppointmentForm(): void {
    setApptEditingId(null);
    setApptCategory("KUNDE");
    setApptTitle("");
    setApptDate("");
    setApptStart("08:00");
    setApptEnd("09:00");
    setApptLocation("");
    setApptNotes("");
    setApptError(null);
    setError(null);
  }

  const openDay = useCallback((date: string, prefill?: OpenDayPrefill): void => {
    setSelectedDate(date);
    setOpen(true);
    setError(null);

    if (isAdminOwnCalendar) {
      setAdminMode("create-from-day");
      resetAppointmentForm();
      setApptDate(date);
      setDayAppointments([]);
      void loadAppointmentsForDay(date);
      return;
    }

    if (isAdminViewingEmployee) {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError(null);
      setAdminEmployeePlansLoading(false);
      void loadAdminEmployeePlansForDay(date);
      return;
    }

    const nextAbsenceType = prefill?.absenceType ?? "VACATION";
    const nextAbsenceStart = prefill?.absenceStart ?? date;
    const nextAbsenceEnd = prefill?.absenceEnd ?? nextAbsenceStart;

    setSelectedRequestBlock(null);
    setAbsenceStart(nextAbsenceStart);
    setAbsenceEnd(nextAbsenceEnd);
    setAbsenceType(nextAbsenceType);
    setAbsenceDayPortion(prefill?.absenceDayPortion ?? "FULL_DAY");
    setAbsenceCompensation(
      prefill?.absenceCompensation ?? "PAID"
    );
    setSickLeaveKind("SICK_LEAVE");
    setAbsenceTimeMode("FULL_DAY");
    setAbsenceStartTime("09:00");
    setAbsenceEndTime("11:00");
    setCompensationLockedBySystem(false);
    setRequestNote("");

    setDayPlans([]);
    setPlansError(null);
    setPlansLoading(false);

    void loadPlansForDay(date);
  }, [
    isAdminOwnCalendar,
    isAdminViewingEmployee,
    loadAdminEmployeePlansForDay,
    loadAppointmentsForDay,
    loadPlansForDay,
  ]);

  useEffect(() => {
    if (didConsumeOpenParamsRef.current) {
      return;
    }

    const openDateParam = searchParams.get("openDate");
    const absenceStartParam = searchParams.get("absenceStart");
    const absenceEndParam = searchParams.get("absenceEnd");
    const absenceTypeParam = searchParams.get("absenceType");
    const absenceDayPortionParam = searchParams.get("absenceDayPortion");
    const absenceCompensationParam = searchParams.get("absenceCompensation");
    const openSourceParam = searchParams.get("openSource");

    const resolvedOpenDate =
      openDateParam || absenceStartParam || absenceEndParam;

    if (!resolvedOpenDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedOpenDate)) return;

    const resolvedStart =
      absenceStartParam && /^\d{4}-\d{2}-\d{2}$/.test(absenceStartParam)
        ? absenceStartParam
        : resolvedOpenDate;

    const resolvedEnd =
      absenceEndParam && /^\d{4}-\d{2}-\d{2}$/.test(absenceEndParam)
        ? absenceEndParam
        : resolvedStart;

    const resolvedType =
      parseAbsenceTypeParam(absenceTypeParam) ?? "VACATION";

    const resolvedDayPortion =
      parseAbsenceDayPortionParam(absenceDayPortionParam) ?? "FULL_DAY";

    const resolvedCompensation =
      parseAbsenceCompensationParam(absenceCompensationParam) ?? "PAID";

    didConsumeOpenParamsRef.current = true;

    setCursor(ymdToDateLocal(resolvedOpenDate));

    if (openSourceParam === "plan-entry") {
      setViewMode("WEEK");
    }

    if (isAdmin) {
      openDay(resolvedOpenDate);
      router.replace(pathname, { scroll: false });
      return;
    }

    openDay(resolvedOpenDate, {
      absenceStart: resolvedStart,
      absenceEnd: resolvedEnd,
      absenceType: resolvedType,
      absenceDayPortion: resolvedDayPortion,
      absenceCompensation: resolvedCompensation,
    });

    router.replace(pathname, { scroll: false });
  }, [isAdmin, openDay, pathname, router, searchParams]);

  function syncPlanEntryToWorkEntry(plan: PlanEntry): void {
  const syncDate =
    typeof plan.workDate === "string" && plan.workDate.length >= 10
      ? plan.workDate.slice(0, 10)
      : plan.workDate;

  const params = new URLSearchParams({
    syncDate,
    syncActivity: plan.activity,
    syncLocation: plan.location,
  });

  setOpen(false);
  router.push(`/erfassung?${params.toString()}`);
}

  function openNewEventGlobal(): void {
    const now = new Date();
    const ymd = toYMDLocal(now);

    setCursor(now);
    setSelectedDate(ymd);
    setOpen(true);

    setAdminMode("create-global");
    resetAppointmentForm();
    setApptDate(ymd);

    void loadAppointmentsForDay(ymd);
  }

  function startNewRequest(): void {
    setSelectedRequestBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
    }
    setAbsenceType("VACATION");
    setAbsenceDayPortion("FULL_DAY");
    setAbsenceCompensation("PAID");
    setSickLeaveKind("SICK_LEAVE");
    setAbsenceTimeMode("FULL_DAY");
    setAbsenceStartTime("09:00");
    setAbsenceEndTime("11:00");
    setCompensationLockedBySystem(false);
    setRequestNote("");
  }

  function showRequestDetails(block: AbsenceRequestBlock): void {
    setSelectedRequestBlock(block);
    setAbsenceStart(block.start);
    setAbsenceEnd(block.end);
    setAbsenceType(block.type);
    setAbsenceDayPortion(block.dayPortion);
    setAbsenceCompensation(block.compensation);
    setSickLeaveKind(block.sickLeaveKind ?? "SICK_LEAVE");
    setAbsenceTimeMode(block.timeMode);
    setAbsenceStartTime(block.startTime ?? "09:00");
    setAbsenceEndTime(block.endTime ?? "11:00");
    setCompensationLockedBySystem(block.compensationLockedBySystem);
    setRequestNote(block.noteEmployee);
    setError(null);
  }

  function cancelRequestView(): void {
    setSelectedRequestBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
    }
    setAbsenceType("VACATION");
    setAbsenceDayPortion("FULL_DAY");
    setAbsenceCompensation("PAID");
    setSickLeaveKind("SICK_LEAVE");
    setAbsenceTimeMode("FULL_DAY");
    setAbsenceStartTime("09:00");
    setAbsenceEndTime("11:00");
    setCompensationLockedBySystem(false);
    setRequestNote("");
  }

  async function saveAbsence(): Promise<void> {
    setError(null);

    if (!absenceStart || !absenceEnd) {
      setError(t("pleaseSelectStartEnd"));
      return;
    }

    if (absenceEnd < absenceStart) {
      setError(t("endBeforeStart"));
      return;
    }
    if (absenceType === "SICK" && absenceDayPortion !== "FULL_DAY") {
      setError(t("wholeDayOnlyForSick"));
      return;
    }

    if (
      absenceType === "SICK" &&
      sickLeaveKind === "DOCTOR_APPOINTMENT" &&
      absenceTimeMode === "TIME_RANGE"
    ) {
      if (absenceStart !== absenceEnd) {
        setError("Ein Arzttermin-Zeitraum darf nur für einen einzelnen Tag beantragt werden.");
        return;
      }

      if (!isHHMM(absenceStartTime) || !isHHMM(absenceEndTime)) {
        setError("Bitte gib Startzeit und Endzeit für den Arzttermin an.");
        return;
      }

      if (minutesBetweenHHMM(absenceStartTime, absenceEndTime) <= 0) {
        setError("Die Endzeit des Arzttermins muss nach der Startzeit liegen.");
        return;
      }
    }

    if (absenceDayPortion === "HALF_DAY" && absenceType !== "VACATION") {
      setError(t("halfDaysOnlyVacation"));
      return;
    }

    if (absenceDayPortion === "HALF_DAY" && absenceStart !== absenceEnd) {
      setError(t("halfDaySingleDateOnly"));
      return;
    }

    if (absenceType === "VACATION" && absenceDayPortion === "FULL_DAY") {
      const effectiveVacationDays = getRequestedVacationDays(
        absenceStart,
        absenceEnd,
        absenceDayPortion
      );

      if (effectiveVacationDays <= 0) {
        setError(t("vacationNoWeekdays"));
        return;
      }
    }

    if (absenceType === "SICK" && absenceCompensation !== "PAID") {
      setError(t("sickCannotBeUnpaid"));
      return;
    }

    if (
      absenceType === "SICK" &&
      sickLeaveKind !== "DOCTOR_APPOINTMENT" &&
      getRequestedSickDays(absenceStart, absenceEnd) <= 0
    ) {
      setError(
        "Der Zeitraum enthält nur Feiertage. Es werden keine Krankheitstage eingetragen."
      );
      return;
    }

    setSaving(true);
    try {
      const r = await fetch("/api/absence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: absenceStart,
          endDate: absenceEnd,
          type: absenceType,
          dayPortion: absenceDayPortion,
          compensation: absenceCompensation,
          noteEmployee: requestNote.trim(),
          sickLeaveKind: absenceType === "SICK" ? sickLeaveKind : null,
          timeMode:
            absenceType === "SICK" &&
            sickLeaveKind === "DOCTOR_APPOINTMENT"
              ? absenceTimeMode
              : "FULL_DAY",
          startTime:
            absenceType === "SICK" &&
            sickLeaveKind === "DOCTOR_APPOINTMENT" &&
            absenceTimeMode === "TIME_RANGE"
              ? absenceStartTime
              : null,
          endTime:
            absenceType === "SICK" &&
            sickLeaveKind === "DOCTOR_APPOINTMENT" &&
            absenceTimeMode === "TIME_RANGE"
              ? absenceEndTime
              : null,
        }),
      });

      const j: unknown = await r.json();

      if (!r.ok) {
        setError(extractErrorMessage(j, t("requestCouldNotBeSaved")));
        return;
      }

      setOpen(false);
      setSelectedRequestBlock(null);
      setRequestNote("");
      await reloadMonthAll();
    } catch {
      setError(t("networkSaveError"));
    } finally {
      setSaving(false);
    }
  }

  function effectiveAdminDate(): string {
    if (adminMode === "create-from-day") return selectedDate;
    return apptDate.trim();
  }

  async function saveAppointment(): Promise<void> {
    const date = effectiveAdminDate();
    if (!date) {
      setApptError(t("selectDate"));
      return;
    }

    setApptError(null);
    const titleValue = apptTitle.trim();
    if (!titleValue) {
      setApptError(t("pleaseEnterTitle"));
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(apptStart) || !/^\d{2}:\d{2}$/.test(apptEnd)) {
      setApptError(t("timeMustBeHHMM"));
      return;
    }

    setSaving(true);
    try {
      if (apptEditingId) {
        const r = await fetch(`/api/admin/appointments/${encodeURIComponent(apptEditingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startHHMM: apptStart,
            endHHMM: apptEnd,
            title: titleValue,
            location: apptLocation.trim(),
            notes: apptNotes.trim(),
          }),
        });
        const j: unknown = await r.json();
        if (!r.ok) {
          setApptError(extractErrorMessage(j, t("savingFailed")));
          return;
        }
      } else {
        const r = await fetch("/api/admin/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startHHMM: apptStart,
            endHHMM: apptEnd,
            title: titleValue,
            location: apptLocation.trim(),
            notes: apptNotes.trim(),
          }),
        });
        const j: unknown = await r.json();
        if (!r.ok) {
          setApptError(extractErrorMessage(j, t("savingFailed")));
          return;
        }

        if (isRecord(j) && j["ok"] === true) {
          const ev = j["event"];
          if (isCalendarEventDTO(ev)) {
            setCategoryMap((prev) => ({ ...prev, [ev.id]: apptCategory }));
          }
        }
      }

      setSelectedDate(date);

      await Promise.all([loadAppointmentsForDay(date), reloadMonthAll()]);
      resetAppointmentForm();

      if (adminMode === "edit") setAdminMode("create-from-day");
    } catch {
      setApptError(t("networkSaveError"));
    } finally {
      setSaving(false);
    }
  }

  function editAppointment(a: CalendarEventDTO): void {
    setAdminMode("edit");
    setApptEditingId(a.id);
    setApptTitle(a.title);
    setApptDate(a.date);
    setApptStart(a.startHHMM);
    setApptEnd(a.endHHMM);
    setApptLocation(a.location ?? "");
    setApptNotes(a.notes ?? "");
    setApptCategory(categoryMap[a.id] ?? "KUNDE");
    setApptError(null);
    setError(null);
  }

  async function deleteAppointment(id: string): Promise<void> {
    if (!selectedDate) return;
    setApptError(null);
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/appointments/${encodeURIComponent(id)}`, { method: "DELETE" });
      const j: unknown = await r.json();
      if (!r.ok) {
        setApptError(extractErrorMessage(j, t("deletingFailed")));
        return;
      }

      setCategoryMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      if (apptEditingId === id) resetAppointmentForm();
      await Promise.all([loadAppointmentsForDay(selectedDate), reloadMonthAll()]);
    } catch {
      setApptError(t("networkDeleteError"));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    if (!apptEditingId) return;
    setCategoryMap((prev) => ({ ...prev, [apptEditingId]: apptCategory }));
  }, [apptCategory, apptEditingId, isAdmin]);

  return (
    <AppShell activeLabel={t("appointments")}>
      <div className="card card-olive calendar-page-card">
        <div className="calendar-mobile-header">
          <button
            className="btn calendar-nav-btn"
            onClick={() => {
              if (viewMode === "WEEK") {
                const x = new Date(cursor);
                x.setDate(x.getDate() - 7);
                setCursor(x);
              } else {
                setCursor((d) => addMonths(d, -1));
              }
            }}
          >
            ‹
          </button>

          <div className="calendar-title-column">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div className="calendar-main-title">{title}</div>

              {isAdmin ? (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      const nextUserId = e.target.value;
                      setSelectedUserId(nextUserId);

                      setAdminEmployeeDayPlans([]);
                      setAdminEmployeePlansError(null);
                      setAdminEmployeePlansLoading(false);

                      if (!nextUserId) {
                        setDayAppointments([]);
                        setApptError(null);
                      }
                    }}
                    className="input calendar-user-select"
                    style={{
                      width: "fit-content",
                      minWidth: 100,
                      maxWidth: 320,
                      textAlign: "center",
                      textAlignLast: "center",
                      paddingLeft: 20,
                      paddingRight: 20,
                    }}
                  >
                    <option value="">{t("myAdminAppointments")}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>

                  {isAdminViewingEmployee ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--muted)",
                        textAlign: "center",
                        maxWidth: 420,
                        marginInline: "auto",
                      }}
                    >
                      {t("employeeReadonlyCalendarHint")}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {viewMode === "WEEK" && weekMeta ? (
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 800 }}>
                  {t("calendarWeekLabel")} {weekMeta.kw}
                </div>
              ) : null}
            </div>

            <div className="calendar-segmented-wrap">
              <button
                type="button"
                className={`calendar-segmented-button ${viewMode === "MONTH" ? "is-active" : ""}`}
                onClick={() => setViewMode("MONTH")}
              >
                {t("month")}
              </button>
              <button
                type="button"
                className={`calendar-segmented-button ${viewMode === "WEEK" ? "is-active" : ""}`}
                onClick={() => setViewMode("WEEK")}
              >
                {t("week")}
              </button>
            </div>

            {isAdminOwnCalendar ? (
              <div className="calendar-google-below-toggle">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    router.push("/api/admin/google/connect");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6-6C34.6 2.5 29.6 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.4 5.7C12.1 13.2 17.6 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 2.8-2.1 5.1-4.4 6.7l7 5.5C43.8 37 46.5 31.2 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M10.1 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.4-5.7C1 17.2 0 20.5 0 24s1 6.8 2.7 9.8l7.4-5.1z"/>
                    <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.7l-7-5.5c-2 1.3-4.6 2-9 2-6.4 0-11.9-4.3-13.8-10.1l-7.4 5.7C6.6 42.5 14.6 48 24 48z"/>
                  </svg>

                  {t("connectGoogleCalendar")}
                </button>
              </div>
            ) : null}
          </div>

          <button
            className="btn calendar-nav-btn"
            onClick={() => {
              if (viewMode === "WEEK") {
                const x = new Date(cursor);
                x.setDate(x.getDate() + 7);
                setCursor(x);
              } else {
                setCursor((d) => addMonths(d, 1));
              }
            }}
          >
            ›
          </button>

          {isAdminOwnCalendar ? (
            <div className="calendar-google-desktop">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  router.push("/api/admin/google/connect");
                }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6-6C34.6 2.5 29.6 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.4 5.7C12.1 13.2 17.6 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 2.8-2.1 5.1-4.4 6.7l7 5.5C43.8 37 46.5 31.2 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.1 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.4-5.7C1 17.2 0 20.5 0 24s1 6.8 2.7 9.8l7.4-5.1z"/>
                  <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.7l-7-5.5c-2 1.3-4.6 2-9 2-6.4 0-11.9-4.3-13.8-10.1l-7.4 5.7C6.6 42.5 14.6 48 24 48z"/>
                </svg>

                {t("connectGoogleCalendar")}
              </button>
            </div>
          ) : null}
        </div>

        {viewMode === "WEEK" ? (
          <>
            <div className="calendar-grid-scroll">
              <div className="calendar-week-grid">
                {weekDays.map((w) => {
                  const info = dayMap.get(w.date);
                  const inThisMonth = monthKey(ymdToDateLocal(w.date)) === ym;

                  const border =
                    info?.hasSick
                      ? "var(--brand-sick-border)"
                      : info?.hasVacation
                      ? "var(--brand-vacation-border)"
                      : info?.hasHoliday
                      ? "var(--brand-holiday-border)"
                      : info?.hasPlan
                      ? "var(--brand-work-border)"
                      : "var(--border)";

                  const bg =
                    info?.hasSick
                      ? "var(--brand-sick-bg)"
                      : info?.hasVacation
                      ? "var(--brand-vacation-bg)"
                      : info?.hasHoliday
                      ? "var(--brand-holiday-bg)"
                      : info?.hasPlan
                      ? "var(--brand-work-bg)"
                      : "var(--brand-neutral-card-bg)";

                  return (
                    <button
                      key={w.date}
                      className="card calendar-week-cell"
                      onClick={() => {
                        const dt = ymdToDateLocal(w.date);
                        setCursor(dt);
                        openDay(w.date);
                      }}
                      style={{
                        borderColor: border,
                        background: bg,
                        opacity: inThisMonth ? 1 : 0.75,
                      }}
                      title={fmtDateTitle(w.date, language)}
                    >
                      <div className="calendar-week-cell-head">
                        <div className="calendar-week-cell-daylabel">
                          <span className="calendar-week-cell-weekday">{w.label}</span>
                          <span
                            className={
                              w.isToday
                                ? "calendar-week-cell-daynumber calendar-week-cell-daynumber-today"
                                : "calendar-week-cell-daynumber"
                            }
                          >
                            {w.dayNum}
                          </span>
                        </div>

                        <div className="calendar-week-cell-date-meta">
                          {info?.hasHoliday ? (
                            <span
                              className="calendar-week-holiday-inline"
                              title={info.holidayName ?? t("publicHolidayDefault")}
                            >
                              <span style={smallDot(holidayDotColor())} />
                              {t("holiday")}
                            </span>
                          ) : null}

                          <span className="calendar-week-cell-datefull">
                            {w.date}
                          </span>
                        </div>
                      </div>

                      <div className="calendar-week-cell-tags">
                        {info?.hasPlan ? (
                          <span className={pillClassName()}>
                            <span style={smallDot("var(--tenant-work-accent)")} />{" "}
                            {showEmployeeCalendarLegend ? t("work") : t("appointments")}
                          </span>
                        ) : null}

                        {showEmployeeCalendarLegend && info?.hasVacation ? (
                          <span className={pillClassName()}>
                            <span style={smallDot("var(--tenant-vacation-accent)")} /> {t("vacation")}
                          </span>
                        ) : null}

                        {showEmployeeCalendarLegend && info?.hasSick ? (
                          <span className={pillClassName()}>
                            <span style={smallDot("var(--tenant-sick-accent)")} /> {t("sick")}
                          </span>
                        ) : null}

                        {!info?.hasPlan && !info?.hasVacation && !info?.hasSick && !info?.hasHoliday ? (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                            }}
                          >
                            {t("noEntries")}
                          </span>
                        ) : null}
                      </div>

                      {info?.hasPlan && info.planPreview ? (
                        <div
                          className="calendar-week-cell-preview"
                          title={info.planPreview}
                        >
                          {info.planPreview}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              className="calendar-footer-actions"
              style={{
                marginTop: 14,
              }}
            >
              <button
                className="btn calendar-today-action-btn"
                type="button"
                onClick={jumpToToday}
              >
                {t("today")}
              </button>

              {isAdminOwnCalendar ? (
                <button
                  type="button"
                  aria-label={t("newAppointment")}
                  title={t("newAppointment")}
                  onClick={openNewEventGlobal}
                  className="btn calendar-add-action-btn"
                >
                  <Plus size={20} strokeWidth={2.6} />
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="calendar-grid-scroll">
              <div className="calendar-month-grid">
                {[
                  t("weekShortMon"),
                  t("weekShortTue"),
                  t("weekShortWed"),
                  t("weekShortThu"),
                  t("weekShortFri"),
                  t("weekShortSat"),
                  t("weekShortSun"),
                ].map((w) => (
                  <div key={w} className="calendar-weekday-head">
                    {w}
                  </div>
                ))}

                {loading ? (
                  <div style={{ gridColumn: "1 / -1", color: "var(--muted)" }}>{t("loadingCalendar")}</div>
                ) : (
                  grid.map((c, idx) => {
                    const info = c.inMonth && c.date ? dayMap.get(c.date) : undefined;

                    const border =
                      info?.hasSick
                        ? "var(--brand-sick-border)"
                        : info?.hasVacation
                        ? "var(--brand-vacation-border)"
                        : info?.hasHoliday
                        ? "var(--brand-holiday-border)"
                        : info?.hasPlan
                        ? "var(--brand-work-border)"
                        : "var(--border)";

                    const bg =
                      info?.hasSick
                        ? "var(--brand-sick-bg)"
                        : info?.hasVacation
                        ? "var(--brand-vacation-bg)"
                        : info?.hasHoliday
                        ? "var(--brand-holiday-bg)"
                        : info?.hasPlan
                        ? "var(--brand-work-bg)"
                        : "var(--brand-neutral-card-bg)";

                    const isToday = c.date === todayYMD;

                    return (
                      <button
                        key={`${c.date}-${idx}`}
                        className="card calendar-month-cell"
                        disabled={!c.inMonth}
                        onClick={() => c.inMonth && c.date && openDay(c.date)}
                        style={{
                          borderColor: isToday ? "var(--brand-calendar-today-border)" : border,
                          background: bg,
                          opacity: c.inMonth ? 1 : 0.25,
                          cursor: c.inMonth ? "pointer" : "default",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div
                            className={isToday ? "calendar-day-number calendar-day-number-today-mobile" : "calendar-day-number"}
                            style={{ fontWeight: 900 }}
                          >
                            {c.inMonth ? c.day : ""}
                          </div>

                          {isToday ? (
                            <div
                              className="calendar-today-dot-desktop"
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: "var(--accent)",
                                boxShadow: "0 0 0 3px var(--accent-soft)",
                              }}
                              title={t("today")}
                            />
                          ) : null}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {info?.hasPlan ? <span style={smallDot("var(--tenant-work-accent)")} /> : null}
                          {info?.hasHoliday ? <span style={smallDot(holidayDotColor())} /> : null}
                          {showEmployeeCalendarLegend && info?.hasVacation ? (
                            <span style={smallDot("var(--tenant-vacation-accent)")} />
                          ) : null}
                          {showEmployeeCalendarLegend && info?.hasSick ? (
                            <span style={smallDot("var(--tenant-sick-accent)")} />
                          ) : null}
                        </div>

                        {info?.hasPlan && info.planPreview ? (
                          <div
                            className="calendar-desktop-preview"
                            style={{
                              marginTop: 8,
                              fontSize: 11,
                              lineHeight: "14px",
                              color: "var(--muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              minHeight: 0,
                            }}
                            title={info.planPreview}
                          >
                            {info.planPreview}
                          </div>
                        ) : null}
                        {info?.hasHoliday && info.holidayName ? (
                          <div
                            className="calendar-desktop-preview"
                            style={{
                              marginTop: 6,
                              fontSize: 11,
                              lineHeight: "14px",
                              color: "var(--brand-holiday-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              minHeight: 0,
                            }}
                            title={info.holidayName}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {getHolidayIcon(info.holidayName)}
                              {info.holidayName}
                            </span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="calendar-legend-row"
              style={{
                marginTop: 14,
                color: "var(--muted)",
              }}
            >
              <div
                className="calendar-legend-items"
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {isAdminOwnCalendar ? (
                  <>
                    <div>
                      <span className="badge-dot dot-work" /> {t("appointments")}
                    </div>
                    <div>
                      <span
                        className="badge-dot"
                        style={{ background: holidayDotColor(), boxShadow: "0 0 0 3px var(--brand-holiday-bg)" }}
                      />{" "}
                      {t("holiday")}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="badge-dot dot-work" /> {t("work")}
                    </div>
                    <div>
                      <span className="badge-dot dot-vac" /> {t("vacation")}
                    </div>
                    <div>
                      <span
                        className="badge-dot"
                        style={{ background: holidayDotColor(), boxShadow: "0 0 0 3px var(--brand-holiday-bg)" }}
                      />{" "}
                      {t("holiday")}
                    </div>
                    <div>
                      <span className="badge-dot dot-sick" /> {t("sick")}
                    </div>
                  </>
                )}

                {!isAdminViewingEmployee && (absLoading || reqLoading) ? (
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {t("loadingAbsencesRequests")}
                  </div>
                ) : null}
              </div>

              <div className="calendar-footer-actions">
                <button
                  className="btn calendar-today-action-btn"
                  type="button"
                  onClick={jumpToToday}
                >
                  {t("today")}
                </button>

                {isAdminOwnCalendar ? (
                  <button
                    type="button"
                    aria-label={t("newAppointment")}
                    title={t("newAppointment")}
                    onClick={openNewEventGlobal}
                    className="btn calendar-add-action-btn"
                  >
                    <Plus size={20} strokeWidth={2.6} />
                  </button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={open}
        title={
          isAdmin && adminMode === "create-global"
            ? t("newAppointment")
            : selectedDate
              ? fmtDateTitle(selectedDate, language)
              : t("day")
        }
        onClose={() => setOpen(false)}
        maxWidth={760}
      >
        {isAdminOwnCalendar ? (
          <>
            {apptError && (
              <div
                className="card calendar-status-card calendar-status-card-danger"
                style={{ marginBottom: 12 }}
              >
                <span className="calendar-status-text-danger">{apptError}</span>
              </div>
            )}

            {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 900 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                    {dayMap.get(selectedDate)?.holidayName ?? t("publicHolidayDefault")}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  {t("dayMarkedAsHoliday")}
                </div>
              </div>
            ) : null}

            <div className="calendar-modal-agenda-head">
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{t("appointments")}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  {selectedDate
                    ? `${t("appointments")} ${t("for")} ${selectedDate}`
                    : t("appointments")}
                </div>
              </div>

              <button
                className="btn"
                type="button"
                onClick={() => {
                  const ymd = toYMDLocal(new Date());
                  setCursor(new Date());
                  setSelectedDate(ymd);
                  setAdminMode("create-from-day");
                  resetAppointmentForm();
                  setApptDate(ymd);
                  void loadAppointmentsForDay(ymd);
                }}
              >
                {t("today")}
              </button>
            </div>

            {apptLoading ? (
              <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                {t("loadingAppointments")}...
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                {t("noAppointmentsForDay")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {dayAppointments.map((a) => {
                  const cat = categoryMap[a.id] ?? "KUNDE";
                  return (
                    <div
                      key={a.id}
                      className="card calendar-appt-card"
                      style={{
                        padding: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={categoryDotStyle(cat)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="calendar-appt-head">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: 14 }}>
                              {a.startHHMM}–{a.endHHMM}
                            </div>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: 16,
                                marginTop: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {a.title}
                            </div>
                          </div>

                          <div className="calendar-appt-actions">
                            <button
                              type="button"
                              onClick={() => editAppointment(a)}
                              disabled={saving}
                              title={t("edit")}
                              className="tenant-icon-button tenant-icon-button-neutral"
                            >
                              <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteAppointment(a.id)}
                              disabled={saving}
                              title={t("delete")}
                              className="tenant-icon-button tenant-icon-button-danger"
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                          <span className={pillClassName()}>{categoryLabel(language, cat)}</span>

                          {a.location ? (
                            <span
                              style={{
                                color: "var(--muted)",
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <FontAwesomeIcon icon={faMapPin} /> {a.location}
                            </span>
                          ) : null}

                          <span className={pillClassName()}>{a.date}</span>
                        </div>

                        {a.notes ? (
                          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                            <FontAwesomeIcon icon={faPenToSquare} /> {a.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="tenant-divider" />

            <div className="calendar-modal-form-head">
              <div style={{ fontWeight: 900 }}>
                {apptEditingId
                  ? t("editAppointment")
                  : adminMode === "create-global"
                  ? t("newAppointment")
                  : t("enterAppointment")}
              </div>
              {apptEditingId ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    resetAppointmentForm();
                    setAdminMode("create-from-day");
                    setApptDate(selectedDate);
                  }}
                  disabled={saving}
                >
                  {t("cancel")}
                </button>
              ) : null}
            </div>

            {adminMode === "create-global" || adminMode === "edit" ? (
              <div className="calendar-admin-date-field calendar-admin-date-field-compact">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("date")}
             </div>
                <input
                  className="input calendar-admin-date-input calendar-admin-date-input-compact"
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="calendar-admin-date-field calendar-admin-date-field-compact">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("date")}
              </div>
                <div
                  className="calendar-admin-date-display calendar-admin-date-input-compact"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--muted)",
                  }}
                >
                  {selectedDate || t("dashOnly")}
                </div>
              </div>
            )}

            <div
              className="calendar-form-grid-2 admin-time-grid-mobile-fix"
              style={{ marginTop: 14, marginBottom: 10 }}
            >
              <div className="admin-time-grid-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("start")}
                </div>
                <input
                  className="input"
                  type="time"
                  value={apptStart}
                  onChange={(e) => setApptStart(e.target.value)}
                />
              </div>
              <div className="admin-time-grid-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("end")}
                </div>
                <input
                  className="input"
                  type="time"
                  value={apptEnd}
                  onChange={(e) => setApptEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="calendar-admin-meta-grid" style={{ marginBottom: 10 }}>
              <div className="calendar-admin-meta-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("categoryUiOnly")}
                </div>
                <select
                  className="input calendar-admin-meta-input"
                  value={apptCategory}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "KUNDE" || v === "BAUSTELLE" || v === "INTERN" || v === "PRIVAT") {
                      setApptCategory(v);
                    }
                  }}
                >
                  <option value="KUNDE">{t("customer")}</option>
                  <option value="BAUSTELLE">{t("site")}</option>
                  <option value="INTERN">{t("internal")}</option>
                  <option value="PRIVAT">{t("private")}</option>
                </select>
              </div>

              <div className="calendar-admin-meta-item">
                <div className="label" style={{ marginTop: 14, marginBottom: 10, fontSize: 12, opacity: 0.8 }}>
                  {t("title")}
                </div>
                <input
                  className="input calendar-admin-meta-input"
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  placeholder={t("titlePlaceholder")}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                {t("locationOptional")}
              </div>
              <input
                className="input"
                value={apptLocation}
                onChange={(e) => setApptLocation(e.target.value)}
                placeholder={t("locationPlaceholder")}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                {t("noteOptional")}
              </div>
              <textarea
                className="input"
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
                rows={3}
                style={{ resize: "vertical" }}
                placeholder={t("notePlaceholder")}
              />
            </div>

            <button className="btn btn-accent" type="button" onClick={saveAppointment} disabled={saving} style={{ width: "100%" }}>
              {saving ? t("saving") : apptEditingId ? t("saveChanges") : t("save")}
            </button>
          </>
        ) : isAdminViewingEmployee ? (
          <>
            <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.9 }}>
              {t("viewingEmployeeCalendar")}
              {t("viewingEmployeeCalendarHint")}
            </div>

            {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
              <div className="card" style={{ padding: 12, marginTop: 10 }}>
                <div style={{ fontWeight: 900 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                    {dayMap.get(selectedDate)?.holidayName ?? t("publicHolidayDefault")}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  {t("adminHolidayMarked")}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <div className="label">{t("employeeSchedule")}</div>

              {adminEmployeePlansLoading ? (
                <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                  {t("loadingPlan")}
                </div>
              ) : adminEmployeePlansError ? (
                <div className="card calendar-status-card calendar-status-card-danger">
                  <span className="calendar-status-text-danger">
                    {adminEmployeePlansError}
                  </span>
                </div>
              ) : adminEmployeeDayPlans.length === 0 ? (
                <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                  {t("noScheduleForDay")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {adminEmployeeDayPlans.map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>
                        {p.startHHMM}–{p.endHHMM} · {p.activity}
                      </div>

                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                        {p.location ?(
                          <>
                          <FontAwesomeIcon icon ={faMapPin} />
                        {p.location}`
                        </>
                        ) : ( 
                          t("noLocationGiven")
                        )}
                        {typeof p.travelMinutes === "number" && p.travelMinutes > 0 ?(
                          <>
                          {"."}
                          <FontAwesomeIcon icon={faCarSide} />
                          {p.travelMinutes} {t("travelMinutes")}`
                          </>
                        ) : null }
                      </div>

                      {p.noteEmployee ? (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          <FontAwesomeIcon icon={faPenToSquare} /> {p.noteEmployee}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDate ? (
              <div className="card" style={{ padding: 12, marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{t("dayStatus")}</div>

                <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", color: "var(--muted)" }}>
                  {dayMap.get(selectedDate)?.hasPlan ? <span className={pillClassName()}>{t("scheduleExists")}</span> : null}
                  {dayMap.get(selectedDate)?.hasHoliday ? (
                    <span className={pillClassName()} title={dayMap.get(selectedDate)?.holidayName ?? t("publicHolidayDefault")}>
                      {t("holiday")}
                    </span>
                  ) : null}
                  {dayMap.get(selectedDate)?.hasVacation ? (
                    <span className={pillClassName()}>
                      {monthAbsences.some(
                        (a) =>
                          a.absenceDate === selectedDate &&
                          a.type === "VACATION" &&
                          a.compensation === "PAID"
                      )
                        ? t("paidVacation")
                        : t("vacation")}
                    </span>
                  ) : null}
                  {dayMap.get(selectedDate)?.hasSick ? <span className={pillClassName()}>{t("sick")}</span> : null}
                </div>

                {!dayMap.get(selectedDate)?.hasPlan &&
                !dayMap.get(selectedDate)?.hasHoliday &&
                !dayMap.get(selectedDate)?.hasVacation &&
                !dayMap.get(selectedDate)?.hasSick ? (
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                    {t("noEntriesForDay")}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <div className="label">{t("yourSchedule")}</div>

              {plansLoading ? (
                <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                  {t("loadingPlan")}
                </div>
              ) : plansError ? (
                <div className="card calendar-status-card calendar-status-card-danger">
                  <span className="calendar-status-text-danger">{plansError}</span>
                </div>
              ) : dayPlans.length === 0 ? (
                <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                  {t("noScheduleForDay")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayPlans.map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>
                        {p.startHHMM}–{p.endHHMM} · {p.activity}
                      </div>

                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                        {p.location ?(
                          <>
                          <FontAwesomeIcon icon={faMapPin} style={{ marginRight: 4, verticalAlign: "middle", color: "var(--muted)" }} />
                          {p.location}
                          </>
                         ) : ( 
                          t("noLocationGiven")
                         )}

                        {typeof p.travelMinutes === "number" && p.travelMinutes > 0 ? (
                          <>
                           {" · "}
                           <FontAwesomeIcon icon={faCarSide} style={{ marginRight: 4, verticalAlign: "middle", color: "var(--muted)" }} />
                           {p.travelMinutes} {t("travelMinutes")}
                          </>
                         ) : null}
                      </div>

                      {p.noteEmployee ? (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          <FontAwesomeIcon icon={faPenToSquare} /> {p.noteEmployee}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => syncPlanEntryToWorkEntry(p)}
                        >
                          <FontAwesomeIcon icon={faShare} />
                          {t("syncToEntry")}
                        </button>

                        <button
                          className="btn btn-accent"
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/kalender/dokumente/${encodeURIComponent(p.id)}`);
                          }}
                        >
                          <FontAwesomeIcon icon={faFilePdf} />
                          {t("documents")}
                        </button>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "var(--muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {t("syncPlanHint")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
                <div style={{ marginTop: 14 }}>
                  <div className="label">{t("publicHoliday")}</div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 900 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                        {dayMap.get(selectedDate)?.holidayName ?? t("publicHoliday")}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      {t("holidayMarked")}
                    </div>
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 14 }}>
                <div className="label">{t("confirmedAbsence")}</div>

                {confirmedAbsencesForSelectedDay.length === 0 ? (
                  <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                    {t("noConfirmedAbsence")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {confirmedAbsencesForSelectedDay.some((a) => a.type === "VACATION") ? (
                      <div className="card" style={{ padding: 12 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 900,
                          }}
                        >
                          <TreePalm />
                          <span>
                            {replaceTemplate(t("vacationConfirmedSingleDay"), { date: selectedDate })}
                          </span>
                        </div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {t("alreadyConfirmedRegistered")}
                        </div>

                        {getAbsenceCompensationBreakdown(language, confirmedAbsencesForSelectedDay) ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("compensation")} {getAbsenceCompensationBreakdown(language, confirmedAbsencesForSelectedDay)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {confirmedAbsencesForSelectedDay
                      .filter((a) => a.type === "SICK")
                      .map((a) => {
                        const isDoctorAppointmentTimeRange =
                          isDoctorAppointmentTimeRangeAbsence(a);

                        const confirmedSickLabel = isDoctorAppointmentTimeRange
                          ? doctorAppointmentLabel(language)
                          : a.dayPortion === "HALF_DAY"
                            ? t("sickConfirmedHalfDay")
                            : t("sickConfirmedFullDay");

                        const timeRangeText =
                          isDoctorAppointmentTimeRange && a.startTime && a.endTime
                            ? `${a.startTime}–${a.endTime} · ${formatPaidMinutesAsHM(a.paidMinutes)}`
                            : "";

                        const dayValueText = isDoctorAppointmentTimeRange
                          ? formatAbsenceDayValue(language, absenceDayValue(a))
                          : "";

                        return (
                          <div key={a.id} className="card" style={{ padding: 12 }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                fontWeight: 900,
                              }}
                            >
                              <FontAwesomeIcon icon={faStethoscope} />
                              <span>{confirmedSickLabel}</span>
                            </div>

                            {timeRangeText ? (
                              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                                {timeRangeText}
                              </div>
                            ) : null}

                            {dayValueText ? (
                              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                                {dayValueText}
                              </div>
                            ) : null}

                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              {t("alreadyConfirmedRegistered")}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="label">{t("myRequests")}</div>

                {requestBlocksForSelectedDay.length === 0 ? (
                  <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                    {t("noRequestForDay")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {requestBlocksForSelectedDay.map((b) => (
                      <div key={b.id} className="card" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>{requestBlockLabel(language, b)}</div>

                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {t("status")} {requestStatusLabel(language, b.status)}
                        </div>

                        {b.type === "VACATION" ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("scope")} {b.dayPortion === "HALF_DAY" ? t("halfVacationDay") : t("fullVacationDay")}
                          </div>
                        ) : null}
                        {b.type === "VACATION" ? (
                          <>
                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              {t("total")} {formatVacationDays((b.paidVacationUnits + b.unpaidVacationUnits) / 2)} {t("daysLabel")}
                            </div>

                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              {t("compensation")} {getRequestCompensationSummary(
                                language,
                                b.paidVacationUnits,
                                b.unpaidVacationUnits,
                                b.compensation
                              )}
                            </div>
                          </>
                        ) : null}

                        {b.noteEmployee.trim() ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            <FontAwesomeIcon icon={faPenToSquare} /> {b.noteEmployee}
                          </div>
                        ) : null}

                        {b.decidedBy ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("processedBy")} {b.decidedBy.fullName}
                          </div>
                        ) : null}

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button className="btn" type="button" onClick={() => showRequestDetails(b)}>
                            {t("details")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="tenant-divider" style={{ marginTop: 14 }} />
            </div>

            {error && (
              <div
                className="card calendar-status-card calendar-status-card-danger"
                style={{ marginBottom: 12 }}
              >
                <span className="calendar-status-text-danger">{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div className="label">{selectedRequestBlock ? t("requestDetails") : t("requestAbsence")}</div>
              <div className="calendar-form-grid-2 absence-date-grid-mobile-fix">
                <div className="absence-date-grid-item">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                    {t("start")}
                  </div>
                  <input
                    className="input"
                    type="date"
                    value={absenceStart}
                    onChange={(e) => setAbsenceStart(e.target.value)}
                    disabled={!!selectedRequestBlock}
                  />
                </div>

                <div className="absence-date-grid-item">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                    {t("end")}
                  </div>
                  <input
                    className="input"
                    type="date"
                    value={absenceEnd}
                    onChange={(e) => setAbsenceEnd(e.target.value)}
                    disabled={!!selectedRequestBlock}
                  />
                </div>
              </div>
            </div>

            <div className="calendar-form-grid-2" style={{ marginBottom: 12 }}>
              <button
                className={`btn ${
                  absenceType === "VACATION" ? "btn-type-active-vacation" : ""
                }`}
                type="button"
                onClick={() => {
                  setAbsenceType("VACATION");
                }}
                disabled={!!selectedRequestBlock}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  <TreePalm />
                  <span>{t("absenceTypeVacation")}</span>
                </span>
              </button>
              <button
                className={`btn ${
                  absenceType === "SICK" ? "btn-type-active-sick" : ""
                }`}
                type="button"
                onClick={() => {
                  setAbsenceType("SICK");
                  setAbsenceDayPortion("FULL_DAY");
                  setAbsenceCompensation("PAID");
                  setSickLeaveKind("SICK_LEAVE");
                  setAbsenceTimeMode("FULL_DAY");
                }}
                disabled={!!selectedRequestBlock}
              >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                }}
              >
              <FontAwesomeIcon icon={faStethoscope} />
              <span>{t("absenceTypeSick")}</span>
              </span>
              </button>
            </div>

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">{t("scopeLabel")}</div>
                <div
                  style={{
                    marginTop: 6,
                    marginBottom: 10,
                    fontSize: 12,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {t("scopeHint")}
                </div>
                {!selectedRequestBlock &&
                excludedVacationHolidayDatesPreview.length > 0 ? (
                  <div
                    className="card calendar-status-card calendar-status-card-neutral"
                    style={{
                      marginBottom: 10,
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {holidayExclusionHint(
                      language,
                      excludedVacationHolidayDatesPreview
                    )}
                  </div>
                ) : null}
                <div className="calendar-form-grid-2">
                  <button
                    className={`btn ${
                      absenceDayPortion === "FULL_DAY"
                        ? "btn-type-active-vacation"
                        : ""
                    }`}
                    type="button"
                    onClick={() => setAbsenceDayPortion("FULL_DAY")}
                    disabled={!!selectedRequestBlock}
                  >
                    {t("fullVacationDay")}
                  </button>
                  <button
                    className={`btn ${
                      absenceDayPortion === "HALF_DAY"
                        ? "btn-type-active-vacation"
                        : ""
                    }`}
                    type="button"
                    onClick={() => {
                      setAbsenceDayPortion("HALF_DAY");
                      setAbsenceEnd(absenceStart);
                    }}
                    disabled={!!selectedRequestBlock || absenceDayPortion === "HALF_DAY"}
                  >
                    {t("halfVacationDay")}
                  </button>
                </div>
              </div>
            ) : null}

            {absenceType === "SICK" ? (
              <div style={{ marginBottom: 12 }}>
                {!selectedRequestBlock &&
                sickLeaveKind !== "DOCTOR_APPOINTMENT" &&
                excludedSickHolidayDatesPreview.length > 0 ? (
                  <div
                    className="card calendar-status-card calendar-status-card-neutral"
                    style={{
                      marginBottom: 10,
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {sickHolidayExclusionHint(
                      language,
                      excludedSickHolidayDatesPreview
                    )}
                  </div>
                ) : null}

                <div className="label">{doctorAppointmentQuestion(language)}</div>

                <div className="calendar-form-grid-2" style={{ marginTop: 6 }}>
                  <button
                    className={`btn ${
                      sickLeaveKind === "SICK_LEAVE" ? "btn-type-active-sick" : ""
                    }`}
                    type="button"
                    onClick={() => {
                      setSickLeaveKind("SICK_LEAVE");
                      setAbsenceTimeMode("FULL_DAY");
                    }}
                    disabled={!!selectedRequestBlock}
                  >
                    {t("absenceTypeSick")}
                  </button>

                  <button
                    className={`btn ${
                      sickLeaveKind === "DOCTOR_APPOINTMENT" ? "btn-type-active-sick" : ""
                    }`}
                    type="button"
                    onClick={() => {
                      setSickLeaveKind("DOCTOR_APPOINTMENT");
                      setAbsenceTimeMode("TIME_RANGE");
                      setAbsenceEnd(absenceStart);
                    }}
                    disabled={!!selectedRequestBlock}
                  >
                    {doctorAppointmentLabel(language)}
                  </button>
                </div>

                {sickLeaveKind === "DOCTOR_APPOINTMENT" ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="label">{t("scope")}</div>

                    <div className="calendar-form-grid-2" style={{ marginTop: 6 }}>
                      <button
                        className={`btn ${
                          absenceTimeMode === "FULL_DAY" ? "btn-type-active-sick" : ""
                        }`}
                        type="button"
                        onClick={() => setAbsenceTimeMode("FULL_DAY")}
                        disabled={!!selectedRequestBlock}
                      >
                        {fullDayLabel(language)}
                      </button>

                      <button
                        className={`btn ${
                          absenceTimeMode === "TIME_RANGE" ? "btn-type-active-sick" : ""
                        }`}
                        type="button"
                        onClick={() => {
                          setAbsenceTimeMode("TIME_RANGE");
                          setAbsenceEnd(absenceStart);
                        }}
                        disabled={!!selectedRequestBlock}
                      >
                        {timeRangeLabel(language)}
                      </button>
                    </div>

                    {absenceTimeMode === "TIME_RANGE" ? (
                      <div
                        className="calendar-form-grid-2"
                        style={{
                          marginTop: 12,
                        }}
                      >
                        <div>
                          <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                            {t("start")}
                          </div>
                          <input
                            className="input"
                            type="time"
                            value={absenceStartTime}
                            onChange={(e) => setAbsenceStartTime(e.target.value)}
                            disabled={!!selectedRequestBlock}
                          />
                        </div>

                        <div>
                          <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                            {t("end")}
                          </div>
                          <input
                            className="input"
                            type="time"
                            value={absenceEndTime}
                            onChange={(e) => setAbsenceEndTime(e.target.value)}
                            disabled={!!selectedRequestBlock}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">{t("compensationLabel")}</div>

                {!selectedRequestBlock ? (
                  <div
                    className={`card calendar-status-card ${
                      compensationLockedBySystem
                        ? "calendar-status-card-warning"
                        : "calendar-status-card-neutral"
                    }`}
                    style={{
                      marginBottom: 10,
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {compensationLockedBySystem
                      ? replaceTemplate(
                          t("compensationPartialUnpaidHint"),
                          {
                            paid: formatVacationDays(paidVacationDaysPreview),
                            paidDayLabel: vacationDayLabel(
                              paidVacationDaysPreview,
                              language
                            ),
                            unpaid: formatVacationDays(unpaidVacationDaysPreview),
                            unpaidDayLabel: vacationDayLabel(
                              unpaidVacationDaysPreview,
                              language
                            ),
                          }
                        )
                      : t("compensationFlexibleHint")}
                  </div>
                ) : null}

                {selectedRequestBlock ? (
                  <div
                    className="tenant-soft-panel-strong"
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: "var(--text)",
                    }}
                  >
                    <div>
                      {t("total")} {formatVacationDays(
                        (selectedRequestBlock.paidVacationUnits + selectedRequestBlock.unpaidVacationUnits) / 2
                      )} {t("daysLabel")}
                    </div>

                    <div style={{ marginTop: 6, color: "var(--muted)" }}>
                      {getRequestCompensationSummary(
                        language,
                        selectedRequestBlock.paidVacationUnits,
                        selectedRequestBlock.unpaidVacationUnits,
                        selectedRequestBlock.compensation
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="calendar-form-grid-2">
                    <button
                      className={`btn ${
                        absenceCompensation === "PAID"
                          ? "btn-type-active-vacation"
                          : ""
                      }`}
                      type="button"
                      onClick={() => setAbsenceCompensation("PAID")}
                      disabled={!!selectedRequestBlock || compensationLockedBySystem}
                    >
                      {compensationLockedBySystem
                        ? `${formatVacationDays(paidVacationDaysPreview)} ${t("paid")}`
                        : t("paid")}
                    </button>
                    <button
                      className={`btn ${
                        absenceCompensation === "UNPAID"
                          ? "btn-type-active-vacation"
                          : ""
                      }`}
                      type="button"
                      onClick={() => setAbsenceCompensation("UNPAID")}
                      disabled={!!selectedRequestBlock || compensationLockedBySystem}
                    >
                      {compensationLockedBySystem
                        ? `${formatVacationDays(unpaidVacationDaysPreview)} ${t("unpaid")}`
                        : t("unpaid")}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginBottom: 12 }}>
              <div className="label">{t("noteToAdmin")}</div>
              <textarea
                className="textarea"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder={t("requestNotePlaceholder")}
                disabled={!!selectedRequestBlock}
              />
            </div>

            {selectedRequestBlock ? (
              <div className="calendar-form-grid-2">
                <button className="btn" type="button" onClick={cancelRequestView} style={{ width: "100%" }}>
                  {t("close")}
                </button>
                <button className="btn btn-accent" type="button" onClick={startNewRequest} style={{ width: "100%" }}>
                  {t("newRequest")}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-accent"
                type="button"
                onClick={saveAbsence}
                disabled={saving}
                style={{ width: "100%" }}
              >
                {saving ? t("saving") : t("sendRequest")}
              </button>
            )}
          </>
        )}
      </Modal>
    </AppShell>
  );
}
export default function KalenderPage(
  props: KalenderPageProps
): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 16,
            color: "var(--muted)",
          }}
        >
          {translate("DE", "calendarLoadingFallback", KALENDER_DICTIONARY)}
        </div>
      }
    >
      <KalenderPageInner {...props} />
    </Suspense>
  );
}