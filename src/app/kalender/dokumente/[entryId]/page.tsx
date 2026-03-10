"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import mammoth from "mammoth";
import AppShell from "@/components/AppShell";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ipod") ||
    ua.includes("mobile")
  );
}

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
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
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
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [pdfWidth, setPdfWidth] = useState<number>(900);
  const [previewPdfData, setPreviewPdfData] = useState<ArrayBuffer | null>(null);
  const [previewDocxHtml, setPreviewDocxHtml] = useState<string>("");

  function backToCalendar(): void {
    router.push("/kalender");
  }

  function buildFileUrl(docId: string, disposition: "inline" | "attachment"): string {
    return `/api/plan-entry-documents/file?id=${encodeURIComponent(docId)}&disposition=${disposition}`;
  }

  function revokePreviewUrl(): void {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }

  function closePreview(): void {
    revokePreviewUrl();
    setPreviewOpen(false);
    setPreviewMimeType("");
    setPreviewTitle("");
    setPdfPageCount(0);
    setPreviewPdfData(null);
    setPreviewDocxHtml("");
  }

  function updatePdfWidth(): void {
    if (typeof window === "undefined") return;
    const nextWidth = Math.max(280, Math.min(window.innerWidth - 32, 920));
    setPdfWidth(nextWidth);
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

  async function fetchDocumentArrayBuffer(
    docId: string,
    disposition: "inline" | "attachment"
  ): Promise<ArrayBuffer> {
    const response = await fetch(buildFileUrl(docId, disposition), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Datei konnte nicht geladen werden.");
    }

    return await response.arrayBuffer();
  }

  async function downloadDocument(doc: DocItem): Promise<void> {
    try {
      setErr(null);

      const blob = await fetchDocumentBlob(doc.id, "attachment");
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = doc.fileName || "dokument";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch {
      setErr("Dokument konnte nicht heruntergeladen werden.");
    }
  }

  async function previewDocument(doc: DocItem): Promise<void> {
    if (!canPreviewMime(doc.mimeType)) {
      setErr("Dieser Dateityp kann in der App nicht angezeigt werden.");
      return;
    }

    try {
      setErr(null);

      revokePreviewUrl();
      setPreviewPdfData(null);
      setPreviewDocxHtml("");
      setPdfPageCount(0);

      if (doc.mimeType === "application/pdf") {
        updatePdfWidth();

        const buffer = await fetchDocumentArrayBuffer(doc.id, "inline");
        setPreviewPdfData(buffer);
        setPreviewMimeType(doc.mimeType);
        setPreviewTitle(doc.title || doc.fileName);
        setPreviewOpen(true);
        return;
      }

      if (
        doc.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const buffer = await fetchDocumentArrayBuffer(doc.id, "inline");
        const result = await mammoth.convertToHtml({
          arrayBuffer: buffer,
        });

        setPreviewDocxHtml(result.value);
        setPreviewMimeType(doc.mimeType);
        setPreviewTitle(doc.title || doc.fileName);
        setPreviewOpen(true);
        return;
      }

      const blob = await fetchDocumentBlob(doc.id, "inline");
      const blobUrl = URL.createObjectURL(blob);

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

        setErr("Auf diesem Gerät ist 'Teilen / Sichern' hier nicht verfügbar.");
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setErr(null);
          return;
        }

        if (error instanceof Error && error.name === "AbortError") {
          setErr(null);
          return;
        }

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
    if (!previewOpen || previewMimeType !== "application/pdf") return;

    updatePdfWidth();

    const onResize = (): void => {
      updatePdfWidth();
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [previewOpen, previewMimeType]);

  useEffect(() => {
      if (!previewOpen || previewMimeType !== "application/pdf") return;

      updatePdfWidth();

      const onResize = (): void => {
        updatePdfWidth();
      };

      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }, [previewOpen, previewMimeType]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
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
                    disabled={!canPreviewMime(d.mimeType)}
                    style={!canPreviewMime(d.mimeType) ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                    title={
                      canPreviewMime(d.mimeType)
                        ? "Dokument in der App ansehen"
                        : "Dieser Dateityp kann nur heruntergeladen oder geteilt werden"
                    }
                  >
                    In App ansehen
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (isMobileDevice()) {
                        void shareDocument(d);
                        return;
                      }

                      void downloadDocument(d);
                    }}
                  >
                    {isMobileDevice() ? "Teilen / Sichern" : "Download"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewOpen ? (
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
            {previewMimeType === "application/pdf" && previewPdfData ? (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <Document
                  file={previewPdfData}
                  onLoadSuccess={({ numPages }: { numPages: number }) => {
                    setPdfPageCount(numPages);
                    setErr(null);
                  }}
                  onLoadError={() => {
                    setErr("PDF konnte nicht geladen werden.");
                  }}
                  loading={<div style={{ color: "white" }}>PDF wird geladen...</div>}
                  error={<div style={{ color: "white" }}>PDF konnte nicht geladen werden.</div>}
                >
                  <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
                    {Array.from({ length: pdfPageCount }, (_, index) => (
                      <Page
                        key={`pdf-page-${index + 1}`}
                        pageNumber={index + 1}
                        width={pdfWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    ))}
                  </div>
                </Document>
              </div>
            ) : previewMimeType === "application/pdf" ? (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  color: "white",
                }}
              >
                PDF wird geladen...
              </div>
            ) : previewMimeType ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: 920,
                    background: "white",
                    color: "#111",
                    borderRadius: 12,
                    padding: 24,
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                  }}
                  dangerouslySetInnerHTML={{ __html: previewDocxHtml }}
                />
              </div>
            ) : previewUrl ? (
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
            ) : (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  color: "white",
                }}
              >
                Vorschau wird geladen...
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}