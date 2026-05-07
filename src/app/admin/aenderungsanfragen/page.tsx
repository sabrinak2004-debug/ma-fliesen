"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import { CircleCheckBig, CircleX, SquarePen } from "lucide-react";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type WorkEntryEditRequestItem = {
  id: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  reason: string;
  noteAdmin: string;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
  currentEntry: {
    id: string;
    workDate: string;
    startTime: string;
    endTime: string;
    activity: string;
    location: string;
    travelMinutes: number;
    noteEmployee: string;
  };
  requestedEntry: {
    workDate: string;
    startTime: string;
    endTime: string;
    activity: string;
    location: string;
    travelMinutes: number;
    noteEmployee: string;
  };
};

type UserOption = {
  id: string;
  fullName: string;
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

type TextKey =
  | "activeLabel"
  | "pageTitle"
  | "pageDescription"
  | "loadingInitial"
  | "pendingRequestsKpi"
  | "approvedKpi"
  | "rejectedKpi"
  | "employee"
  | "allEmployees"
  | "selectedEmployee"
  | "open"
  | "approved"
  | "rejected"
  | "emptyPending"
  | "emptyApproved"
  | "emptyRejected"
  | "request"
  | "createdAt"
  | "decisionAt"
  | "processedBy"
  | "notDecidedYet"
  | "reason"
  | "changedFields"
  | "field"
  | "before"
  | "after"
  | "date"
  | "start"
  | "end"
  | "activity"
  | "location"
  | "travelMinutes"
  | "note"
  | "noNote"
  | "approve"
  | "reject"
  | "delete"
  | "processing"
  | "deleting"
  | "approveFailed"
  | "rejectFailed"
  | "deleteFailed"
  | "approveNetworkError"
  | "rejectNetworkError"
  | "deleteNetworkError"
  | "networkLoadError"
  | "loadError"
  | "deleteConfirm";

const TEXTS: Record<TextKey, Record<AppUiLanguage, string>> = {
  activeLabel: {
    DE: "Änderungsanfragen",
    EN: "Edit Requests",
    IT: "Richieste di modifica",
    TR: "Değişiklik Talepleri",
    SQ: "Kërkesat për ndryshim",
    KU: "Daxwazên guherandinê",
    RO: "Cereri de modificare",
  },
  pageTitle: {
    DE: "Änderungsanfragen",
    EN: "Edit requests",
    IT: "Richieste di modifica",
    TR: "Değişiklik talepleri",
    SQ: "Kërkesat për ndryshim",
    KU: "Daxwazên guherandinê",
    RO: "Cereri de modificare",
  },
  pageDescription: {
    DE: "Hier prüfst du Änderungen, die Mitarbeiter für bereits gesperrte Einträge beantragt haben.",
    EN: "Review changes employees requested for locked entries.",
    IT: "Qui controlli le modifiche richieste dai dipendenti per voci già bloccate.",
    TR: "Çalışanların kilitli kayıtlar için istediği değişiklikleri buradan inceleyebilirsin.",
    SQ: "Këtu kontrollon ndryshimet që punonjësit kërkuan për regjistrime të bllokuara.",
    KU: "Li vir tu guherandinên ku karmend ji bo tomarên girtî xwestine kontrol dikî.",
    RO: "Aici verifici modificările cerute de angajați pentru înregistrări blocate.",
  },
  loadingInitial: {
    DE: "Lade Änderungsanfragen...",
    EN: "Loading edit requests...",
    IT: "Caricamento richieste...",
    TR: "Değişiklik talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat...",
    KU: "Daxwaz têne barkirin...",
    RO: "Se încarcă cererile...",
  },
  pendingRequestsKpi: {
    DE: "Offene Anfragen",
    EN: "Open requests",
    IT: "Richieste aperte",
    TR: "Açık talepler",
    SQ: "Kërkesa të hapura",
    KU: "Daxwazên vekirî",
    RO: "Cereri deschise",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobate",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respinse",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjës",
    KU: "Karmend",
    RO: "Angajat",
  },
  allEmployees: {
    DE: "Alle Mitarbeiter",
    EN: "All employees",
    IT: "Tutti i dipendenti",
    TR: "Tüm çalışanlar",
    SQ: "Të gjithë punonjësit",
    KU: "Hemû karmend",
    RO: "Toți angajații",
  },
  selectedEmployee: {
    DE: "Ausgewählter Mitarbeiter",
    EN: "Selected employee",
    IT: "Dipendente selezionato",
    TR: "Seçili çalışan",
    SQ: "Punonjësi i zgjedhur",
    KU: "Karmendê hilbijartî",
    RO: "Angajat selectat",
  },
  open: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperte",
    TR: "Açık",
    SQ: "Hapur",
    KU: "Vekirî",
    RO: "Deschise",
  },
  approved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobate",
  },
  rejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respinse",
  },
  emptyPending: {
    DE: "Keine offenen Änderungsanfragen vorhanden.",
    EN: "No open edit requests.",
    IT: "Nessuna richiesta aperta.",
    TR: "Açık değişiklik talebi yok.",
    SQ: "Nuk ka kërkesa të hapura.",
    KU: "Daxwaza vekirî tune ye.",
    RO: "Nu există cereri deschise.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Änderungsanfragen vorhanden.",
    EN: "No approved edit requests.",
    IT: "Nessuna richiesta approvata.",
    TR: "Onaylanmış değişiklik talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara.",
    KU: "Daxwaza pejirandî tune ye.",
    RO: "Nu există cereri aprobate.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Änderungsanfragen vorhanden.",
    EN: "No rejected edit requests.",
    IT: "Nessuna richiesta rifiutata.",
    TR: "Reddedilmiş değişiklik talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara.",
    KU: "Daxwaza redkirî tune ye.",
    RO: "Nu există cereri respinse.",
  },
  request: {
    DE: "Anfrage",
    EN: "Request",
    IT: "Richiesta",
    TR: "Talep",
    SQ: "Kërkesë",
    KU: "Daxwaz",
    RO: "Cerere",
  },
  createdAt: {
    DE: "Erstellt am",
    EN: "Created at",
    IT: "Creata il",
    TR: "Oluşturulma",
    SQ: "Krijuar më",
    KU: "Afirandin",
    RO: "Creată la",
  },
  decisionAt: {
    DE: "Entschieden am",
    EN: "Decided at",
    IT: "Decisa il",
    TR: "Karar tarihi",
    SQ: "Vendosur më",
    KU: "Biryara li",
    RO: "Decisă la",
  },
  processedBy: {
    DE: "Bearbeitet durch",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen",
    SQ: "Përpunuar nga",
    KU: "Ji aliyê ve hate xebitandin",
    RO: "Procesată de",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende pa vendim",
    KU: "Hêj biryar tune ye",
    RO: "Încă nedecisă",
  },
  reason: {
    DE: "Grund der Änderung",
    EN: "Reason for change",
    IT: "Motivo della modifica",
    TR: "Değişiklik nedeni",
    SQ: "Arsyeja e ndryshimit",
    KU: "Sedema guherandinê",
    RO: "Motivul modificării",
  },
  changedFields: {
    DE: "Gewünschte Änderungen",
    EN: "Requested changes",
    IT: "Modifiche richieste",
    TR: "İstenen değişiklikler",
    SQ: "Ndryshimet e kërkuara",
    KU: "Guherandinên xwestî",
    RO: "Modificări solicitate",
  },
  field: {
    DE: "Feld",
    EN: "Field",
    IT: "Campo",
    TR: "Alan",
    SQ: "Fusha",
    KU: "Qad",
    RO: "Câmp",
  },
  before: {
    DE: "Vorher",
    EN: "Before",
    IT: "Prima",
    TR: "Önce",
    SQ: "Më parë",
    KU: "Berê",
    RO: "Înainte",
  },
  after: {
    DE: "Nachher",
    EN: "After",
    IT: "Dopo",
    TR: "Sonra",
    SQ: "Më pas",
    KU: "Piştre",
    RO: "După",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
    RO: "Dată",
  },
  start: {
    DE: "Beginn",
    EN: "Start",
    IT: "Inizio",
    TR: "Başlangıç",
    SQ: "Fillimi",
    KU: "Destpêk",
    RO: "Început",
  },
  end: {
    DE: "Ende",
    EN: "End",
    IT: "Fine",
    TR: "Bitiş",
    SQ: "Fundi",
    KU: "Dawî",
    RO: "Sfârșit",
  },
  activity: {
    DE: "Tätigkeit",
    EN: "Activity",
    IT: "Attività",
    TR: "Faaliyet",
    SQ: "Aktiviteti",
    KU: "Çalakî",
    RO: "Activitate",
  },
  location: {
    DE: "Einsatzort",
    EN: "Location",
    IT: "Luogo",
    TR: "Konum",
    SQ: "Vendndodhja",
    KU: "Cih",
    RO: "Locație",
  },
  travelMinutes: {
    DE: "Fahrzeit",
    EN: "Travel time",
    IT: "Tempo viaggio",
    TR: "Yol süresi",
    SQ: "Koha e udhëtimit",
    KU: "Dema rê",
    RO: "Timp deplasare",
  },
  note: {
    DE: "Notiz",
    EN: "Note",
    IT: "Nota",
    TR: "Not",
    SQ: "Shënim",
    KU: "Nîşe",
    RO: "Notă",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Nîşe tune ye.",
    RO: "Nicio notă disponibilă.",
  },
  approve: {
    DE: "Genehmigen",
    EN: "Approve",
    IT: "Approva",
    TR: "Onayla",
    SQ: "Mirato",
    KU: "Pejirîne",
    RO: "Aprobă",
  },
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    KU: "Red bike",
    RO: "Respinge",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
    RO: "Șterge",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke përpunuar...",
    KU: "Tê xebitandin...",
    RO: "Se procesează...",
  },
  deleting: {
    DE: "Löscht...",
    EN: "Deleting...",
    IT: "Eliminazione...",
    TR: "Siliniyor...",
    SQ: "Duke fshirë...",
    KU: "Tê jêbirin...",
    RO: "Se șterge...",
  },
  approveFailed: {
    DE: "Genehmigen fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onaylama başarısız.",
    SQ: "Miratimi dështoi.",
    KU: "Pejirandin bi ser neket.",
    RO: "Aprobarea a eșuat.",
  },
  rejectFailed: {
    DE: "Ablehnen fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız.",
    SQ: "Refuzimi dështoi.",
    KU: "Redkirin bi ser neket.",
    RO: "Respingerea a eșuat.",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Deleting failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin bi ser neket.",
    RO: "Ștergerea a eșuat.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler beim Genehmigen.",
    EN: "Network error while approving.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onaylama sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    KU: "Di pejirandinê de şaşiya torê.",
    RO: "Eroare de rețea la aprobare.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler beim Ablehnen.",
    EN: "Network error while rejecting.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    KU: "Di redkirinê de şaşiya torê.",
    RO: "Eroare de rețea la respingere.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Di jêbirinê de şaşiya torê.",
    RO: "Eroare de rețea la ștergere.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden.",
    EN: "Network error while loading.",
    IT: "Errore di rete durante il caricamento.",
    TR: "Yükleme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit.",
    KU: "Di barkirinê de şaşiya torê.",
    RO: "Eroare de rețea la încărcare.",
  },
  loadError: {
    DE: "Änderungsanfragen konnten nicht geladen werden.",
    EN: "Edit requests could not be loaded.",
    IT: "Impossibile caricare le richieste.",
    TR: "Değişiklik talepleri yüklenemedi.",
    SQ: "Kërkesat nuk mund të ngarkoheshin.",
    KU: "Daxwaz nehatin barkirin.",
    RO: "Cererile nu au putut fi încărcate.",
  },
  deleteConfirm: {
    DE: "Diese Änderungsanfrage wirklich löschen?",
    EN: "Really delete this edit request?",
    IT: "Eliminare davvero questa richiesta?",
    TR: "Bu değişiklik talebi gerçekten silinsin mi?",
    SQ: "Ta fshijmë vërtet këtë kërkesë?",
    KU: "Bi rastî vê daxwazê jê bibî?",
    RO: "Sigur ștergi această cerere?",
  },
};

