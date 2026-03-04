"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

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
};

type AdminDashboardApiErr = { ok: false; error: string };

type AdminDashboardApiResponse = AdminDashboardApiOk | AdminDashboardApiErr;

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

  if (!isRecord(cards) || !isRecord(weekRange) || !isRecord(monthRange)) return false;

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

export default function AdminDashboardPage() {
  const ym = useMemo(() => monthKey(new Date()), []);
  const [month, setMonth] = useState<string>(ym);

  const [dash, setDash] = useState<AdminDashboardApiOk | null>(null);
  const [overview, setOverview] = useState<OverviewApiResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // Export Modal State
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
          fetch("/api/admin/dashboard"),
          fetch(`/api/overview?month=${encodeURIComponent(month)}`),
        ]);

        const jd: unknown = await rd.json().catch(() => ({}));
        const jo: unknown = await ro.json().catch(() => ({}));

        if (!alive) return;

        if (!rd.ok) {
          const msg =
            isRecord(jd) && isString(jd["error"]) ? jd["error"] : "Dashboard konnte nicht geladen werden.";
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
          // Falls overview gesperrt wäre, zeigen wir zumindest dash
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
  }, [month]);

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
        ) : !overview ? (
          <div style={{ color: "var(--muted)" }}>Keine Monatsdaten verfügbar.</div>
        ) : overview.byUser.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Keine Benutzer im Zeitraum.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {overview.byUser
              .filter((u) => u.role === "EMPLOYEE")
              .sort((a, b) => b.workMinutes - a.workMinutes)
              .map((u) => (
                <div key={u.fullName} className="list-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>{u.fullName}</div>
                    <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(u.workMinutes)}</div>
                  </div>
                  <div style={{ color: "var(--muted-2)", marginTop: 8, display: "flex", gap: 18, flexWrap: "wrap" }}>
                    <span>🧾 {u.entriesCount} Einträge</span>
                    {u.vacationDays > 0 ? <span style={{ color: "rgba(90, 167, 255, 0.95)" }}>🌴 {u.vacationDays}d Urlaub</span> : null}
                    {u.sickDays > 0 ? <span style={{ color: "rgba(224, 75, 69, 0.95)" }}>🌡 {u.sickDays}d Krank</span> : null}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}