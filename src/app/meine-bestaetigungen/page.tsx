"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import { CircleCheckBig, CircleX, ClipboardCheck } from "lucide-react";

type ConfirmationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

type SnapshotEntryKind = "WORK_ENTRY" | "DOCTOR_APPOINTMENT";

type MonthlyConfirmationSnapshotEntry = {
  id: string;
  kind: SnapshotEntryKind;
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  noteEmployee: string;
  createdAt: string;
  updatedAt: string;
};

type MonthlyConfirmationItem = {
  id: string;
  year: number;
  month: number;
  status: ConfirmationStatus;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  confirmationText: string | null;
  requiredUntilAt: string | null;
  updatedAt: string;
  entries: MonthlyConfirmationSnapshotEntry[];
};

type MeResponse =
  | {
      ok: true;
      session: {
        language: AppUiLanguage;
        role: "ADMIN" | "EMPLOYEE";
      } | null;
    }
  | { ok: false };

type ApiResponse =
  | {
      ok: true;
      confirmations: MonthlyConfirmationItem[];
    }
  | {
      ok: false;
      error: string;
    };

type PageTextKey =
  | "activeLabel"
  | "pageTitle"
  | "pageDescription"
  | "confirmed"
  | "rejected"
  | "pending"
  | "confirmedKpi"
  | "rejectedKpi"
  | "openKpi"
  | "loading"
  | "loadError"
  | "empty"
  | "details"
  | "close"
  | "confirmedAt"
  | "rejectedAt"
  | "updatedAt"
  | "requiredUntil"
  | "rejectionReason"
  | "confirmationText"
  | "confirmedEntries"
  | "workEntry"
  | "doctorAppointment"
  | "activity"
  | "location"
  | "gross"
  | "break"
  | "net"
  | "travelTime"
  | "note"
  | "noNote"
  | "noText"
  | "entries"
  | "entry";

