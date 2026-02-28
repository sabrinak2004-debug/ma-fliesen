"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type WorkEntry = {
  id: string;
  workDate: string; // YYYY-MM-DD
  distanceKm: number | string | null;
  workMinutes: number;
  user?: { id: string; fullName: string }; // optional (falls API include user liefert)
};

type Absence = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
  user?: { id: string; fullName: string }; // optional
};

type OverviewResponse = {
  isAdmin?: boolean;
};

function isOverviewResponse(x: unknown): x is OverviewResponse {
  return typeof x === "object" && x !== null && ("isAdmin" in x || Object.keys(x as object).length >= 0);
}

function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function toHours(min: number) {
  return min / 60;
}

function safeNumber(x: unknown) {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : 0;
  return Number.isFinite(n) ? n : 0;
}

function lastDayOfMonth(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0); // Tag 0 des Folgemonats = letzter Tag des Monats
  return String(last.getDate()).padStart(2, "0");
}

export default function UebersichtPage() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  // aktueller Monat
  const ym = useMemo(() => monthKey(new Date()), []);

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

        const a =
          typeof ja === "object" &&
          ja !== null &&
          "absences" in ja &&
          Array.isArray((ja as { absences: unknown }).absences)
            ? (((ja as { absences: Absence[] }).absences ?? []) as Absence[])
            : [];

        setEntries(e);
        setAbsences(a);

        // ✅ kein any: isAdmin sicher auslesen
        if (isOverviewResponse(jo)) {
          setIsAdmin(Boolean(jo.isAdmin));
        } else {
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ym]);

  const monthEntries = useMemo(() => entries.filter((e) => e.workDate?.startsWith(ym)), [entries, ym]);
  const monthAbsences = useMemo(() => absences.filter((a) => a.absenceDate?.startsWith(ym)), [absences, ym]);

  const totalMinutes = useMemo(
    () => monthEntries.reduce((s, e) => s + (Number.isFinite(e.workMinutes) ? e.workMinutes : 0), 0),
    [monthEntries]
  );

  const totalKm = useMemo(() => monthEntries.reduce((s, e) => s + safeNumber(e.distanceKm), 0), [monthEntries]);

  const vacDays = useMemo(() => monthAbsences.filter((a) => a.type === "VACATION").length, [monthAbsences]);
  const sickDays = useMemo(() => monthAbsences.filter((a) => a.type === "SICK").length, [monthAbsences]);

  const targetMinutes = 160 * 60;
  const progress = Math.min(1, targetMinutes === 0 ? 0 : totalMinutes / targetMinutes);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { name: string; minutes: number; km: number; entries: number; vac: number; sick: number }>();

    for (const e of monthEntries) {
      const key = e.user?.id ?? "me";
      const name = e.user?.fullName ?? "Ich";
      const cur = map.get(key) ?? { name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };
      cur.minutes += Number.isFinite(e.workMinutes) ? e.workMinutes : 0;
      cur.km += safeNumber(e.distanceKm);
      cur.entries += 1;
      map.set(key, cur);
    }

    for (const a of monthAbsences) {
      const key = a.user?.id ?? "me";
      const name = a.user?.fullName ?? "Ich";
      const cur = map.get(key) ?? { name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };
      if (a.type === "VACATION") cur.vac += 1;
      if (a.type === "SICK") cur.sick += 1;
      map.set(key, cur);
    }

    return Array.from(map.values()).sort((x, y) => y.minutes - x.minutes);
  }, [monthEntries, monthAbsences]);

  const showByEmployee = byEmployee.length > 1;

  const handleExport = () => {
    const from = `${ym}-01`;
    const to = `${ym}-${lastDayOfMonth(ym)}`;
    window.open(`/api/admin/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, "_blank");
  };

  return (
    <AppShell activeLabel="#wirkönndas">
      {/* ✅ Admin Export Button */}
      {isAdmin ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={handleExport}
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
            title="Exportiert alle Einträge als CSV (Admin)"
          >
            ⬇️ Export (CSV)
          </button>
        </div>
      ) : null}

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
            <div className="small">Gefahrene km</div>
            <div className="big">{totalKm.toFixed(0)} km</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>🚗</div>
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

      {/* Absences list */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>
          Abwesenheiten (dieser Monat)
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Lade...</div>
        ) : monthAbsences.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Keine Abwesenheiten erfasst.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {monthAbsences
              .slice()
              .sort((a, b) => a.absenceDate.localeCompare(b.absenceDate))
              .map((a) => (
                <div key={a.id} className="list-item" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        display: "inline-block",
                        background: a.type === "SICK" ? "rgba(224, 75, 69, 0.95)" : "rgba(90, 167, 255, 0.95)",
                      }}
                    />
                    <span style={{ fontWeight: 700 }}>{a.absenceDate}</span>
                    <span style={{ color: "var(--muted)" }}>{a.type === "SICK" ? "Krank" : "Urlaub"}</span>
                  </div>

                  {a.user?.fullName ? <span style={{ color: "var(--muted)" }}>{a.user.fullName}</span> : null}
                </div>
              ))}
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
                <div key={p.name} className="list-item">
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

                    <div style={{ fontWeight: 900, color: "var(--accent)", fontSize: 18 }}>
                      {toHours(p.minutes).toFixed(1)}h
                    </div>
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