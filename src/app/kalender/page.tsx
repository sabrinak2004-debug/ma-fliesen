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

type AbsenceDTO = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: AbsenceType;
  user: { id: string; fullName: string };
};

type PlanEntry = {
  id: string;
  userId: string;
  workDate: string;
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;
  noteEmployee?: string | null;
};

type AbsenceBlock = {
  type: AbsenceType;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  idsByDate: Record<string, string>; // date -> absence id
};

type SessionDTO = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

type MeApiResponse = { session: SessionDTO | null };

// ---------- helpers (no any) ----------
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function getBooleanField(obj: Record<string, unknown>, key: string): boolean | null {
  const v = obj[key];
  return typeof v === "boolean" ? v : null;
}

function isAbsenceType(v: unknown): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function isCalendarDay(v: unknown): v is CalendarDay {
  if (!isRecord(v)) return false;
  const date = getStringField(v, "date");
  const hasWork = getBooleanField(v, "hasWork");
  const hasVacation = getBooleanField(v, "hasVacation");
  const hasSick = getBooleanField(v, "hasSick");
  const hasPlan = getBooleanField(v, "hasPlan");
  const planPreviewRaw = v["planPreview"];
  const planPreview = planPreviewRaw === null || typeof planPreviewRaw === "string" ? planPreviewRaw : undefined;

  return (
    typeof date === "string" &&
    typeof hasWork === "boolean" &&
    typeof hasVacation === "boolean" &&
    typeof hasSick === "boolean" &&
    typeof hasPlan === "boolean" &&
    (planPreview === null || typeof planPreview === "string")
  );
}

function parseCalendarResponse(j: unknown): CalendarResponse {
  if (!isRecord(j)) return { ok: false, error: "Unerwartete Antwort." };

  const okVal = j["ok"];
  if (okVal === true) {
    const days = j["days"];
    if (!Array.isArray(days)) return { ok: false, error: "Unerwartete Antwort." };
    const parsedDays = days.filter(isCalendarDay);
    return { ok: true, days: parsedDays };
  }

  const err = j["error"];
  if (typeof err === "string" && err.trim()) return { ok: false, error: err };
  return { ok: false, error: "Unerwartete Antwort." };
}

function isAbsenceDTO(v: unknown): v is AbsenceDTO {
  if (!isRecord(v)) return false;
  const id = getStringField(v, "id");
  const absenceDate = getStringField(v, "absenceDate");
  const type = v["type"];
  const user = v["user"];

  if (!id || !absenceDate || !isAbsenceType(type)) return false;
  if (!isRecord(user)) return false;
  const uid = getStringField(user, "id");
  const fullName = getStringField(user, "fullName");
  return !!uid && !!fullName;
}

function parseAbsencesResponse(j: unknown): AbsenceDTO[] {
  if (!isRecord(j)) return [];
  const abs = j["absences"];
  if (!Array.isArray(abs)) return [];
  return abs.filter(isAbsenceDTO);
}

function isPlanEntry(v: unknown): v is PlanEntry {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const userId = getStringField(v, "userId");
  const workDate = getStringField(v, "workDate");
  const startHHMM = getStringField(v, "startHHMM");
  const endHHMM = getStringField(v, "endHHMM");
  const activity = getStringField(v, "activity");
  const location = getStringField(v, "location");

  const travelRaw = v["travelMinutes"];
  const travelMinutes = typeof travelRaw === "number" ? travelRaw : null;

  const noteRaw = v["noteEmployee"];
  const noteEmployee = noteRaw === null || typeof noteRaw === "string" ? noteRaw : undefined;

  return (
    typeof id === "string" &&
    typeof userId === "string" &&
    typeof workDate === "string" &&
    typeof startHHMM === "string" &&
    typeof endHHMM === "string" &&
    typeof activity === "string" &&
    typeof location === "string" &&
    typeof travelMinutes === "number" &&
    (noteEmployee === undefined || noteEmployee === null || typeof noteEmployee === "string")
  );
}

function parsePlanEntriesResponse(j: unknown): PlanEntry[] {
  if (!isRecord(j)) return [];
  const entries = j["entries"];
  if (!Array.isArray(entries)) return [];
  return entries.filter(isPlanEntry);
}

function isSessionDTO(v: unknown): v is SessionDTO {
  if (!isRecord(v)) return false;
  const userId = getStringField(v, "userId");
  const fullName = getStringField(v, "fullName");
  const role = getStringField(v, "role");
  return typeof userId === "string" && typeof fullName === "string" && (role === "ADMIN" || role === "EMPLOYEE");
}

