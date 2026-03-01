"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

type CalendarDay = {
  date: string;
  hasWork: boolean;
  hasVacation: boolean;
  hasSick: boolean;

  hasPlan: boolean;
  planPreview: string | null;
};

type CalendarResponse = { ok: true; days: CalendarDay[] } | { ok: false; error: string };

type AbsenceType = "VACATION" | "SICK";

type PlanEntry = {
  id: string;
  userId: string;
  workDate: string;
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;

  // ✅ neu:
  noteEmployee?: string | null;
};

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

function addDaysYMD(ymd: string, diff: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + diff);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDateTitle(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function KalenderPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [dayPlans, setDayPlans] = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

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
      const j: unknown = await r.json();

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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  const dayMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);

  const grid = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);

    const firstDay = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: "", day: 0, inMonth: false });

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, "0");
      const date = `${ym}-${dd}`;
      cells.push({ date, day: d, inMonth: true });
    }

    while (cells.length < 42) cells.push({ date: "", day: 0, inMonth: false });
    return cells;
  }, [ym]);

  async function loadPlansForDay(date: string) {
    setPlansLoading(true);
    setPlansError(null);

    try {
      const to = addDaysYMD(date, 1);
      const r = await fetch(`/api/plan-entries?from=${encodeURIComponent(date)}&to=${encodeURIComponent(to)}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setDayPlans([]);
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : "Plan konnte nicht geladen werden.";
        setPlansError(msg);
        return;
      }

      const entries =
        typeof j === "object" &&
        j !== null &&
        "entries" in j &&
        Array.isArray((j as { entries: unknown }).entries)
          ? (j as { entries: PlanEntry[] }).entries
          : [];

      setDayPlans(entries);
    } catch {
      setDayPlans([]);
      setPlansError("Netzwerkfehler beim Laden des Plans.");
    } finally {
      setPlansLoading(false);
    }
  }

  function openDay(date: string) {
    setSelectedDate(date);

    setAbsenceStart(date);
    setAbsenceEnd(date);
    setAbsenceType("VACATION");
    setError(null);

    setDayPlans([]);
    setPlansError(null);
    setPlansLoading(false);

    setOpen(true);
    void loadPlansForDay(date);
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
        body: JSON.stringify({ startDate: absenceStart, endDate: absenceEnd, type: absenceType }),
      });

      const j: unknown = await r.json();

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
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
          <button className="btn" onClick={() => setCursor((d) => addMonths(d, -1))}>
            ‹
          </button>
          <div style={{ fontWeight: 900, fontSize: 20 }}>{title}</div>
          <button className="btn" onClick={() => setCursor((d) => addMonths(d, 1))}>
            ›
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
          {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
            <div key={w} style={{ color: "var(--muted-2)", fontSize: 12, textAlign: "center" }}>
              {w}
            </div>
          ))}

          {loading ? (
            <div style={{ gridColumn: "1 / -1", color: "var(--muted)" }}>Lade Kalender...</div>
          ) : (
            grid.map((c, idx) => {
              const info = c.inMonth && c.date ? dayMap.get(c.date) : undefined;

              const border =
                info?.hasSick
                  ? "rgba(224, 75, 69, 0.65)"
                  : info?.hasVacation
                  ? "rgba(90, 167, 255, 0.65)"
                  : info?.hasPlan
                  ? "rgba(184, 207, 58, 0.65)"
                  : "var(--border)";

              const bg =
                info?.hasSick
                  ? "rgba(224, 75, 69, 0.18)"
                  : info?.hasVacation
                  ? "rgba(90, 167, 255, 0.14)"
                  : info?.hasPlan
                  ? "rgba(184, 207, 58, 0.10)"
                  : "rgba(255,255,255,0.02)";

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

                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>{c.inMonth ? c.day : ""}</div>

                  {info?.hasPlan && info.planPreview ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        lineHeight: "14px",
                        color: "var(--muted)",

                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        minHeight: 0,
                      }}
                      title={info.planPreview}
                    >
                      {info.planPreview}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, color: "var(--muted)" }}>
          <div>
            <span className="badge-dot dot-work" /> Arbeit
          </div>
          <div>
            <span className="badge-dot dot-vac" /> Urlaub
          </div>
          <div>
            <span className="badge-dot dot-sick" /> Krank
          </div>
        </div>
      </div>

      <Modal open={open} title={selectedDate ? fmtDateTitle(selectedDate) : "Tag"} onClose={() => setOpen(false)}>
        <div style={{ marginBottom: 14 }}>
          <div className="label">Dein Einsatzplan</div>

          {plansLoading ? (
            <div className="card" style={{ padding: 12, opacity: 0.85 }}>
              Lädt Plan...
            </div>
          ) : plansError ? (
            <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}>
              <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{plansError}</span>
            </div>
          ) : dayPlans.length === 0 ? (
            <div className="card" style={{ padding: 12, opacity: 0.85 }}>
              Kein Einsatz für diesen Tag geplant.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dayPlans.map((p) => (
                <div key={p.id} className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 900 }}>
                    {p.startHHMM}–{p.endHHMM} · {p.activity}
                  </div>

                  <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                    {p.location ? `📍 ${p.location}` : "📍 (kein Ort angegeben)"}
                    {typeof p.travelMinutes === "number" && p.travelMinutes > 0 ? ` · 🚗 ${p.travelMinutes} Min Fahrzeit` : ""}
                  </div>

                  {p.noteEmployee ? (
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      📝 {p.noteEmployee}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: "var(--border)", marginTop: 14, opacity: 0.7 }} />
        </div>

        {error && (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div className="label">Abwesenheit eintragen</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                Start
              </div>
              <input className="input" type="date" value={absenceStart} onChange={(e) => setAbsenceStart(e.target.value)} />
            </div>

            <div>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                Ende
              </div>
              <input className="input" type="date" value={absenceEnd} onChange={(e) => setAbsenceEnd(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <button className={`btn ${absenceType === "VACATION" ? "btn-accent" : ""}`} type="button" onClick={() => setAbsenceType("VACATION")}>
            🌴 Urlaub
          </button>
          <button className={`btn ${absenceType === "SICK" ? "btn-danger" : ""}`} type="button" onClick={() => setAbsenceType("SICK")}>
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