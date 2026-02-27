"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type WorkEntry = {
  id: string;
  workDate: string;     // YYYY-MM-DD
  distanceKm: string;
  workMinutes: number;
  user: { id: string; fullName: string };
};

type Absence = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
  user: { id: string; fullName: string };
};

function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export default function UebersichtPage() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const ym = useMemo(() => monthKey(new Date()), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [re, ra] = await Promise.all([fetch("/api/entries"), fetch("/api/absences")]);
        const je = (await re.json()) as unknown;
        const ja = (await ra.json()) as unknown;

        const e =
          typeof je === "object" && je !== null && "entries" in je && Array.isArray((je as { entries: unknown }).entries)
            ? ((je as { entries: WorkEntry[] }).entries ?? [])
            : [];

        const a =
          typeof ja === "object" && ja !== null && "absences" in ja && Array.isArray((ja as { absences: unknown }).absences)
            ? ((ja as { absences: Absence[] }).absences ?? [])
            : [];

        setEntries(e);
        setAbsences(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const monthEntries = useMemo(() => entries.filter((e) => e.workDate.startsWith(ym)), [entries, ym]);
  const monthAbsences = useMemo(() => absences.filter((a) => a.absenceDate.startsWith(ym)), [absences, ym]);

  const totalMinutes = useMemo(() => monthEntries.reduce((s, e) => s + e.workMinutes, 0), [monthEntries]);
  const totalKm = useMemo(() => monthEntries.reduce((s, e) => s + (Number(e.distanceKm) || 0), 0), [monthEntries]);
  const vacDays = useMemo(() => monthAbsences.filter((a) => a.type === "VACATION").length, [monthAbsences]);
  const sickDays = useMemo(() => monthAbsences.filter((a) => a.type === "SICK").length, [monthAbsences]);

  const targetMinutes = 160 * 60;
  const progress = Math.min(1, targetMinutes === 0 ? 0 : totalMinutes / targetMinutes);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { name: string; minutes: number; km: number; entries: number; vac: number; sick: number }>();

    for (const e of monthEntries) {
      const key = e.user.id;
      const cur = map.get(key) ?? { name: e.user.fullName, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };
      cur.minutes += e.workMinutes;
      cur.km += Number(e.distanceKm) || 0;
      cur.entries += 1;
      map.set(key, cur);
    }

    for (const a of monthAbsences) {
      const key = a.user.id;
      const cur = map.get(key) ?? { name: a.user.fullName, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0 };
      if (a.type === "VACATION") cur.vac += 1;
      if (a.type === "SICK") cur.sick += 1;
      map.set(key, cur);
    }

    return Array.from(map.values()).sort((x, y) => y.minutes - x.minutes);
  }, [monthEntries, monthAbsences]);

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">Arbeitsstunden</div>
            <div className="big">{(totalMinutes / 60).toFixed(1)}h</div>
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

      <div className="card card-olive" style={{ padding: 18, marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Monatsfortschritt</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: "var(--muted)" }}>
            Noch {Math.max(0, (targetMinutes - totalMinutes) / 60).toFixed(1)}h bis zum Monatssoll
          </div>
          <div style={{ fontWeight: 900 }}>{(totalMinutes / 60).toFixed(1)}h / 160h</div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
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

      <div className="card" style={{ padding: 18 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Nach Mitarbeiter</div>

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Lade...</div>
        ) : byEmployee.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Noch keine Daten für diesen Monat.</div>
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
                      <div style={{ fontWeight: 900, textTransform: "lowercase" }}>{p.name}</div>
                    </div>

                    <div style={{ color: "var(--muted-2)", marginTop: 8, display: "flex", gap: 18, flexWrap: "wrap" }}>
                      <span>🧾 {p.entries} Einträge</span>
                      <span>🚗 {p.km.toFixed(0)} km</span>
                      {p.sick > 0 ? <span style={{ color: "rgba(224, 75, 69, 0.95)" }}>🌡 {p.sick}d Krank</span> : null}
                      {p.vac > 0 ? <span style={{ color: "rgba(90, 167, 255, 0.95)" }}>🌴 {p.vac}d Urlaub</span> : null}
                    </div>
                  </div>

                  <div style={{ fontWeight: 900, color: "var(--accent)", fontSize: 18 }}>
                    {(p.minutes / 60).toFixed(1)}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}