const TEXTS: Record<PageTextKey, Record<AppUiLanguage, string>> = {
  activeLabel: {
    DE: "Meine Bestätigungen",
    EN: "My confirmations",
    IT: "Le mie conferme",
    TR: "Onaylarım",
    SQ: "Konfirmimet e mia",
    KU: "Piştrastkirinên min",
    RO: "Confirmările mele",
  },
  pageTitle: {
    DE: "Meine Monatsbestätigungen",
    EN: "My monthly confirmations",
    IT: "Le mie conferme mensili",
    TR: "Aylık onaylarım",
    SQ: "Konfirmimet e mia mujore",
    KU: "Piştrastkirinên mehane yên min",
    RO: "Confirmările mele lunare",
  },
  pageDescription: {
    DE: "Hier siehst du, welche Monate du bestätigt oder abgelehnt hast und welche Arbeitszeiten dabei gespeichert wurden.",
    EN: "Here you can see which months you confirmed or rejected and which work entries were saved.",
    IT: "Qui vedi quali mesi hai confermato o rifiutato.",
    TR: "Burada hangi ayları onayladığını veya reddettiğini görebilirsin.",
    SQ: "Këtu sheh cilët muaj ke konfirmuar ose refuzuar.",
    KU: "Li vir tu dibînî kîjan meh te piştrast an red kirine.",
    RO: "Aici vezi ce luni ai confirmat sau respins.",
  },
  confirmed: { DE: "Bestätigt", EN: "Confirmed", IT: "Confermato", TR: "Onaylandı", SQ: "Konfirmuar", KU: "Piştrastkirî", RO: "Confirmat" },
  rejected: { DE: "Abgelehnt", EN: "Rejected", IT: "Rifiutato", TR: "Reddedildi", SQ: "Refuzuar", KU: "Redkirî", RO: "Respins" },
  pending: { DE: "Offen", EN: "Open", IT: "Aperto", TR: "Açık", SQ: "Hapur", KU: "Vekirî", RO: "Deschis" },
  confirmedKpi: { DE: "Bestätigt", EN: "Confirmed", IT: "Confermati", TR: "Onaylanan", SQ: "Konfirmuar", KU: "Piştrastkirî", RO: "Confirmate" },
  rejectedKpi: { DE: "Abgelehnt", EN: "Rejected", IT: "Rifiutati", TR: "Reddedilen", SQ: "Refuzuar", KU: "Redkirî", RO: "Respinse" },
  openKpi: { DE: "Offen", EN: "Open", IT: "Aperti", TR: "Açık", SQ: "Hapur", KU: "Vekirî", RO: "Deschise" },
  loading: { DE: "Lade...", EN: "Loading...", IT: "Caricamento...", TR: "Yükleniyor...", SQ: "Duke u ngarkuar...", KU: "Tê barkirin...", RO: "Se încarcă..." },
  loadError: { DE: "Bestätigungen konnten nicht geladen werden.", EN: "Confirmations could not be loaded.", IT: "Impossibile caricare le conferme.", TR: "Onaylar yüklenemedi.", SQ: "Konfirmimet nuk mund të ngarkoheshin.", KU: "Nehatin barkirin.", RO: "Confirmările nu au putut fi încărcate." },
  empty: { DE: "Noch keine Monatsbestätigungen vorhanden.", EN: "No monthly confirmations yet.", IT: "Ancora nessuna conferma.", TR: "Henüz onay yok.", SQ: "Ende nuk ka konfirmime.", KU: "Hêj tune ye.", RO: "Nu există încă confirmări." },
  details: { DE: "Details", EN: "Details", IT: "Dettagli", TR: "Detaylar", SQ: "Detaje", KU: "Hûrgulî", RO: "Detalii" },
  close: { DE: "Schließen", EN: "Close", IT: "Chiudi", TR: "Kapat", SQ: "Mbyll", KU: "Bigire", RO: "Închide" },
  confirmedAt: { DE: "Bestätigt am", EN: "Confirmed at", IT: "Confermato il", TR: "Onay tarihi", SQ: "Konfirmuar më", KU: "Piştrastkirin di", RO: "Confirmat la" },
  rejectedAt: { DE: "Abgelehnt am", EN: "Rejected at", IT: "Rifiutato il", TR: "Red tarihi", SQ: "Refuzuar më", KU: "Redkirin di", RO: "Respins la" },
  updatedAt: { DE: "Zuletzt geändert", EN: "Last updated", IT: "Ultimo aggiornamento", TR: "Son güncelleme", SQ: "Përditësuar së fundi", KU: "Nûkirina dawî", RO: "Ultima actualizare" },
  requiredUntil: { DE: "Erforderlich bis", EN: "Required until", IT: "Richiesto entro", TR: "Son tarih", SQ: "Kërkohet deri", KU: "Pêwist heta", RO: "Necesar până la" },
  rejectionReason: { DE: "Ablehnungsgrund", EN: "Rejection reason", IT: "Motivo del rifiuto", TR: "Red nedeni", SQ: "Arsyeja e refuzimit", KU: "Sedema redkirinê", RO: "Motivul respingerii" },
  confirmationText: { DE: "Bestätigungstext", EN: "Confirmation text", IT: "Testo di conferma", TR: "Onay metni", SQ: "Teksti i konfirmimit", KU: "Nivîsa piştrastkirinê", RO: "Text de confirmare" },
  confirmedEntries: { DE: "Gespeicherte Einträge", EN: "Saved entries", IT: "Voci salvate", TR: "Kaydedilen kayıtlar", SQ: "Regjistrime të ruajtura", KU: "Tomarên tomarbûyî", RO: "Înregistrări salvate" },
  workEntry: { DE: "Arbeitseintrag", EN: "Work entry", IT: "Voce lavoro", TR: "Çalışma kaydı", SQ: "Regjistrim pune", KU: "Tomara karê", RO: "Înregistrare muncă" },
  doctorAppointment: { DE: "Arzttermin", EN: "Doctor appointment", IT: "Visita medica", TR: "Doktor randevusu", SQ: "Takim te mjeku", KU: "Hevdîtina bijîşk", RO: "Programare medicală" },
  activity: { DE: "Tätigkeit", EN: "Activity", IT: "Attività", TR: "Faaliyet", SQ: "Aktiviteti", KU: "Çalakî", RO: "Activitate" },
  location: { DE: "Einsatzort", EN: "Location", IT: "Luogo", TR: "Yer", SQ: "Vendndodhja", KU: "Cih", RO: "Locație" },
  gross: { DE: "Brutto", EN: "Gross", IT: "Lordo", TR: "Brüt", SQ: "Bruto", KU: "Berî derxistin", RO: "Brut" },
  break: { DE: "Pause", EN: "Break", IT: "Pausa", TR: "Mola", SQ: "Pushim", KU: "Navber", RO: "Pauză" },
  net: { DE: "Netto", EN: "Net", IT: "Netto", TR: "Net", SQ: "Neto", KU: "Safî", RO: "Net" },
  travelTime: { DE: "Fahrtzeit", EN: "Travel time", IT: "Tempo viaggio", TR: "Yol süresi", SQ: "Koha e udhëtimit", KU: "Dema rê", RO: "Timp deplasare" },
  note: { DE: "Notiz", EN: "Note", IT: "Nota", TR: "Not", SQ: "Shënim", KU: "Nîşe", RO: "Notă" },
  noNote: { DE: "Keine Notiz", EN: "No note", IT: "Nessuna nota", TR: "Not yok", SQ: "Nuk ka shënim", KU: "Nîşe tune", RO: "Nicio notă" },
  noText: { DE: "Kein Text vorhanden.", EN: "No text available.", IT: "Nessun testo disponibile.", TR: "Metin yok.", SQ: "Nuk ka tekst.", KU: "Nivîs tune.", RO: "Nu există text." },
  entries: { DE: "Einträge", EN: "entries", IT: "voci", TR: "kayıt", SQ: "regjistrime", KU: "tomar", RO: "înregistrări" },
  entry: { DE: "Eintrag", EN: "entry", IT: "voce", TR: "kayıt", SQ: "regjistrim", KU: "tomar", RO: "înregistrare" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function currentLanguageFromMe(value: unknown): AppUiLanguage {
  if (!isRecord(value) || value["ok"] !== true || !isRecord(value["session"])) {
    return "DE";
  }

  const language = value["session"]["language"];

  return language === "DE" || language === "EN" || language === "IT" || language === "TR" || language === "SQ" || language === "KU" || language === "RO"
    ? language
    : "DE";
}

function isMonthlyConfirmationItem(value: unknown): value is MonthlyConfirmationItem {
  if (!isRecord(value)) return false;

  return (
    typeof value["id"] === "string" &&
    typeof value["year"] === "number" &&
    typeof value["month"] === "number" &&
    (value["status"] === "PENDING" || value["status"] === "CONFIRMED" || value["status"] === "REJECTED") &&
    Array.isArray(value["entries"])
  );
}

function parseApiResponse(value: unknown): ApiResponse {
  if (!isRecord(value)) {
    return { ok: false, error: "INVALID_RESPONSE" };
  }

  if (value["ok"] !== true) {
    return {
      ok: false,
      error: typeof value["error"] === "string" ? value["error"] : "INVALID_RESPONSE",
    };
  }

  const confirmations = value["confirmations"];

  if (!Array.isArray(confirmations)) {
    return { ok: false, error: "INVALID_RESPONSE" };
  }

  return {
    ok: true,
    confirmations: confirmations.filter(isMonthlyConfirmationItem),
  };
}

function formatHM(minutes: number): string {
  const safe = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}min`;
}

function formatDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function monthLabel(year: number, month: number): string {
  return `${String(month).padStart(2, "0")}.${year}`;
}

function statusLabel(status: ConfirmationStatus, language: AppUiLanguage): string {
  if (status === "CONFIRMED") return translate(language, "confirmed", TEXTS);
  if (status === "REJECTED") return translate(language, "rejected", TEXTS);
  return translate(language, "pending", TEXTS);
}

function statusClassName(status: ConfirmationStatus): string {
  if (status === "CONFIRMED") {
    return "admin-workflow-status-chip admin-workflow-status-chip-approved";
  }

  if (status === "REJECTED") {
    return "admin-workflow-status-chip admin-workflow-status-chip-rejected";
  }

  return "admin-workflow-status-chip admin-workflow-status-chip-pending";
}

export default function MeineBestaetigungenPage() {
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const [items, setItems] = useState<MonthlyConfirmationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsItem, setDetailsItem] = useState<MonthlyConfirmationItem | null>(null);

  function t(key: PageTextKey): string {
    return translate(language, key, TEXTS);
  }

  const confirmedItems = useMemo(() => items.filter((item) => item.status === "CONFIRMED"), [items]);
  const rejectedItems = useMemo(() => items.filter((item) => item.status === "REJECTED"), [items]);
  const pendingItems = useMemo(() => items.filter((item) => item.status === "PENDING"), [items]);

  useEffect(() => {
    let alive = true;

    async function loadData(): Promise<void> {
      setLoading(true);
      setError("");

      try {
        const [meResponse, confirmationsResponse] = await Promise.all([
          fetch("/api/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/monthly-work-entry-confirmations/history", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const meJson: unknown = await meResponse.json().catch(() => ({}));
        const confirmationsJson: unknown = await confirmationsResponse.json().catch(() => ({}));

        if (!alive) return;

        setLanguage(currentLanguageFromMe(meJson));

        const parsed = parseApiResponse(confirmationsJson);

        if (!confirmationsResponse.ok || !parsed.ok) {
          setItems([]);
          setError(t("loadError"));
          return;
        }

        setItems(parsed.confirmations);
      } catch {
        if (!alive) return;
        setItems([]);
        setError(t("loadError"));
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell activeLabel={t("activeLabel")}>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">{t("confirmedKpi")}</div>
            <div className="big">{confirmedItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon"><CircleCheckBig /></div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("rejectedKpi")}</div>
            <div className="big">{rejectedItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon"><CircleX /></div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("openKpi")}</div>
            <div className="big">{pendingItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon"><ClipboardCheck /></div>
        </div>
      </div>

      <div className="card card-olive admin-workflow-filter-shell">
        <div className="section-title admin-workflow-filter-title">
          <span className="admin-workflow-filter-icon"><ClipboardCheck /></span>
          {t("pageTitle")}
        </div>

        <div className="admin-workflow-filter-text">
          {t("pageDescription")}
        </div>

        {error ? (
          <div className="card admin-workflow-error-card">
            <span className="admin-workflow-error-text">{error}</span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="card admin-workflow-loading-card">{t("loading")}</div>
      ) : items.length === 0 ? (
        <div className="card admin-workflow-empty-card">{t("empty")}</div>
      ) : (
        <div className="admin-workflow-shell">
          {items.map((item) => (
            <div key={item.id} className="card admin-workflow-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 1000, fontSize: 16 }}>
                    {monthLabel(item.year, item.month)}
                  </div>

                  <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
                    {item.entries.length} {item.entries.length === 1 ? t("entry") : t("entries")}
                  </div>

                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className={statusClassName(item.status)}>
                      {statusLabel(item.status, language)}
                    </span>

                    {item.confirmedAt ? (
                      <span className="admin-workflow-meta-chip">
                        {t("confirmedAt")} {formatDateTime(item.confirmedAt)}
                      </span>
                    ) : null}

                    {item.rejectedAt ? (
                      <span className="admin-workflow-meta-chip">
                        {t("rejectedAt")} {formatDateTime(item.rejectedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => setDetailsItem(item)}
                >
                  {t("details")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={detailsItem !== null}
        onClose={() => setDetailsItem(null)}
        title={detailsItem ? monthLabel(detailsItem.year, detailsItem.month) : t("details")}
        footer={
          <button type="button" className="btn" onClick={() => setDetailsItem(null)}>
            {t("close")}
          </button>
        }
        maxWidth={900}
      >
        {!detailsItem ? null : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={statusClassName(detailsItem.status)}>
                {statusLabel(detailsItem.status, language)}
              </span>
              <span className="admin-workflow-meta-chip">
                {t("updatedAt")} {formatDateTime(detailsItem.updatedAt)}
              </span>
              {detailsItem.requiredUntilAt ? (
                <span className="admin-workflow-meta-chip">
                  {t("requiredUntil")} {formatDateTime(detailsItem.requiredUntilAt)}
                </span>
              ) : null}
            </div>

            {detailsItem.rejectionReason ? (
              <div>
                <div className="label">{t("rejectionReason")}</div>
                <div className="input admin-workflow-note-input">
                  {detailsItem.rejectionReason}
                </div>
              </div>
            ) : null}

            <div>
              <div className="label">{t("confirmationText")}</div>
              <div className="input admin-workflow-note-input">
                {detailsItem.confirmationText?.trim() || t("noText")}
              </div>
            </div>

            <div className="section-title">{t("confirmedEntries")}</div>

            <div style={{ display: "grid", gap: 10 }}>
              {detailsItem.entries.map((entry) => (
                <details key={`${detailsItem.id}-${entry.kind}-${entry.id}`} className="tenant-list-shell-inner">
                  <summary
                    style={{
                      cursor: "pointer",
                      listStyle: "none",
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 1000 }}>
                        {formatDate(entry.workDate)} · {entry.startTime}–{entry.endTime}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {entry.kind === "DOCTOR_APPOINTMENT" ? t("doctorAppointment") : t("workEntry")}
                      </div>
                    </div>

                    <div style={{ color: "var(--accent)", fontWeight: 1000 }}>
                      {formatHM(entry.workMinutes)}
                    </div>
                  </summary>

                  <div style={{ display: "grid", gap: 10, padding: "0 14px 14px" }}>
                    <div>
                      <div className="label">{t("activity")}</div>
                      <div className="input admin-workflow-note-input">
                        {entry.activity || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="label">{t("location")}</div>
                      <div className="input admin-workflow-readonly-input">
                        {entry.location || "—"}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                      <div>
                        <div className="label">{t("gross")}</div>
                        <div className="input admin-workflow-readonly-input">{formatHM(entry.grossMinutes)}</div>
                      </div>

                      <div>
                        <div className="label">{t("break")}</div>
                        <div className="input admin-workflow-readonly-input">{formatHM(entry.breakMinutes)}</div>
                      </div>

                      <div>
                        <div className="label">{t("net")}</div>
                        <div className="input admin-workflow-readonly-input">{formatHM(entry.workMinutes)}</div>
                      </div>

                      <div>
                        <div className="label">{t("travelTime")}</div>
                        <div className="input admin-workflow-readonly-input">{formatHM(entry.travelMinutes)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="label">{t("note")}</div>
                      <div className="input admin-workflow-note-input">
                        {entry.noteEmployee.trim() || t("noNote")}
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}