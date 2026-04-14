"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { translate, type AppUiLanguage } from "@/lib/i18n";
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

type SessionDTO = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl?: string | null;
  primaryColor?: string | null;
};

type KalenderDokumenteTextKey =
  | "unexpectedResponse"
  | "fileCouldNotBeLoaded"
  | "previewUnsupported"
  | "unknownError"
  | "previewOpenError"
  | "shareUnavailable"
  | "shareFailed"
  | "documentsCouldNotBeLoaded"
  | "networkError"
  | "pdfViewerLoadError"
  | "documents"
  | "backToCalendar"
  | "loadingDocuments"
  | "noDocuments"
  | "previewInApp"
  | "shareSave"
  | "close"
  | "documentLoading"
  | "pdfViewerLoading"
  | "pdfLoading"
  | "pdfLoadFailed"
  | "pageLoading";

const KALENDER_DOKUMENTE_DICTIONARY: Record<
  KalenderDokumenteTextKey,
  Record<AppUiLanguage, string>
> = {
  unexpectedResponse: {
    DE: "Unerwartete Antwort.",
    EN: "Unexpected response.",
    IT: "Risposta inattesa.",
    TR: "Beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur.",
    KU: "Bersiva neçaverêkirî.",
  },
  fileCouldNotBeLoaded: {
    DE: "Datei konnte nicht geladen werden.",
    EN: "File could not be loaded.",
    IT: "Impossibile caricare il file.",
    TR: "Dosya yüklenemedi.",
    SQ: "Skedari nuk mund të ngarkohej.",
    KU: "Pel nehat barkirin.",
  },
  previewUnsupported: {
    DE: "Dieser Dateityp kann in der App nicht angezeigt werden.",
    EN: "This file type cannot be displayed in the app.",
    IT: "Questo tipo di file non può essere visualizzato nell'app.",
    TR: "Bu dosya türü uygulamada görüntülenemez.",
    SQ: "Ky lloj skedari nuk mund të shfaqet në aplikacion.",
    KU: "Ev cureya pelê di appê de nayê nîşandan.",
  },
  unknownError: {
    DE: "Unbekannter Fehler",
    EN: "Unknown error",
    IT: "Errore sconosciuto",
    TR: "Bilinmeyen hata",
    SQ: "Gabim i panjohur",
    KU: "Çewtiya nenas",
  },
  previewOpenError: {
    DE: "Dokument konnte nicht in der App geöffnet werden: {message}",
    EN: "Document could not be opened in the app: {message}",
    IT: "Impossibile aprire il documento nell'app: {message}",
    TR: "Belge uygulamada açılamadı: {message}",
    SQ: "Dokumenti nuk mund të hapej në aplikacion: {message}",
    KU: "Belge di appê de venebû: {message}",
  },
  shareUnavailable: {
    DE: "Auf diesem Gerät ist 'Teilen / In Dateien sichern' hier nicht verfügbar.",
    EN: "“Share / Save to files” is not available here on this device.",
    IT: "“Condividi / Salva nei file” non è disponibile qui su questo dispositivo.",
    TR: "Bu cihazda burada “Paylaş / Dosyalara kaydet” kullanılamıyor.",
    SQ: "“Ndaj / Ruaj te skedarët” nuk është i disponueshëm këtu në këtë pajisje.",
    KU: "Li ser vê cîhazê de “Parve bike / Di pelan de tomar bike” li vir tune ye.",
  },
  shareFailed: {
    DE: "Dokument konnte nicht geteilt bzw. gespeichert werden.",
    EN: "Document could not be shared or saved.",
    IT: "Il documento non può essere condiviso o salvato.",
    TR: "Belge paylaşılamadı veya kaydedilemedi.",
    SQ: "Dokumenti nuk mund të ndahej ose ruhej.",
    KU: "Belge nehat parvekirin an tomarkirin.",
  },
  documentsCouldNotBeLoaded: {
    DE: "Dokumente konnten nicht geladen werden.",
    EN: "Documents could not be loaded.",
    IT: "Impossibile caricare i documenti.",
    TR: "Belgeler yüklenemedi.",
    SQ: "Dokumentet nuk mund të ngarkoheshin.",
    KU: "Belge nehatin barkirin.",
  },
  networkError: {
    DE: "Netzwerkfehler.",
    EN: "Network error.",
    IT: "Errore di rete.",
    TR: "Ağ hatası.",
    SQ: "Gabim rrjeti.",
    KU: "Çewtiya torê.",
  },
  pdfViewerLoadError: {
    DE: "PDF-Viewer konnte nicht geladen werden: {message}",
    EN: "PDF viewer could not be loaded: {message}",
    IT: "Impossibile caricare il visualizzatore PDF: {message}",
    TR: "PDF görüntüleyici yüklenemedi: {message}",
    SQ: "Shikuesi PDF nuk mund të ngarkohej: {message}",
    KU: "Nîşanderê PDF nehat barkirin: {message}",
  },
  documents: {
    DE: "Dokumente",
    EN: "Documents",
    IT: "Documenti",
    TR: "Belgeler",
    SQ: "Dokumentet",
    KU: "Belge",
  },
  backToCalendar: {
    DE: "← Zurück zum Kalender",
    EN: "← Back to calendar",
    IT: "← Torna al calendario",
    TR: "← Takvime geri dön",
    SQ: "← Kthehu te kalendari",
    KU: "← Vegere salnameyê",
  },
  loadingDocuments: {
    DE: "Lade Dokumente...",
    EN: "Loading documents...",
    IT: "Caricamento documenti...",
    TR: "Belgeler yükleniyor...",
    SQ: "Dokumentet po ngarkohen...",
    KU: "Belge têne barkirin...",
  },
  noDocuments: {
    DE: "Keine Dokumente vorhanden.",
    EN: "No documents available.",
    IT: "Nessun documento disponibile.",
    TR: "Belge yok.",
    SQ: "Nuk ka dokumente të disponueshme.",
    KU: "Belge tune ne.",
  },
  previewInApp: {
    DE: "In App ansehen",
    EN: "View in app",
    IT: "Apri nell'app",
    TR: "Uygulamada görüntüle",
    SQ: "Shiko në aplikacion",
    KU: "Di appê de bibîne",
  },
  shareSave: {
    DE: "Teilen / Sichern",
    EN: "Share / Save",
    IT: "Condividi / Salva",
    TR: "Paylaş / Kaydet",
    SQ: "Ndaj / Ruaj",
    KU: "Parve bike / Tomar bike",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  documentLoading: {
    DE: "Dokument wird geladen...",
    EN: "Document is loading...",
    IT: "Caricamento documento...",
    TR: "Belge yükleniyor...",
    SQ: "Dokumenti po ngarkohet...",
    KU: "Belge tê barkirin...",
  },
  pdfViewerLoading: {
    DE: "PDF-Viewer wird geladen...",
    EN: "PDF viewer is loading...",
    IT: "Caricamento visualizzatore PDF...",
    TR: "PDF görüntüleyici yükleniyor...",
    SQ: "Shikuesi PDF po ngarkohet...",
    KU: "Nîşanderê PDF tê barkirin...",
  },
  pdfLoading: {
    DE: "PDF wird geladen...",
    EN: "PDF is loading...",
    IT: "Caricamento PDF...",
    TR: "PDF yükleniyor...",
    SQ: "PDF po ngarkohet...",
    KU: "PDF tê barkirin...",
  },
  pdfLoadFailed: {
    DE: "PDF konnte nicht geladen werden.",
    EN: "PDF could not be loaded.",
    IT: "Impossibile caricare il PDF.",
    TR: "PDF yüklenemedi.",
    SQ: "PDF nuk mund të ngarkohej.",
    KU: "PDF nehat barkirin.",
  },
  pageLoading: {
    DE: "Seite wird geladen...",
    EN: "Page is loading...",
    IT: "Caricamento pagina...",
    TR: "Sayfa yükleniyor...",
    SQ: "Faqja po ngarkohet...",
    KU: "Rûpel tê barkirin...",
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function isSessionDTO(v: unknown): v is SessionDTO {
  if (!isRecord(v)) return false;

  const userId = getStringField(v, "userId");
  const fullName = getStringField(v, "fullName");
  const role = getStringField(v, "role");
  const language = getStringField(v, "language");
  const companyId = getStringField(v, "companyId");
  const companyName = getStringField(v, "companyName");
  const companySubdomain = getStringField(v, "companySubdomain");

  const companyLogoUrlRaw = v["companyLogoUrl"];
  const primaryColorRaw = v["primaryColor"];

  const companyLogoUrl =
    companyLogoUrlRaw === undefined ||
    companyLogoUrlRaw === null ||
    typeof companyLogoUrlRaw === "string";

  const primaryColor =
    primaryColorRaw === undefined ||
    primaryColorRaw === null ||
    typeof primaryColorRaw === "string";

  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "ADMIN" || role === "EMPLOYEE") &&
    (language === "DE" ||
      language === "EN" ||
      language === "IT" ||
      language === "TR" ||
      language === "SQ" ||
      language === "KU") &&
    typeof companyId === "string" &&
    typeof companyName === "string" &&
    typeof companySubdomain === "string" &&
    companyLogoUrl &&
    primaryColor
  );
}

function parseMeResponse(j: unknown): SessionDTO | null {
  if (!isRecord(j)) return null;
  const session = j["session"];
  if (session === null) return null;
  return isSessionDTO(session) ? session : null;
}

function replaceTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
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
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = (key: KalenderDokumenteTextKey): string =>
    translate(language, key, KALENDER_DOKUMENTE_DICTIONARY);
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
      throw new Error(t("fileCouldNotBeLoaded"));
    }

    return await response.blob();
  }

  async function previewDocument(doc: DocItem): Promise<void> {
    if (!canPreviewMime(doc.mimeType)) {
      setErr(t("previewUnsupported"));
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
      const message = error instanceof Error ? error.message : t("unknownError");
      setErr(
        replaceTemplate(t("previewOpenError"), {
          message,
        })
      );
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

      setErr(t("shareUnavailable"));
    } catch {
      setErr(t("shareFailed"));
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
            : t("documentsCouldNotBeLoaded");
        setErr(msg);
        setDocs([]);
        return;
      }

      setDocs(getDocsFromJson(j));
    } catch {
      setErr(t("networkError"));
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    fetch("/api/me", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!alive) return;
        const parsed = parseMeResponse(j);
        if (parsed?.language) {
          setLanguage(parsed.language);
        }
      })
      .catch(() => {
        if (!alive) return;
      });

    return () => {
      alive = false;
    };
  }, []);

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
          const message = error instanceof Error ? error.message : t("unknownError");
          setErr(
            replaceTemplate(t("pdfViewerLoadError"), {
              message,
            })
          );
        }
      }
    }

    void loadReactPdf();

    return () => {
      active = false;
    };
  }, [language]);

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
    <AppShell activeLabel={t("documents")}>
      <div className="card card-olive" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>{t("documents")}</div>
          <button className="btn" onClick={backToCalendar}>
            {t("backToCalendar")}
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
          <div style={{ color: "var(--muted)" }}>{t("loadingDocuments")}</div>
        ) : err ? (
          <div className="card app-danger-card">
            <span className="app-danger-text">{err}</span>
          </div>
        ) : docs.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>{t("noDocuments")}</div>
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
                    {t("previewInApp")}
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      void shareDocument(d);
                    }}
                  >
                    {t("shareSave")}
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
              {t("close")}
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
                {t("documentLoading")}
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
                  <div style={{ color: "white" }}>{t("pdfViewerLoading")}</div>
                ) : (
                  <PdfDocument
                    file={previewUrl}
                    options={pdfOptions}
                    loading={<div style={{ color: "white" }}>{t("pdfLoading")}</div>}
                    error={<div style={{ color: "white" }}>{t("pdfLoadFailed")}</div>}
                    onLoadSuccess={({ numPages }: { numPages: number }) => {
                      setPreviewPdfPages(numPages);
                    }}
                    onLoadError={(error: Error) => {
                      setPreviewLoading(false);
                      setErr(
                        replaceTemplate(t("pdfViewerLoadError"), {
                          message: error.message,
                        })
                      );
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
                          loading={<div style={{ color: "white" }}>{t("pageLoading")}</div>}
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