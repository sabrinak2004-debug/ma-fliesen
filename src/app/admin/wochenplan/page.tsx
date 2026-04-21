// src/app/admin/wochenplan/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import {
  translate,
  toHtmlLang,
  type AppUiLanguage,
  type AdminWeeklyPlanTextKey,
  ADMIN_WEEKLY_PLAN_UI_TEXTS,
} from "@/lib/i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faFilePdf, faCircleInfo } from "@fortawesome/free-solid-svg-icons";


type User = { id: string; fullName: string };

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: "DE" | "EN" | "IT" | "TR" | "SQ" | "KU" | "RO";
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
    (v.language === "DE" ||
      v.language === "EN" ||
      v.language === "IT" ||
      v.language === "TR" ||
      v.language === "SQ" ||
      v.language === "KU" ||
      v.language === "RO") &&
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
  { labelKey: "monday", offset: 0, type: "DAY" as const },
  { labelKey: "tuesday", offset: 1, type: "DAY" as const },
  { labelKey: "wednesday", offset: 2, type: "DAY" as const },
  { labelKey: "thursday", offset: 3, type: "DAY" as const },
  { labelKey: "friday", offset: 4, type: "DAY" as const },
  { labelKey: "saturday", offset: 5, type: "DAY" as const },
  { labelKey: "repairWork", offset: null, type: "SPECIAL" as const, tag: "REP" },
  { labelKey: "subcontractors", offset: null, type: "SPECIAL" as const, tag: "SUB" },
] as const;


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

function formatDateLocalized(d: Date, language: AppUiLanguage): string {
  return new Intl.DateTimeFormat(toHtmlLang(language), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(d);
}

function formatDateShortLocalized(d: Date, language: AppUiLanguage): string {
  return new Intl.DateTimeFormat(toHtmlLang(language), {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(d);
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

async function readFileViaFileReader(
  file: Blob,
  errorMessages: {
    fileReaderError: string;
    fileReaderAborted: string;
    invalidFileFormat: string;
  }
): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(errorMessages.fileReaderError));
    };

    reader.onabort = () => {
      reject(new Error(errorMessages.fileReaderAborted));
    };

    reader.onload = () => {
      const result = reader.result;

      if (!(result instanceof ArrayBuffer)) {
        reject(new Error(errorMessages.invalidFileFormat));
        return;
      }

      resolve(result);
    };

    reader.readAsArrayBuffer(file);
  });
}

