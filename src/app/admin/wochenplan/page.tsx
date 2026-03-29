// src/app/admin/wochenplan/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

type User = { id: string; fullName: string };

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isAdminSessionDTO(v: unknown): v is AdminSessionDTO {
  return (
    isRecord(v) &&
    typeof v.userId === "string" &&
    typeof v.fullName === "string" &&
    (v.role === "ADMIN" || v.role === "EMPLOYEE") &&
    typeof v.companyId === "string" &&
    typeof v.companyName === "string" &&
    typeof v.companySubdomain === "string" &&
    ((typeof v.companyLogoUrl === "string") || v.companyLogoUrl === null) &&
    ((typeof v.primaryColor === "string") || v.primaryColor === null)
  );
}

function parseMeSession(v: unknown): AdminSessionDTO | null {
  if (!isRecord(v)) return null;
  const session = v["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

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

type ShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
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

function fmtDE(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}.${month}.${year}`;
}

function fmtDEshort(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

function ymdFromISO(iso: string): string {
  const normalized = iso.length >= 10 ? iso.slice(0, 10) : iso;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const PLAN_DOC_ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PLAN_DOC_MAX_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

async function readFileViaFileReader(file: Blob): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Datei konnte per FileReader nicht gelesen werden."));
    };

    reader.onabort = () => {
      reject(new Error("Dateilesen wurde abgebrochen."));
    };

    reader.onload = () => {
      const result = reader.result;

      if (!(result instanceof ArrayBuffer)) {
        reject(new Error("Ungültiges Dateiformat beim Lesen."));
        return;
      }

      resolve(result);
    };

    reader.readAsArrayBuffer(file);
  });
}

async function normalizeUploadFile(file: File): Promise<File> {
  let arrayBuffer: ArrayBuffer | null = null;

  try {
    arrayBuffer = await withTimeout(
      file.arrayBuffer(),
      8000,
      "arrayBuffer timeout"
    );
  } catch {
    arrayBuffer = await withTimeout(
      readFileViaFileReader(file),
      15000,
      "Die Datei konnte nicht gelesen werden. Bitte Datei zuerst lokal auf den Mac laden oder nach Downloads kopieren."
    );
  }

  return new File([arrayBuffer], file.name, {
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified,
  });
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
              flexWrap: "wrap",
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
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<PlanEntry[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [pageError, setPageError] = useState<string>("");

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json().catch(() => ({}));

        if (!alive) return;

        const parsed = parseMeSession(data);

        if (!parsed || parsed.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        setSession(parsed);
      } catch {
        if (!alive) return;
        router.replace("/login");
        return;
      } finally {
        if (alive) {
          setSessionChecked(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocMimeType, setPreviewDocMimeType] = useState<string>("");
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("");

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
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setPageError("");

    const [uRes, eRes, nRes] = await Promise.all([
      fetch("/api/admin/users", { credentials: "include", cache: "no-store" }),
      fetch(`/api/admin/plan-entries?weekStart=${fmtYMD(weekStart)}`, {
        credentials: "include",
        cache: "no-store",
      }),
      fetch(`/api/admin/admin-notes?weekStart=${fmtYMD(weekStart)}`, {
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    if (uRes.status === 401 || eRes.status === 401 || nRes.status === 401) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    if (uRes.status === 403 || eRes.status === 403 || nRes.status === 403) {
      setLoading(false);
      setPageError("Kein Zugriff (Admin benötigt).");
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
    if (!sessionChecked) return;
    if (!session || session.role !== "ADMIN") return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, sessionChecked, session?.role, session?.companyId]);

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
      const r = await fetch(`/api/admin/plan-entry-documents?planEntryId=${encodeURIComponent(planEntryId)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
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

    function canPreviewMime(mimeType: string): boolean {
    return mimeType === "application/pdf" || mimeType.startsWith("image/");
  }

  function revokePreviewDocUrl(): void {
    if (previewDocUrl) {
      URL.revokeObjectURL(previewDocUrl);
    }
    setPreviewDocUrl(null);
  }

  function closePreview(): void {
    revokePreviewDocUrl();
    setPreviewOpen(false);
    setPreviewDocMimeType("");
    setPreviewDocTitle("");
  }

  async function fetchPlanDocumentBlob(
    docId: string,
    disposition: "inline" | "attachment"
  ): Promise<Blob> {
    const response = await fetch(
      `/api/plan-entry-documents/file?id=${encodeURIComponent(docId)}&disposition=${disposition}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Datei konnte nicht geladen werden.");
    }

    return await response.blob();
  }

  async function previewPlanDocument(doc: PlanEntryDocument): Promise<void> {
    if (!canPreviewMime(doc.mimeType)) {
      setDocsError("Dieser Dateityp kann in der App nicht angezeigt werden.");
      return;
    }

    try {
      setDocsError(null);

      const blob = await fetchPlanDocumentBlob(doc.id, "inline");
      const blobUrl = URL.createObjectURL(blob);

      revokePreviewDocUrl();
      setPreviewDocUrl(blobUrl);
      setPreviewDocMimeType(doc.mimeType);
      setPreviewDocTitle(doc.title || doc.fileName);
      setPreviewOpen(true);
    } catch {
      setDocsError("Dokument konnte nicht in der App geöffnet werden.");
    }
  }

  async function sharePlanDocument(doc: PlanEntryDocument): Promise<void> {
    try {
      setDocsError(null);

      const blob = await fetchPlanDocumentBlob(doc.id, "attachment");
      const file = new File([blob], doc.fileName, { type: doc.mimeType });

      const shareNavigator = navigator as ShareNavigator;

      if (
        typeof navigator.share === "function" &&
        typeof shareNavigator.canShare === "function" &&
        shareNavigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: doc.title,
          text: doc.fileName,
        });
        return;
      }

      setDocsError("Auf diesem Gerät ist 'Teilen / Sichern' hier nicht verfügbar.");
    } catch {
      setDocsError("Dokument konnte nicht geteilt bzw. gespeichert werden.");
    }
  }

  async function uploadDoc() {
    if (!editEntryId) {
      setPageError("Bitte erst den Plan-Eintrag speichern, dann Dokumente hochladen.");
      return;
    }

    if (!selectedFile) {
      setDocsError("Bitte eine Datei auswählen.");
      return;
    }

    if (!PLAN_DOC_ALLOWED_MIME.has(selectedFile.type)) {
      setDocsError("Dateityp nicht erlaubt. Erlaubt sind PDF, JPG, PNG und WEBP.");
      return;
    }

    if (selectedFile.size <= 0) {
      setDocsError("Die gewählte Datei ist leer.");
      return;
    }

    if (selectedFile.size > PLAN_DOC_MAX_BYTES) {
      setDocsError(
        `Datei zu groß (${formatBytes(selectedFile.size)}). Maximal erlaubt sind ${formatBytes(PLAN_DOC_MAX_BYTES)}.`
      );
      return;
    }

    setUploadingDoc(true);
    setDocsError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 120000);

    try {
      const normalizedFile = await withTimeout(
        normalizeUploadFile(selectedFile),
        15000,
        "Die Datei konnte auf diesem Gerät nicht gelesen werden."
      );

      const fd = new FormData();
      fd.append("planEntryId", editEntryId);
      fd.append("title", docTitle.trim() || "Dokument");
      fd.append("file", normalizedFile, normalizedFile.name);

      const r = await fetch("/api/admin/plan-entry-documents", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: fd,
        signal: controller.signal,
      });

      const contentType = r.headers.get("content-type") ?? "";
      const j: unknown = contentType.includes("application/json")
        ? await r.json().catch(() => ({}))
        : {};

      if (!r.ok) {
        const msg =
          r.status === 413
            ? "Die Datei ist für den Upload zu groß."
            : getStringProp(j, "error") ?? "Upload fehlgeschlagen.";
        setDocsError(msg);
        return;
      }

      setSelectedFile(null);
      await loadDocs(editEntryId);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setDocsError("Upload dauert zu lange. Bitte Datei erneut auswählen und erneut versuchen.");
        return;
      }

      if (error instanceof Error) {
        setDocsError(
          error.message || "Datei konnte nicht verarbeitet werden. Bitte Datei zuerst lokal verfügbar machen."
        );
        return;
      }

      setDocsError("Netzwerkfehler beim Upload.");
    } finally {
      window.clearTimeout(timeoutId);
      setUploadingDoc(false);
    }
  }

  async function deleteDoc(id: string) {
    if (!editEntryId) return;
    const ok = typeof window !== "undefined" ? window.confirm("Dokument wirklich löschen?") : false;
    if (!ok) return;

    setDeletingDocId(id);
    try {
      const r = await fetch(`/api/admin/plan-entry-documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        setPageError("Löschen fehlgeschlagen.");
        return;
      }
      await loadDocs(editEntryId);
    } finally {
      setDeletingDocId(null);
    }
  }

  function closeEntryModal() {
    closePreview();
    setEntryModalOpen(false);
    setEditEntryId(null);

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
    if (!entryForm.userId) return setPageError("Bitte Mitarbeiter wählen.");
    if (!entryForm.dateYMD) return setPageError("Bitte Datum wählen.");
    if (!entryForm.startHHMM || !entryForm.endHHMM) return setPageError("Bitte Start/Ende angeben.");

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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg = getStringProp(err, "error") ?? "unknown";
        setPageError(`Speichern fehlgeschlagen: ${msg}`);
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
      const res = await fetch(`/api/admin/plan-entries?id=${editEntryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setPageError("Löschen fehlgeschlagen.");
        return;
      }
      closeEntryModal();
      await loadData();
    } finally {
      setDeletingEntry(false);
    }
  }

  async function saveNote() {
    if (!noteForm.userId) return setPageError("Bitte Mitarbeiter wählen.");
    if (!noteForm.dateYMD) return setPageError("Bitte Datum wählen.");

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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const msg = getStringProp(err, "error") ?? "unknown";
        setPageError(`Notiz speichern fehlgeschlagen: ${msg}`);
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
    const ok = typeof window !== "undefined" ? window.confirm("Admin-Notiz wirklich löschen?") : false;
    if (!ok) return;

    setDeletingNote(true);
    try {
      const res = await fetch(`/api/admin/admin-notes?id=${editNoteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setPageError("Notiz löschen fehlgeschlagen");
        return;
      }
      closeNoteModal();
      await loadData();
    } finally {
      setDeletingNote(false);
    }
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel="Wochenplan">
    <div
      style={{
        padding: 14,
        width: "100%",
        minWidth: 0,
      }}
    >
          <div style={{ color: UI.muted }}>lädt…</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="Wochenplan">
    <div
      style={{
        padding: 14,
        width: "100%",
        minWidth: 0,
      }}
    >
            {pageError ? (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(224,75,69,0.35)",
                    background: "rgba(224,75,69,0.10)",
                    color: "rgba(224,75,69,0.95)",
                    fontWeight: 900,
                  }}
                >
                  {pageError}
                </div>
              ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 14,
          color: UI.text,
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>Wochenplanung</div>
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>KW {weekLabel.kw}</div>
              <div style={{ color: UI.muted, fontSize: 13 }}>{weekLabel.dateRange}</div>
            </div>

            {!isDesktop ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  width: "fit-content",
                  maxWidth: "100%",
                }}
              >
                <button
                  className="pill"
                  onClick={() =>
                    setWeekStart((w) => {
                      const d = new Date(w);
                      d.setDate(d.getDate() - 7);
                      return d;
                    })
                  }
                  style={{
                    flex: "0 0 auto",
                    padding: "8px 10px",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  ← Woche
                </button>

                <input
                  type="date"
                  value={fmtYMD(weekStart)}
                  onChange={(e) => setWeekStart(startOfWeek(new Date(e.target.value)))}
                  style={{
                    flex: "0 0 136px",
                    width: 136,
                    minWidth: 136,
                    maxWidth: 136,
                    boxSizing: "border-box",
                    padding: "8px 10px",
                    border: `1px solid ${UI.cellBorder}`,
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    color: UI.text,
                    appearance: "none",
                    WebkitAppearance: "none",
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
                  style={{
                    flex: "0 0 auto",
                    padding: "8px 10px",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  Woche →
                </button>
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <Link
              href="/admin/appointments"
              className="pill"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              ⟵ Termine
            </Link>

            {isDesktop ? (
              <>
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
                    maxWidth: 180,
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
              </>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: UI.muted }}>lädt…</div>
      ) : (
        <>
        <div style={{ display: isDesktop ? "none" : "grid", gap: 12 }}>
          {/* Tage (Mo–Fr etc.) als Cards */}
          {ROWS.filter((r) => r.type === "DAY").map((row) => {
            const dayYMD = fmtYMD(
              new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (row.offset ?? 0))
            );

            return (
              <details
                key={row.label}
                style={{
                  border: `1px solid ${UI.cellBorder}`,
                  borderRadius: 14,
                  background: UI.tableBg,
                  padding: 12,
                }}
              >
                <summary style={{ listStyle: "none", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 1000, fontSize: 16, color: UI.text }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: UI.muted }}>{fmtDE(new Date(dayYMD))}</div>
                  </div>
                </summary>

                <div style={{ height: 10 }} />

                <div style={{ display: "grid", gap: 10 }}>
                  {users.map((u) => {
                    const entryKey = `${dayYMD}_${u.id}`;
                    const cellEntries = entryGridMap.get(entryKey) ?? [];
                    const cellNotes = noteMap.get(`${dayYMD}_${u.id}`) ?? [];

                    return (
                      <div
                        key={`${dayYMD}_${u.id}`}
                        style={{
                          border: `1px solid ${UI.cardBorder}`,
                          borderRadius: 12,
                          padding: 10,
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div style={{ fontWeight: 1000, color: UI.text }}>{u.fullName}</div>
                          <button
                            type="button"
                            className="pill"
                            onClick={() => openCreateEntry(u.id, row)}
                            style={{ textDecoration: "none" }}
                          >
                            + Plan
                          </button>
                        </div>

                        {cellEntries.length > 0 ? (
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {cellEntries.map((e) => (
                              <div
                                key={e.id}
                                onClick={() => openEditEntry(e, row)}
                                style={{
                                  border: `1px solid ${UI.cardBorder}`,
                                  borderRadius: 10,
                                  padding: "10px 12px",
                                  background: UI.cardBg,
                                  color: UI.text,
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ fontWeight: 1000, fontSize: 13 }}>{e.activity}</div>
                                <div style={{ fontSize: 12, color: UI.muted, marginTop: 4 }}>
                                  {e.startHHMM}–{e.endHHMM}
                                  {e.location ? ` · ${e.location}` : ""}
                                </div>
                                {e.noteEmployee ? (
                                  <div style={{ fontSize: 12, color: UI.muted, marginTop: 6 }}>
                                    📝 MA: {e.noteEmployee}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, fontSize: 12, color: UI.muted }}>
                            Keine Einträge.
                          </div>
                        )}

                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          {cellNotes.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => openEditNote(n, row.label)}
                              style={{
                                border: `1px solid rgba(255,255,255,0.12)`,
                                borderRadius: 10,
                                padding: "10px 12px",
                                cursor: "pointer",
                                background: "rgba(255,255,255,0.03)",
                                color: "rgba(255,255,255,0.85)",
                              }}
                            >
                              <div style={{ fontWeight: 1000, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
                                🔒 Admin-Notiz
                              </div>
                              <div style={{ fontSize: 12, marginTop: 6, color: "rgba(255,255,255,0.70)" }}>
                                {n.note.trim() ? n.note : "(leer)"}
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => openCreateNote(u.id, dayYMD, row.label)}
                            style={{
                              width: "100%",
                              border: `1px dashed rgba(255,255,255,0.18)`,
                              borderRadius: 10,
                              padding: "10px 12px",
                              background: "rgba(255,255,255,0.03)",
                              cursor: "pointer",
                              textAlign: "left",
                              color: "rgba(255,255,255,0.75)",
                              fontWeight: 900,
                            }}
                          >
                            + Notiz (Admin)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}

          {/* Spezial-Zeilen (REP / SUB) als eigene Sektion */}
          {ROWS.filter((r) => r.type === "SPECIAL").map((row) => {
            const rowKey = row.tag as string;

            return (
              <details
                key={row.label}
                style={{
                  border: `1px solid ${UI.cellBorder}`,
                  borderRadius: 14,
                  background: UI.tableBg,
                  padding: 12,
                }}
              >
                <summary style={{ listStyle: "none", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 1000, fontSize: 16, color: UI.text }}>{row.label}</div>
                    <div style={{ color: UI.muted, fontWeight: 900 }}>▾</div>
                  </div>
                </summary>

<div style={{ height: 10 }} />

                <div style={{ display: "grid", gap: 10 }}>
                  {users.map((u) => {
                    const entryKey = `${rowKey}_${u.id}`;
                    const cellEntries = entryGridMap.get(entryKey) ?? [];

                    return (
                      <div
                        key={`${rowKey}_${u.id}`}
                        style={{
                          border: `1px solid ${UI.cardBorder}`,
                          borderRadius: 12,
                          padding: 10,
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div style={{ fontWeight: 1000, color: UI.text }}>{u.fullName}</div>
                          <button
                            type="button"
                            className="pill"
                            onClick={() => openCreateEntry(u.id, row)}
                            style={{ textDecoration: "none" }}
                          >
                            + Plan
                          </button>
                        </div>

                        {cellEntries.length > 0 ? (
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {cellEntries.map((e) => (
                              <div
                                key={e.id}
                                onClick={() => openEditEntry(e, row)}
                                style={{
                                  border: `1px solid ${UI.cardBorder}`,
                                  borderRadius: 10,
                                  padding: "10px 12px",
                                  background: UI.cardBg,
                                  color: UI.text,
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ fontWeight: 1000, fontSize: 13 }}>{e.activity}</div>
                                <div style={{ fontSize: 12, color: UI.muted, marginTop: 4 }}>
                                  {e.startHHMM}–{e.endHHMM}
                                  {e.location ? ` · ${e.location}` : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, fontSize: 12, color: UI.muted }}>Keine Einträge.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>

        <div
          style={{
            display: isDesktop ? "block" : "none",
            width: "100%",
            minWidth: 0,
            overflow: "auto",
            maxHeight: "calc(100vh - 220px)",
            border: `1px solid ${UI.cellBorder}`,
            borderRadius: 14,
            background: "rgba(11,15,12,0.96)",
            backdropFilter: "blur(8px)",
            position: "relative",
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: "100%",
              width: "max-content",
            }}
          >
            <thead>
              <tr style={{ background: UI.headerBg }}>
                <th
                  style={{
                    borderTop: `1px solid ${UI.cellBorder}`,
                    borderRight: `1px solid ${UI.cellBorder}`,
                    borderBottom: `1px solid ${UI.cellBorder}`,
                    borderLeft: "none",
                    padding: 12,
                    width: 180,
                    minWidth: 180,
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 5,
                    background: "rgba(15,20,17,0.98)",
                    boxShadow: "1px 0 0 rgba(255,255,255,0.08), 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                />
                {users.map((u) => (
                  <th
                    key={u.id}
                    style={{
                      borderTop: `1px solid ${UI.cellBorder}`,
                      borderRight: `1px solid ${UI.cellBorder}`,
                      borderBottom: `1px solid ${UI.cellBorder}`,
                      borderLeft: "none",
                      padding: 12,
                      textAlign: "left",
                      fontWeight: 900,
                      color: UI.text,
                      whiteSpace: "nowrap",
                      background: "rgba(15,20,17,0.98)",
                      position: "sticky",
                      top: 0,
                      zIndex: 4,
                      boxShadow: "0 1px 0 rgba(255,255,255,0.08)",
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
                        borderTop: `1px solid ${UI.cellBorder}`,
                        borderRight: `1px solid ${UI.cellBorder}`,
                        borderBottom: `1px solid ${UI.cellBorder}`,
                        borderLeft: "none",
                        padding: 12,
                        background: "rgba(15,20,17,0.98)",
                        fontWeight: 900,
                        color: UI.text,
                        verticalAlign: "top",
                        width: 180,
                        minWidth: 180,
                        whiteSpace: "nowrap",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        boxShadow: "1px 0 0 rgba(255,255,255,0.08)",
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
        </>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: isDesktop ? 12 : 10,
            width: "100%",
            minWidth: 0,
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Datum</div>
            <input
              type="date"
              value={entryForm.dateYMD}
              onChange={(e) => setEntryForm((p) => ({ ...p, dateYMD: e.target.value }))}
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 10px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>

          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Mitarbeiter</div>
            <select
              value={entryForm.userId}
              onChange={(e) => setEntryForm((p) => ({ ...p, userId: e.target.value }))}
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 10px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} style={{ color: "black" }}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Start</div>
            <input
              type="time"
              value={entryForm.startHHMM}
              onChange={(e) => setEntryForm((p) => ({ ...p, startHHMM: e.target.value }))}
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 8px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>

          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Ende</div>
            <input
              type="time"
              value={entryForm.endHHMM}
              onChange={(e) => setEntryForm((p) => ({ ...p, endHHMM: e.target.value }))}
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 8px",
                border: `1px solid ${UI.cellBorder}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: UI.text,
                appearance: "none",
                WebkitAppearance: "none",
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
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setDocsError(null);
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

                <div style={{ fontSize: 12, color: UI.muted, marginTop: 8 }}>
                  Erlaubt: PDF, JPG, PNG, WEBP · max. 15 MB
                </div>

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
                            <button
                              className="pill"
                              type="button"
                              onClick={() => {
                                void previewPlanDocument(d);
                              }}
                            >
                              In App ansehen
                            </button>

                            <button
                              className="pill"
                              type="button"
                              onClick={() => {
                                void sharePlanDocument(d);
                              }}
                            >
                              Teilen / Sichern
                            </button>

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

            <Modal
        open={previewOpen}
        title={previewDocTitle || "Dokument"}
        onClose={closePreview}
        maxWidth={980}
        zIndex={70}
        footer={
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <button className="pill" onClick={closePreview} type="button">
              Schließen
            </button>
          </div>
        }
      >
        {previewDocUrl ? (
          previewDocMimeType === "application/pdf" ? (
            <iframe
              src={previewDocUrl}
              title={previewDocTitle}
              style={{
                width: "100%",
                height: "70vh",
                border: "none",
                borderRadius: 10,
                background: "white",
              }}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src={previewDocUrl}
                alt={previewDocTitle}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: 10,
                }}
              />
            </div>
          )
        ) : (
          <div style={{ color: UI.muted }}>Keine Vorschau verfügbar.</div>
        )}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: isDesktop ? 12 : 10,
              width: "100%",
              minWidth: 0,
              alignItems: "start",
            }}
          >
            <div style={{ minWidth: 0, width: "100%" }}>
              <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Datum</div>
              <input
                type="date"
                value={noteForm.dateYMD}
                onChange={(e) => setNoteForm((p) => ({ ...p, dateYMD: e.target.value }))}
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  display: "block",
                  padding: isDesktop ? "10px 12px" : "10px 10px",
                  border: `1px solid ${UI.cellBorder}`,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  color: UI.text,
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>

            <div style={{ minWidth: 0, width: "100%" }}>
              <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>Mitarbeiter</div>
              <select
                value={noteForm.userId}
                onChange={(e) => setNoteForm((p) => ({ ...p, userId: e.target.value }))}
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  display: "block",
                  padding: isDesktop ? "10px 12px" : "10px 10px",
                  border: `1px solid ${UI.cellBorder}`,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  color: UI.text,
                  appearance: "none",
                  WebkitAppearance: "none",
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
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>
              Interne Admin-Notiz (nur für Admin)
            </div>
            <textarea
              value={noteForm.note}
              onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
              rows={10}
              style={{
                width: "100%",
                boxSizing: "border-box",
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
  </AppShell>
  );
}
