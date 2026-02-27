"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type CalendarDay = {
  date: string; // YYYY-MM-DD
  hasWork: boolean;
  hasVacation: boolean;
  hasSick: boolean;
};

type CalendarResponse = { ok: true; days: CalendarDay[] } | { ok: false; error: string };

type AbsenceType = "VACATION" | "SICK";

function monthKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function addMonths(d: Date, diff: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + diff);
  return x;
}

export default function KalenderPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [absenceStart, setAbsenceStart] = useState<string>("");
  const [absenceEnd, setAbsenceEnd] = useState<string>("");
  const [absenceType, setAbsenceType] = useState<AbsenceType>("VACATION");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => monthKey(cursor), [cursor]);
  const title = useMemo(() => {
    const m = cursor.toLocaleString("de-DE", { month: "long" });
    return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${cursor.getFullYear()}`;
  }, [cursor]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/calendar?month=${encodeURIComponent(ym)}`);
      const j = (await r.json()) as unknown;

      const parsed: CalendarResponse =
        typeof j === "object" && j !== null && "ok" in j
          ? (j as CalendarResponse)
          : { ok: false, error: "Unerwartete Antwort." };

      if (parsed.ok) setData(parsed.days);
      else setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  const dayMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);

  // Kalender Grid (Mo-So)
  const grid = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);

    // Monday-first: JS Sunday=0 -> shift
    const firstDay = (first.getDay() + 6) % 7; // 0=Mo
    const daysInMonth = last.getDate();

    const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];

    for (let i = 0; i < firstDay; i++) cells.push({ date: "", day: 0, inMonth: false });

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, "0");
      const date = `${ym}-${dd}`;
      cells.push({ date, day: d, inMonth: true });
    }

    // fill to 6 rows
    while (cells.length < 42) cells.push({ date: "", day: 0, inMonth: false });

    return cells;
  }, [ym]);

  function openDay(date: string) {
    setSelectedDate(date);
    setAbsenceStart(date);
    setAbsenceEnd(date);
    setAbsenceType("VACATION");
    setError(null);
    setOpen(true);
  }

async function saveAbsence() {
  setError(null);

  if (!absenceStart || !absenceEnd) {
    setError("Bitte Start- und Enddatum auswählen.");
    return;
  }

  setSaving(true);
  try {
    const r = await fetch("/api/absences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: absenceStart,
        endDate: absenceEnd,
        type: absenceType,
      }),
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

    setOpen(false);
    await load();
  } catch {
    setError("Netzwerkfehler beim Speichern.");
  } finally {
    setSaving(false);
  }
}

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="card card-olive" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <button className="btn" onClick={() => setCursor((d) => addMonths(d, -1))}>‹</button>
          <div style={{ fontWeight: 900, fontSize: 20 }}>{title}</div>
          <button className="btn" onClick={() => setCursor((d) => addMonths(d, 1))}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
            <div key={w} style={{ color: "var(--muted-2)", fontSize: 12, textAlign: "center" }}>{w}</div>
          ))}

          {loading ? (
            <div style={{ gridColumn: "1 / -1", color: "var(--muted)" }}>Lade Kalender...</div>
          ) : (
            grid.map((c, idx) => {
              const info = c.inMonth && c.date ? dayMap.get(c.date) : undefined;

              const border =
                info?.hasSick ? "rgba(224, 75, 69, 0.65)" :
                info?.hasVacation ? "rgba(90, 167, 255, 0.65)" :
                info?.hasWork ? "rgba(184, 207, 58, 0.65)" :
                "var(--border)";

              const bg =
                info?.hasSick ? "rgba(224, 75, 69, 0.18)" :
                info?.hasVacation ? "rgba(90, 167, 255, 0.14)" :
                info?.hasWork ? "rgba(184, 207, 58, 0.10)" :
                "rgba(255,255,255,0.02)";

              return (
                <button
                  key={idx}
                  className="card"
                  disabled={!c.inMonth}
                  onClick={() => c.inMonth && c.date && openDay(c.date)}
                  style={{
                    height: 78,
                    borderColor: border,
                    background: bg,
                    borderRadius: 16,
                    opacity: c.inMonth ? 1 : 0.25,
                    cursor: c.inMonth ? "pointer" : "default",
                    textAlign: "left",
                    padding: 10,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{c.inMonth ? c.day : ""}</div>
                </button>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, color: "var(--muted)" }}>
          <div><span className="badge-dot dot-work" /> Arbeit</div>
          <div><span className="badge-dot dot-vac" /> Urlaub</div>
          <div><span className="badge-dot dot-sick" /> Krank</div>
        </div>
      </div>

      <Modal
        open={open}
        title={selectedDate ? new Date(selectedDate).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Tag"}
        onClose={() => setOpen(false)}
      >
        {error && (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
  <div className="label">Abwesenheit eintragen</div>

  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
    <div>
      <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>Start</div>
      <input
        className="input"
        type="date"
        value={absenceStart}
        onChange={(e) => setAbsenceStart(e.target.value)}
      />
    </div>

    <div>
      <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>Ende</div>
      <input
        className="input"
        type="date"
        value={absenceEnd}
        onChange={(e) => setAbsenceEnd(e.target.value)}
      />
    </div>
  </div>
</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <button
            className={`btn ${absenceType === "VACATION" ? "btn-accent" : ""}`}
            type="button"
            onClick={() => setAbsenceType("VACATION")}
          >
            🌴 Urlaub
          </button>
          <button
            className={`btn ${absenceType === "SICK" ? "btn-danger" : ""}`}
            type="button"
            onClick={() => setAbsenceType("SICK")}
          >
            🤒 Krank
          </button>
        </div>

        <button className="btn btn-accent" type="button" onClick={saveAbsence} disabled={saving} style={{ width: "100%" }}>
          {saving ? "Speichert..." : "Eintragen"}
        </button>
      </Modal>
    </AppShell>
  );
}