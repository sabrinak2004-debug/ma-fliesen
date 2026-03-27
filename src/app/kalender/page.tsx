"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
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
} from "lucide-react";

type CalendarDay = {
  date: string;
  hasWork: boolean;
  hasVacation: boolean;
  hasSick: boolean;
  hasPlan: boolean;
  planPreview: string | null;
  hasHoliday: boolean;
  holidayName: string | null;
};

type CalendarResponse = { ok: true; days: CalendarDay[] } | { ok: false; error: string };

type AbsenceType = "VACATION" | "SICK";
type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";
type AbsenceCompensation = "PAID" | "UNPAID";

type AbsenceDTO = {
  id: string;
  absenceDate: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
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

type AbsenceBlock = {
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  start: string;
  end: string;
  idsByDate: Record<string, string>;
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

function isCalendarDay(v: unknown): v is CalendarDay {
  if (!isRecord(v)) return false;
  const date = getStringField(v, "date");
  const hasWork = getBooleanField(v, "hasWork");
  const hasVacation = getBooleanField(v, "hasVacation");
  const hasSick = getBooleanField(v, "hasSick");
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
    typeof hasPlan === "boolean" &&
    typeof hasHoliday === "boolean" &&
    (planPreview === null || typeof planPreview === "string") &&
    (holidayName === null || typeof holidayName === "string")
  );
}

function parseCalendarResponse(j: unknown): CalendarResponse {
  if (!isRecord(j)) return { ok: false, error: "Unerwartete Antwort." };

  const okVal = j["ok"];
  if (okVal === true) {
    const days = j["days"];
    if (!Array.isArray(days)) return { ok: false, error: "Unerwartete Antwort." };
    return { ok: true, days: days.filter(isCalendarDay) };
  }

  const err = j["error"];
  if (typeof err === "string" && err.trim()) return { ok: false, error: err };
  return { ok: false, error: "Unerwartete Antwort." };
}

function isAbsenceDTO(v: unknown): v is AbsenceDTO {
  if (!isRecord(v)) return false;
  const id = getStringField(v, "id");
  const absenceDate = getStringField(v, "absenceDate");
  const type = v["type"];
  const dayPortion = v["dayPortion"];
  const compensation = v["compensation"];
  const user = v["user"];

  if (!id || !absenceDate || !isAbsenceType(type) || !isAbsenceDayPortion(dayPortion)|| !isAbsenceCompensation(compensation)) {
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

function fmtDateTitle(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return ymd;
  }

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ] as const;

  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ] as const;

  const dt = new Date(y, m - 1, d);
  const weekday = weekdayNames[(dt.getDay() + 6) % 7] ?? "";
  const monthName = monthNames[m - 1] ?? "";

  return `${weekday}, ${String(d).padStart(2, "0")}. ${monthName} ${y}`;
}

function dateInRange(date: string, start: string, end: string): boolean {
  return start <= date && date <= end;
}

