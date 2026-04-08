"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import {
  CalendarDays,
  Sparkles,
  Crown,
  Trees,
  Briefcase,
  Users,
  Flower2,
  Sun,
  PartyPopper,
} from "lucide-react";

type CalendarDay = {
  date: string;
  hasWork: boolean;
  hasVacation: boolean;
  hasSick: boolean;
  hasPlan: boolean;
  planPreview: string | null;
  hasHoliday: boolean;
  holidayName: string | null;
};

type CalendarResponse = { ok: true; days: CalendarDay[] } | { ok: false; error: string };

type AbsenceType = "VACATION" | "SICK";
type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";
type AbsenceCompensation = "PAID" | "UNPAID";

type AbsenceDTO = {
  id: string;
  absenceDate: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
  user: { id: string; fullName: string };
};

type PlanEntry = {
  id: string;
  userId: string;
  workDate: string;
  startHHMM: string;
  endHHMM: string;
  activity: string;
  location: string;
  travelMinutes: number;
  noteEmployee?: string | null;
  user?: {
    id: string;
    fullName: string;
  } | null;
};

type AbsenceRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type AbsenceRequestDTO = {
  id: string;
  startDate: string;
  endDate: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  noteEmployee: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  user: {
    id: string;
    fullName: string;
  };
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
};

type AbsenceRequestBlock = {
  id: string;
  type: AbsenceType;
  dayPortion: AbsenceDayPortion;
  status: AbsenceRequestStatus;
  compensation: AbsenceCompensation;
  paidVacationUnits: number;
  unpaidVacationUnits: number;
  autoUnpaidBecauseNoBalance: boolean;
  compensationLockedBySystem: boolean;
  start: string;
  end: string;
  noteEmployee: string;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  decidedBy: {
    id: string;
    fullName: string;
  } | null;
};

type AbsenceRequestsResponseParsed = {
  requests: AbsenceRequestDTO[];
  remainingPaidVacationDaysForMonth: number;
};

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

type CalendarEventDTO = {
  id: string;
  date: string;
  startHHMM: string;
  endHHMM: string;
  title: string;
  location: string | null;
  notes: string | null;
};

type EventCategory = "KUNDE" | "BAUSTELLE" | "INTERN" | "PRIVAT";
type AdminApptMode = "create-global" | "create-from-day" | "edit";
type CalendarViewMode = "MONTH" | "WEEK";

type KalenderTextKey =
  | "unexpectedResponse"
  | "statusOpen"
  | "statusApproved"
  | "statusRejected"
  | "paid"
  | "unpaid"
  | "daysPaidDaysUnpaid"
  | "ofWhichPaidUnpaid"
  | "vacationRequestHalfDay"
  | "vacationRequest"
  | "sicknessRequest"
  | "customer"
  | "site"
  | "internal"
  | "private"
  | "today"
  | "month"
  | "week"
  | "myAdminAppointments"
  | "employeeReadonlyCalendarHint"
  | "connectGoogleCalendar"
  | "appointments"
  | "holiday"
  | "vacation"
  | "sick"
  | "noEntries"
  | "loadingCalendar"
  | "work"
  | "newAppointment"
  | "day"
  | "loadingAppointments"
  | "noAppointmentsForDay"
  | "edit"
  | "delete"
  | "editAppointment"
  | "enterAppointment"
  | "cancel"
  | "date"
  | "start"
  | "end"
  | "categoryUiOnly"
  | "title"
  | "titlePlaceholder"
  | "locationOptional"
  | "locationPlaceholder"
  | "noteOptional"
  | "notePlaceholder"
  | "saving"
  | "saveChanges"
  | "save"
  | "viewingEmployeeCalendar"
  | "viewingEmployeeCalendarHint"
  | "employeeSchedule"
  | "loadingPlan"
  | "noScheduleForDay"
  | "noLocationGiven"
  | "travelMinutes"
  | "dayStatus"
  | "scheduleExists"
  | "paidVacation"
  | "noEntriesForDay"
  | "yourSchedule"
  | "syncToEntry"
  | "documents"
  | "syncPlanHint"
  | "publicHoliday"
  | "confirmedAbsence"
  | "noConfirmedAbsence"
  | "alreadyConfirmedRegistered"
  | "compensation"
  | "myRequests"
  | "noRequestForDay"
  | "status"
  | "scope"
  | "total"
  | "processedBy"
  | "details"
  | "requestDetails"
  | "requestAbsence"
  | "wholeDayOnlyForSick"
  | "halfDaysOnlyVacation"
  | "halfDaySingleDateOnly"
  | "vacationNoWeekdays"
  | "sickCannotBeUnpaid"
  | "requestCouldNotBeSaved"
  | "networkSaveError"
  | "pleaseSelectStartEnd"
  | "endBeforeStart"
  | "holidayMarked"
  | "adminHolidayMarked"
  | "startNewRequest"
  | "absenceTypeVacation"
  | "absenceTypeSick"
  | "scopeLabel"
  | "scopeHint"
  | "fullVacationDay"
  | "halfVacationDay"
  | "compensationLabel"
  | "compensationLockedHint"
  | "compensationFlexibleHint"
  | "noteToAdmin"
  | "requestNotePlaceholder"
  | "close"
  | "newRequest"
  | "sendRequest"
  | "calendarLoadingFallback";

