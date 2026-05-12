"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  user: {
    id: string;
    fullName: string;
  };
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

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

type UserOption = {
  id: string;
  fullName: string;
};

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
  | "employee"
  | "allEmployees"
  | "month"
  | "status"
  | "allStatuses"
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
  | "date"
  | "time"
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
    DE: "Monatsbestätigungen",
    EN: "Monthly confirmations",
    IT: "Conferme mensili",
    TR: "Aylık onaylar",
    SQ: "Konfirmimet mujore",
    KU: "Piştrastkirinên mehane",
    RO: "Confirmări lunare",
  },
  pageTitle: {
    DE: "Monatsbestätigungen",
    EN: "Monthly confirmations",
    IT: "Conferme mensili",
    TR: "Aylık onaylar",
    SQ: "Konfirmimet mujore",
    KU: "Piştrastkirinên mehane",
    RO: "Confirmări lunare",
  },
  pageDescription: {
    DE: "Hier siehst du, welche Mitarbeiter ihre monatlichen Arbeitszeiteinträge bestätigt oder abgelehnt haben und welche Einträge dabei bestätigt wurden.",
    EN: "Here you can see which employees confirmed or rejected their monthly work entries and which entries were included.",
    IT: "Qui puoi vedere quali dipendenti hanno confermato o rifiutato le registrazioni mensili.",
    TR: "Burada çalışanların aylık çalışma kayıtlarını onaylayıp onaylamadığını görebilirsiniz.",
    SQ: "Këtu mund të shihni cilët punonjës kanë konfirmuar ose refuzuar regjistrimet mujore.",
    KU: "Li vir tu dibînî kîjan karmend tomaran mehane piştrast an red kiriye.",
    RO: "Aici vezi ce angajați au confirmat sau respins înregistrările lunare.",
  },
  employee: { DE: "Mitarbeiter", EN: "Employee", IT: "Dipendente", TR: "Çalışan", SQ: "Punonjësi", KU: "Karmend", RO: "Angajat" },
  allEmployees: { DE: "Alle Mitarbeiter", EN: "All employees", IT: "Tutti i dipendenti", TR: "Tüm çalışanlar", SQ: "Të gjithë punonjësit", KU: "Hemû karmend", RO: "Toți angajații" },
  month: { DE: "Monat", EN: "Month", IT: "Mese", TR: "Ay", SQ: "Muaji", KU: "Meh", RO: "Lună" },
  status: { DE: "Status", EN: "Status", IT: "Stato", TR: "Durum", SQ: "Statusi", KU: "Rewş", RO: "Status" },
  allStatuses: { DE: "Alle Status", EN: "All statuses", IT: "Tutti gli stati", TR: "Tüm durumlar", SQ: "Të gjitha statuset", KU: "Hemû rewş", RO: "Toate statusurile" },
  confirmed: { DE: "Bestätigt", EN: "Confirmed", IT: "Confermato", TR: "Onaylandı", SQ: "Konfirmuar", KU: "Piştrastkirî", RO: "Confirmat" },
  rejected: { DE: "Abgelehnt", EN: "Rejected", IT: "Rifiutato", TR: "Reddedildi", SQ: "Refuzuar", KU: "Redkirî", RO: "Respins" },
  pending: { DE: "Offen", EN: "Open", IT: "Aperto", TR: "Açık", SQ: "Hapur", KU: "Vekirî", RO: "Deschis" },
  confirmedKpi: { DE: "Bestätigt", EN: "Confirmed", IT: "Confermati", TR: "Onaylanan", SQ: "Konfirmuar", KU: "Piştrastkirî", RO: "Confirmate" },
  rejectedKpi: { DE: "Abgelehnt", EN: "Rejected", IT: "Rifiutati", TR: "Reddedilen", SQ: "Refuzuar", KU: "Redkirî", RO: "Respinse" },
  openKpi: { DE: "Offen", EN: "Open", IT: "Aperti", TR: "Açık", SQ: "Hapur", KU: "Vekirî", RO: "Deschise" },
  loading: { DE: "Lade...", EN: "Loading...", IT: "Caricamento...", TR: "Yükleniyor...", SQ: "Duke u ngarkuar...", KU: "Tê barkirin...", RO: "Se încarcă..." },
  loadError: { DE: "Monatsbestätigungen konnten nicht geladen werden.", EN: "Monthly confirmations could not be loaded.", IT: "Impossibile caricare le conferme.", TR: "Aylık onaylar yüklenemedi.", SQ: "Konfirmimet nuk mund të ngarkoheshin.", KU: "Piştrastkirin nehatin barkirin.", RO: "Confirmările nu au putut fi încărcate." },
  empty: { DE: "Keine Monatsbestätigungen für diese Filter vorhanden.", EN: "No monthly confirmations for these filters.", IT: "Nessuna conferma per questi filtri.", TR: "Bu filtreler için onay yok.", SQ: "Nuk ka konfirmime për këta filtra.", KU: "Ji bo van parzûnan tune ye.", RO: "Nu există confirmări pentru aceste filtre." },
  details: { DE: "Details", EN: "Details", IT: "Dettagli", TR: "Detaylar", SQ: "Detaje", KU: "Hûrgulî", RO: "Detalii" },
  close: { DE: "Schließen", EN: "Close", IT: "Chiudi", TR: "Kapat", SQ: "Mbyll", KU: "Bigire", RO: "Închide" },
  confirmedAt: { DE: "Bestätigt am", EN: "Confirmed at", IT: "Confermato il", TR: "Onay tarihi", SQ: "Konfirmuar më", KU: "Piştrastkirin di", RO: "Confirmat la" },
  rejectedAt: { DE: "Abgelehnt am", EN: "Rejected at", IT: "Rifiutato il", TR: "Red tarihi", SQ: "Refuzuar më", KU: "Redkirin di", RO: "Respins la" },
  updatedAt: { DE: "Zuletzt geändert", EN: "Last updated", IT: "Ultimo aggiornamento", TR: "Son güncelleme", SQ: "Përditësuar së fundi", KU: "Nûkirina dawî", RO: "Ultima actualizare" },
  requiredUntil: { DE: "Erforderlich bis", EN: "Required until", IT: "Richiesto entro", TR: "Son tarih", SQ: "Kërkohet deri", KU: "Pêwist heta", RO: "Necesar până la" },
  rejectionReason: { DE: "Ablehnungsgrund", EN: "Rejection reason", IT: "Motivo del rifiuto", TR: "Red nedeni", SQ: "Arsyeja e refuzimit", KU: "Sedema redkirinê", RO: "Motivul respingerii" },
  confirmationText: { DE: "Bestätigungstext", EN: "Confirmation text", IT: "Testo di conferma", TR: "Onay metni", SQ: "Teksti i konfirmimit", KU: "Nivîsa piştrastkirinê", RO: "Text de confirmare" },
  confirmedEntries: { DE: "Bestätigte Einträge", EN: "Confirmed entries", IT: "Voci confermate", TR: "Onaylanan kayıtlar", SQ: "Regjistrime të konfirmuara", KU: "Tomarên piştrastkirî", RO: "Înregistrări confirmate" },
  workEntry: { DE: "Arbeitseintrag", EN: "Work entry", IT: "Voce lavoro", TR: "Çalışma kaydı", SQ: "Regjistrim pune", KU: "Tomara karê", RO: "Înregistrare muncă" },
  doctorAppointment: { DE: "Arzttermin", EN: "Doctor appointment", IT: "Visita medica", TR: "Doktor randevusu", SQ: "Takim te mjeku", KU: "Hevdîtina bijîşk", RO: "Programare medicală" },
  date: { DE: "Datum", EN: "Date", IT: "Data", TR: "Tarih", SQ: "Data", KU: "Dîrok", RO: "Dată" },
  time: { DE: "Zeit", EN: "Time", IT: "Ora", TR: "Saat", SQ: "Ora", KU: "Dem", RO: "Ora" },
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

