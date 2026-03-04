// src/app/admin/wochenplan/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

type User = { id: string; fullName: string };

type PlanEntry = {
  id: string;
  userId: string;
  workDate: string; // ISO
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;

  // ✅ Mitarbeiter-Notiz bleibt am Plan-Eintrag
  noteEmployee?: string | null;

  user?: { id: string; fullName: string };
};

/**
 * ✅ Admin-Notiz ist ein SEPARATER Datensatz (separates Speichern/Löschen)
 * Erwartete Felder im Backend:
 * - id
 * - userId
 * - workDate (YYYY-MM-DD / ISO Date)
 * - note
 */
type AdminNote = {
  id: string;
  userId: string;
  workDate: string; // ISO
  note: string;

  user?: { id: string; fullName: string };
};

/** ✅ NEU: PlanEntry-Dokumente (Baustellenzettel etc.) */
type PlanEntryDocument = {
  id: string;
  planEntryId: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy?: { id: string; fullName: string };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringProp(obj: unknown, key: string): string | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function getArrayProp<T>(obj: unknown, key: string, itemGuard: (x: unknown) => x is T): T[] {
  if (!isRecord(obj)) return [];
  const val = obj[key];
  if (!Array.isArray(val)) return [];
  const out: T[] = [];
  for (const item of val) {
    if (itemGuard(item)) out.push(item);
  }
  return out;
}

function isUser(x: unknown): x is User {
  return isRecord(x) && typeof x.id === "string" && typeof x.fullName === "string";
}

function isPlanEntry(x: unknown): x is PlanEntry {
  return (
    isRecord(x) &&
    typeof x.id === "string" &&
    typeof x.userId === "string" &&
    typeof x.workDate === "string" &&
    typeof x.startHHMM === "string" &&
    typeof x.endHHMM === "string" &&
    typeof x.activity === "string" &&
    typeof x.location === "string" &&
    typeof x.travelMinutes === "number" &&
    (x.noteEmployee === undefined || x.noteEmployee === null || typeof x.noteEmployee === "string") &&
    (x.user === undefined ||
      x.user === null ||
      (isRecord(x.user) && typeof x.user.id === "string" && typeof x.user.fullName === "string"))
  );
}

function isAdminNote(x: unknown): x is AdminNote {
  return (
    isRecord(x) &&
    typeof x.id === "string" &&
    typeof x.userId === "string" &&
    typeof x.workDate === "string" &&
    typeof x.note === "string" &&
    (x.user === undefined ||
      x.user === null ||
      (isRecord(x.user) && typeof x.user.id === "string" && typeof x.user.fullName === "string"))
  );
}

function isPlanEntryDocument(x: unknown): x is PlanEntryDocument {
  return (
    isRecord(x) &&
    typeof x.id === "string" &&
    typeof x.planEntryId === "string" &&
    typeof x.title === "string" &&
    typeof x.fileName === "string" &&
    typeof x.mimeType === "string" &&
    typeof x.sizeBytes === "number" &&
    typeof x.createdAt === "string" &&
    (x.uploadedBy === undefined ||
      x.uploadedBy === null ||
      (isRecord(x.uploadedBy) &&
        typeof x.uploadedBy.id === "string" &&
        typeof x.uploadedBy.fullName === "string"))
  );
}

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
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNo;
}

