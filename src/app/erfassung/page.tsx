"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";

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
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
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

function formatHM(minutes: number) {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}min`;
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

type EditForm = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: string;
  breakMinutes: string;
  userFullName: string; // ✅ nur Anzeige im Modal
};

function minutesBetween(startHHMM: string, endHHMM: string) {
  const [sh, sm] = startHHMM.split(":").map((x) => Number(x));
  const [eh, em] = endHHMM.split(":").map((x) => Number(x));
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return Math.max(0, end - start);
}
function legalBreakMinutes(grossMinutes: number): number {
  if (!Number.isFinite(grossMinutes) || grossMinutes <= 0) return 0;
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

function previewNetMinutes(grossMinutes: number, breakInput: string): { net: number; brk: number; auto: boolean } {
  const gross = Math.max(0, Math.round(grossMinutes));
  const inputNum = breakInput.trim() ? Number(breakInput) : 0;
  const valid = Number.isFinite(inputNum) ? inputNum : 0;

  if (valid <= 0) {
    const brk = legalBreakMinutes(gross);
    return { net: Math.max(0, gross - brk), brk, auto: true };
  }

  const brk = Math.min(Math.max(0, Math.round(valid)), gross);
  return { net: Math.max(0, gross - brk), brk, auto: false };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;
  const userId = v.userId;
  const fullName = v.fullName;
  const role = v.role;
  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN")
  );
}

type MeApiResponse = { session: SessionData | null };

function isMeApiResponse(v: unknown): v is MeApiResponse {
  return isRecord(v) && "session" in v && (v.session === null || isSessionData(v.session));
}

export default function Page() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);

  // Create-Form (ohne fullName)
  const [workDate, setWorkDate] = useState<string>(() => toIsoDateLocal(new Date()));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:30");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [travelMinutes, setTravelMinutes] = useState<string>("0");
  const [breakMinutes, setBreakMinutes] = useState<string>(""); // leer = automatisch

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm | null>(null);

  const grossPreviewMinutes = useMemo(() => minutesBetween(startTime, endTime), [startTime, endTime]);
  const netPreview = useMemo(
    () => previewNetMinutes(grossPreviewMinutes, breakMinutes),
    [grossPreviewMinutes, breakMinutes]
  );

  const monthHours = useMemo(() => {
    const month = workDate.slice(0, 7);
    const mins = entries.filter((e) => e.workDate.startsWith(month)).reduce((sum, e) => sum + e.workMinutes, 0);
    return mins;
  }, [entries, workDate]);

useEffect(() => {
  (async () => {
    try {
      const r = await fetch("/api/me");
      const j: unknown = await r.json().catch(() => ({}));

      if (!isMeApiResponse(j) || !j.session) {
        setMe({ ok: false });
        return;
      }
      if (j.session.role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }
      setMe({
        ok: true,
        user: {
          id: j.session.userId,
          fullName: j.session.fullName,
          role: j.session.role,
        },
      });
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
          ? (((j as { entries: WorkEntry[] }).entries ?? []) as WorkEntry[])
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

    if (!activity.trim()) return setError("Bitte Tätigkeit eingeben.");

    // ✅ Falls nicht eingeloggt/Session fehlt
    if (!me || !me.ok) return setError("Bitte neu einloggen.");

    setSaving(true);
    try {
      const payload = {
        workDate,
        startTime,
        endTime,
        activity: activity.trim(),
        location: location.trim(),
        travelMinutes: Number(travelMinutes) || 0,
        breakMinutes: breakMinutes.trim() ? Number(breakMinutes) : 0,
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
      setTravelMinutes("0");
      setBreakMinutes("");

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

  function openEditModal(e: WorkEntry) {
    setEditError(null);
    setEdit({
      id: e.id,
      userFullName: e.user?.fullName ?? "Unbekannt",
      workDate: toYMD(e.workDate),
      startTime: e.startTime,
      endTime: e.endTime,
      activity: e.activity ?? "",
      location: e.location ?? "",
      travelMinutes: String(e.travelMinutes ?? 0),
      breakMinutes: String(e.breakMinutes ?? 0),
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!edit) return;

    setEditError(null);
    if (!edit.activity.trim()) return setEditError("Bitte Tätigkeit eingeben.");
    if (!edit.workDate || !edit.startTime || !edit.endTime) return setEditError("Datum/Zeit fehlt.");

    setEditSaving(true);
    try {
      const payload = {
        id: edit.id,
        workDate: edit.workDate,
        startTime: edit.startTime,
        endTime: edit.endTime,
        activity: edit.activity.trim(),
        location: edit.location.trim(),
        travelMinutes: Number(edit.travelMinutes) || 0,
        breakMinutes: edit.breakMinutes.trim() ? Number(edit.breakMinutes) : 0,
      };

      const r = await fetch("/api/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : "Bearbeiten fehlgeschlagen.";
        setEditError(msg);
        return;
      }

      const updated =
        typeof j === "object" && j !== null && "entry" in j && typeof (j as { entry: unknown }).entry === "object"
          ? ((j as { entry: WorkEntry }).entry as WorkEntry)
          : null;

      if (updated) {
        setEntries((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        await loadEntries();
      }

      setEditOpen(false);
      setEdit(null);
    } catch {
      setEditError("Netzwerkfehler beim Speichern.");
    } finally {
      setEditSaving(false);
    }
  }

  const groupedEntries = useMemo(() => groupByMonthYear(entries), [entries]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const editPreview = useMemo(() => {
    if (!edit) return { net: 0, brk: 0, auto: true, gross: 0 };
    const gross = minutesBetween(edit.startTime, edit.endTime);
    const p = previewNetMinutes(gross, edit.breakMinutes);
    return { gross, net: p.net, brk: p.brk, auto: p.auto };
  }, [edit]);

  const meName = me && me.ok ? me.user.fullName : "";

  return (
    <AppShell activeLabel="#wirkönnendas">
      {/* KPI */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">Arbeitsstunden (Monat)</div>
            <div className="big">{formatHM(monthHours)}</div>
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

      {/* CREATE */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>＋</span> Stunden erfassen
        </div>

        {error && (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{error}</span>
          </div>
        )}

        {/* ✅ Name nur anzeigen (automatisch aus Session), kein Input mehr */}
        <div style={{ marginBottom: 12 }}>
          <div className="label">Mitarbeiter</div>
          <div
            className="input"
            style={{
              display: "flex",
              alignItems: "center",
              opacity: meName ? 1 : 0.7,
            }}
          >
            {meName || "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Der Eintrag wird automatisch deinem Konto zugeordnet.
          </div>
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
            <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(netPreview.net)}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
            Brutto: {formatHM(grossPreviewMinutes)} · Pause: {netPreview.brk} Min {netPreview.auto ? "(auto)" : "(manuell)"}
          </div>
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

        <div className="label" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Fahrzeit (Min.)</div>
            <input
              className="input"
              inputMode="numeric"
              value={travelMinutes}
              onChange={(e) => setTravelMinutes(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">Pause (Min.)</div>
          <input
            className="input"
            inputMode="numeric"
            placeholder="leer = gesetzlich automatisch"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            Wenn du nichts einträgst (oder 0), wird die gesetzliche Pause automatisch abgezogen.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setActivity("");
              setLocation("");
              setTravelMinutes("0");
              setBreakMinutes("");
            }}
          >
            Abbrechen
          </button>
          <button className="btn btn-accent" type="button" onClick={saveEntry} disabled={saving}>
            {saving ? "Speichert..." : "Eintrag speichern"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>
          Alle Einträge
        </div>

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
                    const hasTravel = e.travelMinutes > 0;

                    const hasBreak = (e.breakMinutes ?? 0) > 0 || (e.breakAuto ?? false);
                    const breakLabel = (e.breakAuto ?? false) ? "auto" : "manuell";
                    const grossHM = formatHM(e.grossMinutes ?? 0);
                    const netHM = formatHM(e.workMinutes ?? 0);

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

                            <div className="entry-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="entry-hours">
                                <span className="entry-hours-number">{formatHM(e.workMinutes ?? 0)}</span>
                              </div>

                              <button className="icon-btn" onClick={() => openEditModal(e)} aria-label="Bearbeiten" title="Bearbeiten">
                                ✏️
                              </button>

                              <button className="icon-btn danger" onClick={() => deleteEntry(e.id)} aria-label="Löschen" title="Löschen">
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

{hasTravel || hasBreak ? (
  <div className="entry-chips">
    {/* ✅ Pause anzeigen */}
    {hasBreak ? (
      <span className="chip">
        ☕ Pause {e.breakMinutes ?? 0} Min ({breakLabel})
      </span>
    ) : null}

    {/* ✅ optional: Brutto/Netto anzeigen */}
    <span className="chip">🧮 Brutto {grossHM}</span>
    <span className="chip">✅ Netto {netHM}</span>

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

      {/* ✅ EDIT MODAL */}
      <Modal
        open={editOpen}
        title="Eintrag bearbeiten"
        onClose={() => {
          setEditOpen(false);
          setEdit(null);
          setEditError(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEdit(null);
                setEditError(null);
              }}
            >
              Abbrechen
            </button>
            <button className="btn btn-accent" type="button" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </div>
        }
      >
        {!edit ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            {editError ? (
              <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}>
                <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{editError}</span>
              </div>
            ) : null}

            <div>
              <div className="label">Mitarbeiter</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {edit.userFullName}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Zuordnung wird serverseitig automatisch verwaltet.
              </div>
            </div>

            <div className="row">
              <div>
                <div className="label">Datum</div>
                <input
                  className="input"
                  type="date"
                  value={edit.workDate}
                  onChange={(e) => setEdit((p) => (p ? { ...p, workDate: e.target.value } : p))}
                />
              </div>
              <div />
            </div>

            <div className="row">
              <div>
                <div className="label">Beginn</div>
                <input
                  className="input"
                  type="time"
                  value={edit.startTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, startTime: e.target.value } : p))}
                />
              </div>
              <div>
                <div className="label">Ende</div>
                <input
                  className="input"
                  type="time"
                  value={edit.endTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, endTime: e.target.value } : p))}
                />
              </div>
            </div>

            <div className="card" style={{ padding: 12, borderColor: "rgba(184, 207, 58, 0.20)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ color: "var(--muted)" }}>Arbeitszeit (berechnet)</div>
                <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(editPreview.net)}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                  Pause: {editPreview.brk} Min {editPreview.auto ? "(auto)" : "(manuell)"}
                  </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                Brutto: {formatHM(editPreview.gross)} · Pause: {editPreview.brk} Min {editPreview.auto ? "(auto)" : "(manuell)"}
              </div>
              </div>
            </div>

            <div>
              <div className="label">Ausgeführte Tätigkeit</div>
              <textarea
                className="textarea"
                value={edit.activity}
                onChange={(e) => setEdit((p) => (p ? { ...p, activity: e.target.value } : p))}
              />
            </div>

            <div>
              <div className="label">Einsatzort</div>
              <input
                className="input"
                value={edit.location}
                onChange={(e) => setEdit((p) => (p ? { ...p, location: e.target.value } : p))}
              />
            </div>

            <div className="row">
              <div>
                <div className="label">Fahrzeit (Min.)</div>
                <input
                  className="input"
                  inputMode="numeric"
                  value={edit.travelMinutes}
                  onChange={(e) => setEdit((p) => (p ? { ...p, travelMinutes: e.target.value } : p))}
                />
              </div>
            </div>
            <div>
              <div className="label">Pause (Min.)</div>
              <input
                className="input"
                inputMode="numeric"
                placeholder="0/leer = gesetzlich automatisch"
                value={edit.breakMinutes}
                onChange={(e) => setEdit((p) => (p ? { ...p, breakMinutes: e.target.value } : p))}
              />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Wenn leer oder 0, wird die gesetzliche Pause automatisch abgezogen.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}