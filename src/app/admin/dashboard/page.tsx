"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { MousePointerClick } from "lucide-react";


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

type AdminDashboardApiOk = {
  ok: true;
  todayIso: string;
  weekRange: { from: string; to: string };
  monthRange: { from: string; to: string };
  cards: DashboardCards;
  todayActiveEmployees: DashboardPersonRow[];
  todayMissingEmployees: DashboardPersonRow[];
  todayAbsentEmployees: DashboardAbsenceRow[];
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
};

type OverviewApiResponse = {
  month: string;
  targetMinutes: number;
  byUser: OverviewByUserRow[];
  totals: {
    entriesCount: number;
    workMinutes: number;
    travelMinutes: number;
    vacationDays: number;
    sickDays: number;
  };
  isAdmin: boolean;
};

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

  if (!isRecord(cards) || !isRecord(weekRange) || !isRecord(monthRange)) return false;
  if (!Array.isArray(employeesTimeline)) return false;
  if (!Array.isArray(todayActiveEmployees)) return false;
  if (!Array.isArray(todayMissingEmployees)) return false;
  if (!Array.isArray(todayAbsentEmployees)) return false;

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
    todayActiveEmployees.every(isDashboardPersonRow) &&
    todayMissingEmployees.every(isDashboardPersonRow) &&
    todayAbsentEmployees.every(isDashboardAbsenceRow)
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
    isNumber(v["sickDays"])
  );
}

function isOverviewApiResponse(v: unknown): v is OverviewApiResponse {
  if (!isRecord(v)) return false;
  const totals = v["totals"];
  const byUser = v["byUser"];
  if (!isRecord(totals) || !Array.isArray(byUser)) return false;

  return (
    isString(v["month"]) &&
    isNumber(v["targetMinutes"]) &&
    typeof v["isAdmin"] === "boolean" &&
    byUser.every(isOverviewRow) &&
    isNumber(totals["entriesCount"]) &&
    isNumber(totals["workMinutes"]) &&
    isNumber(totals["travelMinutes"]) &&
    isNumber(totals["vacationDays"]) &&
    isNumber(totals["sickDays"])
  );
}

/* =========================
   Helpers (Dates, Formatting)
   ========================= */

function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function currentYear(): string {
  return String(new Date().getFullYear());
}

function lastDayOfMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0);
  return String(last.getDate()).padStart(2, "0");
}

type ExportMode = "MONTH" | "YEAR" | "RANGE";

function formatHM(minutes: number) {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}min`;
}

function formatHours1(minutes: number) {
  const h = minutes / 60;
  return `${h.toFixed(1)}h`;
}

function formatDateDE(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dd}.${mm}.${y}`;
}