function isAppUiLanguage(value: unknown): value is AppUiLanguage {
  return value === "DE" || value === "EN" || value === "IT" || value === "TR" || value === "SQ" || value === "KU" || value === "RO";
}

function isAdminSessionDTO(value: unknown): value is AdminSessionDTO {
  if (!isRecord(value)) return false;

  return (
    typeof value["userId"] === "string" &&
    typeof value["fullName"] === "string" &&
    (value["role"] === "ADMIN" || value["role"] === "EMPLOYEE") &&
    isAppUiLanguage(value["language"]) &&
    typeof value["companyId"] === "string" &&
    typeof value["companyName"] === "string" &&
    typeof value["companySubdomain"] === "string" &&
    (typeof value["companyLogoUrl"] === "string" || value["companyLogoUrl"] === null) &&
    (typeof value["primaryColor"] === "string" || value["primaryColor"] === null)
  );
}

function parseMeSession(value: unknown): AdminSessionDTO | null {
  if (!isRecord(value)) return null;
  const session = value["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

function isMonthlyConfirmationItem(value: unknown): value is MonthlyConfirmationItem {
  if (!isRecord(value)) return false;
  const user = value["user"];
  const entries = value["entries"];

  return (
    typeof value["id"] === "string" &&
    isRecord(user) &&
    typeof user["id"] === "string" &&
    typeof user["fullName"] === "string" &&
    typeof value["year"] === "number" &&
    typeof value["month"] === "number" &&
    (value["status"] === "PENDING" || value["status"] === "CONFIRMED" || value["status"] === "REJECTED") &&
    Array.isArray(entries)
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

export default function AdminMonatsbestaetigungenPage() {
  const router = useRouter();

  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [items, setItems] = useState<MonthlyConfirmationItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailsItem, setDetailsItem] = useState<MonthlyConfirmationItem | null>(null);

  const language = session?.language ?? "DE";

  function t(key: PageTextKey): string {
    return translate(language, key, TEXTS);
  }

  const confirmedItems = useMemo(() => items.filter((item) => item.status === "CONFIRMED"), [items]);
  const rejectedItems = useMemo(() => items.filter((item) => item.status === "REJECTED"), [items]);
  const pendingItems = useMemo(() => items.filter((item) => item.status === "PENDING"), [items]);

  useEffect(() => {
    let alive = true;

    async function loadSession(): Promise<void> {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json().catch(() => ({}));

        if (!alive) return;

        const parsed = parseMeSession(data);

        if (!parsed) {
          router.replace("/login");
          return;
        }

        if (parsed.role !== "ADMIN") {
          router.replace("/login");
          return;
        }

        setSession(parsed);
      } catch {
        if (!alive) return;
        router.replace("/login");
      } finally {
        if (alive) {
          setSessionChecked(true);
        }
      }
    }

    void loadSession();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    let alive = true;

    async function loadUsers(): Promise<void> {
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => ({}));

        if (!alive) return;

        if (!response.ok || !isRecord(json) || json["ok"] !== true || !Array.isArray(json["users"])) {
          setUsers([]);
          return;
        }

        const parsedUsers: UserOption[] = json["users"]
          .filter(isRecord)
          .map((user) => ({
            id: typeof user["id"] === "string" ? user["id"] : "",
            fullName: typeof user["fullName"] === "string" ? user["fullName"] : "",
          }))
          .filter((user) => user.id && user.fullName);

        setUsers(parsedUsers);
      } catch {
        if (alive) {
          setUsers([]);
        }
      }
    }

    void loadUsers();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked || !session || session.role !== "ADMIN") {
      return;
    }

    let alive = true;

    async function loadConfirmations(): Promise<void> {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (selectedMonth) {
          params.set("month", selectedMonth);
        }

        if (selectedUserId) {
          params.set("userId", selectedUserId);
        }

        if (selectedStatus) {
          params.set("status", selectedStatus);
        }

        const response = await fetch(`/api/admin/monthly-work-entry-confirmations?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => ({}));
        const parsed = parseApiResponse(json);

        if (!alive) return;

        if (!response.ok || !parsed.ok) {
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

    void loadConfirmations();

    return () => {
      alive = false;
    };
  }, [sessionChecked, session?.role, selectedMonth, selectedUserId, selectedStatus]);

  if (!sessionChecked) {
    return (
      <AppShell activeLabel={t("activeLabel")}>
        <div className="card admin-workflow-loading-card">{t("loading")}</div>
      </AppShell>
    );
  }

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

        <div className="admin-workflow-filter-grid">
          <div className="admin-workflow-filter-field">
            <div className="label">{t("employee")}</div>
            <select
              className="input admin-workflow-filter-input"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">{t("allEmployees")}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-workflow-filter-field">
            <div className="label">{t("month")}</div>
            <input
              className="input admin-workflow-filter-input"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>

          <div className="admin-workflow-filter-field">
            <div className="label">{t("status")}</div>
            <select
              className="input admin-workflow-filter-input"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="CONFIRMED">{t("confirmed")}</option>
              <option value="REJECTED">{t("rejected")}</option>
              <option value="PENDING">{t("pending")}</option>
            </select>
          </div>
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
                    {item.user.fullName}
                  </div>

                  <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
                    {monthLabel(item.year, item.month)} · {item.entries.length}{" "}
                    {item.entries.length === 1 ? t("entry") : t("entries")}
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
        title={
          detailsItem
            ? `${detailsItem.user.fullName} · ${monthLabel(detailsItem.year, detailsItem.month)}`
            : t("details")
        }
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