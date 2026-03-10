// src/app/uebersicht/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type WorkEntry = {
  id: string;
  workDate: string; // YYYY-MM-DD
  workMinutes: number;
  user?: { id: string; fullName: string };
};

type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";

type AbsenceCompensation = "PAID" | "UNPAID";

type Absence = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
  user: { id: string; fullName: string };
};

type AbsenceDayGroup = {
  date: string; // YYYY-MM-DD
  items: Absence[];
};

type AbsenceUserSummary = {
  user: { id: string; fullName: string };
  sickDays: number;
  vacationDays: number;
  unpaidVacationDays: number;
  totalDays: number;
};

type AbsencesApiResponse = {
  absences?: Absence[];
  groupsByDay?: AbsenceDayGroup[];
  summaryByUser?: AbsenceUserSummary[];
  range?: { from: string; to: string };
};

type OverviewUserSummary = {
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
  usedVacationDaysYtd: number;
  remainingVacationDays: number;
  baseTargetMinutes: number;
  targetMinutes: number;
  netTargetMinutes: number;
  holidayCountInMonth: number;
  holidayMinutes: number;
};

type OverviewTotals = {
  entriesCount: number;
  workMinutes: number;
  travelMinutes: number;
  vacationDays: number;
  sickDays: number;
  vacationMinutes: number;
  sickMinutes: number;
  unpaidAbsenceDays: number;
  unpaidAbsenceMinutes: number;
  usedVacationDaysYtd: number;
  remainingVacationDays: number;
  baseTargetMinutes: number;
  targetMinutes: number;
  netTargetMinutes: number;
  holidayMinutes: number;
};

type OverviewResponse = {
  month?: string;
  annualVacationDays?: number;
  dailyTargetMinutes?: number;
  workingDaysInMonth?: number;
  byUser?: OverviewUserSummary[];
  totals?: OverviewTotals;
  isAdmin?: boolean;
};

function isOverviewResponse(x: unknown): x is OverviewResponse {
  return typeof x === "object" && x !== null;
}

function isAbsencesApiResponse(x: unknown): x is AbsencesApiResponse {
  return typeof x === "object" && x !== null;
}

function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function toHours(min: number) {
  return min / 60;
}


function lastDayOfMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0);
  return String(last.getDate()).padStart(2, "0");
}

function currentYear(): string {
  return String(new Date().getFullYear());
}
function currentMonth(): MonthOption {
  return String(new Date().getMonth() + 1).padStart(2, "0") as MonthOption;
}

function buildYm(year: string, month: string) {
  return `${year}-${month}`;
}

const MONTH_OPTIONS: Array<{ value: MonthOption; label: string }> = [
  { value: "01", label: "Januar" },
  { value: "02", label: "Februar" },
  { value: "03", label: "März" },
  { value: "04", label: "April" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Dezember" },
];

type ExportMode = "MONTH" | "YEAR" | "RANGE";

function formatDateDE(yyyyMmDd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd;
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}.${m}.${y}`;
}

function typeLabel(t: "VACATION" | "SICK", compensation?: AbsenceCompensation) {
  if (t === "SICK") return "Krank";
  return compensation === "UNPAID" ? "Urlaub (unbezahlt)" : "Urlaub";
}

function typeColor(t: "VACATION" | "SICK") {
  return t === "SICK" ? "rgba(224, 75, 69, 0.95)" : "rgba(90, 167, 255, 0.95)";
}

function badgeStyle(t: "VACATION" | "SICK"): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${t === "SICK" ? "rgba(224, 75, 69, 0.35)" : "rgba(90, 167, 255, 0.35)"}`,
    background: t === "SICK" ? "rgba(224, 75, 69, 0.10)" : "rgba(90, 167, 255, 0.10)",
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "nowrap",
  };
}