function fmtDE(d: Date) {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDEshort(d: Date) {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function ymdFromISO(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* -------------------- Scroll-Modal (Header/Footer fix, Body scroll) -------------------- */
function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = 720,
  zIndex = 50,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  zIndex?: number;
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "85vh",
          background: "rgba(0,0,0,0.55)",
          border: `1px solid ${UI.cellBorder}`,
          borderRadius: 16,
          backdropFilter: "blur(10px)",
          color: UI.text,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: `1px solid ${UI.cellBorder}`,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
          <button className="pill" onClick={onClose} type="button" aria-label="Schließen">
            ✕
          </button>
        </div>

        <div style={{ padding: 16, overflowY: "auto", overscrollBehavior: "contain" }}>{children}</div>

        {footer ? (
          <div
            style={{
              padding: 16,
              borderTop: `1px solid ${UI.cellBorder}`,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------- Page -------------------- */
export default function AdminWochenplanPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Plan-Entry Modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);

  // ✅ NEU: Dokumente im PlanEntry-Modal
  const [docs, setDocs] = useState<PlanEntryDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>("Baustellenzettel");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Admin-Note Modal (SEPARAT)
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

  const [savingEntry, setSavingEntry] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);

  const [entryForm, setEntryForm] = useState({
    userId: "",
    rowLabel: "",
    specialTag: "" as "" | "REP" | "SUB",
    dateYMD: "",
    startHHMM: "07:00",
    endHHMM: "16:00",
    activity: "",
    location: "",
    travelMinutes: 0,
    noteEmployee: "",
  });

  const [noteForm, setNoteForm] = useState({
    userId: "",
    rowLabel: "",
    dateYMD: "",
    note: "",
  });

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const kw = getISOWeek(weekStart);
    return { kw, dateRange: `${fmtDEshort(weekStart)} – ${fmtDE(end)}` };
  }, [weekStart]);

  async function loadData() {
    setLoading(true);

    const [uRes, eRes, nRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch(`/api/admin/plan-entries?weekStart=${fmtYMD(weekStart)}`),
      fetch(`/api/admin/admin-notes?weekStart=${fmtYMD(weekStart)}`),
    ]);

    if (uRes.status === 403 || eRes.status === 403 || nRes.status === 403) {
      setLoading(false);
      alert("Kein Zugriff (Admin benötigt).");
      return;
    }

    const uJson: unknown = await uRes.json().catch(() => ({}));
    const eJson: unknown = await eRes.json().catch(() => ({}));
    const nJson: unknown = await nRes.json().catch(() => ({}));

    setUsers(getArrayProp<User>(uJson, "users", isUser));
    setEntries(getArrayProp<PlanEntry>(eJson, "entries", isPlanEntry));
    setAdminNotes(getArrayProp<AdminNote>(nJson, "notes", isAdminNote));

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const entryGridMap = useMemo(() => {
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

  const noteMap = useMemo(() => {
    const m = new Map<string, AdminNote[]>();
    for (const n of adminNotes) {
      const dayKey = ymdFromISO(n.workDate);
      const key = `${dayKey}_${n.userId}`;
      m.set(key, [...(m.get(key) ?? []), n]);
    }
    return m;
  }, [adminNotes]);

  async function loadDocs(planEntryId: string) {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const r = await fetch(`/api/admin/plan-entry-documents?planEntryId=${encodeURIComponent(planEntryId)}`);
      const j: unknown = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg = getStringProp(j, "error") ?? "Dokumente konnten nicht geladen werden.";
        setDocsError(msg);
        setDocs([]);
        return;
      }

      const list =
        isRecord(j) && Array.isArray(j.documents)
          ? (j.documents as unknown[]).filter(isPlanEntryDocument)
          : [];

      setDocs(list);
    } catch {
      setDocsError("Netzwerkfehler beim Laden der Dokumente.");
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }

  async function uploadDoc() {
    if (!editEntryId) {
      alert("Bitte erst den Plan-Eintrag speichern, dann Dokumente hochladen.");
      return;
    }
    if (!selectedFile) {
      alert("Bitte eine Datei auswählen.");
      return;
    }

    setUploadingDoc(true);
    setDocsError(null);
    try {
      const fd = new FormData();
      fd.append("planEntryId", editEntryId);
      fd.append("title", docTitle.trim() || "Dokument");
      fd.append("file", selectedFile);

      const r = await fetch("/api/admin/plan-entry-documents", { method: "POST", body: fd });
      const j: unknown = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg = getStringProp(j, "error") ?? "Upload fehlgeschlagen.";
        setDocsError(msg);
        return;
      }

      setSelectedFile(null);
      await loadDocs(editEntryId);
    } catch {
      setDocsError("Netzwerkfehler beim Upload.");
    } finally {
      setUploadingDoc(false);
    }
  }

  async function deleteDoc(id: string) {
    if (!editEntryId) return;
    const ok = window.confirm("Dokument wirklich löschen?");
    if (!ok) return;

    setDeletingDocId(id);
    try {
      const r = await fetch(`/api/admin/plan-entry-documents?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!r.ok) {
        alert("Löschen fehlgeschlagen");
        return;
      }
      await loadDocs(editEntryId);
    } finally {
      setDeletingDocId(null);
    }
  }

  function closeEntryModal() {
    setEntryModalOpen(false);
    setEditEntryId(null);

    // ✅ reset docs state
    setDocs([]);
    setDocsError(null);
    setDocsLoading(false);
    setSelectedFile(null);
    setUploadingDoc(false);
    setDeletingDocId(null);
    setDocTitle("Baustellenzettel");
  }

  function closeNoteModal() {
    setNoteModalOpen(false);
    setEditNoteId(null);
  }

  function openCreateEntry(userId: string, row: (typeof ROWS)[number]) {
    const date =
      row.type === "DAY"
        ? new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (row.offset ?? 0))
        : weekStart;

    setEditEntryId(null);
    setEntryForm({
      userId,
      rowLabel: row.label,
      specialTag: row.type === "SPECIAL" ? (row.tag as "REP" | "SUB") : "",
      dateYMD: fmtYMD(date),
      startHHMM: "07:00",
      endHHMM: "16:00",
      activity: row.type === "SPECIAL" ? `${row.tag}: ` : "",
      location: "",
      travelMinutes: 0,
      noteEmployee: "",
    });

    // ✅ docs für neuen Eintrag leer
    setDocs([]);
    setDocsError(null);
    setSelectedFile(null);
    setDocTitle("Baustellenzettel");

    setEntryModalOpen(true);
  }

  function openEditEntry(entry: PlanEntry, row: (typeof ROWS)[number]) {
    const isRep = (entry.activity ?? "").trim().toUpperCase().startsWith("REP:");
    const isSub = (entry.activity ?? "").trim().toUpperCase().startsWith("SUB:");

    setEditEntryId(entry.id);
    setEntryForm({
      userId: entry.userId,
      rowLabel: row.label,
      specialTag: isRep ? "REP" : isSub ? "SUB" : "",
      dateYMD: ymdFromISO(entry.workDate),
      startHHMM: entry.startHHMM || "07:00",
      endHHMM: entry.endHHMM || "16:00",
      activity: entry.activity ?? "",
      location: entry.location ?? "",
      travelMinutes: entry.travelMinutes ?? 0,
      noteEmployee: entry.noteEmployee ?? "",
    });

    setEntryModalOpen(true);
    void loadDocs(entry.id);
  }

  function openCreateNote(userId: string, dateYMD: string, rowLabel: string) {
    setEditNoteId(null);
    setNoteForm({
      userId,
      rowLabel,
      dateYMD,
      note: "",
    });
    setNoteModalOpen(true);
  }

  function openEditNote(note: AdminNote, rowLabel: string) {
    setEditNoteId(note.id);
    setNoteForm({
      userId: note.userId,
      rowLabel,
      dateYMD: ymdFromISO(note.workDate),
      note: note.note ?? "",
    });
    setNoteModalOpen(true);
  }

  async function saveEntry() {
    if (!entryForm.userId) return alert("Bitte Mitarbeiter wählen.");
    if (!entryForm.dateYMD) return alert("Bitte Datum wählen.");
    if (!entryForm.startHHMM || !entryForm.endHHMM) return alert("Bitte Start/Ende angeben.");

    setSavingEntry(true);
    try {
      const payload = {
        id: editEntryId ?? undefined,
        userId: entryForm.userId,
        workDate: entryForm.dateYMD,
        startHHMM: entryForm.startHHMM,
        endHHMM: entryForm.endHHMM,
        activity: entryForm.activity,
        location: entryForm.location,
        travelMinutes: Number(entryForm.travelMinutes || 0),
        noteEmployee: entryForm.noteEmployee,
      };

      const res = await fetch("/api/admin/plan-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg = getStringProp(err, "error") ?? "unknown";
        alert(`Speichern fehlgeschlagen: ${msg}`);
        return;
      }

      closeEntryModal();
      await loadData();
    } finally {
      setSavingEntry(false);
    }
  }

  async function deleteEntry() {
    if (!editEntryId) return;
    const ok = window.confirm("Plan-Eintrag wirklich löschen?");
    if (!ok) return;

    setDeletingEntry(true);
    try {
      const res = await fetch(`/api/admin/plan-entries?id=${editEntryId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Löschen fehlgeschlagen");
        return;
      }
      closeEntryModal();
      await loadData();
    } finally {
      setDeletingEntry(false);
    }
  }

  async function saveNote() {
    if (!noteForm.userId) return alert("Bitte Mitarbeiter wählen.");
    if (!noteForm.dateYMD) return alert("Bitte Datum wählen.");

    setSavingNote(true);
    try {
      const payload = {
        id: editNoteId ?? undefined,
        userId: noteForm.userId,
        workDate: noteForm.dateYMD,
        note: noteForm.note,
      };

      const res = await fetch("/api/admin/admin-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg = getStringProp(err, "error") ?? "unknown";
        alert(`Notiz speichern fehlgeschlagen: ${msg}`);
        return;
      }

      closeNoteModal();
      await loadData();
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteNote() {
    if (!editNoteId) return;
    const ok = window.confirm("Admin-Notiz wirklich löschen?");
    if (!ok) return;

    setDeletingNote(true);
    try {
      const res = await fetch(`/api/admin/admin-notes?id=${editNoteId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Notiz löschen fehlgeschlagen");
        return;
      }
      closeNoteModal();
      await loadData();
    } finally {
      setDeletingNote(false);
    }
  }

  return (
    <div style={{ padding: 14 }}>
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
            href="/kalender"
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
                <th style={{ border: `1px solid ${UI.cellBorder}`, padding: 12, width: 180, textAlign: "left" }} />
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
                const rowDayYMD =
                  row.type === "DAY"
                    ? fmtYMD(
                        new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (row.offset ?? 0))
                      )
                    : null;

                const rowKey = row.type === "DAY" ? (rowDayYMD as string) : (row.tag as string);

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
                      const entryCellKey = `${rowKey}_${u.id}`;
                      const cellEntries = entryGridMap.get(entryCellKey) ?? [];

                      const notesKey = rowDayYMD ? `${rowDayYMD}_${u.id}` : "";
                      const cellNotes = rowDayYMD ? noteMap.get(notesKey) ?? [] : [];

                      return (
                        <td
                          key={`${row.label}_${u.id}`}
                          style={{ border: `1px solid ${UI.cellBorder}`, padding: 10, verticalAlign: "top" }}
                        >
                          <div style={{ minHeight: 74, display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {cellEntries.map((e) => (
                                <div
                                  key={e.id}
                                  onClick={() => openEditEntry(e, row)}
                                  style={{
                                    border: `1px solid ${UI.cardBorder}`,
                                    borderRadius: 10,
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    background: UI.cardBg,
                                    color: UI.text,
                                  }}
                                  title="Plan-Eintrag bearbeiten"
                                >
                                  <div style={{ fontWeight: 900, fontSize: 13 }}>{e.activity}</div>
                                  <div style={{ fontSize: 12, color: UI.muted, marginTop: 4 }}>
                                    {e.startHHMM}–{e.endHHMM}
                                    {e.location ? ` · ${e.location}` : ""}
                                  </div>

                                  {e.noteEmployee ? (
                                    <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>📝 MA: {e.noteEmployee}</div>
                                  ) : null}
                                </div>
                              ))}

                              <button
                                onClick={() => openCreateEntry(u.id, row)}
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
                                + Eintrag (Plan)
                              </button>
                            </div>

                            {row.type === "DAY" && rowDayYMD ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {cellNotes.map((n) => (
                                  <div
                                    key={n.id}
                                    onClick={() => openEditNote(n, row.label)}
                                    style={{
                                      border: `1px solid rgba(255,255,255,0.12)`,
                                      borderRadius: 10,
                                      padding: "10px 12px",
                                      cursor: "pointer",
                                      background: "rgba(255,255,255,0.04)",
                                      color: "rgba(255,255,255,0.85)",
                                    }}
                                    title="Admin-Notiz bearbeiten"
                                  >
                                    <div style={{ fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                                      🔒 Admin-Notiz
                                    </div>
                                    <div style={{ fontSize: 12, marginTop: 6, color: "rgba(255,255,255,0.70)" }}>
                                      {n.note.trim() ? n.note : "(leer)"}
                                    </div>
                                  </div>
                                ))}

                                <button
                                  onClick={() => openCreateNote(u.id, rowDayYMD, row.label)}
                                  style={{
                                    border: `1px dashed rgba(255,255,255,0.18)`,
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    background: "rgba(255,255,255,0.03)",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    color: "rgba(255,255,255,0.60)",
                                  }}
                                >
                                  + Notiz (Admin)
                                </button>
                              </div>
                            ) : null}
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

      {/* -------------------- MODAL: PLAN-EINTRAG -------------------- */}
      <Modal
        open={entryModalOpen}
        title={`${editEntryId ? "Eintrag bearbeiten" : "Eintrag anlegen"} — ${entryForm.rowLabel} · ${
          users.find((x) => x.id === entryForm.userId)?.fullName ?? ""
        }`}
        onClose={closeEntryModal}
        footer={
          <>
            {editEntryId ? (
              <button className="pill" onClick={deleteEntry} disabled={savingEntry || deletingEntry}>
                {deletingEntry ? "Lösche…" : "Löschen"}
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill" onClick={closeEntryModal} disabled={savingEntry || deletingEntry}>
                Schließen
              </button>
              <button className="pill pill-active" onClick={saveEntry} disabled={savingEntry || deletingEntry}>
                {savingEntry ? "Speichere…" : "Speichern"}
              </button>
            </div>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Datum</div>
            <input
              type="date"
              value={entryForm.dateYMD}
              onChange={(e) => setEntryForm((p) => ({ ...p, dateYMD: e.target.value }))}
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
              value={entryForm.userId}
              onChange={(e) => setEntryForm((p) => ({ ...p, userId: e.target.value }))}
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
              type="time"
              value={entryForm.startHHMM}
              onChange={(e) => setEntryForm((p) => ({ ...p, startHHMM: e.target.value }))}
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
              type="time"
              value={entryForm.endHHMM}
              onChange={(e) => setEntryForm((p) => ({ ...p, endHHMM: e.target.value }))}
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
              value={entryForm.activity}
              onChange={(e) => setEntryForm((p) => ({ ...p, activity: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
              }}
            />
            {entryForm.specialTag ? (
              <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>
                Lass den Prefix <b>{entryForm.specialTag}:</b> stehen, sonst erscheint es nicht in der Spezial-Zeile.
              </div>
            ) : null}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Ort</div>
            <input
              value={entryForm.location}
              onChange={(e) => setEntryForm((p) => ({ ...p, location: e.target.value }))}
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
              min={0}
              value={entryForm.travelMinutes}
              onChange={(e) => setEntryForm((p) => ({ ...p, travelMinutes: Number(e.target.value || 0) }))}
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
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Notiz (für Mitarbeiter)</div>
            <textarea
              value={entryForm.noteEmployee}
              onChange={(e) => setEntryForm((p) => ({ ...p, noteEmployee: e.target.value }))}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
                resize: "vertical",
              }}
            />
            <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>Diese Notiz sehen Mitarbeiter im Kalender/Modal.</div>
          </div>

          {/* -------------------- DOKUMENTE (Admin) -------------------- */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ height: 1, background: UI.cellBorder, margin: "10px 0", opacity: 0.9 }} />

            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>📎 Dokumente (Baustellenzettel etc.)</div>

            {!editEntryId ? (
              <div style={{ fontSize: 12, color: UI.muted }}>
                Speichere zuerst den Plan-Eintrag – danach kannst du Dokumente hochladen.
              </div>
            ) : (
              <>
                {docsError ? (
                  <div style={{ fontSize: 12, color: "rgba(255,120,120,0.95)", marginBottom: 8 }}>{docsError}</div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Titel</div>
                    <input
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
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
                    <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Datei</div>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setSelectedFile(f);
                      }}
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

                <button className="pill pill-active" type="button" onClick={uploadDoc} disabled={uploadingDoc}>
                  {uploadingDoc ? "Upload..." : "Dokument hochladen"}
                </button>

                <div style={{ marginTop: 12 }}>
                  {docsLoading ? (
                    <div style={{ fontSize: 12, color: UI.muted }}>Lade Dokumente...</div>
                  ) : docs.length === 0 ? (
                    <div style={{ fontSize: 12, color: UI.muted }}>Noch keine Dokumente.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {docs.map((d) => (
                        <div
                          key={d.id}
                          style={{
                            border: `1px solid ${UI.cardBorder}`,
                            borderRadius: 10,
                            padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.title}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: UI.muted,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.fileName}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <a
                              className="pill"
                              href={`/api/plan-entry-documents/file?id=${encodeURIComponent(d.id)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: "none" }}
                            >
                              Öffnen
                            </a>

                            <button
                              className="pill"
                              type="button"
                              onClick={() => deleteDoc(d.id)}
                              disabled={deletingDocId === d.id}
                            >
                              {deletingDocId === d.id ? "Lösche..." : "Löschen"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", fontSize: 12, color: UI.muted }}>
            ✅ Admin-Notiz wird <b>nicht</b> hier gespeichert — dafür gibt es separat “+ Notiz (Admin)” im Wochenplan.
          </div>
        </div>
      </Modal>

      {/* -------------------- MODAL: ADMIN-NOTIZ (SEPARAT) -------------------- */}
      <Modal
        open={noteModalOpen}
        title={`${editNoteId ? "Admin-Notiz bearbeiten" : "Admin-Notiz anlegen"} — ${noteForm.rowLabel} · ${
          users.find((x) => x.id === noteForm.userId)?.fullName ?? ""
        }`}
        onClose={closeNoteModal}
        zIndex={60}
        footer={
          <>
            {editNoteId ? (
              <button className="pill" onClick={deleteNote} disabled={savingNote || deletingNote}>
                {deletingNote ? "Lösche…" : "Löschen"}
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill" onClick={closeNoteModal} disabled={savingNote || deletingNote}>
                Schließen
              </button>
              <button className="pill pill-active" onClick={saveNote} disabled={savingNote || deletingNote}>
                {savingNote ? "Speichere…" : "Speichern"}
              </button>
            </div>
          </>
        }
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Datum</div>
              <input
                type="date"
                value={noteForm.dateYMD}
                onChange={(e) => setNoteForm((p) => ({ ...p, dateYMD: e.target.value }))}
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
                value={noteForm.userId}
                onChange={(e) => setNoteForm((p) => ({ ...p, userId: e.target.value }))}
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
          </div>

          <div>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Interne Admin-Notiz (nur für Admin)</div>
            <textarea
              value={noteForm.note}
              onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
              rows={10}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
                resize: "vertical",
              }}
            />
            <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>
              Bleibt intern und wird niemals an Mitarbeiter ausgeliefert.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}