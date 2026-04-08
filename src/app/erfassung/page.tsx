"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";

type MeResponse =
  | {
      ok: true;
      session: {
        userId: string;
        fullName: string;
        role: "ADMIN" | "EMPLOYEE";
        language: AppUiLanguage;
        companyId: string;
        companyName: string;
        companySubdomain: string;
        companyLogoUrl: string | null;
        primaryColor: string | null;
      } | null;
    }
  | { ok: false };

type WorkEntry = {
  id: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  activity: string;
  location: string;
  travelMinutes: number;
  workMinutes: number;
  grossMinutes: number;
  breakMinutes: number;
  breakAuto: boolean;
  noteEmployee: string;
  user: { id: string; fullName: string };
};

type DayBreak = {
  id: string;
  workDate: string; // YYYY-MM-DD
  breakStartHHMM: string | null;
  breakEndHHMM: string | null;
  manualMinutes: number;
  legalMinutes: number;
  autoSupplementMinutes: number;
  effectiveMinutes: number;
};

type TimeEntryCorrectionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type TimeEntryCorrectionRequest = {
  id: string;
  startDate: string;
  endDate: string;
  status: TimeEntryCorrectionRequestStatus;
  noteEmployee: string;
  noteAdmin: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
};

type TimeEntryCorrectionRequestStatusResponse = {
  ok: true;
  workDate: string;
  hasActiveUnlock: boolean;
  requiresCorrectionRequest: boolean;
  currentMissingWorkdaysCount: number;
  lockedMissingWorkdaysCount: number;
  graceWorkdaysLimit: number;
  pendingRequest: {
    id: string;
    startDate: string;
    endDate: string;
    status: "PENDING";
  } | null;
  latestDecisionRequest: {
    id: string;
    startDate: string;
    endDate: string;
    status: "APPROVED" | "REJECTED";
  } | null;
  adminTaskBypass: {
    active: boolean;
    taskId: string;
    workDate: string;
    startDate: string;
    endDate: string;
  } | null;
};

function isTimeEntryCorrectionRequestStatusResponse(
  v: unknown
): v is TimeEntryCorrectionRequestStatusResponse {
  if (!isRecord(v)) return false;
  if (v["ok"] !== true) return false;
  if (!isString(v["workDate"])) return false;
  if (typeof v["hasActiveUnlock"] !== "boolean") return false;
  if (typeof v["requiresCorrectionRequest"] !== "boolean") return false;
  if (typeof v["currentMissingWorkdaysCount"] !== "number") return false;
  if (typeof v["lockedMissingWorkdaysCount"] !== "number") return false;
  if (typeof v["graceWorkdaysLimit"] !== "number") return false;

  const pendingRequest = v["pendingRequest"];
  const latestDecisionRequest = v["latestDecisionRequest"];
  const adminTaskBypass = v["adminTaskBypass"];

  const isRequestRange = (
    value: unknown
  ): value is {
    id: string;
    startDate: string;
    endDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } => {
    if (!isRecord(value)) return false;
    return (
      isString(value["id"]) &&
      isString(value["startDate"]) &&
      isString(value["endDate"]) &&
      (
        value["status"] === "PENDING" ||
        value["status"] === "APPROVED" ||
        value["status"] === "REJECTED"
      )
    );
  };

  const isAdminTaskBypass = (
    value: unknown
  ): value is {
    active: boolean;
    taskId: string;
    workDate: string;
    startDate: string;
    endDate: string;
  } => {
    if (!isRecord(value)) return false;
    return (
      typeof value["active"] === "boolean" &&
      isString(value["taskId"]) &&
      isString(value["workDate"]) &&
      isString(value["startDate"]) &&
      isString(value["endDate"])
    );
  };

  const pendingOk = pendingRequest === null || isRequestRange(pendingRequest);
  const latestOk = latestDecisionRequest === null || isRequestRange(latestDecisionRequest);
  const bypassOk = adminTaskBypass === null || isAdminTaskBypass(adminTaskBypass);

  return pendingOk && latestOk && bypassOk;
}

function toIsoDateLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDE(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return yyyyMmDd;
  }

  const weekdayNames = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."] as const;
  const dt = new Date(y, m - 1, d);
  const weekday = weekdayNames[dt.getDay()] ?? "";

  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = String(y);

  return `${weekday} ${day}.${month}.${year}`;
}