const KALENDER_DICTIONARY: Record<KalenderTextKey, Record<AppUiLanguage, string>> = {
  unexpectedResponse: {
    DE: "Unerwartete Antwort.",
    EN: "Unexpected response.",
    IT: "Risposta inattesa.",
    TR: "Beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur.",
    KU: "Bersiva neçaverêkirî.",
  },
  statusOpen: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "Hapur",
    KU: "Vekirî",
  },
  statusApproved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvata",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
  },
  statusRejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutata",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
  },
  paid: {
    DE: "Bezahlt",
    EN: "Paid",
    IT: "Pagato",
    TR: "Ücretli",
    SQ: "I paguar",
    KU: "Bi mûçe",
  },
  unpaid: {
    DE: "Unbezahlt",
    EN: "Unpaid",
    IT: "Non retribuito",
    TR: "Ücretsiz",
    SQ: "I papaguar",
    KU: "Bê mûçe",
  },
  daysPaidDaysUnpaid: {
    DE: "{paid} Tage bezahlt · {unpaid} Tage unbezahlt",
    EN: "{paid} days paid · {unpaid} days unpaid",
    IT: "{paid} giorni pagati · {unpaid} giorni non retribuiti",
    TR: "{paid} gün ücretli · {unpaid} gün ücretsiz",
    SQ: "{paid} ditë të paguara · {unpaid} ditë të papaguara",
    KU: "{paid} roj bi mûçe · {unpaid} roj bê mûçe",
  },
  ofWhichPaidUnpaid: {
    DE: "Davon {paid} Tage bezahlt und {unpaid} Tage unbezahlt.",
    EN: "Of which {paid} days paid and {unpaid} days unpaid.",
    IT: "Di cui {paid} giorni pagati e {unpaid} giorni non retribuiti.",
    TR: "Bunun {paid} günü ücretli ve {unpaid} günü ücretsiz.",
    SQ: "Prej tyre {paid} ditë të paguara dhe {unpaid} ditë të papaguara.",
    KU: "Ji wan {paid} roj bi mûçe û {unpaid} roj bê mûçe ne.",
  },
  vacationRequestHalfDay: {
    DE: "🌴 Urlaubsantrag (halber Tag · {date})",
    EN: "🌴 Vacation request (half day · {date})",
    IT: "🌴 Richiesta ferie (mezza giornata · {date})",
    TR: "🌴 İzin talebi (yarım gün · {date})",
    SQ: "🌴 Kërkesë pushimi (gjysmë dite · {date})",
    KU: "🌴 Daxwaza bêhnvedanê (nîv roj · {date})",
  },
  vacationRequest: {
    DE: "Urlaubsantrag",
    EN: "Vacation request",
    IT: "Richiesta ferie",
    TR: "İzin talebi",
    SQ: "Kërkesë pushimi",
    KU: "Daxwaza bêhnvedanê",
  },
  sicknessRequest: {
    DE: "Krankheitsantrag",
    EN: "Sickness request",
    IT: "Richiesta malattia",
    TR: "Hastalık talebi",
    SQ: "Kërkesë sëmundjeje",
    KU: "Daxwaza nexweşiyê",
  },
  customer: {
    DE: "Kunde",
    EN: "Customer",
    IT: "Cliente",
    TR: "Müşteri",
    SQ: "Klient",
    KU: "Müşterî",
  },
  site: {
    DE: "Baustelle",
    EN: "Site",
    IT: "Cantiere",
    TR: "Şantiye",
    SQ: "Kantier",
    KU: "Şantiye",
  },
  internal: {
    DE: "Intern",
    EN: "Internal",
    IT: "Interno",
    TR: "Dahili",
    SQ: "I brendshëm",
    KU: "Navxweyî",
  },
  private: {
    DE: "Privat",
    EN: "Private",
    IT: "Privato",
    TR: "Özel",
    SQ: "Privat",
    KU: "Taybet",
  },
  today: {
    DE: "Heute",
    EN: "Today",
    IT: "Oggi",
    TR: "Bugün",
    SQ: "Sot",
    KU: "Îro",
  },
  month: {
    DE: "Monat",
    EN: "Month",
    IT: "Mese",
    TR: "Ay",
    SQ: "Muaji",
    KU: "Meh",
  },
  week: {
    DE: "Woche",
    EN: "Week",
    IT: "Settimana",
    TR: "Hafta",
    SQ: "Java",
    KU: "Hefte",
  },
  myAdminAppointments: {
    DE: "Meine Admin-Termine",
    EN: "My admin appointments",
    IT: "I miei appuntamenti admin",
    TR: "Yönetici randevularım",
    SQ: "Takimet e mia si admin",
    KU: "Hevdîtinên min yên admin",
  },
  employeeReadonlyCalendarHint: {
    DE: "Mitarbeiteransicht (read-only): Kalender zeigt Plan/Urlaub/Krank des Mitarbeiters.",
    EN: "Employee view (read-only): calendar shows the employee's schedule/vacation/sick days.",
    IT: "Vista dipendente (sola lettura): il calendario mostra piano/ferie/malattia del dipendente.",
    TR: "Çalışan görünümü (salt okunur): takvim çalışanın planını/iznini/hastalığını gösterir.",
    SQ: "Pamja e punonjësit (vetëm lexim): kalendari tregon planin/pushimin/sëmundjen e punonjësit.",
    KU: "Dîtina karmend (tenê-xwendin): salname plana/bêhnvedana/nexweşiya karmend nîşan dide.",
  },
  connectGoogleCalendar: {
    DE: "Google Kalender verbinden",
    EN: "Connect Google Calendar",
    IT: "Collega Google Calendar",
    TR: "Google Takvim bağla",
    SQ: "Lidhu me Google Calendar",
    KU: "Google Calendar girêde",
  },
  appointments: {
    DE: "Termine",
    EN: "Appointments",
    IT: "Appuntamenti",
    TR: "Randevular",
    SQ: "Takime",
    KU: "Hevdîtin",
  },
  holiday: {
    DE: "Feiertag",
    EN: "Holiday",
    IT: "Festività",
    TR: "Resmî tatil",
    SQ: "Festë zyrtare",
    KU: "Cejna fermî",
  },
  vacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Bêhnvedan",
  },
  sick: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malattia",
    TR: "Hasta",
    SQ: "I sëmurë",
    KU: "Nexweş",
  },
  noEntries: {
    DE: "Keine Einträge",
    EN: "No entries",
    IT: "Nessuna voce",
    TR: "Kayıt yok",
    SQ: "Nuk ka regjistrime",
    KU: "Tomar tune ne",
  },
  loadingCalendar: {
    DE: "Lade Kalender...",
    EN: "Loading calendar...",
    IT: "Caricamento calendario...",
    TR: "Takvim yükleniyor...",
    SQ: "Kalendari po ngarkohet...",
    KU: "Salname tê barkirin...",
  },
  work: {
    DE: "Arbeit",
    EN: "Work",
    IT: "Lavoro",
    TR: "İş",
    SQ: "Punë",
    KU: "Kar",
  },
  newAppointment: {
    DE: "Neuer Termin",
    EN: "New appointment",
    IT: "Nuovo appuntamento",
    TR: "Yeni randevu",
    SQ: "Takim i ri",
    KU: "Hevdîtina nû",
  },
  day: {
    DE: "Tag",
    EN: "Day",
    IT: "Giorno",
    TR: "Gün",
    SQ: "Ditë",
    KU: "Roj",
  },
  loadingAppointments: {
    DE: "Lädt Termine...",
    EN: "Loading appointments...",
    IT: "Caricamento appuntamenti...",
    TR: "Randevular yükleniyor...",
    SQ: "Takimet po ngarkohen...",
    KU: "Hevdîtin têne barkirin...",
  },
  noAppointmentsForDay: {
    DE: "Keine Termine für diesen Tag.",
    EN: "No appointments for this day.",
    IT: "Nessun appuntamento per questo giorno.",
    TR: "Bu gün için randevu yok.",
    SQ: "Nuk ka takime për këtë ditë.",
    KU: "Ji bo vê rojê hevdîtin tune ne.",
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
  editAppointment: {
    DE: "Termin bearbeiten",
    EN: "Edit appointment",
    IT: "Modifica appuntamento",
    TR: "Randevuyu düzenle",
    SQ: "Ndrysho takimin",
    KU: "Hevdîtinê sererast bike",
  },
  enterAppointment: {
    DE: "Termin eintragen",
    EN: "Create appointment",
    IT: "Inserisci appuntamento",
    TR: "Randevu gir",
    SQ: "Shto takim",
    KU: "Hevdîtinê tomar bike",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    KU: "Betal bike",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
  },
  start: {
    DE: "Start",
    EN: "Start",
    IT: "Inizio",
    TR: "Başlangıç",
    SQ: "Fillimi",
    KU: "Destpêk",
  },
  end: {
    DE: "Ende",
    EN: "End",
    IT: "Fine",
    TR: "Bitiş",
    SQ: "Fundi",
    KU: "Dawî",
  },
  categoryUiOnly: {
    DE: "Kategorie (UI-only)",
    EN: "Category (UI-only)",
    IT: "Categoria (solo UI)",
    TR: "Kategori (yalnızca arayüz)",
    SQ: "Kategoria (vetëm UI)",
    KU: "Kategorî (tenê UI)",
  },
  title: {
    DE: "Titel",
    EN: "Title",
    IT: "Titolo",
    TR: "Başlık",
    SQ: "Titulli",
    KU: "Sernav",
  },
  titlePlaceholder: {
    DE: "z. B. Kundentermin",
    EN: "e.g. customer appointment",
    IT: "es. appuntamento cliente",
    TR: "örn. müşteri randevusu",
    SQ: "p.sh. takim me klientin",
    KU: "mînak: hevdîtina müşterî",
  },
  locationOptional: {
    DE: "Ort (optional)",
    EN: "Location (optional)",
    IT: "Luogo (opzionale)",
    TR: "Yer (isteğe bağlı)",
    SQ: "Vendi (opsionale)",
    KU: "Cih (vebijarkî)",
  },
  locationPlaceholder: {
    DE: "z. B. Baustelle / Adresse",
    EN: "e.g. site / address",
    IT: "es. cantiere / indirizzo",
    TR: "örn. şantiye / adres",
    SQ: "p.sh. kantier / adresë",
    KU: "mînak: şantiye / navnîşan",
  },
  noteOptional: {
    DE: "Notiz (optional)",
    EN: "Note (optional)",
    IT: "Nota (opzionale)",
    TR: "Not (isteğe bağlı)",
    SQ: "Shënim (opsionale)",
    KU: "Nîşe (vebijarkî)",
  },
  notePlaceholder: {
    DE: "z. B. Ansprechpartner, Material, …",
    EN: "e.g. contact person, material, ...",
    IT: "es. referente, materiale, ...",
    TR: "örn. ilgili kişi, malzeme, ...",
    SQ: "p.sh. person kontakti, material, ...",
    KU: "mînak: kesê têkiliyê, materyal, ...",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guherînan tomar bike",
  },
  save: {
    DE: "Eintragen",
    EN: "Save",
    IT: "Salva",
    TR: "Kaydet",
    SQ: "Ruaj",
    KU: "Tomar bike",
  },
  viewingEmployeeCalendar: {
    DE: "Du siehst gerade den Kalender eines Mitarbeiters.",
    EN: "You are currently viewing an employee's calendar.",
    IT: "Stai visualizzando il calendario di un dipendente.",
    TR: "Şu anda bir çalışanın takvimini görüntülüyorsunuz.",
    SQ: "Po shihni kalendarin e një punonjësi.",
    KU: "Tu niha salnameya karmendekî dibînî.",
  },
  viewingEmployeeCalendarHint: {
    DE: "Bearbeitung und eigene Admin-Termine sind in dieser Ansicht deaktiviert.",
    EN: "Editing and your own admin appointments are disabled in this view.",
    IT: "La modifica e i tuoi appuntamenti admin sono disattivati in questa vista.",
    TR: "Bu görünümde düzenleme ve kendi yönetici randevularınız devre dışıdır.",
    SQ: "Ndryshimi dhe takimet tuaja si admin janë çaktivizuar në këtë pamje.",
    KU: "Li vê dîtinê de sererastkirin û hevdîtinên te yên admin neçalak in.",
  },
  employeeSchedule: {
    DE: "Einsatzplan des Mitarbeiters",
    EN: "Employee schedule",
    IT: "Piano del dipendente",
    TR: "Çalışan planı",
    SQ: "Plani i punonjësit",
    KU: "Plana karmend",
  },
  loadingPlan: {
    DE: "Lädt Plan...",
    EN: "Loading schedule...",
    IT: "Caricamento piano...",
    TR: "Plan yükleniyor...",
    SQ: "Plani po ngarkohet...",
    KU: "Plan tê barkirin...",
  },
  noScheduleForDay: {
    DE: "Kein Einsatz für diesen Tag geplant.",
    EN: "No assignment planned for this day.",
    IT: "Nessun incarico previsto per questo giorno.",
    TR: "Bu gün için planlanmış görev yok.",
    SQ: "Nuk ka angazhim të planifikuar për këtë ditë.",
    KU: "Ji bo vê rojê planek tune ye.",
  },
  noLocationGiven: {
    DE: "📍 (kein Ort angegeben)",
    EN: "📍 (no location provided)",
    IT: "📍 (nessun luogo indicato)",
    TR: "📍 (yer belirtilmedi)",
    SQ: "📍 (nuk është dhënë vendi)",
    KU: "📍 (cih nehatiye dayîn)",
  },
  travelMinutes: {
    DE: "Min Fahrzeit",
    EN: "min travel time",
    IT: "min di viaggio",
    TR: "dk yol süresi",
    SQ: "min udhëtim",
    KU: "deq rê",
  },
  dayStatus: {
    DE: "Tagesstatus",
    EN: "Day status",
    IT: "Stato del giorno",
    TR: "Gün durumu",
    SQ: "Statusi i ditës",
    KU: "Rewşa rojê",
  },
  scheduleExists: {
    DE: "Plan vorhanden",
    EN: "Schedule available",
    IT: "Piano disponibile",
    TR: "Plan mevcut",
    SQ: "Plani ekziston",
    KU: "Plan heye",
  },
  paidVacation: {
    DE: "Unbezahlter Urlaub",
    EN: "Unpaid vacation",
    IT: "Ferie non retribuite",
    TR: "Ücretsiz izin",
    SQ: "Pushim i papaguar",
    KU: "Bêhnvedana bê mûçe",
  },
  noEntriesForDay: {
    DE: "Keine Einträge für diesen Tag vorhanden.",
    EN: "No entries available for this day.",
    IT: "Nessuna voce disponibile per questo giorno.",
    TR: "Bu gün için kayıt yok.",
    SQ: "Nuk ka regjistrime për këtë ditë.",
    KU: "Ji bo vê rojê tomar tune ne.",
  },
  yourSchedule: {
    DE: "Dein Einsatzplan",
    EN: "Your schedule",
    IT: "Il tuo piano",
    TR: "Planın",
    SQ: "Plani yt",
    KU: "Plana te",
  },
  syncToEntry: {
    DE: "↪️ In Eintrag syncen",
    EN: "↪️ Sync to entry",
    IT: "↪️ Sincronizza in registrazione",
    TR: "↪️ Kayda aktar",
    SQ: "↪️ Sinkronizo te regjistrimi",
    KU: "↪️ Bi tomarê re hevrêz bike",
  },
  documents: {
    DE: "📎 Dokumente",
    EN: "📎 Documents",
    IT: "📎 Documenti",
    TR: "📎 Belgeler",
    SQ: "📎 Dokumente",
    KU: "📎 Belge",
  },
  syncPlanHint: {
    DE: "Übernimmt Datum, Tätigkeit und Einsatzort. Uhrzeiten und Fahrtminuten bitte in der Erfassung ergänzen.",
    EN: "Transfers date, activity, and location. Please complete times and travel minutes in the entry form.",
    IT: "Trasferisce data, attività e luogo. Completa orari e minuti di viaggio nella registrazione.",
    TR: "Tarih, faaliyet ve konumu aktarır. Saatleri ve yol dakikalarını lütfen kayıtta tamamlayın.",
    SQ: "Merr datën, aktivitetin dhe vendin. Ju lutem plotësoni oraret dhe minutat e udhëtimit te regjistrimi.",
    KU: "Dîrok, çalakî û cih digire. Ji kerema xwe dem û deqeyên rê di tomarê de temam bike.",
  },
  publicHoliday: {
    DE: "Gesetzlicher Feiertag",
    EN: "Public holiday",
    IT: "Festività legale",
    TR: "Resmî tatil",
    SQ: "Festë zyrtare",
    KU: "Cejna fermî",
  },
  confirmedAbsence: {
    DE: "Bestätigte Abwesenheit",
    EN: "Confirmed absence",
    IT: "Assenza confermata",
    TR: "Onaylanmış devamsızlık",
    SQ: "Mungesë e konfirmuar",
    KU: "Nebûna pejirandî",
  },
  noConfirmedAbsence: {
    DE: "Keine bestätigte Abwesenheit eingetragen.",
    EN: "No confirmed absence recorded.",
    IT: "Nessuna assenza confermata registrata.",
    TR: "Onaylanmış devamsızlık kaydı yok.",
    SQ: "Nuk ka mungesë të konfirmuar të regjistruar.",
    KU: "Nebûna pejirandî nehatiye tomar kirin.",
  },
  alreadyConfirmedRegistered: {
    DE: "Bereits vom Admin bestätigt und im Kalender registriert.",
    EN: "Already confirmed by admin and registered in the calendar.",
    IT: "Già confermata dall'admin e registrata nel calendario.",
    TR: "Zaten yönetici tarafından onaylandı ve takvime işlendi.",
    SQ: "Tashmë e konfirmuar nga admini dhe e regjistruar në kalendar.",
    KU: "Berê ji aliyê admin ve pejirandî û di salnameyê de tomar kirî ye.",
  },
  compensation: {
    DE: "Vergütung:",
    EN: "Compensation:",
    IT: "Retribuzione:",
    TR: "Ücretlendirme:",
    SQ: "Kompensimi:",
    KU: "Mûçe:",
  },
  myRequests: {
    DE: "Meine Anträge",
    EN: "My requests",
    IT: "Le mie richieste",
    TR: "Taleplerim",
    SQ: "Kërkesat e mia",
    KU: "Daxwazên min",
  },
  noRequestForDay: {
    DE: "Kein Antrag für diesen Tag vorhanden.",
    EN: "No request exists for this day.",
    IT: "Non esiste alcuna richiesta per questo giorno.",
    TR: "Bu gün için talep yok.",
    SQ: "Nuk ka kërkesë për këtë ditë.",
    KU: "Ji bo vê rojê daxwaz tune ye.",
  },
  status: {
    DE: "Status:",
    EN: "Status:",
    IT: "Stato:",
    TR: "Durum:",
    SQ: "Statusi:",
    KU: "Rewş:",
  },
  scope: {
    DE: "Umfang:",
    EN: "Scope:",
    IT: "Entità:",
    TR: "Kapsam:",
    SQ: "Shtrirja:",
    KU: "Berfirehî:",
  },
  total: {
    DE: "Gesamt:",
    EN: "Total:",
    IT: "Totale:",
    TR: "Toplam:",
    SQ: "Totali:",
    KU: "Tevahî:",
  },
  processedBy: {
    DE: "Bearbeitet von:",
    EN: "Processed by:",
    IT: "Elaborato da:",
    TR: "İşleyen:",
    SQ: "Përpunuar nga:",
    KU: "Ji aliyê vê kesê ve hate xebitandin:",
  },
  details: {
    DE: "Details",
    EN: "Details",
    IT: "Dettagli",
    TR: "Detaylar",
    SQ: "Detaje",
    KU: "Hûrgulî",
  },
  requestDetails: {
    DE: "Antragsdetails",
    EN: "Request details",
    IT: "Dettagli richiesta",
    TR: "Talep detayları",
    SQ: "Detajet e kërkesës",
    KU: "Hûrguliyên daxwazê",
  },
  requestAbsence: {
    DE: "Abwesenheit beantragen",
    EN: "Request absence",
    IT: "Richiedi assenza",
    TR: "Devamsızlık talep et",
    SQ: "Kërko mungesë",
    KU: "Nebûnê daxwaz bike",
  },
  wholeDayOnlyForSick: {
    DE: "Krankheit kann nur ganztägig beantragt werden.",
    EN: "Sickness can only be requested as a full day.",
    IT: "La malattia può essere richiesta solo per l'intera giornata.",
    TR: "Hastalık sadece tam gün olarak talep edilebilir.",
    SQ: "Sëmundja mund të kërkohet vetëm për gjithë ditën.",
    KU: "Nexweşî tenê dikare wekî rojek tam were daxwaz kirin.",
  },
  halfDaysOnlyVacation: {
    DE: "Halbe Tage sind nur für Urlaub erlaubt.",
    EN: "Half days are only allowed for vacation.",
    IT: "I mezzi giorni sono consentiti solo per ferie.",
    TR: "Yarım gün sadece izin için kullanılabilir.",
    SQ: "Gjysmë ditët lejohen vetëm për pushim.",
    KU: "Nîv roj tenê ji bo bêhnvedanê tên destûrkirin.",
  },
  halfDaySingleDateOnly: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden.",
    EN: "A half vacation day may only be requested for exactly one date.",
    IT: "Una mezza giornata di ferie può essere richiesta solo per una sola data.",
    TR: "Yarım gün izin yalnızca tek bir tarih için talep edilebilir.",
    SQ: "Një gjysmë dite pushimi mund të kërkohet vetëm për një datë të vetme.",
    KU: "Nîv roj bêhnvedanê tenê ji bo tenê yek dîrokê dikare were daxwaz kirin.",
  },
  vacationNoWeekdays: {
    DE: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
    EN: "There are no workdays for vacation in the selected period. Weekends are automatically excluded.",
    IT: "Nel periodo selezionato non ci sono giorni lavorativi per ferie. I fine settimana vengono esclusi automaticamente.",
    TR: "Seçilen aralıkta izin için iş günü yok. Hafta sonları otomatik olarak hariç tutulur.",
    SQ: "Në periudhën e zgjedhur nuk ka ditë pune për pushim. Fundjavat përjashtohen automatikisht.",
    KU: "Di navbera hilbijartî de rojên karê ji bo bêhnvedanê tune ne. Dawiya hefteyê bixweber nayê hesibandin.",
  },
  sickCannotBeUnpaid: {
    DE: "Krankheit darf nicht als unbezahlt beantragt werden.",
    EN: "Sickness must not be requested as unpaid.",
    IT: "La malattia non può essere richiesta come non retribuita.",
    TR: "Hastalık ücretsiz olarak talep edilemez.",
    SQ: "Sëmundja nuk mund të kërkohet si e papaguar.",
    KU: "Nexweşî nikare wekî bê mûçe were daxwaz kirin.",
  },
  requestCouldNotBeSaved: {
    DE: "Antrag konnte nicht gespeichert werden.",
    EN: "Request could not be saved.",
    IT: "Impossibile salvare la richiesta.",
    TR: "Talep kaydedilemedi.",
    SQ: "Kërkesa nuk mund të ruhej.",
    KU: "Daxwaz nehat tomarkirin.",
  },
  networkSaveError: {
    DE: "Netzwerkfehler beim Speichern.",
    EN: "Network error while saving.",
    IT: "Errore di rete durante il salvataggio.",
    TR: "Kaydetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes.",
    KU: "Di tomarkirinê de şaşiya torê.",
  },
  pleaseSelectStartEnd: {
    DE: "Bitte Start- und Enddatum auswählen.",
    EN: "Please select start and end date.",
    IT: "Seleziona data di inizio e fine.",
    TR: "Lütfen başlangıç ve bitiş tarihini seçin.",
    SQ: "Ju lutem zgjidhni datën e fillimit dhe të mbarimit.",
    KU: "Ji kerema xwe dîroka destpêk û dawiyê hilbijêre.",
  },
  endBeforeStart: {
    DE: "Ende darf nicht vor Start liegen.",
    EN: "End must not be before start.",
    IT: "La fine non può essere prima dell'inizio.",
    TR: "Bitiş başlangıçtan önce olamaz.",
    SQ: "Mbarimi nuk mund të jetë para fillimit.",
    KU: "Dawî nikare berî destpêkê be.",
  },
  holidayMarked: {
    DE: "Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.",
    EN: "This day is marked as a public holiday in the calendar.",
    IT: "Questo giorno è contrassegnato come festività legale nel calendario.",
    TR: "Bu gün takvimde resmî tatil olarak işaretlenmiştir.",
    SQ: "Kjo ditë është shënuar si festë zyrtare në kalendar.",
    KU: "Ev roj di salnameyê de wekî cejna fermî hatiye nîşankirin.",
  },
  adminHolidayMarked: {
    DE: "Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.",
    EN: "This day is marked as a public holiday in the calendar.",
    IT: "Questo giorno è contrassegnato come festività legale nel calendario.",
    TR: "Bu gün takvimde resmî tatil olarak işaretlenmiştir.",
    SQ: "Kjo ditë është shënuar si festë zyrtare në kalendar.",
    KU: "Ev roj di salnameyê de wekî cejna fermî hatiye nîşankirin.",
  },
  startNewRequest: {
    DE: "Neuer Antrag",
    EN: "New request",
    IT: "Nuova richiesta",
    TR: "Yeni talep",
    SQ: "Kërkesë e re",
    KU: "Daxwaza nû",
  },
  absenceTypeVacation: {
    DE: "🌴 Urlaub",
    EN: "🌴 Vacation",
    IT: "🌴 Ferie",
    TR: "🌴 İzin",
    SQ: "🌴 Pushim",
    KU: "🌴 Bêhnvedan",
  },
  absenceTypeSick: {
    DE: "🤒 Krank",
    EN: "🤒 Sick",
    IT: "🤒 Malattia",
    TR: "🤒 Hasta",
    SQ: "🤒 I sëmurë",
    KU: "🤒 Nexweş",
  },
  scopeLabel: {
    DE: "Umfang",
    EN: "Scope",
    IT: "Entità",
    TR: "Kapsam",
    SQ: "Shtrirja",
    KU: "Berfirehî",
  },
  scopeHint: {
    DE: "Bei mehrtägigem Urlaub werden Samstage und Sonntage automatisch nicht mitgezählt.",
    EN: "For multi-day vacation, Saturdays and Sundays are automatically not counted.",
    IT: "Per ferie di più giorni, sabato e domenica non vengono conteggiati automaticamente.",
    TR: "Birden fazla günlük izinlerde cumartesi ve pazar otomatik olarak sayılmaz.",
    SQ: "Për pushimet disa ditore, të shtunat dhe të dielat nuk llogariten automatikisht.",
    KU: "Di bêhnvedanên pirrojan de şemî û yekşem bixweber nayên hesibandin.",
  },
  fullVacationDay: {
    DE: "Ganzer Urlaubstag",
    EN: "Full vacation day",
    IT: "Intera giornata di ferie",
    TR: "Tam gün izin",
    SQ: "Ditë e plotë pushimi",
    KU: "Rojek bêhnvedanê ya tam",
  },
  halfVacationDay: {
    DE: "Halber Urlaubstag",
    EN: "Half vacation day",
    IT: "Mezza giornata di ferie",
    TR: "Yarım gün izin",
    SQ: "Gjysmë dite pushimi",
    KU: "Nîv roj bêhnvedanê",
  },
  compensationLabel: {
    DE: "Vergütung",
    EN: "Compensation",
    IT: "Retribuzione",
    TR: "Ücretlendirme",
    SQ: "Kompensimi",
    KU: "Mûçe",
  },
  compensationLockedHint: {
    DE: "Für diesen Antrag ist aktuell nicht genug bezahlter Urlaub verfügbar. Der Antrag wird deshalb vorläufig als unbezahlt eingereicht. Bei der Prüfung kann der Admin den Antrag ganz oder teilweise in bezahlten und unbezahlten Urlaub aufteilen.",
    EN: "There is currently not enough paid vacation available for this request. Therefore, the request is submitted temporarily as unpaid. During review, the admin can split it fully or partially into paid and unpaid vacation.",
    IT: "Al momento non c'è abbastanza ferie pagate disponibili per questa richiesta. Per questo la richiesta viene inviata temporaneamente come non retribuita. Durante la revisione, l'admin può suddividerla in ferie pagate e non retribuite.",
    TR: "Bu talep için şu anda yeterli ücretli izin mevcut değil. Bu nedenle talep geçici olarak ücretsiz olarak gönderilir. İnceleme sırasında yönetici talebi tamamen veya kısmen ücretli ve ücretsiz izin olarak ayırabilir.",
    SQ: "Aktualisht nuk ka mjaftueshëm pushim të paguar për këtë kërkesë. Prandaj kërkesa dërgohet përkohësisht si e papaguar. Gjatë shqyrtimit, admini mund ta ndajë plotësisht ose pjesërisht në pushim të paguar dhe të papaguar.",
    KU: "Ji bo vê daxwazê niha bêhnvedana bi mûçe têr nîne. Ji ber vê yekê daxwaz demkî wekî bê mûçe tê şandin. Di dema vekolînê de admin dikare wê bi tevahî an beşekî bike bêhnvedana bi mûçe û bê mûçe.",
  },
  compensationFlexibleHint: {
    DE: "Falls bezahlter Resturlaub nicht vollständig ausreicht, kann der Antrag bei der Prüfung ganz oder teilweise in bezahlten und unbezahlten Urlaub aufgeteilt werden.",
    EN: "If the remaining paid vacation is not fully sufficient, the request can be split during review fully or partially into paid and unpaid vacation.",
    IT: "Se il residuo di ferie pagate non è sufficiente, la richiesta può essere suddivisa durante la revisione in ferie pagate e non retribuite.",
    TR: "Kalan ücretli izin tamamen yeterli değilse, talep inceleme sırasında tamamen veya kısmen ücretli ve ücretsiz izin olarak ayrılabilir.",
    SQ: "Nëse pushimi i mbetur i paguar nuk mjafton plotësisht, kërkesa mund të ndahet gjatë shqyrtimit në pushim të paguar dhe të papaguar.",
    KU: "Heke bêhnvedana mayî ya bi mûçe bi tevahî têr nebe, daxwaz di dema vekolînê de dikare bi tevahî an beşekî bibe bêhnvedana bi mûçe û bê mûçe.",
  },
  noteToAdmin: {
    DE: "Notiz an Admin",
    EN: "Note to admin",
    IT: "Nota per admin",
    TR: "Yöneticiye not",
    SQ: "Shënim për adminin",
    KU: "Nîşe ji bo admin",
  },
  requestNotePlaceholder: {
    DE: "Optional: Hinweis zum Antrag",
    EN: "Optional: note for the request",
    IT: "Opzionale: nota sulla richiesta",
    TR: "İsteğe bağlı: talep notu",
    SQ: "Opsionale: shënim për kërkesën",
    KU: "Vebijarkî: nîşe ji bo daxwazê",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  newRequest: {
    DE: "Neuer Antrag",
    EN: "New request",
    IT: "Nuova richiesta",
    TR: "Yeni talep",
    SQ: "Kërkesë e re",
    KU: "Daxwaza nû",
  },
  sendRequest: {
    DE: "Antrag senden",
    EN: "Send request",
    IT: "Invia richiesta",
    TR: "Talebi gönder",
    SQ: "Dërgo kërkesën",
    KU: "Daxwazê bişîne",
  },
  calendarLoadingFallback: {
    DE: "Kalender lädt...",
    EN: "Calendar is loading...",
    IT: "Il calendario si sta caricando...",
    TR: "Takvim yükleniyor...",
    SQ: "Kalendari po ngarkohet...",
    KU: "Salname tê barkirin...",
  },
};

function replaceTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getStringField(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function getBooleanField(obj: Record<string, unknown>, key: string): boolean | null {
  const v = obj[key];
  return typeof v === "boolean" ? v : null;
}

function isAbsenceType(v: unknown): v is AbsenceType {
  return v === "VACATION" || v === "SICK";
}

function isAbsenceDayPortion(v: unknown): v is AbsenceDayPortion {
  return v === "FULL_DAY" || v === "HALF_DAY";
}

function isAbsenceCompensation(v: unknown): v is AbsenceCompensation {
  return v === "PAID" || v === "UNPAID";
}

function isCalendarDay(v: unknown): v is CalendarDay {
  if (!isRecord(v)) return false;
  const date = getStringField(v, "date");
  const hasWork = getBooleanField(v, "hasWork");
  const hasVacation = getBooleanField(v, "hasVacation");
  const hasSick = getBooleanField(v, "hasSick");
  const hasPlan = getBooleanField(v, "hasPlan");
  const planPreviewRaw = v["planPreview"];
  const planPreview =
    planPreviewRaw === null || typeof planPreviewRaw === "string" ? planPreviewRaw : undefined;
  const hasHoliday = getBooleanField(v, "hasHoliday");
  const holidayNameRaw = v["holidayName"];
  const holidayName =
    holidayNameRaw === null || typeof holidayNameRaw === "string" ? holidayNameRaw : undefined;

  return (
    typeof date === "string" &&
    typeof hasWork === "boolean" &&
    typeof hasVacation === "boolean" &&
    typeof hasSick === "boolean" &&
    typeof hasPlan === "boolean" &&
    typeof hasHoliday === "boolean" &&
    (planPreview === null || typeof planPreview === "string") &&
    (holidayName === null || typeof holidayName === "string")
  );
}

function parseCalendarResponse(j: unknown): CalendarResponse {
  if (!isRecord(j)) return { ok: false, error: "Unerwartete Antwort." };

  const okVal = j["ok"];
  if (okVal === true) {
    const days = j["days"];
    if (!Array.isArray(days)) return { ok: false, error: "Unerwartete Antwort." };
    return { ok: true, days: days.filter(isCalendarDay) };
  }

  const err = j["error"];
  if (typeof err === "string" && err.trim()) return { ok: false, error: err };
  return { ok: false, error: "Unerwartete Antwort." };
}

function isAbsenceDTO(v: unknown): v is AbsenceDTO {
  if (!isRecord(v)) return false;
  const id = getStringField(v, "id");
  const absenceDate = getStringField(v, "absenceDate");
  const type = v["type"];
  const dayPortion = v["dayPortion"];
  const compensation = v["compensation"];
  const user = v["user"];

  if (!id || !absenceDate || !isAbsenceType(type) || !isAbsenceDayPortion(dayPortion)|| !isAbsenceCompensation(compensation)) {
    return false;
  }
  if (!isRecord(user)) return false;
  const uid = getStringField(user, "id");
  const fullName = getStringField(user, "fullName");
  return !!uid && !!fullName;
}

function parseAbsencesResponse(j: unknown): AbsenceDTO[] {
  if (!isRecord(j)) return [];
  const abs = j["absences"];
  if (!Array.isArray(abs)) return [];
  return abs.filter(isAbsenceDTO);
}

function isAbsenceRequestStatus(v: unknown): v is AbsenceRequestStatus {
  return v === "PENDING" || v === "APPROVED" || v === "REJECTED";
}

function isAbsenceRequestDTO(v: unknown): v is AbsenceRequestDTO {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const startDate = getStringField(v, "startDate");
  const endDate = getStringField(v, "endDate");
  const type = v["type"];
  const dayPortion = v["dayPortion"];
  const compensation = v["compensation"];
  const paidVacationUnits = v["paidVacationUnits"];
  const unpaidVacationUnits = v["unpaidVacationUnits"];
  const autoUnpaidBecauseNoBalance = getBooleanField(v, "autoUnpaidBecauseNoBalance");
  const compensationLockedBySystem = getBooleanField(v, "compensationLockedBySystem");
  const status = v["status"];
  const noteEmployee = getStringField(v, "noteEmployee");
  const createdAt = getStringField(v, "createdAt");
  const updatedAt = getStringField(v, "updatedAt");
  const decidedAtRaw = v["decidedAt"];
  const userRaw = v["user"];
  const decidedByRaw = v["decidedBy"];

  if (
    !id ||
    !startDate ||
    !endDate ||
    !isAbsenceType(type) ||
    !isAbsenceDayPortion(dayPortion) ||
    !isAbsenceCompensation(compensation) ||
    typeof paidVacationUnits !== "number" ||
    !Number.isFinite(paidVacationUnits) ||
    typeof unpaidVacationUnits !== "number" ||
    !Number.isFinite(unpaidVacationUnits) ||
    typeof autoUnpaidBecauseNoBalance !== "boolean" ||
    typeof compensationLockedBySystem !== "boolean" ||
    !isAbsenceRequestStatus(status) ||
    noteEmployee === null ||
    !createdAt ||
    !updatedAt
  ) {
    return false;
  }

  if (!isRecord(userRaw)) return false;
  const userId = getStringField(userRaw, "id");
  const userFullName = getStringField(userRaw, "fullName");
  if (!userId || !userFullName) return false;

  if (!(decidedAtRaw === null || typeof decidedAtRaw === "string")) return false;

  if (decidedByRaw !== null) {
    if (!isRecord(decidedByRaw)) return false;
    const decidedById = getStringField(decidedByRaw, "id");
    const decidedByFullName = getStringField(decidedByRaw, "fullName");
    if (!decidedById || !decidedByFullName) return false;
  }

  return true;
}

function parseAbsenceRequestsResponse(j: unknown): AbsenceRequestsResponseParsed {
  if (!isRecord(j)) {
    return {
      requests: [],
      remainingPaidVacationDaysForMonth: 0,
    };
  }

  if (j["ok"] !== true) {
    return {
      requests: [],
      remainingPaidVacationDaysForMonth: 0,
    };
  }

  const requests = j["requests"];
  const balanceRaw = j["vacationRequestBalance"];

  const remainingPaidVacationDaysForMonth =
    isRecord(balanceRaw) && typeof balanceRaw["remainingPaidVacationDaysForMonth"] === "number"
      ? balanceRaw["remainingPaidVacationDaysForMonth"]
      : 0;

  if (!Array.isArray(requests)) {
    return {
      requests: [],
      remainingPaidVacationDaysForMonth,
    };
  }

  return {
    requests: requests.filter(isAbsenceRequestDTO),
    remainingPaidVacationDaysForMonth,
  };
}

function isPlanEntry(v: unknown): v is PlanEntry {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const userId = getStringField(v, "userId");
  const workDate = getStringField(v, "workDate");
  const startHHMM = getStringField(v, "startHHMM");
  const endHHMM = getStringField(v, "endHHMM");
  const activity = getStringField(v, "activity");
  const location = getStringField(v, "location");

  const travelRaw = v["travelMinutes"];
  const travelMinutes = typeof travelRaw === "number" ? travelRaw : null;

  const noteRaw = v["noteEmployee"];
  const noteEmployee = noteRaw === null || typeof noteRaw === "string" ? noteRaw : undefined;

  const userRaw = v["user"];
  let userIsValid = true;

  if (userRaw !== undefined && userRaw !== null) {
    if (!isRecord(userRaw)) {
      userIsValid = false;
    } else {
      const userEntryId = getStringField(userRaw, "id");
      const userFullName = getStringField(userRaw, "fullName");
      userIsValid = typeof userEntryId === "string" && typeof userFullName === "string";
    }
  }

  return (
    typeof id === "string" &&
    typeof userId === "string" &&
    typeof workDate === "string" &&
    typeof startHHMM === "string" &&
    typeof endHHMM === "string" &&
    typeof activity === "string" &&
    typeof location === "string" &&
    typeof travelMinutes === "number" &&
    (noteEmployee === undefined || noteEmployee === null || typeof noteEmployee === "string") &&
    userIsValid
  );
}

function parsePlanEntriesResponse(j: unknown): PlanEntry[] {
  if (!isRecord(j)) return [];
  const entries = j["entries"];
  if (!Array.isArray(entries)) return [];
  return entries.filter(isPlanEntry);
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

function isCalendarEventDTO(v: unknown): v is CalendarEventDTO {
  if (!isRecord(v)) return false;

  const id = getStringField(v, "id");
  const date = getStringField(v, "date");
  const startHHMM = getStringField(v, "startHHMM");
  const endHHMM = getStringField(v, "endHHMM");
  const title = getStringField(v, "title");

  const locRaw = v["location"];
  const notesRaw = v["notes"];
  const location = locRaw === null || typeof locRaw === "string" ? locRaw : undefined;
  const notes = notesRaw === null || typeof notesRaw === "string" ? notesRaw : undefined;

  return (
    typeof id === "string" &&
    typeof date === "string" &&
    typeof startHHMM === "string" &&
    typeof endHHMM === "string" &&
    typeof title === "string" &&
    (location === null || typeof location === "string") &&
    (notes === null || typeof notes === "string")
  );
}

function parseAppointmentsResponse(j: unknown): CalendarEventDTO[] {
  if (!isRecord(j)) return [];
  if (j["ok"] !== true) return [];
  const events = j["events"];
  if (!Array.isArray(events)) return [];
  return events.filter(isCalendarEventDTO);
}

function extractErrorMessage(j: unknown, fallback: string): string {
  if (!isRecord(j)) return fallback;
  const e = j["error"];
  return typeof e === "string" && e.trim() ? e : fallback;
}

function monthKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function addMonths(d: Date, diff: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + diff);
  return x;
}

function addDaysYMD(ymd: string, diff: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + diff);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtDateTitle(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return ymd;
  }

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ] as const;

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

  const dt = new Date(y, m - 1, d);
  const weekday = weekdayNames[(dt.getDay() + 6) % 7] ?? "";
  const monthName = monthNames[m - 1] ?? "";

  return `${weekday}, ${String(d).padStart(2, "0")}. ${monthName} ${y}`;
}