function formatMinutesCompact(minutes: number) {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} min`;
  return formatHM(mins);
}

function absenceTypeLabel(type: "VACATION" | "SICK") {
  return type === "VACATION" ? "Urlaub" : "Krank";
}

function getDayBreakForDate(dayBreaks: AdminDayBreak[], workDate: string): AdminDayBreak | null {
  return dayBreaks.find((item) => item.workDate === workDate) ?? null;
}

function formatBreakInfo(it: AdminTimelineWork) {
  const manual = it.breakAuto ? 0 : it.breakMinutes;
  const auto = it.breakAuto ? it.breakMinutes : 0;

  if (manual > 0 && auto > 0) {
    return `Pause ${manual} min · +${auto} min automatisch`;
  }

  if (manual > 0) {
    return `Pause ${manual} min`;
  }

  if (auto > 0) {
    return `Pause automatisch +${auto} min`;
  }

  return "";
}

function groupWorkItemsByDay(items: AdminTimelineWork[]) {
  const grouped: Record<string, AdminTimelineWork[]> = {};

  const sorted = items
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startHHMM !== b.startHHMM) return a.startHHMM.localeCompare(b.startHHMM);
      return a.endHHMM.localeCompare(b.endHHMM);
    });

  for (const it of sorted) {
    const day = it.date; // YYYY-MM-DD

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
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  dayPortion: "FULL_DAY" | "HALF_DAY";
  days: number;
};

function addDaysIso(iso: string, days: number) {
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

function formatDayCountDE(days: number): string {
  if (days === 0.5) return "0,5 Tag";
  if (Number.isInteger(days)) return `${days} ${days === 1 ? "Tag" : "Tage"}`;
  return `${String(days).replace(".", ",")} Tage`;
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
   Page
   ========================= */

export default function AdminDashboardPage() {
  const ym = useMemo(() => monthKey(new Date()), []);
  const [month, setMonth] = useState<string>(ym);

  const [dash, setDash] = useState<AdminDashboardApiOk | null>(null);
  const [overview, setOverview] = useState<OverviewApiResponse | null>(null);

  const [openUsers, setOpenUsers] = useState<Set<string>>(new Set());
  const [openCats, setOpenCats] = useState<Record<string, CatState>>({});

  const [openWorkDays, setOpenWorkDays] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [reloadTick, setReloadTick] = useState(0);
  type KpiModalKind = "ACTIVE" | "MISSING" | "ABSENT" | null;

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

      type ExportTarget = "ALL" | "EMPLOYEE";
    const [exportTarget, setExportTarget] = useState<ExportTarget>("ALL");
    const [exportEmployeeId, setExportEmployeeId] = useState<string>("");

    const employeeOptions = useMemo(() => {
      const list = (dash?.employeesTimeline ?? [])
        .map((u) => ({ id: u.userId, name: u.fullName }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return list;
    }, [dash]);

    const exportTargetError = useMemo(() => {
      if (exportTarget !== "EMPLOYEE") return "";
      if (!exportEmployeeId) return "Bitte Mitarbeiter auswählen.";
      return "";
    }, [exportTarget, exportEmployeeId]);

    // Admin Edit WorkEntry Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState<string>("");

  const [editEntryId, setEditEntryId] = useState<string>("");
  const [editUserLabel, setEditUserLabel] = useState<string>(""); // nur Anzeige
  const [editDate, setEditDate] = useState<string>(""); // nur Anzeige
  const [editTime, setEditTime] = useState<string>(""); // nur Anzeige

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

  const startDownload = (url: string) => {
    window.location.href = url;
  };

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
        const msg = isRecord(j) && isString(j["error"]) ? j["error"] : "Push konnte nicht gesendet werden.";
        setRemindErr(msg);
        return;
      }

      setRemindSuccess(`Reminder an ${fullName} gesendet.`);
      setReloadTick((x) => x + 1);
    } catch {
      setRemindErr("Netzwerkfehler beim Senden des Reminders.");
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

    setExportOpen(true);
  };

  const rangeError = useMemo(() => {
    if (exportMode !== "RANGE") return "";
    if (!rangeFrom || !rangeTo) return "Bitte Von und Bis auswählen.";
    if (rangeFrom > rangeTo) return "Von-Datum darf nicht nach dem Bis-Datum liegen.";
    return "";
  }, [exportMode, rangeFrom, rangeTo]);

  const doExport = () => {
    if (exportTarget === "EMPLOYEE" && exportTargetError) return;

    const empParam =
      exportTarget === "EMPLOYEE" && exportEmployeeId
        ? `&employeeId=${encodeURIComponent(exportEmployeeId)}`
        : "";

    if (exportMode === "MONTH") {
      startDownload(`/api/admin/export?scope=month&month=${encodeURIComponent(exportMonth)}${empParam}`);
      setExportOpen(false);
      return;
    }

    if (exportMode === "YEAR") {
      startDownload(`/api/admin/export?scope=year&year=${encodeURIComponent(exportYear)}${empParam}`);
      setExportOpen(false);
      return;
    }

    if (rangeError) return;
    startDownload(`/api/admin/export?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}${empParam}`);
    setExportOpen(false);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
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
          const msg = isRecord(jd) && isString(jd["error"]) ? jd["error"] : "Dashboard konnte nicht geladen werden.";
          setErr(msg);
          setDash(null);
          setOverview(null);
          return;
        }

        if (!isAdminDashboardOk(jd)) {
          setErr("Unerwartete Dashboard-Antwort.");
          setDash(null);
          setOverview(null);
          return;
        }

        // overview ist Admin-fähig, aber wir prüfen Shape
        if (!ro.ok || !isOverviewApiResponse(jo) || jo.isAdmin !== true) {
          setDash(jd);
          setOverview(null);
          return;
        }

        setDash(jd);
        setOverview(jo);
      } catch {
        if (!alive) return;
        setErr("Netzwerkfehler beim Laden.");
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
  }, [month, reloadTick]);

  const exportFooter = (
    <>
      <button
        type="button"
        onClick={() => setExportOpen(false)}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
          fontWeight: 900,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        Abbrechen
      </button>

      <button
        type="button"
        onClick={doExport}
        disabled={(exportMode === "RANGE" && Boolean(rangeError)) || Boolean(exportTargetError)}
        style={{
          padding: "10px 14px",
          cursor: ((exportMode === "RANGE" && rangeError) || exportTargetError) ? "not-allowed" : "pointer",
          fontWeight: 1000,
          borderRadius: 12,
          border: "1px solid rgba(184,207,58,0.35)",
          background: exportMode === "RANGE" && rangeError ? "rgba(184,207,58,0.06)" : "rgba(184,207,58,0.12)",
          color: "var(--accent)",
          opacity: ((exportMode === "RANGE" && rangeError) || exportTargetError) ? 0.7 : 1,
        }}
        title="Download starten"
      >
        Download starten
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
          // startTime/endTime NICHT schicken (Admin darf Zeit nicht ändern)
        }),
      });

      const j: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = isRecord(j) && isString(j["error"]) ? j["error"] : "Speichern fehlgeschlagen.";
        setEditErr(msg);
        return;
      }

      // schnell & sicher: Dashboard neu laden (einfach month einmal "neu setzen")
      setEditOpen(false);
      setReloadTick((x) => x + 1);
    } catch {
      setEditErr("Netzwerkfehler beim Speichern.");
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteWorkEntry(entryId: string) {
    const ok = window.confirm("Diesen Eintrag wirklich löschen?");
    if (!ok) return;

    try {
      const r = await fetch(`/api/entries?id=${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = isRecord(j) && isString(j["error"]) ? j["error"] : "Löschen fehlgeschlagen.";
        alert(msg);
        return;
      }

      // neu laden
      setReloadTick((x) => x + 1);
    } catch {
      alert("Netzwerkfehler beim Löschen.");
    }
  }

  return (
    <AppShell activeLabel="Admin-Übersicht">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Monat (für Übersicht + Export)</div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.25)",
              color: "rgba(255,255,255,0.92)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button
            onClick={openExportModal}
            className="card"
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 900,
              borderRadius: 12,
              border: "1px solid rgba(184,207,58,0.35)",
              background: "rgba(184,207,58,0.12)",
              color: "var(--accent)",
            }}
            title="Export (Admin)"
          >
            ⬇️ Export
          </button>
          {/* ✅ Export Modal */}