function parseMeResponse(j: unknown): SessionDTO | null {
  if (!isRecord(j)) return null;
  const session = j["session"];
  if (session === null) return null;
  return isSessionDTO(session) ? session : null;
}

// ---------- date helpers ----------
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

function dateInRange(date: string, start: string, end: string) {
  return start <= date && date <= end;
}

function buildBlocks(absences: AbsenceDTO[]): AbsenceBlock[] {
  const rows = absences
    .slice()
    .sort((x, y) => (x.absenceDate < y.absenceDate ? -1 : x.absenceDate > y.absenceDate ? 1 : 0));

  const blocks: AbsenceBlock[] = [];

  const byType: Record<AbsenceType, AbsenceDTO[]> = { VACATION: [], SICK: [] };
  for (const r of rows) byType[r.type].push(r);

  (Object.keys(byType) as AbsenceType[]).forEach((type) => {
    const list = byType[type];
    if (list.length === 0) return;

    let curStart = list[0].absenceDate;
    let curEnd = list[0].absenceDate;
    let idsByDate: Record<string, string> = { [list[0].absenceDate]: list[0].id };

    for (let i = 1; i < list.length; i++) {
      const d = list[i].absenceDate;
      const expectedNext = addDaysYMD(curEnd, 1);
      idsByDate[d] = list[i].id;

      if (d === expectedNext) {
        curEnd = d;
      } else {
        blocks.push({ type, start: curStart, end: curEnd, idsByDate });
        curStart = d;
        curEnd = d;
        idsByDate = { [d]: list[i].id };
      }
    }
    blocks.push({ type, start: curStart, end: curEnd, idsByDate });
  });

  blocks.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : a.type.localeCompare(b.type)));
  return blocks;
}

function blockLabel(b: AbsenceBlock) {
  const icon = b.type === "VACATION" ? "🌴" : "🤒";
  const name = b.type === "VACATION" ? "Urlaub" : "Krank";
  const span = b.start === b.end ? b.start : `${b.start}–${b.end}`;
  return `${icon} ${name} (${span})`;
}

function extractErrorMessage(j: unknown, fallback: string) {
  if (!isRecord(j)) return fallback;
  const e = j["error"];
  return typeof e === "string" && e.trim() ? e : fallback;
}