function dateInRange(date: string, start: string, end: string): boolean {
  return start <= date && date <= end;
}

function getRequestedVacationDays(
  start: string,
  end: string,
  dayPortion: AbsenceDayPortion
): number {
  if (dayPortion === "HALF_DAY") {
    return 0.5;
  }

  const startDate = ymdToDateLocal(start);
  const endDate = ymdToDateLocal(end);

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

function toYMDLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ymdToDateLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

function buildRequestBlocks(requests: AbsenceRequestDTO[]): AbsenceRequestBlock[] {
  return requests
    .map((r) => ({
      id: r.id,
      type: r.type,
      dayPortion: r.dayPortion,
      status: r.status,
      compensation: r.compensation,
      paidVacationUnits: r.paidVacationUnits,
      unpaidVacationUnits: r.unpaidVacationUnits,
      autoUnpaidBecauseNoBalance: r.autoUnpaidBecauseNoBalance,
      compensationLockedBySystem: r.compensationLockedBySystem,
      start: r.startDate,
      end: r.endDate,
      noteEmployee: r.noteEmployee,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      decidedAt: r.decidedAt,
      decidedBy: r.decidedBy,
    }))
    .sort((a, b) => {
      if (a.start !== b.start) return a.start < b.start ? -1 : 1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
}

function requestStatusLabel(
  language: AppUiLanguage,
  status: AbsenceRequestStatus
): string {
  if (status === "PENDING") {
    return translate(language, "statusOpen", KALENDER_DICTIONARY);
  }

  if (status === "APPROVED") {
    return translate(language, "statusApproved", KALENDER_DICTIONARY);
  }

  return translate(language, "statusRejected", KALENDER_DICTIONARY);
}

function formatVacationDays(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getRequestCompensationSummary(
  language: AppUiLanguage,
  paidVacationUnits: number,
  unpaidVacationUnits: number,
  compensation: AbsenceCompensation
): string {
  const paidDays = paidVacationUnits / 2;
  const unpaidDays = unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return replaceTemplate(
      translate(language, "daysPaidDaysUnpaid", KALENDER_DICTIONARY),
      {
        paid: formatVacationDays(paidDays),
        unpaid: formatVacationDays(unpaidDays),
      }
    );
  }

  if (paidDays > 0) {
    return translate(language, "paid", KALENDER_DICTIONARY);
  }

  if (unpaidDays > 0) {
    return translate(language, "unpaid", KALENDER_DICTIONARY);
  }

  return compensation === "PAID"
    ? translate(language, "paid", KALENDER_DICTIONARY)
    : translate(language, "unpaid", KALENDER_DICTIONARY);
}

function getRequestCompensationHint(
  language: AppUiLanguage,
  paidVacationUnits: number,
  unpaidVacationUnits: number
): string | null {
  const paidDays = paidVacationUnits / 2;
  const unpaidDays = unpaidVacationUnits / 2;

  if (paidDays > 0 && unpaidDays > 0) {
    return replaceTemplate(
      translate(language, "ofWhichPaidUnpaid", KALENDER_DICTIONARY),
      {
        paid: formatVacationDays(paidDays),
        unpaid: formatVacationDays(unpaidDays),
      }
    );
  }

  return null;
}

function getAbsenceCompensationSummary(
  language: AppUiLanguage,
  absences: AbsenceDTO[]
): string | null {
  const vacationAbsences = absences.filter((a) => a.type === "VACATION");

  if (vacationAbsences.length === 0) {
    return null;
  }

  const paidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "PAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  const unpaidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "UNPAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  return getRequestCompensationSummary(language, paidUnits, unpaidUnits, "PAID");
}

function getAbsenceCompensationBreakdown(
  language: AppUiLanguage,
  absences: AbsenceDTO[]
): string | null {
  const vacationAbsences = absences.filter((a) => a.type === "VACATION");

  if (vacationAbsences.length === 0) {
    return null;
  }

  const paidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "PAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  const unpaidUnits = vacationAbsences.reduce((sum, a) => {
    return sum + (a.compensation === "UNPAID" ? (a.dayPortion === "HALF_DAY" ? 1 : 2) : 0);
  }, 0);

  const paidDays = paidUnits / 2;
  const unpaidDays = unpaidUnits / 2;

    if (paidDays > 0 && unpaidDays > 0) {
    return replaceTemplate(
      translate(language, "daysPaidDaysUnpaid", KALENDER_DICTIONARY),
      {
        paid: formatVacationDays(paidDays),
        unpaid: formatVacationDays(unpaidDays),
      }
    );
  }

  if (paidDays > 0) {
    return `${formatVacationDays(paidDays)} ${translate(language, "paid", KALENDER_DICTIONARY)}`;
  }

  if (unpaidDays > 0) {
    return `${formatVacationDays(unpaidDays)} ${translate(language, "unpaid", KALENDER_DICTIONARY)}`;
  }

  return null;
}

function requestBlockLabel(
  language: AppUiLanguage,
  b: AbsenceRequestBlock
): string {
  const icon = b.type === "VACATION" ? "🌴" : "🤒";

  if (b.type === "VACATION" && b.dayPortion === "HALF_DAY") {
    return replaceTemplate(
      translate(language, "vacationRequestHalfDay", KALENDER_DICTIONARY),
      { date: b.start }
    );
  }

  const name =
    b.type === "VACATION"
      ? translate(language, "vacationRequest", KALENDER_DICTIONARY)
      : translate(language, "sicknessRequest", KALENDER_DICTIONARY);

  const span = b.start === b.end ? b.start : `${b.start}–${b.end}`;
  return `${icon} ${name} (${span})`;
}

const CAT_STORAGE_KEY = "mafliesen_admin_event_categories_v1";

function isEventCategory(v: unknown): v is EventCategory {
  return v === "KUNDE" || v === "BAUSTELLE" || v === "INTERN" || v === "PRIVAT";
}

function safeReadCategoryMap(): Record<string, EventCategory> {
  try {
    const raw = window.localStorage.getItem(CAT_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const out: Record<string, EventCategory> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === "string" && isEventCategory(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function safeWriteCategoryMap(map: Record<string, EventCategory>): void {
  try {
    window.localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function categoryLabel(language: AppUiLanguage, c: EventCategory): string {
  if (c === "KUNDE") return translate(language, "customer", KALENDER_DICTIONARY);
  if (c === "BAUSTELLE") return translate(language, "site", KALENDER_DICTIONARY);
  if (c === "INTERN") return translate(language, "internal", KALENDER_DICTIONARY);
  return translate(language, "private", KALENDER_DICTIONARY);
}

function categoryDotStyle(c: EventCategory): React.CSSProperties {
  const base: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    flex: "0 0 auto",
    marginTop: 4,
    boxShadow: "0 0 0 3px var(--brand-neutral-card-bg)",
  };

  if (c === "KUNDE") return { ...base, background: "var(--brand-work-border)" };
  if (c === "BAUSTELLE") return { ...base, background: "var(--brand-vacation-border)" };
  if (c === "INTERN") return { ...base, background: "var(--brand-holiday-border)" };
  return { ...base, background: "var(--brand-sick-border)" };
}

function pillClassName(): string {
  return "calendar-pill";
}

function getHolidayIcon(name: string | null): React.ReactNode {
  if (!name) return <CalendarDays size={14} />;

  const n = name.toLowerCase();

  if (n.includes("neujahr")) {
    return <Sparkles size={14} />;
  }

  if (n.includes("heilige drei könige")) {
    return <Crown size={14} />;
  }

  if (n.includes("karfreitag")) {
    return <Sun size={14} />;
  }

  if (n.includes("ostermontag") || n.includes("ostern")) {
    return <Flower2 size={14} />;
  }

  if (n.includes("christi himmelfahrt")) {
    return <Sun size={14} />;
  }

  if (n.includes("pfingstmontag")) {
    return <Flower2 size={14} />;
  }

  if (n.includes("fronleichnam")) {
    return <Trees size={14} />;
  }

  if (n.includes("tag der arbeit")) {
    return <Briefcase size={14} />;
  }

  if (n.includes("tag der deutschen einheit")) {
    return <Users size={14} />;
  }

  if (n.includes("allerheiligen")) {
    return <Trees size={14} />;
  }

  if (n.includes("weihnacht")) {
    return <Trees size={14} />;
  }

  return <PartyPopper size={14} />;
}

function holidayDotColor(): string {
  return "var(--brand-holiday-border)";
}

function smallDot(color: string): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    boxShadow: "0 0 0 3px var(--brand-neutral-card-bg)",
    flex: "0 0 auto",
  };
}

type KalenderPageProps = {
  forceAdminOwnCalendar?: boolean;
};

function parseAbsenceTypeParam(value: string | null): AbsenceType | undefined {
  if (value === "VACATION" || value === "SICK") {
    return value;
  }

  return undefined;
}

function parseAbsenceDayPortionParam(value: string | null): AbsenceDayPortion | undefined {
  if (value === "FULL_DAY" || value === "HALF_DAY") {
    return value;
  }

  return undefined;
}

function parseAbsenceCompensationParam(value: string | null): AbsenceCompensation | undefined {
  if (value === "PAID" || value === "UNPAID") {
    return value;
  }

  return undefined;
}

type OpenDayPrefill = {
  absenceStart?: string;
  absenceEnd?: string;
  absenceType?: AbsenceType;
  absenceDayPortion?: AbsenceDayPortion;
  absenceCompensation?: AbsenceCompensation;
};

function KalenderPageInner({
  forceAdminOwnCalendar = false,
}: KalenderPageProps) {
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = (key: KalenderTextKey): string =>
    translate(language, key, KALENDER_DICTIONARY);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");

  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const [session, setSession] = useState<SessionDTO | null>(null);

  type UserOption = { id: string; fullName: string };

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [monthAbsences, setMonthAbsences] = useState<AbsenceDTO[]>([]);
  const [absLoading, setAbsLoading] = useState(false);
  const [monthRequests, setMonthRequests] = useState<AbsenceRequestDTO[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [requestNote, setRequestNote] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [dayPlans, setDayPlans] = useState<PlanEntry[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [adminEmployeeDayPlans, setAdminEmployeeDayPlans] = useState<PlanEntry[]>([]);
  const [adminEmployeePlansLoading, setAdminEmployeePlansLoading] = useState(false);
  const [adminEmployeePlansError, setAdminEmployeePlansError] = useState<string | null>(null);

  const [absenceStart, setAbsenceStart] = useState<string>("");
  const [absenceEnd, setAbsenceEnd] = useState<string>("");
  const [absenceType, setAbsenceType] = useState<AbsenceType>("VACATION");
  const [absenceDayPortion, setAbsenceDayPortion] = useState<AbsenceDayPortion>("FULL_DAY");
  const [absenceCompensation, setAbsenceCompensation] = useState<AbsenceCompensation>("PAID");
  const [remainingPaidVacationDaysForMonth, setRemainingPaidVacationDaysForMonth] = useState<number>(0);
  const [compensationLockedBySystem, setCompensationLockedBySystem] = useState<boolean>(false);
  const [selectedRequestBlock, setSelectedRequestBlock] = useState<AbsenceRequestBlock | null>(null);

  const [dayAppointments, setDayAppointments] = useState<CalendarEventDTO[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  const [adminMode, setAdminMode] = useState<AdminApptMode>("create-from-day");

  const [apptEditingId, setApptEditingId] = useState<string | null>(null);
  const [apptCategory, setApptCategory] = useState<EventCategory>("KUNDE");
  const [apptTitle, setApptTitle] = useState<string>("");
  const [apptDate, setApptDate] = useState<string>("");
  const [apptStart, setApptStart] = useState<string>("08:00");
  const [apptEnd, setApptEnd] = useState<string>("09:00");
  const [apptLocation, setApptLocation] = useState<string>("");
  const [apptNotes, setApptNotes] = useState<string>("");

  const [categoryMap, setCategoryMap] = useState<Record<string, EventCategory>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => monthKey(cursor), [cursor]);
  const isAdmin = forceAdminOwnCalendar || session?.role === "ADMIN";
  const isAdminOwnCalendar = isAdmin && !selectedUserId;
  const isAdminViewingEmployee = isAdmin && !!selectedUserId;
  const showEmployeeCalendarLegend = !isAdminOwnCalendar;

  const title = useMemo(() => {
    if (viewMode === "WEEK") {
      const ws = startOfWeekMonday(cursor);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `${fmt(ws)} – ${fmt(we)}`;
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

    const m = monthNames[cursor.getMonth()] ?? "";
    return `${m} ${cursor.getFullYear()}`;
  }, [cursor, viewMode]);

  const weekMeta = useMemo(() => {
    if (viewMode !== "WEEK") return null;

    const ws = startOfWeekMonday(cursor);
    const kw = getISOWeek(ws);

    return { kw, ws };
  }, [cursor, viewMode]);

  const todayYMD = useMemo(() => toYMDLocal(new Date()), []);
  function jumpToToday(): void {
    const now = new Date();
    setCursor(now);

    if (open) {
      setSelectedDate(toYMDLocal(now));
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

        if (forceAdminOwnCalendar) {
          if (parsed && parsed.role === "ADMIN") {
            setSession(parsed);
            return;
          }

          setSession({
            userId: "",
            fullName: "",
            role: "ADMIN",
            language: "DE",
            companyId: "",
            companyName: "",
            companySubdomain: "",
            companyLogoUrl: null,
            primaryColor: null,
          });
          return;
        }

        setSession(parsed);
      })
      .catch(() => {
        if (!alive) return;

        if (forceAdminOwnCalendar) {
          setSession({
            userId: "",
            fullName: "",
            role: "ADMIN",
            language: "DE",
            companyId: "",
            companyName: "",
            companySubdomain: "",
            companyLogoUrl: null,
            primaryColor: null,
          });
          return;
        }

        setSession(null);
      });

    return () => {
      alive = false;
    };
  }, [forceAdminOwnCalendar]);

  useEffect(() => {
    if (!isAdmin) return;

    fetch("/api/users")
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!isRecord(j) || j["ok"] !== true) return;
        const list = j["users"];
        if (!Array.isArray(list)) return;

        const parsed: UserOption[] = [];
        for (const it of list) {
          if (!isRecord(it)) continue;
          const id = getStringField(it, "id");
          const fullName = getStringField(it, "fullName");
          if (id && fullName) parsed.push({ id, fullName });
        }
        setUsers(parsed);
      })
      .catch(() => setUsers([]));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    setCategoryMap(safeReadCategoryMap());
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    safeWriteCategoryMap(categoryMap);
  }, [categoryMap, isAdmin]);

  async function loadCalendar(): Promise<void> {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ month: ym });
      if (isAdminViewingEmployee && selectedUserId) qs.set("userId", selectedUserId);
      const r = await fetch(`/api/calendar?${qs.toString()}`);
      const j: unknown = await r.json();
      const parsed = parseCalendarResponse(j);
      setData(parsed.ok ? parsed.days : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadAbsencesMonth(): Promise<void> {
    setAbsLoading(true);
    try {
      const params = new URLSearchParams({ month: ym });

      if (isAdminViewingEmployee && selectedUserId) {
        params.set("userId", selectedUserId);
      }

      const r = await fetch(`/api/absences?${params.toString()}`);
      const j: unknown = await r.json();
      setMonthAbsences(r.ok ? parseAbsencesResponse(j) : []);
    } finally {
      setAbsLoading(false);
    }
  }

  async function loadRequestsMonth(): Promise<void> {
    setReqLoading(true);
    try {
      const r = await fetch(`/api/absence-requests?${new URLSearchParams({ month: ym }).toString()}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setMonthRequests([]);
        setRemainingPaidVacationDaysForMonth(0);
        return;
      }

      const parsed = parseAbsenceRequestsResponse(j);
      setMonthRequests(parsed.requests);
      setRemainingPaidVacationDaysForMonth(parsed.remainingPaidVacationDaysForMonth);
    } finally {
      setReqLoading(false);
    }
  }

  async function reloadMonthAll(): Promise<void> {
    if (isAdminViewingEmployee) {
      await Promise.all([loadCalendar(), loadAbsencesMonth()]);
      return;
    }

    if (isAdminOwnCalendar) {
      await loadCalendar();
      return;
    }

    await Promise.all([loadCalendar(), loadAbsencesMonth(), loadRequestsMonth()]);
  }

  useEffect(() => {
    void reloadMonthAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, session?.role, selectedUserId]);

  useEffect(() => {
    if (!open || !selectedDate || !isAdminViewingEmployee) return;
    void loadAdminEmployeePlansForDay(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedUserId, open, isAdminViewingEmployee]);

  useEffect(() => {
    if (selectedRequestBlock) return;
    if (absenceType !== "VACATION") {
      setCompensationLockedBySystem(false);
      return;
    }

    const requiredDays = getRequestedVacationDays(
      absenceStart,
      absenceEnd,
      absenceDayPortion
    );

    const mustForceUnpaid =
      remainingPaidVacationDaysForMonth + 1e-9 < requiredDays;

    if (mustForceUnpaid) {
      setAbsenceCompensation("UNPAID");
      setCompensationLockedBySystem(true);
      return;
    }

    setCompensationLockedBySystem(false);
  }, [
    absenceStart,
    absenceEnd,
    absenceType,
    absenceDayPortion,
    remainingPaidVacationDaysForMonth,
    selectedRequestBlock,
  ]);

  const dayMap = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);
  const requestBlocks = useMemo(
    () => (isAdmin ? [] : buildRequestBlocks(monthRequests)),
    [monthRequests, isAdmin]
  );

  const requestBlocksForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];
    return requestBlocks.filter((b) => b.status === "PENDING" && dateInRange(selectedDate, b.start, b.end));
  }, [requestBlocks, selectedDate, isAdmin]);

  const confirmedAbsencesForSelectedDay = useMemo(() => {
    if (!selectedDate || isAdmin) return [];
    return monthAbsences.filter((a) => a.absenceDate === selectedDate);
  }, [monthAbsences, selectedDate, isAdmin]);

  const grid = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);

    const firstDay = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
    for (let i = 0; i < firstDay; i += 1) cells.push({ date: "", day: 0, inMonth: false });

    for (let d = 1; d <= daysInMonth; d += 1) {
      const dd = String(d).padStart(2, "0");
      const date = `${ym}-${dd}`;
      cells.push({ date, day: d, inMonth: true });
    }

    while (cells.length < 42) cells.push({ date: "", day: 0, inMonth: false });
    return cells;
  }, [ym]);

  const weekDays = useMemo(() => {
    const ws = startOfWeekMonday(cursor);
    const out: Array<{ date: string; label: string; dayNum: string; isToday: boolean }> = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      const ymd = toYMDLocal(d);
      const weekdayShort = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
      const weekdayIndex = (d.getDay() + 6) % 7;
      const label = weekdayShort[weekdayIndex] ?? "";
      const dayNum = String(d.getDate()).padStart(2, "0");
      out.push({ date: ymd, label, dayNum, isToday: ymd === todayYMD });
    }
    return out;
  }, [cursor, todayYMD]);

  const loadPlansForDay = useCallback(async (date: string): Promise<void> => {
    setPlansLoading(true);
    setPlansError(null);

    try {
      const to = addDaysYMD(date, 1);
      const r = await fetch(`/api/plan-entries?from=${encodeURIComponent(date)}&to=${encodeURIComponent(to)}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setDayPlans([]);
        setPlansError(extractErrorMessage(j, language === "DE" ? "Plan konnte nicht geladen werden." : t("loadingPlan")));
        return;
      }

      setDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setDayPlans([]);
      setPlansError(language === "DE" ? "Netzwerkfehler beim Laden des Plans." : "Network error.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadAdminEmployeePlansForDay = useCallback(async (date: string): Promise<void> => {
    if (!selectedUserId) {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError(null);
      setAdminEmployeePlansLoading(false);
      return;
    }

    setAdminEmployeePlansLoading(true);
    setAdminEmployeePlansError(null);

    try {
      const to = addDaysYMD(date, 1);
      const qs = new URLSearchParams({
        from: date,
        to,
        userId: selectedUserId,
      });

      const r = await fetch(`/api/plan-entries?${qs.toString()}`);
      const j: unknown = await r.json();

      if (!r.ok) {
        setAdminEmployeeDayPlans([]);
        setAdminEmployeePlansError(
          extractErrorMessage(
            j,
            language === "DE" ? "Plan des Mitarbeiters konnte nicht geladen werden." : "Employee schedule could not be loaded."
          )
        );
        return;
      }

      setAdminEmployeeDayPlans(parsePlanEntriesResponse(j));
    } catch {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError(
        language === "DE" ? "Netzwerkfehler beim Laden des Mitarbeiter-Plans." : "Network error."
      );
    } finally {
      setAdminEmployeePlansLoading(false);
    }
  }, [selectedUserId]);

  const loadAppointmentsForDay = useCallback(async (date: string): Promise<void> => {
    setApptLoading(true);
    setApptError(null);
    try {
      const r = await fetch(`/api/admin/appointments?date=${encodeURIComponent(date)}`);
      const j: unknown = await r.json();
      if (!r.ok) {
        setDayAppointments([]);
        setApptError(extractErrorMessage(j, language === "DE" ? "Termine konnten nicht geladen werden." : "Appointments could not be loaded."));
        return;
      }
      const list = parseAppointmentsResponse(j)
        .slice()
        .sort((a, b) => (a.startHHMM < b.startHHMM ? -1 : a.startHHMM > b.startHHMM ? 1 : 0));
      setDayAppointments(list);
    } catch {
      setDayAppointments([]);
      setApptError(language === "DE" ? "Netzwerkfehler beim Laden der Termine." : "Network error.");
    } finally {
      setApptLoading(false);
    }
  }, []);

  function resetAppointmentForm(): void {
    setApptEditingId(null);
    setApptCategory("KUNDE");
    setApptTitle("");
    setApptDate("");
    setApptStart("08:00");
    setApptEnd("09:00");
    setApptLocation("");
    setApptNotes("");
    setApptError(null);
    setError(null);
  }

  const openDay = useCallback((date: string, prefill?: OpenDayPrefill): void => {
    setSelectedDate(date);
    setOpen(true);
    setError(null);

    if (isAdminOwnCalendar) {
      setAdminMode("create-from-day");
      resetAppointmentForm();
      setApptDate(date);
      setDayAppointments([]);
      void loadAppointmentsForDay(date);
      return;
    }

    if (isAdminViewingEmployee) {
      setAdminEmployeeDayPlans([]);
      setAdminEmployeePlansError(null);
      setAdminEmployeePlansLoading(false);
      void loadAdminEmployeePlansForDay(date);
      return;
    }

    const nextAbsenceType = prefill?.absenceType ?? "VACATION";
    const nextAbsenceStart = prefill?.absenceStart ?? date;
    const nextAbsenceEnd = prefill?.absenceEnd ?? nextAbsenceStart;

    setSelectedRequestBlock(null);
    setAbsenceStart(nextAbsenceStart);
    setAbsenceEnd(nextAbsenceEnd);
    setAbsenceType(nextAbsenceType);
    setAbsenceDayPortion(prefill?.absenceDayPortion ?? "FULL_DAY");
    setAbsenceCompensation(
      prefill?.absenceCompensation ?? "PAID"
    );
    setCompensationLockedBySystem(false);
    setRequestNote("");

    setDayPlans([]);
    setPlansError(null);
    setPlansLoading(false);

    void loadPlansForDay(date);
  }, [
    isAdminOwnCalendar,
    isAdminViewingEmployee,
    loadAdminEmployeePlansForDay,
    loadAppointmentsForDay,
    loadPlansForDay,
  ]);

  useEffect(() => {
    if (isAdmin) return;

    const openDateParam = searchParams.get("openDate");
    const absenceStartParam = searchParams.get("absenceStart");
    const absenceEndParam = searchParams.get("absenceEnd");
    const absenceTypeParam = searchParams.get("absenceType");
    const absenceDayPortionParam = searchParams.get("absenceDayPortion");
    const absenceCompensationParam = searchParams.get("absenceCompensation");

    const resolvedOpenDate =
      openDateParam || absenceStartParam || absenceEndParam;

    if (!resolvedOpenDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resolvedOpenDate)) return;

    const resolvedStart =
      absenceStartParam && /^\d{4}-\d{2}-\d{2}$/.test(absenceStartParam)
        ? absenceStartParam
        : resolvedOpenDate;

    const resolvedEnd =
      absenceEndParam && /^\d{4}-\d{2}-\d{2}$/.test(absenceEndParam)
        ? absenceEndParam
        : resolvedStart;

    const resolvedType =
      parseAbsenceTypeParam(absenceTypeParam) ?? "VACATION";

    const resolvedDayPortion =
      parseAbsenceDayPortionParam(absenceDayPortionParam) ?? "FULL_DAY";

    const resolvedCompensation =
      parseAbsenceCompensationParam(absenceCompensationParam) ?? "PAID";

    setCursor(ymdToDateLocal(resolvedOpenDate));

    openDay(resolvedOpenDate, {
      absenceStart: resolvedStart,
      absenceEnd: resolvedEnd,
      absenceType: resolvedType,
      absenceDayPortion: resolvedDayPortion,
      absenceCompensation: resolvedCompensation,
    });

    router.replace("/kalender");
  }, [isAdmin, openDay, router, searchParams]);

  function syncPlanEntryToWorkEntry(plan: PlanEntry): void {
  const syncDate =
    typeof plan.workDate === "string" && plan.workDate.length >= 10
      ? plan.workDate.slice(0, 10)
      : plan.workDate;

  const params = new URLSearchParams({
    syncDate,
    syncActivity: plan.activity,
    syncLocation: plan.location,
  });

  setOpen(false);
  router.push(`/erfassung?${params.toString()}`);
}

  function openNewEventGlobal(): void {
    const now = new Date();
    const ymd = toYMDLocal(now);

    setCursor(now);
    setSelectedDate(ymd);
    setOpen(true);

    setAdminMode("create-global");
    resetAppointmentForm();
    setApptDate(ymd);

    void loadAppointmentsForDay(ymd);
  }

  function startNewRequest(): void {
    setSelectedRequestBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
    }
    setAbsenceType("VACATION");
    setAbsenceDayPortion("FULL_DAY");
    setAbsenceCompensation("PAID");
    setCompensationLockedBySystem(false);
    setRequestNote("");
  }

  function showRequestDetails(block: AbsenceRequestBlock): void {
    setSelectedRequestBlock(block);
    setAbsenceStart(block.start);
    setAbsenceEnd(block.end);
    setAbsenceType(block.type);
    setAbsenceDayPortion(block.dayPortion);
    setAbsenceCompensation(block.compensation);
    setCompensationLockedBySystem(block.compensationLockedBySystem);
    setRequestNote(block.noteEmployee);
    setError(null);
  }

  function cancelRequestView(): void {
    setSelectedRequestBlock(null);
    if (selectedDate) {
      setAbsenceStart(selectedDate);
      setAbsenceEnd(selectedDate);
    }
    setAbsenceType("VACATION");
    setAbsenceDayPortion("FULL_DAY");
    setAbsenceCompensation("PAID");
    setCompensationLockedBySystem(false);
    setRequestNote("");
  }

  async function saveAbsence(): Promise<void> {
    setError(null);

    if (!absenceStart || !absenceEnd) {
      setError(t("pleaseSelectStartEnd"));
      return;
    }

    if (absenceEnd < absenceStart) {
      setError(t("endBeforeStart"));
      return;
    }
    if (absenceType === "SICK" && absenceDayPortion !== "FULL_DAY") {
      setError(t("wholeDayOnlyForSick"));
      return;
    }

    if (absenceDayPortion === "HALF_DAY" && absenceType !== "VACATION") {
      setError(t("halfDaysOnlyVacation"));
      return;
    }

    if (absenceDayPortion === "HALF_DAY" && absenceStart !== absenceEnd) {
      setError(t("halfDaySingleDateOnly"));
      return;
    }

    if (absenceType === "VACATION" && absenceDayPortion === "FULL_DAY") {
      const effectiveVacationDays = getRequestedVacationDays(
        absenceStart,
        absenceEnd,
        absenceDayPortion
      );

      if (effectiveVacationDays <= 0) {
        setError(t("vacationNoWeekdays"));
        return;
      }
    }

    if (absenceType === "SICK" && absenceCompensation !== "PAID") {
      setError(t("sickCannotBeUnpaid"));
      return;
    }

    setSaving(true);
    try {
      const r = await fetch("/api/absence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: absenceStart,
          endDate: absenceEnd,
          type: absenceType,
          dayPortion: absenceDayPortion,
          compensation: absenceCompensation,
          noteEmployee: requestNote.trim(),
        }),
      });

      const j: unknown = await r.json();

      if (!r.ok) {
        setError(extractErrorMessage(j, t("requestCouldNotBeSaved")));
        return;
      }

      setOpen(false);
      setSelectedRequestBlock(null);
      setRequestNote("");
      await reloadMonthAll();
    } catch {
      setError(t("networkSaveError"));
    } finally {
      setSaving(false);
    }
  }

  function effectiveAdminDate(): string {
    if (adminMode === "create-from-day") return selectedDate;
    return apptDate.trim();
  }

  async function saveAppointment(): Promise<void> {
    const date = effectiveAdminDate();
    if (!date) {
      setApptError(`${t("date")} auswählen.`);
      return;
    }

    setApptError(null);
    const titleValue = apptTitle.trim();
    if (!titleValue) {
      setApptError(language === "DE" ? "Bitte Titel eingeben." : "Please enter a title.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(apptStart) || !/^\d{2}:\d{2}$/.test(apptEnd)) {
      setApptError(language === "DE" ? "Start/Ende muss HH:MM sein." : "Start/end must be HH:MM.");
      return;
    }

    setSaving(true);
    try {
      if (apptEditingId) {
        const r = await fetch(`/api/admin/appointments/${encodeURIComponent(apptEditingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startHHMM: apptStart,
            endHHMM: apptEnd,
            title: titleValue,
            location: apptLocation.trim(),
            notes: apptNotes.trim(),
          }),
        });
        const j: unknown = await r.json();
        if (!r.ok) {
          setApptError(extractErrorMessage(j, language === "DE" ? "Speichern fehlgeschlagen." : "Saving failed."));
          return;
        }
      } else {
        const r = await fetch("/api/admin/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startHHMM: apptStart,
            endHHMM: apptEnd,
            title: titleValue,
            location: apptLocation.trim(),
            notes: apptNotes.trim(),
          }),
        });
        const j: unknown = await r.json();
        if (!r.ok) {
          setApptError(extractErrorMessage(j, language === "DE" ? "Speichern fehlgeschlagen." : "Saving failed."));
          return;
        }

        if (isRecord(j) && j["ok"] === true) {
          const ev = j["event"];
          if (isCalendarEventDTO(ev)) {
            setCategoryMap((prev) => ({ ...prev, [ev.id]: apptCategory }));
          }
        }
      }

      setSelectedDate(date);

      await Promise.all([loadAppointmentsForDay(date), reloadMonthAll()]);
      resetAppointmentForm();

      if (adminMode === "edit") setAdminMode("create-from-day");
    } catch {
      setApptError(t("networkSaveError"));
    } finally {
      setSaving(false);
    }
  }

  function editAppointment(a: CalendarEventDTO): void {
    setAdminMode("edit");
    setApptEditingId(a.id);
    setApptTitle(a.title);
    setApptDate(a.date);
    setApptStart(a.startHHMM);
    setApptEnd(a.endHHMM);
    setApptLocation(a.location ?? "");
    setApptNotes(a.notes ?? "");
    setApptCategory(categoryMap[a.id] ?? "KUNDE");
    setApptError(null);
    setError(null);
  }

  async function deleteAppointment(id: string): Promise<void> {
    if (!selectedDate) return;
    setApptError(null);
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/appointments/${encodeURIComponent(id)}`, { method: "DELETE" });
      const j: unknown = await r.json();
      if (!r.ok) {
        setApptError(extractErrorMessage(j, language === "DE" ? "Löschen fehlgeschlagen." : "Deleting failed."));
        return;
      }

      setCategoryMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      if (apptEditingId === id) resetAppointmentForm();
      await Promise.all([loadAppointmentsForDay(selectedDate), reloadMonthAll()]);
    } catch {
      setApptError(language === "DE" ? "Netzwerkfehler beim Löschen." : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    if (!apptEditingId) return;
    setCategoryMap((prev) => ({ ...prev, [apptEditingId]: apptCategory }));
  }, [apptCategory, apptEditingId, isAdmin]);

  return (
    <AppShell activeLabel="#wirkönnendas">
      <div className="card card-olive" style={{ padding: 18, position: "relative" }}>
        <div className="calendar-mobile-header">
          <button
            className="btn calendar-nav-btn"
            onClick={() => {
              if (viewMode === "WEEK") {
                const x = new Date(cursor);
                x.setDate(x.getDate() - 7);
                setCursor(x);
              } else {
                setCursor((d) => addMonths(d, -1));
              }
            }}
          >
            ‹
          </button>

          <div className="calendar-title-column">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div className="calendar-main-title">{title}</div>

              {isAdmin ? (
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      const nextUserId = e.target.value;
                      setSelectedUserId(nextUserId);

                      setAdminEmployeeDayPlans([]);
                      setAdminEmployeePlansError(null);
                      setAdminEmployeePlansLoading(false);

                      if (!nextUserId) {
                        setDayAppointments([]);
                        setApptError(null);
                      }
                    }}
                    className="input calendar-user-select"
                    style={{
                      width: "fit-content",
                      minWidth: 100,
                      maxWidth: 320,
                      textAlign: "center",
                      textAlignLast: "center",
                      paddingLeft: 20,
                      paddingRight: 20,
                    }}
                  >
                    <option value="">{t("myAdminAppointments")}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>

                  {isAdminViewingEmployee ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--muted)",
                        textAlign: "center",
                        maxWidth: 420,
                        marginInline: "auto",
                      }}
                    >
                      {t("employeeReadonlyCalendarHint")}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {viewMode === "WEEK" && weekMeta ? (
                <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 800 }}>
                  KW {weekMeta.kw}
                </div>
              ) : null}
            </div>

            <div className="calendar-segmented-wrap">
              <button
                type="button"
                className={`calendar-segmented-button ${viewMode === "MONTH" ? "is-active" : ""}`}
                onClick={() => setViewMode("MONTH")}
              >
                {t("month")}
              </button>
              <button
                type="button"
                className={`calendar-segmented-button ${viewMode === "WEEK" ? "is-active" : ""}`}
                onClick={() => setViewMode("WEEK")}
              >
                Woche
              </button>
            </div>

            {isAdminOwnCalendar ? (
              <div className="calendar-google-below-toggle">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    router.push("/api/admin/google/connect");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6-6C34.6 2.5 29.6 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.4 5.7C12.1 13.2 17.6 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 2.8-2.1 5.1-4.4 6.7l7 5.5C43.8 37 46.5 31.2 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M10.1 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.4-5.7C1 17.2 0 20.5 0 24s1 6.8 2.7 9.8l7.4-5.1z"/>
                    <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.7l-7-5.5c-2 1.3-4.6 2-9 2-6.4 0-11.9-4.3-13.8-10.1l-7.4 5.7C6.6 42.5 14.6 48 24 48z"/>
                  </svg>

                  {t("connectGoogleCalendar")}
                </button>
              </div>
            ) : null}
          </div>

          <button
            className="btn calendar-nav-btn"
            onClick={() => {
              if (viewMode === "WEEK") {
                const x = new Date(cursor);
                x.setDate(x.getDate() + 7);
                setCursor(x);
              } else {
                setCursor((d) => addMonths(d, 1));
              }
            }}
          >
            ›
          </button>

          {isAdminOwnCalendar ? (
            <div className="calendar-google-desktop">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  router.push("/api/admin/google/connect");
                }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6-6C34.6 2.5 29.6 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.4 5.7C12.1 13.2 17.6 9.5 24 9.5z"/>
                  <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 2.8-2.1 5.1-4.4 6.7l7 5.5C43.8 37 46.5 31.2 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.1 28.7c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.4-5.7C1 17.2 0 20.5 0 24s1 6.8 2.7 9.8l7.4-5.1z"/>
                  <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.7l-7-5.5c-2 1.3-4.6 2-9 2-6.4 0-11.9-4.3-13.8-10.1l-7.4 5.7C6.6 42.5 14.6 48 24 48z"/>
                </svg>

                {t("connectGoogleCalendar")}
              </button>
            </div>
          ) : null}
        </div>

        {viewMode === "WEEK" ? (
          <>
            <div className="calendar-grid-scroll">
              <div className="calendar-week-grid">
                {weekDays.map((w) => {
                  const info = dayMap.get(w.date);
                  const inThisMonth = monthKey(ymdToDateLocal(w.date)) === ym;

                  const border =
                    info?.hasSick
                      ? "var(--brand-sick-border)"
                      : info?.hasVacation
                      ? "var(--brand-vacation-border)"
                      : info?.hasHoliday
                      ? "var(--brand-holiday-border)"
                      : info?.hasPlan
                      ? "var(--brand-work-border)"
                      : "var(--border)";

                  const bg =
                    info?.hasSick
                      ? "var(--brand-sick-bg)"
                      : info?.hasVacation
                      ? "var(--brand-vacation-bg)"
                      : info?.hasHoliday
                      ? "var(--brand-holiday-bg)"
                      : info?.hasPlan
                      ? "var(--brand-work-bg)"
                      : "var(--brand-neutral-card-bg)";

                  return (
                    <button
                      key={w.date}
                      className="card calendar-week-cell"
                      onClick={() => {
                        const dt = ymdToDateLocal(w.date);
                        setCursor(dt);
                        openDay(w.date);
                      }}
                      style={{
                        borderColor: border,
                        background: bg,
                        opacity: inThisMonth ? 1 : 0.75,
                      }}
                      title={fmtDateTitle(w.date)}
                    >
                      <div className="calendar-week-cell-head">
                        <div className="calendar-week-cell-daylabel">
                          <span className="calendar-week-cell-weekday">{w.label}</span>
                          <span
                            className={
                              w.isToday
                                ? "calendar-week-cell-daynumber calendar-week-cell-daynumber-today"
                                : "calendar-week-cell-daynumber"
                            }
                          >
                            {w.dayNum}
                          </span>
                        </div>

                        <span className="calendar-week-cell-datefull">
                          {w.date}
                        </span>
                      </div>

                      <div className="calendar-week-cell-tags">
                        {info?.hasPlan ? (
                          <span className={pillClassName()}>
                            <span style={smallDot("var(--tenant-work-accent)")} />{" "}
                            {showEmployeeCalendarLegend ? t("work") : t("appointments")}
                          </span>
                        ) : null}

                        {info?.hasHoliday ? (
                          <span className={pillClassName()} title={info.holidayName ?? "Gesetzlicher Feiertag"}>
                            <span style={smallDot(holidayDotColor())} /> {t("holiday")}
                          </span>
                        ) : null}

                        {showEmployeeCalendarLegend && info?.hasVacation ? (
                          <span className={pillClassName()}>
                            <span style={smallDot("var(--tenant-vacation-accent)")} /> {t("vacation")}
                          </span>
                        ) : null}

                        {showEmployeeCalendarLegend && info?.hasSick ? (
                          <span className={pillClassName()}>
                            <span style={smallDot("var(--tenant-sick-accent)")} /> {t("sick")}
                          </span>
                        ) : null}

                        {!info?.hasPlan && !info?.hasVacation && !info?.hasSick && !info?.hasHoliday ? (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--muted)",
                            }}
                          >
                            {t("noEntries")}
                          </span>
                        ) : null}
                      </div>

                      {info?.hasPlan && info.planPreview ? (
                        <div
                          className="calendar-week-cell-preview"
                          title={info.planPreview}
                        >
                          {info.planPreview}
                        </div>
                      ) : null}

                      {info?.hasHoliday && info.holidayName ? (
                        <div
                          className="calendar-week-cell-preview"
                          title={info.holidayName}
                          style={{ color: "var(--brand-holiday-text)" }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {getHolidayIcon(info.holidayName)}
                            {info.holidayName}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 14,
              }}
            >
              <button
                className="btn calendar-today-action-btn"
                type="button"
                onClick={jumpToToday}
              >
                {t("today")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="calendar-grid-scroll">
              <div className="calendar-month-grid">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
                  <div key={w} className="calendar-weekday-head">
                    {w}
                  </div>
                ))}

                {loading ? (
                  <div style={{ gridColumn: "1 / -1", color: "var(--muted)" }}>{t("loadingCalendar")}</div>
                ) : (
                  grid.map((c, idx) => {
                    const info = c.inMonth && c.date ? dayMap.get(c.date) : undefined;

                    const border =
                      info?.hasSick
                        ? "var(--brand-sick-border)"
                        : info?.hasVacation
                        ? "var(--brand-vacation-border)"
                        : info?.hasHoliday
                        ? "var(--brand-holiday-border)"
                        : info?.hasPlan
                        ? "var(--brand-work-border)"
                        : "var(--border)";

                    const bg =
                      info?.hasSick
                        ? "var(--brand-sick-bg)"
                        : info?.hasVacation
                        ? "var(--brand-vacation-bg)"
                        : info?.hasHoliday
                        ? "var(--brand-holiday-bg)"
                        : info?.hasPlan
                        ? "var(--brand-work-bg)"
                        : "var(--brand-neutral-card-bg)";

                    const isToday = c.date === todayYMD;

                    return (
                      <button
                        key={`${c.date}-${idx}`}
                        className="card calendar-month-cell"
                        disabled={!c.inMonth}
                        onClick={() => c.inMonth && c.date && openDay(c.date)}
                        style={{
                          borderColor: isToday ? "var(--brand-calendar-today-border)" : border,
                          background: bg,
                          opacity: c.inMonth ? 1 : 0.25,
                          cursor: c.inMonth ? "pointer" : "default",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div
                            className={isToday ? "calendar-day-number calendar-day-number-today-mobile" : "calendar-day-number"}
                            style={{ fontWeight: 900 }}
                          >
                            {c.inMonth ? c.day : ""}
                          </div>

                          {isToday ? (
                            <div
                              className="calendar-today-dot-desktop"
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: "var(--accent)",
                                boxShadow: "0 0 0 3px var(--accent-soft)",
                              }}
                              title="Heute"
                            />
                          ) : null}
                        </div>

                        <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {info?.hasPlan ? <span style={smallDot("var(--tenant-work-accent)")} /> : null}
                          {info?.hasHoliday ? <span style={smallDot(holidayDotColor())} /> : null}
                          {showEmployeeCalendarLegend && info?.hasVacation ? (
                            <span style={smallDot("var(--tenant-vacation-accent)")} />
                          ) : null}
                          {showEmployeeCalendarLegend && info?.hasSick ? (
                            <span style={smallDot("var(--tenant-sick-accent)")} />
                          ) : null}
                        </div>

                        {info?.hasPlan && info.planPreview ? (
                          <div
                            className="calendar-desktop-preview"
                            style={{
                              marginTop: 8,
                              fontSize: 11,
                              lineHeight: "14px",
                              color: "var(--muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              minHeight: 0,
                            }}
                            title={info.planPreview}
                          >
                            {info.planPreview}
                          </div>
                        ) : null}
                        {info?.hasHoliday && info.holidayName ? (
                          <div
                            className="calendar-desktop-preview"
                            style={{
                              marginTop: 6,
                              fontSize: 11,
                              lineHeight: "14px",
                              color: "var(--brand-holiday-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              minHeight: 0,
                            }}
                            title={info.holidayName}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {getHolidayIcon(info.holidayName)}
                              {info.holidayName}
                            </span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className="calendar-legend-row"
              style={{
                marginTop: 14,
                color: "var(--muted)",
              }}
            >
              <div
                className="calendar-legend-items"
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {isAdminOwnCalendar ? (
                  <>
                    <div>
                      <span className="badge-dot dot-work" /> {t("appointments")}
                    </div>
                    <div>
                      <span
                        className="badge-dot"
                        style={{ background: holidayDotColor(), boxShadow: "0 0 0 3px var(--brand-holiday-bg)" }}
                      />{" "}
                      {t("holiday")}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="badge-dot dot-work" /> {t("work")}
                    </div>
                    <div>
                      <span className="badge-dot dot-vac" /> {t("vacation")}
                    </div>
                    <div>
                      <span
                        className="badge-dot"
                        style={{ background: holidayDotColor(), boxShadow: "0 0 0 3px var(--brand-holiday-bg)" }}
                      />{" "}
                      {t("holiday")}
                    </div>
                    <div>
                      <span className="badge-dot dot-sick" /> {t("sick")}
                    </div>
                  </>
                )}

                {!isAdminViewingEmployee && (absLoading || reqLoading) ? (
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {language === "DE" ? "Abwesenheiten/Anträge laden…" : "Loading absences/requests..."}
                  </div>
                ) : null}
              </div>

              <div className="calendar-today-action-wrap">
                <button
                  className="btn calendar-today-action-btn"
                  type="button"
                  onClick={jumpToToday}
                >
                  {t("today")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isAdminOwnCalendar ? (
        <button
          type="button"
          aria-label={t("newAppointment")}
          title={t("newAppointment")}
          onClick={openNewEventGlobal}
          className="calendar-floating-button"
        >
          +
        </button>
      ) : null}

      <Modal
        open={open}
        title={
          isAdmin && adminMode === "create-global"
            ? t("newAppointment")
            : selectedDate
            ? fmtDateTitle(selectedDate)
            : t("day")
        }
        onClose={() => setOpen(false)}
        maxWidth={980}
      >
        {isAdminOwnCalendar ? (
          <>
            {apptError && (
              <div
                className="card calendar-status-card calendar-status-card-danger"
                style={{ marginBottom: 12 }}
              >
                <span className="calendar-status-text-danger">{apptError}</span>
              </div>
            )}

            {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
              <div className="card" style={{ padding: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 900 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                    {dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.
                </div>
              </div>
            ) : null}

            <div className="calendar-modal-agenda-head">
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{t("appointments")}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                  {selectedDate
                    ? `${t("appointments")} ${language === "DE" ? "für" : "for"} ${selectedDate}`
                    : t("appointments")}
                </div>
              </div>

              <button
                className="btn"
                type="button"
                onClick={() => {
                  const ymd = toYMDLocal(new Date());
                  setCursor(new Date());
                  setSelectedDate(ymd);
                  setAdminMode("create-from-day");
                  resetAppointmentForm();
                  setApptDate(ymd);
                  void loadAppointmentsForDay(ymd);
                }}
              >
                {t("today")}
              </button>
            </div>

            {apptLoading ? (
              <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                {t("loadingAppointments")}...
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                {t("noAppointmentsForDay")}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {dayAppointments.map((a) => {
                  const cat = categoryMap[a.id] ?? "KUNDE";
                  return (
                    <div
                      key={a.id}
                      className="card calendar-appt-card"
                      style={{
                        padding: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={categoryDotStyle(cat)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="calendar-appt-head">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: 14 }}>
                              {a.startHHMM}–{a.endHHMM}
                            </div>
                            <div
                              style={{
                                fontWeight: 900,
                                fontSize: 16,
                                marginTop: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {a.title}
                            </div>
                          </div>

                          <div className="calendar-appt-actions">
                            <button
                              type="button"
                              onClick={() => editAppointment(a)}
                              disabled={saving}
                              title={t("edit")}
                              className="tenant-icon-button tenant-icon-button-neutral"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteAppointment(a.id)}
                              disabled={saving}
                              title={t("delete")}
                              className="tenant-icon-button tenant-icon-button-danger"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                          <span className={pillClassName()}>{categoryLabel(language, cat)}</span>

                          {a.location ? (
                            <span
                              style={{
                                color: "var(--muted)",
                                fontSize: 13,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              📍 {a.location}
                            </span>
                          ) : null}

                          <span className={pillClassName()}>{a.date}</span>
                        </div>

                        {a.notes ? (
                          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                            📝 {a.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="tenant-divider" />

            <div className="calendar-modal-form-head">
              <div style={{ fontWeight: 900 }}>
                {apptEditingId
                  ? t("editAppointment")
                  : adminMode === "create-global"
                  ? t("newAppointment")
                  : t("enterAppointment")}
              </div>
              {apptEditingId ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    resetAppointmentForm();
                    setAdminMode("create-from-day");
                    setApptDate(selectedDate);
                  }}
                  disabled={saving}
                >
                  {t("cancel")}
                </button>
              ) : null}
            </div>

            {adminMode === "create-global" || adminMode === "edit" ? (
              <div className="calendar-admin-date-field calendar-admin-date-field-compact">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("date")}
             </div>
                <input
                  className="input calendar-admin-date-input calendar-admin-date-input-compact"
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="calendar-admin-date-field calendar-admin-date-field-compact">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("date")}
              </div>
                <div
                  className="calendar-admin-date-display calendar-admin-date-input-compact"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--muted)",
                  }}
                >
                  {selectedDate || "—"}
                </div>
              </div>
            )}

            <div
              className="calendar-form-grid-2 admin-time-grid-mobile-fix"
              style={{ marginTop: 14, marginBottom: 10 }}
            >
              <div className="admin-time-grid-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("start")}
                </div>
                <input
                  className="input"
                  type="time"
                  value={apptStart}
                  onChange={(e) => setApptStart(e.target.value)}
                />
              </div>
              <div className="admin-time-grid-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("end")}
                </div>
                <input
                  className="input"
                  type="time"
                  value={apptEnd}
                  onChange={(e) => setApptEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="calendar-admin-meta-grid" style={{ marginBottom: 10 }}>
              <div className="calendar-admin-meta-item">
                <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                  {t("categoryUiOnly")}
                </div>
                <select
                  className="input calendar-admin-meta-input"
                  value={apptCategory}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "KUNDE" || v === "BAUSTELLE" || v === "INTERN" || v === "PRIVAT") {
                      setApptCategory(v);
                    }
                  }}
                >
                  <option value="KUNDE">{t("customer")}</option>
                  <option value="BAUSTELLE">{t("site")}</option>
                  <option value="INTERN">{t("internal")}</option>
                  <option value="PRIVAT">{t("private")}</option>
                </select>
              </div>

              <div className="calendar-admin-meta-item">
                <div className="label" style={{ marginTop: 14, marginBottom: 10, fontSize: 12, opacity: 0.8 }}>
                  {t("title")}
                </div>
                <input
                  className="input calendar-admin-meta-input"
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  placeholder={t("titlePlaceholder")}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                {t("locationOptional")}
              </div>
              <input
                className="input"
                value={apptLocation}
                onChange={(e) => setApptLocation(e.target.value)}
                placeholder={t("locationPlaceholder")}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                {t("noteOptional")}
              </div>
              <textarea
                className="input"
                value={apptNotes}
                onChange={(e) => setApptNotes(e.target.value)}
                rows={3}
                style={{ resize: "vertical" }}
                placeholder={t("notePlaceholder")}
              />
            </div>

            <button className="btn btn-accent" type="button" onClick={saveAppointment} disabled={saving} style={{ width: "100%" }}>
              {saving ? t("saving") : apptEditingId ? t("saveChanges") : t("save")}
            </button>
          </>
        ) : isAdminViewingEmployee ? (
          <>
            <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.9 }}>
              {t("viewingEmployeeCalendar")}
              {t("viewingEmployeeCalendarHint")}
            </div>

            {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
              <div className="card" style={{ padding: 12, marginTop: 10 }}>
                <div style={{ fontWeight: 900 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                    {dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}
                  </span>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  {t("adminHolidayMarked")}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <div className="label">{t("employeeSchedule")}</div>

              {adminEmployeePlansLoading ? (
                <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                  {t("loadingPlan")}
                </div>
              ) : adminEmployeePlansError ? (
                <div className="card calendar-status-card calendar-status-card-danger">
                  <span className="calendar-status-text-danger">
                    {adminEmployeePlansError}
                  </span>
                </div>
              ) : adminEmployeeDayPlans.length === 0 ? (
                <div className="card" style={{ padding: 12, opacity: 0.85 }}>
                  {t("noScheduleForDay")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {adminEmployeeDayPlans.map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>
                        {p.startHHMM}–{p.endHHMM} · {p.activity}
                      </div>

                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                        {p.location ? `📍 ${p.location}` : t("noLocationGiven")}
                        {typeof p.travelMinutes === "number" && p.travelMinutes > 0
                          ? ` · 🚗 ${p.travelMinutes} ${t("travelMinutes")}`
                          : ""}
                      </div>

                      {p.noteEmployee ? (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          📝 {p.noteEmployee}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedDate ? (
              <div className="card" style={{ padding: 12, marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{t("dayStatus")}</div>

                <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", color: "var(--muted)" }}>
                  {dayMap.get(selectedDate)?.hasPlan ? <span className={pillClassName()}>{t("scheduleExists")}</span> : null}
                  {dayMap.get(selectedDate)?.hasHoliday ? (
                    <span className={pillClassName()} title={dayMap.get(selectedDate)?.holidayName ?? "Gesetzlicher Feiertag"}>
                      {t("holiday")}
                    </span>
                  ) : null}
                  {dayMap.get(selectedDate)?.hasVacation ? (
                    <span className={pillClassName()}>
                      {getAbsenceCompensationSummary(
                        language,
                        monthAbsences.filter(
                          (a) => a.absenceDate === selectedDate && a.type === "VACATION"
                        )
                      ) === "Unbezahlt"
                        ? t("paidVacation")
                        : t("vacation")}
                    </span>
                  ) : null}
                  {dayMap.get(selectedDate)?.hasSick ? <span className={pillClassName()}>{t("sick")}</span> : null}
                </div>

                {!dayMap.get(selectedDate)?.hasPlan &&
                !dayMap.get(selectedDate)?.hasHoliday &&
                !dayMap.get(selectedDate)?.hasVacation &&
                !dayMap.get(selectedDate)?.hasSick ? (
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                    {t("noEntriesForDay")}
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <div className="label">{t("yourSchedule")}</div>

              {plansLoading ? (
                <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                  {t("loadingPlan")}
                </div>
              ) : plansError ? (
                <div className="card calendar-status-card calendar-status-card-danger">
                  <span className="calendar-status-text-danger">{plansError}</span>
                </div>
              ) : dayPlans.length === 0 ? (
                <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                  {t("noScheduleForDay")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayPlans.map((p) => (
                    <div key={p.id} className="card" style={{ padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>
                        {p.startHHMM}–{p.endHHMM} · {p.activity}
                      </div>

                      <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                        {p.location ? `📍 ${p.location}` : t("noLocationGiven")}
                        {typeof p.travelMinutes === "number" && p.travelMinutes > 0
                          ? ` · 🚗 ${p.travelMinutes} ${t("travelMinutes")}`
                          : ""}
                      </div>

                      {p.noteEmployee ? (
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          📝 {p.noteEmployee}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          type="button"
                          onClick={() => syncPlanEntryToWorkEntry(p)}
                        >
                          {t("syncToEntry")}
                        </button>

                        <button
                          className="btn btn-accent"
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/kalender/dokumente/${encodeURIComponent(p.id)}`);
                          }}
                        >
                          {t("documents")}
                        </button>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "var(--muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {t("syncPlanHint")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDate && dayMap.get(selectedDate)?.hasHoliday ? (
                <div style={{ marginTop: 14 }}>
                  <div className="label">{t("publicHoliday")}</div>
                  <div className="card" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 900 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {getHolidayIcon(dayMap.get(selectedDate)?.holidayName ?? null)}
                        {dayMap.get(selectedDate)?.holidayName ?? t("publicHoliday")}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      {t("holidayMarked")}
                    </div>
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 14 }}>
                <div className="label">{t("confirmedAbsence")}</div>

                {confirmedAbsencesForSelectedDay.length === 0 ? (
                  <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                    {t("noConfirmedAbsence")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {confirmedAbsencesForSelectedDay.some((a) => a.type === "VACATION") ? (
                      <div className="card" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>🌴 Urlaub ({selectedDate})</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {t("alreadyConfirmedRegistered")}
                        </div>

                        {getAbsenceCompensationBreakdown(language, confirmedAbsencesForSelectedDay) ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("compensation")} {getAbsenceCompensationBreakdown(language, confirmedAbsencesForSelectedDay)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {confirmedAbsencesForSelectedDay
                      .filter((a) => a.type === "SICK")
                      .map((a) => (
                        <div key={a.id} className="card" style={{ padding: 12 }}>
                          <div style={{ fontWeight: 900 }}>
                            🤒 Krank ({a.dayPortion === "HALF_DAY" ? "0,5 Tag" : "1 Tag"})
                          </div>
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("alreadyConfirmedRegistered")}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="label">Meine Anträge</div>

                {requestBlocksForSelectedDay.length === 0 ? (
                  <div className="card calendar-status-card calendar-status-card-neutral" style={{ opacity: 0.85 }}>
                    {t("noRequestForDay")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {requestBlocksForSelectedDay.map((b) => (
                      <div key={b.id} className="card" style={{ padding: 12 }}>
                        <div style={{ fontWeight: 900 }}>{requestBlockLabel(language, b)}</div>

                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {t("status")} {requestStatusLabel(language, b.status)}
                        </div>

                        {b.type === "VACATION" ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("scope")} {b.dayPortion === "HALF_DAY" ? t("halfVacationDay") : t("fullVacationDay")}
                          </div>
                        ) : null}
                        {b.type === "VACATION" ? (
                          <>
                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              {t("total")} {formatVacationDays((b.paidVacationUnits + b.unpaidVacationUnits) / 2)} {language === "DE" ? "Tage" : language === "EN" ? "days" : language === "IT" ? "giorni" : language === "TR" ? "gün" : language === "SQ" ? "ditë" : "roj"}
                            </div>

                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              {t("compensation")} {getRequestCompensationSummary(
                                language,
                                b.paidVacationUnits,
                                b.unpaidVacationUnits,
                                b.compensation
                              )}
                            </div>
                          </>
                        ) : null}

                        {b.noteEmployee.trim() ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            📝 {b.noteEmployee}
                          </div>
                        ) : null}

                        {b.decidedBy ? (
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                            {t("processedBy")} {b.decidedBy.fullName}
                          </div>
                        ) : null}

                        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button className="btn" type="button" onClick={() => showRequestDetails(b)}>
                            {t("details")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="tenant-divider" style={{ marginTop: 14 }} />
            </div>

            {error && (
              <div
                className="card calendar-status-card calendar-status-card-danger"
                style={{ marginBottom: 12 }}
              >
                <span className="calendar-status-text-danger">{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div className="label">{selectedRequestBlock ? t("requestDetails") : t("requestAbsence")}</div>
              <div className="calendar-form-grid-2 absence-date-grid-mobile-fix">
                <div className="absence-date-grid-item">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                    {t("start")}
                  </div>
                  <input
                    className="input"
                    type="date"
                    value={absenceStart}
                    onChange={(e) => setAbsenceStart(e.target.value)}
                    disabled={!!selectedRequestBlock}
                  />
                </div>

                <div className="absence-date-grid-item">
                  <div className="label" style={{ fontSize: 12, opacity: 0.8 }}>
                    {t("end")}
                  </div>
                  <input
                    className="input"
                    type="date"
                    value={absenceEnd}
                    onChange={(e) => setAbsenceEnd(e.target.value)}
                    disabled={!!selectedRequestBlock}
                  />
                </div>
              </div>
            </div>

            <div className="calendar-form-grid-2" style={{ marginBottom: 12 }}>
              <button
                className={`btn ${absenceType === "VACATION" ? "btn-accent" : ""}`}
                type="button"
                onClick={() => {
                  setAbsenceType("VACATION");
                }}
                disabled={!!selectedRequestBlock}
              >
                {t("absenceTypeVacation")}
              </button>
              <button
                className={`btn ${absenceType === "SICK" ? "btn-danger" : ""}`}
                type="button"
                onClick={() => {
                  setAbsenceType("SICK");
                  setAbsenceDayPortion("FULL_DAY");
                  setAbsenceCompensation("PAID");
                }}
                disabled={!!selectedRequestBlock}
              >
                {t("absenceTypeSick")}
              </button>
            </div>

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">{t("scopeLabel")}</div>
                <div
                  style={{
                    marginTop: 6,
                    marginBottom: 10,
                    fontSize: 12,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {t("scopeHint")}
                </div>
                <div className="calendar-form-grid-2">
                  <button
                    className={`btn ${absenceDayPortion === "FULL_DAY" ? "btn-accent" : ""}`}
                    type="button"
                    onClick={() => setAbsenceDayPortion("FULL_DAY")}
                    disabled={!!selectedRequestBlock}
                  >
                    {t("fullVacationDay")}
                  </button>
                  <button
                    className={`btn ${absenceDayPortion === "HALF_DAY" ? "btn-accent" : ""}`}
                    type="button"
                    onClick={() => {
                      setAbsenceDayPortion("HALF_DAY");
                      setAbsenceEnd(absenceStart);
                    }}
                    disabled={!!selectedRequestBlock || absenceDayPortion === "HALF_DAY"}
                  >
                    {t("halfVacationDay")}
                  </button>
                </div>
              </div>
            ) : null}

            {absenceType === "VACATION" ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">{t("compensationLabel")}</div>

                {!selectedRequestBlock ? (
                  <div
                    className={`card calendar-status-card ${
                      compensationLockedBySystem
                        ? "calendar-status-card-warning"
                        : "calendar-status-card-neutral"
                    }`}
                    style={{
                      marginBottom: 10,
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    {compensationLockedBySystem
                      ? t("compensationLockedHint")
                      : t("compensationFlexibleHint")}
                  </div>
                ) : null}

                {selectedRequestBlock ? (
                  <div
                    className="tenant-soft-panel-strong"
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: "var(--text)",
                    }}
                  >
                    <div>
                      {t("total")} {formatVacationDays(
                        (selectedRequestBlock.paidVacationUnits + selectedRequestBlock.unpaidVacationUnits) / 2
                      )} Tage
                    </div>

                    <div style={{ marginTop: 6, color: "var(--muted)" }}>
                      {getRequestCompensationSummary(
                        language,
                        selectedRequestBlock.paidVacationUnits,
                        selectedRequestBlock.unpaidVacationUnits,
                        selectedRequestBlock.compensation
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="calendar-form-grid-2">
                    <button
                      className={`btn ${absenceCompensation === "PAID" ? "btn-accent" : ""}`}
                      type="button"
                      onClick={() => setAbsenceCompensation("PAID")}
                      disabled={!!selectedRequestBlock || compensationLockedBySystem}
                    >
                      {t("paid")}
                    </button>
                    <button
                      className={`btn ${absenceCompensation === "UNPAID" ? "btn-accent" : ""}`}
                      type="button"
                      onClick={() => setAbsenceCompensation("UNPAID")}
                      disabled={!!selectedRequestBlock || compensationLockedBySystem}
                    >
                      {t("unpaid")}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginBottom: 12 }}>
              <div className="label">{t("noteToAdmin")}</div>
              <textarea
                className="textarea"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                placeholder={t("requestNotePlaceholder")}
                disabled={!!selectedRequestBlock}
              />
            </div>

            {selectedRequestBlock ? (
              <div className="calendar-form-grid-2">
                <button className="btn" type="button" onClick={cancelRequestView} style={{ width: "100%" }}>
                  {t("close")}
                </button>
                <button className="btn btn-accent" type="button" onClick={startNewRequest} style={{ width: "100%" }}>
                  {t("newRequest")}
                </button>
              </div>
            ) : (
              <button
                className="btn btn-accent"
                type="button"
                onClick={saveAbsence}
                disabled={saving}
                style={{ width: "100%" }}
              >
                {saving ? t("saving") : t("sendRequest")}
              </button>
            )}
          </>
        )}
      </Modal>
    </AppShell>
  );
}
export default function KalenderPage(
  props: KalenderPageProps
): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: 16,
            color: "var(--muted)",
          }}
        >
          {translate("DE", "calendarLoadingFallback", KALENDER_DICTIONARY)}
        </div>
      }
    >
      <KalenderPageInner {...props} />
    </Suspense>
  );
}