"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

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
  distanceKm: string;
  travelMinutes: number;
  workMinutes: number;
  user: { id: string; fullName: string };
};

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

function formatHoursDE(workMinutes: number) {
  const hours = workMinutes / 60;
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(hours);
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
function groupByMonthYear(entries: WorkEntry[]) {
  const map = new Map<string, WorkEntry[]>();
  for (const e of entries) {
    const key = monthKeyFromWorkDate(e.workDate);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  const keys = Array.from(map.keys()).sort(sortMonthKeysDesc);
  return keys.map((k) => ({
    key: k,
    label: monthLabelDE(k),
    entries: (map.get(k) ?? []).slice().sort(sortEntriesDesc),
  }));
}

export default function Page() {
  const [me, setMe] = useState<MeResponse | null>(null);

  const [fullName, setFullName] = useState("");
  const [workDate, setWorkDate] = useState<string>(() => toIsoDateLocal(new Date()));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:30");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [distanceKm, setDistanceKm] = useState<string>("0");
  const [travelMinutes, setTravelMinutes] = useState<string>("0");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const workMinutes = useMemo(() => {
    const [sh, sm] = startTime.split(":").map((x) => Number(x));
    const [eh, em] = endTime.split(":").map((x) => Number(x));
    if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return Math.max(0, end - start);
  }, [startTime, endTime]);

  const monthHours = useMemo(() => {
    const month = workDate.slice(0, 7);
    const mins = entries
      .filter((e) => e.workDate.startsWith(month))
      .reduce((sum, e) => sum + e.workMinutes, 0);
    return mins;
  }, [entries, workDate]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/me");
        const j = (await r.json()) as unknown;
        if (typeof j === "object" && j !== null && "ok" in j) setMe(j as MeResponse);
        else setMe({ ok: false });
      } catch {
        setMe({ ok: false });
      }
    })();
  }, []);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const r = await fetch("/api/entries");
      const j = (await r.json()) as unknown;

      const list =
        typeof j === "object" && j !== null && "entries" in j && Array.isArray((j as { entries: unknown }).entries)
          ? ((j as { entries: WorkEntry[] }).entries ?? [])
          : [];

      setEntries(list);
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function saveEntry() {
    setError(null);
    const name = fullName.trim();
    if (!name) return setError("Bitte Mitarbeitername eingeben.");
    if (!activity.trim()) return setError("Bitte Tätigkeit eingeben.");

    setSaving(true);
    try {
      const payload = {
        fullName: name,
        workDate,
        startTime,
        endTime,
        activity: activity.trim(),
        location: location.trim(),
        distanceKm: Number(distanceKm.replace(",", ".")) || 0,
        travelMinutes: Number(travelMinutes) || 0,
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

      setActivity("");
      setLocation("");
      setDistanceKm("0");
      setTravelMinutes("0");

      await loadEntries();
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

  /** ✅ statt "sortedEntries" jetzt Gruppen nach Monat/Jahr */
  const groupedEntries = useMemo(() => groupByMonthYear(entries), [entries]);

  /** optional: aktuellen Monat standardmäßig offen */
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">Arbeitsstunden (Monat)</div>
            <div className="big">{(monthHours / 60).toFixed(1)}h</div>
            <div className="small">Soll: 160h</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>⏱</div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">Einträge gesamt</div>
            <div className="big">{entries.length}</div>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 22 }}>▦</div>
        </div>
      </div>

      <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>＋</span> Stunden erfassen
        </div>

        {error && (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div className="label">Mitarbeitername</div>
          <input
            className="input"
            placeholder="Vor- und Nachname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Datum</div>
            <input className="input" type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          </div>
          <div />
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Beginn</div>
            <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <div className="label">Ende</div>
            <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: "rgba(184, 207, 58, 0.20)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ color: "var(--muted)" }}>Arbeitszeit (berechnet)</div>
            <div style={{ fontWeight: 900, color: "var(--accent)" }}>{(workMinutes / 60).toFixed(2)} Std.</div>
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

        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Entfernung (km)</div>
            <input className="input" inputMode="decimal" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
          </div>
          <div>
            <div className="label">Fahrzeit (Min.)</div>
            <input className="input" inputMode="numeric" value={travelMinutes} onChange={(e) => setTravelMinutes(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setActivity("");
              setLocation("");
              setDistanceKm("0");
              setTravelMinutes("0");
            }}
          >
            Abbrechen
          </button>
          <button className="btn btn-accent" type="button" onClick={saveEntry} disabled={saving}>
            {saving ? "Speichert..." : "Eintrag speichern"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Alle Einträge</div>

        {loadingEntries ? (
          <div style={{ color: "var(--muted)" }}>Lade...</div>
        ) : groupedEntries.length === 0 ? (
          <div className="card" style={{ padding: 18, textAlign: "center", color: "var(--muted)" }}>
            <div style={{ fontSize: 40, opacity: 0.55 }}>🕒</div>
            Noch keine Einträge vorhanden
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {groupedEntries.map((g) => (
              <details
                key={g.key}
                open={g.key === currentMonthKey}
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
                    {g.label}
                    <span style={{ opacity: 0.7, fontWeight: 600, marginLeft: 8 }}>({g.entries.length})</span>
                  </div>

                  <div style={{ opacity: 0.7, fontSize: 12 }}>Ein-/Ausklappen</div>
                </summary>

                <div className="entry-grid" style={{ padding: "0 0 12px 0" }}>
                  {g.entries.map((e) => {
                    const hasDistance = Number(e.distanceKm) > 0;
                    const hasTravel = e.travelMinutes > 0;

                    return (
                      <div key={e.id} className="entry-card" style={{ margin: "0 12px" }}>
                        <div className="entry-accent" />
                        <div className="entry-content">
                          <div className="entry-top">
                            <div className="entry-title">
                              <div className="entry-name">{e.user?.fullName ?? "Unbekannt"}</div>
                              <div className="entry-sub">
                                <span>{formatDateDE(e.workDate)}</span>
                                <span className="entry-dot">•</span>
                                <span>
                                  {e.startTime}–{e.endTime} Uhr
                                </span>
                              </div>
                            </div>

                            <div className="entry-actions">
                              <div className="entry-hours">
                                <span className="entry-hours-number">{formatHoursDE(e.workMinutes)}</span>
                                <span className="entry-hours-unit">h</span>
                              </div>

                              <button className="icon-btn danger" onClick={() => deleteEntry(e.id)} aria-label="Löschen">
                                🗑
                              </button>
                            </div>
                          </div>

                          <div className="entry-body">
                            <div className="entry-line">
                              <span className="entry-icon">🧱</span>
                              <span className="entry-text">{e.activity}</span>
                            </div>

                            {e.location ? (
                              <div className="entry-line">
                                <span className="entry-icon">📍</span>
                                <span className="entry-text">{e.location}</span>
                              </div>
                            ) : null}

                            {hasDistance || hasTravel ? (
                              <div className="entry-chips">
                                {hasDistance ? <span className="chip">🚗 {e.distanceKm} km</span> : null}
                                {hasTravel ? <span className="chip">⏱ {e.travelMinutes} Min</span> : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}