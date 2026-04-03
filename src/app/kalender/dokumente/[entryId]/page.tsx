"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
/* eslint-disable @next/next/no-img-element */


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

type ReactPdfModule = typeof import("react-pdf");

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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPdfPages, setPreviewPdfPages] = useState<number>(0);
  const [previewMimeType, setPreviewMimeType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [reactPdfModule, setReactPdfModule] = useState<ReactPdfModule | null>(null);
  const [pdfRenderWidth, setPdfRenderWidth] = useState<number>(360);
    const [pdfDevicePixelRatio, setPdfDevicePixelRatio] = useState<number>(2.5);

  const pdfOptions = useMemo(
    () => ({
      disableAutoFetch: true,
      disableStream: true,
    }),
    []
  );

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
    setPreviewLoading(false);
    setPreviewPdfPages(0);
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

      revokePreviewUrl();
      setPreviewPdfPages(0);
      setPreviewMimeType(doc.mimeType);
      setPreviewTitle(doc.title || doc.fileName);
      setPreviewLoading(true);
      setPreviewOpen(true);

      const blob = await fetchDocumentBlob(doc.id, "inline");
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (error) {
      closePreview();
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setErr(`Dokument konnte nicht in der App geöffnet werden: ${message}`);
    } finally {
      setPreviewLoading(false);
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
      const r = await fetch(`/api/plan-entry-documents?planEntryId=${encodeURIComponent(entryId)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
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
  function updatePdfRenderWidth(): void {
    const viewportWidth = window.innerWidth;
    const nextWidth =
      viewportWidth < 768
        ? Math.max(360, Math.min(viewportWidth - 24, 760))
        : Math.min(1400, viewportWidth - 120);

    const nextDevicePixelRatio = Math.min(
      Math.max(window.devicePixelRatio || 1, 2),
      5
    );

    setPdfRenderWidth(nextWidth);
    setPdfDevicePixelRatio(nextDevicePixelRatio);
  }

  updatePdfRenderWidth();
  window.addEventListener("resize", updatePdfRenderWidth);

  return () => {
    window.removeEventListener("resize", updatePdfRenderWidth);
  };
}, []);

    useEffect(() => {
      let active = true;

      async function loadReactPdf(): Promise<void> {
        try {
          const mod = await import("react-pdf");

          mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
          ).toString();

          if (active) {
            setReactPdfModule(mod);
          }
            } catch (error) {
          if (active) {
            const message = error instanceof Error ? error.message : "Unbekannter Fehler";
            setErr(`PDF-Viewer konnte nicht geladen werden: ${message}`);
          }
        }
      }

      void loadReactPdf();

      return () => {
        active = false;
      };
    }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const PdfDocument = reactPdfModule?.Document;
  const PdfPage = reactPdfModule?.Page;

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
          <div className="card app-danger-card">
            <span className="app-danger-text">{err}</span>
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

      {previewOpen ? (
        <div className="app-document-preview-overlay">
          <div className="app-document-preview-header">
            <div className="app-document-preview-title">
              {previewTitle}
            </div>

            <button type="button" className="btn" onClick={closePreview}>
              Schließen
            </button>
          </div>

          <div className="app-document-preview-body">
            {previewLoading ? (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  color: "white",
                  fontWeight: 700,
                }}
              >
                Dokument wird geladen...
              </div>
            ) : previewMimeType === "application/pdf" && previewUrl ? (
              <div
                style={{
                  minHeight: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                }}
              >
                {!PdfDocument || !PdfPage ? (
                  <div style={{ color: "white" }}>PDF-Viewer wird geladen...</div>
                ) : (
                  <PdfDocument
                    file={previewUrl}
                    options={pdfOptions}
                    loading={<div style={{ color: "white" }}>PDF wird geladen...</div>}
                    error={<div style={{ color: "white" }}>PDF konnte nicht geladen werden.</div>}
                    onLoadSuccess={({ numPages }: { numPages: number }) => {
                      setPreviewPdfPages(numPages);
                    }}
                    onLoadError={(error: Error) => {
                      setPreviewLoading(false);
                      setErr(`PDF konnte nicht geladen werden: ${error.message}`);
                    }}
                  >
                    {Array.from({ length: previewPdfPages }, (_, index) => (
                      <div
                        key={`pdf-page-${index + 1}`}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "center",
                          overflowX: "auto",
                        }}
                      >
                        <PdfPage
                          pageNumber={index + 1}
                          width={pdfRenderWidth}
                          devicePixelRatio={pdfDevicePixelRatio}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          renderMode="canvas"
                          loading={<div style={{ color: "white" }}>Seite wird geladen...</div>}
                        />
                      </div>
                    ))}
                  </PdfDocument>
                )}
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
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}