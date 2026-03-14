"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type MeResponse =
  | { ok: true; user: { id: string; fullName: string; role: "ADMIN" | "EMPLOYEE" } }
  | { ok: false };

type WorkEntry = {
  id: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string;
  user: { id: string; fullName: string };
};

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

  const isRequestRange = (value: unknown): value is {
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

  const pendingOk = pendingRequest === null || isRequestRange(pendingRequest);
  const latestOk = latestDecisionRequest === null || isRequestRange(latestDecisionRequest);

  return pendingOk && latestOk;
}

function toIsoDateLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDE(yyyyMmDd: string) {
  const parts = yyyyMmDd.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatHM(minutes: number) {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}min`;
}

/** Gruppierung Monat/Jahr */
function toYMD(dateStr: string) {
  return dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;
}
function monthKeyFromWorkDate(workDate: string) {
  return toYMD(workDate).slice(0, 7); // YYYY-MM
}
function monthLabelDE(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" })
    .format(d)
    .replace(/^./, (c) => c.toUpperCase());
}
function sortMonthKeysDesc(a: string, b: string) {
  return a === b ? 0 : a > b ? -1 : 1;
}
function sortEntriesDesc(a: WorkEntry, b: WorkEntry) {
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

function sortYMDDesc(a: string, b: string) {
  return a === b ? 0 : a > b ? -1 : 1;
}

function groupByMonthThenDay(entries: WorkEntry[]): MonthDayGroup[] {
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
      label: formatDateDE(dk),
      entries: (dayMap.get(dk) ?? []).slice().sort(sortEntriesDesc),
    }));

    return {
      key: mk,
      label: monthLabelDE(mk),
      days,
    };
  });
}

function formatPause(minutes: number): string {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  if (m < 60) return `${m} Min`;
  return formatHM(m);
}

function formatDateDayLineDE(yyyyMmDd: string) {
  const parts = yyyyMmDd.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const dt = new Date(y, (m || 1) - 1, d || 1);

  const weekday = dt.toLocaleDateString("de-DE", { weekday: "short" }).replace(",", "");
  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = String(y);

  return `${weekday} ${day}.${month}.${year}`;
}

function formatMinutesCompact(minutes: number) {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} Min`;
  return formatHM(mins);
}

function hasCompleteTimeRange(startHHMM: string, endHHMM: string): boolean {
  return /^\d{2}:\d{2}$/.test(startHHMM) && /^\d{2}:\d{2}$/.test(endHHMM);
}

function getLegalBreakHintLines(): string[] {
  return [
    "Gesetzliche Pausen:",
    "ab mehr als 6h: 30 Min",
    "ab mehr als 9h: 45 Min",
  ];
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
  activity: string;
  location: string;
  travelMinutes: string;
  noteEmployee: string;
  userFullName: string;
};