export default function KalenderPage() {
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<SessionDTO | null>(null);

  const [monthAbsences, setMonthAbsences] = useState<AbsenceDTO[]>([]);
  const [absLoading, setAbsLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [dayPlans, setDayPlans] = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [absenceStart, setAbsenceStart] = useState<string>("");
  const [absenceEnd, setAbsenceEnd] = useState<string>("");
  const [absenceType, setAbsenceType] = useState<AbsenceType>("VACATION");

  const [editingBlock, setEditingBlock] = useState<AbsenceBlock | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => monthKey(cursor), [cursor]);

  const title = useMemo(() => {
    const m = cursor.toLocaleString("de-DE", { month: "long" });
    return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${cursor.getFullYear()}`;
  }, [cursor]);

  // Session laden (für Admin: Absences mit userId filtern)
  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!alive) return;
        const s = parseMeResponse(j);
        setSession(s);
      })
      .catch(() => setSession(null));
    return () => {
      alive = false;
    };
  }, []);

  async function loadCalendar() {
    setLoading(true);
    try {
      const r = await fetch(`/api/calendar?month=${encodeURIComponent(ym)}`);
      const j: unknown = await r.json();
      const parsed = parseCalendarResponse(j);
      if (parsed.ok) setData(parsed.days);
      else setData([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAbsencesMonth() {
    setAbsLoading(true);
    try {
      const qs = new URLSearchParams({ month: ym });

      // ✅ Admin-Kalender: nur eigene Abwesenheiten laden
      if (session?.role === "ADMIN" && session.userId) {
        qs.set("userId", session.userId);
      }

      const r = await fetch(`/api/absences?${qs.toString()}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setMonthAbsences([]);
        return;
      }

      setMonthAbsences(parseAbsencesResponse(j));
    } finally {
      setAbsLoading(false);
    }
  }

  async function reloadMonthAll() {
    await Promise.all([loadCalendar(), loadAbsencesMonth()]);
  }

  useEffect(() => {
    void reloadMonthAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, session?.role, session?.userId]);

  const dayMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);
  const blocks = useMemo(() => buildBlocks(monthAbsences), [monthAbsences]);

  const blocksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return blocks.filter((b) => dateInRange(selectedDate, b.start, b.end));
  }, [blocks, selectedDate]);

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
        setPlansError(extractErrorMessage(j, "Plan konnte nicht geladen werden."));
        return;
      }

      setDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setDayPlans([]);
      setPlansError("Netzwerkfehler beim Laden des Plans.");
    } finally {
      setPlansLoading(false);
    }
  }

  function openDay(date: string) {
    setSelectedDate(date);

    setEditingBlock(null);
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

  function startEdit(block: AbsenceBlock) {
    setEditingBlock(block);
    setAbsenceStart(block.start);
    setAbsenceEnd(block.end);
    setAbsenceType(block.type);
    setError(null);
  }

  function cancelEdit() {
    setEditingBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
      setAbsenceType("VACATION");
    }
    setError(null);
  }

  async function saveAbsence() {
    setError(null);

    if (!absenceStart || !absenceEnd) {
      setError("Bitte Start- und Enddatum auswählen.");
      return;
    }
    if (absenceEnd < absenceStart) {
      setError("Ende darf nicht vor Start liegen.");
      return;
    }

    setSaving(true);
    try {
      if (editingBlock) {
        const r = await fetch("/api/absences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: editingBlock.start,
            to: editingBlock.end,
            type: editingBlock.type,
            newStartDate: absenceStart,
            newEndDate: absenceEnd,
            newType: absenceType,
          }),
        });

        const j: unknown = await r.json();
        if (!r.ok) {
          setError(extractErrorMessage(j, "Speichern fehlgeschlagen."));
          return;
        }

        await reloadMonthAll();
        setEditingBlock(null);
        return;
      }

      const r = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: absenceStart, endDate: absenceEnd, type: absenceType }),
      });

      const j: unknown = await r.json();
      if (!r.ok) {
        setError(extractErrorMessage(j, "Speichern fehlgeschlagen."));
        return;
      }

      setOpen(false);
      await reloadMonthAll();
    } catch {
      setError("Netzwerkfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock(block: AbsenceBlock) {
    setError(null);
    setSaving(true);
    try {
      const qs = new URLSearchParams({
        from: block.start,
        to: block.end,
        type: block.type,
      });

      const r = await fetch(`/api/absences?${qs.toString()}`, { method: "DELETE" });
      const j: unknown = await r.json();

      if (!r.ok) {
        setError(extractErrorMessage(j, "Löschen fehlgeschlagen."));
        return;
      }

      await reloadMonthAll();

      if (editingBlock && editingBlock.type === block.type && editingBlock.start === block.start && editingBlock.end === block.end) {
        cancelEdit();
      }
    } catch {
      setError("Netzwerkfehler beim Löschen.");
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
          {absLoading ? <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>Abwesenheiten laden…</div> : null}
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

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn btn-accent"
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        window.location.href = `/kalender/dokumente/${encodeURIComponent(p.id)}`;
                      }}
                    >
                      📎 Dokumente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div className="label">Deine Abwesenheit</div>

            {blocksForSelectedDay.length === 0 ? (
              <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                Keine Abwesenheit eingetragen.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {blocksForSelectedDay.map((b) => (
                  <div key={`${b.type}-${b.start}-${b.end}`} className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 900 }}>{blockLabel(b)}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="btn" type="button" onClick={() => startEdit(b)} disabled={saving}>
                        ✏️ Bearbeiten
                      </button>
                      <button className="btn btn-danger" type="button" onClick={() => void deleteBlock(b)} disabled={saving}>
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "var(--border)", marginTop: 14, opacity: 0.7 }} />
        </div>

        {error && (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div className="label">{editingBlock ? "Abwesenheit bearbeiten" : "Abwesenheit eintragen"}</div>

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

        {editingBlock ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="btn" type="button" onClick={cancelEdit} disabled={saving} style={{ width: "100%" }}>
              Abbrechen
            </button>
            <button className="btn btn-accent" type="button" onClick={saveAbsence} disabled={saving} style={{ width: "100%" }}>
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </div>
        ) : (
          <button className="btn btn-accent" type="button" onClick={saveAbsence} disabled={saving} style={{ width: "100%" }}>
            {saving ? "Speichert..." : "Eintragen"}
          </button>
        )}
      </Modal>
    </AppShell>
  );
}