function getRequestedVacationDays(
  start: string,
  end: string,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === "HALF_DAY") {
    return 0.5;
  }

  const startDate = ymdToDateLocal(start);
  const endDate = ymdToDateLocal(end);

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday) {
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

function buildBlocks(absences: AbsenceDTO[]): AbsenceBlock[] {
  const rows = absences
    .slice()
    .sort((x, y) => (x.absenceDate < y.absenceDate ? -1 : x.absenceDate > y.absenceDate ? 1 : 0));

  const blocks: AbsenceBlock[] = [];
  const byKey = new Map<string, AbsenceDTO[]>();

  for (const row of rows) {
    const key = `${row.type}__${row.dayPortion}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  for (const [key, list] of byKey.entries()) {
    const [typeRaw, dayPortionRaw] = key.split("__");
    const type: AbsenceType = typeRaw === "SICK" ? "SICK" : "VACATION";
    const dayPortion: AbsenceDayPortion = dayPortionRaw === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY";

    if (list.length === 0) continue;

    let curStart = list[0].absenceDate;
    let curEnd = list[0].absenceDate;
    let idsByDate: Record<string, string> = { [list[0].absenceDate]: list[0].id };

    for (let i = 1; i < list.length; i += 1) {
      const d = list[i].absenceDate;
      const expectedNext = addDaysYMD(curEnd, 1);

      if (d === expectedNext && dayPortion === "FULL_DAY") {
        idsByDate[d] = list[i].id;
        curEnd = d;
      } else {
        blocks.push({
          type,
          dayPortion,
          start: curStart,
          end: curEnd,
          idsByDate,
        });
        curStart = d;
        curEnd = d;
        idsByDate = { [d]: list[i].id };
      }
    }

    blocks.push({
      type,
      dayPortion,
      start: curStart,
      end: curEnd,
      idsByDate,
    });
  }

  blocks.sort((a, b) => {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.dayPortion.localeCompare(b.dayPortion);
  });

  return blocks;
}

function blockLabel(b: AbsenceBlock): string {
  const icon = b.type === "VACATION" ? "🌴" : "🤒";
  const name = b.type === "VACATION" ? "Urlaub" : "Krank";

  if (b.dayPortion === "HALF_DAY") {
    return `${icon} Halber ${name.toLowerCase()} (${b.start})`;
  }

  const span = b.start === b.end ? b.start : `${b.start}–${b.end}`;
  return `${icon} ${name} (${span})`;
}

function buildRequestBlocks(requests: AbsenceRequestDTO[]): AbsenceRequestBlock[] {
  return requests
    .map((r) => ({
      id: r.id,
      type: r.type,
      dayPortion: r.dayPortion,
      status: r.status,
      compensation: r.compensation,
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

function requestStatusLabel(status: AbsenceRequestStatus): string {
  if (status === "PENDING") return "Offen";
  if (status === "APPROVED") return "Genehmigt";
  return "Abgelehnt";
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

function getRequestCompensationSummary(
  paidVacationUnits: number,
  unpaidVacationUnits: number,
  compensation: AbsenceCompensation
): string {
  const paidDays = paidVacationUnits / 2;
  const unpaidDays = unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return `${formatVacationDays(paidDays)} Tage bezahlt · ${formatVacationDays(unpaidDays)} Tage unbezahlt`;
  }

  if (paidDays > 0) {
    return "Bezahlt";
  }

  if (unpaidDays > 0) {
    return "Unbezahlt";
  }

  return compensation === "PAID" ? "Bezahlt" : "Unbezahlt";
}

function getRequestCompensationHint(
  paidVacationUnits: number,
  unpaidVacationUnits: number
): string | null {
  const paidDays = paidVacationUnits / 2;
  const unpaidDays = unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return `Davon ${formatVacationDays(paidDays)} Tage bezahlt und ${formatVacationDays(unpaidDays)} Tage unbezahlt.`;
  }

  return null;
}

function getAbsenceCompensationSummary(absences: AbsenceDTO[]): string | null {
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

  return getRequestCompensationSummary(paidUnits, unpaidUnits, "PAID");
}

function getAbsenceCompensationBreakdown(absences: AbsenceDTO[]): string | null {
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
    return `${formatVacationDays(paidDays)} Tage bezahlt · ${formatVacationDays(unpaidDays)} Tage unbezahlt`;
  }

  if (paidDays > 0) {
    return `${formatVacationDays(paidDays)} Tage bezahlt`;
  }

  if (unpaidDays > 0) {
    return `${formatVacationDays(unpaidDays)} Tage unbezahlt`;
  }

  return null;
}

function requestBlockLabel(b: AbsenceRequestBlock): string {
  const icon = b.type === "VACATION" ? "🌴" : "🤒";

  if (b.type === "VACATION" && b.dayPortion === "HALF_DAY") {
    return `${icon} Urlaubsantrag (halber Tag · ${b.start})`;
  }

  const name = b.type === "VACATION" ? "Urlaubsantrag" : "Krankheitsantrag";
  const span = b.start === b.end ? b.start : `${b.start}–${b.end}`;
  return `${icon} ${name} (${span})`;
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

function categoryLabel(c: EventCategory): string {
  if (c === "KUNDE") return "Kunde";
  if (c === "BAUSTELLE") return "Baustelle";
  if (c === "INTERN") return "Intern";
  return "Privat";
}

function categoryDotStyle(c: EventCategory): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    flex: "0 0 auto",
    marginTop: 4,
    boxShadow: "0 0 0 3px rgba(255,255,255,0.03)",
  };

  if (c === "KUNDE") return { ...base, background: "rgba(184, 207, 58, 0.95)" };
  if (c === "BAUSTELLE") return { ...base, background: "rgba(90, 167, 255, 0.95)" };
  if (c === "INTERN") return { ...base, background: "rgba(255, 196, 0, 0.95)" };
  return { ...base, background: "rgba(224, 75, 69, 0.95)" };
}

function pillStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--muted)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    lineHeight: "16px",
  };
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
  return "rgba(255, 196, 0, 0.95)";
}

function smallDot(color: string): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    boxShadow: "0 0 0 3px rgba(255,255,255,0.03)",
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [remainingPaidVacationDaysForMonth, setRemainingPaidVacationDaysForMonth] = useState<number>(0);
  const [compensationLockedBySystem, setCompensationLockedBySystem] = useState<boolean>(false);
  const [selectedRequestBlock, setSelectedRequestBlock] = useState<AbsenceRequestBlock | null>(null);

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

  const title = useMemo(() => {
    if (viewMode === "WEEK") {
      const ws = startOfWeekMonday(cursor);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `${fmt(ws)} – ${fmt(we)}`;
    }
    const monthNames = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ] as const;

    const m = monthNames[cursor.getMonth()] ?? "";
    return `${m} ${cursor.getFullYear()}`;
  }, [cursor, viewMode]);

  const weekMeta = useMemo(() => {
    if (viewMode !== "WEEK") return null;

    const ws = startOfWeekMonday(cursor);
    const kw = getISOWeek(ws);

    return { kw, ws };
  }, [cursor, viewMode]);

  const todayYMD = useMemo(() => toYMDLocal(new Date()), []);

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

        if (forceAdminOwnCalendar) {
          if (parsed && parsed.role === "ADMIN") {
            setSession(parsed);
            return;
          }

          setSession({
            userId: "",
            fullName: "",
            role: "ADMIN",
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
      const parsed = parseCalendarResponse(j);
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
      setAbsenceCompensation("UNPAID");
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
  const blocks = useMemo(() => (isAdmin ? [] : buildBlocks(monthAbsences)), [monthAbsences, isAdmin]);

  const requestBlocks = useMemo(
    () => (isAdmin ? [] : buildRequestBlocks(monthRequests)),
    [monthRequests, isAdmin]
  );

  const blocksForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];
    return blocks.filter((b) => dateInRange(selectedDate, b.start, b.end));
  }, [blocks, selectedDate, isAdmin]);

  const requestBlocksForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];
    return requestBlocks.filter((b) => b.status === "PENDING" && dateInRange(selectedDate, b.start, b.end));
  }, [requestBlocks, selectedDate, isAdmin]);

  const confirmedAbsencesForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];
    return monthAbsences.filter((a) => a.absenceDate === selectedDate);
  }, [monthAbsences, selectedDate, isAdmin]);

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
      const weekdayShort = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
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
        setPlansError(extractErrorMessage(j, "Plan konnte nicht geladen werden."));
        return;
      }

      setDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setDayPlans([]);
      setPlansError("Netzwerkfehler beim Laden des Plans.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

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
        setAdminEmployeePlansError(extractErrorMessage(j, "Plan des Mitarbeiters konnte nicht geladen werden."));
        return;
      }

      setAdminEmployeeDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError("Netzwerkfehler beim Laden des Mitarbeiter-Plans.");
    } finally {
      setAdminEmployeePlansLoading(false);
    }
  }, [selectedUserId]);

  const loadAppointmentsForDay = useCallback(async (date: string): Promise<void> => {
    setApptLoading(true);
    setApptError(null);
    try {
      const r = await fetch(`/api/admin/appointments?date=${encodeURIComponent(date)}`);
      const j: unknown = await r.json();
      if (!r.ok) {
        setDayAppointments([]);
        setApptError(extractErrorMessage(j, "Termine konnten nicht geladen werden."));
        return;
      }
      const list = parseAppointmentsResponse(j)
        .slice()
        .sort((a, b) => (a.startHHMM < b.startHHMM ? -1 : a.startHHMM > b.startHHMM ? 1 : 0));
      setDayAppointments(list);
    } catch {
      setDayAppointments([]);
      setApptError("Netzwerkfehler beim Laden der Termine.");
    } finally {
      setApptLoading(false);
    }
  }, []);

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
    if (isAdmin) return;

    const openDateParam = searchParams.get("openDate");
    const absenceStartParam = searchParams.get("absenceStart");
    const absenceEndParam = searchParams.get("absenceEnd");
    const absenceTypeParam = searchParams.get("absenceType");
    const absenceDayPortionParam = searchParams.get("absenceDayPortion");
    const absenceCompensationParam = searchParams.get("absenceCompensation");

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

    setCursor(ymdToDateLocal(resolvedOpenDate));

    openDay(resolvedOpenDate, {
      absenceStart: resolvedStart,
      absenceEnd: resolvedEnd,
      absenceType: resolvedType,
      absenceDayPortion: resolvedDayPortion,
      absenceCompensation: resolvedCompensation,
    });

    router.replace("/kalender");
  }, [isAdmin, openDay, router, searchParams]);

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
    setCompensationLockedBySystem(false);
    setRequestNote("");
  }

  async function saveAbsence(): Promise<void> {
    setError(null);

    if (!absenceStart || !absenceEnd) {
      setError("Bitte Start- und Enddatum auswählen.");
      return;
    }

    if (absenceEnd < absenceStart) {
      setError("Ende darf nicht vor Start liegen.");
      return;
    }
    if (absenceType === "SICK" && absenceDayPortion !== "FULL_DAY") {
      setError("Krankheit kann nur ganztägig beantragt werden.");
      return;
    }

    if (absenceDayPortion === "HALF_DAY" && absenceType !== "VACATION") {
      setError("Halbe Tage sind nur für Urlaub erlaubt.");
      return;
    }

    if (absenceDayPortion === "HALF_DAY" && absenceStart !== absenceEnd) {
      setError("Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden.");
      return;
    }

    if (absenceType === "VACATION" && absenceDayPortion === "FULL_DAY") {
      const effectiveVacationDays = getRequestedVacationDays(
        absenceStart,
        absenceEnd,
        absenceDayPortion
      );

      if (effectiveVacationDays <= 0) {
        setError("Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.");
        return;
      }
    }

    if (absenceType === "SICK" && absenceCompensation !== "PAID") {
      setError("Krankheit darf nicht als unbezahlt beantragt werden.");
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
        }),
      });

      const j: unknown = await r.json();

      if (!r.ok) {
        setError(extractErrorMessage(j, "Antrag konnte nicht gespeichert werden."));
        return;
      }

      setOpen(false);
      setSelectedRequestBlock(null);
      setRequestNote("");
      await reloadMonthAll();
    } catch {
      setError("Netzwerkfehler beim Speichern.");
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
      setApptError("Bitte Datum auswählen.");
      return;
    }

    setApptError(null);
    const titleValue = apptTitle.trim();
    if (!titleValue) {
      setApptError("Bitte Titel eingeben.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(apptStart) || !/^\d{2}:\d{2}$/.test(apptEnd)) {
      setApptError("Start/Ende muss HH:MM sein.");
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
          setApptError(extractErrorMessage(j, "Speichern fehlgeschlagen."));
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
          setApptError(extractErrorMessage(j, "Speichern fehlgeschlagen."));
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
      setApptError("Netzwerkfehler beim Speichern.");
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
        setApptError(extractErrorMessage(j, "Löschen fehlgeschlagen."));
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
      setApptError("Netzwerkfehler beim Löschen.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    if (!apptEditingId) return;
    setCategoryMap((prev) => ({ ...prev, [apptEditingId]: apptCategory }));
  }, [apptCategory, apptEditingId, isAdmin]);

  const floatingStyle: React.CSSProperties = {
    position: "fixed",
    right: 22,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(184, 207, 58, 0.95)",
    color: "rgba(0,0,0,0.9)",
    fontWeight: 900,
    fontSize: 26,
    boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 60,
  };

  const segmentedWrap: React.CSSProperties = {
    display: "inline-flex",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: 4,
    gap: 4,
  };

  const segBtn = (active: boolean): React.CSSProperties => ({
    border: "1px solid rgba(255,255,255,0.10)",
    background: active ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.00)",
    color: "var(--text)",
    borderRadius: 12,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  });

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="card card-olive" style={{ padding: 18, position: "relative" }}>
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
                <div style={{ marginTop: 8, width: "100%" }}>
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
                    style={{ maxWidth: 320 }}
                  >
                    <option value="">Meine Admin-Termine</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>

                  {isAdminViewingEmployee ? (
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                      Mitarbeiteransicht (read-only): Kalender zeigt Plan/Urlaub/Krank des Mitarbeiters.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {viewMode === "WEEK" && weekMeta ? (
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 800 }}>
                  KW {weekMeta.kw}
                </div>
              ) : null}
            </div>

            <div style={segmentedWrap}>
              <button type="button" style={segBtn(viewMode === "MONTH")} onClick={() => setViewMode("MONTH")}>
                Monat
              </button>
              <button type="button" style={segBtn(viewMode === "WEEK")} onClick={() => setViewMode("WEEK")}>
                Woche
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

                  Google Kalender verbinden
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

                Google Kalender verbinden
              </button>
            </div>
          ) : null}
        </div>

        {viewMode === "WEEK" ? (
          <div className="calendar-grid-scroll">
            <div className="calendar-week-grid">
              {weekDays.map((w) => {
                const info = dayMap.get(w.date);
                const inThisMonth = monthKey(ymdToDateLocal(w.date)) === ym;

                const border =
                  info?.hasSick
                    ? "rgba(224, 75, 69, 0.65)"
                    : info?.hasVacation
                    ? "rgba(90, 167, 255, 0.65)"
                    : info?.hasHoliday
                    ? "rgba(255, 196, 0, 0.65)"
                    : info?.hasPlan
                    ? "rgba(184, 207, 58, 0.65)"
                    : "var(--border)";

                const bg =
                  info?.hasSick
                    ? "rgba(224, 75, 69, 0.16)"
                    : info?.hasVacation
                    ? "rgba(90, 167, 255, 0.12)"
                    : info?.hasHoliday
                    ? "rgba(255, 196, 0, 0.12)"
                    : info?.hasPlan
                    ? "rgba(184, 207, 58, 0.10)"
                    : "rgba(255,255,255,0.02)";

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
                    title={fmtDateTitle(w.date)}
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

                      <span className="calendar-week-cell-datefull">
                        {w.date}
                      </span>
                    </div>

                    <div className="calendar-week-cell-tags">
                      {info?.hasPlan ? (
                        <span style={pillStyle()}>
                          <span style={smallDot("rgba(184, 207, 58, 0.95)")} /> Termine
                        </span>
                      ) : null}

                      {info?.hasHoliday ? (
                        <span style={pillStyle()} title={info.holidayName ?? "Gesetzlicher Feiertag"}>
                          <span style={smallDot(holidayDotColor())} /> Feiertag
                        </span>
                      ) : null}

                      {!isAdmin && info?.hasVacation ? (
                        <span style={pillStyle()}>
                          <span style={smallDot("rgba(90, 167, 255, 0.95)")} /> Urlaub
                        </span>
                      ) : null}

                      {!isAdmin && info?.hasSick ? (
                        <span style={pillStyle()}>
                          <span style={smallDot("rgba(224, 75, 69, 0.95)")} /> Krank
                        </span>
                      ) : null}

                      {!info?.hasPlan && !info?.hasVacation && !info?.hasSick && !info?.hasHoliday ? (
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                          }}
                        >
                          Keine Einträge
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

                    {info?.hasHoliday && info.holidayName ? (
                      <div
                        className="calendar-week-cell-preview"
                        title={info.holidayName}
                        style={{ color: "rgba(255, 196, 0, 0.95)" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {getHolidayIcon(info.holidayName)}
                          {info.holidayName}
                        </span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="calendar-grid-scroll">
              <div className="calendar-month-grid">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
                  <div key={w} className="calendar-weekday-head">
                    {w}
                  </div>
                ))}

                {loading ? (
                  <div style={{ gridColumn: "1 / -1", color: "var(--muted)" }}>Lade Kalender...</div>
                ) : (
                  grid.map((c, idx) => {
                    const info = c.inMonth && c.date ? dayMap.get(c.date) : undefined;

                    const border =
                      info?.hasSick
                        ? "rgba(224, 75, 69, 0.65)"
                        : info?.hasVacation
                        ? "rgba(90, 167, 255, 0.65)"
                        : info?.hasHoliday
                        ? "rgba(255, 196, 0, 0.65)"
                        : info?.hasPlan
                        ? "rgba(184, 207, 58, 0.65)"
                        : "var(--border)";

                    const bg =
                      info?.hasSick
                        ? "rgba(224, 75, 69, 0.18)"
                        : info?.hasVacation
                        ? "rgba(90, 167, 255, 0.14)"
                        : info?.hasHoliday
                        ? "rgba(255, 196, 0, 0.12)"
                        : info?.hasPlan
                        ? "rgba(184, 207, 58, 0.10)"
                        : "rgba(255,255,255,0.02)";

                    const isToday = c.date === todayYMD;

                    return (
                      <button
                        key={`${c.date}-${idx}`}
                        className="card calendar-month-cell"
                        disabled={!c.inMonth}
                        onClick={() => c.inMonth && c.date && openDay(c.date)}
                        style={{
                          borderColor: isToday ? "rgba(255,255,255,0.22)" : border,
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
                                background: "rgba(226, 255, 62, 0.95)",
                                boxShadow: "0 0 0 3px rgba(226, 255, 62, 0.36)",
                              }}
                              title="Heute"
                            />
                          ) : null}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {info?.hasPlan ? <span style={smallDot("rgba(184, 207, 58, 0.95)")} /> : null}
                          {info?.hasHoliday ? <span style={smallDot(holidayDotColor())} /> : null}
                          {!isAdmin && info?.hasVacation ? <span style={smallDot("rgba(90, 167, 255, 0.95)")} /> : null}
                          {!isAdmin && info?.hasSick ? <span style={smallDot("rgba(224, 75, 69, 0.95)")} /> : null}
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
                              color: "rgba(255, 196, 0, 0.95)",
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
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                marginTop: 14,
                color: "var(--muted)",
                flexWrap: "wrap",
              }}
            >
              {isAdmin ? (
                <>
                  <div>
                    <span className="badge-dot dot-work" /> Termine
                  </div>
                  <div>
                    <span
                      className="badge-dot"
                      style={{ background: holidayDotColor(), boxShadow: "0 0 0 3px rgba(255, 196, 0, 0.16)" }}
                    />{" "}
                    Feiertag
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="badge-dot dot-work" /> Arbeit
                  </div>
                  <div>
                    <span className="badge-dot dot-vac" /> Urlaub
                  </div>
                  <div>
                    <span
                      className="badge-dot"
                      style={{ background: holidayDotColor(), boxShadow: "0 0 0 3px rgba(255, 196, 0, 0.16)" }}
                    />{" "}
                    Feiertag
                  </div>
                  <div>
                    <span className="badge-dot dot-sick" /> Krank
                  </div>
                  {absLoading || reqLoading ? (
                    <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
                      Abwesenheiten/Anträge laden…
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {isAdminOwnCalendar ? (
        <button type="button" aria-label="Neuer Termin" title="Neuer Termin" onClick={openNewEventGlobal} style={floatingStyle}>
          +
        </button>
      ) : null}

      <Modal
        open={open}
        title={
          isAdmin && adminMode === "create-global"
            ? "Neuer Termin"
            : selectedDate
            ? fmtDateTitle(selectedDate)
            : "Tag"
        }
        onClose={() => setOpen(false)}
        maxWidth={980}
      >
        {isAdminOwnCalendar ? (
          <>
            {apptError && (
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
                <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{apptError}</span>
              </div>
            )}

            {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 900 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                    {dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.
                </div>
              </div>
            ) : null}

            <div className="calendar-modal-agenda-head">
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Agenda</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  {selectedDate ? `Termine für ${selectedDate}` : "Deine Termine"}
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
                Heute
              </button>
            </div>

            {apptLoading ? (
              <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                Lädt Termine...
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                Keine Termine für diesen Tag.
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
                              title="Bearbeiten"
                              style={{
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.04)",
                                color: "var(--text)",
                                borderRadius: 12,
                                padding: "8px 10px",
                                cursor: "pointer",
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteAppointment(a.id)}
                              disabled={saving}
                              title="Löschen"
                              style={{
                                border: "1px solid rgba(224, 75, 69, 0.35)",
                                background: "rgba(224, 75, 69, 0.10)",
                                color: "rgba(224, 75, 69, 0.95)",
                                borderRadius: 12,
                                padding: "8px 10px",
                                cursor: "pointer",
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                          <span style={pillStyle()}>{categoryLabel(cat)}</span>

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
                              📍 {a.location}
                            </span>
                          ) : null}

                          <span style={pillStyle()}>{a.date}</span>
                        </div>

                        {a.notes ? (
                          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                            📝 {a.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: 1, background: "var(--border)", opacity: 0.7, margin: "12px 0" }} />

            <div className="calendar-modal-form-head">
              <div style={{ fontWeight: 900 }}>
                {apptEditingId ? "Termin bearbeiten" : adminMode === "create-global" ? "Neuer Termin" : "Termin eintragen"}
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
                  Abbrechen
                </button>
              ) : null}
            </div>

            {adminMode === "create-global" || adminMode === "edit" ? (
              <div className="calendar-admin-date-field calendar-admin-date-field-compact">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Datum
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
                  Datum
                </div>
                <div
                  className="calendar-admin-date-display calendar-admin-date-input-compact"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--muted)",
                  }}
                >
                  {selectedDate || "—"}
                </div>
              </div>
            )}

            <div className="calendar-admin-time-grid" style={{ marginBottom: 10 }}>
              <div className="calendar-admin-time-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Start
                </div>
                <input
                  className="input calendar-admin-time-input"
                  type="time"
                  value={apptStart}
                  onChange={(e) => setApptStart(e.target.value)}
                />
              </div>
              <div className="calendar-admin-time-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Ende
                </div>
                <input
                  className="input calendar-admin-time-input"
                  type="time"
                  value={apptEnd}
                  onChange={(e) => setApptEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="calendar-admin-meta-grid" style={{ marginBottom: 10 }}>
              <div className="calendar-admin-meta-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Kategorie (UI-only)
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
                  <option value="KUNDE">Kunde</option>
                  <option value="BAUSTELLE">Baustelle</option>
                  <option value="INTERN">Intern</option>
                  <option value="PRIVAT">Privat</option>
                </select>
              </div>

              <div className="calendar-admin-meta-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Titel
                </div>
                <input
                  className="input calendar-admin-meta-input"
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  placeholder="z. B. Kundentermin"
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                Ort (optional)
              </div>
              <input
                className="input"
                value={apptLocation}
                onChange={(e) => setApptLocation(e.target.value)}
                placeholder="z. B. Baustelle / Adresse"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                Notiz (optional)
              </div>
              <textarea
                className="input"
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
                rows={3}
                style={{ resize: "vertical" }}
                placeholder="z. B. Ansprechpartner, Material, …"
              />
            </div>

            <button className="btn btn-accent" type="button" onClick={saveAppointment} disabled={saving} style={{ width: "100%" }}>
              {saving ? "Speichert..." : apptEditingId ? "Änderungen speichern" : "Eintragen"}
            </button>
          </>
        ) : isAdminViewingEmployee ? (
          <>
            <div className="card" style={{ padding: 12, opacity: 0.9 }}>
              Du siehst gerade den Kalender eines Mitarbeiters.
              Bearbeitung und eigene Admin-Termine sind in dieser Ansicht deaktiviert.
            </div>

            {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
              <div className="card" style={{ padding: 12, marginTop: 10 }}>
                <div style={{ fontWeight: 900 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                    {dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <div className="label">Einsatzplan des Mitarbeiters</div>

              {adminEmployeePlansLoading ? (
                <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                  Lädt Plan...
                </div>
              ) : adminEmployeePlansError ? (
                <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}>
                  <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>
                    {adminEmployeePlansError}
                  </span>
                </div>
              ) : adminEmployeeDayPlans.length === 0 ? (
                <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                  Kein Einsatz für diesen Tag geplant.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {adminEmployeeDayPlans.map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>
                        {p.startHHMM}–{p.endHHMM} · {p.activity}
                      </div>

                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                        {p.location ? `📍 ${p.location}` : "📍 (kein Ort angegeben)"}
                        {typeof p.travelMinutes === "number" && p.travelMinutes > 0 ? ` · 🚗 ${p.travelMinutes} Min Fahrzeit` : ""}
                      </div>

                      {p.noteEmployee ? (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          📝 {p.noteEmployee}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDate ? (
              <div className="card" style={{ padding: 12, marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Tagesstatus</div>

                <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", color: "var(--muted)" }}>
                  {dayMap.get(selectedDate)?.hasPlan ? <span style={pillStyle()}>Plan vorhanden</span> : null}
                  {dayMap.get(selectedDate)?.hasHoliday ? (
                    <span style={pillStyle()} title={dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}>
                      Feiertag
                    </span>
                  ) : null}
                  {dayMap.get(selectedDate)?.hasVacation ? (
                    <span style={pillStyle()}>
                      {getAbsenceCompensationSummary(
                        monthAbsences.filter(
                          (a) => a.absenceDate === selectedDate && a.type === "VACATION"
                        )
                      ) === "Unbezahlt"
                        ? "Unbezahlter Urlaub"
                        : "Urlaub"}
                    </span>
                  ) : null}
                  {dayMap.get(selectedDate)?.hasSick ? <span style={pillStyle()}>Krank</span> : null}
                </div>

                {!dayMap.get(selectedDate)?.hasPlan &&
                !dayMap.get(selectedDate)?.hasHoliday &&
                !dayMap.get(selectedDate)?.hasVacation &&
                !dayMap.get(selectedDate)?.hasSick ? (
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                    Keine Einträge für diesen Tag vorhanden.
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <div className="label">Dein Einsatzplan</div>

              {plansLoading ? (
                <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                  Lädt Plan...
                </div>
              ) : plansError ? (
                <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}>
                  <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{plansError}</span>
                </div>
              ) : dayPlans.length === 0 ? (
                <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                  Kein Einsatz für diesen Tag geplant.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayPlans.map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>
                        {p.startHHMM}–{p.endHHMM} · {p.activity}
                      </div>

                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                        {p.location ? `📍 ${p.location}` : "📍 (kein Ort angegeben)"}
                        {typeof p.travelMinutes === "number" && p.travelMinutes > 0 ? ` · 🚗 ${p.travelMinutes} Min Fahrzeit` : ""}
                      </div>

                      {p.noteEmployee ? (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          📝 {p.noteEmployee}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => syncPlanEntryToWorkEntry(p)}
                        >
                          ↪️ In Eintrag syncen
                        </button>

                        <button
                          className="btn btn-accent"
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/kalender/dokumente/${encodeURIComponent(p.id)}`);
                          }}
                        >
                          📎 Dokumente
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
                        Übernimmt Datum, Tätigkeit und Einsatzort. Uhrzeiten und Fahrtminuten ,bitte in der Erfassung ergänzen.
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
                <div style={{ marginTop: 14 }}>
                  <div className="label">Gesetzlicher Feiertag</div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 900 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                        {dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.
                    </div>
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 14 }}>
                <div className="label">Bestätigte Abwesenheit</div>

                {confirmedAbsencesForSelectedDay.length === 0 ? (
                  <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                    Keine bestätigte Abwesenheit eingetragen.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {confirmedAbsencesForSelectedDay.some((a) => a.type === "VACATION") ? (
                      <div className="card" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>🌴 Urlaub ({selectedDate})</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          Bereits vom Admin bestätigt und im Kalender registriert.
                        </div>

                        {getAbsenceCompensationBreakdown(confirmedAbsencesForSelectedDay) ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            Vergütung: {getAbsenceCompensationBreakdown(confirmedAbsencesForSelectedDay)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {confirmedAbsencesForSelectedDay
                      .filter((a) => a.type === "SICK")
                      .map((a) => (
                        <div key={a.id} className="card" style={{ padding: 12 }}>
                          <div style={{ fontWeight: 900 }}>
                            🤒 Krank ({a.dayPortion === "HALF_DAY" ? "0,5 Tag" : "1 Tag"})
                          </div>
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            Bereits vom Admin bestätigt und im Kalender registriert.
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="label">Meine Anträge</div>

                {requestBlocksForSelectedDay.length === 0 ? (
                  <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                    Kein Antrag für diesen Tag vorhanden.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {requestBlocksForSelectedDay.map((b) => (
                      <div key={b.id} className="card" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>{requestBlockLabel(b)}</div>

                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          Status: {requestStatusLabel(b.status)}
                        </div>

                        {b.type === "VACATION" ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            Umfang: {b.dayPortion === "HALF_DAY" ? "Halber Urlaubstag" : "Ganzer Urlaubstag"}
                          </div>
                        ) : null}
                        {b.type === "VACATION" ? (
                          <>
                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              Gesamt: {formatVacationDays((b.paidVacationUnits + b.unpaidVacationUnits) / 2)} Tage
                            </div>

                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              Vergütung: {getRequestCompensationSummary(
                                b.paidVacationUnits,
                                b.unpaidVacationUnits,
                                b.compensation
                              )}
                            </div>
                          </>
                        ) : null}

                        {b.noteEmployee.trim() ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            📝 {b.noteEmployee}
                          </div>
                        ) : null}

                        {b.decidedBy ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            Bearbeitet von: {b.decidedBy.fullName}
                          </div>
                        ) : null}

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button className="btn" type="button" onClick={() => showRequestDetails(b)}>
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: "var(--border)", marginTop: 14, opacity: 0.7 }} />
            </div>

            {error && (
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
                <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div className="label">{selectedRequestBlock ? "Antragsdetails" : "Abwesenheit beantragen"}</div>
              <div className="calendar-form-grid-2 absence-date-grid-mobile-fix">
                <div className="absence-date-grid-item">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                    Start
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
                    Ende
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
                className={`btn ${absenceType === "VACATION" ? "btn-accent" : ""}`}
                type="button"
                onClick={() => {
                  setAbsenceType("VACATION");
                }}
                disabled={!!selectedRequestBlock}
              >
                🌴 Urlaub
              </button>
              <button
                className={`btn ${absenceType === "SICK" ? "btn-danger" : ""}`}
                type="button"
                onClick={() => {
                  setAbsenceType("SICK");
                  setAbsenceDayPortion("FULL_DAY");
                  setAbsenceCompensation("PAID");
                }}
                disabled={!!selectedRequestBlock}
              >
                🤒 Krank
              </button>
            </div>

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">Umfang</div>
                <div
                  style={{
                    marginTop: 6,
                    marginBottom: 10,
                    fontSize: 12,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  Bei mehrtägigem Urlaub werden Samstage und Sonntage automatisch nicht mitgezählt.
                </div>
                <div className="calendar-form-grid-2">
                  <button
                    className={`btn ${absenceDayPortion === "FULL_DAY" ? "btn-accent" : ""}`}
                    type="button"
                    onClick={() => setAbsenceDayPortion("FULL_DAY")}
                    disabled={!!selectedRequestBlock}
                  >
                    Ganzer Urlaubstag
                  </button>
                  <button
                    className={`btn ${absenceDayPortion === "HALF_DAY" ? "btn-accent" : ""}`}
                    type="button"
                    onClick={() => {
                      setAbsenceDayPortion("HALF_DAY");
                      setAbsenceEnd(absenceStart);
                    }}
                    disabled={!!selectedRequestBlock || absenceDayPortion === "HALF_DAY"}
                  >
                    Halber Urlaubstag
                  </button>
                </div>
              </div>
            ) : null}

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">Vergütung</div>

                {!selectedRequestBlock ? (
                  <div
                    className="card"
                    style={{
                      padding: 10,
                      marginBottom: 10,
                      borderColor: compensationLockedBySystem
                        ? "rgba(255, 184, 77, 0.35)"
                        : "rgba(255,255,255,0.10)",
                      background: compensationLockedBySystem
                        ? "rgba(255, 184, 77, 0.08)"
                        : "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.92)",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {compensationLockedBySystem
                      ? "Für diesen Antrag ist aktuell nicht genug bezahlter Urlaub verfügbar. Der Antrag wird deshalb vorläufig als unbezahlt eingereicht. Bei der Prüfung kann der Admin den Antrag ganz oder teilweise in bezahlten und unbezahlten Urlaub aufteilen."
                      : "Falls bezahlter Resturlaub nicht vollständig ausreicht, kann der Antrag bei der Prüfung ganz oder teilweise in bezahlten und unbezahlten Urlaub aufgeteilt werden."}
                  </div>
                ) : null}

                {selectedRequestBlock ? (
                  <div
                    className="card"
                    style={{
                      padding: 10,
                      borderColor: "rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.92)",
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    <div>
                      Gesamt: {formatVacationDays(
                        (selectedRequestBlock.paidVacationUnits + selectedRequestBlock.unpaidVacationUnits) / 2
                      )} Tage
                    </div>

                    <div style={{ marginTop: 6, color: "var(--muted)" }}>
                      {getRequestCompensationSummary(
                        selectedRequestBlock.paidVacationUnits,
                        selectedRequestBlock.unpaidVacationUnits,
                        selectedRequestBlock.compensation
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="calendar-form-grid-2">
                    <button
                      className={`btn ${absenceCompensation === "PAID" ? "btn-accent" : ""}`}
                      type="button"
                      onClick={() => setAbsenceCompensation("PAID")}
                      disabled={!!selectedRequestBlock || compensationLockedBySystem}
                    >
                      Bezahlt
                    </button>
                    <button
                      className={`btn ${absenceCompensation === "UNPAID" ? "btn-accent" : ""}`}
                      type="button"
                      onClick={() => setAbsenceCompensation("UNPAID")}
                      disabled={!!selectedRequestBlock || compensationLockedBySystem}
                    >
                      Unbezahlt
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginBottom: 12 }}>
              <div className="label">Notiz an Admin</div>
              <textarea
                className="textarea"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder="Optional: Hinweis zum Antrag"
                disabled={!!selectedRequestBlock}
              />
            </div>

            {selectedRequestBlock ? (
              <div className="calendar-form-grid-2">
                <button className="btn" type="button" onClick={cancelRequestView} style={{ width: "100%" }}>
                  Schließen
                </button>
                <button className="btn btn-accent" type="button" onClick={startNewRequest} style={{ width: "100%" }}>
                  Neuer Antrag
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
                {saving ? "Speichert..." : "Antrag senden"}
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
          Kalender lädt...
        </div>
      }
    >
      <KalenderPageInner {...props} />
    </Suspense>
  );
}