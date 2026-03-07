"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type CalendarDay = {
  date: string;
  hasWork: boolean;
  hasVacation: boolean;
  hasSick: boolean;
  hasPlan: boolean; // Admin: "hat Termine"
  planPreview: string | null; // Admin: Termin-Preview
};

type CalendarResponse = { ok: true; days: CalendarDay[] } | { ok: false; error: string };

type AbsenceType = "VACATION" | "SICK";

type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";

type AbsenceDTO = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
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

type SessionDTO = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

type CalendarEventDTO = {
  id: string;
  date: string; // YYYY-MM-DD
  startHHMM: string;
  endHHMM: string;
  title: string;
  location: string | null;
  notes: string | null;
};

// UI-only Kategorien (werden NICHT in DB gespeichert)
type EventCategory = "KUNDE" | "BAUSTELLE" | "INTERN" | "PRIVAT";

// Admin Modal Mode: steuert, ob Datum wählbar ist
type AdminApptMode = "create-global" | "create-from-day" | "edit";

// UI View mode
type CalendarViewMode = "MONTH" | "WEEK";

// ---------- helpers (no any) ----------
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

function isCalendarDay(v: unknown): v is CalendarDay {
  if (!isRecord(v)) return false;
  const date = getStringField(v, "date");
  const hasWork = getBooleanField(v, "hasWork");
  const hasVacation = getBooleanField(v, "hasVacation");
  const hasSick = getBooleanField(v, "hasSick");
  const hasPlan = getBooleanField(v, "hasPlan");
  const planPreviewRaw = v["planPreview"];
  const planPreview = planPreviewRaw === null || typeof planPreviewRaw === "string" ? planPreviewRaw : undefined;

  return (
    typeof date === "string" &&
    typeof hasWork === "boolean" &&
    typeof hasVacation === "boolean" &&
    typeof hasSick === "boolean" &&
    typeof hasPlan === "boolean" &&
    (planPreview === null || typeof planPreview === "string")
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
  const user = v["user"];

  if (!id || !absenceDate || !isAbsenceType(type) || !isAbsenceDayPortion(dayPortion)) {
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

function parseAbsenceRequestsResponse(j: unknown): AbsenceRequestDTO[] {
  if (!isRecord(j)) return [];
  if (j["ok"] !== true) return [];
  const requests = j["requests"];
  if (!Array.isArray(requests)) return [];
  return requests.filter(isAbsenceRequestDTO);
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

  return (
    typeof id === "string" &&
    typeof userId === "string" &&
    typeof workDate === "string" &&
    typeof startHHMM === "string" &&
    typeof endHHMM === "string" &&
    typeof activity === "string" &&
    typeof location === "string" &&
    typeof travelMinutes === "number" &&
    (noteEmployee === undefined || noteEmployee === null || typeof noteEmployee === "string")
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
  return typeof userId === "string" && typeof fullName === "string" && (role === "ADMIN" || role === "EMPLOYEE");
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

function extractErrorMessage(j: unknown, fallback: string) {
  if (!isRecord(j)) return fallback;
  const e = j["error"];
  return typeof e === "string" && e.trim() ? e : fallback;
}

// ---------- date helpers ----------
function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}
function addMonths(d: Date, diff: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + diff);
  return x;
}
function addDaysYMD(ymd: string, diff: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + diff);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fmtDateTitle(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function dateInRange(date: string, start: string, end: string) {
  return start <= date && date <= end;
}
function toYMDLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function ymdToDateLocal(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mo=0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Donnerstag entscheidet über die ISO-Woche
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
    const type = typeRaw === "SICK" ? "SICK" : "VACATION";
    const dayPortion = dayPortionRaw === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY";

    if (list.length === 0) continue;

    let curStart = list[0].absenceDate;
    let curEnd = list[0].absenceDate;
    let idsByDate: Record<string, string> = { [list[0].absenceDate]: list[0].id };

    for (let i = 1; i < list.length; i++) {
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

function blockLabel(b: AbsenceBlock) {
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

function requestBlockLabel(b: AbsenceRequestBlock) {
  const icon = b.type === "VACATION" ? "🌴" : "🤒";

  if (b.type === "VACATION" && b.dayPortion === "HALF_DAY") {
    return `${icon} Urlaubsantrag (halber Tag · ${b.start})`;
  }

  const name = b.type === "VACATION" ? "Urlaubsantrag" : "Krankheitsantrag";
  const span = b.start === b.end ? b.start : `${b.start}–${b.end}`;
  return `${icon} ${name} (${span})`;
}

// ---------- UI-only category persistence ----------
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

function safeWriteCategoryMap(map: Record<string, EventCategory>) {
  try {
    window.localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function categoryLabel(c: EventCategory) {
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

export default function KalenderPage() {
  const router = useRouter();
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");

  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<SessionDTO | null>(null);

  type UserOption = { id: string; fullName: string };

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // EMPLOYEE only:
  const [monthAbsences, setMonthAbsences] = useState<AbsenceDTO[]>([]);
  const [absLoading, setAbsLoading] = useState(false);
  const [monthRequests, setMonthRequests] = useState<AbsenceRequestDTO[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [requestNote, setRequestNote] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // EMPLOYEE only:
  const [dayPlans, setDayPlans] = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  // EMPLOYEE only:
  const [absenceStart, setAbsenceStart] = useState<string>("");
  const [absenceEnd, setAbsenceEnd] = useState<string>("");
  const [absenceType, setAbsenceType] = useState<AbsenceType>("VACATION");
  const [absenceDayPortion, setAbsenceDayPortion] = useState<AbsenceDayPortion>("FULL_DAY");
  const [selectedRequestBlock, setSelectedRequestBlock] = useState<AbsenceRequestBlock | null>(null);

  // ADMIN only:
  const [dayAppointments, setDayAppointments] = useState<CalendarEventDTO[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  const [adminMode, setAdminMode] = useState<AdminApptMode>("create-from-day");

  const [apptEditingId, setApptEditingId] = useState<string | null>(null);
  const [apptCategory, setApptCategory] = useState<EventCategory>("KUNDE"); // UI-only
  const [apptTitle, setApptTitle] = useState<string>("");
  const [apptDate, setApptDate] = useState<string>(""); // ✅ Datum im Admin-Form (für global + edit)
  const [apptStart, setApptStart] = useState<string>("08:00");
  const [apptEnd, setApptEnd] = useState<string>("09:00");
  const [apptLocation, setApptLocation] = useState<string>("");
  const [apptNotes, setApptNotes] = useState<string>("");

  const [categoryMap, setCategoryMap] = useState<Record<string, EventCategory>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => monthKey(cursor), [cursor]);
  const isAdmin = session?.role === "ADMIN";
  const isAdminOwnCalendar = isAdmin && !selectedUserId;      // Admin sieht eigene Termine
  const isAdminViewingEmployee = isAdmin && !!selectedUserId; // Admin sieht Mitarbeiter-Kalender

  const title = useMemo(() => {
    if (viewMode === "WEEK") {
      const ws = startOfWeekMonday(cursor);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `${fmt(ws)} – ${fmt(we)}`;
    }
    const m = cursor.toLocaleString("de-DE", { month: "long" });
    return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${cursor.getFullYear()}`;
  }, [cursor, viewMode]);

const weekMeta = useMemo(() => {
  if (viewMode !== "WEEK") return null;

  const ws = startOfWeekMonday(cursor);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);

  const kw = getISOWeek(ws);

  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return { kw, ws, we, rangeLabel: `${fmt(ws)} – ${fmt(we)}` };
}, [cursor, viewMode]);

  const todayYMD = useMemo(() => toYMDLocal(new Date()), []);

  // Session laden
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
        setSession(parseMeResponse(j));
      })
      .catch(() => {
        if (!alive) return;
        setSession(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Admin: Mitarbeiterliste laden
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

  // UI-only Categories (Admin): localStorage
  useEffect(() => {
    if (!isAdmin) return;
    setCategoryMap(safeReadCategoryMap());
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    safeWriteCategoryMap(categoryMap);
  }, [categoryMap, isAdmin]);

  async function loadCalendar() {
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

  async function loadAbsencesMonth() {
    setAbsLoading(true);
    try {
      const r = await fetch(`/api/absences?${new URLSearchParams({ month: ym }).toString()}`);
      const j: unknown = await r.json();
      setMonthAbsences(r.ok ? parseAbsencesResponse(j) : []);
    } finally {
      setAbsLoading(false);
    }
  }

    async function loadRequestsMonth() {
    setReqLoading(true);
    try {
      const r = await fetch(`/api/absence-requests?${new URLSearchParams({ month: ym }).toString()}`);
      const j: unknown = await r.json();
      setMonthRequests(r.ok ? parseAbsenceRequestsResponse(j) : []);
    } finally {
      setReqLoading(false);
    }
  }

    async function reloadMonthAll() {
    if (isAdmin) {
      await loadCalendar();
      return;
    }
    await Promise.all([loadCalendar(), loadAbsencesMonth(), loadRequestsMonth()]);
  }

  useEffect(() => {
    void reloadMonthAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, session?.role, selectedUserId]);

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

    return requestBlocks.filter(
      (b) =>
        b.status === "PENDING" &&
        dateInRange(selectedDate, b.start, b.end)
    );
  }, [requestBlocks, selectedDate, isAdmin]);

  const grid = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);

    const firstDay = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: "", day: 0, inMonth: false });

    for (let d = 1; d <= daysInMonth; d++) {
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
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      const ymd = toYMDLocal(d);
      const label = d.toLocaleDateString("de-DE", { weekday: "short" });
      const dayNum = d.toLocaleDateString("de-DE", { day: "2-digit" });
      out.push({ date: ymd, label, dayNum, isToday: ymd === todayYMD });
    }
    return out;
  }, [cursor, todayYMD]);

  // EMPLOYEE: Plan laden
  async function loadPlansForDay(date: string) {
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
  }

  // ADMIN: Termine laden
  async function loadAppointmentsForDay(date: string) {
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
  }

  function resetAppointmentForm() {
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

  function openDay(date: string) {
    setSelectedDate(date);
    setOpen(true);
    setError(null);

    if (isAdmin) {
      // ✅ Klick auf Tag: Datum NICHT wählbar
      setAdminMode("create-from-day");
      resetAppointmentForm();
      setApptDate(date); // intern trotzdem gesetzt
      setDayAppointments([]);
      void loadAppointmentsForDay(date);
      return;
    }

    // EMPLOYEE init:
    setSelectedRequestBlock(null);
    setAbsenceStart(date);
    setAbsenceEnd(date);
    setAbsenceType("VACATION");
    setRequestNote("");

    setDayPlans([]);
    setPlansError(null);
    setPlansLoading(false);

    void loadPlansForDay(date);
  }

  // ✅ Admin: Floating + Button -> "global create" (Datum wählbar)
  function openNewEventGlobal() {
    const now = new Date();
    const ymd = toYMDLocal(now);

    setCursor(now);
    setSelectedDate(ymd); // Modal-Titel bleibt schön
    setOpen(true);

    setAdminMode("create-global");
    resetAppointmentForm();

    // Default Datum = heute (aber frei änderbar)
    setApptDate(ymd);

    // Agenda für heute laden (optional, fühlt sich nice an)
    void loadAppointmentsForDay(ymd);
  }

  // EMPLOYEE: Abwesenheit bearbeiten
  function startNewRequest() {
    setSelectedRequestBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
    }
    setAbsenceType("VACATION");
    setAbsenceDayPortion("FULL_DAY");
    setRequestNote("");
  }

  function showRequestDetails(block: AbsenceRequestBlock) {
    setSelectedRequestBlock(block);
    setAbsenceStart(block.start);
    setAbsenceEnd(block.end);
    setAbsenceType(block.type);
    setAbsenceDayPortion(block.dayPortion);
    setRequestNote(block.noteEmployee);
    setError(null);
  }

  function cancelRequestView() {
    setSelectedRequestBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
    }
    setAbsenceType("VACATION");
    setAbsenceDayPortion("FULL_DAY");
    setRequestNote("");
  }

  // EMPLOYEE: speichern
  async function saveAbsence() {
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
    // ✅ create-from-day: Datum fix = selectedDate
    if (adminMode === "create-from-day") return selectedDate;
    // ✅ create-global + edit: Datum kommt aus apptDate
    return apptDate.trim();
  }

  // ADMIN: Termin speichern (create/update)
  async function saveAppointment() {
    const date = effectiveAdminDate();
    if (!date) {
      setApptError("Bitte Datum auswählen.");
      return;
    }

    setApptError(null);
    const title = apptTitle.trim();
    if (!title) {
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
            title,
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
        const r = await fetch(`/api/admin/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startHHMM: apptStart,
            endHHMM: apptEnd,
            title,
            location: apptLocation.trim(),
            notes: apptNotes.trim(),
          }),
        });
        const j: unknown = await r.json();
        if (!r.ok) {
          setApptError(extractErrorMessage(j, "Speichern fehlgeschlagen."));
          return;
        }

        // nach Create: Kategorie UI-only -> id aus Response ziehen und local speichern
        if (isRecord(j) && j["ok"] === true) {
          const ev = j["event"];
          if (isCalendarEventDTO(ev)) {
            setCategoryMap((prev) => ({ ...prev, [ev.id]: apptCategory }));
          }
        }
      }

      // ✅ Wenn Datum geändert wurde (Edit / Global), Modal & Agenda auf neues Datum schalten
      setSelectedDate(date);

      await Promise.all([loadAppointmentsForDay(date), reloadMonthAll()]);
      resetAppointmentForm();

      // Nach Save bleiben wir im "create-from-day" wenn man auf einem Tag ist,
      // global bleibt global (fühlt sich wie Apple an)
      if (adminMode === "edit") setAdminMode("create-from-day");
    } catch {
      setApptError("Netzwerkfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  function editAppointment(a: CalendarEventDTO) {
    setAdminMode("edit");
    setApptEditingId(a.id);
    setApptTitle(a.title);
    setApptDate(a.date); // ✅ Datum beim Bearbeiten wählbar
    setApptStart(a.startHHMM);
    setApptEnd(a.endHHMM);
    setApptLocation(a.location ?? "");
    setApptNotes(a.notes ?? "");
    setApptCategory(categoryMap[a.id] ?? "KUNDE"); // UI-only
    setApptError(null);
    setError(null);
  }

  async function deleteAppointment(id: string) {
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

  // wenn Admin im Formular Kategorie ändert, für Edit direkt local merken
  useEffect(() => {
    if (!isAdmin) return;
    if (!apptEditingId) return;
    setCategoryMap((prev) => ({ ...prev, [apptEditingId]: apptCategory }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptCategory]);

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
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 12,
  });

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="card card-olive" style={{ padding: 18, position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <button
            className="btn"
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

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
  <div style={{ fontWeight: 900, fontSize: 20 }}>{title}</div>
  {isAdmin ? (
  <div style={{ marginTop: 8 }}>
    <select
      value={selectedUserId}
      onChange={(e) => setSelectedUserId(e.target.value)}
      className="input"
      style={{ maxWidth: 280 }}
    >
      <option value="">Meine Admin-Termine</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.fullName}
        </option>
      ))}
    </select>

    {isAdminViewingEmployee ? (
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
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

            {/* ✅ Monat/Woche Toggle */}
            <div style={segmentedWrap}>
              <button type="button" style={segBtn(viewMode === "MONTH")} onClick={() => setViewMode("MONTH")}>
                Monat
              </button>
              <button type="button" style={segBtn(viewMode === "WEEK")} onClick={() => setViewMode("WEEK")}>
                Woche
              </button>
            </div>
          </div>

          <button
            className="btn"
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
  <div
    style={{
      display: "flex",
      gap: 8,
      marginTop: 8,
      flexWrap: "wrap",
      justifyContent: "center",
    }}
  >
    <button
      className="btn"
      type="button"
      onClick={() => {
        window.location.href = "/api/admin/google/connect";
      }}
    >
      Google Kalender verbinden
    </button>
  </div>
) : null}
        </div>

        {/* ===================== WEEK VIEW ===================== */}
        {viewMode === "WEEK" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
            {weekDays.map((w) => {
              const info = dayMap.get(w.date);
              const inThisMonth = monthKey(ymdToDateLocal(w.date)) === ym;

              const border =
                info?.hasSick
                  ? "rgba(224, 75, 69, 0.65)"
                  : info?.hasVacation
                  ? "rgba(90, 167, 255, 0.65)"
                  : info?.hasPlan
                  ? "rgba(184, 207, 58, 0.65)"
                  : "var(--border)";

              const bg =
                info?.hasSick
                  ? "rgba(224, 75, 69, 0.16)"
                  : info?.hasVacation
                  ? "rgba(90, 167, 255, 0.12)"
                  : info?.hasPlan
                  ? "rgba(184, 207, 58, 0.10)"
                  : "rgba(255,255,255,0.02)";

              return (
                <button
                  key={w.date}
                  className="card"
                  onClick={() => {
                    // wenn Woche in Nachbarmonat geht: Cursor auf den Tag setzen -> lädt richtigen Monat automatisch
                    const dt = ymdToDateLocal(w.date);
                    setCursor(dt);
                    openDay(w.date);
                  }}
                  style={{
                    height: 110,
                    borderColor: border,
                    background: bg,
                    borderRadius: 16,
                    opacity: inThisMonth ? 1 : 0.75,
                    textAlign: "left",
                    padding: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                  }}
                  title={fmtDateTitle(w.date)}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{w.label}</div>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        background: w.isToday ? "rgb(127, 142, 42)" : "rgba(109, 144, 110, 0.02)",
                        border: w.isToday ? "1px solid hsla(151, 76%, 25%, 0.18)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {w.dayNum}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {info?.hasPlan ? (
                      <span style={pillStyle()}>
                        <span style={smallDot("rgba(184, 207, 58, 0.95)")} /> Termine
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
                  </div>

                  {isAdmin && info?.hasPlan && info.planPreview ? (
                    <div
                      style={{
                        marginTop: 10,
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
                      }}
                      title={info.planPreview}
                    >
                      {info.planPreview}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          /* ===================== MONTH VIEW ===================== */
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
                <div key={w} style={{ color: "var(--muted-2)", fontSize: 12, textAlign: "center" }}>
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
                      : info?.hasPlan
                      ? "rgba(184, 207, 58, 0.65)"
                      : "var(--border)";

                  const bg =
                    info?.hasSick
                      ? "rgba(224, 75, 69, 0.18)"
                      : info?.hasVacation
                      ? "rgba(90, 167, 255, 0.14)"
                      : info?.hasPlan
                      ? "rgba(184, 207, 58, 0.10)"
                      : "rgba(255,255,255,0.02)";

                  const isToday = c.date === todayYMD;

                  return (
                    <button
                      key={idx}
                      className="card"
                      disabled={!c.inMonth}
                      onClick={() => c.inMonth && c.date && openDay(c.date)}
                      style={{
                        height: 86,
                        borderColor: isToday ? "rgba(255,255,255,0.22)" : border,
                        background: bg,
                        borderRadius: 16,
                        opacity: c.inMonth ? 1 : 0.25,
                        cursor: c.inMonth ? "pointer" : "default",
                        textAlign: "left",
                        padding: 10,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ fontWeight: 900 }}>{c.inMonth ? c.day : ""}</div>

                        {/* Today indicator */}
                        {isToday ? (
                          <div
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

                      {/* Mini dots wie Apple */}
                      <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                        {info?.hasPlan ? <span style={smallDot("rgba(184, 207, 58, 0.95)")} /> : null}
                        {!isAdmin && info?.hasVacation ? <span style={smallDot("rgba(90, 167, 255, 0.95)")} /> : null}
                        {!isAdmin && info?.hasSick ? <span style={smallDot("rgba(224, 75, 69, 0.95)")} /> : null}
                      </div>

                      {info?.hasPlan && info.planPreview ? (
                        <div
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
                    </button>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, color: "var(--muted)" }}>
              {isAdmin ? (
                <div>
                  <span className="badge-dot dot-work" /> Termine
                </div>
              ) : (
                <>
                  <div>
                    <span className="badge-dot dot-work" /> Arbeit
                  </div>
                  <div>
                    <span className="badge-dot dot-vac" /> Urlaub
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

      {/* ✅ Floating + Button (nur Admin) */}
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
        {/* ================= ADMIN MODAL ================= */}
        {isAdminOwnCalendar ? (
          <>
            {apptError && (
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
                <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{apptError}</span>
              </div>
            )}
            {/* Agenda */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Agenda</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  {selectedDate ? `Termine für ${selectedDate}` : "Deine Termine"}
                </div>
              </div>

              {/* Quick: Heute */}
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
                      className="card"
                      style={{
                        padding: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={categoryDotStyle(cat)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
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

                          {/* Mini actions */}
                          <div style={{ display: "flex", gap: 8 }}>
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
                            <span style={{ color: "var(--muted)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

            {/* Form */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
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

            {/* ✅ Datum nur bei global create + edit */}
            {(adminMode === "create-global" || adminMode === "edit") ? (
              <div style={{ marginBottom: 10 }}>
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Datum
                </div>
                <input className="input" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Datum
                </div>
                <div style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "var(--muted)" }}>
                  {selectedDate || "—"}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Start
                </div>
                <input className="input" type="time" value={apptStart} onChange={(e) => setApptStart(e.target.value)} />
              </div>
              <div>
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Ende
                </div>
                <input className="input" type="time" value={apptEnd} onChange={(e) => setApptEnd(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Kategorie (UI-only)
                </div>
                <select
                  className="input"
                  value={apptCategory}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "KUNDE" || v === "BAUSTELLE" || v === "INTERN" || v === "PRIVAT") setApptCategory(v);
                  }}
                >
                  <option value="KUNDE">Kunde</option>
                  <option value="BAUSTELLE">Baustelle</option>
                  <option value="INTERN">Intern</option>
                  <option value="PRIVAT">Privat</option>
                </select>
              </div>

              <div>
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  Titel
                </div>
                <input className="input" value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} placeholder="z. B. Kundentermin" />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                Ort (optional)
              </div>
              <input className="input" value={apptLocation} onChange={(e) => setApptLocation(e.target.value)} placeholder="z. B. Baustelle / Adresse" />
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
    {/* ================= ADMIN: Mitarbeiter Read-only ================= */}
    <div className="card" style={{ padding: 12, opacity: 0.9 }}>
      Du siehst gerade den Kalender eines Mitarbeiters.  
      Bearbeitung/Termine sind in dieser Ansicht deaktiviert.
    </div>

    {selectedDate ? (
      <div className="card" style={{ padding: 12, marginTop: 10 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Tagesinfo</div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          {dayMap.get(selectedDate)?.planPreview ? `Plan: ${dayMap.get(selectedDate)?.planPreview}` : "Kein Plan/Preview vorhanden."}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", color: "var(--muted)" }}>
          {dayMap.get(selectedDate)?.hasPlan ? <span style={pillStyle()}>Termine/Plan</span> : null}
          {dayMap.get(selectedDate)?.hasVacation ? <span style={pillStyle()}>Urlaub</span> : null}
          {dayMap.get(selectedDate)?.hasSick ? <span style={pillStyle()}>Krank</span> : null}
        </div>
      </div>
    ) : null}
  </>
) : (
          /* ================= EMPLOYEE MODAL (dein bisheriges) ================= */
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
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <div className="label">Bestätigte Abwesenheit</div>

                {blocksForSelectedDay.length === 0 ? (
                  <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                    Keine bestätigte Abwesenheit eingetragen.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {blocksForSelectedDay.map((b) => (
                      <div key={`${b.type}-${b.start}-${b.end}`} className="card" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>{blockLabel(b)}</div>
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
                          <button
                            className="btn"
                            type="button"
                            onClick={() => showRequestDetails(b)}
                          >
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
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

                <div>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
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
                }}
                disabled={!!selectedRequestBlock}
              >
                🤒 Krank
              </button>
            </div>

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">Umfang</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  className="btn"
                  type="button"
                  onClick={cancelRequestView}
                  style={{ width: "100%" }}
                >
                  Schließen
                </button>
                <button
                  className="btn btn-accent"
                  type="button"
                  onClick={startNewRequest}
                  style={{ width: "100%" }}
                >
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