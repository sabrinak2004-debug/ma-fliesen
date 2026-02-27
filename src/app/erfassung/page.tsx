"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";

type MeResponse =
  | { ok: true; user: { id: string; fullName: string; role: "ADMIN" | "EMPLOYEE" } }
  | { ok: false };

type EntryUser = { id: string; fullName: string };

type WorkEntry = {
  id: string;
  workDate: string;     // YYYY-MM-DD
  startTime: string;    // HH:MM:SS
  endTime: string;      // HH:MM:SS
  activity: string;
  location: string;
  distanceKm: string;   // Decimal kommt als string
  travelMinutes: number;
  workMinutes: number;
  user: EntryUser;
};

function minutesToHoursString(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const mm = String(m).padStart(2, "0");
  return `${h}.${Math.round((m / 60) * 10)}h`.replace(".0h", ".0h"); // optisch wie Prototype (z.B. 8.5h)
}

function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ErfassungPage() {
  const [me, setMe] = useState<MeResponse | null>(null);

  const [fullName, setFullName] = useState("");
  const [workDate, setWorkDate] = useState<string>(() => toIsoDate(new Date()));
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
    // einfache Berechnung (HH:MM)
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
      const r = await fetch("/api/me");
      const j = (await r.json()) as unknown;
      if (typeof j === "object" && j !== null && "ok" in j) setMe(j as MeResponse);
      else setMe({ ok: false });
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
        workDate,          // YYYY-MM-DD
        startTime,         // HH:MM
        endTime,           // HH:MM
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

      // reset wie Prototype: Tätigkeit/Ort leer lassen, Zeiten bleiben
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
          <input className="input" placeholder="Vor- und Nachname" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
            <div style={{ fontWeight: 900, color: "var(--accent)" }}>
              {(workMinutes / 60).toFixed(2)} Std.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">Ausgeführte Tätigkeit</div>
          <textarea className="textarea" placeholder="z.B. Fliesen verlegen, Verfugen..." value={activity} onChange={(e) => setActivity(e.target.value)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">Einsatzort</div>
          <input className="input" placeholder="z.B. Musterstraße 5, München" value={location} onChange={(e) => setLocation(e.target.value)} />
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
          <button className="btn" type="button" onClick={() => {
            setActivity("");
            setLocation("");
            setDistanceKm("0");
            setTravelMinutes("0");
          }}>
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
        ) : entries.length === 0 ? (
          <div className="card" style={{ padding: 18, textAlign: "center", color: "var(--muted)" }}>
            <div style={{ fontSize: 40, opacity: 0.55 }}>🕒</div>
            Noch keine Einträge vorhanden
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {entries
              .slice()
              .sort((a, b) => (a.workDate < b.workDate ? 1 : -1))
              .map((e) => (
                <div key={e.id} className="list-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, textTransform: "lowercase" }}>
                        {e.user?.fullName ?? "unbekannt"} <span style={{ color: "var(--muted)" }}>· {e.workDate}</span>
                      </div>
                      <div style={{ color: "var(--muted)", marginTop: 6 }}>
                        🕘 {e.startTime.slice(0, 5)} – {e.endTime.slice(0, 5)} Uhr
                      </div>
                      <div style={{ color: "var(--muted)", marginTop: 6 }}>
                        🧱 {e.activity}
                      </div>
                      {e.location && (
                        <div style={{ color: "var(--muted)", marginTop: 6 }}>
                          📍 {e.location}
                        </div>
                      )}
                      <div style={{ color: "var(--muted-2)", marginTop: 10 }}>
                        {Number(e.distanceKm) > 0 ? `🚗 ${e.distanceKm} km` : ""}{" "}
                        {e.travelMinutes > 0 ? `   ⏱ Fahrzeit: ${e.travelMinutes} Min.` : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <div style={{ fontWeight: 900, color: "var(--accent)", fontSize: 18 }}>
                        {(e.workMinutes / 60).toFixed(1)}h
                      </div>
                      <button className="btn btn-danger" onClick={() => deleteEntry(e.id)} aria-label="Löschen">
                        🗑
                      </button>
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