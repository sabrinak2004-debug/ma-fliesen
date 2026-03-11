"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type DocItem = {
  id: string;
  planEntryId: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type ShareNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isDocItem(x: unknown): x is DocItem {
  return (
    isRecord(x) &&
    typeof x.id === "string" &&
    typeof x.planEntryId === "string" &&
    typeof x.title === "string" &&
    typeof x.fileName === "string" &&
    typeof x.mimeType === "string" &&
    typeof x.sizeBytes === "number" &&
    typeof x.createdAt === "string"
  );
}

function getDocsFromJson(j: unknown): DocItem[] {
  if (!isRecord(j)) return [];
  const docs = j["documents"];
  if (!Array.isArray(docs)) return [];
  const out: DocItem[] = [];
  for (const d of docs) {
    if (isDocItem(d)) out.push(d);
  }
  return out;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function canPreviewMime(mimeType: string): boolean {
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

export default function KalenderDokumentePage() {
  const router = useRouter();
  const params = useParams<{ entryId: string }>();
  const entryId = useMemo(() => (params?.entryId ? String(params.entryId) : ""), [params]);

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  function backToCalendar(): void {
    router.push("/kalender");
  }

  function buildFileUrl(docId: string, disposition: "inline" | "attachment"): string {
    return `/api/plan-entry-documents/file?id=${encodeURIComponent(docId)}&disposition=${disposition}`;
  }

  function revokePreviewUrl(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  function closePreview(): void {
    revokePreviewUrl();
    setPreviewOpen(false);
    setPreviewMimeType("");
    setPreviewTitle("");
  }

  async function fetchDocumentBlob(docId: string, disposition: "inline" | "attachment"): Promise<Blob> {
    const response = await fetch(buildFileUrl(docId, disposition), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Datei konnte nicht geladen werden.");
    }

    return await response.blob();
  }

  async function previewDocument(doc: DocItem): Promise<void> {
    if (!canPreviewMime(doc.mimeType)) {
      setErr("Dieser Dateityp kann in der App nicht angezeigt werden.");
      return;
    }

    try {
      setErr(null);

      const blob = await fetchDocumentBlob(doc.id, "inline");
      const blobUrl = URL.createObjectURL(blob);

      revokePreviewUrl();
      setPreviewUrl(blobUrl);
      setPreviewMimeType(doc.mimeType);
      setPreviewTitle(doc.title || doc.fileName);
      setPreviewOpen(true);
    } catch {
      setErr("Dokument konnte nicht in der App geöffnet werden.");
    }
  }

  async function shareDocument(doc: DocItem): Promise<void> {
    try {
      setErr(null);

      const blob = await fetchDocumentBlob(doc.id, "attachment");
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

      setErr("Auf diesem Gerät ist 'Teilen / In Dateien sichern' hier nicht verfügbar.");
    } catch {
      setErr("Dokument konnte nicht geteilt bzw. gespeichert werden.");
    }
  }

  async function loadDocs(): Promise<void> {
    if (!entryId) return;

    setLoading(true);
    setErr(null);

    try {
      const r = await fetch(`/api/plan-entry-documents?planEntryId=${encodeURIComponent(entryId)}`);
      const j: unknown = await r.json().catch(() => ({}));

      if (!r.ok) {
        const msg =
          isRecord(j) && typeof j.error === "string"
            ? j.error
            : "Dokumente konnten nicht geladen werden.";
        setErr(msg);
        setDocs([]);
        return;
      }

      setDocs(getDocsFromJson(j));
    } catch {
      setErr("Netzwerkfehler.");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="card card-olive" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Dokumente</div>
          <button className="btn" onClick={backToCalendar}>
            ← Zurück zum Kalender
          </button>
        </div>

        <div
          style={{
            height: 1,
            background: "var(--border)",
            margin: "14px 0",
            opacity: 0.7,
          }}
        />

        {loading ? (
          <div style={{ color: "var(--muted)" }}>Lade Dokumente...</div>
        ) : err ? (
          <div
            className="card"
            style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)" }}
          >
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{err}</span>
          </div>
        ) : docs.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Keine Dokumente vorhanden.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {docs.map((d) => (
              <div key={d.id} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 900 }}>{d.title}</div>
                <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                  {d.fileName} · {fmtBytes(d.sizeBytes)}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => {
                      void previewDocument(d);
                    }}
                  >
                    In App ansehen
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      void shareDocument(d);
                    }}
                  >
                    Teilen / Sichern
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewOpen && previewUrl ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              borderBottom: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(20,20,20,0.85)",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {previewTitle}
            </div>

            <button type="button" className="btn" onClick={closePreview}>
              Schließen
            </button>
          </div>

          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.02)",
              overflow: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {previewMimeType === "application/pdf" ? (
              <iframe
                src={previewUrl}
                title={previewTitle}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  background: "white",
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <img
                  src={previewUrl}
                  alt={previewTitle}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 12,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}