function formatHM(minutes: number) {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${String(mm).padStart(2, "0")}min`;
}

/** Gruppierung Monat/Jahr */
function toYMD(dateStr: string): string {
  return dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;
}
function monthKeyFromWorkDate(workDate: string): string {
  return toYMD(workDate).slice(0, 7); // YYYY-MM
}
function monthLabelDE(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return monthKey;
  }

  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ] as const;

  const monthName = monthNames[m - 1];
  if (!monthName) {
    return monthKey;
  }

  return `${monthName} ${y}`;
}
function sortMonthKeysDesc(a: string, b: string): number {
  return a === b ? 0 : a > b ? -1 : 1;
}
function sortEntriesDesc(a: WorkEntry, b: WorkEntry): number {
  const da = toYMD(a.workDate);
  const db = toYMD(b.workDate);
  if (da !== db) return da > db ? -1 : 1;
  if (a.startTime !== b.startTime) return a.startTime > b.startTime ? -1 : 1;
  return 0;
}

type DayGroup = {
  date: string; // YYYY-MM-DD
  label: string;
  entries: WorkEntry[];
};

type MonthDayGroup = {
  key: string; // YYYY-MM
  label: string;
  days: DayGroup[];
};

function sortYMDDesc(a: string, b: string): number {
  return a === b ? 0 : a > b ? -1 : 1;
}

function groupByMonthThenDay(entries: WorkEntry[]): MonthDayGroup[] {
  const monthMap = new Map<string, Map<string, WorkEntry[]>>();

  for (const e of entries) {
    const day = toYMD(e.workDate);
    const month = monthKeyFromWorkDate(day);

    const dayMap = monthMap.get(month) ?? new Map<string, WorkEntry[]>();
    const arr = dayMap.get(day) ?? [];
    arr.push(e);
    dayMap.set(day, arr);

    monthMap.set(month, dayMap);
  }

  const monthKeys = Array.from(monthMap.keys()).sort(sortMonthKeysDesc);

  return monthKeys.map((mk) => {
    const dayMap = monthMap.get(mk) ?? new Map<string, WorkEntry[]>();
    const dayKeys = Array.from(dayMap.keys()).sort(sortYMDDesc);

    const days: DayGroup[] = dayKeys.map((dk) => ({
      date: dk,
      label: formatDateDE(dk),
      entries: (dayMap.get(dk) ?? []).slice().sort(sortEntriesDesc),
    }));

    return {
      key: mk,
      label: monthLabelDE(mk),
      days,
    };
  });
}

function formatPause(minutes: number): string {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  if (m < 60) return `${m} Min`;
  return formatHM(m);
}

function formatDateDayLineDE(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return yyyyMmDd;
  }

  const weekdayNames = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."] as const;
  const dt = new Date(y, m - 1, d);
  const weekday = weekdayNames[dt.getDay()] ?? "";

  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year = String(y);

  return `${weekday} ${day}.${month}.${year}`;
}

function formatMinutesCompact(minutes: number) {
  const mins = Math.max(0, Math.round(minutes));
  if (mins < 60) return `${mins} Min`;
  return formatHM(mins);
}

function hasCompleteTimeRange(startHHMM: string, endHHMM: string): boolean {
  return /^\d{2}:\d{2}$/.test(startHHMM) && /^\d{2}:\d{2}$/.test(endHHMM);
}

function getLegalBreakHintLines(): string[] {
  return [
    "Gesetzliche Pausen:",
    "ab mehr als 6h: 30 Min",
    "ab mehr als 9h: 45 Min",
  ];
}

function hasMeaningfulEntryInput(params: {
  startTime: string;
  endTime: string;
}): boolean {
  const { startTime, endTime } = params;
  return hasCompleteTimeRange(startTime, endTime);
}

type EditForm = {
  id: string;
  workDate: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  travelMinutes: string;
  noteEmployee: string;
  userFullName: string;
};

function minutesBetween(startHHMM: string, endHHMM: string): number {
  const [sh, sm] = startHHMM.split(":").map((x) => Number(x));
  const [eh, em] = endHHMM.split(":").map((x) => Number(x));
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return Math.max(0, end - start);
}
function legalBreakMinutes(grossMinutes: number): number {
  if (!Number.isFinite(grossMinutes) || grossMinutes <= 0) return 0;
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

type DayTotals = {
  grossDay: number;
  legalBreak: number;
  manualBreak: number;
  autoSupplement: number;
  effectiveBreak: number;
  breakAuto: boolean;
  netDay: number;
};

function computeManualBreakMinutes(startHHMM: string, endHHMM: string): number {
  if (!startHHMM || !endHHMM) return 0;
  return minutesBetween(startHHMM, endHHMM);
}

function computeEffectiveDayBreak(grossDay: number, manualBreak: number): DayTotals {
  const gross = Math.max(0, Math.round(grossDay));
  const manual = Math.max(0, Math.round(manualBreak));
  const legal = legalBreakMinutes(gross);
  const effective = Math.min(gross, Math.max(manual, legal));
  const autoSupplement = Math.max(0, effective - Math.min(manual, effective));

  return {
    grossDay: gross,
    legalBreak: legal,
    manualBreak: Math.min(manual, gross),
    autoSupplement,
    effectiveBreak: effective,
    breakAuto: autoSupplement > 0,
    netDay: Math.max(0, gross - effective),
  };
}

function computeDayTotals(
  entries: WorkEntry[],
  dayBreakMap: Map<string, DayBreak>,
  ymd: string,
  additionalGross: number,
  manualBreakOverride: number | null
): DayTotals {
  const grossExisting = entries
    .filter((e) => toYMD(e.workDate) === ymd)
    .reduce((sum, entry) => sum + (Number.isFinite(entry.grossMinutes) ? entry.grossMinutes : 0), 0);

  const grossDay = Math.max(0, Math.round(grossExisting + Math.max(0, Math.round(additionalGross))));
  const existingDayBreak = dayBreakMap.get(ymd);
  const manualBreak =
    manualBreakOverride !== null
      ? manualBreakOverride
      : existingDayBreak?.manualMinutes ?? 0;

  return computeEffectiveDayBreak(grossDay, manualBreak);
}

function buildDayTotalsMap(entries: WorkEntry[], dayBreakMap: Map<string, DayBreak>): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>();
  const days = new Set(entries.map((e) => toYMD(e.workDate)));

  for (const day of days) {
    map.set(day, computeDayTotals(entries, dayBreakMap, day, 0, null));
  }

  return map;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;

  const userId = v.userId;
  const fullName = v.fullName;
  const role = v.role;
  const language = v.language;
  const companyId = v.companyId;
  const companyName = v.companyName;
  const companySubdomain = v.companySubdomain;
  const companyLogoUrl = v.companyLogoUrl;
  const primaryColor = v.primaryColor;

  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN") &&
    (language === "DE" ||
      language === "EN" ||
      language === "IT" ||
      language === "TR" ||
      language === "SQ" ||
      language === "KU") &&
    typeof companyId === "string" &&
    typeof companyName === "string" &&
    typeof companySubdomain === "string" &&
    (typeof companyLogoUrl === "string" || companyLogoUrl === null) &&
    (typeof primaryColor === "string" || primaryColor === null)
  );
}

type MeApiResponse = { session: SessionData | null };

function isMeApiResponse(v: unknown): v is MeApiResponse {
  return isRecord(v) && "session" in v && (v.session === null || isSessionData(v.session));
}

function isPastWorkDate(dateYMD: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYMD)) return false;
  return dateYMD < toIsoDateLocal(new Date());
}

function formatCorrectionRange(startDate: string, endDate: string): string {
  return startDate === endDate ? startDate : `${startDate} bis ${endDate}`;
}

type ErfassungTextKey =
  | "loading"
  | "details"
  | "cancel"
  | "enterActivity"
  | "loginAgain"
  | "saveFailed"
  | "networkSaveError"
  | "unknown"
  | "saveBreakIncomplete"
  | "saveBreakFailed"
  | "networkBreakSaveError"
  | "correctionPastOnly"
  | "correctionUnlockAlreadyExists"
  | "correctionPendingAlreadyExists"
  | "correctionCreateFailed"
  | "correctionSentSuccess"
  | "networkCorrectionError"
  | "syncTaskTaken"
  | "syncDateTaken"
  | "syncPlanTaken"
  | "createEntry"
  | "employee"
  | "entryAssignedAutomatically"
  | "date"
  | "selectDate"
  | "selectedPastDay"
  | "statusLoading"
  | "noCorrectionBecauseAdminTask"
  | "directEntryPossible"
  | "releasedRangeFromTo"
  | "adminReleasedDay"
  | "approvedRange"
  | "pendingCorrectionExists"
  | "pendingRange"
  | "lastCorrectionRejected"
  | "lastDecisionFor"
  | "sendNewCorrectionRequest"
  | "correctionRequiredNow"
  | "correctionNotRequiredNow"
  | "sendCorrectionRequest"
  | "start"
  | "end"
  | "workTimeCalculated"
  | "gross"
  | "legalBreak"
  | "net"
  | "activityPerformed"
  | "activityPlaceholder"
  | "location"
  | "locationPlaceholder"
  | "noteForAdmin"
  | "notePlaceholder"
  | "noteOptionalVisibleToAdmin"
  | "travelMinutes"
  | "reset"
  | "saveEntry"
  | "saving"
  | "saveBreak"
  | "breakCapture"
  | "breakFrom"
  | "breakTo"
  | "breakCalculation"
  | "breakRuleInfo"
  | "allEntries"
  | "year"
  | "allYears"
  | "loadingEntries"
  | "noEntriesForYear"
  | "expandCollapse"
  | "entry"
  | "entries"
  | "break"
  | "showBreakDetails"
  | "oClock"
  | "noActivityStored"
  | "noLocationStored"
  | "travelTime"
  | "showDetails"
  | "showNote"
  | "edit"
  | "delete"
  | "workTimeDetails"
  | "close"
  | "dateAndTime"
  | "netWorkTime"
  | "siteOrAddress"
  | "breakDetails"
  | "manualBreak"
  | "noManualBreak"
  | "legallyRequired"
  | "autoCompleted"
  | "noAutoCompletion"
  | "effectiveBreakTotal"
  | "note"
  | "noNote"
  | "selectedDate"
  | "serverDeterminesCorrectionRange"
  | "existingCorrectionInfoLoading"
  | "activeUnlockAlreadyExists"
  | "correctionRequired"
  | "missingDaysUntilLock"
  | "sendRequest"
  | "editEntry"
  | "saveChanges"
  | "assignmentManagedServerSide"
  | "performedActivity"
  | "travelTimeMin"
  | "changesSaveFailed";

const ERFASSUNG_DICTIONARY: Record<ErfassungTextKey, Record<AppUiLanguage, string>> = {
  loading: {
    DE: "Lade...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
  },
  details: {
    DE: "Details anzeigen",
    EN: "Show details",
    IT: "Mostra dettagli",
    TR: "Detayları göster",
    SQ: "Trego detajet",
    KU: "Xalqên nîşan bide",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    KU: "Betal bike",
  },
  enterActivity: {
    DE: "Bitte Tätigkeit eingeben.",
    EN: "Please enter an activity.",
    IT: "Inserisci un'attività.",
    TR: "Lütfen bir faaliyet girin.",
    SQ: "Ju lutem vendosni aktivitetin.",
    KU: "Ji kerema xwe çalakiyek binivîse.",
  },
  loginAgain: {
    DE: "Bitte neu einloggen.",
    EN: "Please log in again.",
    IT: "Effettua nuovamente l'accesso.",
    TR: "Lütfen tekrar giriş yapın.",
    SQ: "Ju lutem hyni përsëri.",
    KU: "Ji kerema xwe dîsa têkeve.",
  },
  saveFailed: {
    DE: "Speichern fehlgeschlagen.",
    EN: "Saving failed.",
    IT: "Salvataggio non riuscito.",
    TR: "Kaydetme başarısız oldu.",
    SQ: "Ruajtja dështoi.",
    KU: "Tomarkirin bi ser neket.",
  },
  networkSaveError: {
    DE: "Netzwerkfehler beim Speichern.",
    EN: "Network error while saving.",
    IT: "Errore di rete durante il salvataggio.",
    TR: "Kaydetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes.",
    KU: "Di tomarkirinê de şaşiya torê.",
  },
  unknown: {
    DE: "Unbekannt",
    EN: "Unknown",
    IT: "Sconosciuto",
    TR: "Bilinmiyor",
    SQ: "I panjohur",
    KU: "Nenas",
  },
  saveBreakIncomplete: {
    DE: "Bitte Pause von und bis vollständig eingeben.",
    EN: "Please enter both break start and end.",
    IT: "Inserisci in modo completo inizio e fine pausa.",
    TR: "Lütfen mola başlangıç ve bitişini tam girin.",
    SQ: "Ju lutem vendosni plotësisht fillimin dhe fundin e pushimit.",
    KU: "Ji kerema xwe destpêk û dawiya navberê bi tevahî binivîse.",
  },
  saveBreakFailed: {
    DE: "Pause speichern fehlgeschlagen.",
    EN: "Saving the break failed.",
    IT: "Salvataggio pausa non riuscito.",
    TR: "Mola kaydedilemedi.",
    SQ: "Ruajtja e pushimit dështoi.",
    KU: "Tomarkirina navberê bi ser neket.",
  },
  networkBreakSaveError: {
    DE: "Netzwerkfehler beim Speichern der Pause.",
    EN: "Network error while saving the break.",
    IT: "Errore di rete durante il salvataggio della pausa.",
    TR: "Mola kaydedilirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes së pushimit.",
    KU: "Di tomarkirina navberê de şaşiya torê.",
  },
  correctionPastOnly: {
    DE: "Ein Nachtragsantrag ist nur für vergangene Tage möglich.",
    EN: "A correction request is only possible for past days.",
    IT: "Una richiesta di integrazione è possibile solo per giorni passati.",
    TR: "Düzeltme talebi yalnızca geçmiş günler için mümkündür.",
    SQ: "Kërkesa për korrigjim lejohet vetëm për ditët e kaluara.",
    KU: "Daxwaza rastkirinê tenê ji bo rojên borî gengaz e.",
  },
  correctionUnlockAlreadyExists: {
    DE: "Für diesen Tag existiert bereits eine aktive Freigabe.",
    EN: "An active approval already exists for this day.",
    IT: "Per questo giorno esiste già un'approvazione attiva.",
    TR: "Bu gün için zaten aktif bir onay var.",
    SQ: "Për këtë ditë ekziston tashmë një miratim aktiv.",
    KU: "Ji bo vê rojê berê xweşandinê çalak heye.",
  },
  correctionPendingAlreadyExists: {
    DE: "Für diesen Tag existiert bereits ein offener Nachtragsantrag.",
    EN: "There is already an open correction request for this day.",
    IT: "Esiste già una richiesta aperta per questo giorno.",
    TR: "Bu gün için zaten açık bir düzeltme talebi var.",
    SQ: "Për këtë ditë ekziston tashmë një kërkesë e hapur.",
    KU: "Ji bo vê rojê daxwazek vekirî ya rastkirinê heye.",
  },
  correctionCreateFailed: {
    DE: "Nachtragsantrag konnte nicht erstellt werden.",
    EN: "The correction request could not be created.",
    IT: "Non è stato possibile creare la richiesta.",
    TR: "Düzeltme talebi oluşturulamadı.",
    SQ: "Kërkesa për korrigjim nuk mund të krijohej.",
    KU: "Daxwaza rastkirinê nehat afirandin.",
  },
  correctionSentSuccess: {
    DE: "Nachtragsantrag wurde erfolgreich gesendet.",
    EN: "The correction request was sent successfully.",
    IT: "La richiesta è stata inviata con successo.",
    TR: "Düzeltme talebi başarıyla gönderildi.",
    SQ: "Kërkesa për korrigjim u dërgua me sukses.",
    KU: "Daxwaza rastkirinê bi serkeftî hate şandin.",
  },
  networkCorrectionError: {
    DE: "Netzwerkfehler beim Senden des Nachtragsantrags.",
    EN: "Network error while sending the correction request.",
    IT: "Errore di rete durante l'invio della richiesta.",
    TR: "Düzeltme talebi gönderilirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë dërgimit të kërkesës.",
    KU: "Di şandina daxwaza rastkirinê de şaşiya torê.",
  },
  syncTaskTaken: {
    DE: "Aufgabe übernommen. Bitte Start- und Endzeit ergänzen.",
    EN: "Task imported. Please add start and end time.",
    IT: "Attività importata. Aggiungi ora di inizio e fine.",
    TR: "Görev aktarıldı. Lütfen başlangıç ve bitiş saatini ekleyin.",
    SQ: "Detyra u mor. Ju lutem shtoni orën e fillimit dhe përfundimit.",
    KU: "Erk hate standin. Ji kerema xwe dema destpêk û dawiyê zêde bike.",
  },
  syncDateTaken: {
    DE: "Datum aus der Benachrichtigung übernommen. Bitte Start- und Endzeit ergänzen.",
    EN: "Date imported from the notification. Please add start and end time.",
    IT: "Data importata dalla notifica. Aggiungi ora di inizio e fine.",
    TR: "Tarih bildirimden alındı. Lütfen başlangıç ve bitiş saatini ekleyin.",
    SQ: "Data u mor nga njoftimi. Ju lutem shtoni orën e fillimit dhe përfundimit.",
    KU: "Dîrok ji hişyariyê hate standin. Ji kerema xwe dema destpêk û dawiyê zêde bike.",
  },
  syncPlanTaken: {
    DE: "Planeintrag übernommen. Bitte Start- und Endzeit ergänzen.",
    EN: "Schedule entry imported. Please add start and end time.",
    IT: "Voce pianificata importata. Aggiungi ora di inizio e fine.",
    TR: "Plan kaydı aktarıldı. Lütfen başlangıç ve bitiş saatini ekleyin.",
    SQ: "Regjistrimi i planit u mor. Ju lutem shtoni orën e fillimit dhe përfundimit.",
    KU: "Tomara planê hate standin. Ji kerema xwe dema destpêk û dawiyê zêde bike.",
  },
  createEntry: {
    DE: "Stunden erfassen",
    EN: "Record hours",
    IT: "Registra ore",
    TR: "Saat gir",
    SQ: "Regjistro orët",
    KU: "Demjimêran tomar bike",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
  },
  entryAssignedAutomatically: {
    DE: "Der Eintrag wird automatisch deinem Konto zugeordnet.",
    EN: "The entry is automatically assigned to your account.",
    IT: "La voce viene assegnata automaticamente al tuo account.",
    TR: "Kayıt otomatik olarak hesabınıza atanır.",
    SQ: "Regjistrimi i caktohet automatikisht llogarisë suaj.",
    KU: "Tomar bixweber bi hesabê te ve tê girêdan.",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
  },
  selectDate: {
    DE: "Datum auswählen",
    EN: "Select date",
    IT: "Seleziona data",
    TR: "Tarih seçin",
    SQ: "Zgjidh datën",
    KU: "Dîrok hilbijêre",
  },
  selectedPastDay: {
    DE: "Vergangener Tag ausgewählt",
    EN: "Past day selected",
    IT: "Giorno passato selezionato",
    TR: "Geçmiş gün seçildi",
    SQ: "U zgjodh një ditë e kaluar",
    KU: "Rojeke borî hate hilbijartin",
  },
  statusLoading: {
    DE: "Status für den ausgewählten Tag wird geladen...",
    EN: "Loading status for the selected day...",
    IT: "Caricamento stato per il giorno selezionato...",
    TR: "Seçilen günün durumu yükleniyor...",
    SQ: "Po ngarkohet statusi për ditën e zgjedhur...",
    KU: "Rewşa roja hilbijartî tê barkirin...",
  },
  noCorrectionBecauseAdminTask: {
    DE: "Für diesen Tag ist kein Nachtragsantrag erforderlich, weil du ihn über eine Admin-Aufgabe geöffnet hast.",
    EN: "No correction request is required for this day because you opened it through an admin task.",
    IT: "Per questo giorno non è necessaria una richiesta perché è stato aperto tramite un'attività admin.",
    TR: "Bu gün için düzeltme talebi gerekmez çünkü günü yönetici görevi üzerinden açtınız.",
    SQ: "Për këtë ditë nuk kërkohet kërkesë korrigjimi sepse e hapët përmes një detyre të adminit.",
    KU: "Ji bo vê rojê daxwaza rastkirinê ne pêwist e, çimkî tu bi erkek admin ve vebûyî.",
  },
  directEntryPossible: {
    DE: "Du kannst den Eintrag für",
    EN: "You can enter the record for",
    IT: "Puoi registrare la voce per",
    TR: "Şu gün için kayıt yapabilirsiniz:",
    SQ: "Mund ta regjistroni hyrjen për",
    KU: "Tu dikarî tomara vê rojê bike ji bo",
  },
  releasedRangeFromTo: {
    DE: "Der freigegebene Zeitraum reicht von",
    EN: "The approved range goes from",
    IT: "L'intervallo approvato va da",
    TR: "Onaylanan aralık:",
    SQ: "Periudha e miratuar shkon nga",
    KU: "Navbera pejirandî ji ... heta ... ye",
  },
  adminReleasedDay: {
    DE: "Dieser Tag wurde vom Admin für den Nachtrag freigegeben. Du kannst ihn jetzt bearbeiten.",
    EN: "This day was approved by the admin for correction. You can edit it now.",
    IT: "Questo giorno è stato approvato dall'admin per l'integrazione. Ora puoi modificarlo.",
    TR: "Bu gün düzeltme için yönetici tarafından açıldı. Artık düzenleyebilirsiniz.",
    SQ: "Kjo ditë u miratua nga admini për korrigjim. Tani mund ta ndryshoni.",
    KU: "Ev roj ji aliyê admin ve ji bo rastkirinê hate vekirin. Naha tu dikarî sererast bikî.",
  },
  approvedRange: {
    DE: "Genehmigter Zeitraum:",
    EN: "Approved range:",
    IT: "Intervallo approvato:",
    TR: "Onaylanan aralık:",
    SQ: "Periudha e miratuar:",
    KU: "Navbera pejirandî:",
  },
  pendingCorrectionExists: {
    DE: "Für diesen Tag existiert bereits ein offener Nachtragsantrag.",
    EN: "There is already an open correction request for this day.",
    IT: "Esiste già una richiesta aperta per questo giorno.",
    TR: "Bu gün için zaten açık bir düzeltme talebi var.",
    SQ: "Për këtë ditë ekziston tashmë një kërkesë e hapur.",
    KU: "Ji bo vê rojê daxwazek vekirî ya rastkirinê heye.",
  },
  pendingRange: {
    DE: "Offener Zeitraum:",
    EN: "Open range:",
    IT: "Intervallo aperto:",
    TR: "Açık aralık:",
    SQ: "Periudha e hapur:",
    KU: "Navbera vekirî:",
  },
  lastCorrectionRejected: {
    DE: "Der letzte Nachtragsantrag für diesen Zeitraum wurde abgelehnt.",
    EN: "The last correction request for this period was rejected.",
    IT: "L'ultima richiesta per questo periodo è stata rifiutata.",
    TR: "Bu dönem için son düzeltme talebi reddedildi.",
    SQ: "Kërkesa e fundit për këtë periudhë u refuzua.",
    KU: "Daxwaza dawî ya rastkirinê ji bo vê navberê hat redkirin.",
  },
  lastDecisionFor: {
    DE: "Letzte Entscheidung für:",
    EN: "Last decision for:",
    IT: "Ultima decisione per:",
    TR: "Son karar:",
    SQ: "Vendimi i fundit për:",
    KU: "Biryara dawî ji bo:",
  },
  sendNewCorrectionRequest: {
    DE: "Neuen Nachtragsantrag senden",
    EN: "Send new correction request",
    IT: "Invia nuova richiesta",
    TR: "Yeni düzeltme talebi gönder",
    SQ: "Dërgo kërkesë të re korrigjimi",
    KU: "Daxwaza nû ya rastkirinê bişîne",
  },
  correctionRequiredNow: {
    DE: "Für den ausgewählten Tag ist jetzt ein Nachtragsantrag erforderlich.",
    EN: "A correction request is now required for the selected day.",
    IT: "Per il giorno selezionato è ora richiesta una richiesta di integrazione.",
    TR: "Seçilen gün için artık düzeltme talebi gereklidir.",
    SQ: "Për ditën e zgjedhur tani kërkohet kërkesë korrigjimi.",
    KU: "Ji bo roja hilbijartî niha daxwaza rastkirinê pêwist e.",
  },
  correctionNotRequiredNow: {
    DE: "Für den ausgewählten Tag ist aktuell noch kein Nachtragsantrag erforderlich.",
    EN: "No correction request is currently required for the selected day.",
    IT: "Al momento non è richiesta una richiesta per il giorno selezionato.",
    TR: "Seçilen gün için şu anda düzeltme talebi gerekli değil.",
    SQ: "Aktualisht nuk kërkohet kërkesë korrigjimi për ditën e zgjedhur.",
    KU: "Ji bo roja hilbijartî hêj daxwaza rastkirinê pêwist nîne.",
  },
  sendCorrectionRequest: {
    DE: "Nachtragsantrag senden",
    EN: "Send correction request",
    IT: "Invia richiesta",
    TR: "Düzeltme talebi gönder",
    SQ: "Dërgo kërkesën për korrigjim",
    KU: "Daxwaza rastkirinê bişîne",
  },
  start: { DE: "Beginn", EN: "Start", IT: "Inizio", TR: "Başlangıç", SQ: "Fillimi", KU: "Destpêk" },
  end: { DE: "Ende", EN: "End", IT: "Fine", TR: "Bitiş", SQ: "Fundi", KU: "Dawî" },
  workTimeCalculated: {
    DE: "Arbeitszeit (Tag berechnet)",
    EN: "Work time (day calculated)",
    IT: "Orario di lavoro (giorno calcolato)",
    TR: "Çalışma süresi (gün hesaplandı)",
    SQ: "Koha e punës (dita e llogaritur)",
    KU: "Dema karê (roj hate hesibandin)",
  },
  gross: { DE: "Brutto", EN: "Gross", IT: "Lordo", TR: "Brüt", SQ: "Bruto", KU: "Berî derxistin" },
  legalBreak: {
    DE: "Gesetzliche Pause",
    EN: "Legal break",
    IT: "Pausa legale",
    TR: "Yasal mola",
    SQ: "Pushimi ligjor",
    KU: "Navbera qanûnî",
  },
  net: { DE: "Netto", EN: "Net", IT: "Netto", TR: "Net", SQ: "Neto", KU: "Safî" },
  activityPerformed: {
    DE: "Ausgeführte Tätigkeit",
    EN: "Performed activity",
    IT: "Attività svolta",
    TR: "Yapılan faaliyet",
    SQ: "Aktiviteti i kryer",
    KU: "Çalakiya pêk hatî",
  },
  activityPlaceholder: {
    DE: "z.B. Fliesen verlegen, Verfugen...",
    EN: "e.g. laying tiles, grouting...",
    IT: "es. posa piastrelle, stuccatura...",
    TR: "örn. fayans döşeme, derz dolgu...",
    SQ: "p.sh. shtrim pllakash, fugim...",
    KU: "mînak: danîna tileyan, dagirtina derzan...",
  },
  location: {
    DE: "Einsatzort",
    EN: "Location",
    IT: "Luogo di lavoro",
    TR: "Çalışma yeri",
    SQ: "Vendndodhja e punës",
    KU: "Cihê karê",
  },
  locationPlaceholder: {
    DE: "z.B. Musterstraße 5, München",
    EN: "e.g. Musterstraße 5, Munich",
    IT: "es. Musterstraße 5, Monaco",
    TR: "örn. Musterstraße 5, Münih",
    SQ: "p.sh. Musterstraße 5, Mynih",
    KU: "mînak: Musterstraße 5, Munich",
  },
  noteForAdmin: {
    DE: "Notiz für Admin",
    EN: "Note for admin",
    IT: "Nota per admin",
    TR: "Yönetici için not",
    SQ: "Shënim për adminin",
    KU: "Nîşe ji bo admin",
  },
  notePlaceholder: {
    DE: "Optional: Hinweise zum Einsatz, Material, Besonderheiten...",
    EN: "Optional: notes about the assignment, material, special cases...",
    IT: "Opzionale: note su incarico, materiale, particolarità...",
    TR: "İsteğe bağlı: görev, malzeme, özel durumlarla ilgili notlar...",
    SQ: "Opsionale: shënime për detyrën, materialin, veçoritë...",
    KU: "Vebijarkî: têbînî li ser kar, materyal, taybetî...",
  },
  noteOptionalVisibleToAdmin: {
    DE: "Diese Notiz ist optional und wird dem Admin beim Eintrag angezeigt.",
    EN: "This note is optional and will be shown to the admin with the entry.",
    IT: "Questa nota è facoltativa e sarà visibile all'admin.",
    TR: "Bu not isteğe bağlıdır ve kayıtla birlikte yöneticiye gösterilir.",
    SQ: "Ky shënim është opsional dhe do t'i shfaqet adminit te regjistrimi.",
    KU: "Ev nîşe vebijarkî ye û bi tomarê re ji admin re tê nîşandan.",
  },
  travelMinutes: {
    DE: "Fahrzeit (Min.)",
    EN: "Travel time (min.)",
    IT: "Tempo di viaggio (min.)",
    TR: "Yol süresi (dk.)",
    SQ: "Koha e udhëtimit (min.)",
    KU: "Dema rê (deq.)",
  },
  reset: {
    DE: "Zurücksetzen",
    EN: "Reset",
    IT: "Reimposta",
    TR: "Sıfırla",
    SQ: "Rivendos",
    KU: "Vesaz bike",
  },
  saveEntry: {
    DE: "Eintrag speichern",
    EN: "Save entry",
    IT: "Salva voce",
    TR: "Kaydı kaydet",
    SQ: "Ruaj regjistrimin",
    KU: "Tomarê tomar bike",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
  },
  saveBreak: {
    DE: "Pause speichern",
    EN: "Save break",
    IT: "Salva pausa",
    TR: "Molayı kaydet",
    SQ: "Ruaj pushimin",
    KU: "Navberê tomar bike",
  },
  breakCapture: {
    DE: "Pause erfassen",
    EN: "Record break",
    IT: "Registra pausa",
    TR: "Mola gir",
    SQ: "Regjistro pushimin",
    KU: "Navberê tomar bike",
  },
  breakFrom: {
    DE: "Pause von",
    EN: "Break from",
    IT: "Pausa da",
    TR: "Mola başlangıcı",
    SQ: "Pushimi nga",
    KU: "Navberê ji",
  },
  breakTo: {
    DE: "Pause bis",
    EN: "Break to",
    IT: "Pausa fino a",
    TR: "Mola bitişi",
    SQ: "Pushimi deri",
    KU: "Navberê heta",
  },
  breakCalculation: {
    DE: "Pausenberechnung",
    EN: "Break calculation",
    IT: "Calcolo pausa",
    TR: "Mola hesaplaması",
    SQ: "Llogaritja e pushimit",
    KU: "Hesabkirina navberê",
  },
  breakRuleInfo: {
    DE: "Die gesetzliche Pause richtet sich nach der gesamten Arbeitszeit des Tages. Falls du zu wenig Pause einträgst, ergänzt die App die fehlende Differenz automatisch.",
    EN: "The legal break depends on the total working time of the day. If you enter too little break time, the app automatically adds the missing difference.",
    IT: "La pausa legale dipende dal totale delle ore lavorate nel giorno. Se inserisci una pausa troppo breve, l'app aggiunge automaticamente la differenza mancante.",
    TR: "Yasal mola günün toplam çalışma süresine bağlıdır. Çok az mola girerseniz uygulama eksik farkı otomatik ekler.",
    SQ: "Pushimi ligjor varet nga koha totale e punës së ditës. Nëse vendosni shumë pak pushim, aplikacioni e plotëson automatikisht diferencën që mungon.",
    KU: "Navbera qanûnî li gorî tevahiya dema karê ya rojê ye. Heke tu navberek kêm binivîsî, sepan cudahiya mayî bixweber zêde dike.",
  },
  allEntries: {
    DE: "Alle Einträge",
    EN: "All entries",
    IT: "Tutte le voci",
    TR: "Tüm kayıtlar",
    SQ: "Të gjitha regjistrimet",
    KU: "Hemû tomar",
  },
  year: { DE: "Jahr", EN: "Year", IT: "Anno", TR: "Yıl", SQ: "Viti", KU: "Sal" },
  allYears: {
    DE: "Alle Jahre",
    EN: "All years",
    IT: "Tutti gli anni",
    TR: "Tüm yıllar",
    SQ: "Të gjitha vitet",
    KU: "Hemû sal",
  },
  loadingEntries: {
    DE: "Lade Einträge...",
    EN: "Loading entries...",
    IT: "Caricamento voci...",
    TR: "Kayıtlar yükleniyor...",
    SQ: "Po ngarkohen regjistrimet...",
    KU: "Tomar têne barkirin...",
  },
  noEntriesForYear: {
    DE: "Keine Einträge für das ausgewählte Jahr vorhanden.",
    EN: "No entries available for the selected year.",
    IT: "Nessuna voce disponibile per l'anno selezionato.",
    TR: "Seçilen yıl için kayıt yok.",
    SQ: "Nuk ka regjistrime për vitin e zgjedhur.",
    KU: "Ji bo sala hilbijartî tomar tune ne.",
  },
  expandCollapse: {
    DE: "Ein-/Ausklappen",
    EN: "Expand/collapse",
    IT: "Espandi/comprimi",
    TR: "Aç/kapat",
    SQ: "Hap/mbyll",
    KU: "Veke/bigire",
  },
  entry: { DE: "Eintrag", EN: "entry", IT: "voce", TR: "kayıt", SQ: "regjistrim", KU: "tomar" },
  entries: { DE: "Einträge", EN: "entries", IT: "voci", TR: "kayıt", SQ: "regjistrime", KU: "tomar" },
  break: { DE: "Pause", EN: "break", IT: "pausa", TR: "mola", SQ: "pushim", KU: "navber" },
  showBreakDetails: {
    DE: "Pausen-Details anzeigen",
    EN: "Show break details",
    IT: "Mostra dettagli pausa",
    TR: "Mola detaylarını göster",
    SQ: "Shfaq detajet e pushimit",
    KU: "Hûrguliyên navberê nîşan bide",
  },
  oClock: {
    DE: "Uhr",
    EN: "",
    IT: "",
    TR: "",
    SQ: "",
    KU: "",
  },
  noActivityStored: {
    DE: "Keine Tätigkeit hinterlegt",
    EN: "No activity stored",
    IT: "Nessuna attività salvata",
    TR: "Kayıtlı faaliyet yok",
    SQ: "Nuk ka aktivitet të ruajtur",
    KU: "Çalakî nehatiye tomar kirin",
  },
  noLocationStored: {
    DE: "Keine Baustelle / Adresse hinterlegt",
    EN: "No site / address stored",
    IT: "Nessun cantiere / indirizzo salvato",
    TR: "Kayıtlı şantiye / adres yok",
    SQ: "Nuk ka kantier / adresë të ruajtur",
    KU: "Cihê şantiyê / navnîşan nehatiye tomar kirin",
  },
  travelTime: {
    DE: "Fahrtzeit:",
    EN: "Travel time:",
    IT: "Tempo di viaggio:",
    TR: "Yol süresi:",
    SQ: "Koha e udhëtimit:",
    KU: "Dema rê:",
  },
  showDetails: {
    DE: "Details anzeigen",
    EN: "Show details",
    IT: "Mostra dettagli",
    TR: "Detayları göster",
    SQ: "Shfaq detajet",
    KU: "Hûrguliyan nîşan bide",
  },
  showNote: {
    DE: "Notiz anzeigen",
    EN: "Show note",
    IT: "Mostra nota",
    TR: "Notu göster",
    SQ: "Shfaq shënimin",
    KU: "Nîşeyê nîşan bide",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    KU: "Sererast bike",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
  },
  workTimeDetails: {
    DE: "Arbeitszeit-Details",
    EN: "Work time details",
    IT: "Dettagli orario di lavoro",
    TR: "Çalışma süresi detayları",
    SQ: "Detajet e kohës së punës",
    KU: "Hûrguliyên dema karê",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  dateAndTime: {
    DE: "Datum & Zeit",
    EN: "Date & time",
    IT: "Data e ora",
    TR: "Tarih ve saat",
    SQ: "Data dhe ora",
    KU: "Dîrok û dem",
  },
  netWorkTime: {
    DE: "Netto-Arbeitszeit",
    EN: "Net work time",
    IT: "Orario netto",
    TR: "Net çalışma süresi",
    SQ: "Koha neto e punës",
    KU: "Dema safî ya karê",
  },
  siteOrAddress: {
    DE: "Baustelle / Adresse",
    EN: "Site / address",
    IT: "Cantiere / indirizzo",
    TR: "Şantiye / adres",
    SQ: "Kantieri / adresa",
    KU: "Cihê karê / navnîşan",
  },
  breakDetails: {
    DE: "Pausen-Details",
    EN: "Break details",
    IT: "Dettagli pausa",
    TR: "Mola detayları",
    SQ: "Detajet e pushimit",
    KU: "Hûrguliyên navberê",
  },
  manualBreak: {
    DE: "Manuell eingetragene Pause",
    EN: "Manually entered break",
    IT: "Pausa inserita manualmente",
    TR: "Elle girilen mola",
    SQ: "Pushimi i futur manualisht",
    KU: "Navbera bi destan hatiye nivîsîn",
  },
  noManualBreak: {
    DE: "Keine manuelle Pause eingetragen",
    EN: "No manual break entered",
    IT: "Nessuna pausa manuale inserita",
    TR: "Elle girilmiş mola yok",
    SQ: "Nuk ka pushim manual të futur",
    KU: "Navbera bi destan nehatiye nivîsîn",
  },
  legallyRequired: {
    DE: "Gesetzlich erforderlich",
    EN: "Legally required",
    IT: "Legalmente richiesto",
    TR: "Yasal olarak gerekli",
    SQ: "E kërkuar ligjërisht",
    KU: "Ji hêla qanûnê ve pêwist",
  },
  autoCompleted: {
    DE: "Automatisch ergänzt",
    EN: "Automatically added",
    IT: "Aggiunto automaticamente",
    TR: "Otomatik eklendi",
    SQ: "Plotësuar automatikisht",
    KU: "Bixweber hate zêdekirin",
  },
  noAutoCompletion: {
    DE: "Keine automatische Ergänzung",
    EN: "No automatic addition",
    IT: "Nessuna integrazione automatica",
    TR: "Otomatik ekleme yok",
    SQ: "Nuk ka plotësim automatik",
    KU: "Zêdekirina bixweber tune ye",
  },
  effectiveBreakTotal: {
    DE: "Wirksame Pause gesamt",
    EN: "Effective break total",
    IT: "Pausa effettiva totale",
    TR: "Toplam geçerli mola",
    SQ: "Pushimi efektiv total",
    KU: "Tevahiya navbera bi bandor",
  },
  note: {
    DE: "Notiz",
    EN: "Note",
    IT: "Nota",
    TR: "Not",
    SQ: "Shënim",
    KU: "Nîşe",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Nîşe tune ye.",
  },
  selectedDate: {
    DE: "Ausgewähltes Datum",
    EN: "Selected date",
    IT: "Data selezionata",
    TR: "Seçilen tarih",
    SQ: "Data e zgjedhur",
    KU: "Dîroka hilbijartî",
  },
  serverDeterminesCorrectionRange: {
    DE: "Der Server ermittelt automatisch den ältesten fehlenden Arbeitstag bis zu diesem Datum und erstellt daraus den passenden Nachtragszeitraum.",
    EN: "The server automatically determines the oldest missing workday up to this date and creates the matching correction period.",
    IT: "Il server determina automaticamente il giorno lavorativo mancante più vecchio fino a questa data e crea l'intervallo corretto.",
    TR: "Sunucu bu tarihe kadar en eski eksik iş gününü otomatik belirler ve uygun düzeltme aralığını oluşturur.",
    SQ: "Serveri përcakton automatikisht ditën më të vjetër të munguar të punës deri në këtë datë dhe krijon periudhën përkatëse.",
    KU: "Server bixweber roja karê ya herî kevn a wenda heta vê dîrokê diyar dike û navbera guncaw çêdike.",
  },
  existingCorrectionInfoLoading: {
    DE: "Bestehende Nachtragsinformationen werden geladen...",
    EN: "Loading existing correction information...",
    IT: "Caricamento informazioni esistenti...",
    TR: "Mevcut düzeltme bilgileri yükleniyor...",
    SQ: "Po ngarkohen informacionet ekzistuese të korrigjimit...",
    KU: "Agahiyên rastkirinê yên heyî têne barkirin...",
  },
  activeUnlockAlreadyExists: {
    DE: "Für den ausgewählten Tag existiert bereits eine aktive Freigabe. Ein neuer Antrag ist aktuell nicht nötig.",
    EN: "An active approval already exists for the selected day. A new request is not needed right now.",
    IT: "Per il giorno selezionato esiste già un'approvazione attiva. Una nuova richiesta non è necessaria al momento.",
    TR: "Seçilen gün için zaten aktif bir onay var. Şu anda yeni bir talep gerekli değil.",
    SQ: "Për ditën e zgjedhur ekziston tashmë një miratim aktiv. Një kërkesë e re nuk nevojitet tani.",
    KU: "Ji bo roja hilbijartî berê xweşandinê çalak heye. Naha daxwazek nû ne pêwist e.",
  },
  correctionRequired: {
    DE: "Ein Nachtragsantrag ist erforderlich.",
    EN: "A correction request is required.",
    IT: "È richiesta una richiesta di integrazione.",
    TR: "Düzeltme talebi gereklidir.",
    SQ: "Kërkohet një kërkesë korrigjimi.",
    KU: "Daxwaza rastkirinê pêwist e.",
  },
  missingDaysUntilLock: {
    DE: "fehlende Arbeitstage bis zur Sperrung.",
    EN: "missing workdays until lock.",
    IT: "giorni lavorativi mancanti fino al blocco.",
    TR: "kilide kadar eksik iş günü.",
    SQ: "ditë pune të munguara deri në bllokim.",
    KU: "rojên karê yên wenda heta girtinê.",
  },
  sendRequest: {
    DE: "Antrag senden",
    EN: "Send request",
    IT: "Invia richiesta",
    TR: "Talep gönder",
    SQ: "Dërgo kërkesën",
    KU: "Daxwazê bişîne",
  },
  editEntry: {
    DE: "Eintrag bearbeiten",
    EN: "Edit entry",
    IT: "Modifica voce",
    TR: "Kaydı düzenle",
    SQ: "Ndrysho regjistrimin",
    KU: "Tomarê sererast bike",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guherînan tomar bike",
  },
  assignmentManagedServerSide: {
    DE: "Zuordnung wird serverseitig automatisch verwaltet.",
    EN: "Assignment is managed automatically on the server side.",
    IT: "L'assegnazione è gestita automaticamente dal server.",
    TR: "Atama sunucu tarafında otomatik yönetilir.",
    SQ: "Caktimi menaxhohet automatikisht nga serveri.",
    KU: "Girêdan li aliyê serverê bixweber tê rêvebirin.",
  },
  performedActivity: {
    DE: "Ausgeführte Tätigkeit",
    EN: "Performed activity",
    IT: "Attività svolta",
    TR: "Yapılan faaliyet",
    SQ: "Aktiviteti i kryer",
    KU: "Çalakiya pêk hatî",
  },
  travelTimeMin: {
    DE: "Fahrzeit (Min.)",
    EN: "Travel time (min.)",
    IT: "Tempo di viaggio (min.)",
    TR: "Yol süresi (dk.)",
    SQ: "Koha e udhëtimit (min.)",
    KU: "Dema rê (deq.)",
  },
  changesSaveFailed: {
    DE: "Bearbeiten fehlgeschlagen.",
    EN: "Editing failed.",
    IT: "Modifica non riuscita.",
    TR: "Düzenleme başarısız oldu.",
    SQ: "Ndryshimi dështoi.",
    KU: "Sererastkirin bi ser neket.",
  },
};

export default function Page() {
  return (
    <React.Suspense fallback={null}>
      <ErfassungPageInner />
    </React.Suspense>
  );
}

function ErfassungPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = (key: ErfassungTextKey): string => translate(language, key, ERFASSUNG_DICTIONARY);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meResolved, setMeResolved] = useState(false);

  // Create-Form (ohne fullName)
  const [workDate, setWorkDate] = useState<string>(() => toIsoDateLocal(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [travelMinutes, setTravelMinutes] = useState<string>("0");
  const [noteEmployee, setNoteEmployee] = useState("");
  const [showSyncToast, setShowSyncToast] = useState(false);

  const [dayBreaks, setDayBreaks] = useState<DayBreak[]>([]);
  const [breakStartHHMM, setBreakStartHHMM] = useState("");
  const [breakEndHHMM, setBreakEndHHMM] = useState("");
  const [breakSaving, setBreakSaving] = useState(false);
  const [breakError, setBreakError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("ALLE");

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm | null>(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteEntry, setNoteEntry] = useState<WorkEntry | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEntry, setDetailsEntry] = useState<WorkEntry | null>(null);

  const [breakInfoOpen, setBreakInfoOpen] = useState(false);
  const [breakInfoDate, setBreakInfoDate] = useState<string>("");
  const [breakInfoManualStart, setBreakInfoManualStart] = useState<string>("");
  const [breakInfoManualEnd, setBreakInfoManualEnd] = useState<string>("");
  const [breakInfoManualMinutes, setBreakInfoManualMinutes] = useState<number>(0);
  const [breakInfoLegalMinutes, setBreakInfoLegalMinutes] = useState<number>(0);
  const [breakInfoAutoMinutes, setBreakInfoAutoMinutes] = useState<number>(0);
  const [breakInfoEffectiveMinutes, setBreakInfoEffectiveMinutes] = useState<number>(0);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccess, setCorrectionSuccess] = useState<string | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [correctionRequests, setCorrectionRequests] = useState<TimeEntryCorrectionRequest[]>([]);
  const [loadingCorrectionRequests, setLoadingCorrectionRequests] = useState(false);
  const [selectedCorrectionStatus, setSelectedCorrectionStatus] =
    useState<TimeEntryCorrectionRequestStatusResponse | null>(null);
  const sourceTaskId = useMemo(() => {
    const value = searchParams.get("sourceTaskId");
    return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
  }, [searchParams]);

  const syncDateParam = useMemo(() => {
    const value = searchParams.get("syncDate");
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : "";
  }, [searchParams]);

  const hasAdminTaskBypassForSelectedDate =
    selectedCorrectionStatus?.adminTaskBypass?.active === true &&
    selectedCorrectionStatus.adminTaskBypass.workDate === workDate;
  const syncActivityParam = useMemo(() => {
    const value = searchParams.get("syncActivity");
    return typeof value === "string" ? value.trim() : "";
  }, [searchParams]);

  const syncLocationParam = useMemo(() => {
    const value = searchParams.get("syncLocation");
    return typeof value === "string" ? value.trim() : "";
  }, [searchParams]);

  const syncToastMessage = useMemo(() => {
    if (sourceTaskId) {
      return t("syncTaskTaken");
    }

    if (syncDateParam && !syncActivityParam && !syncLocationParam) {
      return t("syncDateTaken");
    }

    if (syncDateParam) {
      return t("syncPlanTaken");
    }

    return t("syncPlanTaken");
  }, [sourceTaskId, syncDateParam, syncActivityParam, syncLocationParam, language]);
  const [loadingSelectedCorrectionStatus, setLoadingSelectedCorrectionStatus] = useState(false);

  const grossPreviewMinutes = useMemo(() => minutesBetween(startTime, endTime), [startTime, endTime]);
  const isEntryPreviewActive = useMemo(() => {
    return hasMeaningfulEntryInput({
      startTime,
      endTime,
    });
  }, [startTime, endTime]);

  const hasSavedEntriesForSelectedDay = useMemo(() => {
    return entries.some((entry) => toYMD(entry.workDate) === workDate);
  }, [entries, workDate]);

  const shouldShowEntryComputation = useMemo(() => {
    return isEntryPreviewActive;
  }, [isEntryPreviewActive]);

  const shouldShowBreakComputation = useMemo(() => {
    return hasSavedEntriesForSelectedDay;
  }, [hasSavedEntriesForSelectedDay]);

  const dayBreakMap = useMemo(() => {
    const map = new Map<string, DayBreak>();
    for (const item of dayBreaks) {
      map.set(item.workDate, item);
    }
    return map;
  }, [dayBreaks]);

  const selectedDayBreak = useMemo(() => {
    return dayBreakMap.get(workDate) ?? null;
  }, [dayBreakMap, workDate]);

  const currentBreakFormManualMinutes = useMemo(() => {
    return computeManualBreakMinutes(breakStartHHMM, breakEndHHMM);
  }, [breakStartHHMM, breakEndHHMM]);

  const dayPreview = useMemo(() => {
    if (!shouldShowEntryComputation) {
      return null;
    }

    const overrideManual =
      breakStartHHMM && breakEndHHMM ? currentBreakFormManualMinutes : 0;

    return computeDayTotals(entries, dayBreakMap, workDate, grossPreviewMinutes, overrideManual);
  }, [
    shouldShowEntryComputation,
    entries,
    dayBreakMap,
    workDate,
    grossPreviewMinutes,
    breakStartHHMM,
    breakEndHHMM,
    currentBreakFormManualMinutes,
  ]);

  useEffect(() => {
    const syncActivity = searchParams.get("syncActivity");
    const syncLocation = searchParams.get("syncLocation");

    const hasSyncValues =
      syncDateParam !== "" ||
      (typeof syncActivity === "string" && syncActivity.trim() !== "") ||
      (typeof syncLocation === "string" && syncLocation.trim() !== "") ||
      sourceTaskId !== "";

    if (!hasSyncValues) {
      return;
    }

    if (syncDateParam) {
      setWorkDate(syncDateParam);
    }

    if (typeof syncActivity === "string" && syncActivity.trim() !== "") {
      setActivity(syncActivity);
    }

    if (typeof syncLocation === "string" && syncLocation.trim() !== "") {
      setLocation(syncLocation);
    }

    setStartTime("");
    setEndTime("");
    setShowSyncToast(true);
  }, [searchParams, sourceTaskId, syncDateParam]);

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      const r = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const j: unknown = await r.json().catch(() => ({}));

      if (!alive) return;

      if (!isMeApiResponse(j) || !j.session) {
        router.replace("/login");
        return;
      }

      if (j.session.role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }

      setLanguage(j.session.language);

      setMe({
        ok: true,
        session: {
          userId: j.session.userId,
          fullName: j.session.fullName,
          role: j.session.role,
          language: j.session.language,
          companyId: j.session.companyId,
          companyName: j.session.companyName,
          companySubdomain: j.session.companySubdomain,
          companyLogoUrl: j.session.companyLogoUrl,
          primaryColor: j.session.primaryColor,
        },
      });
    } catch {
      if (!alive) return;
      router.replace("/login");
      return;
    } finally {
      if (alive) {
        setMeResolved(true);
      }
    }
  })();

  return () => {
    alive = false;
  };
}, [router]);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const r = await fetch("/api/entries", {
        credentials: "include",
      });
      const j = (await r.json()) as unknown;

      const entriesList =
        typeof j === "object" &&
        j !== null &&
        "entries" in j &&
        Array.isArray((j as { entries: unknown }).entries)
          ? (((j as { entries: WorkEntry[] }).entries ?? []) as WorkEntry[])
          : [];

      const dayBreakList =
        typeof j === "object" &&
        j !== null &&
        "dayBreaks" in j &&
        Array.isArray((j as { dayBreaks: unknown }).dayBreaks)
          ? (((j as { dayBreaks: DayBreak[] }).dayBreaks ?? []) as DayBreak[])
          : [];

      setEntries(entriesList);
      setDayBreaks(dayBreakList);
    } finally {
      setLoadingEntries(false);
    }
  }

  async function loadCorrectionRequests() {
    setLoadingCorrectionRequests(true);
    try {
      const r = await fetch("/api/time-entry-correction-requests", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const j = (await r.json()) as unknown;

      const requestsList =
        typeof j === "object" &&
        j !== null &&
        "requests" in j &&
        Array.isArray((j as { requests: unknown }).requests)
          ? ((j as { requests: TimeEntryCorrectionRequest[] }).requests ?? [])
          : [];

      setCorrectionRequests(requestsList);
    } finally {
      setLoadingCorrectionRequests(false);
    }
  }
  const loadSelectedCorrectionStatus = React.useCallback(async (dateYMD: string) => {
    if (!isPastWorkDate(dateYMD)) {
      setSelectedCorrectionStatus(null);
      return;
    }

    setLoadingSelectedCorrectionStatus(true);
    try {
      const params = new URLSearchParams();
      params.set("workDate", dateYMD);

      if (sourceTaskId) {
        params.set("sourceTaskId", sourceTaskId);
      }

      const r = await fetch(
        `/api/time-entry-correction-requests/status?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const j = (await r.json()) as unknown;

      if (!r.ok || !isTimeEntryCorrectionRequestStatusResponse(j)) {
        setSelectedCorrectionStatus(null);
        return;
      }

      setSelectedCorrectionStatus(j);
    } finally {
      setLoadingSelectedCorrectionStatus(false);
    }
  }, [sourceTaskId]);

  useEffect(() => {
    loadEntries();
    loadCorrectionRequests();
  }, []);
  useEffect(() => {
    void loadSelectedCorrectionStatus(workDate);
  }, [workDate, sourceTaskId, loadSelectedCorrectionStatus]);

    useEffect(() => {
    setBreakStartHHMM(selectedDayBreak?.breakStartHHMM ?? "");
    setBreakEndHHMM(selectedDayBreak?.breakEndHHMM ?? "");
    setBreakError(null);
  }, [selectedDayBreak, workDate]);

  async function saveEntry() {
    setError(null);

    if (!activity.trim()) return setError(t("enterActivity"));
    if (!me || !me.ok) return setError(t("loginAgain"));

    setSaving(true);
    try {
      const payload = {
        workDate,
        startTime,
        endTime,
        activity: activity.trim(),
        location: location.trim(),
        travelMinutes: Number(travelMinutes) || 0,
        noteEmployee: noteEmployee.trim(),
        sourceTaskId: sourceTaskId || null,
      };

      const r = await fetch("/api/entries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : t("saveFailed");
        setError(msg);
        return;
      }

      setStartTime("");
      setEndTime("");
      setActivity("");
      setLocation("");
      setTravelMinutes("0");
      setNoteEmployee("");

      await loadEntries();
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setError(t("networkSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/entries?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    await loadEntries();
  }

  function openEditModal(e: WorkEntry) {
    setEditError(null);
    setEdit({
      id: e.id,
      userFullName: e.user?.fullName ?? t("unknown"),
      workDate: toYMD(e.workDate),
      startTime: e.startTime,
      endTime: e.endTime,
      activity: e.activity ?? "",
      location: e.location ?? "",
      travelMinutes: String(e.travelMinutes ?? 0),
      noteEmployee: e.noteEmployee ?? "",
    });
    setEditOpen(true);
  }

  function openNoteModal(e: WorkEntry) {
  setNoteEntry(e);
  setNoteOpen(true);
}

  function openDetailsModal(e: WorkEntry) {
    setDetailsEntry(e);
    setDetailsOpen(true);
  }

  function openBreakInfoModal(dayBreak: DayBreak | null, date: string) {
    setBreakInfoDate(date);
    setBreakInfoManualStart(dayBreak?.breakStartHHMM ?? "");
    setBreakInfoManualEnd(dayBreak?.breakEndHHMM ?? "");
    setBreakInfoManualMinutes(dayBreak?.manualMinutes ?? 0);
    setBreakInfoLegalMinutes(dayBreak?.legalMinutes ?? 0);
    setBreakInfoAutoMinutes(dayBreak?.autoSupplementMinutes ?? 0);
    setBreakInfoEffectiveMinutes(dayBreak?.effectiveMinutes ?? 0);
    setBreakInfoOpen(true);
  }

  async function saveEdit() {
    if (!edit) return;

    setEditError(null);
    if (!edit.activity.trim()) return setEditError(t("enterActivity"));
    if (!edit.workDate || !edit.startTime || !edit.endTime) return setEditError(`${t("date")} / ${t("start")} / ${t("end")} fehlt.`);

    setEditSaving(true);
    try {
      const payload = {
        id: edit.id,
        workDate: edit.workDate,
        startTime: edit.startTime,
        endTime: edit.endTime,
        activity: edit.activity.trim(),
        location: edit.location.trim(),
        travelMinutes: Number(edit.travelMinutes) || 0,
        noteEmployee: edit.noteEmployee.trim(),
      };

      const r = await fetch("/api/entries", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" && j !== null && "error" in j && typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : t("changesSaveFailed");
        setEditError(msg);
        return;
      }

      const updated =
        typeof j === "object" && j !== null && "entry" in j && typeof (j as { entry: unknown }).entry === "object"
          ? ((j as { entry: WorkEntry }).entry as WorkEntry)
          : null;

      if (updated) {
        setEntries((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        await loadEntries();
        await loadCorrectionRequests();
        await loadSelectedCorrectionStatus(edit.workDate);
      }

      setEditOpen(false);
      setEdit(null);
    } catch {
      setEditError(t("networkSaveError"));
    } finally {
      setEditSaving(false);
    }
  }

    async function saveDayBreak() {
    setBreakError(null);

    if ((breakStartHHMM && !breakEndHHMM) || (!breakStartHHMM && breakEndHHMM)) {
      setBreakError(t("saveBreakIncomplete"));
      return;
    }

    setBreakSaving(true);
    try {
      const r = await fetch("/api/day-breaks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDate,
          breakStartHHMM,
          breakEndHHMM,
        }),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : t("saveBreakFailed");
        setBreakError(msg);
        return;
      }
      await loadEntries();
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setBreakError(t("networkBreakSaveError"));
    } finally {
      setBreakSaving(false);
    }
  }
  async function submitCorrectionRequest() {
    setCorrectionError(null);
    setCorrectionSuccess(null);

    if (!canCreateCorrectionRequest) {
      setCorrectionError(t("correctionPastOnly"));
      return;
    }

    if (hasActiveUnlockForSelectedDate) {
      setCorrectionError(t("correctionUnlockAlreadyExists"));
      return;
    }

    if (pendingCorrectionRequestForSelectedDate) {
      setCorrectionError(t("correctionPendingAlreadyExists"));
      return;
    }

    setCorrectionSaving(true);
    try {
      const r = await fetch("/api/time-entry-correction-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: workDate,
          noteEmployee: correctionNote.trim(),
          sourceTaskId: sourceTaskId || null,
        }),
      });

      const j = (await r.json()) as unknown;

      if (!r.ok) {
        const msg =
          typeof j === "object" &&
          j !== null &&
          "error" in j &&
          typeof (j as { error: unknown }).error === "string"
            ? (j as { error: string }).error
            : t("correctionCreateFailed");
        setCorrectionError(msg);
        return;
      }

      setCorrectionSuccess(t("correctionSentSuccess"));
      setCorrectionNote("");
      await loadCorrectionRequests();
      await loadSelectedCorrectionStatus(workDate);
    } catch {
      setCorrectionError(t("networkCorrectionError"));
    } finally {
      setCorrectionSaving(false);
    }
  }

  const groupedEntries = useMemo(() => groupByMonthThenDay(entries), [entries]);

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        entries
          .map((entry) => toYMD(entry.workDate).slice(0, 4))
          .filter((year) => /^\d{4}$/.test(year))
      )
    ).sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));

    return years;
  }, [entries]);

  const filteredGroupedEntries = useMemo(() => {
    if (selectedYear === "ALLE") return groupedEntries;
    return groupedEntries.filter((group) => group.key.startsWith(`${selectedYear}-`));
  }, [groupedEntries, selectedYear]);

  const dayTotalsMap = useMemo(() => buildDayTotalsMap(entries, dayBreakMap), [entries, dayBreakMap]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

    const breakPreviewText = useMemo(() => {
    if (!shouldShowBreakComputation) {
      return {
        rightValue: "",
        detailLines: getLegalBreakHintLines(),
      };
    }

    const selectedBreak = dayBreakMap.get(workDate) ?? null;
    const dayTotals = computeDayTotals(entries, dayBreakMap, workDate, 0, null);

    if (dayTotals.legalBreak === 0) {
      return {
        rightValue: "",
        detailLines: getLegalBreakHintLines(),
      };
    }

    if (!selectedBreak || selectedBreak.manualMinutes <= 0) {
      return {
        rightValue: formatPause(dayTotals.legalBreak),
        detailLines: [
          `Gesetzliche Pause automatisch eingetragen: ${formatPause(dayTotals.legalBreak)}`,
          `Brutto ${formatHM(dayTotals.grossDay)} · Netto ${formatHM(dayTotals.netDay)}`,
        ],
      };
    }

    if (selectedBreak.manualMinutes < dayTotals.legalBreak) {
      return {
        rightValue: formatPause(dayTotals.effectiveBreak),
        detailLines: [
          `Eingetragen: ${formatPause(selectedBreak.manualMinutes)}`,
          `Auto-Zusatz: ${formatPause(dayTotals.autoSupplement)}`,
          `Gesetzlich notwendig: ${formatPause(dayTotals.legalBreak)}`,
        ],
      };
    }

    return {
      rightValue: formatPause(dayTotals.effectiveBreak),
      detailLines: [
        `Eingetragen: ${formatPause(selectedBreak.manualMinutes)}`,
        `Gesetzlich notwendig: ${formatPause(dayTotals.legalBreak)}`,
        `Brutto ${formatHM(dayTotals.grossDay)} · Netto ${formatHM(dayTotals.netDay)}`,
      ],
    };
  }, [shouldShowBreakComputation, dayBreakMap, workDate, entries]);

    useEffect(() => {
    if (selectedYear !== "ALLE") return;
    const currentYear = String(new Date().getFullYear());
    if (availableYears.includes(currentYear)) {
      setSelectedYear(currentYear);
    }
  }, [availableYears, selectedYear]);

  const editPreview = useMemo(() => {
    if (!edit) {
      return {
        grossEntry: 0,
        grossDay: 0,
        effectiveBreak: 0,
        breakAuto: true,
        netDay: 0,
      };
    }

    const grossEntry = minutesBetween(edit.startTime, edit.endTime);
    const entriesWithoutThis = entries.filter((entry) => entry.id !== edit.id);
    const day = computeDayTotals(entriesWithoutThis, dayBreakMap, edit.workDate, grossEntry, null);

    return {
      grossEntry,
      grossDay: day.grossDay,
      effectiveBreak: day.effectiveBreak,
      breakAuto: day.breakAuto,
      netDay: day.netDay,
    };
  }, [edit, entries, dayBreakMap]);

  const meName = me && me.ok && me.session ? me.session.fullName : "";

  const canCreateCorrectionRequest = useMemo(() => {
    return Boolean(me && me.ok && isPastWorkDate(workDate));
  }, [me, workDate]);

  const pendingCorrectionRequestForSelectedDate = useMemo(() => {
    return correctionRequests.find((request) => {
      if (request.status !== "PENDING") return false;
      return request.startDate <= workDate && request.endDate >= workDate;
    }) ?? null;
  }, [correctionRequests, workDate]);

  const hasActiveUnlockForSelectedDate =
    selectedCorrectionStatus?.hasActiveUnlock ?? false;

  const requiresCorrectionRequestForSelectedDate =
    selectedCorrectionStatus?.requiresCorrectionRequest ?? false;

  const currentMissingWorkdaysCount =
    selectedCorrectionStatus?.currentMissingWorkdaysCount ?? 0;

  const graceWorkdaysLimit =
    selectedCorrectionStatus?.graceWorkdaysLimit ?? 5;

  const latestDecisionRequestForSelectedDate =
    selectedCorrectionStatus?.latestDecisionRequest ?? null;

  const shouldShowCorrectionRequestButton = useMemo(() => {
    if (!canCreateCorrectionRequest) return false;
    if (hasAdminTaskBypassForSelectedDate) return false;
    if (!requiresCorrectionRequestForSelectedDate) return false;
    if (hasActiveUnlockForSelectedDate) return false;
    if (pendingCorrectionRequestForSelectedDate) return false;
    return true;
  }, [
    canCreateCorrectionRequest,
    hasAdminTaskBypassForSelectedDate,
    requiresCorrectionRequestForSelectedDate,
    hasActiveUnlockForSelectedDate,
    pendingCorrectionRequestForSelectedDate,
  ]);
  const correctionProgressText = useMemo(() => {
    if (!canCreateCorrectionRequest) return null;
    if (hasAdminTaskBypassForSelectedDate) {
      return "Für diesen Tag ist kein Nachtragsantrag erforderlich, weil du ihn über eine Admin-Aufgabe geöffnet hast.";
    }
    if (hasActiveUnlockForSelectedDate) return null;
    if (pendingCorrectionRequestForSelectedDate) return null;

    if (requiresCorrectionRequestForSelectedDate) {
      return `Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage. Ein Nachtragsantrag ist erforderlich.`;
    }

    return `Ab dem ${graceWorkdaysLimit + 1}. fehlenden Arbeitstag muss ein Nachtragsantrag gestellt werden. Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage bis zur Sperrung.`;
  }, [
    canCreateCorrectionRequest,
    hasAdminTaskBypassForSelectedDate,
    hasActiveUnlockForSelectedDate,
    pendingCorrectionRequestForSelectedDate,
    requiresCorrectionRequestForSelectedDate,
    currentMissingWorkdaysCount,
    graceWorkdaysLimit,
  ]);

  if (!meResolved) {
    return (
      <AppShell activeLabel="#wirkönnendas">
        <div className="card tenant-status-card tenant-status-card-neutral" style={{ padding: 14 }}>
          <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeLabel="#wirkönnendas">

      {/* CREATE */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>＋</span> {t("createEntry")}
        </div>

        {error && (
          <div
            className="card tenant-status-card tenant-status-card-danger"
            style={{ padding: 12, marginBottom: 12 }}
          >
            <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
              {error}
            </span>
          </div>
        )}

        {/* ✅ Name nur anzeigen (automatisch aus Session), kein Input mehr */}
        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("employee")}</div>
          <div
            className="input tenant-readonly-input"
            style={{
              opacity: meName ? 1 : 0.7,
            }}
          >
            {meName || "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            {t("entryAssignedAutomatically")}
          </div>
        </div>

        <div className="row" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">{t("date")}</div>

            <input
              className="input erfassung-date-desktop"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />

            <div className="date-display-input erfassung-date-mobile">
              <div className="date-display-value">{formatDateDE(workDate)}</div>
              <input
                className="date-display-native-input"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                aria-label={t("selectDate")}
              />
            </div>
          </div>
          <div />
        </div>

        {canCreateCorrectionRequest ? (
          <div
            className={`card tenant-status-card ${
              hasActiveUnlockForSelectedDate
                ? "tenant-status-card-success"
                : pendingCorrectionRequestForSelectedDate
                ? "tenant-status-card-info"
                : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                ? "tenant-status-card-danger"
                : "tenant-status-card-warning"
            }`}
            style={{
              padding: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div
                className={
                  hasActiveUnlockForSelectedDate
                    ? "tenant-status-text-success"
                    : pendingCorrectionRequestForSelectedDate
                    ? "tenant-status-text-info"
                    : latestDecisionRequestForSelectedDate?.status === "REJECTED"
                    ? "tenant-status-text-danger"
                    : "tenant-status-text-warning"
                }
                style={{ fontWeight: 800 }}
              >
                {t("selectedPastDay")}
              </div>

              {loadingSelectedCorrectionStatus ? (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {t("statusLoading")}
                </div>
              ) : hasAdminTaskBypassForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Für diesen Tag ist kein Nachtragsantrag erforderlich, weil du ihn über eine Admin-Aufgabe geöffnet hast.
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Du kannst den Eintrag für {formatDateDE(workDate)} direkt erfassen.
                    {selectedCorrectionStatus?.adminTaskBypass?.startDate &&
                    selectedCorrectionStatus?.adminTaskBypass?.endDate &&
                    selectedCorrectionStatus.adminTaskBypass.startDate !==
                      selectedCorrectionStatus.adminTaskBypass.endDate
                      ? ` Der freigegebene Zeitraum reicht von ${formatDateDE(
                          selectedCorrectionStatus.adminTaskBypass.startDate
                        )} bis ${formatDateDE(
                          selectedCorrectionStatus.adminTaskBypass.endDate
                        )}.`
                      : ""}
                  </div>
                </>
              ) : hasActiveUnlockForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Dieser Tag wurde vom Admin für den Nachtrag freigegeben. Du kannst ihn jetzt bearbeiten.
                  </div>

                  {latestDecisionRequestForSelectedDate?.status === "APPROVED" ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Genehmigter Zeitraum:{" "}
                      {formatCorrectionRange(
                        latestDecisionRequestForSelectedDate.startDate,
                        latestDecisionRequestForSelectedDate.endDate
                      )}
                    </div>
                  ) : null}
                </>
              ) : pendingCorrectionRequestForSelectedDate ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Für diesen Tag existiert bereits ein offener Nachtragsantrag.
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Offener Zeitraum:{" "}
                    {formatCorrectionRange(
                      pendingCorrectionRequestForSelectedDate.startDate,
                      pendingCorrectionRequestForSelectedDate.endDate
                    )}
                  </div>
                </>
              ) : latestDecisionRequestForSelectedDate?.status === "REJECTED" ? (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    Der letzte Nachtragsantrag für diesen Zeitraum wurde abgelehnt.
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Letzte Entscheidung für:{" "}
                    {formatCorrectionRange(
                      latestDecisionRequestForSelectedDate.startDate,
                      latestDecisionRequestForSelectedDate.endDate
                    )}
                  </div>

                  {shouldShowCorrectionRequestButton ? (
                    <div>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setCorrectionError(null);
                          setCorrectionSuccess(null);
                          setCorrectionOpen(true);
                        }}
                      >
                        {t("sendNewCorrectionRequest")}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>
                    {requiresCorrectionRequestForSelectedDate
                      ? "Für den ausgewählten Tag ist jetzt ein Nachtragsantrag erforderlich."
                      : "Für den ausgewählten Tag ist aktuell noch kein Nachtragsantrag erforderlich."}
                  </div>

                  {correctionProgressText ? (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {correctionProgressText}
                    </div>
                  ) : null}

                  {shouldShowCorrectionRequestButton ? (
                    <div>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          setCorrectionError(null);
                          setCorrectionSuccess(null);
                          setCorrectionOpen(true);
                        }}
                      >
                        {t("sendCorrectionRequest")}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="row erfassung-time-row" style={{ marginBottom: 12 }}>
          <div className="erfassung-time-field">
            <div className="label">{t("start")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="erfassung-time-field">
            <div className="label">{t("end")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="tenant-computation-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="tenant-computation-head">
              <div style={{ color: "var(--muted)" }}>{t("workTimeCalculated")}</div>
              <div className="tenant-computation-value">
                {dayPreview ? formatHM(dayPreview.netDay) : ""}
              </div>
            </div>

            {!dayPreview ? (
              <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
                {getLegalBreakHintLines().map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : dayPreview.legalBreak > 0 ? (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                <div>{t("gross")} {formatHM(dayPreview.grossDay)} · {t("legalBreak")} {formatPause(dayPreview.legalBreak)} · {t("net")} {formatHM(dayPreview.netDay)}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
                <div>{t("gross")} {formatHM(dayPreview.grossDay)} · {t("net")} {formatHM(dayPreview.netDay)}</div>
                {getLegalBreakHintLines().map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("activityPerformed")}</div>
          <textarea
            className="textarea"
            placeholder={t("activityPlaceholder")}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("location")}</div>
          <input
            className="input"
            placeholder={t("locationPlaceholder")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("noteForAdmin")}</div>
          <textarea
            className="textarea"
            placeholder={t("notePlaceholder")}
            value={noteEmployee}
            onChange={(e) => setNoteEmployee(e.target.value)}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            {t("noteOptionalVisibleToAdmin")}
          </div>
        </div>

        <div className="label" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">{t("travelMinutes")}</div>
            <input
              className="input"
              inputMode="numeric"
              value={travelMinutes}
              onChange={(e) => setTravelMinutes(e.target.value)}
            />
          </div>
        </div>


        <div className="erfassung-dual-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              setWorkDate(syncDateParam || toIsoDateLocal(new Date()));
              setStartTime("");
              setEndTime("");
              setActivity("");
              setLocation("");
              setTravelMinutes("0");
              setNoteEmployee("");
              setError(null);
            }}
          >
            {t("cancel")}
          </button>

          <button
            className="btn btn-accent"
            type="button"
            onClick={saveEntry}
            disabled={saving}
          >
            {saving ? t("saving") : t("saveEntry")}
          </button>
        </div>
      </div>

            <div className="card card-olive" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: "var(--accent)" }}>⏸</span> {t("breakCapture")}
        </div>

        {breakError ? (
          <div className="card" style={{ padding: 12, borderColor: "rgba(224, 75, 69, 0.35)", marginBottom: 12 }}>
            <span style={{ color: "rgba(224, 75, 69, 0.95)", fontWeight: 700 }}>{breakError}</span>
          </div>
        ) : null}

        <div style={{ marginBottom: 12 }}>
          <div className="label">{t("date")}</div>
          <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
            {formatDateDE(workDate)}
          </div>
        </div>

        <div className="row erfassung-time-row" style={{ marginBottom: 12 }}>
          <div className="erfassung-time-field">
            <div className="label">{t("breakFrom")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={breakStartHHMM}
              onChange={(e) => setBreakStartHHMM(e.target.value)}
            />
          </div>
          <div className="erfassung-time-field">
            <div className="label">{t("breakTo")}</div>
            <input
              className="input erfassung-time-input"
              type="time"
              value={breakEndHHMM}
              onChange={(e) => setBreakEndHHMM(e.target.value)}
            />
          </div>
        </div>

        <div className="tenant-computation-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div className="tenant-computation-head">
              <div style={{ color: "var(--muted)" }}>{t("breakCalculation")}</div>
              <div className="tenant-computation-value">
                {breakPreviewText.rightValue}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)", display: "grid", gap: 4 }}>
              {breakPreviewText.detailLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          {t("breakRuleInfo")}
        </div>

        <div className="erfassung-dual-actions">
          <button
            className="btn"
            type="button"
            onClick={() => {
              setBreakStartHHMM("");
              setBreakEndHHMM("");
              setBreakError(null);
            }}
          >
            {t("reset")}
          </button>

          <button
            className="btn btn-accent"
            type="button"
            onClick={saveDayBreak}
            disabled={breakSaving}
          >
            {breakSaving ? t("saving") : t("saveBreak")}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="card" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div className="section-title" style={{ marginBottom: 0 }}>
            {t("allEntries")}
          </div>

          <div style={{ minWidth: 160 }}>
            <div className="label">{t("year")}</div>
            <select
              className="input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALLE">{t("allYears")}</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {loadingEntries ? (
            <div
              className="card"
              style={{
                padding: 14,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              {t("loadingEntries")}
            </div>
          ) : null}

          {!loadingEntries && filteredGroupedEntries.length === 0 ? (
            <div
              className="card"
              style={{
                padding: 14,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >{t("noEntriesForYear")}
            </div>
          ) : null}
          {filteredGroupedEntries.map((m) => (
            <details
              key={m.key}
              open={m.key === currentMonthKey}
              className="tenant-list-shell"
            >
              <summary
                style={{
                  cursor: "pointer",
                  listStyle: "none",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  userSelect: "none",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {m.label}
                  <span style={{ opacity: 0.7, fontWeight: 600, marginLeft: 8 }}>
                    ({m.days.reduce((s, d) => s + d.entries.length, 0)})
                  </span>
                </div>

                <div style={{ opacity: 0.7, fontSize: 12 }}>{t("expandCollapse")}</div>
              </summary>

              <div style={{ padding: "0 0 12px 0", display: "grid", gap: 10 }}>
                {m.days.map((d) => {
                  const totals = dayTotalsMap.get(d.date);
                  const pauseMin = totals ? totals.effectiveBreak : 0;
                  const netDay = totals ? totals.netDay : 0;

                  return (
                    <details
                      key={`${m.key}-${d.date}`}
                      className="tenant-list-shell-inner"
                      style={{
                        margin: "0 12px",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          listStyle: "none",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          userSelect: "none",
                        }}
                      >
                        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                          <div style={{ fontWeight: 900 }}>
                            {formatDateDayLineDE(d.date)}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                              fontSize: 12,
                              color: "var(--muted)",
                            }}
                          >
                            <span>
                              {d.entries.length} {d.entries.length === 1 ? t("entry") : t("entries")}
                            </span>

                            <span style={{ opacity: 0.5 }}>·</span>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                openBreakInfoModal(dayBreakMap.get(d.date) ?? null, d.date);
                              }}
                              style={{
                                padding: 0,
                                border: "none",
                                background: "transparent",
                                color: "rgba(255,255,255,0.92)",
                                cursor: "pointer",
                                fontWeight: 900,
                              }}
                              title={t("showBreakDetails")}
                            >
                              {formatPause(pauseMin)} {t("break")}
                            </button>
                          </div>
                        </div>

                        <div style={{ fontWeight: 900, color: "var(--accent)", flexShrink: 0 }}>
                          {formatHM(netDay)}
                        </div>
                      </summary>

                      <div style={{ display: "grid", gap: 12, padding: "10px 0 12px 0" }}>
                        {d.entries.map((e) => {
                          const hasTravel = (e.travelMinutes ?? 0) > 0;

                          return (
                            <div
                              key={e.id}
                              className="tenant-entry-row"
                            >
                              <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                                <div style={{ fontWeight: 1100, color: "var(--accent)" }}>
                                  {formatHM(e.workMinutes ?? 0)}
                                </div>

                                <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}>
                                  {e.startTime}–{e.endTime} {t("oClock")}
                                </div>

                                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                  {e.activity?.trim() ? e.activity : t("noActivityStored")}
                                </div>

                                <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                  {e.location?.trim() ? e.location : t("noLocationStored")}
                                </div>

                                {hasTravel ? (
                                  <div style={{ color: "var(--muted-2)", fontSize: 12 }}>
                                    {t("travelTime")} {formatMinutesCompact(e.travelMinutes)}
                                  </div>
                                ) : null}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  justifyContent: "flex-end",
                                  alignSelf: "flex-start",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => openDetailsModal(e)}
                                  title={t("showDetails")}
                                  className="tenant-icon-button tenant-icon-button-success"
                                >
                                  ℹ️ {t("details")}
                                </button>

                                {e.noteEmployee.trim() ? (
                                  <button
                                    type="button"
                                    onClick={() => openNoteModal(e)}
                                    title={t("showNote")}
                                    className="tenant-icon-button tenant-icon-button-info"
                                  >
                                    📝 {t("note")}
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => openEditModal(e)}
                                  title={t("edit")}
                                  className="tenant-icon-button tenant-icon-button-neutral"
                                >
                                  ✏️
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteEntry(e.id)}
                                  title={t("delete")}
                                  className="tenant-icon-button tenant-icon-button-danger"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>

            <Modal
        open={detailsOpen}
        title={t("workTimeDetails")}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsEntry(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setDetailsOpen(false);
                setDetailsEntry(null);
              }}
            >
              {t("close")}
            </button>
          </div>
        }
      >
        {!detailsEntry ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">Datum & Zeit</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatDateDE(toYMD(detailsEntry.workDate))} · {detailsEntry.startTime}–{detailsEntry.endTime}
              </div>
            </div>

            <div>
              <div className="label">Netto-Arbeitszeit</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatHM(detailsEntry.workMinutes ?? 0)}
              </div>
            </div>

            <div>
              <div className="label">Baustelle / Adresse</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {detailsEntry.location?.trim() ? detailsEntry.location : "—"}
              </div>
            </div>

            <div>
              <div className="label">Ausgeführte Tätigkeit</div>
              <div
                className="input tenant-note-surface"
              >
                {detailsEntry.activity?.trim() ? detailsEntry.activity : "—"}
              </div>
            </div>

            <div>
              <div className="label">Fahrtzeit</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatMinutesCompact(detailsEntry.travelMinutes ?? 0)}
              </div>
            </div>
          </div>
        )}
      </Modal>

            <Modal
        open={breakInfoOpen}
        title={t("breakDetails")}
        onClose={() => setBreakInfoOpen(false)}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => setBreakInfoOpen(false)}
            >
              {t("close")}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div className="label">{t("date")}</div>            
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatDateDE(breakInfoDate)}
            </div>
          </div>

          <div>
            <div className="label">Manuell eingetragene Pause</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {breakInfoManualStart && breakInfoManualEnd
                ? `${breakInfoManualStart}–${breakInfoManualEnd} · ${formatMinutesCompact(breakInfoManualMinutes)}`
                : breakInfoManualMinutes > 0
                ? formatMinutesCompact(breakInfoManualMinutes)
                : "Keine manuelle Pause eingetragen"}
            </div>
          </div>

          <div>
            <div className="label">Gesetzlich erforderlich</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatMinutesCompact(breakInfoLegalMinutes)}
            </div>
          </div>

          <div>
            <div className="label">Automatisch ergänzt</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {breakInfoAutoMinutes > 0 ? formatMinutesCompact(breakInfoAutoMinutes) : "Keine automatische Ergänzung"}
            </div>
          </div>

          <div>
            <div className="label">Wirksame Pause gesamt</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatMinutesCompact(breakInfoEffectiveMinutes)}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        title="Notiz für Admin"
        onClose={() => {
          setNoteOpen(false);
          setNoteEntry(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setNoteOpen(false);
                setNoteEntry(null);
              }}
            >
              {t("close")}
            </button>
          </div>
        }
      >
        {!noteEntry ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">{t("date")}</div>             
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {formatDateDE(toYMD(noteEntry.workDate))} · {noteEntry.startTime}–{noteEntry.endTime}
              </div>
            </div>

            <div>
              <div className="label">Notiz</div>
              <div
                className="input tenant-note-surface-tall"
              >
                {noteEntry.noteEmployee.trim() || "Keine Notiz vorhanden."}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={correctionOpen}
        title={t("sendCorrectionRequest")}
        onClose={() => {
          setCorrectionOpen(false);
          setCorrectionError(null);
          setCorrectionSuccess(null);
        }}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setCorrectionOpen(false);
                setCorrectionError(null);
                setCorrectionSuccess(null);
              }}
            >
              {t("close")}
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={submitCorrectionRequest}
              disabled={correctionSaving}
            >
              {correctionSaving ? "Sendet..." : "Antrag senden"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          {correctionError ? (
        <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 12 }}>
          <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
                {correctionError}
              </span>
            </div>
          ) : null}

          {correctionSuccess ? (
          <div className="card tenant-status-card tenant-status-card-success" style={{ padding: 12 }}>
            <span className="tenant-status-text-success" style={{ fontWeight: 700 }}>
                {correctionSuccess}
              </span>
            </div>
          ) : null}

          <div>
            <div className="label">Ausgewähltes Datum</div>
            <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
              {formatDateDE(workDate)}
            </div>
          </div>

          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Der Server ermittelt automatisch den ältesten fehlenden Arbeitstag bis zu diesem Datum und erstellt daraus den passenden Nachtragszeitraum.
          </div>

          <div>
            <div className="label">{t("noteForAdmin")}</div>
            <textarea
              className="textarea"
              placeholder="Optional: kurze Begründung oder Hinweis"
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
            />
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {loadingSelectedCorrectionStatus || loadingCorrectionRequests
              ? "Bestehende Nachtragsinformationen werden geladen..."
              : hasAdminTaskBypassForSelectedDate
              ? "Für diesen Tag ist kein Nachtragsantrag erforderlich, weil du ihn über eine Admin-Aufgabe geöffnet hast."
              : hasActiveUnlockForSelectedDate
              ? "Für den ausgewählten Tag existiert bereits eine aktive Freigabe. Ein neuer Antrag ist aktuell nicht nötig."
              : pendingCorrectionRequestForSelectedDate
              ? `Hinweis: Für ${formatCorrectionRange(
                  pendingCorrectionRequestForSelectedDate.startDate,
                  pendingCorrectionRequestForSelectedDate.endDate
                )} existiert bereits ein offener Antrag.`
              : requiresCorrectionRequestForSelectedDate
              ? `Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage. Ein Nachtragsantrag ist erforderlich.`
              : `Aktuell: ${currentMissingWorkdaysCount}/${graceWorkdaysLimit} fehlende Arbeitstage bis zur Sperrung.`}
          </div>
        </div>
      </Modal>

      {/* ✅ EDIT MODAL */}
      <Modal
        open={editOpen}
        title={t("editEntry")}
        onClose={() => {
          setEditOpen(false);
          setEdit(null);
          setEditError(null);
        }}
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEdit(null);
                setEditError(null);
              }}
            >
              {t("cancel")}
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={saveEdit}
              disabled={editSaving}
            >
              {editSaving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </div>
        }
      >
        {!edit ? null : (
          <div style={{ display: "grid", gap: 12 }}>
            {editError ? (
          <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 12 }}>
            <span className="tenant-status-text-danger" style={{ fontWeight: 700 }}>
              {editError}
            </span>
          </div>
        ) : null}

            <div>
              <div className="label">Mitarbeiter</div>
              <div className="input" style={{ display: "flex", alignItems: "center", opacity: 0.85 }}>
                {edit.userFullName}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Zuordnung wird serverseitig automatisch verwaltet.
              </div>
            </div>

            <div className="modal-grid-1">
              <div className="modal-field">
                <div className="label">{t("date")}</div>                
                <input
                  className="input modal-date-input"
                  type="date"
                  value={edit.workDate}
                  onChange={(e) => setEdit((p) => (p ? { ...p, workDate: e.target.value } : p))}
                />
              </div>
            </div>

            <div
              className="modal-grid-2-compact"
              style={{
                width: "100%",
                minWidth: 0,
              }}
            >
              <div
                className="modal-field"
                style={{
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <div className="label">{t("start")}</div>
                <input
                  className="input"
                  type="time"
                  value={edit.startTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, startTime: e.target.value } : p))}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                className="modal-field"
                style={{
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <div className="label">{t("end")}</div>
                <input
                  className="input"
                  type="time"
                  value={edit.endTime}
                  onChange={(e) => setEdit((p) => (p ? { ...p, endTime: e.target.value } : p))}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div className="tenant-computation-card">
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ color: "var(--muted)" }}>{t("workTimeCalculated")}</div>
                  <div style={{ fontWeight: 900, color: "var(--accent)" }}>{formatHM(editPreview.netDay)}</div>
                </div>
                <div style={{ marginTop: 2, fontSize: 12, color: "var(--muted)" }}>
                  Tag: Brutto {formatHM(editPreview.grossDay)} · Wirksame Pause {formatPause(editPreview.effectiveBreak)} · Netto {formatHM(editPreview.netDay)}
                </div>
              </div>
            </div>

            <div>
              <div className="label">Ausgeführte Tätigkeit</div>
              <textarea
                className="textarea"
                value={edit.activity}
                onChange={(e) => setEdit((p) => (p ? { ...p, activity: e.target.value } : p))}
              />
            </div>

            <div>
              <div className="label">Einsatzort</div>
              <input
                className="input"
                value={edit.location}
                onChange={(e) => setEdit((p) => (p ? { ...p, location: e.target.value } : p))}
              />
            </div>

            <div>
              <div className="label">{t("noteForAdmin")}</div>
              <textarea
                className="textarea"
                value={edit.noteEmployee}
                onChange={(e) => setEdit((p) => (p ? { ...p, noteEmployee: e.target.value } : p))}
                placeholder={t("notePlaceholder")}
              />
            </div>

            <div className="modal-grid-1">
              <div className="modal-field">
                <div className="label">{t("travelMinutes")}</div>
                <input
                  className="input"
                  inputMode="numeric"
                  value={edit.travelMinutes}
                  onChange={(e) => setEdit((p) => (p ? { ...p, travelMinutes: e.target.value } : p))}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
      {showSyncToast && (
        <Toast message={syncToastMessage} />
      )}
    </AppShell>
  );
}