"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

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
};

type AdminTimelineAbsence = {
  type: "VACATION" | "SICK";
  date: string; // YYYY-MM-DD
};

type AdminTimelineItem = AdminTimelineWork | AdminTimelineAbsence;

type AdminEmployeeTimeline = {
  userId: string;
  fullName: string;
  items: AdminTimelineItem[];
};

/* =========================
   Types (UI Subcategories)
   ========================= */

type CatKey = "WORK" | "SICK" | "VACATION";
type CatState = Record<CatKey, boolean>;

const defaultCatState: CatState = { WORK: true, SICK: true, VACATION: true };

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

type AdminDashboardApiOk = {
  ok: true;
  todayIso: string;
  weekRange: { from: string; to: string };
  monthRange: { from: string; to: string };
  cards: DashboardCards;
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

function isAdminDashboardOk(v: unknown): v is AdminDashboardApiOk {
  if (!isRecord(v)) return false;
  if (v.ok !== true) return false;

  const cards = v["cards"];
  const weekRange = v["weekRange"];
  const monthRange = v["monthRange"];
  const employeesTimeline = v["employeesTimeline"];

  if (!isRecord(cards) || !isRecord(weekRange) || !isRecord(monthRange)) return false;
  if (!Array.isArray(employeesTimeline)) return false;

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
    isNumber(cards["employeesActive"])
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

/* =========================
   Absence grouping (ranges)
   ========================= */

type AbsenceRange = {
  type: "VACATION" | "SICK";
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
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

function groupAbsenceRanges(items: AdminTimelineItem[]): AbsenceRange[] {
  const abs = items
    .filter((i): i is AdminTimelineAbsence => i.type === "VACATION" || i.type === "SICK")
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const res: AbsenceRange[] = [];
  for (const it of abs) {
    const last = res[res.length - 1];

    if (!last) {
      res.push({ type: it.type, from: it.date, to: it.date });
      continue;
    }

    const expectedNext = addDaysIso(last.to, 1);

    if (last.type === it.type && it.date === expectedNext) {
      last.to = it.date;
      continue;
    }

    res.push({ type: it.type, from: it.date, to: it.date });
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

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [reloadTick, setReloadTick] = useState(0);

  // Export Modal State
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("MONTH");
  const [exportMonth, setExportMonth] = useState<string>(ym);
  const [exportYear, setExportYear] = useState<string>(currentYear());
  const [rangeFrom, setRangeFrom] = useState<string>(`${ym}-01`);
  const [rangeTo, setRangeTo] = useState<string>(`${ym}-${lastDayOfMonth(ym)}`);

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
  const [editBreakMinutes, setEditBreakMinutes] = useState<string>("0");

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: string[] = [];
    for (let y = now - 2; y <= now + 1; y++) arr.push(String(y));
    return arr;
  }, []);

  const startDownload = (url: string) => {
    window.location.href = url;
  };

  const openExportModal = () => {
    setExportMode("MONTH");
    setExportMonth(month);
    setExportYear(currentYear());
    setRangeFrom(`${month}-01`);
    setRangeTo(`${month}-${lastDayOfMonth(month)}`);
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

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const [rd, ro] = await Promise.all([
          fetch(`/api/admin/dashboard?month=${encodeURIComponent(month)}`),
          fetch(`/api/overview?month=${encodeURIComponent(month)}`),
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

    function openEditWork(uName: string, it: AdminTimelineWork) {
    setEditErr("");
    setEditEntryId(it.id);
    setEditUserLabel(uName);
    setEditDate(it.date);
    setEditTime(`${it.startHHMM}–${it.endHHMM}`);

    setEditActivity(it.activity ?? "");
    setEditLocation(it.location ?? "");
    setEditTravelMinutes(String(it.travelMinutes ?? 0));
    setEditBreakMinutes(String(it.breakMinutes ?? 0));

    setEditOpen(true);
  }

  async function saveEditWork() {
    if (!editEntryId) return;

    setEditSaving(true);
    setEditErr("");

    const travel = Number(editTravelMinutes.replace(",", "."));
    const brk = Number(editBreakMinutes.replace(",", "."));

    const travelMinutes = Number.isFinite(travel) ? Math.max(0, Math.round(travel)) : 0;
    const breakMinutes = Number.isFinite(brk) ? Math.max(0, Math.round(brk)) : 0;

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
          breakMinutes,
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
        </div>
      </div>

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
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>

      {err ? (
        <div className="card" style={{ padding: 14, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
          <div style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>{err}</div>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">Aktive Mitarbeiter</div>
            <div className="big">{dash?.cards.employeesActive ?? "—"}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>👥</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Fehlende Einträge (heute)</div>
            <div className="big">{dash?.cards.missingToday ?? "—"}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>⚠️</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Abwesenheiten (heute)</div>
            <div className="big">{dash?.cards.absencesToday ?? "—"}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🌴</div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Monat (gesamt)</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ color: "var(--muted)" }}>
            Arbeitszeit gesamt: <b>{overview ? formatHours1(overview.totals.workMinutes) : "—"}</b>
          </div>
          <div style={{ color: "var(--muted)" }}>
            Urlaub: <b>{overview ? overview.totals.vacationDays : "—"}</b> · Krank: <b>{overview ? overview.totals.sickDays : "—"}</b>
          </div>
          <div style={{ color: "var(--muted)" }}>
            Einträge: <b>{overview ? overview.totals.entriesCount : "—"}</b>
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
                  <div key={u.userId} className="list-item">
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
                                  <div style={{ display: "grid", gap: 6 }}>
                                    {workItems.map((it, idx) => (
                                      <div
                                        key={`w-${idx}`}
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
                                          <div style={{ fontWeight: 1000 }}>
                                            {formatDateDE(it.date)} · {it.startHHMM}–{it.endHHMM}
                                          </div>

                                          {(it.activity || it.location) ? (
                                            <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                              {it.activity ? it.activity : ""}
                                              {it.activity && it.location ? " · " : ""}
                                              {it.location ? it.location : ""}
                                            </div>
                                          ) : null}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ color: "var(--accent)", fontWeight: 1100, whiteSpace: "nowrap" }}>
                                            {formatHM(it.workMinutes)}
                                          </div>

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
                                      const text = r.from === r.to ? `${from}` : `${from}–${to}`;
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
                                      const text = r.from === r.to ? `${from}` : `${from}–${to}`;
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
    </AppShell>
  );
}