async function normalizeUploadFile(
  file: File,
  errorMessages: {
    arrayBufferTimeout: string;
    fileReaderError: string;
    fileReaderAborted: string;
    invalidFileFormat: string;
  }
): Promise<File> {
  let arrayBuffer: ArrayBuffer | null = null;

  try {
    arrayBuffer = await withTimeout(
      file.arrayBuffer(),
      8000,
      errorMessages.arrayBufferTimeout
    );
  } catch {
    arrayBuffer = await withTimeout(
      readFileViaFileReader(file, {
        fileReaderError: errorMessages.fileReaderError,
        fileReaderAborted: errorMessages.fileReaderAborted,
        invalidFileFormat: errorMessages.invalidFileFormat,
      }),
      15000,
      errorMessages.fileReaderError
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
        background: "var(--overlay-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex,
      }}
    >
      <div
        className="app-modal-panel app-modal-panel-surface"
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "85vh",
          borderRadius: 16,
          color: "var(--text)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 18px 70px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="app-modal-header-surface"
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
          <button
            className="btn"
            onClick={onClose}
            type="button"
            aria-label={title}
          >
            ✕
          </button>
        </div>

        <div
          className="app-modal-body"
          style={{
            padding: 16,
            paddingRight: 10,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
          }}
        >
          {children}
        </div>

        {footer ? (
          <div
            className="app-modal-footer app-modal-footer-surface"
            style={{
              padding: 16,
              paddingRight: 10,
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
  const [desktopScrollState, setDesktopScrollState] = useState({
    left: false,
    right: false,
    top: false,
  });

  const language: AppUiLanguage = session?.language ?? "DE";

  const t = (key: AdminWeeklyPlanTextKey): string =>
    translate(language, key, ADMIN_WEEKLY_PLAN_UI_TEXTS);

  const rowLabel = (key: AdminWeeklyPlanTextKey): string =>
    translate(language, key, ADMIN_WEEKLY_PLAN_UI_TEXTS);
  function mapWeeklyPlanApiError(errorCode: string | null): string {
    switch (errorCode) {
      case "FORBIDDEN":
        return t("forbidden");
      case "WEEK_START_MISSING":
        return t("weekStartMissing");
      case "MISSING_FIELDS":
        return t("missingFields");
      case "INVALID_USER_ID":
        return t("invalidUserId");
      case "ENTRY_NOT_FOUND":
        return t("entryNotFound");
      default:
        return errorCode && errorCode.trim() ? errorCode : t("unknown");
    }
  }

  useEffect(() => {
    setDocTitle((current) => {
      if (
        current === "" ||
        current === translate("DE", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("EN", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("IT", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("TR", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("SQ", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("KU", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("RO", "siteSheetDefaultTitle", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("DE", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("EN", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("IT", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("TR", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("SQ", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("KU", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS) ||
        current === translate("RO", "document", ADMIN_WEEKLY_PLAN_UI_TEXTS)
      ) {
        return t("document");
      }

      return current;
    });
  }, [language, t]);

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
  const [docTitle, setDocTitle] = useState<string>(t("document"));
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
    return {
      kw,
      dateRange: `${formatDateShortLocalized(weekStart, language)} – ${formatDateLocalized(end, language)}`,
    };
  }, [weekStart, language]);

  function handleDesktopPlanScroll(event: React.UIEvent<HTMLDivElement>): void {
    const el = event.currentTarget;

    const hasLeft = el.scrollLeft > 8;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
    const hasTop = el.scrollTop > 8;

    setDesktopScrollState((prev) => {
      if (prev.left === hasLeft && prev.right === hasRight && prev.top === hasTop) {
        return prev;
      }

      return {
        left: hasLeft,
        right: hasRight,
        top: hasTop,
      };
    });
  }

  const desktopTableWidth = useMemo(() => {
    const firstColumnWidth = 180;
    const userColumnWidth = 220;
    return `max(100%, ${firstColumnWidth + users.length * userColumnWidth}px)`;
  }, [users]);

  async function loadData() {
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setPageError("");

    try {
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
        setPageError(t("accessDenied"));
        return;
      }

      if (!uRes.ok) {
        setUsers([]);
        setEntries([]);
        setAdminNotes([]);
        setPageError(t("usersLoadError"));
        return;
      }

      if (!eRes.ok) {
        setUsers([]);
        setEntries([]);
        setAdminNotes([]);
        setPageError(t("planEntriesLoadError"));
        return;
      }

      if (!nRes.ok) {
        setUsers([]);
        setEntries([]);
        setAdminNotes([]);
        setPageError(t("adminNotesLoadError"));
        return;
      }

      const uJson: unknown = await uRes.json().catch(() => ({}));
      const eJson: unknown = await eRes.json().catch(() => ({}));
      const nJson: unknown = await nRes.json().catch(() => ({}));

      setUsers(getArrayProp<User>(uJson, "users", isUser));
      setEntries(getArrayProp<PlanEntry>(eJson, "entries", isPlanEntry));
      setAdminNotes(getArrayProp<AdminNote>(nJson, "notes", isAdminNote));
    } catch {
      setUsers([]);
      setEntries([]);
      setAdminNotes([]);
      setPageError(t("weeklyPlanLoadError"));
    } finally {
      setLoading(false);
    }
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
        const msg = getStringProp(j, "error") ?? t("documentsLoadError");
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
      setDocsError(t("documentsNetworkError"));
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
      throw new Error(t("documentPreviewError"));
    }

    return await response.blob();
  }

  async function previewPlanDocument(doc: PlanEntryDocument): Promise<void> {
    if (!canPreviewMime(doc.mimeType)) {
      setDocsError(t("documentPreviewError"));
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
      setDocsError(t("documentPreviewError"));
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

      setDocsError(t("documentShareUnavailable"));
    } catch {
      setDocsError(t("documentShareError"));
    }
  }

  async function uploadDoc() {
    if (!editEntryId) {
      setPageError(t("documentsSaveEntryFirst"));
      return;
    }

    if (!selectedFile) {
      setDocsError(t("documentMissingFile"));
      return;
    }

    if (!PLAN_DOC_ALLOWED_MIME.has(selectedFile.type)) {
      setDocsError(t("documentInvalidType"));
      return;
    }

    if (selectedFile.size <= 0) {
      setDocsError(t("documentEmptyFile"));
      return;
    }

    if (selectedFile.size > PLAN_DOC_MAX_BYTES) {
      setDocsError(
        `${t("documentTooLarge")} (${formatBytes(selectedFile.size)}). ${t("maxAllowedPrefix")} ${formatBytes(PLAN_DOC_MAX_BYTES)}.`
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
        normalizeUploadFile(selectedFile, {
          arrayBufferTimeout: t("arrayBufferTimeout"),
          fileReaderError: t("fileReaderError"),
          fileReaderAborted: t("fileReaderAborted"),
          invalidFileFormat: t("invalidFileFormat"),
        }),
        15000,
        t("documentUploadReadError")
      );

      const fd = new FormData();
      fd.append("planEntryId", editEntryId);
      fd.append("title", docTitle.trim() || t("document"));
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
            ? t("documentTooLarge")
            : getStringProp(j, "error") ?? t("documentUploadFailed");
        setDocsError(msg);
        return;
      }

      setSelectedFile(null);
      await loadDocs(editEntryId);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setDocsError(t("documentUploadTimeout"));
        return;
      }

      if (error instanceof Error) {
        setDocsError(
          error.message && error.message.trim()
            ? error.message
            : t("documentUploadUnknownError")
        );
        return;
      }

      setDocsError(t("documentUploadNetworkError"));
    } finally {
      window.clearTimeout(timeoutId);
      setUploadingDoc(false);
    }
  }

  async function deleteDoc(id: string) {
    if (!editEntryId) return;
    const ok = typeof window !== "undefined" ? window.confirm(t("documentDeleteConfirm")) : false;
    if (!ok) return;

    setDeletingDocId(id);
    try {
      const r = await fetch(`/api/admin/plan-entry-documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        setPageError(t("documentDeleteFailed"));
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
    setDocTitle(t("document"));
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
      rowLabel: rowLabel(row.labelKey),
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
    setDocTitle(t("document"));

    setEntryModalOpen(true);
  }

  function openEditEntry(entry: PlanEntry, row: (typeof ROWS)[number]) {
    const isRep = (entry.activity ?? "").trim().toUpperCase().startsWith("REP:");
    const isSub = (entry.activity ?? "").trim().toUpperCase().startsWith("SUB:");

    setEditEntryId(entry.id);
    setEntryForm({
      userId: entry.userId,
      rowLabel: rowLabel(row.labelKey),
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
    if (!entryForm.userId) return setPageError(t("pleaseSelectEmployee"));
    if (!entryForm.dateYMD) return setPageError(t("pleaseSelectDate"));
    if (!entryForm.startHHMM || !entryForm.endHHMM) return setPageError(t("pleaseSelectStartEnd"));

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
        const rawMsg = getStringProp(err, "error");
        const msg = mapWeeklyPlanApiError(rawMsg);
        setPageError(`${t("saveEntryFailed")} ${msg}`);
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
    const ok = window.confirm(t("deleteEntryConfirm"));
    if (!ok) return;

    setDeletingEntry(true);
    try {
      const res = await fetch(`/api/admin/plan-entries?id=${editEntryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const rawMsg = getStringProp(err, "error");
        const msg = mapWeeklyPlanApiError(rawMsg);
        setPageError(`${t("deleteEntryFailed")} ${msg}`);
        return;
      }
      closeEntryModal();
      await loadData();
    } finally {
      setDeletingEntry(false);
    }
  }

  async function saveNote() {
    if (!noteForm.userId) return setPageError(t("pleaseSelectEmployee"));
    if (!noteForm.dateYMD) return setPageError(t("pleaseSelectDate"));

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
        const rawMsg = getStringProp(err, "error");
        const msg = mapWeeklyPlanApiError(rawMsg);
        setPageError(`${t("saveNoteFailed")} ${msg}`);
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
    const ok = typeof window !== "undefined" ? window.confirm(t("deleteNoteConfirm")) : false;
    if (!ok) return;

    setDeletingNote(true);
    try {
      const res = await fetch(`/api/admin/admin-notes?id=${editNoteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err: unknown = await res.json().catch(() => ({}));
        const rawMsg = getStringProp(err, "error");
        const msg = mapWeeklyPlanApiError(rawMsg);
        setPageError(`${t("deleteNoteFailed")} ${msg}`);
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
      <AppShell activeLabel={t("activeLabel")}>
        <div
          style={{
            padding: 14,
            width: "100%",
            minWidth: 0,
          }}
        >
          <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel={t("activeLabel")}>
    <div
      style={{
        padding: 14,
        width: "100%",
        minWidth: 0,
      }}
    >
      {pageError ? (
        <div
          className="tenant-status-card tenant-status-card-danger"
          style={{ marginBottom: 12 }}
        >
          <div className="tenant-status-text-danger">{pageError}</div>
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 14,
          color: "var(--text)",
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
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>
                {t("pageTitle")}
              </div>
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{t("calendarWeek")} {weekLabel.kw}</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                {weekLabel.dateRange}
              </div>
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
                  {t("previousWeek")}
                </button>

                <input
                  type="date"
                  value={fmtYMD(weekStart)}
                  onChange={(e) => setWeekStart(startOfWeek(new Date(e.target.value)))}
                  className="input"
                  style={{
                    flex: "0 0 136px",
                    width: 136,
                    minWidth: 136,
                    maxWidth: 136,
                    boxSizing: "border-box",
                    padding: "8px 10px",
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
                  {t("nextWeek")}
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
              {t("appointmentsBack")}
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
                  {t("previousWeek")}
                </button>

                <input
                  type="date"
                  value={fmtYMD(weekStart)}
                  onChange={(e) => setWeekStart(startOfWeek(new Date(e.target.value)))}
                  className="input"
                  style={{
                    padding: "8px 10px",
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
                  {t("nextWeek")}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
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
                key={rowLabel(row.labelKey)}
                className="card"
                style={{
                  padding: 12,
                }}
              >
                <summary style={{ listStyle: "none", cursor: "pointer" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontWeight: 1000, fontSize: 16, color: "var(--text)" }}>
                        {rowLabel(row.labelKey)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {formatDateLocalized(new Date(dayYMD), language)}
                      </div>
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
                        className="tenant-soft-panel"
                        style={{
                          padding: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div style={{ fontWeight: 1000, color: "var(--text)" }}>{u.fullName}</div>
                          <button
                            type="button"
                            className="pill"
                            onClick={() => openCreateEntry(u.id, row)}
                            style={{ textDecoration: "none" }}
                          >
                            {t("entryCreate")}
                          </button>
                        </div>

                        {cellEntries.length > 0 ? (
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {cellEntries.map((e) => (
                              <div
                                key={e.id}
                                onClick={() => openEditEntry(e, row)}
                                className="tenant-soft-panel-strong"
                                style={{
                                  padding: "10px 12px",
                                  color: "var(--text)",
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ fontWeight: 1000, fontSize: 13 }}>{e.activity}</div>
                                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                                  {e.startHHMM}–{e.endHHMM}
                                  {e.location ? ` · ${e.location}` : ""}
                                </div>
                                {e.noteEmployee ? (
                                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                    {t("employeeNotePrefix")} {e.noteEmployee}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                            {t("noEntries")}
                          </div>
                        )}

                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          {cellNotes.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => openEditNote(n, rowLabel(row.labelKey))}
                              className="tenant-soft-panel-strong"
                              style={{
                                padding: "10px 12px",
                                cursor: "pointer",
                                color: "var(--text-soft)",
                              }}
                            >
                              <div style={{ fontWeight: 1000, fontSize: 12, color: "var(--muted)" }}>
                                {t("adminNoteLabel")}
                              </div>
                              <div style={{ fontSize: 12, marginTop: 6, color: "var(--muted)" }}>
                                {n.note.trim() ? n.note : t("emptyValue")}
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => openCreateNote(u.id, dayYMD, rowLabel(row.labelKey))}
                            className="tenant-action-link"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              fontWeight: 900,
                            }}
                          >
                            {t("noteCreate")}
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
                key={rowLabel(row.labelKey)}
                className="card"
                style={{
                  padding: 12,
                }}
              >
                <summary style={{ listStyle: "none", cursor: "pointer" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontWeight: 1000, fontSize: 16, color: "var(--text)" }}>
                        {rowLabel(row.labelKey)}
                      </div>
                      <div style={{ color: "var(--muted)", fontWeight: 900 }}>▾</div>
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
                        className="tenant-soft-panel"
                        style={{
                          padding: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div style={{ fontWeight: 1000, color: "var(--text)" }}>{u.fullName}</div>
                          <button
                            type="button"
                            className="pill"
                            onClick={() => openCreateEntry(u.id, row)}
                            style={{ textDecoration: "none" }}
                          >
                            {t("entryCreate")}
                          </button>
                        </div>

                        {cellEntries.length > 0 ? (
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {cellEntries.map((e) => (
                              <div
                                key={e.id}
                                onClick={() => openEditEntry(e, row)}
                                className="tenant-soft-panel-strong"
                                style={{
                                  padding: "10px 12px",
                                  color: "var(--text)",
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ fontWeight: 1000, fontSize: 13 }}>{e.activity}</div>
                                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                                  {e.startHHMM}–{e.endHHMM}
                                  {e.location ? ` · ${e.location}` : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                            {t("noEntries")}
                          </div>
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
          className={[
            "wochenplan-shell",
            "card",
            desktopScrollState.left ? "is-scrolled-left" : "",
            desktopScrollState.right ? "is-scrolled-right" : "",
            desktopScrollState.top ? "is-scrolled-top" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            display: isDesktop ? "block" : "none",
            width: "100%",
            minWidth: 0,
            maxHeight: "calc(100vh - 220px)",
            position: "relative",
            overflow: "hidden",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="wochenplan-scroll"
            onScroll={handleDesktopPlanScroll}
            style={{
              width: "100%",
              height: "100%",
              minWidth: 0,
              overflow: "auto",
              maxHeight: "calc(100vh - 220px)",
              paddingRight: 28,
              paddingBottom: 18,
              boxSizing: "border-box",
              scrollBehavior: "smooth",
            }}
          >
            <table
              style={{
                borderCollapse: "separate",
                borderSpacing: 0,
                minWidth: "100%",
                width: desktopTableWidth,
              }}
            >
            <thead>
              <tr style={{ background: "color-mix(in srgb, var(--panel) 96%, transparent)" }}>
                <th
                  style={{
                    borderTop: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    borderLeft: "none",
                    padding: 12,
                    width: 180,
                    minWidth: 180,
                    textAlign: "left",
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 5,
                    background: "color-mix(in srgb, var(--panel) 96%, transparent)",
                    boxShadow: "1px 0 0 var(--border), 0 1px 0 var(--border)",
                    backdropFilter: "blur(10px)",
                  }}
                />
                {users.map((u) => (
                  <th
                    key={u.id}
                    style={{
                      borderTop: "1px solid var(--border)",
                      borderRight: "1px solid var(--border)",
                      borderBottom: "1px solid var(--border)",
                      borderLeft: "none",
                      padding: 12,
                      textAlign: "left",
                      fontWeight: 900,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      background: "color-mix(in srgb, var(--panel) 96%, transparent)",
                      position: "sticky",
                      top: 0,
                      zIndex: 4,
                      boxShadow: "0 1px 0 var(--border)",
                      minWidth: 220,
                      backdropFilter: "blur(10px)",
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
                  <tr key={rowLabel(row.labelKey)}>
                    <td
                      style={{
                        borderTop: "1px solid var(--border)",
                        borderRight: "1px solid var(--border)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "none",
                        padding: 12,
                        background: "color-mix(in srgb, var(--panel) 96%, transparent)",
                        fontWeight: 900,
                        color: "var(--text)",
                        verticalAlign: "top",
                        width: 180,
                        minWidth: 180,
                        whiteSpace: "nowrap",
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        boxShadow: "1px 0 0 var(--border)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {rowLabel(row.labelKey)}
                    </td>

                    {users.map((u) => {
                      const entryCellKey = `${rowKey}_${u.id}`;
                      const cellEntries = entryGridMap.get(entryCellKey) ?? [];

                      const notesKey = rowDayYMD ? `${rowDayYMD}_${u.id}` : "";
                      const cellNotes = rowDayYMD ? noteMap.get(notesKey) ?? [] : [];

                      return (
                        <td
                          key={`${rowLabel(row.labelKey)}_${u.id}`}
                          style={{
                            border: "1px solid var(--border)",
                            padding: 10,
                            verticalAlign: "top",
                            minWidth: 220,
                          }}
                        >
                          <div style={{ minHeight: 74, display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {cellEntries.map((e) => (
                                <div
                                  key={e.id}
                                  onClick={() => openEditEntry(e, row)}
                                  className="tenant-soft-panel-strong"
                                  style={{
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    color: "var(--text)",
                                  }}
                                  title={t("editPlanEntryTitle")}
                                >
                                  <div style={{ fontWeight: 900, fontSize: 13 }}>{e.activity}</div>
                                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                                    {e.startHHMM}–{e.endHHMM}
                                    {e.location ? ` · ${e.location}` : ""}
                                  </div>

                                  {e.noteEmployee ? (
                                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                                       <FontAwesomeIcon icon={faPenToSquare} />
                                      {t("employeeNotePrefix")} {e.noteEmployee}
                                    </div>
                                  ) : null}
                                </div>
                              ))}

                              <button
                                onClick={() => openCreateEntry(u.id, row)}
                                className="tenant-action-link"
                                style={{
                                  textAlign: "left",
                                  color: "var(--muted)",
                                }}
                              >
                                {t("entryCreate")}
                              </button>
                            </div>

                            {row.type === "DAY" && rowDayYMD ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {cellNotes.map((n) => (
                                  <div
                                    key={n.id}
                                    onClick={() => openEditNote(n, rowLabel(row.labelKey))}
                                    className="tenant-soft-panel-strong"
                                    style={{
                                      padding: "10px 12px",
                                      cursor: "pointer",
                                      color: "var(--text-soft)",
                                    }}
                                    title={t("editAdminNoteTitle")}
                                  >
                                    <div style={{ fontWeight: 900, fontSize: 12, color: "var(--muted)" }}>
                                      {t("adminNoteLabel")}
                                    </div>
                                    <div style={{ fontSize: 12, marginTop: 6, color: "var(--muted)" }}>
                                      {n.note.trim() ? n.note : t("emptyValue")}
                                    </div>
                                  </div>
                                ))}

                                <button
                                  onClick={() => openCreateNote(u.id, rowDayYMD, rowLabel(row.labelKey))}
                                  className="tenant-action-link"
                                  style={{
                                    textAlign: "left",
                                    color: "var(--muted)",
                                  }}
                                >
                                  {t("noteCreate")}
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
        </div>
        </>
      )}
    

      {/* -------------------- MODAL: PLAN-EINTRAG -------------------- */}
      <Modal
        open={entryModalOpen}
        title={`${editEntryId ? t("editPlanEntryTitle") : t("createPlanEntryTitle")} — ${entryForm.rowLabel} · ${
          users.find((x) => x.id === entryForm.userId)?.fullName ?? ""
        }`}
        onClose={closeEntryModal}
        footer={
          <>
            {editEntryId ? (
              <button className="pill" onClick={deleteEntry} disabled={savingEntry || deletingEntry}>
                {deletingEntry ? t("deleting") : t("delete")}
              </button>
            ) : (
              <div />
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill" onClick={closeEntryModal} disabled={savingEntry || deletingEntry}>
                {t("close")}
              </button>
              <button className="pill pill-active" onClick={saveEntry} disabled={savingEntry || deletingEntry}>
                {savingEntry ? t("saving") : t("save")}
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
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("date")}</div>
            <input
              type="date"
              value={entryForm.dateYMD}
              onChange={(e) => setEntryForm((p) => ({ ...p, dateYMD: e.target.value }))}
              className="input"
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 10px",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>

          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("employee")}</div>
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
                border: `1px solid ${"var(--border)"}`,
                borderRadius: 10,
                background: "rgba(0,0,0,0.25)",
                color: "var(--text)",
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
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("start")}</div>
            <input
              type="time"
              value={entryForm.startHHMM}
              onChange={(e) => setEntryForm((p) => ({ ...p, startHHMM: e.target.value }))}
              className="input"
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 8px",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>

          <div style={{ minWidth: 0, width: "100%" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("end")}</div>
            <input
              type="time"
              value={entryForm.endHHMM}
              onChange={(e) => setEntryForm((p) => ({ ...p, endHHMM: e.target.value }))}
              className="input"
              style={{
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                boxSizing: "border-box",
                display: "block",
                padding: isDesktop ? "10px 12px" : "10px 8px",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("activity")}</div>
            <input
              value={entryForm.activity}
              onChange={(e) => setEntryForm((p) => ({ ...p, activity: e.target.value }))}
              className="input"
            />
            {entryForm.specialTag ? (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {t("keepPrefixHint")} <b>{entryForm.specialTag}:</b>
              </div>
            ) : null}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("location")}</div>
            <input
              value={entryForm.location}
              onChange={(e) => setEntryForm((p) => ({ ...p, location: e.target.value }))}
              className="input"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("travelMinutes")}</div>
            <input
              type="number"
              min={0}
              value={entryForm.travelMinutes}
              onChange={(e) => setEntryForm((p) => ({ ...p, travelMinutes: Number(e.target.value || 0) }))}
              className="input"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("employeeNote")}</div>
            <textarea
              value={entryForm.noteEmployee}
              onChange={(e) => setEntryForm((p) => ({ ...p, noteEmployee: e.target.value }))}
              rows={3}
              className="textarea"
            />
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              {t("employeeNoteHelp")}
            </div>
          </div>

          {/* -------------------- DOKUMENTE (Admin) -------------------- */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ height: 1, background: "var(--border)", margin: "10px 0", opacity: 0.9 }} />

            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}><FontAwesomeIcon icon={faFilePdf} />{t("documentsTitle")}</div>

            {!editEntryId ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {t("documentsSaveEntryFirst")}
              </div>
            ) : (
              <>
                {docsError ? (
                  <div className="tenant-status-text-danger" style={{ fontSize: 12, marginBottom: 8 }}>
                    {docsError}
                  </div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("title")}</div>
                    <input
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("file")}</div>

                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        width: "100%",
                      }}
                    >
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setDocsError(null);
                          setSelectedFile(f);
                        }}
                        style={{ display: "none" }}
                      />

                      <span
                        className="pill"
                        style={{
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        {t("chooseFile")}
                      </span>

                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          minWidth: 0,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={selectedFile?.name ?? t("noFileSelected")}
                      >
                        {selectedFile?.name ?? t("noFileSelected")}
                      </span>
                    </label>
                  </div>
                </div>

                <button className="pill pill-active" type="button" onClick={uploadDoc} disabled={uploadingDoc}>
                  {uploadingDoc ? t("uploading") : t("uploadDocument")}
                </button>

                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  {t("documentAllowedInfo")}
                </div>

                <div style={{ marginTop: 12 }}>
                  {docsLoading ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("loadingDocuments")}</div>
                  ) : docs.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("noDocuments")}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {docs.map((d) => (
                        <div
                          key={d.id}
                          className="tenant-soft-panel-strong"
                          style={{
                            padding: "10px 12px",
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
                                color: "var(--muted)",
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
                              {t("previewInApp")}
                            </button>

                            <button
                              className="pill"
                              type="button"
                              onClick={() => {
                                void sharePlanDocument(d);
                              }}
                            >
                              {t("shareOrSave")}
                            </button>

                            <button
                              className="pill"
                              type="button"
                              onClick={() => deleteDoc(d.id)}
                              disabled={deletingDocId === d.id}
                            >
                              {deletingDocId === d.id ? t("deleting") : t("delete")}
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

          <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--muted)" }}>
            <FontAwesomeIcon icon={faCircleInfo} />{t("internalAdminNoteInfo")}
          </div>
        </div>
      </Modal>

            <Modal
        open={previewOpen}
        title={previewDocTitle || t("document")}
        onClose={closePreview}
        maxWidth={980}
        zIndex={70}
        footer={
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <button className="pill" onClick={closePreview} type="button">
                {t("close")}
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
                background: "var(--panel)",
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
          <div style={{ color: "var(--muted)" }}>{t("noPreviewAvailable")}</div>
        )}
      </Modal>

      {/* -------------------- MODAL: ADMIN-NOTIZ (SEPARAT) -------------------- */}
      <Modal
        open={noteModalOpen}
        title={`${editNoteId ? t("editAdminNoteTitle") : t("createAdminNoteTitle")} — ${noteForm.rowLabel} · ${
          users.find((x) => x.id === noteForm.userId)?.fullName ?? ""
        }`}
        onClose={closeNoteModal}
        zIndex={60}
        footer={
          <>
            {editNoteId ? (
              <button className="pill" onClick={deleteNote} disabled={savingNote || deletingNote}>
                {deletingNote ? t("deleting") : t("delete")}
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button className="pill" onClick={closeNoteModal} disabled={savingNote || deletingNote}>
                {t("close")}
              </button>
              <button className="pill pill-active" onClick={saveNote} disabled={savingNote || deletingNote}>
                {savingNote ? t("saving") : t("save")}
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
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("date")}</div>
              <input
                type="date"
                value={noteForm.dateYMD}
                onChange={(e) => setNoteForm((p) => ({ ...p, dateYMD: e.target.value }))}
                className="input"
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  display: "block",
                  padding: isDesktop ? "10px 12px" : "10px 10px",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>

            <div style={{ minWidth: 0, width: "100%" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{t("employee")}</div>
              <select
                value={noteForm.userId}
                onChange={(e) => setNoteForm((p) => ({ ...p, userId: e.target.value }))}
                className="select"
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  display: "block",
                  padding: isDesktop ? "10px 12px" : "10px 10px",
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
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              {t("internalAdminNote")}
            </div>
            <textarea
              value={noteForm.note}
              onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
              rows={10}
              className="textarea"
              style={{
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              {t("internalAdminNoteHelp")}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </AppShell>
  );
}
