// src/app/admin/wochenplan/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type User = { id: string; fullName: string };

/**
 * Admin-Wochenplan = PLAN-Einträge (keine Zeiterfassung!)
 * -> wird in /api/admin/plan-entries gelesen/geschrieben/gelöscht
 *
 * Erwartete Felder vom Backend:
 * - id, userId, workDate (ISO), startHHMM, endHHMM, activity, location, travelMinutes
 * - optional: user { id, fullName }
 */
type PlanEntry = {
  id: string;
  userId: string;
  workDate: string; // ISO
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;
  // falls du das mitlieferst (wie bisher)
  user?: { id: string; fullName: string };
};

const ROWS = [
  { label: "Montag", offset: 0, type: "DAY" as const },
  { label: "Dienstag", offset: 1, type: "DAY" as const },
  { label: "Mittwoch", offset: 2, type: "DAY" as const },
  { label: "Donnerstag", offset: 3, type: "DAY" as const },
  { label: "Freitag", offset: 4, type: "DAY" as const },
  { label: "Samstag", offset: 5, type: "DAY" as const },
  { label: "Rep. Arbeiten", offset: null, type: "SPECIAL" as const, tag: "REP" },
  { label: "Subunternehmer", offset: null, type: "SPECIAL" as const, tag: "SUB" },
];

// Dark/Green Theme UI (passt zum Look deines Portals)
const UI = {
  tableBg: "rgba(0,0,0,0.22)",
  headerBg: "rgba(0,0,0,0.38)",
  leftBg: "rgba(0,0,0,0.45)",
  cellBorder: "rgba(255,255,255,0.10)",
  cardBg: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.14)",
  addBg: "rgba(255,255,255,0.05)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mo=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fmtYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Sonntag = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

