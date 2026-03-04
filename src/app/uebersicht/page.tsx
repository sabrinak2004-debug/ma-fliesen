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

type Absence = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
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
  totalDays: number;
};

type AbsencesApiResponse = {
  absences?: Absence[];
  groupsByDay?: AbsenceDayGroup[];
  summaryByUser?: AbsenceUserSummary[];
  range?: { from: string; to: string };
};

type OverviewResponse = {
  isAdmin?: boolean;
};

function isOverviewResponse(x: unknown): x is OverviewResponse {
  return typeof x === "object" && x !== null && ("isAdmin" in x || Object.keys(x as object).length >= 0);
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

type ExportMode = "MONTH" | "YEAR" | "RANGE";

function formatDateDE(yyyyMmDd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd;
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}.${m}.${y}`;
}

function typeLabel(t: "VACATION" | "SICK") {
  return t === "SICK" ? "Krank" : "Urlaub";
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
type AbsRange = "MONTH" | "TODAY" | "WEEK";

function startOfTodayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function isoUTCDate(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toUTCDateFromISO(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

type AbsenceBlock = {
  user: { id: string; fullName: string };
  type: "VACATION" | "SICK";
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  days: number;
};

function daysInclusive(from: string, to: string) {
  const a = toUTCDateFromISO(from);
  const b = toUTCDateFromISO(to);
  const diff = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function buildBlocksForSingleUser(sortedAbsences: Absence[]): AbsenceBlock[] {
  const res: AbsenceBlock[] = [];
  if (sortedAbsences.length === 0) return res;

  const user = sortedAbsences[0].user;

  let curType: Absence["type"] = sortedAbsences[0].type;
  let curFrom = sortedAbsences[0].absenceDate;
  let curTo = sortedAbsences[0].absenceDate;

  const isNextDay = (prev: string, next: string) => {
    const p = toUTCDateFromISO(prev);
    p.setUTCDate(p.getUTCDate() + 1);
    return isoUTCDate(p) === next;
  };

  for (let i = 1; i < sortedAbsences.length; i++) {
    const a = sortedAbsences[i];

    // Falls doch gemischt -> harte Trennung
    if (a.user.id !== user.id) {
      res.push({ user, type: curType, from: curFrom, to: curTo, days: daysInclusive(curFrom, curTo) });
      curType = a.type;
      curFrom = a.absenceDate;
      curTo = a.absenceDate;
      continue;
    }

    if (a.type === curType && isNextDay(curTo, a.absenceDate)) {
      curTo = a.absenceDate;
      continue;
    }

    res.push({ user, type: curType, from: curFrom, to: curTo, days: daysInclusive(curFrom, curTo) });

    curType = a.type;
    curFrom = a.absenceDate;
    curTo = a.absenceDate;
  }

  res.push({ user, type: curType, from: curFrom, to: curTo, days: daysInclusive(curFrom, curTo) });
  return res;
}

export default function UebersichtPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [absenceSummaryByUser, setAbsenceSummaryByUser] = useState<AbsenceUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  const ym = useMemo(() => monthKey(new Date()), []);

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
  const [absRange, setAbsRange] = useState<AbsRange>("MONTH");

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

        if (isOverviewResponse(jo)) setIsAdmin(Boolean(jo.isAdmin));
        else setIsAdmin(false);
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

  const targetMinutes = 160 * 60;
  const progress = Math.min(1, targetMinutes === 0 ? 0 : totalMinutes / targetMinutes);

  const byEmployee = useMemo(() => {
    type Acc = {
      userId: string;
      name: string;
      minutes: number;
      km: number;
      entries: number;
      vac: number;
      sick: number;
    };

    const map = new Map<string, Acc>();

    for (const e of monthEntries) {
      const key = e.user?.id ?? "me";
      const name = e.user?.fullName ?? "Ich";
      const cur =
        map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };

      cur.minutes += Number.isFinite(e.workMinutes) ? e.workMinutes : 0;
      cur.entries += 1;

      map.set(key, cur);
    }

    if (absenceSummaryByUser.length > 0) {
      for (const s of absenceSummaryByUser) {
        const key = s.user.id;
        const name = s.user.fullName;
        const cur =
          map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };

        cur.vac += Number.isFinite(s.vacationDays) ? s.vacationDays : 0;
        cur.sick += Number.isFinite(s.sickDays) ? s.sickDays : 0;

        map.set(key, cur);
      }
    } else {
      for (const a of monthAbsences) {
        const key = a.user?.id ?? "me";
        const name = a.user?.fullName ?? "Ich";
        const cur =
          map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };

        if (a.type === "VACATION") cur.vac += 1;
        if (a.type === "SICK") cur.sick += 1;

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

    const today = startOfTodayUTC();
    const todayIso = isoUTCDate(today);
    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    const base = monthAbsences
      .filter((a) => {
        if (absRange === "TODAY") return a.absenceDate === todayIso;
        if (absRange === "WEEK") {
          const d = toUTCDateFromISO(a.absenceDate);
          return d >= weekStart && d <= today;
        }
        return true; // MONTH
      })
      .filter((a) => {
        if (absType !== "ALL" && a.type !== absType) return false;
        if (isAdmin && q && !a.user.fullName.toLowerCase().includes(q)) return false; // Suche nur bei Admin sichtbar/benutzt
        return true;
      });

    // pro User gruppieren => pro User Blöcke bauen
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

    // Sortierung: zuerst Startdatum, dann Name, dann Typ
    blocks.sort((a, b) => {
      const d = a.from.localeCompare(b.from);
      if (d !== 0) return d;
      const n = a.user.fullName.localeCompare(b.user.fullName);
      if (n !== 0) return n;
      return a.type.localeCompare(b.type);
    });

    return blocks;
  }, [monthAbsences, absQuery, absType, absRange, isAdmin]);

  const filteredAbsenceCounts = useMemo(() => {
    let sick = 0;
    let vac = 0;
    let total = 0;

    for (const b of filteredBlocks) {
      total += b.days;
      if (b.type === "SICK") sick += b.days;
      if (b.type === "VACATION") vac += b.days;
    }

    return { total, sick, vac };
  }, [filteredBlocks]);

  const resetAbsFilters = () => {
    setAbsQuery("");
    setAbsType("ALL");
    setAbsRange("MONTH");
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

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">Arbeitsstunden</div>
            <div className="big">{toHours(totalMinutes).toFixed(1)}h</div>
            <div className="small">Soll: 160h</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>⏱</div>
        </div>


        <div className="card kpi">
          <div>
            <div className="small">Urlaubstage</div>
            <div className="big">{vacDays}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌴</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Krankheitstage</div>
            <div className="big">{sickDays}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌡</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>
          Monatsfortschritt
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: "var(--muted)" }}>
            Noch {Math.max(0, (targetMinutes - totalMinutes) / 60).toFixed(1)}h bis zum Monatssoll
          </div>
          <div style={{ fontWeight: 900 }}>{toHours(totalMinutes).toFixed(1)}h / 160h</div>
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
          <div className="section-title">Abwesenheiten (Blocks)</div>

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
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: isAdmin ? "1.4fr 1fr 1fr auto" : "1fr 1fr auto",
            gap: 10,
          }}
        >
          {/* ✅ Name-Suche nur für Admin */}
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
            <option value="SICK">Nur Krank</option>
            <option value="VACATION">Nur Urlaub</option>
          </select>

          <select value={absRange} onChange={(e) => setAbsRange(e.target.value as AbsRange)} style={selectStyle()}>
            <option value="MONTH">Dieser Monat</option>
            <option value="WEEK">Letzte 7 Tage</option>
            <option value="TODAY">Heute</option>
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
                    <span style={badgeStyle(b.type)}>{typeLabel(b.type)}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {b.days} {b.days === 1 ? "Tag" : "Tage"}
                    </span>
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
                        {p.sick > 0 ? <span style={{ color: "rgba(224, 75, 69, 0.95)" }}>🌡 {p.sick}d Krank</span> : null}
                        {p.vac > 0 ? <span style={{ color: "rgba(90, 167, 255, 0.95)" }}>🌴 {p.vac}d Urlaub</span> : null}
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