type ChangedField = {
  key: string;
  label: TextKey;
  oldValue: string;
  newValue: string;
};

type AdminEditRequestsResponse =
  | {
      ok: true;
      requests: WorkEntryEditRequestItem[];
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

function isAppLanguage(value: unknown): value is AppUiLanguage {
  return (
    value === "DE" ||
    value === "EN" ||
    value === "IT" ||
    value === "TR" ||
    value === "SQ" ||
    value === "KU" ||
    value === "RO"
  );
}

function isRequestStatus(value: unknown): value is RequestStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

function parseMeSession(value: unknown): AdminSessionDTO | null {
  if (!isRecord(value)) return null;

  const session = value["session"];
  if (!isRecord(session)) return null;

  const userId = getStringField(session, "userId");
  const fullName = getStringField(session, "fullName");
  const role = session["role"];
  const language = session["language"];
  const companyId = getStringField(session, "companyId");
  const companyName = getStringField(session, "companyName");
  const companySubdomain = getStringField(session, "companySubdomain");
  const companyLogoUrl = session["companyLogoUrl"];
  const primaryColor = session["primaryColor"];

  if (
    !userId ||
    !fullName ||
    (role !== "ADMIN" && role !== "EMPLOYEE") ||
    !isAppLanguage(language) ||
    !companyId ||
    !companyName ||
    !companySubdomain ||
    (typeof companyLogoUrl !== "string" && companyLogoUrl !== null) ||
    (typeof primaryColor !== "string" && primaryColor !== null)
  ) {
    return null;
  }

  return {
    userId,
    fullName,
    role,
    language,
    companyId,
    companyName,
    companySubdomain,
    companyLogoUrl,
    primaryColor,
  };
}

function isEntryObject(value: unknown): value is WorkEntryEditRequestItem["currentEntry"] {
  if (!isRecord(value)) return false;

  return (
    typeof value["workDate"] === "string" &&
    typeof value["startTime"] === "string" &&
    typeof value["endTime"] === "string" &&
    typeof value["activity"] === "string" &&
    typeof value["location"] === "string" &&
    typeof value["travelMinutes"] === "number" &&
    typeof value["noteEmployee"] === "string"
  );
}

function isWorkEntryEditRequestItem(value: unknown): value is WorkEntryEditRequestItem {
  if (!isRecord(value)) return false;

  const user = value["user"];
  const decidedBy = value["decidedBy"];
  const currentEntry = value["currentEntry"];
  const requestedEntry = value["requestedEntry"];

  if (!isRecord(user)) return false;

  const userId = getStringField(user, "id");
  const fullName = getStringField(user, "fullName");

  if (!userId || !fullName) return false;

  if (decidedBy !== null) {
    if (!isRecord(decidedBy)) return false;
    if (!getStringField(decidedBy, "id") || !getStringField(decidedBy, "fullName")) {
      return false;
    }
  }

  return (
    typeof value["id"] === "string" &&
    isRequestStatus(value["status"]) &&
    typeof value["createdAt"] === "string" &&
    typeof value["updatedAt"] === "string" &&
    (typeof value["decidedAt"] === "string" || value["decidedAt"] === null) &&
    typeof value["reason"] === "string" &&
    typeof value["noteAdmin"] === "string" &&
    isEntryObject(currentEntry) &&
    isEntryObject(requestedEntry)
  );
}

function parseAdminEditRequestsResponse(value: unknown): AdminEditRequestsResponse {
  if (!isRecord(value)) {
    return { ok: false, error: "Unerwartete Antwort." };
  }

  if (value["ok"] !== true) {
    return {
      ok: false,
      error: getStringField(value, "error") ?? "Unerwartete Antwort.",
    };
  }

  const requestsRaw = value["requests"];

  if (!Array.isArray(requestsRaw)) {
    return { ok: false, error: "Unerwartete Antwort." };
  }

  return {
    ok: true,
    requests: requestsRaw.filter(isWorkEntryEditRequestItem),
  };
}

function formatDate(ymd: string): string {
  const normalized = ymd.length >= 10 ? ymd.slice(0, 10) : ymd;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return ymd;
  }

  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function normalizeCompareValue(value: string | number): string {
  return String(value).trim();
}

function getChangedFields(item: WorkEntryEditRequestItem): ChangedField[] {
  const fields: ChangedField[] = [];

  const pushIfChanged = (
    key: string,
    label: TextKey,
    oldValue: string | number,
    newValue: string | number
  ) => {
    if (normalizeCompareValue(oldValue) === normalizeCompareValue(newValue)) {
      return;
    }

    fields.push({
      key,
      label,
      oldValue: String(oldValue || "—"),
      newValue: String(newValue || "—"),
    });
  };

  pushIfChanged(
    "workDate",
    "date",
    formatDate(item.currentEntry.workDate),
    formatDate(item.requestedEntry.workDate)
  );
  pushIfChanged("startTime", "start", item.currentEntry.startTime, item.requestedEntry.startTime);
  pushIfChanged("endTime", "end", item.currentEntry.endTime, item.requestedEntry.endTime);
  pushIfChanged("activity", "activity", item.currentEntry.activity, item.requestedEntry.activity);
  pushIfChanged("location", "location", item.currentEntry.location, item.requestedEntry.location);
  pushIfChanged(
    "travelMinutes",
    "travelMinutes",
    item.currentEntry.travelMinutes,
    item.requestedEntry.travelMinutes
  );
  pushIfChanged("noteEmployee", "note", item.currentEntry.noteEmployee, item.requestedEntry.noteEmployee);

  return fields;
}

function statusClassName(status: RequestStatus): string {
  if (status === "PENDING") {
    return "admin-workflow-status-chip admin-workflow-status-chip-pending";
  }

  if (status === "APPROVED") {
    return "admin-workflow-status-chip admin-workflow-status-chip-approved";
  }

  return "admin-workflow-status-chip admin-workflow-status-chip-rejected";
}

function requestCardClassName(status: RequestStatus): string {
  if (status === "PENDING") {
    return "card admin-workflow-card admin-workflow-card-pending";
  }

  if (status === "APPROVED") {
    return "card admin-workflow-card admin-workflow-card-approved";
  }

  return "card admin-workflow-card admin-workflow-card-rejected";
}

function sectionTitle(label: string, count: number): string {
  return `${label} (${count})`;
}

export default function AenderungsanfragenPage() {
  const router = useRouter();
  const [items, setItems] = useState<WorkEntryEditRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AdminSessionDTO | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const language = session?.language ?? "DE";

  function t(key: TextKey): string {
    return translate(language, key, TEXTS);
  }

  async function loadRequests() {
    if (!session || session.role !== "ADMIN") return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (selectedUserId) {
        params.set("userId", selectedUserId);
      }

      const response = await fetch(`/api/admin/work-entry-edit-requests?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: unknown = await response.json().catch(() => ({}));
      const parsed = parseAdminEditRequestsResponse(json);

      if (!response.ok || !parsed.ok) {
        setItems([]);
        setError(parsed.ok ? t("loadError") : parsed.error);
        window.dispatchEvent(new Event("admin-requests-changed"));
        return;
      }

      setItems(parsed.requests);
      window.dispatchEvent(new Event("admin-requests-changed"));
    } catch {
      setItems([]);
      setError(t("networkLoadError"));
      window.dispatchEvent(new Event("admin-requests-changed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => ({}));

        if (!alive) return;

        const parsed = parseMeSession(json);

        if (!parsed) {
          setSession(null);
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
    if (!sessionChecked) return;
    if (!session || session.role !== "ADMIN") return;

    void loadRequests();
  }, [selectedUserId, sessionChecked, session?.role, session?.companyId]);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json: unknown = await response.json().catch(() => ({}));

        if (!response.ok || !isRecord(json) || json["ok"] !== true) {
          if (active) setUsers([]);
          return;
        }

        const usersRaw = json["users"];

        if (!Array.isArray(usersRaw)) {
          if (active) setUsers([]);
          return;
        }

        const parsedUsers: UserOption[] = [];

        for (const item of usersRaw) {
          if (!isRecord(item)) continue;

          const id = getStringField(item, "id");
          const fullName = getStringField(item, "fullName");

          if (!id || !fullName) continue;

          parsedUsers.push({ id, fullName });
        }

        if (active) {
          setUsers(parsedUsers);
        }
      } catch {
        if (active) setUsers([]);
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  async function approveRequest(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/work-entry-edit-requests/${encodeURIComponent(id)}/approve`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("approveFailed");

        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("approveNetworkError"));
    } finally {
      setBusyId(null);
    }
  }

  async function rejectRequest(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/work-entry-edit-requests/${encodeURIComponent(id)}/reject`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("rejectFailed");

        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("rejectNetworkError"));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRequest(id: string) {
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(t("deleteConfirm"))
        : false;

    if (!confirmed) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/work-entry-edit-requests/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(json) && typeof json["error"] === "string"
            ? json["error"]
            : t("deleteFailed");

        setError(message);
        return;
      }

      await loadRequests();
    } catch {
      setError(t("deleteNetworkError"));
    } finally {
      setBusyId(null);
    }
  }

  const pendingItems = useMemo(
    () => items.filter((item) => item.status === "PENDING"),
    [items]
  );

  const approvedItems = useMemo(
    () => items.filter((item) => item.status === "APPROVED"),
    [items]
  );

  const rejectedItems = useMemo(
    () => items.filter((item) => item.status === "REJECTED"),
    [items]
  );

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserId) return t("allEmployees");
    return users.find((user) => user.id === selectedUserId)?.fullName ?? t("selectedEmployee");
  }, [users, selectedUserId, language]);

  function renderRequestCard(item: WorkEntryEditRequestItem) {
    const isBusy = busyId === item.id;
    const changedFields = getChangedFields(item);

    return (
      <div key={item.id} className={requestCardClassName(item.status)}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {item.user.fullName}
            </div>

            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
              {t("request")} · {formatDate(item.currentEntry.workDate)} ·{" "}
              {item.currentEntry.startTime}–{item.currentEntry.endTime}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={statusClassName(item.status)}>
                {item.status === "PENDING"
                  ? t("open")
                  : item.status === "APPROVED"
                  ? t("approved")
                  : t("rejected")}
              </span>

              <span className="admin-workflow-meta-chip">
                {t("createdAt")} {formatDateTime(item.createdAt)}
              </span>

              {item.decidedAt ? (
                <span className="admin-workflow-meta-chip">
                  {t("decisionAt")} {formatDateTime(item.decidedAt)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div>
            <div className="label">{t("reason")}</div>
            <div className="input admin-workflow-note-input">
              {item.reason.trim() || "—"}
            </div>
          </div>

          <div>
            <div className="label">{t("changedFields")}</div>

            <div style={{ display: "grid", gap: 8 }}>
              {changedFields.map((field) => (
                <div
                  key={`${item.id}-${field.key}`}
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--input-bg)",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {t(field.label)}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {t("before")}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {field.oldValue || "—"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {t("after")}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {field.newValue || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {changedFields.length === 0 ? (
                <div className="input admin-workflow-readonly-input-muted">
                  —
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="label">{t("processedBy")}</div>
            <div className="input admin-workflow-readonly-input-muted">
              {item.decidedBy ? item.decidedBy.fullName : t("notDecidedYet")}
            </div>
          </div>
        </div>

        <div
          className="mobile-actions card-action-group"
          style={{
            marginTop: 14,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <button
            className="btn btn-danger"
            type="button"
            disabled={isBusy}
            onClick={() => {
              void deleteRequest(item.id);
            }}
            style={{
              flex: "1 1 200px",
              minWidth: 0,
            }}
          >
            {isBusy ? t("deleting") : t("delete")}
          </button>

          {item.status === "PENDING" ? (
            <>
              <button
                className="btn btn-danger"
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void rejectRequest(item.id);
                }}
                style={{
                  flex: "1 1 200px",
                  minWidth: 0,
                }}
              >
                {isBusy ? t("processing") : t("reject")}
              </button>

              <button
                className="btn btn-accent"
                type="button"
                disabled={isBusy}
                onClick={() => {
                  void approveRequest(item.id);
                }}
                style={{
                  flex: "1 1 200px",
                  minWidth: 0,
                }}
              >
                {isBusy ? t("processing") : t("approve")}
              </button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <AppShell activeLabel={t("activeLabel")}>
        <div className="card admin-workflow-loading-card">
          <div className="admin-workflow-filter-text">{t("loadingInitial")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel={t("activeLabel")}>
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">{t("pendingRequestsKpi")}</div>
            <div className="big">{pendingItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon">
            <SquarePen />
          </div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("approvedKpi")}</div>
            <div className="big">{approvedItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon">
            <CircleCheckBig />
          </div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("rejectedKpi")}</div>
            <div className="big">{rejectedItems.length}</div>
          </div>
          <div className="admin-workflow-kpi-icon">
            <CircleX />
          </div>
        </div>
      </div>

      <div className="card card-olive admin-workflow-filter-shell">
        <div className="section-title admin-workflow-filter-title">
          <span className="admin-workflow-filter-icon">
            <SquarePen />
          </span>
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
        </div>

        {error ? (
          <div className="card admin-workflow-error-card">
            <span className="admin-workflow-error-text">{error}</span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="card admin-workflow-loading-card">
          {t("loadingInitial")}
        </div>
      ) : (
        <div className="admin-workflow-shell">
          <details open className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(t("open"), pendingItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {pendingItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyPending")}
                </div>
              ) : (
                pendingItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(`${t("approved")} – ${selectedUserLabel}`, approvedItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {approvedItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyApproved")}
                </div>
              ) : (
                approvedItems.map(renderRequestCard)
              )}
            </div>
          </details>

          <details className="admin-workflow-section">
            <summary className="admin-workflow-section-summary">
              {sectionTitle(`${t("rejected")} – ${selectedUserLabel}`, rejectedItems.length)}
            </summary>

            <div className="admin-workflow-section-content">
              {rejectedItems.length === 0 ? (
                <div className="card admin-workflow-empty-card">
                  {t("emptyRejected")}
                </div>
              ) : (
                rejectedItems.map(renderRequestCard)
              )}
            </div>
          </details>
        </div>
      )}
    </AppShell>
  );
}