function fmtDE(d: Date) {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDEshort(d: Date) {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function ymdFromISO(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function AdminWochenplanPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    userId: "",
    rowLabel: "",
    specialTag: "" as "" | "REP" | "SUB",
    dateYMD: "",
    startHHMM: "07:00",
    endHHMM: "16:00",
    activity: "",
    location: "",
    travelMinutes: 0,
  });

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);

    const kw = getISOWeek(weekStart);

    return {
      kw,
      dateRange: `${fmtDEshort(weekStart)} – ${fmtDE(end)}`,
    };
  }, [weekStart]);

  async function loadData() {
    setLoading(true);

    const [uRes, eRes] = await Promise.all([
      fetch("/api/admin/users"),
      // ✅ Admin-WOCHENPLAN liest Plan-Einträge (nicht WorkEntries)
      fetch(`/api/admin/plan-entries?weekStart=${fmtYMD(weekStart)}`),
    ]);

    if (uRes.status === 403 || eRes.status === 403) {
      setLoading(false);
      alert("Kein Zugriff (Admin benötigt).");
      return;
    }

    const uJson = await uRes.json();
    const eJson = await eRes.json();

    setUsers(uJson.users ?? []);
    setEntries(eJson.entries ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  // Grid-Mapping (wie Spreadsheet)
  const gridMap = useMemo(() => {
    const m = new Map<string, PlanEntry[]>();

    for (const e of entries) {
      const dayKey = ymdFromISO(e.workDate);

      const trimmed = (e.activity ?? "").trim().toUpperCase();
      let rowKey = dayKey;
      if (trimmed.startsWith("REP:")) rowKey = "REP";
      if (trimmed.startsWith("SUB:")) rowKey = "SUB";

      const key = `${rowKey}_${e.userId}`;
      m.set(key, [...(m.get(key) ?? []), e]);
    }

    return m;
  }, [entries]);

  function openCreate(userId: string, row: (typeof ROWS)[number]) {
    const date =
      row.type === "DAY"
        ? new Date(
            weekStart.getFullYear(),
            weekStart.getMonth(),
            weekStart.getDate() + (row.offset ?? 0)
          )
        : weekStart;

    setEditId(null);
    setForm({
      userId,
      rowLabel: row.label,
      specialTag: row.type === "SPECIAL" ? (row.tag as "REP" | "SUB") : "",
      dateYMD: fmtYMD(date),
      startHHMM: "07:00",
      endHHMM: "16:00",
      activity: row.type === "SPECIAL" ? `${row.tag}: ` : "",
      location: "",
      travelMinutes: 0,
    });
    setModalOpen(true);
  }

  function openEdit(entry: PlanEntry, row: (typeof ROWS)[number]) {
    const isRep = (entry.activity ?? "").trim().toUpperCase().startsWith("REP:");
    const isSub = (entry.activity ?? "").trim().toUpperCase().startsWith("SUB:");

    setEditId(entry.id);
    setForm({
      userId: entry.userId,
      rowLabel: row.label,
      specialTag: isRep ? "REP" : isSub ? "SUB" : "",
      dateYMD: ymdFromISO(entry.workDate),
      startHHMM: entry.startHHMM || "07:00",
      endHHMM: entry.endHHMM || "16:00",
      activity: entry.activity ?? "",
      location: entry.location ?? "",
      travelMinutes: entry.travelMinutes ?? 0,
    });
    setModalOpen(true);
  }

  async function save() {
    const payload = {
      id: editId ?? undefined,
      userId: form.userId,
      workDate: form.dateYMD,
      startHHMM: form.startHHMM,
      endHHMM: form.endHHMM,
      activity: form.activity,
      location: form.location,
      travelMinutes: Number(form.travelMinutes || 0),
    };

    // ✅ Admin-WOCHENPLAN schreibt Plan-Einträge (nicht WorkEntries)
    const res = await fetch("/api/admin/plan-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Speichern fehlgeschlagen: ${err?.error ?? "unknown"}`);
      return;
    }

    setModalOpen(false);
    await loadData();
  }

  async function remove() {
    if (!editId) return;

    // ✅ Admin-WOCHENPLAN löscht Plan-Einträge (nicht WorkEntries)
    const res = await fetch(`/api/admin/plan-entries?id=${editId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Löschen fehlgeschlagen");
      return;
    }

    setModalOpen(false);
    await loadData();
  }

  return (
    <div style={{ padding: 14 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 14,
          color: UI.text,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Wochenplanung</div>

          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>KW {weekLabel.kw}</div>
            <div style={{ color: UI.muted, fontSize: 13 }}>{weekLabel.dateRange}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href="/erfassung"
            className="pill"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            ⟵ Home
          </Link>

          <button
            className="pill"
            onClick={() =>
              setWeekStart((w) => {
                const d = new Date(w);
                d.setDate(d.getDate() - 7);
                return d;
              })
            }
          >
            ← Woche
          </button>

          <input
            type="date"
            value={fmtYMD(weekStart)}
            onChange={(e) => setWeekStart(startOfWeek(new Date(e.target.value)))}
            style={{
              padding: "8px 10px",
              border: `1px solid ${UI.cellBorder}`,
              borderRadius: 10,
              background: "rgba(0,0,0,0.25)",
              color: UI.text,
            }}
          />

          <button
            className="pill"
            onClick={() =>
              setWeekStart((w) => {
                const d = new Date(w);
                d.setDate(d.getDate() + 7);
                return d;
              })
            }
          >
            Woche →
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: UI.muted }}>lädt…</div>
      ) : (
        <div
          style={{
            overflow: "auto",
            border: `1px solid ${UI.cellBorder}`,
            borderRadius: 14,
            background: UI.tableBg,
            backdropFilter: "blur(8px)",
          }}
        >
          <table style={{ borderCollapse: "collapse", minWidth: 1200, width: "100%" }}>
            <thead>
              <tr style={{ background: UI.headerBg }}>
                <th
                  style={{
                    border: `1px solid ${UI.cellBorder}`,
                    padding: 12,
                    width: 180,
                    textAlign: "left",
                  }}
                ></th>

                {users.map((u) => (
                  <th
                    key={u.id}
                    style={{
                      border: `1px solid ${UI.cellBorder}`,
                      padding: 12,
                      textAlign: "left",
                      fontWeight: 900,
                      color: UI.text,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.fullName}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row) => {
                const rowKey =
                  row.type === "DAY"
                    ? fmtYMD(
                        new Date(
                          weekStart.getFullYear(),
                          weekStart.getMonth(),
                          weekStart.getDate() + (row.offset ?? 0)
                        )
                      )
                    : (row.tag as string);

                return (
                  <tr key={row.label}>
                    <td
                      style={{
                        border: `1px solid ${UI.cellBorder}`,
                        padding: 12,
                        background: UI.leftBg,
                        fontWeight: 900,
                        color: UI.text,
                        verticalAlign: "top",
                        width: 180,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.label}
                    </td>

                    {users.map((u) => {
                      const key = `${rowKey}_${u.id}`;
                      const cellEntries = gridMap.get(key) ?? [];

                      return (
                        <td
                          key={key}
                          style={{
                            border: `1px solid ${UI.cellBorder}`,
                            padding: 10,
                            verticalAlign: "top",
                          }}
                        >
                          <div
                            style={{
                              minHeight: 74,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {cellEntries.map((e) => (
                              <div
                                key={e.id}
                                onClick={() => openEdit(e, row)}
                                style={{
                                  border: `1px solid ${UI.cardBorder}`,
                                  borderRadius: 10,
                                  padding: "10px 12px",
                                  cursor: "pointer",
                                  background: UI.cardBg,
                                  color: UI.text,
                                }}
                                title="Zum Bearbeiten klicken"
                              >
                                {/* Name im UI sichtbar (Backend bleibt relation über e.user) */}
                                <div style={{ fontWeight: 900, fontSize: 13 }}>
                                  {e.user?.fullName ? `${e.user.fullName}: ` : ""}
                                  {e.activity}
                                </div>

                                {(e.location || e.startHHMM || e.endHHMM) && (
                                  <div style={{ fontSize: 12, color: UI.muted, marginTop: 4 }}>
                                    {e.startHHMM}–{e.endHHMM}
                                    {e.location ? ` · ${e.location}` : ""}
                                  </div>
                                )}
                              </div>
                            ))}

                            <button
                              onClick={() => openCreate(u.id, row)}
                              style={{
                                border: `1px dashed ${UI.cardBorder}`,
                                borderRadius: 10,
                                padding: "8px 12px",
                                background: UI.addBg,
                                cursor: "pointer",
                                textAlign: "left",
                                color: UI.muted,
                              }}
                            >
                              + Eintragen
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              background: "rgba(0,0,0,0.55)",
              border: `1px solid ${UI.cellBorder}`,
              borderRadius: 16,
              padding: 16,
              backdropFilter: "blur(10px)",
              color: UI.text,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>
                  {editId ? "Eintrag bearbeiten" : "Eintrag anlegen"}
                </div>
                <div style={{ fontSize: 13, color: UI.muted }}>
                  {form.rowLabel} · {users.find((x) => x.id === form.userId)?.fullName ?? ""}
                </div>
              </div>
              <button className="pill" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Datum</div>
                <input
                  type="date"
                  value={form.dateYMD}
                  onChange={(e) => setForm((p) => ({ ...p, dateYMD: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Mitarbeiter</div>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id} style={{ color: "black" }}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Start</div>
                <input
                  value={form.startHHMM}
                  onChange={(e) => setForm((p) => ({ ...p, startHHMM: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Ende</div>
                <input
                  value={form.endHHMM}
                  onChange={(e) => setForm((p) => ({ ...p, endHHMM: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Tätigkeit</div>
                <input
                  value={form.activity}
                  onChange={(e) => setForm((p) => ({ ...p, activity: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                />
                {form.specialTag ? (
                  <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>
                    Lass den Prefix <b>{form.specialTag}:</b> stehen, sonst erscheint es nicht in der Spezial-Zeile.
                  </div>
                ) : null}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Ort</div>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Fahrzeit (Minuten)</div>
                <input
                  type="number"
                  value={form.travelMinutes}
                  onChange={(e) => setForm((p) => ({ ...p, travelMinutes: Number(e.target.value) }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              {editId ? (
                <button className="pill" onClick={remove}>
                  Löschen
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="pill" onClick={() => setModalOpen(false)}>
                  Abbrechen
                </button>
                <button className="pill pill-active" onClick={save}>
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}