function minutesBetween(startHHMM: string, endHHMM: string) {
  const [sh, sm] = startHHMM.split(":").map((x) => Number(x));
  const [eh, em] = endHHMM.split(":").map((x) => Number(x));
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return Math.max(0, end - start);
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

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;
  const userId = v.userId;
  const fullName = v.fullName;
  const role = v.role;
  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN")
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

function formatCorrectionRange(startDate: string, endDate: string): string {
  return startDate === endDate ? startDate : `${startDate} bis ${endDate}`;
}

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<MeResponse | null>(null);

  // Create-Form (ohne fullName)
  const [workDate, setWorkDate] = useState<string>(() => toIsoDateLocal(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [travelMinutes, setTravelMinutes] = useState<string>("0");
  const [noteEmployee, setNoteEmployee] = useState("");
  const [prefillApplied, setPrefillApplied] = useState(false);

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
  const [edit, setEdit] = useState<EditForm | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteEntry, setNoteEntry] = useState<WorkEntry | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEntry, setDetailsEntry] = useState<WorkEntry | null>(null);

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
  const [loadingSelectedCorrectionStatus, setLoadingSelectedCorrectionStatus] = useState(false);

  const grossPreviewMinutes = useMemo(() => minutesBetween(startTime, endTime), [startTime, endTime]);
  const isEntryPreviewActive = useMemo(() => {
    return hasMeaningfulEntryInput({
      startTime,
      endTime,
    });
  }, [startTime, endTime]);

  const hasSavedEntriesForSelectedDay = useMemo(() => {
    return entries.some((entry) => toYMD(entry.workDate) === workDate);
  }, [entries, workDate]);

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
    if (prefillApplied) return;

    const syncDate = searchParams.get("syncDate");
    const syncActivity = searchParams.get("syncActivity");
    const syncLocation = searchParams.get("syncLocation");

    const hasSyncValues =
      (typeof syncDate === "string" && syncDate.trim() !== "") ||
      (typeof syncActivity === "string" && syncActivity.trim() !== "") ||
      (typeof syncLocation === "string" && syncLocation.trim() !== "");

    if (!hasSyncValues) {
      setPrefillApplied(true);
      return;
    }

    if (typeof syncDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(syncDate)) {
      setWorkDate(syncDate);
    }

    if (typeof syncActivity === "string" && syncActivity.trim() !== "") {
      setActivity(syncActivity);
    }

    if (typeof syncLocation === "string" && syncLocation.trim() !== "") {
      setLocation(syncLocation);
    }

    setStartTime("");
    setEndTime("");
    setPrefillApplied(true);
  }, [prefillApplied, searchParams]);

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

      setMe({
        ok: true,
        user: {
          id: j.session.userId,
          fullName: j.session.fullName,
          role: j.session.role,
        },
      });
    } catch {
      if (!alive) return;
      router.replace("/login");
    }
  })();

  return () => {
    alive = false;
  };
}, [router]);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const r = await fetch("/api/entries");
      const j = (await r.json()) as unknown;

      const entriesList =
        typeof j === "object" &&
        j !== null &&
        "entries" in j &&
        Array.isArray((j as { entries: unknown }).entries)
          ? (((j as { entries: WorkEntry[] }).entries ?? []) as WorkEntry[])
          : [];

      const dayBreakList =
        typeof j === "object" &&
        j !== null &&
        "dayBreaks" in j &&
        Array.isArray((j as { dayBreaks: unknown }).dayBreaks)
          ? (((j as { dayBreaks: DayBreak[] }).dayBreaks ?? []) as DayBreak[])
          : [];

      setEntries(entriesList);
      setDayBreaks(dayBreakList);
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
  async function loadSelectedCorrectionStatus(dateYMD: string) {
    if (!isPastWorkDate(dateYMD)) {
      setSelectedCorrectionStatus(null);
      return;
    }

    setLoadingSelectedCorrectionStatus(true);
    try {
      const r = await fetch(
        `/api/time-entry-correction-requests/status?workDate=${encodeURIComponent(dateYMD)}`,
        {
          method: "GET",
          cache: "no-store",
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
  }

  useEffect(() => {
    loadEntries();
    loadCorrectionRequests();
  }, []);
  useEffect(() => {
    void loadSelectedCorrectionStatus(workDate);
  }, [workDate]);

    useEffect(() => {
    setBreakStartHHMM(selectedDayBreak?.breakStartHHMM ?? "");
    setBreakEndHHMM(selectedDayBreak?.breakEndHHMM ?? "");
    setBreakError(null);
  }, [selectedDayBreak, workDate]);

  async function saveEntry() {
    setError(null);

    if (!activity.trim()) return setError("Bitte Tätigkeit eingeben.");

    // ✅ Falls nicht eingeloggt/Session fehlt
    if (!me || !me.ok) return setError("Bitte neu einloggen.");

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
      };

      const r = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : "Speichern fehlgeschlagen.";
        setError(msg);
        return;
      }

      setStartTime("");
      setEndTime("");
      setActivity("");
      setLocation("");
      setTravelMinutes("0");
      setNoteEmployee("");

      await loadEntries();
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setError("Netzwerkfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/entries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadEntries();
  }

  function openEditModal(e: WorkEntry) {
    setEditError(null);
    setEdit({
      id: e.id,
      userFullName: e.user?.fullName ?? "Unbekannt",
      workDate: toYMD(e.workDate),
      startTime: e.startTime,
      endTime: e.endTime,
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

  async function saveEdit() {
    if (!edit) return;

    setEditError(null);
    if (!edit.activity.trim()) return setEditError("Bitte Tätigkeit eingeben.");
    if (!edit.workDate || !edit.startTime || !edit.endTime) return setEditError("Datum/Zeit fehlt.");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : "Bearbeiten fehlgeschlagen.";
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
      setEditError("Netzwerkfehler beim Speichern.");
    } finally {
      setEditSaving(false);
    }
  }

    async function saveDayBreak() {
    setBreakError(null);

    if ((breakStartHHMM && !breakEndHHMM) || (!breakStartHHMM && breakEndHHMM)) {
      setBreakError("Bitte Pause von und bis vollständig eingeben.");
      return;
    }

    setBreakSaving(true);
    try {
      const r = await fetch("/api/day-breaks", {
        method: "POST",
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
            : "Pause speichern fehlgeschlagen.";
        setBreakError(msg);
        return;
      }
      await loadEntries();
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setBreakError("Netzwerkfehler beim Speichern der Pause.");
    } finally {
      setBreakSaving(false);
    }
  }
  async function submitCorrectionRequest() {
    setCorrectionError(null);
    setCorrectionSuccess(null);

    if (!canCreateCorrectionRequest) {
      setCorrectionError("Ein Nachtragsantrag ist nur für vergangene Tage möglich.");
      return;
    }

    if (hasActiveUnlockForSelectedDate) {
      setCorrectionError("Für diesen Tag existiert bereits eine aktive Freigabe.");
      return;
    }

    if (pendingCorrectionRequestForSelectedDate) {
      setCorrectionError("Für diesen Tag existiert bereits ein offener Nachtragsantrag.");
      return;
    }

    setCorrectionSaving(true);
    try {
      const r = await fetch("/api/time-entry-correction-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: workDate,
          noteEmployee: correctionNote.trim(),
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
            : "Nachtragsantrag konnte nicht erstellt werden.";
        setCorrectionError(msg);
        return;
      }

      setCorrectionSuccess("Nachtragsantrag wurde erfolgreich gesendet.");
      setCorrectionNote("");
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setCorrectionError("Netzwerkfehler beim Senden des Nachtragsantrags.");
    } finally {
      setCorrectionSaving(false);
    }
  }

  const groupedEntries = useMemo(() => groupByMonthThenDay(entries), [entries]);

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
        detailLines: getLegalBreakHintLines(),
      };
    }

    const selectedBreak = dayBreakMap.get(workDate) ?? null;
    const dayTotals = computeDayTotals(entries, dayBreakMap, workDate, 0, null);

    if (dayTotals.legalBreak === 0) {
      return {
        rightValue: "",
        detailLines: getLegalBreakHintLines(),
      };
    }

    if (!selectedBreak || selectedBreak.manualMinutes <= 0) {
      return {
        rightValue: formatPause(dayTotals.legalBreak),
        detailLines: [
          `Gesetzliche Pause automatisch eingetragen: ${formatPause(dayTotals.legalBreak)}`,
          `Brutto ${formatHM(dayTotals.grossDay)} · Netto ${formatHM(dayTotals.netDay)}`,
        ],
      };
    }

    if (selectedBreak.manualMinutes < dayTotals.legalBreak) {
      return {
        rightValue: formatPause(dayTotals.effectiveBreak),
        detailLines: [
          `Eingetragen: ${formatPause(selectedBreak.manualMinutes)}`,
          `Auto-Zusatz: ${formatPause(dayTotals.autoSupplement)}`,
          `Gesetzlich notwendig: ${formatPause(dayTotals.legalBreak)}`,
        ],
      };
    }

    return {
      rightValue: formatPause(dayTotals.effectiveBreak),
      detailLines: [
        `Eingetragen: ${formatPause(selectedBreak.manualMinutes)}`,
        `Gesetzlich notwendig: ${formatPause(dayTotals.legalBreak)}`,
        `Brutto ${formatHM(dayTotals.grossDay)} · Netto ${formatHM(dayTotals.netDay)}`,
      ],
    };
  }, [shouldShowBreakComputation, dayBreakMap, workDate, entries]);

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

  const meName = me && me.ok ? me.user.fullName : "";

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

  const lockedMissingWorkdaysCount =
    selectedCorrectionStatus?.lockedMissingWorkdaysCount ?? 0;

  const graceWorkdaysLimit =
    selectedCorrectionStatus?.graceWorkdaysLimit ?? 5;

  const latestDecisionRequestForSelectedDate =
    selectedCorrectionStatus?.latestDecisionRequest ?? null;

  const shouldShowCorrectionRequestButton = useMemo(() => {
    if (!canCreateCorrectionRequest) return false;
    if (!requiresCorrectionRequestForSelectedDate) return false;
    if (hasActiveUnlockForSelectedDate) return false;
    if (pendingCorrectionRequestForSelectedDate) return false;
    return true;
  }, [
    canCreateCorrectionRequest,
    requiresCorrectionRequestForSelectedDate,
    hasActiveUnlockForSelectedDate,
    pendingCorrectionRequestForSelectedDate,
  ]);
  const correctionProgressText = useMemo(() => {
    if (!canCreateCorrectionRequest) return null;
    if (hasActiveUnlockForSelectedDate) return null;
    if (pendingCorrectionRequestForSelectedDate) return null;

    if (requiresCorrectionRequestForSelectedDate) {
      return `Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage. Ein Nachtragsantrag ist erforderlich.`;
    }

    return `Ab dem ${graceWorkdaysLimit + 1}. fehlenden Arbeitstag muss ein Nachtragsantrag gestellt werden. Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage bis zur Sperrung.`;
  }, [
    canCreateCorrectionRequest,
    hasActiveUnlockForSelectedDate,
    pendingCorrectionRequestForSelectedDate,
    requiresCorrectionRequestForSelectedDate,
    currentMissingWorkdaysCount,
    graceWorkdaysLimit,
  ]);

  return (
    <AppShell activeLabel="#wirkönnendas">

      {/* CREATE */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>＋</span> Stunden erfassen
        </div>

        {error && (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        )}

        {/* ✅ Name nur anzeigen (automatisch aus Session), kein Input mehr */}
        <div style={{ marginBottom: 12 }}>
          <div className="label">Mitarbeiter</div>
          <div
            className="input"
            style={{
              display: "flex",
              alignItems: "center",
              opacity: meName ? 1 : 0.7,
            }}
          >
            {meName || "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Der Eintrag wird automatisch deinem Konto zugeordnet.
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Datum</div>

            <input
              className="input erfassung-date-desktop"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />

            <div className="date-display-input erfassung-date-mobile">
              <div className="date-display-value">{formatDateDE(workDate)}</div>
              <input
                className="date-display-native-input"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                aria-label="Datum auswählen"
              />
            </div>
          </div>
          <div />
        </div>

        {canCreateCorrectionRequest ? (
          <div
            className="card"
            style={{
              padding: 12,
              marginBottom: 12,
              borderColor: hasActiveUnlockForSelectedDate
                ? "rgba(184, 207, 58, 0.30)"
                : pendingCorrectionRequestForSelectedDate
                ? "rgba(90, 167, 255, 0.28)"
                : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                ? "rgba(224, 75, 69, 0.30)"
                : "rgba(255, 196, 0, 0.30)",
              background: hasActiveUnlockForSelectedDate
                ? "rgba(184, 207, 58, 0.08)"
                : pendingCorrectionRequestForSelectedDate
                ? "rgba(90, 167, 255, 0.08)"
                : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                ? "rgba(224, 75, 69, 0.08)"
                : "rgba(255, 196, 0, 0.08)",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  fontWeight: 800,
                  color: hasActiveUnlockForSelectedDate
                    ? "var(--accent)"
                    : pendingCorrectionRequestForSelectedDate
                    ? "rgba(90, 167, 255, 0.95)"
                    : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                    ? "rgba(224, 75, 69, 0.95)"
                    : "rgba(255, 214, 102, 0.95)",
                }}
              >
                Vergangener Tag ausgewählt
              </div>

              {loadingSelectedCorrectionStatus ? (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  Status für den ausgewählten Tag wird geladen...
                </div>
              ) : hasActiveUnlockForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Dieser Tag wurde vom Admin für den Nachtrag freigegeben. Du kannst ihn jetzt bearbeiten.
                  </div>

                  {latestDecisionRequestForSelectedDate?.status === "APPROVED" ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Genehmigter Zeitraum:{" "}
                      {formatCorrectionRange(
                        latestDecisionRequestForSelectedDate.startDate,
                        latestDecisionRequestForSelectedDate.endDate
                      )}
                    </div>
                  ) : null}
                </>
              ) : pendingCorrectionRequestForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Für diesen Tag existiert bereits ein offener Nachtragsantrag.
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Offener Zeitraum:{" "}
                    {formatCorrectionRange(
                      pendingCorrectionRequestForSelectedDate.startDate,
                      pendingCorrectionRequestForSelectedDate.endDate
                    )}
                  </div>
                </>
              ) : latestDecisionRequestForSelectedDate?.status === "REJECTED" ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Der letzte Nachtragsantrag für diesen Zeitraum wurde abgelehnt.
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Letzte Entscheidung für:{" "}
                    {formatCorrectionRange(
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
                        Neuen Nachtragsantrag senden
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {requiresCorrectionRequestForSelectedDate
                      ? "Für den ausgewählten Tag ist jetzt ein Nachtragsantrag erforderlich."
                      : "Für den ausgewählten Tag ist aktuell noch kein Nachtragsantrag erforderlich."}
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
                        Nachtragsantrag senden
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="row erfassung-time-row" style={{ marginBottom: 12 }}>
          <div className="erfassung-time-field">
            <div className="label">Beginn</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="erfassung-time-field">
            <div className="label">Ende</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: "rgba(184, 207, 58, 0.20)" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ color: "var(--muted)" }}>Arbeitszeit (Tag berechnet)</div>
              <div style={{ fontWeight: 900, color: "var(--accent)" }}>
                {dayPreview ? formatHM(dayPreview.netDay) : ""}
              </div>
            </div>

            {!dayPreview ? (
              <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
                {getLegalBreakHintLines().map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : dayPreview.legalBreak > 0 ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Brutto {formatHM(dayPreview.grossDay)} · Gesetzliche Pause {formatPause(dayPreview.legalBreak)} · Netto {formatHM(dayPreview.netDay)}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
                <div>Brutto {formatHM(dayPreview.grossDay)} · Netto {formatHM(dayPreview.netDay)}</div>
                {getLegalBreakHintLines().map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">Ausgeführte Tätigkeit</div>
          <textarea
            className="textarea"
            placeholder="z.B. Fliesen verlegen, Verfugen..."
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">Einsatzort</div>
          <input
            className="input"
            placeholder="z.B. Musterstraße 5, München"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">Notiz für Admin</div>
          <textarea
            className="textarea"
            placeholder="Optional: Hinweise zum Einsatz, Material, Besonderheiten..."
            value={noteEmployee}
            onChange={(e) => setNoteEmployee(e.target.value)}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Diese Notiz ist optional und wird dem Admin beim Eintrag angezeigt.
          </div>
        </div>

        <div className="label" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Fahrzeit (Min.)</div>
            <input
              className="input"
              inputMode="numeric"
              value={travelMinutes}
              onChange={(e) => setTravelMinutes(e.target.value)}
            />
          </div>
        </div>


        <div className="erfassung-actions">
          <button
            className="btn erfassung-action-btn"
            type="button"
            onClick={() => {
              const syncDate = searchParams.get("syncDate");
              setWorkDate(
                typeof syncDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(syncDate)
                  ? syncDate
                  : toIsoDateLocal(new Date())
              );
              setStartTime("");
              setEndTime("");
              setActivity("");
              setLocation("");
              setTravelMinutes("0");
              setNoteEmployee("");
              setError(null);
            }}
          >
            Abbrechen
          </button>
          <button
            className="btn btn-accent erfassung-action-btn"
            type="button"
            onClick={saveEntry}
            disabled={saving}
          >
            {saving ? "Speichert..." : "Eintrag speichern"}
          </button>
        </div>
      </div>

            <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>⏸</span> Pause erfassen
        </div>

        {breakError ? (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{breakError}</span>
          </div>
        ) : null}

        <div style={{ marginBottom: 12 }}>
          <div className="label">Datum</div>
          <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
            {formatDateDE(workDate)}
          </div>
        </div>

        <div className="row erfassung-time-row" style={{ marginBottom: 12 }}>
          <div className="erfassung-time-field">
            <div className="label">Pause von</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={breakStartHHMM}
              onChange={(e) => setBreakStartHHMM(e.target.value)}
            />
          </div>
          <div className="erfassung-time-field">
            <div className="label">Pause bis</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={breakEndHHMM}
              onChange={(e) => setBreakEndHHMM(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: "rgba(184, 207, 58, 0.20)" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ color: "var(--muted)" }}>Pausenberechnung</div>
              <div style={{ fontWeight: 900, color: "var(--accent)" }}>
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
          Die gesetzliche Pause richtet sich nach der gesamten Arbeitszeit des Tages. Falls du zu wenig Pause einträgst, ergänzt die App die fehlende Differenz automatisch.
        </div>

        <div className="erfassung-actions">
          <button
            className="btn erfassung-action-btn"
            type="button"
            onClick={() => {
              setBreakStartHHMM("");
              setBreakEndHHMM("");
              setBreakError(null);
            }}
          >
            Zurücksetzen
          </button>
          <button
            className="btn btn-accent erfassung-action-btn"
            type="button"
            onClick={saveDayBreak}
            disabled={breakSaving}
          >
            {breakSaving ? "Speichert..." : "Pause speichern"}
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
            Alle Einträge
          </div>

          <div style={{ minWidth: 160 }}>
            <div className="label">Jahr</div>
            <select
              className="input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALLE">Alle Jahre</option>
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
              Lade Einträge...
            </div>
          ) : null}

          {!loadingEntries && filteredGroupedEntries.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 14,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              Keine Einträge für das ausgewählte Jahr vorhanden.
            </div>
          ) : null}
          {filteredGroupedEntries.map((m) => (
            <details
              key={m.key}
              open={m.key === currentMonthKey}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.20)",
                overflow: "hidden",
              }}
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

                <div style={{ opacity: 0.7, fontSize: 12 }}>Ein-/Ausklappen</div>
              </summary>

              <div style={{ padding: "0 0 12px 0", display: "grid", gap: 10 }}>
                {m.days.map((d) => {
                  const totals = dayTotalsMap.get(d.date);
                  const pauseMin = totals ? totals.effectiveBreak : 0;
                  const netDay = totals ? totals.netDay : 0;

                  return (
                    <details
                      key={`${m.key}-${d.date}`}
                      style={{
                        margin: "0 12px",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.16)",
                        overflow: "hidden",
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
                            {formatDateDayLineDE(d.date)}
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
                              {d.entries.length} {d.entries.length === 1 ? "Eintrag" : "Einträge"}
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
                              title="Pausen-Details anzeigen"
                            >
                              {formatPause(pauseMin)} Pause
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
                              style={{
                                margin: "0 12px",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                                padding: "10px 12px",
                                borderRadius: 12,
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                                <div style={{ fontWeight: 1100, color: "var(--accent)" }}>
                                  {formatHM(e.workMinutes ?? 0)}
                                </div>

                                <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}>
                                  {e.startTime}–{e.endTime} Uhr
                                </div>

                                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                  {e.activity?.trim() ? e.activity : "Keine Tätigkeit hinterlegt"}
                                </div>

                                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                  {e.location?.trim() ? e.location : "Keine Baustelle / Adresse hinterlegt"}
                                </div>

                                {hasTravel ? (
                                  <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                    Fahrtzeit: {formatMinutesCompact(e.travelMinutes)}
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

                                {e.noteEmployee.trim() ? (
                                  <button
                                    type="button"
                                    onClick={() => openNoteModal(e)}
                                    title="Notiz anzeigen"
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
                                  onClick={() => openEditModal(e)}
                                  title="Bearbeiten"
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
                                  onClick={() => deleteEntry(e.id)}
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
        title="Arbeitszeit-Details"
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
              Schließen
            </button>
          </div>
        }
      >
        {!detailsEntry ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">Datum & Zeit</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatDateDE(toYMD(detailsEntry.workDate))} · {detailsEntry.startTime}–{detailsEntry.endTime}
              </div>
            </div>

            <div>
              <div className="label">Netto-Arbeitszeit</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatHM(detailsEntry.workMinutes ?? 0)}
              </div>
            </div>

            <div>
              <div className="label">Baustelle / Adresse</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {detailsEntry.location?.trim() ? detailsEntry.location : "—"}
              </div>
            </div>

            <div>
              <div className="label">Ausgeführte Tätigkeit</div>
              <div
                className="input"
                style={{
                  minHeight: 90,
                  display: "block",
                  whiteSpace: "pre-wrap",
                  paddingTop: 12,
                  lineHeight: 1.45,
                }}
              >
                {detailsEntry.activity?.trim() ? detailsEntry.activity : "—"}
              </div>
            </div>

            <div>
              <div className="label">Fahrtzeit</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatMinutesCompact(detailsEntry.travelMinutes ?? 0)}
              </div>
            </div>
          </div>
        )}
      </Modal>

            <Modal
        open={breakInfoOpen}
        title="Pausen-Details"
        onClose={() => setBreakInfoOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => setBreakInfoOpen(false)}
            >
              Schließen
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="label">Datum</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatDateDE(breakInfoDate)}
            </div>
          </div>

          <div>
            <div className="label">Manuell eingetragene Pause</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {breakInfoManualStart && breakInfoManualEnd
                ? `${breakInfoManualStart}–${breakInfoManualEnd} · ${formatMinutesCompact(breakInfoManualMinutes)}`
                : breakInfoManualMinutes > 0
                ? formatMinutesCompact(breakInfoManualMinutes)
                : "Keine manuelle Pause eingetragen"}
            </div>
          </div>

          <div>
            <div className="label">Gesetzlich erforderlich</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatMinutesCompact(breakInfoLegalMinutes)}
            </div>
          </div>

          <div>
            <div className="label">Automatisch ergänzt</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {breakInfoAutoMinutes > 0 ? formatMinutesCompact(breakInfoAutoMinutes) : "Keine automatische Ergänzung"}
            </div>
          </div>

          <div>
            <div className="label">Wirksame Pause gesamt</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatMinutesCompact(breakInfoEffectiveMinutes)}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        title="Notiz für Admin"
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
              Schließen
            </button>
          </div>
        }
      >
        {!noteEntry ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">Datum</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatDateDE(toYMD(noteEntry.workDate))} · {noteEntry.startTime}–{noteEntry.endTime}
              </div>
            </div>

            <div>
              <div className="label">Notiz</div>
              <div
                className="input"
                style={{
                  minHeight: 110,
                  display: "block",
                  whiteSpace: "pre-wrap",
                  paddingTop: 12,
                  lineHeight: 1.45,
                }}
              >
                {noteEntry.noteEmployee.trim() || "Keine Notiz vorhanden."}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={correctionOpen}
        title="Nachtragsantrag senden"
        onClose={() => {
          setCorrectionOpen(false);
          setCorrectionError(null);
          setCorrectionSuccess(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setCorrectionOpen(false);
                setCorrectionError(null);
                setCorrectionSuccess(null);
              }}
            >
              Schließen
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={submitCorrectionRequest}
              disabled={correctionSaving}
            >
              {correctionSaving ? "Sendet..." : "Antrag senden"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {correctionError ? (
            <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}>
              <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>
                {correctionError}
              </span>
            </div>
          ) : null}

          {correctionSuccess ? (
            <div className="card" style={{ padding: 12, borderColor: "rgba(184, 207, 58, 0.28)" }}>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                {correctionSuccess}
              </span>
            </div>
          ) : null}

          <div>
            <div className="label">Ausgewähltes Datum</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatDateDE(workDate)}
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Der Server ermittelt automatisch den ältesten fehlenden Arbeitstag bis zu diesem Datum und erstellt daraus den passenden Nachtragszeitraum.
          </div>

          <div>
            <div className="label">Notiz für Admin</div>
            <textarea
              className="textarea"
              placeholder="Optional: kurze Begründung oder Hinweis"
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
            />
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {loadingSelectedCorrectionStatus || loadingCorrectionRequests
              ? "Bestehende Nachtragsinformationen werden geladen..."
              : hasActiveUnlockForSelectedDate
              ? "Für den ausgewählten Tag existiert bereits eine aktive Freigabe. Ein neuer Antrag ist aktuell nicht nötig."
              : pendingCorrectionRequestForSelectedDate
              ? `Hinweis: Für ${formatCorrectionRange(
                  pendingCorrectionRequestForSelectedDate.startDate,
                  pendingCorrectionRequestForSelectedDate.endDate
                )} existiert bereits ein offener Antrag.`
              : requiresCorrectionRequestForSelectedDate
              ? `Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage. Ein Nachtragsantrag ist erforderlich.`
              : `Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage bis zur Sperrung.`}
          </div>
        </div>
      </Modal>

      {/* ✅ EDIT MODAL */}
      <Modal
        open={editOpen}
        title="Eintrag bearbeiten"
        onClose={() => {
          setEditOpen(false);
          setEdit(null);
          setEditError(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEdit(null);
                setEditError(null);
              }}
            >
              Abbrechen
            </button>
            <button className="btn btn-accent" type="button" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </div>
        }
      >
        {!edit ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            {editError ? (
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}>
                <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{editError}</span>
              </div>
            ) : null}

            <div>
              <div className="label">Mitarbeiter</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {edit.userFullName}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Zuordnung wird serverseitig automatisch verwaltet.
              </div>
            </div>

            <div className="row">
              <div>
                <div className="label">Datum</div>
                <input
                  className="input"
                  type="date"
                  value={edit.workDate}
                  onChange={(e) => setEdit((p) => (p ? { ...p, workDate: e.target.value } : p))}
                />
              </div>
              <div />
            </div>

            <div className="row">
              <div>
                <div className="label">Beginn</div>
                <input
                  className="input"
                  type="time"
                  value={edit.startTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, startTime: e.target.value } : p))}
                />
              </div>
              <div>
                <div className="label">Ende</div>
                <input
                  className="input"
                  type="time"
                  value={edit.endTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, endTime: e.target.value } : p))}
                />
              </div>
            </div>

            <div className="card" style={{ padding: 12, borderColor: "rgba(184, 207, 58, 0.20)" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ color: "var(--muted)" }}>Arbeitszeit (Tag berechnet)</div>
                  <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(editPreview.netDay)}</div>
                </div>
                <div style={{ marginTop: 2, fontSize: 12, color: "var(--muted)" }}>
                  Tag: Brutto {formatHM(editPreview.grossDay)} · Wirksame Pause {formatPause(editPreview.effectiveBreak)} · Netto {formatHM(editPreview.netDay)}
                </div>
              </div>
            </div>

            <div>
              <div className="label">Ausgeführte Tätigkeit</div>
              <textarea
                className="textarea"
                value={edit.activity}
                onChange={(e) => setEdit((p) => (p ? { ...p, activity: e.target.value } : p))}
              />
            </div>

            <div>
              <div className="label">Einsatzort</div>
              <input
                className="input"
                value={edit.location}
                onChange={(e) => setEdit((p) => (p ? { ...p, location: e.target.value } : p))}
              />
            </div>

            <div>
              <div className="label">Notiz für Admin</div>
              <textarea
                className="textarea"
                value={edit.noteEmployee}
                onChange={(e) => setEdit((p) => (p ? { ...p, noteEmployee: e.target.value } : p))}
                placeholder="Optional: Hinweise zum Eintrag"
              />
            </div>

            <div className="row">
              <div>
                <div className="label">Fahrzeit (Min.)</div>
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
    </AppShell>
  );
}