<Modal
  open={exportOpen}
  onClose={() => setExportOpen(false)}
  title="Export (Admin)"
  footer={exportFooter}
  maxWidth={720}
>
  <div style={{ display: "grid", gap: 12 }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {([
        { key: "MONTH", label: "Monat (CSV)" },
        { key: "YEAR", label: "Jahr (ZIP)" },
        { key: "RANGE", label: "Zeitraum (CSV)" },
      ] as Array<{ key: ExportMode; label: string }>).map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => setExportMode(m.key)}
          style={{
            borderRadius: 999,
            padding: "8px 12px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: exportMode === m.key ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.20)",
            color: "rgba(255,255,255,0.92)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          {m.label}
        </button>
      ))}
      {/* ✅ Ziel: Alle oder pro Mitarbeiter */}
<div style={{ display: "grid", gap: 8, marginTop: 6 }}>
  <div style={{ fontSize: 12, color: "var(--muted)" }}>Export-Ziel</div>

  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <button
      type="button"
      onClick={() => {
        setExportTarget("ALL");
        setExportEmployeeId("");
      }}
      style={{
        borderRadius: 999,
        padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: exportTarget === "ALL" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.20)",
        color: "rgba(255,255,255,0.92)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      Alle gesammelt
    </button>

    <button
      type="button"
      onClick={() => setExportTarget("EMPLOYEE")}
      style={{
        borderRadius: 999,
        padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: exportTarget === "EMPLOYEE" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.20)",
        color: "rgba(255,255,255,0.92)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      Pro Mitarbeiter
    </button>
  </div>
  </div>

  {exportTarget === "EMPLOYEE" ? (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>Mitarbeiter auswählen</div>
      <select
        value={exportEmployeeId}
        onChange={(e) => setExportEmployeeId(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.25)",
          color: "rgba(255,255,255,0.92)",
          outline: "none",
        }}
      >
        <option value="" style={{ color: "black" }}>
          — Bitte wählen —
        </option>
        {employeeOptions.map((u) => (
          <option key={u.id} value={u.id} style={{ color: "black" }}>
            {u.name}
          </option>
        ))}
      </select>

      {exportTargetError ? (
        <div style={{ fontSize: 12, color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>{exportTargetError}</div>
      ) : null}
    </div>
  ) : null}
</div>


    {exportMode === "MONTH" ? (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Monat auswählen</div>
        <input
          type="month"
          value={exportMonth}
          onChange={(e) => setExportMonth(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.25)",
            color: "rgba(255,255,255,0.92)",
          }}
        />
      </div>
    ) : null}

    {exportMode === "YEAR" ? (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Jahr auswählen</div>
        <select
          value={exportYear}
          onChange={(e) => setExportYear(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.25)",
            color: "rgba(255,255,255,0.92)",
          }}
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
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Zeitraum auswählen</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="date"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.25)",
              color: "rgba(255,255,255,0.92)",
            }}
          />
          <input
            type="date"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.25)",
              color: "rgba(255,255,255,0.92)",
            }}
          />
        </div>

        {rangeError ? (
          <div style={{ fontSize: 12, color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>{rangeError}</div>
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
            ? "Aktive Mitarbeiter"
            : kpiModalKind === "MISSING"
            ? "Fehlende Einträge heute"
            : kpiModalKind === "ABSENT"
            ? "Abwesenheiten heute"
            : ""
        }
        footer={
          <button
            type="button"
            onClick={closeKpiModal}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 900,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Schließen
          </button>
        }
        maxWidth={720}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {remindErr ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(224,75,69,0.28)",
                background: "rgba(224,75,69,0.10)",
                color: "rgba(224,75,69,0.95)",
                fontWeight: 900,
              }}
            >
              {remindErr}
            </div>
          ) : null}

          {remindSuccess ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(184,207,58,0.28)",
                background: "rgba(184,207,58,0.10)",
                color: "var(--accent)",
                fontWeight: 900,
              }}
            >
              {remindSuccess}
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
                      background: "rgba(255,255,255,0.03)",
                      fontWeight: 900,
                    }}
                  >
                    <div>{person.fullName}</div>
                    <div style={{ color: "var(--muted-2)", fontSize: 12 }}>aktiv</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>Keine aktiven Mitarbeiter vorhanden.</div>
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
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{person.fullName}</div>

                    <button
                      type="button"
                      onClick={() => sendMissingReminder(person.userId, person.fullName)}
                      disabled={remindLoadingUserId === person.userId}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(184,207,58,0.35)",
                        background: "rgba(184,207,58,0.12)",
                        color: "var(--accent)",
                        cursor: remindLoadingUserId === person.userId ? "not-allowed" : "pointer",
                        fontWeight: 1000,
                        opacity: remindLoadingUserId === person.userId ? 0.7 : 1,
                      }}
                    >
                      {remindLoadingUserId === person.userId ? "Sende…" : "Push senden"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>
                Heute fehlen aktuell keine Einträge.
              </div>
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
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{person.fullName}</div>
                    <div style={{ color: "var(--muted-2)", fontSize: 12, fontWeight: 900 }}>
                      {absenceTypeLabel(person.type)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>
                Heute sind keine Mitarbeiter abwesend.
              </div>
            )
          ) : null}
        </div>
      </Modal>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Arbeitszeit-Details"
        footer={
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 900,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Schließen
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Mitarbeiter</div>
            <div style={{ fontWeight: 1000 }}>{detailsUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Datum & Zeit</div>
            <div style={{ fontWeight: 1000 }}>
              {formatDateDE(detailsDate)} · {detailsTime}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Netto-Arbeitszeit</div>
            <div style={{ fontWeight: 1000 }}>{formatHM(detailsWorkMinutes)}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Baustelle / Adresse</div>
            <div style={{ fontWeight: 1000 }}>{detailsLocation || "—"}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Ausgeführte Tätigkeit</div>
            <div style={{ fontWeight: 1000 }}>{detailsActivity || "—"}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Fahrtzeit</div>
            <div style={{ fontWeight: 1000 }}>{formatMinutesCompact(detailsTravelMinutes)}</div>
          </div>
        </div>
      </Modal>

      <Modal
        open={breakInfoOpen}
        onClose={() => setBreakInfoOpen(false)}
        title="Pausen-Details"
        footer={
          <button
            type="button"
            onClick={() => setBreakInfoOpen(false)}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 900,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Schließen
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Mitarbeiter</div>
            <div style={{ fontWeight: 1000 }}>{breakInfoUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Datum</div>
            <div style={{ fontWeight: 1000 }}>{formatDateDE(breakInfoDate)}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Manuell eingetragene Pause</div>
            <div style={{ fontWeight: 1000 }}>
              {breakInfoManualStart && breakInfoManualEnd
                ? `${breakInfoManualStart}–${breakInfoManualEnd} · ${formatMinutesCompact(breakInfoManualMinutes)}`
                : breakInfoManualMinutes > 0
                ? formatMinutesCompact(breakInfoManualMinutes)
                : "Keine manuelle Pause eingetragen"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Gesetzlich erforderlich</div>
            <div style={{ fontWeight: 1000 }}>{formatMinutesCompact(breakInfoLegalMinutes)}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Automatisch ergänzt</div>
            <div style={{ fontWeight: 1000 }}>
              {breakInfoAutoMinutes > 0 ? formatMinutesCompact(breakInfoAutoMinutes) : "Keine automatische Ergänzung"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Wirksame Pause gesamt</div>
            <div style={{ fontWeight: 1000 }}>{formatMinutesCompact(breakInfoEffectiveMinutes)}</div>
          </div>
        </div>
      </Modal>

<Modal
  open={noteOpen}
  onClose={() => setNoteOpen(false)}
  title="Mitarbeiter-Notiz"
  footer={
    <button
      type="button"
      onClick={() => setNoteOpen(false)}
      style={{
        padding: "10px 14px",
        cursor: "pointer",
        fontWeight: 900,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.9)",
      }}
    >
      Schließen
    </button>
  }
  maxWidth={640}
>
  <div style={{ display: "grid", gap: 12 }}>
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>Mitarbeiter</div>
      <div style={{ fontWeight: 1000 }}>{noteUserLabel}</div>
    </div>

    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>Datum & Zeit</div>
      <div style={{ fontWeight: 1000 }}>
        {formatDateDE(noteDate)} · {noteTime}
      </div>
    </div>

    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>Notiz</div>
      <div
        style={{
          whiteSpace: "pre-wrap",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.22)",
          color: "rgba(255,255,255,0.92)",
          minHeight: 90,
        }}
      >
        {noteText.trim() ? noteText : "Keine Notiz vorhanden."}
      </div>
    </div>
  </div>
</Modal>

      <Modal
        open={editOpen}
        onClose={() => (editSaving ? null : setEditOpen(false))}
        title="Arbeitszeit bearbeiten (Admin)"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
              style={{
                padding: "10px 14px",
                cursor: editSaving ? "not-allowed" : "pointer",
                fontWeight: 900,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.9)",
                opacity: editSaving ? 0.7 : 1,
              }}
            >
              Abbrechen
            </button>

            <button
              type="button"
              onClick={saveEditWork}
              disabled={editSaving}
              style={{
                padding: "10px 14px",
                cursor: editSaving ? "not-allowed" : "pointer",
                fontWeight: 1000,
                borderRadius: 12,
                border: "1px solid rgba(184,207,58,0.35)",
                background: "rgba(184,207,58,0.12)",
                color: "var(--accent)",
                opacity: editSaving ? 0.7 : 1,
              }}
            >
              {editSaving ? "Speichere…" : "Speichern"}
            </button>
          </>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Mitarbeiter</div>
            <div style={{ fontWeight: 1000 }}>{editUserLabel}</div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Datum & Zeit (nicht änderbar)</div>
            <div style={{ fontWeight: 1000 }}>
              {formatDateDE(editDate)} · {editTime}
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Tätigkeit</div>
            <input
              value={editActivity}
              onChange={(e) => setEditActivity(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.25)",
                color: "rgba(255,255,255,0.92)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Ort</div>
            <input
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.25)",
                color: "rgba(255,255,255,0.92)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Fahrtzeit (Min)</div>
              <input
                inputMode="numeric"
                value={editTravelMinutes}
                onChange={(e) => setEditTravelMinutes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
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
        <div className="card" style={{ padding: 14, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
          <div style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>{err}</div>
        </div>
      ) : null}


      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        
        {/* Aktive Mitarbeiter */}
        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("ACTIVE")}
          style={{ cursor: "pointer" }}
          title="Liste aktiver Mitarbeiter öffnen"
        >
          <div>
            <div className="small flex items-center gap-1">
              Aktive Mitarbeiter
              <span className="opacity-0 group-hover:opacity-80 transition-opacity text-gray-400">
                <MousePointerClick size={14} />
              </span>
            </div>

            <div className="big">{dash?.cards.employeesActive ?? "—"}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>👥</div>
        </div>


        {/* Fehlende Einträge */}
        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("MISSING")}
          style={{ cursor: "pointer" }}
          title="Liste fehlender Einträge öffnen"
        >
          <div>
            <div className="small flex items-center gap-1">
              Fehlende Einträge (heute)
              <span className="opacity-0 group-hover:opacity-80 transition-opacity text-gray-400">
                <MousePointerClick size={14} />
              </span>
            </div>

            <div className="big">{dash?.cards.missingToday ?? "—"}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>⚠️</div>
        </div>


        {/* Abwesenheiten */}
        <div
          className="card kpi group hover:shadow-lg transition"
          onClick={() => openKpiModal("ABSENT")}
          style={{ cursor: "pointer" }}
          title="Liste heutiger Abwesenheiten öffnen"
        >
          <div>
            <div className="small flex items-center gap-1">
              Abwesenheiten (heute)
              <span className="opacity-0 group-hover:opacity-80 transition-opacity text-gray-400">
                <MousePointerClick size={14} />
              </span>
            </div>

            <div className="big">{dash?.cards.absencesToday ?? "—"}</div>
          </div>

          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌴</div>
        </div>
        
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Monat (gesamt)</div>

        <div className="admin-month-summary">
          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>Arbeitszeit gesamt:</span>
            <b>{overview ? formatHours1(overview.totals.workMinutes) : "—"}</b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>Urlaub:</span>
            <b>{overview ? overview.totals.vacationDays : "—"}</b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>Krank:</span>
            <b>{overview ? overview.totals.sickDays : "—"}</b>
          </div>

          <div className="admin-month-summary-item" style={{ color: "var(--muted)" }}>
            <span>Einträge:</span>
            <b>{overview ? overview.totals.entriesCount : "—"}</b>
          </div>
        </div>
      </div>

      {/* Nach Mitarbeiter */}
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Nach Mitarbeiter</div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Lade...</div>
        ) : !dash ? (
          <div style={{ color: "var(--muted)" }}>Keine Dashboarddaten verfügbar.</div>
        ) : dash.employeesTimeline.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Keine Mitarbeiter im Zeitraum.</div>
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
                    {/* Employee header */}
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
                      title="Ein-/Ausklappen"
                    >
                      <div>{open ? "▼ " : "▶ "} {u.fullName}</div>
                      <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(totalWorkMinutes)}</div>
                    </div>

                    {/* Employee body */}
                    {open ? (
                      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                        {(() => {
                          if (u.items.length === 0) {
                            return <div style={{ color: "var(--muted)" }}>Keine Einträge.</div>;
                          }

                          const workItems = u.items
                            .filter((i): i is AdminTimelineWork => i.type === "WORK")
                            .slice()
                            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

                          const rangesAll = groupAbsenceRanges(u.items);
                          const sickRanges = rangesAll.filter((r) => r.type === "SICK");
                          const vacationRanges = rangesAll.filter((r) => r.type === "VACATION");

                          const cat = openCats[u.userId] ?? defaultCatState;

                          const sectionHeader = (key: CatKey, label: string, countText: string) => (
                            <div
                              onClick={() => setOpenCats((prev) => toggleCat(prev, u.userId, key))}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                padding: "8px 10px",
                                borderRadius: 10,
                                background: "rgba(255,255,255,0.03)",
                                fontWeight: 1000,
                              }}
                              title="Ein-/Ausklappen"
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ opacity: 0.9 }}>{cat[key] ? "▼" : "▶"}</span>
                                <span>{label}</span>
                              </div>
                              <div style={{ color: "var(--muted-2)", fontWeight: 900, fontSize: 12 }}>{countText}</div>
                            </div>
                          );

                          return (
                            <div style={{ display: "grid", gap: 10 }}>
                              {/* ARBEIT */}
                              {sectionHeader("WORK", "🛠 Arbeitszeiten", `${workItems.length} Eintrag${workItems.length === 1 ? "" : "e"}`)}
                      {cat.WORK ? (
                        workItems.length > 0 ? (
                          <div style={{ display: "grid", gap: 10 }}>
                            {Object.entries(groupWorkItemsByDay(workItems)).map(([dayKey, dayItems]) => {
                              const dayToggleKey = `${u.userId}__${dayKey}`;
                              const dayOpen = openWorkDays.has(dayToggleKey);

                              const dayTotalMinutes = dayItems.reduce((sum, it) => sum + it.workMinutes, 0);
                              const dayEntriesCount = dayItems.length;
                              const dayBreak = getDayBreakForDate(u.dayBreaks, dayKey);
                              const dayPauseMinutes = dayBreak?.effectiveMinutes ?? 0;

                              return (
                                <div
                                  key={dayKey}
                                  style={{
                                    display: "grid",
                                    gap: 6,
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.02)",
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
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                      fontWeight: 1000,
                                    }}
                                    title="Tag ein-/ausklappen"
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      <span>{dayOpen ? "▼" : "▶"}</span>
                                      <span>{formatDateDE(dayKey)}</span>
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
                                        title="Pausen-Details anzeigen"
                                      >
                                        {formatMinutesCompact(dayPauseMinutes)} Pause
                                      </button>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                      <div style={{ color: "var(--muted-2)", fontSize: 12, fontWeight: 900 }}>
                                        {dayEntriesCount} Eintrag{dayEntriesCount === 1 ? "" : "e"}
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
                                            background: "rgba(255,255,255,0.02)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                          }}
                                        >
                                          <div style={{ display: "grid", gap: 2 }}>
                                            <div style={{ fontWeight: 1100, color: "var(--accent)" }}>
                                              {formatHM(it.workMinutes)}
                                            </div>

                                            <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                              {it.location && it.location.trim() ? it.location : "Keine Baustelle / Adresse hinterlegt"}
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
                                              title="Details anzeigen"
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
                                              ℹ️ Details
                                            </button>

                                            {it.noteEmployee && it.noteEmployee.trim() ? (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openEmployeeNote(u.fullName, it);
                                                }}
                                                title="Mitarbeiter-Notiz anzeigen"
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
                                                📝 Notiz
                                              </button>
                                            ) : null}

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditWork(u.fullName, it);
                                              }}
                                              title="Bearbeiten (ohne Zeit)"
                                              style={{
                                                padding: "6px 10px",
                                                borderRadius: 10,
                                                border: "1px solid rgba(255,255,255,0.14)",
                                                background: "rgba(255,255,255,0.06)",
                                                color: "rgba(255,255,255,0.9)",
                                                cursor: "pointer",
                                                fontWeight: 900,
                                              }}
                                            >
                                              ✏️
                                            </button>

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                deleteWorkEntry(it.id);
                                              }}
                                              title="Löschen"
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
                                              🗑️
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
                          <div style={{ color: "var(--muted)", paddingLeft: 6 }}>Keine Arbeitszeiten im Monat.</div>
                        )
                      ) : null}

                              {/* KRANK */}
                              {sectionHeader("SICK", "🌡 Krankheit", `${sickRanges.length} Zeitraum${sickRanges.length === 1 ? "" : "e"}`)}
                              {cat.SICK ? (
                                sickRanges.length > 0 ? (
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {sickRanges.map((r, idx) => {
                                      const from = formatDateDE(r.from);
                                      const to = formatDateDE(r.to);
                                      const text =
                                        r.dayPortion === "HALF_DAY"
                                          ? `${from} · ${formatDayCountDE(r.days)}`
                                          : r.from === r.to
                                          ? `${from} · ${formatDayCountDE(r.days)}`
                                          : `${from}–${to} · ${formatDayCountDE(r.days)}`;
                                      return (
                                        <div
                                          key={`s-${idx}`}
                                          style={{
                                            padding: "8px 10px",
                                            borderRadius: 10,
                                            fontWeight: 1100,
                                            background: "rgba(224,75,69,0.08)",
                                            border: "1px solid rgba(224,75,69,0.14)",
                                          }}
                                        >
                                          🌡 Krank · {text}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ color: "var(--muted)", paddingLeft: 6 }}>Keine Krankheitstage im Monat.</div>
                                )
                              ) : null}

                              {/* URLAUB */}
                              {sectionHeader("VACATION", "🌴 Urlaub", `${vacationRanges.length} Zeitraum${vacationRanges.length === 1 ? "" : "e"}`)}
                              {cat.VACATION ? (
                                vacationRanges.length > 0 ? (
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {vacationRanges.map((r, idx) => {
                                      const from = formatDateDE(r.from);
                                      const to = formatDateDE(r.to);
                                      const text =
                                        r.dayPortion === "HALF_DAY"
                                          ? `${from} · ${formatDayCountDE(r.days)}`
                                          : r.from === r.to
                                          ? `${from} · ${formatDayCountDE(r.days)}`
                                          : `${from}–${to} · ${formatDayCountDE(r.days)}`;
                                      return (
                                        <div
                                          key={`v-${idx}`}
                                          style={{
                                            padding: "8px 10px",
                                            borderRadius: 10,
                                            fontWeight: 1100,
                                            background: "rgba(90,167,255,0.08)",
                                            border: "1px solid rgba(90,167,255,0.14)",
                                          }}
                                        >
                                          🌴 Urlaub · {text}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ color: "var(--muted)", paddingLeft: 6 }}>Kein Urlaub im Monat.</div>
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
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
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