function chipStyle(bg: string, border: string): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${border}`,
    background: bg,
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "nowrap",
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
  };
}

type AbsFilterType = "ALL" | "SICK" | "VACATION";
type MonthOption =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12";


function toUTCDateFromISO(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

type AbsenceBlock = {
  user: { id: string; fullName: string };
  type: "VACATION" | "SICK";
  compensation: AbsenceCompensation;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  days: number;
  dayPortion: AbsenceDayPortion;
};

function daysInclusive(from: string, to: string) {
  const a = toUTCDateFromISO(from);
  const b = toUTCDateFromISO(to);
  const diff = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function absenceDayValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === "HALF_DAY" ? 0.5 : 1;
}

function formatDayCountDE(days: number): string {
  if (days === 0.5) return "0,5 Tag";
  if (Number.isInteger(days)) return `${days} ${days === 1 ? "Tag" : "Tage"}`;
  return `${String(days).replace(".", ",")} Tage`;
}

function formatHoursInfo(minutes: number): string {
  return `${String((minutes / 60).toFixed(1)).replace(".", ",")} Stunden`;
}

function buildBlocksForSingleUser(sortedAbsences: Absence[]): AbsenceBlock[] {
  const res: AbsenceBlock[] = [];
  if (sortedAbsences.length === 0) return res;

  const user = sortedAbsences[0].user;

  let curType: Absence["type"] = sortedAbsences[0].type;
  let curCompensation: AbsenceCompensation = sortedAbsences[0].compensation;
  let curDayPortion: AbsenceDayPortion = sortedAbsences[0].dayPortion;
  let curFrom = sortedAbsences[0].absenceDate;
  let curTo = sortedAbsences[0].absenceDate;
  let curDays = absenceDayValue(sortedAbsences[0].dayPortion);

  const isNextDay = (prev: string, next: string) => {
    const p = toUTCDateFromISO(prev);
    p.setUTCDate(p.getUTCDate() + 1);

    const y = p.getUTCFullYear();
    const m = String(p.getUTCMonth() + 1).padStart(2, "0");
    const d = String(p.getUTCDate()).padStart(2, "0");

    return `${y}-${m}-${d}` === next;
  };

  for (let i = 1; i < sortedAbsences.length; i++) {
    const a = sortedAbsences[i];

    if (a.user.id !== user.id) {
      res.push({
        user,
        type: curType,
        compensation: curCompensation,
        from: curFrom,
        to: curTo,
        days: curDays,
        dayPortion: curDayPortion,
      });

      curType = a.type;
      curCompensation = a.compensation;
      curDayPortion = a.dayPortion;
      curFrom = a.absenceDate;
      curTo = a.absenceDate;
      curDays = absenceDayValue(a.dayPortion);
      continue;
    }

    const mayMergeFullDays =
      curDayPortion === "FULL_DAY" &&
      a.dayPortion === "FULL_DAY" &&
      a.type === curType &&
      a.compensation === curCompensation &&
      isNextDay(curTo, a.absenceDate);

    if (mayMergeFullDays) {
      curTo = a.absenceDate;
      curDays += 1;
      continue;
    }

    res.push({
      user,
      type: curType,
      compensation: curCompensation,
      from: curFrom,
      to: curTo,
      days: curDays,
      dayPortion: curDayPortion,
    });

    curType = a.type;
    curCompensation = a.compensation;
    curDayPortion = a.dayPortion;
    curFrom = a.absenceDate;
    curTo = a.absenceDate;
    curDays = absenceDayValue(a.dayPortion);
  }

  res.push({
    user,
    type: curType,
    compensation: curCompensation,
    from: curFrom,
    to: curTo,
    days: curDays,
    dayPortion: curDayPortion,
  });

  return res;
}

export default function UebersichtPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [absenceSummaryByUser, setAbsenceSummaryByUser] = useState<AbsenceUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [remainingVacationDays, setRemainingVacationDays] = useState<number>(30);
  const [annualVacationDays, setAnnualVacationDays] = useState<number>(30);
  const [usedVacationDaysYtd, setUsedVacationDaysYtd] = useState<number>(0);
  const [targetMinutes, setTargetMinutes] = useState<number>(0);
  const [netTargetMinutes, setNetTargetMinutes] = useState<number>(0);
  const [baseTargetMinutes, setBaseTargetMinutes] = useState<number>(0);
  const [holidayCountInMonth, setHolidayCountInMonth] = useState<number>(0);
  const [holidayMinutes, setHolidayMinutes] = useState<number>(0);
  const [vacationMinutesInfo, setVacationMinutesInfo] = useState<number>(0);
  const [sickMinutesInfo, setSickMinutesInfo] = useState<number>(0);
  const [unpaidAbsenceDays, setUnpaidAbsenceDays] = useState<number>(0);
  const [unpaidAbsenceMinutes, setUnpaidAbsenceMinutes] = useState<number>(0);

  const initialYm = useMemo(() => monthKey(new Date()), []);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear());
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(currentMonth());

  const ym = useMemo(() => buildYm(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  // ===== Export Modal State =====
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("MONTH");

  const [exportMonth, setExportMonth] = useState<string>(ym);
  const [exportYear, setExportYear] = useState<string>(currentYear());

  const [rangeFrom, setRangeFrom] = useState<string>(`${ym}-01`);
  const [rangeTo, setRangeTo] = useState<string>(`${ym}-${lastDayOfMonth(ym)}`);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: string[] = [];
    for (let y = now - 2; y <= now + 1; y++) arr.push(String(y));
    return arr;
  }, []);

  // ✅ Abwesenheiten Filter State
  const [absQuery, setAbsQuery] = useState<string>("");
  const [absType, setAbsType] = useState<AbsFilterType>("ALL");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [re, ra, ro] = await Promise.all([
          fetch(`/api/entries?month=${encodeURIComponent(ym)}`),
          fetch(`/api/absences?month=${encodeURIComponent(ym)}`),
          fetch(`/api/overview?month=${encodeURIComponent(ym)}`),
        ]);

        const je = (await re.json()) as unknown;
        const ja = (await ra.json()) as unknown;
        const jo = (await ro.json()) as unknown;

        const e =
          typeof je === "object" &&
          je !== null &&
          "entries" in je &&
          Array.isArray((je as { entries: unknown }).entries)
            ? (((je as { entries: WorkEntry[] }).entries ?? []) as WorkEntry[])
            : [];

        let a: Absence[] = [];
        let summary: AbsenceUserSummary[] = [];

        if (isAbsencesApiResponse(ja)) {
          const r = ja as AbsencesApiResponse;
          a = Array.isArray(r.absences) ? r.absences : [];
          summary = Array.isArray(r.summaryByUser) ? r.summaryByUser : [];
        }

        setEntries(e);
        setAbsences(a);
        setAbsenceSummaryByUser(summary);

        if (isOverviewResponse(jo)) {
          setIsAdmin(Boolean(jo.isAdmin));

          const nextAnnualVacationDays =
            typeof jo.annualVacationDays === "number" && Number.isFinite(jo.annualVacationDays)
              ? jo.annualVacationDays
              : 30;

          setAnnualVacationDays(nextAnnualVacationDays);

          if (Array.isArray(jo.byUser) && jo.byUser.length > 0) {
            const firstUser = jo.byUser[0];

            setUsedVacationDaysYtd(
              typeof firstUser.usedVacationDaysYtd === "number" && Number.isFinite(firstUser.usedVacationDaysYtd)
                ? firstUser.usedVacationDaysYtd
                : 0
            );

            setRemainingVacationDays(
              typeof firstUser.remainingVacationDays === "number" && Number.isFinite(firstUser.remainingVacationDays)
                ? firstUser.remainingVacationDays
                : nextAnnualVacationDays
            );

            setBaseTargetMinutes(
              typeof firstUser.baseTargetMinutes === "number" && Number.isFinite(firstUser.baseTargetMinutes)
                ? firstUser.baseTargetMinutes
                : 0
            );

            setTargetMinutes(
              typeof firstUser.targetMinutes === "number" && Number.isFinite(firstUser.targetMinutes)
                ? firstUser.targetMinutes
                : 0
            );

            setNetTargetMinutes(
              typeof firstUser.netTargetMinutes === "number" && Number.isFinite(firstUser.netTargetMinutes)
                ? firstUser.netTargetMinutes
                : 0
            );

            setHolidayCountInMonth(
              typeof firstUser.holidayCountInMonth === "number" && Number.isFinite(firstUser.holidayCountInMonth)
                ? firstUser.holidayCountInMonth
                : 0
            );

            setHolidayMinutes(
              typeof firstUser.holidayMinutes === "number" && Number.isFinite(firstUser.holidayMinutes)
                ? firstUser.holidayMinutes
                : 0
            );

            setVacationMinutesInfo(
              typeof firstUser.vacationMinutes === "number" && Number.isFinite(firstUser.vacationMinutes)
                ? firstUser.vacationMinutes
                : 0
            );

            setSickMinutesInfo(
              typeof firstUser.sickMinutes === "number" && Number.isFinite(firstUser.sickMinutes)
                ? firstUser.sickMinutes
                : 0
            );

            setUnpaidAbsenceDays(
              typeof firstUser.unpaidAbsenceDays === "number" && Number.isFinite(firstUser.unpaidAbsenceDays)
                ? firstUser.unpaidAbsenceDays
                : 0
            );

            setUnpaidAbsenceMinutes(
              typeof firstUser.unpaidAbsenceMinutes === "number" && Number.isFinite(firstUser.unpaidAbsenceMinutes)
                ? firstUser.unpaidAbsenceMinutes
                : 0
            );
          } else {
            setUsedVacationDaysYtd(0);
            setRemainingVacationDays(nextAnnualVacationDays);
            setBaseTargetMinutes(0);
            setTargetMinutes(0);
            setNetTargetMinutes(0);
            setHolidayCountInMonth(0);
            setHolidayMinutes(0);
            setVacationMinutesInfo(0);
            setSickMinutesInfo(0);
            setUnpaidAbsenceDays(0);
            setUnpaidAbsenceMinutes(0);
          }
        } else {
          setIsAdmin(false);
          setAnnualVacationDays(30);
          setUsedVacationDaysYtd(0);
          setRemainingVacationDays(30);
          setBaseTargetMinutes(0);
          setTargetMinutes(0);
          setNetTargetMinutes(0);
          setHolidayCountInMonth(0);
          setHolidayMinutes(0);
          setVacationMinutesInfo(0);
          setSickMinutesInfo(0);
          setUnpaidAbsenceDays(0);
          setUnpaidAbsenceMinutes(0);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ym]);
  
  useEffect(() => {
    if (isAdmin) router.replace("/admin/dashboard");
  }, [isAdmin, router]);

  const monthEntries = useMemo(() => entries.filter((e) => e.workDate?.startsWith(ym)), [entries, ym]);
  const monthAbsences = useMemo(() => absences.filter((a) => a.absenceDate?.startsWith(ym)), [absences, ym]);

  const totalMinutes = useMemo(
    () => monthEntries.reduce((s, e) => s + (Number.isFinite(e.workMinutes) ? e.workMinutes : 0), 0),
    [monthEntries]
  );



  const vacDays = useMemo(() => {
    if (absenceSummaryByUser.length > 0) {
      return absenceSummaryByUser.reduce((s, u) => s + (Number.isFinite(u.vacationDays) ? u.vacationDays : 0), 0);
    }
    return monthAbsences.filter((a) => a.type === "VACATION").length;
  }, [absenceSummaryByUser, monthAbsences]);

  const sickDays = useMemo(() => {
    if (absenceSummaryByUser.length > 0) {
      return absenceSummaryByUser.reduce((s, u) => s + (Number.isFinite(u.sickDays) ? u.sickDays : 0), 0);
    }
    return monthAbsences.filter((a) => a.type === "SICK").length;
  }, [absenceSummaryByUser, monthAbsences]);

  const unpaidVacationDaysValue = useMemo(() => {
    if (absenceSummaryByUser.length > 0) {
      return absenceSummaryByUser.reduce(
        (sum, u) => sum + (Number.isFinite(u.unpaidVacationDays) ? u.unpaidVacationDays : 0),
        0
      );
    }

    return monthAbsences.reduce((sum, a) => {
      if (a.type === "VACATION" && a.compensation === "UNPAID") {
        return sum + absenceDayValue(a.dayPortion);
      }
      return sum;
    }, 0);
  }, [absenceSummaryByUser, monthAbsences]);

  const progress = Math.min(1, targetMinutes <= 0 ? 0 : totalMinutes / targetMinutes);
  const overtimeGrossMinutes = totalMinutes - targetMinutes;
  const overtimeNetMinutes = totalMinutes - targetMinutes + vacationMinutesInfo + sickMinutesInfo + holidayMinutes;

  const byEmployee = useMemo(() => {
    type Acc = {
      userId: string;
      name: string;
      minutes: number;
      km: number;
      entries: number;
      vac: number;
      sick: number;
      unpaidVac: number;
    };

    const map = new Map<string, Acc>();

    for (const e of monthEntries) {
      const key = e.user?.id ?? "me";
      const name = e.user?.fullName ?? "Ich";
      const cur =
        map.get(key) ?? {
          userId: key,
          name,
          minutes: 0,
          km: 0,
          entries: 0,
          vac: 0,
          sick: 0,
          unpaidVac: 0,
        };

      cur.minutes += Number.isFinite(e.workMinutes) ? e.workMinutes : 0;
      cur.entries += 1;

      map.set(key, cur);
    }

    if (absenceSummaryByUser.length > 0) {
      for (const s of absenceSummaryByUser) {
        const key = s.user.id;
        const name = s.user.fullName;
        const cur =
        map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0, unpaidVac: 0 };

        cur.vac += Number.isFinite(s.vacationDays) ? s.vacationDays : 0;
        cur.sick += Number.isFinite(s.sickDays) ? s.sickDays : 0;
        cur.unpaidVac += Number.isFinite(s.unpaidVacationDays) ? s.unpaidVacationDays : 0;

        map.set(key, cur);
      }
    } else {
      for (const a of monthAbsences) {
        const key = a.user?.id ?? "me";
        const name = a.user?.fullName ?? "Ich";
        const cur =
        map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0, unpaidVac: 0 };

        const value = absenceDayValue(a.dayPortion);

        if (a.type === "VACATION" && a.compensation === "UNPAID") cur.unpaidVac += value;
        if (a.type === "VACATION" && a.compensation === "PAID") cur.vac += value;
        if (a.type === "SICK") cur.sick += value;

        map.set(key, cur);
      }
    }

    return Array.from(map.values()).sort((x, y) => y.minutes - x.minutes);
  }, [monthEntries, monthAbsences, absenceSummaryByUser]);

  const showByEmployee = byEmployee.length > 1;

  const startDownload = (url: string) => {
    window.location.href = url;
  };

  const openExportModal = () => {
    setExportMode("MONTH");
    setExportMonth(ym);
    setExportYear(currentYear());
    setRangeFrom(`${ym}-01`);
    setRangeTo(`${ym}-${lastDayOfMonth(ym)}`);
    setExportOpen(true);
  };

  const rangeError = useMemo(() => {
    if (exportMode !== "RANGE") return "";
    if (!rangeFrom || !rangeTo) return "Bitte Von und Bis auswählen.";
    if (rangeFrom > rangeTo) return "Von-Datum darf nicht nach dem Bis-Datum liegen.";
    return "";
  }, [exportMode, rangeFrom, rangeTo]);

  const doExport = () => {
    if (exportMode === "MONTH") {
      startDownload(`/api/admin/export?scope=month&month=${encodeURIComponent(exportMonth)}`);
      setExportOpen(false);
      return;
    }

    if (exportMode === "YEAR") {
      startDownload(`/api/admin/export?scope=year&year=${encodeURIComponent(exportYear)}`);
      setExportOpen(false);
      return;
    }

    if (rangeError) return;
    startDownload(`/api/admin/export?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}`);
    setExportOpen(false);
  };

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
        disabled={exportMode === "RANGE" && Boolean(rangeError)}
        style={{
          padding: "10px 14px",
          cursor: exportMode === "RANGE" && rangeError ? "not-allowed" : "pointer",
          fontWeight: 1000,
          borderRadius: 12,
          border: "1px solid rgba(184,207,58,0.35)",
          background: exportMode === "RANGE" && rangeError ? "rgba(184,207,58,0.06)" : "rgba(184,207,58,0.12)",
          color: "var(--accent)",
          opacity: exportMode === "RANGE" && rangeError ? 0.7 : 1,
        }}
        title="Download starten"
      >
        Download starten
      </button>
    </>
  );

  // ✅ Blocks (für Admin UND Employee)
const filteredBlocks = useMemo((): AbsenceBlock[] => {
  const q = absQuery.trim().toLowerCase();

  const base = monthAbsences.filter((a) => {
    if (absType !== "ALL" && a.type !== absType) return false;
    if (isAdmin && q && !a.user.fullName.toLowerCase().includes(q)) return false;
    return true;
  });

  const byUser = new Map<string, Absence[]>();
  for (const a of base) {
    const arr = byUser.get(a.user.id) ?? [];
    arr.push(a);
    byUser.set(a.user.id, arr);
  }

  const blocks: AbsenceBlock[] = [];
  for (const arr of byUser.values()) {
    const sorted = arr.slice().sort((x, y) => x.absenceDate.localeCompare(y.absenceDate));
    blocks.push(...buildBlocksForSingleUser(sorted));
  }

  blocks.sort((a, b) => {
    const d = a.from.localeCompare(b.from);
    if (d !== 0) return d;
    const n = a.user.fullName.localeCompare(b.user.fullName);
    if (n !== 0) return n;
    return a.type.localeCompare(b.type);
  });

  return blocks;
}, [monthAbsences, absQuery, absType, isAdmin]);

  const filteredAbsenceCounts = useMemo(() => {
    let sick = 0;
    let vac = 0;
    let unpaidVac = 0;
    let total = 0;

    for (const b of filteredBlocks) {
      total += b.days;
      if (b.type === "SICK") sick += b.days;
      if (b.type === "VACATION" && b.compensation === "PAID") vac += b.days;
      if (b.type === "VACATION" && b.compensation === "UNPAID") unpaidVac += b.days;
    }

    return { total, sick, vac, unpaidVac };
  }, [filteredBlocks]);

const resetAbsFilters = () => {
  setAbsQuery("");
  setAbsType("ALL");
};

  return (
    <AppShell activeLabel="#wirkönndas">
      {/* ✅ Admin Export Button */}
      {isAdmin ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
        </div>
      ) : null}

      {/* ✅ Export Modal */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Export (Admin)" footer={exportFooter} maxWidth={720}>
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
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Download: <b>eine CSV</b> für <b>{exportMonth}</b>
              </div>
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

              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Download: <b>ZIP</b> mit <b>12 CSVs</b> (pro Monat eine Datei)
              </div>
            </div>
          ) : null}

          {exportMode === "RANGE" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Zeitraum auswählen</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Von</div>
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
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Bis</div>
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
              </div>

              {rangeError ? (
                <div style={{ fontSize: 12, color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>{rangeError}</div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Download: CSV für <b>{rangeFrom}</b> bis <b>{rangeTo}</b>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Globaler Filter oben */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 6 }}>
              Übersicht
            </div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: 15,
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              Daten für{" "}
              <span style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
                {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Jahr</div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={selectStyle()}
              >
                {years.map((y) => (
                  <option key={y} value={y} style={{ color: "black" }}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Monat</div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value as MonthOption)}
                style={selectStyle()}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value} style={{ color: "black" }}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">
              Arbeitsstunden · {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </div>
            <div className="big">{toHours(totalMinutes).toFixed(1)}h</div>
            <div className="small">
              Soll (Brutto): {toHours(targetMinutes).toFixed(1)}h
            </div>
            <div className="small">
              Soll (Netto): {toHours(netTargetMinutes).toFixed(1)}h
            </div>
            <div className="small">
              Überstunden (Brutto): {toHours(overtimeGrossMinutes).toFixed(1)}h
            </div>
            <div className="small">
              Überstunden (Netto): {toHours(overtimeNetMinutes).toFixed(1)}h
            </div>
            <div
              className="small"
              style={{
                marginTop: 6,
                fontSize: 11,
                lineHeight: 1.35,
                color: "var(--muted-2)",
              }}
            >
              Brutto ohne Urlaub, Krankheit und Feiertage. Netto berücksichtigt bezahlte Urlaubstage, Krankheitstage und Feiertage zusätzlich.
            </div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>⏱</div>
        </div>


        <div className="card kpi">
          <div>
            <div className="small">
              Urlaubstage · {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </div>
            <div className="big">{String(vacDays).replace(".", ",")}</div>
            <div className="small">
              {formatHoursInfo(vacationMinutesInfo)} davon Urlaub
            </div>
            {unpaidVacationDaysValue > 0 ? (
              <div className="small">
                {String(unpaidVacationDaysValue).replace(".", ",")} Tage unbezahlt ({formatHoursInfo(unpaidAbsenceMinutes)})
              </div>
            ) : null}
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌴</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Resturlaub</div>
            <div className="big">{String(remainingVacationDays).replace(".", ",")}</div>
            <div className="small">
              {String(usedVacationDaysYtd).replace(".", ",")} von {annualVacationDays} Tagen verbraucht
            </div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🗓</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Krankheitstage</div>
            <div className="big">{sickDays}</div>
            <div className="small">
              {formatHoursInfo(sickMinutesInfo)} davon krank
            </div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌡</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 14 }}>
        Monatsfortschritt – {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: "var(--muted)" }}>
            Noch {Math.max(0, (targetMinutes - totalMinutes) / 60).toFixed(1)}h bis zum Monatssoll (Brutto)
            {baseTargetMinutes > 0 ? (
              <span>
                {" "}· Feiertage berücksichtigt
                {holidayCountInMonth > 0 ? ` (${holidayCountInMonth})` : ""}
              </span>
            ) : null}
          </div>
          <div style={{ fontWeight: 900 }}>
            {toHours(totalMinutes).toFixed(1)}h / {toHours(targetMinutes).toFixed(1)}h
            <span style={{ marginLeft: 8, color: "var(--muted)" }}>
              · Netto: {toHours(overtimeNetMinutes).toFixed(1)}h Überstunden
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: 10 }}>
          <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, rgba(184,207,58,0.95), rgba(157,176,47,0.95))",
              }}
            />
          </div>
        </div>
      </div>

      {/* ✅ Abwesenheiten + Filter */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div className="section-title">
            Abwesenheiten – {MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chipStyle("rgba(255,255,255,0.06)", "rgba(255,255,255,0.12)")}>
              Gefiltert: {filteredAbsenceCounts.total}
            </span>
            <span style={chipStyle("rgba(224, 75, 69, 0.10)", "rgba(224, 75, 69, 0.35)")}>
              🌡 {filteredAbsenceCounts.sick}
            </span>
            <span style={chipStyle("rgba(90, 167, 255, 0.10)", "rgba(90, 167, 255, 0.35)")}>
              🌴 {filteredAbsenceCounts.vac}
            </span>
            <span style={chipStyle("rgba(255, 184, 77, 0.10)", "rgba(255, 184, 77, 0.35)")}>
              💸 {filteredAbsenceCounts.unpaidVac}
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: isAdmin ? "minmax(0,1.4fr) minmax(0,1fr) auto" : "minmax(0,1fr) auto",
            gap: 10,
          }}
        >
          {isAdmin ? (
            <input
              value={absQuery}
              onChange={(e) => setAbsQuery(e.target.value)}
              placeholder="Name suchen…"
              style={inputStyle()}
            />
          ) : null}

          <select value={absType} onChange={(e) => setAbsType(e.target.value as AbsFilterType)} style={selectStyle()}>
            <option value="ALL">Alle Typen</option>
            <option value="SICK">Krank</option>
            <option value="VACATION">Urlaub</option>
          </select>

          <button
            type="button"
            onClick={resetAbsFilters}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
            title="Filter zurücksetzen"
          >
            ↺ Reset
          </button>
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)", marginTop: 12 }}>Lade...</div>
        ) : filteredBlocks.length === 0 ? (
          <div style={{ color: "var(--muted)", marginTop: 12 }}>Keine Abwesenheiten für diese Filter.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {filteredBlocks.map((b) => {
              const title = b.from === b.to ? formatDateDE(b.from) : `${formatDateDE(b.from)} – ${formatDateDE(b.to)}`;

              return (
                <div
                  key={`${b.user.id}-${b.type}-${b.from}-${b.to}`}
                  className="list-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 12px",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        display: "inline-block",
                        background: typeColor(b.type),
                      }}
                    />
                    <span style={{ fontWeight: 900 }}>{title}</span>
                    <span style={badgeStyle(b.type)}>{typeLabel(b.type, b.compensation)}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {formatDayCountDE(b.days)}
                    </span>
                    {b.type === "VACATION" && b.compensation === "UNPAID" ? (
                      <span style={{ color: "rgba(255, 184, 77, 0.95)", fontWeight: 900 }}>
                        unbezahlt
                      </span>
                    ) : null}
                  </div>

                  <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{b.user.fullName}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By employee */}
      {showByEmployee ? (
        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Nach Mitarbeiter
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Lade...</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {byEmployee.map((p) => (
                <div key={p.userId} className="list-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: "rgba(184,207,58,0.14)",
                            border: "1px solid rgba(184,207,58,0.35)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                            color: "var(--accent)",
                            textTransform: "uppercase",
                          }}
                        >
                          {p.name.trim().slice(0, 1)}
                        </div>
                        <div style={{ fontWeight: 900 }}>{p.name}</div>
                      </div>

                      <div style={{ color: "var(--muted-2)", marginTop: 8, display: "flex", gap: 18, flexWrap: "wrap" }}>
                        <span>🧾 {p.entries} Einträge</span>
                        <span>🚗 {p.km.toFixed(0)} km</span>
                        {p.sick > 0 ? (
                          <span style={{ color: "rgba(224, 75, 69, 0.95)" }}>
                            🌡 {String(p.sick).replace(".", ",")} Krank
                          </span>
                        ) : null}
                        {p.unpaidVac > 0 ? (
                          <span style={{ color: "rgba(255, 184, 77, 0.95)" }}>
                            💸 {String(p.unpaidVac).replace(".", ",")} Urlaub unbezahlt
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ fontWeight: 900, color: "var(--accent)", fontSize: 18 }}>{toHours(p.minutes).toFixed(1)}h</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
