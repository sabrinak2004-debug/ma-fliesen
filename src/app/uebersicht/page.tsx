"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import { TreePalm, Stethoscope, HandCoins  } from 'lucide-react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBusinessTime } from "@fortawesome/free-solid-svg-icons";
import RemainingVacationIcon from "@/components/icons/RemainingVacationIcon";
import UnpaidIcon from "@/components/icons/UnpaidIcon";


type WorkEntry = {
  id: string;
  workDate: string; // YYYY-MM-DD
  workMinutes: number;
  user?: { id: string; fullName: string };
};

type AbsenceDayPortion = "FULL_DAY" | "HALF_DAY";

type AbsenceCompensation = "PAID" | "UNPAID";

type Absence = {
  id: string;
  absenceDate: string; // YYYY-MM-DD
  type: "VACATION" | "SICK";
  dayPortion: AbsenceDayPortion;
  compensation: AbsenceCompensation;
  user: { id: string; fullName: string };
};

type AbsenceDayGroup = {
  date: string; // YYYY-MM-DD
  items: Absence[];
};

type AbsenceUserSummary = {
  user: { id: string; fullName: string };
  sickDays: number;
  vacationDays: number;
  unpaidVacationDays: number;
  totalDays: number;
};

type AbsencesApiResponse = {
  absences?: Absence[];
  groupsByDay?: AbsenceDayGroup[];
  summaryByUser?: AbsenceUserSummary[];
  range?: { from: string; to: string };
};

type OverviewUserSummary = {
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  entriesCount: number;
  workMinutes: number;
  travelMinutes: number;
  vacationDays: number;
  sickDays: number;
  vacationMinutes: number;
  sickMinutes: number;
  unpaidAbsenceDays: number;
  unpaidAbsenceMinutes: number;
  accruedVacationDays: number;
  usedVacationDaysYtd: number;
  remainingVacationDays: number;
  baseTargetMinutes: number;
  targetMinutes: number;
  netTargetMinutes: number;
  holidayCountInMonth: number;
  holidayMinutes: number;
};

type OverviewTotals = {
  entriesCount: number;
  workMinutes: number;
  travelMinutes: number;
  vacationDays: number;
  sickDays: number;
  vacationMinutes: number;
  sickMinutes: number;
  unpaidAbsenceDays: number;
  unpaidAbsenceMinutes: number;
  accruedVacationDays: number;
  usedVacationDaysYtd: number;
  remainingVacationDays: number;
  baseTargetMinutes: number;
  targetMinutes: number;
  netTargetMinutes: number;
  holidayMinutes: number;
};

type OverviewResponse = {
  month?: string;
  annualVacationDays?: number;
  dailyTargetMinutes?: number;
  workingDaysInMonth?: number;
  byUser?: OverviewUserSummary[];
  totals?: OverviewTotals;
  isAdmin?: boolean;
};

type MeResponse =
  | {
      ok: true;
      session: {
        userId: string;
        fullName: string;
        role: "EMPLOYEE" | "ADMIN";
        language: AppUiLanguage;
        companyId: string;
        companyName: string;
        companySubdomain: string;
        companyLogoUrl: string | null;
        primaryColor: string | null;
      } | null;
    }
  | { ok: false };

type OverviewTextKey =
  | "tasks"
  | "myTasks"
  | "adminExport"
  | "cancel"
  | "startDownload"
  | "exportMonthCsv"
  | "exportYearZip"
  | "exportRangeCsv"
  | "selectMonth"
  | "downloadOneCsvFor"
  | "selectYear"
  | "downloadZipWith12Csvs"
  | "selectRange"
  | "from"
  | "to"
  | "pleaseSelectFromAndTo"
  | "fromDateAfterToDate"
  | "downloadCsvFromTo"
  | "workDetails"
  | "close"
  | "targetGross"
  | "targetNet"
  | "overtimeGross"
  | "overtimeNet"
  | "grossNetExplanation"
  | "monthProgressDetails"
  | "currentWorkTime"
  | "vacationCredited"
  | "sickCredited"
  | "holidayCredited"
  | "holidaysInMonth"
  | "unpaidAbsence"
  | "unpaidAbsenceMinutes"
  | "overview"
  | "dataFor"
  | "year"
  | "month"
  | "workHours"
  | "details"
  | "showWorkDetails"
  | "vacationDays"
  | "daysUnpaid"
  | "remainingVacation"
  | "usedOfConsumed"
  | "annualEntitlement"
  | "sickDays"
  | "monthProgress"
  | "stillUntilTarget"
  | "holidaysConsidered"
  | "showProgressDetails"
  | "absences"
  | "filtered"
  | "searchName"
  | "allTypes"
  | "sick"
  | "vacation"
  | "reset"
  | "resetFilters"
  | "loading"
  | "noAbsencesForFilters"
  | "unpaid"
  | "byEmployee"
  | "entries"
  | "entry"
  | "km"
  | "me"
  | "monthCsv"
  | "yearZip"
  | "rangeCsv"
  | "daysUsed"
  | "daysLabel"
  | "untilMonthlyTarget"
  | "monthlyProgressDetails"
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";

const OVERVIEW_DICTIONARY: Record<OverviewTextKey, Record<AppUiLanguage, string>> = {
  tasks: {
    DE: "Aufgaben",
    EN: "Tasks",
    IT: "Attività",
    TR: "Görevler",
    SQ: "Detyrat",
    KU: "Erk",
    RO: "Sarcini",
  },
  monthCsv: {
    DE: "Monat (CSV)",
    EN: "Month (CSV)",
    IT: "Mese (CSV)",
    TR: "Ay (CSV)",
    SQ: "Muaji (CSV)",
    KU: "Meh (CSV)",
    RO: "Lună (CSV)",
  },
  yearZip: {
    DE: "Jahr (ZIP)",
    EN: "Year (ZIP)",
    IT: "Anno (ZIP)",
    TR: "Yıl (ZIP)",
    SQ: "Viti (ZIP)",
    KU: "Sal (ZIP)",
    RO: "An (ZIP)",
  },
  rangeCsv: {
    DE: "Zeitraum (CSV)",
    EN: "Range (CSV)",
    IT: "Intervallo (CSV)",
    TR: "Aralık (CSV)",
    SQ: "Periudha (CSV)",
    KU: "Navbera demê (CSV)",
    RO: "Interval (CSV)",
  },
  daysUsed: {
    DE: "Tagen verbraucht",
    EN: "days used",
    IT: "giorni utilizzati",
    TR: "gün kullanıldı",
    SQ: "ditë të përdorura",
    KU: "roj hatine bikaranîn",
    RO: "zile folosite",
  },
  daysLabel: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zile",
  },
  untilMonthlyTarget: {
    DE: "bis zum Monatssoll",
    EN: "until the monthly target",
    IT: "fino all'obiettivo mensile",
    TR: "aylık hedefe kadar",
    SQ: "deri te objektivi mujor",
    KU: "heta armanca mehane",
    RO: "până la ținta lunară",
  },
  monthlyProgressDetails: {
    DE: "Details Monatsfortschritt",
    EN: "Monthly progress details",
    IT: "Dettagli avanzamento mensile",
    TR: "Aylık ilerleme detayları",
    SQ: "Detajet e progresit mujor",
    KU: "Hûrguliyên pêşveçûna mehane",
    RO: "Detalii progres lunar",
  },
  january: {
    DE: "Januar",
    EN: "January",
    IT: "Gennaio",
    TR: "Ocak",
    SQ: "Janar",
    KU: "Rêbendan",
    RO: "Ianuarie",
  },
  february: {
    DE: "Februar",
    EN: "February",
    IT: "Febbraio",
    TR: "Şubat",
    SQ: "Shkurt",
    KU: "Reşemî",
    RO: "Februarie",
  },
  march: {
    DE: "März",
    EN: "March",
    IT: "Marzo",
    TR: "Mart",
    SQ: "Mars",
    KU: "Adar",
    RO: "Martie",
  },
  april: {
    DE: "April",
    EN: "April",
    IT: "Aprile",
    TR: "Nisan",
    SQ: "Prill",
    KU: "Nîsan",
    RO: "Aprilie",
  },
  may: {
    DE: "Mai",
    EN: "May",
    IT: "Maggio",
    TR: "Mayıs",
    SQ: "Maj",
    KU: "Gulan",
    RO: "Mai",
  },
  june: {
    DE: "Juni",
    EN: "June",
    IT: "Giugno",
    TR: "Haziran",
    SQ: "Qershor",
    KU: "Hezîran",
    RO: "Iunie",
  },
  july: {
    DE: "Juli",
    EN: "July",
    IT: "Luglio",
    TR: "Temmuz",
    SQ: "Korrik",
    KU: "Tîrmeh",
    RO: "Iulie",
  },
  august: {
    DE: "August",
    EN: "August",
    IT: "Agosto",
    TR: "Ağustos",
    SQ: "Gusht",
    KU: "Tebax",
    RO: "August",
  },
  september: {
    DE: "September",
    EN: "September",
    IT: "Settembre",
    TR: "Eylül",
    SQ: "Shtator",
    KU: "Îlon",
    RO: "Septembrie",
  },
  october: {
    DE: "Oktober",
    EN: "October",
    IT: "Ottobre",
    TR: "Ekim",
    SQ: "Tetor",
    KU: "Cotmeh",
    RO: "Octombrie",
  },
  november: {
    DE: "November",
    EN: "November",
    IT: "Novembre",
    TR: "Kasım",
    SQ: "Nëntor",
    KU: "Mijdar",
    RO: "Noiembrie",
  },
  december: {
    DE: "Dezember",
    EN: "December",
    IT: "Dicembre",
    TR: "Aralık",
    SQ: "Dhjetor",
    KU: "Kanûn",
    RO: "Decembrie",
  },
  myTasks: {
    DE: "Meine Aufgaben",
    EN: "My tasks",
    IT: "Le mie attività",
    TR: "Görevlerim",
    SQ: "Detyrat e mia",
    KU: "Erkên min",
    RO: "Sarcinile mele",
  },
  adminExport: {
    DE: "Export (Admin)",
    EN: "Export (Admin)",
    IT: "Esporta (Admin)",
    TR: "Dışa aktar (Yönetici)",
    SQ: "Eksporto (Admin)",
    KU: "Derxistin (Admin)",
    RO: "Export (Admin)",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    KU: "Betal bike",
    RO: "Anulează",
  },
  startDownload: {
    DE: "Download starten",
    EN: "Start download",
    IT: "Avvia download",
    TR: "İndirmeyi başlat",
    SQ: "Nis shkarkimin",
    KU: "Daxistinê dest pê bike",
    RO: "Începe descărcarea",
  },
  exportMonthCsv: {
    DE: "Monat (CSV)",
    EN: "Month (CSV)",
    IT: "Mese (CSV)",
    TR: "Ay (CSV)",
    SQ: "Muaji (CSV)",
    KU: "Meh (CSV)",
    RO: "Lună (CSV)",
  },
  exportYearZip: {
    DE: "Jahr (ZIP)",
    EN: "Year (ZIP)",
    IT: "Anno (ZIP)",
    TR: "Yıl (ZIP)",
    SQ: "Viti (ZIP)",
    KU: "Sal (ZIP)",
    RO: "An (ZIP)",
  },
  exportRangeCsv: {
    DE: "Zeitraum (CSV)",
    EN: "Range (CSV)",
    IT: "Intervallo (CSV)",
    TR: "Aralık (CSV)",
    SQ: "Periudha (CSV)",
    KU: "Navbera demê (CSV)",
    RO: "Interval (CSV)",
  },
  selectMonth: {
    DE: "Monat auswählen",
    EN: "Select month",
    IT: "Seleziona mese",
    TR: "Ay seçin",
    SQ: "Zgjidh muajin",
    KU: "Meh hilbijêre",
    RO: "Selectează luna",
  },
  downloadOneCsvFor: {
    DE: "Download: eine CSV für",
    EN: "Download: one CSV for",
    IT: "Download: un CSV per",
    TR: "İndirme: şu ay için bir CSV",
    SQ: "Shkarkim: një CSV për",
    KU: "Daxistin: CSVek ji bo",
    RO: "Download: un CSV pentru",
  },
  selectYear: {
    DE: "Jahr auswählen",
    EN: "Select year",
    IT: "Seleziona anno",
    TR: "Yıl seçin",
    SQ: "Zgjidh vitin",
    KU: "Sal hilbijêre",
    RO: "Selectează anul",
  },
  downloadZipWith12Csvs: {
    DE: "Download: ZIP mit 12 CSVs (pro Monat eine Datei)",
    EN: "Download: ZIP with 12 CSVs (one file per month)",
    IT: "Download: ZIP con 12 CSV (un file per mese)",
    TR: "İndirme: 12 CSV içeren ZIP (her ay için bir dosya)",
    SQ: "Shkarkim: ZIP me 12 CSV (nga një skedar për muaj)",
    KU: "Daxistin: ZIP bi 12 CSV-an (her meh pelekek)",
    RO: "Download: ZIP cu 12 CSV-uri (un fișier per lună)",
  },
  selectRange: {
    DE: "Zeitraum auswählen",
    EN: "Select range",
    IT: "Seleziona intervallo",
    TR: "Aralık seçin",
    SQ: "Zgjidh periudhën",
    KU: "Navbera demê hilbijêre",
    RO: "Selectează intervalul",
  },
  from: {
    DE: "Von",
    EN: "From",
    IT: "Da",
    TR: "Başlangıç",
    SQ: "Nga",
    KU: "Ji",
    RO: "De la",
  },
  to: {
    DE: "Bis",
    EN: "To",
    IT: "A",
    TR: "Bitiş",
    SQ: "Deri",
    KU: "Heta",
    RO: "Până la",
  },
  pleaseSelectFromAndTo: {
    DE: "Bitte Von und Bis auswählen.",
    EN: "Please select both from and to.",
    IT: "Seleziona data iniziale e finale.",
    TR: "Lütfen başlangıç ve bitiş tarihini seçin.",
    SQ: "Zgjidh datën nga dhe deri.",
    KU: "Ji kerema xwe destpêk û dawiyê hilbijêre.",
    RO: "Vă rugăm să selectați atât data de început, cât și data de sfârșit.",
  },
  fromDateAfterToDate: {
    DE: "Von-Datum darf nicht nach dem Bis-Datum liegen.",
    EN: "The start date must not be after the end date.",
    IT: "La data iniziale non può essere dopo la data finale.",
    TR: "Başlangıç tarihi bitiş tarihinden sonra olamaz.",
    SQ: "Data e fillimit nuk mund të jetë pas datës së mbarimit.",
    KU: "Dîroka destpêkê nikare piştî dîroka dawiyê be.",
    RO: "Data de început nu poate fi după data de sfârșit.",
  },
  downloadCsvFromTo: {
    DE: "Download: CSV für",
    EN: "Download: CSV for",
    IT: "Download: CSV per",
    TR: "İndirme: CSV",
    SQ: "Shkarkim: CSV për",
    KU: "Daxistin: CSV ji bo",
    RO: "Download: CSV pentru",
  },
  workDetails: {
    DE: "Details Arbeitsstunden",
    EN: "Work hour details",
    IT: "Dettagli ore di lavoro",
    TR: "Çalışma saati detayları",
    SQ: "Detajet e orëve të punës",
    KU: "Hûrguliyên demjimêrên karê",
    RO: "Detalii ore de lucru",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
    RO: "Închide",
  },
  targetGross: {
    DE: "Soll (Brutto):",
    EN: "Target (gross):",
    IT: "Obiettivo (lordo):",
    TR: "Hedef (brüt):",
    SQ: "Objektivi (bruto):",
    KU: "Armanc (berî derxistin):",
    RO: "Țintă (brut):",
  },
  targetNet: {
    DE: "Soll (Netto):",
    EN: "Target (net):",
    IT: "Obiettivo (netto):",
    TR: "Hedef (net):",
    SQ: "Objektivi (neto):",
    KU: "Armanc (safî):",
    RO: "Țintă (net):",
  },
  overtimeGross: {
    DE: "Überstunden (Brutto):",
    EN: "Overtime (gross):",
    IT: "Straordinari (lordo):",
    TR: "Fazla mesai (brüt):",
    SQ: "Orë shtesë (bruto):",
    KU: "Demjimarên zêde (berî derxistin):",
    RO: "Ore suplimentare (brut):",
  },
  overtimeNet: {
    DE: "Überstunden (Netto):",
    EN: "Overtime (net):",
    IT: "Straordinari (netto):",
    TR: "Fazla mesai (net):",
    SQ: "Orë shtesë (neto):",
    KU: "Demjimarên zêde (safî):",
    RO: "Ore suplimentare (net):",
  },
  grossNetExplanation: {
    DE: "Brutto ist das reguläre Monatssoll ohne Urlaub, Krankheit und Feiertage. Netto ist das reduzierte Monatssoll, bei dem bezahlte Urlaubstage, Krankheitstage und Feiertage vom Brutto-Soll abgezogen werden.",
    EN: "Gross is the regular monthly target without vacation, sickness, and public holidays. Net is the reduced monthly target with paid vacation, sick days, and public holidays deducted from the gross target.",
    IT: "Lordo è l'obiettivo mensile regolare senza ferie, malattia e festivi. Netto è l'obiettivo mensile ridotto, in cui ferie retribuite, malattia e festivi vengono sottratti dall'obiettivo lordo.",
    TR: "Brüt, tatil, hastalık ve resmî tatiller olmadan normal aylık hedeftir. Net ise ücretli izin, hastalık günleri ve resmî tatiller düşüldükten sonraki azaltılmış aylık hedeftir.",
    SQ: "Bruto është objektivi normal mujor pa pushime, sëmundje dhe festa zyrtare. Neto është objektivi i reduktuar mujor pasi zbriten pushimet e paguara, ditët e sëmundjes dhe festat zyrtare.",
    KU: "Armanca berî derxistin armanca asayî ya mehanî ye bê bêhnvedan, nexweşî û cejnên fermî. Armanca safî armanca kêmkirî ya mehanî ye ku tê de bêhnvedanên bi mûçe, rojên nexweşiyê û cejnên fermî ji armanca berî derxistin tên jêbirin.",
    RO: "Brut este ținta lunară regulată fără vacanță, boală și sărbători legale. Net este ținta lunară redusă, cu zilele de vacanță plătite, zilele de boală și sărbătorile legale deduse din ținta brută.",
  },
  monthProgressDetails: {
    DE: "Details Monatsfortschritt",
    EN: "Monthly progress details",
    IT: "Dettagli avanzamento mensile",
    TR: "Aylık ilerleme detayları",
    SQ: "Detajet e progresit mujor",
    KU: "Hûrguliyên pêşveçûna mehane",
    RO: "Detalii progres lunar",
  },
  currentWorkTime: {
    DE: "Arbeitszeit aktuell:",
    EN: "Current work time:",
    IT: "Orario di lavoro attuale:",
    TR: "Güncel çalışma süresi:",
    SQ: "Koha aktuale e punës:",
    KU: "Dema karê ya niha:",
    RO: "Timp de lucru actual:",
  },
  vacationCredited: {
    DE: "Urlaub angerechnet:",
    EN: "Vacation credited:",
    IT: "Ferie conteggiate:",
    TR: "İzin hesaba katıldı:",
    SQ: "Pushimi i llogaritur:",
    KU: "Bêhnvedan hat hesibandin:",
    RO: "Vacanță creditată:",
  },
  sickCredited: {
    DE: "Krankheit angerechnet:",
    EN: "Sick leave credited:",
    IT: "Malattia conteggiata:",
    TR: "Hastalık hesaba katıldı:",
    SQ: "Sëmundja e llogaritur:",
    KU: "Nexweşî hat hesibandin:",
    RO: "Concediu de îngrijire medicală creditat:",
  },
  holidayCredited: {
    DE: "Feiertage angerechnet:",
    EN: "Public holidays credited:",
    IT: "Festivi conteggiati:",
    TR: "Resmî tatiller hesaba katıldı:",
    SQ: "Festat zyrtare të llogaritura:",
    KU: "Cejnên fermî hatin hesibandin:",
    RO: "Sărbători legale creditate:",
  },
  holidaysInMonth: {
    DE: "Feiertage im Monat:",
    EN: "Public holidays in month:",
    IT: "Festivi nel mese:",
    TR: "Ay içindeki resmî tatiller:",
    SQ: "Festat zyrtare në muaj:",
    KU: "Cejnên fermî di mehê de:",
    RO: "Sărbători legale în lună:",
  },
  unpaidAbsence: {
    DE: "Unbezahlte Abwesenheit:",
    EN: "Unpaid absence:",
    IT: "Assenza non retribuita:",
    TR: "Ücretsiz devamsızlık:",
    SQ: "Mungesë e papaguar:",
    KU: "Nebûna bê mûçe:",
    RO: "Absență neplătită:",
  },
  unpaidAbsenceMinutes: {
    DE: "Unbezahlte Abwesenheit (Minuten):",
    EN: "Unpaid absence (minutes):",
    IT: "Assenza non retribuita (minuti):",
    TR: "Ücretsiz devamsızlık (dakika):",
    SQ: "Mungesë e papaguar (minuta):",
    KU: "Nebûna bê mûçe (deqîqe):",
    RO: "Absență neplătită (minute):",
  },
  overview: {
    DE: "Übersicht",
    EN: "Overview",
    IT: "Panoramica",
    TR: "Genel bakış",
    SQ: "Përmbledhje",
    KU: "Nêrîn",
    RO: "Prezentare generală",
  },
  dataFor: {
    DE: "Daten für",
    EN: "Data for",
    IT: "Dati per",
    TR: "Veriler:",
    SQ: "Të dhënat për",
    KU: "Daneyên ji bo",
    RO: "Date pentru",
  },
  year: {
    DE: "Jahr",
    EN: "Year",
    IT: "Anno",
    TR: "Yıl",
    SQ: "Viti",
    KU: "Sal",
    RO: "An",
  },
  month: {
    DE: "Monat",
    EN: "Month",
    IT: "Mese",
    TR: "Ay",
    SQ: "Muaji",
    KU: "Meh",
    RO: "Lună",
  },
  workHours: {
    DE: "Arbeitsstunden",
    EN: "Work hours",
    IT: "Ore di lavoro",
    TR: "Çalışma saatleri",
    SQ: "Orët e punës",
    KU: "Demjimêrên karê",
    RO: "Ore de lucru",
  },
  details: {
    DE: "Details",
    EN: "Details",
    IT: "Dettagli",
    TR: "Detaylar",
    SQ: "Detaje",
    KU: "Hûrgulî",
    RO: "Detalii",
  },
  showWorkDetails: {
    DE: "Details zu Arbeitsstunden anzeigen",
    EN: "Show work hour details",
    IT: "Mostra dettagli ore di lavoro",
    TR: "Çalışma saati detaylarını göster",
    SQ: "Shfaq detajet e orëve të punës",
    KU: "Hûrguliyên demjimêrên karê nîşan bide",
    RO: "Afișează detaliile orelor de lucru",
  },
  vacationDays: {
    DE: "Urlaubstage",
    EN: "Vacation days",
    IT: "Giorni di ferie",
    TR: "İzin günleri",
    SQ: "Ditët e pushimit",
    KU: "Rojên bêhnvedanê",
    RO: "Zile de vacanță",
  },
  daysUnpaid: {
    DE: "Tage unbezahlt",
    EN: "days unpaid",
    IT: "giorni non retribuiti",
    TR: "gün ücretsiz",
    SQ: "ditë të papaguara",
    KU: "roj bê mûçe",
    RO: "zile neplătite",
  },
  remainingVacation: {
    DE: "Resturlaub",
    EN: "Remaining vacation",
    IT: "Ferie residue",
    TR: "Kalan izin",
    SQ: "Pushimi i mbetur",
    KU: "Bêhnvedana mayî",
    RO: "Vacanță rămasă",
  },
  usedOfConsumed: {
    DE: "von",
    EN: "of",
    IT: "di",
    TR: " / ",
    SQ: "nga",
    KU: "ji",
    RO: "din",
  },
  annualEntitlement: {
    DE: "Jahresanspruch:",
    EN: "Annual entitlement:",
    IT: "Diritto annuale:",
    TR: "Yıllık hak:",
    SQ: "E drejta vjetore:",
    KU: "Mafê salane:",
    RO: "Drept anual:",
  },
  sickDays: {
    DE: "Krankheitstage",
    EN: "Sick days",
    IT: "Giorni di malattia",
    TR: "Hastalık günleri",
    SQ: "Ditët e sëmundjes",
    KU: "Rojên nexweşiyê",
    RO: "Zile de boală",
  },
  monthProgress: {
    DE: "Monatsfortschritt",
    EN: "Monthly progress",
    IT: "Avanzamento mensile",
    TR: "Aylık ilerleme",
    SQ: "Progresi mujor",
    KU: "Pêşveçûna mehane",
    RO: "Progres lunar",
  },
  stillUntilTarget: {
    DE: "Noch",
    EN: "Still",
    IT: "Ancora",
    TR: "Kalan",
    SQ: "Edhe",
    KU: "Hê",
    RO: "Încă",
  },
  holidaysConsidered: {
    DE: "Feiertage berücksichtigt",
    EN: "public holidays considered",
    IT: "festivi considerati",
    TR: "resmî tatiller dikkate alındı",
    SQ: "festat zyrtare të përfshira",
    KU: "cejnên fermî hatin hesibandin",
    RO: "sărbători legale considerate",
  },
  showProgressDetails: {
    DE: "Details zum Monatsfortschritt anzeigen",
    EN: "Show monthly progress details",
    IT: "Mostra dettagli avanzamento mensile",
    TR: "Aylık ilerleme detaylarını göster",
    SQ: "Shfaq detajet e progresit mujor",
    KU: "Hûrguliyên pêşveçûna mehane nîşan bide",
    RO: "Afișează detaliile progresului lunar",
  },
  absences: {
    DE: "Abwesenheiten",
    EN: "Absences",
    IT: "Assenze",
    TR: "Devamsızlıklar",
    SQ: "Mungesat",
    KU: "Nebûn",
    RO: "Absențe",
  },
  filtered: {
    DE: "Gefiltert",
    EN: "Filtered",
    IT: "Filtrato",
    TR: "Filtrelenmiş",
    SQ: "Filtruar",
    KU: "Parzûnkirî",
    RO: "Filtrat",
  },
  searchName: {
    DE: "Name suchen…",
    EN: "Search name…",
    IT: "Cerca nome…",
    TR: "İsim ara…",
    SQ: "Kërko emrin…",
    KU: "Nav bigere…",
    RO: "Caută nume…",
  },
  allTypes: {
    DE: "Alle Typen",
    EN: "All types",
    IT: "Tutti i tipi",
    TR: "Tüm türler",
    SQ: "Të gjitha llojet",
    KU: "Hemû cure",
    RO: "Toate tipurile",
  },
  sick: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malattia",
    TR: "Hasta",
    SQ: "I sëmurë",
    KU: "Nexweş",
    RO: "Bolnav",
  },
  vacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Bêhnvedan",
    RO: "Vacanță",
  },
  reset: {
    DE: "Reset",
    EN: "Reset",
    IT: "Reimposta",
    TR: "Sıfırla",
    SQ: "Rivendos",
    KU: "Vesaz bike",
    RO: "Resetare",
  },
  resetFilters: {
    DE: "Filter zurücksetzen",
    EN: "Reset filters",
    IT: "Reimposta filtri",
    TR: "Filtreleri sıfırla",
    SQ: "Rivendos filtrat",
    KU: "Parzûnan vesaz bike",
    RO: "Resetează filtrele",
  },
  loading: {
    DE: "Lade...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
    RO: "Se încarcă...",
  },
  noAbsencesForFilters: {
    DE: "Keine Abwesenheiten für diese Filter.",
    EN: "No absences for these filters.",
    IT: "Nessuna assenza per questi filtri.",
    TR: "Bu filtreler için devamsızlık yok.",
    SQ: "Nuk ka mungesa për këta filtra.",
    KU: "Ji bo van parzûnan nebûn tune ne.",
    RO: "Nu există absențe pentru aceste filtre.",
  },
  unpaid: {
    DE: "unbezahlt",
    EN: "unpaid",
    IT: "non retribuito",
    TR: "ücretsiz",
    SQ: "i papaguar",
    KU: "bê mûçe",
    RO: "neplătit",
  },
  byEmployee: {
    DE: "Nach Mitarbeiter",
    EN: "By employee",
    IT: "Per dipendente",
    TR: "Çalışana göre",
    SQ: "Sipas punonjësit",
    KU: "Li gorî karmend",
    RO: "După angajat",
  },
  entries: {
    DE: "Einträge",
    EN: "entries",
    IT: "voci",
    TR: "kayıt",
    SQ: "regjistrime",
    KU: "tomar",
    RO: "înregistrări",
  },
  entry: {
    DE: "Eintrag",
    EN: "entry",
    IT: "voce",
    TR: "kayıt",
    SQ: "regjistrim",
    KU: "tomar",
    RO: "înregistrare",
  },
  km: {
    DE: "km",
    EN: "km",
    IT: "km",
    TR: "km",
    SQ: "km",
    KU: "km",
    RO: "km",
  },
  me: {
    DE: "Ich",
    EN: "Me",
    IT: "Io",
    TR: "Ben",
    SQ: "Unë",
    KU: "Ez",
    RO: "Eu",
  },
};

function isOverviewResponse(x: unknown): x is OverviewResponse {
  return typeof x === "object" && x !== null;
}

function isAbsencesApiResponse(x: unknown): x is AbsencesApiResponse {
  return typeof x === "object" && x !== null;
}

function formatMinutesAsHM(minutes: number): string {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}min`;
}


function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0);
  return String(last.getDate()).padStart(2, "0");
}

function currentYear(): string {
  return String(new Date().getFullYear());
}
function currentMonth(): MonthOption {
  return String(new Date().getMonth() + 1).padStart(2, "0") as MonthOption;
}

function buildYm(year: string, month: string): string {
  return `${year}-${month}`;
}

const MONTH_OPTIONS: Array<{ value: MonthOption; labelKey: OverviewTextKey }> = [
  { value: "01", labelKey: "january" },
  { value: "02", labelKey: "february" },
  { value: "03", labelKey: "march" },
  { value: "04", labelKey: "april" },
  { value: "05", labelKey: "may" },
  { value: "06", labelKey: "june" },
  { value: "07", labelKey: "july" },
  { value: "08", labelKey: "august" },
  { value: "09", labelKey: "september" },
  { value: "10", labelKey: "october" },
  { value: "11", labelKey: "november" },
  { value: "12", labelKey: "december" },
];

type ExportMode = "MONTH" | "YEAR" | "RANGE";

function formatDateLocalized(language: AppUiLanguage, yyyyMmDd: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd;

  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  const locale =
    language === "DE"
      ? "de-DE"
      : language === "EN"
        ? "en-GB"
        : language === "IT"
          ? "it-IT"
          : language === "TR"
            ? "tr-TR"
            : language === "SQ"
              ? "sq-AL"
              : language === "KU"
                ? "ku-TR"
                : language === "RO"
                  ? "ro-RO"
                  : "en-GB";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function typeLabel(
  language: AppUiLanguage,
  t: "VACATION" | "SICK",
  compensation?: AbsenceCompensation
) {
  if (t === "SICK") return translate(language, "sick", OVERVIEW_DICTIONARY);
  return compensation === "UNPAID"
    ? `${translate(language, "vacation", OVERVIEW_DICTIONARY)} (${translate(language, "unpaid", OVERVIEW_DICTIONARY)})`
    : translate(language, "vacation", OVERVIEW_DICTIONARY);
}

function typeColor(t: "VACATION" | "SICK") {
  return t === "SICK" ? "rgba(224, 75, 69, 0.95)" : "rgba(90, 167, 255, 0.95)";
}

function badgeStyle(t: "VACATION" | "SICK"): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${t === "SICK" ? "rgba(224, 75, 69, 0.35)" : "rgba(90, 167, 255, 0.35)"}`,
    background: t === "SICK" ? "rgba(224, 75, 69, 0.10)" : "rgba(90, 167, 255, 0.10)",
    color: "rgba(255,255,255,0.92)",
    whiteSpace: "nowrap",
  };
}

type AbsFilterType = "ALL" | "SICK" | "VACATION";
type MonthOption =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12";

function toUTCDateFromISO(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

type AbsenceBlock = {
  user: { id: string; fullName: string };
  type: "VACATION" | "SICK";
  compensation: AbsenceCompensation;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  days: number;
  dayPortion: AbsenceDayPortion;
};

function absenceDayValue(dayPortion: AbsenceDayPortion): number {
  return dayPortion === "HALF_DAY" ? 0.5 : 1;
}

function formatDayCountLocalized(language: AppUiLanguage, days: number): string {
  const value = Number.isInteger(days) ? String(days) : String(days).replace(".", ",");

  switch (language) {
    case "EN":
      return `${String(days).replace(",", ".")} ${days === 1 ? "day" : "days"}`;
    case "IT":
      return `${value} ${days === 1 ? "giorno" : "giorni"}`;
    case "TR":
      return `${String(days).replace(",", ".")} gün`;
    case "SQ":
      return `${value} ${days === 1 ? "ditë" : "ditë"}`;
    case "KU":
      return `${String(days).replace(",", ".")} roj`;
    case "RO":
      return `${value} ${days === 1 ? "zi" : "zile"}`;
    case "DE":
    default:
      if (days === 0.5) return "0,5 Tag";
      if (Number.isInteger(days)) return `${days} ${days === 1 ? "Tag" : "Tage"}`;
      return `${value} Tage`;
  }
}

function buildBlocksForSingleUser(sortedAbsences: Absence[]): AbsenceBlock[] {
  const res: AbsenceBlock[] = [];
  if (sortedAbsences.length === 0) return res;

  const user = sortedAbsences[0].user;

  let curType: Absence["type"] = sortedAbsences[0].type;
  let curCompensation: AbsenceCompensation = sortedAbsences[0].compensation;
  let curDayPortion: AbsenceDayPortion = sortedAbsences[0].dayPortion;
  let curFrom = sortedAbsences[0].absenceDate;
  let curTo = sortedAbsences[0].absenceDate;
  let curDays = absenceDayValue(sortedAbsences[0].dayPortion);

  const isNextDay = (prev: string, next: string) => {
  const p = toUTCDateFromISO(prev);
    p.setUTCDate(p.getUTCDate() + 1);

    const y = p.getUTCFullYear();
    const m = String(p.getUTCMonth() + 1).padStart(2, "0");
    const d = String(p.getUTCDate()).padStart(2, "0");

    return `${y}-${m}-${d}` === next;
  };

  for (let i = 1; i < sortedAbsences.length; i++) {
    const a = sortedAbsences[i];

    if (a.user.id !== user.id) {
      res.push({
        user,
        type: curType,
        compensation: curCompensation,
        from: curFrom,
        to: curTo,
        days: curDays,
        dayPortion: curDayPortion,
      });

      curType = a.type;
      curCompensation = a.compensation;
      curDayPortion = a.dayPortion;
      curFrom = a.absenceDate;
      curTo = a.absenceDate;
      curDays = absenceDayValue(a.dayPortion);
      continue;
    }

    const mayMergeFullDays =
      curDayPortion === "FULL_DAY" &&
      a.dayPortion === "FULL_DAY" &&
      a.type === curType &&
      a.compensation === curCompensation &&
      isNextDay(curTo, a.absenceDate);

    if (mayMergeFullDays) {
      curTo = a.absenceDate;
      curDays += 1;
      continue;
    }

    res.push({
      user,
      type: curType,
      compensation: curCompensation,
      from: curFrom,
      to: curTo,
      days: curDays,
      dayPortion: curDayPortion,
    });

    curType = a.type;
    curCompensation = a.compensation;
    curDayPortion = a.dayPortion;
    curFrom = a.absenceDate;
    curTo = a.absenceDate;
    curDays = absenceDayValue(a.dayPortion);
  }

  res.push({
    user,
    type: curType,
    compensation: curCompensation,
    from: curFrom,
    to: curTo,
    days: curDays,
    dayPortion: curDayPortion,
  });

  return res;
}

export default function UebersichtPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = (key: OverviewTextKey): string => translate(language, key, OVERVIEW_DICTIONARY);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [absenceSummaryByUser, setAbsenceSummaryByUser] = useState<AbsenceUserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [remainingVacationDays, setRemainingVacationDays] = useState<number>(0);
  const [accruedVacationDays, setAccruedVacationDays] = useState<number>(0);
  const [annualVacationDays, setAnnualVacationDays] = useState<number>(30);
  const [usedVacationDaysYtd, setUsedVacationDaysYtd] = useState<number>(0);
  const [targetMinutes, setTargetMinutes] = useState<number>(0);
  const [netTargetMinutes, setNetTargetMinutes] = useState<number>(0);
  const [baseTargetMinutes, setBaseTargetMinutes] = useState<number>(0);
  const [holidayCountInMonth, setHolidayCountInMonth] = useState<number>(0);
  const [holidayMinutes, setHolidayMinutes] = useState<number>(0);
  const [vacationMinutesInfo, setVacationMinutesInfo] = useState<number>(0);
  const [sickMinutesInfo, setSickMinutesInfo] = useState<number>(0);
  const [unpaidAbsenceDays, setUnpaidAbsenceDays] = useState<number>(0);
  const [unpaidAbsenceMinutes, setUnpaidAbsenceMinutes] = useState<number>(0);

  const [selectedYear, setSelectedYear] = useState<string>(currentYear());
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(currentMonth());

  const ym = useMemo(() => buildYm(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const selectedMonthLabel = t(
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.labelKey ?? "january"
  );
  // ===== Export Modal State =====
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("MONTH");

  const [exportMonth, setExportMonth] = useState<string>(ym);
  const [exportYear, setExportYear] = useState<string>(currentYear());

  const [rangeFrom, setRangeFrom] = useState<string>(`${ym}-01`);
  const [rangeTo, setRangeTo] = useState<string>(`${ym}-${lastDayOfMonth(ym)}`);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: string[] = [];
    for (let y = now - 2; y <= now + 1; y++) arr.push(String(y));
    return arr;
  }, []);

  // ✅ Abwesenheiten Filter State
  const [absQuery, setAbsQuery] = useState<string>("");
  const [absType, setAbsType] = useState<AbsFilterType>("ALL");
  const [workDetailsOpen, setWorkDetailsOpen] = useState(false);
  const [progressDetailsOpen, setProgressDetailsOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = (await response.json()) as MeResponse;

        if (!alive) return;

        if (data.ok && data.session?.language) {
          setLanguage(data.session.language);
        }
      } catch {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [re, ra, ro] = await Promise.all([
          fetch(`/api/entries?month=${encodeURIComponent(ym)}`),
          fetch(`/api/absences?month=${encodeURIComponent(ym)}`),
          fetch(`/api/overview?month=${encodeURIComponent(ym)}`),
        ]);

        const je = (await re.json()) as unknown;
        const ja = (await ra.json()) as unknown;
        const jo = (await ro.json()) as unknown;

        const e =
          typeof je === "object" &&
          je !== null &&
          "entries" in je &&
          Array.isArray((je as { entries: unknown }).entries)
            ? (((je as { entries: WorkEntry[] }).entries ?? []) as WorkEntry[])
            : [];

        let a: Absence[] = [];
        let summary: AbsenceUserSummary[] = [];

        if (isAbsencesApiResponse(ja)) {
          const r = ja as AbsencesApiResponse;
          a = Array.isArray(r.absences) ? r.absences : [];
          summary = Array.isArray(r.summaryByUser) ? r.summaryByUser : [];
        }

        setEntries(e);
        setAbsences(a);
        setAbsenceSummaryByUser(summary);

        if (isOverviewResponse(jo)) {
          setIsAdmin(Boolean(jo.isAdmin));

          const nextAnnualVacationDays =
            typeof jo.annualVacationDays === "number" && Number.isFinite(jo.annualVacationDays)
              ? jo.annualVacationDays
              : 30;

          setAnnualVacationDays(nextAnnualVacationDays);

          if (Array.isArray(jo.byUser) && jo.byUser.length > 0) {
            const firstUser = jo.byUser[0];

            setUsedVacationDaysYtd(
              typeof firstUser.usedVacationDaysYtd === "number" && Number.isFinite(firstUser.usedVacationDaysYtd)
                ? firstUser.usedVacationDaysYtd
                : 0
            );
            setAccruedVacationDays(
              typeof firstUser.accruedVacationDays === "number" && Number.isFinite(firstUser.accruedVacationDays)
                ? firstUser.accruedVacationDays
                : 0
            );

            setRemainingVacationDays(
              typeof firstUser.remainingVacationDays === "number" && Number.isFinite(firstUser.remainingVacationDays)
                ? firstUser.remainingVacationDays
                : 0
            );

            setBaseTargetMinutes(
              typeof firstUser.baseTargetMinutes === "number" && Number.isFinite(firstUser.baseTargetMinutes)
                ? firstUser.baseTargetMinutes
                : 0
            );

            setTargetMinutes(
              typeof firstUser.targetMinutes === "number" && Number.isFinite(firstUser.targetMinutes)
                ? firstUser.targetMinutes
                : 0
            );

            setNetTargetMinutes(
              typeof firstUser.netTargetMinutes === "number" && Number.isFinite(firstUser.netTargetMinutes)
                ? firstUser.netTargetMinutes
                : 0
            );

            setHolidayCountInMonth(
              typeof firstUser.holidayCountInMonth === "number" && Number.isFinite(firstUser.holidayCountInMonth)
                ? firstUser.holidayCountInMonth
                : 0
            );

            setHolidayMinutes(
              typeof firstUser.holidayMinutes === "number" && Number.isFinite(firstUser.holidayMinutes)
                ? firstUser.holidayMinutes
                : 0
            );

            setVacationMinutesInfo(
              typeof firstUser.vacationMinutes === "number" && Number.isFinite(firstUser.vacationMinutes)
                ? firstUser.vacationMinutes
                : 0
            );

            setSickMinutesInfo(
              typeof firstUser.sickMinutes === "number" && Number.isFinite(firstUser.sickMinutes)
                ? firstUser.sickMinutes
                : 0
            );

            setUnpaidAbsenceDays(
              typeof firstUser.unpaidAbsenceDays === "number" && Number.isFinite(firstUser.unpaidAbsenceDays)
                ? firstUser.unpaidAbsenceDays
                : 0
            );

            setUnpaidAbsenceMinutes(
              typeof firstUser.unpaidAbsenceMinutes === "number" && Number.isFinite(firstUser.unpaidAbsenceMinutes)
                ? firstUser.unpaidAbsenceMinutes
                : 0
            );
          } else {
            setAccruedVacationDays(0);
            setUsedVacationDaysYtd(0);
            setRemainingVacationDays(0);
            setBaseTargetMinutes(0);
            setTargetMinutes(0);
            setNetTargetMinutes(0);
            setHolidayCountInMonth(0);
            setHolidayMinutes(0);
            setVacationMinutesInfo(0);
            setSickMinutesInfo(0);
            setUnpaidAbsenceDays(0);
            setUnpaidAbsenceMinutes(0);
          }
        } else {
          setIsAdmin(false);
          setAnnualVacationDays(30);
          setAccruedVacationDays(0);
          setUsedVacationDaysYtd(0);
          setRemainingVacationDays(0);
          setBaseTargetMinutes(0);
          setTargetMinutes(0);
          setNetTargetMinutes(0);
          setHolidayCountInMonth(0);
          setHolidayMinutes(0);
          setVacationMinutesInfo(0);
          setSickMinutesInfo(0);
          setUnpaidAbsenceDays(0);
          setUnpaidAbsenceMinutes(0);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ym]);
  
  useEffect(() => {
    if (isAdmin) router.replace("/admin/dashboard");
  }, [isAdmin, router]);

  const monthEntries = useMemo(() => entries.filter((e) => e.workDate?.startsWith(ym)), [entries, ym]);
  const monthAbsences = useMemo(() => absences.filter((a) => a.absenceDate?.startsWith(ym)), [absences, ym]);

  const totalMinutes = useMemo(
    () => monthEntries.reduce((s, e) => s + (Number.isFinite(e.workMinutes) ? e.workMinutes : 0), 0),
    [monthEntries]
  );



  const vacDays = useMemo(() => {
    if (absenceSummaryByUser.length > 0) {
      return absenceSummaryByUser.reduce((s, u) => s + (Number.isFinite(u.vacationDays) ? u.vacationDays : 0), 0);
    }
    return monthAbsences.filter((a) => a.type === "VACATION").length;
  }, [absenceSummaryByUser, monthAbsences]);

  const sickDays = useMemo(() => {
    if (absenceSummaryByUser.length > 0) {
      return absenceSummaryByUser.reduce((s, u) => s + (Number.isFinite(u.sickDays) ? u.sickDays : 0), 0);
    }
    return monthAbsences.filter((a) => a.type === "SICK").length;
  }, [absenceSummaryByUser, monthAbsences]);

  const unpaidVacationDaysValue = useMemo(() => {
    if (absenceSummaryByUser.length > 0) {
      return absenceSummaryByUser.reduce(
        (sum, u) => sum + (Number.isFinite(u.unpaidVacationDays) ? u.unpaidVacationDays : 0),
        0
      );
    }

    return monthAbsences.reduce((sum, a) => {
      if (a.type === "VACATION" && a.compensation === "UNPAID") {
        return sum + absenceDayValue(a.dayPortion);
      }
      return sum;
    }, 0);
  }, [absenceSummaryByUser, monthAbsences]);

  const progress = Math.min(1, netTargetMinutes <= 0 ? 0 : totalMinutes / netTargetMinutes);
  const overtimeGrossMinutes = totalMinutes - targetMinutes;
  const overtimeNetMinutes = totalMinutes - netTargetMinutes;

  const byEmployee = useMemo(() => {
    type Acc = {
      userId: string;
      name: string;
      minutes: number;
      km: number;
      entries: number;
      vac: number;
      sick: number;
      unpaidVac: number;
    };

    const map = new Map<string, Acc>();

    for (const e of monthEntries) {
      const key = e.user?.id ?? "me";
      const name = e.user?.fullName ?? t("me");
      const cur =
        map.get(key) ?? {
          userId: key,
          name,
          minutes: 0,
          km: 0,
          entries: 0,
          vac: 0,
          sick: 0,
          unpaidVac: 0,
        };

      cur.minutes += Number.isFinite(e.workMinutes) ? e.workMinutes : 0;
      cur.entries += 1;

      map.set(key, cur);
    }

    if (absenceSummaryByUser.length > 0) {
      for (const s of absenceSummaryByUser) {
        const key = s.user.id;
        const name = s.user.fullName;
        const cur =
        map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0, unpaidVac: 0 };

        cur.vac += Number.isFinite(s.vacationDays) ? s.vacationDays : 0;
        cur.sick += Number.isFinite(s.sickDays) ? s.sickDays : 0;
        cur.unpaidVac += Number.isFinite(s.unpaidVacationDays) ? s.unpaidVacationDays : 0;

        map.set(key, cur);
      }
    } else {
      for (const a of monthAbsences) {
        const key = a.user?.id ?? "me";
        const name = a.user?.fullName ?? t("me");
        const cur =
        map.get(key) ?? { userId: key, name, minutes: 0, km: 0, entries: 0, vac: 0, sick: 0, unpaidVac: 0 };

        const value = absenceDayValue(a.dayPortion);

        if (a.type === "VACATION" && a.compensation === "UNPAID") cur.unpaidVac += value;
        if (a.type === "VACATION" && a.compensation === "PAID") cur.vac += value;
        if (a.type === "SICK") cur.sick += value;

        map.set(key, cur);
      }
    }

    return Array.from(map.values()).sort((x, y) => y.minutes - x.minutes);
  }, [monthEntries, monthAbsences, absenceSummaryByUser, t]);

  const showByEmployee = byEmployee.length > 1;

  const startDownload = (url: string): void => {
    if (typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  const openExportModal = () => {
    setExportMode("MONTH");
    setExportMonth(ym);
    setExportYear(currentYear());
    setRangeFrom(`${ym}-01`);
    setRangeTo(`${ym}-${lastDayOfMonth(ym)}`);
    setExportOpen(true);
  };

  const rangeError = useMemo(() => {
    if (exportMode !== "RANGE") return "";
    if (!rangeFrom || !rangeTo) return t("pleaseSelectFromAndTo");
    if (rangeFrom > rangeTo) return t("fromDateAfterToDate");
    return "";
  }, [exportMode, rangeFrom, rangeTo, language]);

  const doExport = () => {
    if (exportMode === "MONTH") {
      startDownload(`/api/admin/export?scope=month&month=${encodeURIComponent(exportMonth)}`);
      setExportOpen(false);
      return;
    }

    if (exportMode === "YEAR") {
      startDownload(`/api/admin/export?scope=year&year=${encodeURIComponent(exportYear)}`);
      setExportOpen(false);
      return;
    }

    if (rangeError) return;
    startDownload(`/api/admin/export?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}`);
    setExportOpen(false);
  };

  const exportFooter = (
    <>
      <button
        type="button"
        onClick={() => setExportOpen(false)}
        className="app-action-card-button app-action-card-button-neutral"
      >
        {t("cancel")}
      </button>

      <button
        type="button"
        onClick={doExport}
        disabled={exportMode === "RANGE" && Boolean(rangeError)}
        className="app-action-card-button app-action-card-button-accent"
        style={{
          cursor: exportMode === "RANGE" && rangeError ? "not-allowed" : "pointer",
          opacity: exportMode === "RANGE" && rangeError ? 0.7 : 1,
        }}
        title={t("startDownload")}
      >
        {t("startDownload")}
      </button>
    </>
  );

  // ✅ Blocks (für Admin UND Employee)
const filteredBlocks = useMemo((): AbsenceBlock[] => {
  const q = absQuery.trim().toLowerCase();

  const base = monthAbsences.filter((a) => {
    if (absType !== "ALL" && a.type !== absType) return false;
    if (isAdmin && q && !a.user.fullName.toLowerCase().includes(q)) return false;
    return true;
  });

  const byUser = new Map<string, Absence[]>();
  for (const a of base) {
    const arr = byUser.get(a.user.id) ?? [];
    arr.push(a);
    byUser.set(a.user.id, arr);
  }

  const blocks: AbsenceBlock[] = [];
  for (const arr of byUser.values()) {
    const sorted = arr.slice().sort((x, y) => x.absenceDate.localeCompare(y.absenceDate));
    blocks.push(...buildBlocksForSingleUser(sorted));
  }

  blocks.sort((a, b) => {
    const d = a.from.localeCompare(b.from);
    if (d !== 0) return d;
    const n = a.user.fullName.localeCompare(b.user.fullName);
    if (n !== 0) return n;
    return a.type.localeCompare(b.type);
  });

  return blocks;
}, [monthAbsences, absQuery, absType, isAdmin]);

  const filteredAbsenceCounts = useMemo(() => {
    let sick = 0;
    let vac = 0;
    let unpaidVac = 0;
    let total = 0;

    for (const b of filteredBlocks) {
      total += b.days;
      if (b.type === "SICK") sick += b.days;
      if (b.type === "VACATION" && b.compensation === "PAID") vac += b.days;
      if (b.type === "VACATION" && b.compensation === "UNPAID") unpaidVac += b.days;
    }

    return { total, sick, vac, unpaidVac };
  }, [filteredBlocks]);

const resetAbsFilters = (): void => {
  setAbsQuery("");
  setAbsType("ALL");
};

  return (
    <AppShell>
      {!isAdmin ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Link
            href="/aufgaben"
            className="card app-action-card-button app-action-card-button-neutral"
            title={t("myTasks")}
          >
            📋 {t("tasks")}
          </Link>
        </div>
      ) : null}

      {/* ✅ Admin Export Button */}
      {isAdmin ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={openExportModal}
            className="card app-action-card-button app-action-card-button-accent"
            title={t("adminExport")}
          >
            ⬇️ {t("adminExport")}
          </button>
        </div>
      ) : null}

      {/* ✅ Export Modal */}
      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title={t("adminExport")} footer={exportFooter} maxWidth={720}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([
              { key: "MONTH", label: t("exportMonthCsv") },
              { key: "YEAR", label: t("exportYearZip") },
              { key: "RANGE", label: t("exportRangeCsv") },
            ] as Array<{ key: ExportMode; label: string }>).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setExportMode(m.key)}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: exportMode === m.key ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.20)",
                  color: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {exportMode === "MONTH" ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectMonth")}</div>
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "rgba(255,255,255,0.92)",
                }}
              />
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {t("downloadOneCsvFor")} <b>{exportMonth}</b>
              </div>
            </div>
          ) : null}

          {exportMode === "YEAR" ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectYear")}</div>
              <select
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y} style={{ color: "black" }}>
                    {y}
                  </option>
                ))}
              </select>

              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {t("downloadZipWith12Csvs")}
              </div>
            </div>
          ) : null}

          {exportMode === "RANGE" ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("selectRange")}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("from")}</div>
                  <input
                    type="date"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.25)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("to")}</div>
                  <input
                    type="date"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.25)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                </div>
              </div>

              {rangeError ? (
                <div style={{ fontSize: 12, color: "rgba(224, 75, 69, 0.95)", fontWeight: 900 }}>{rangeError}</div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {t("downloadCsvFromTo")} <b>{rangeFrom}</b> {t("to").toLowerCase()} <b>{rangeTo}</b>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={workDetailsOpen}
        onClose={() => setWorkDetailsOpen(false)}
        title={t("workDetails")}
        footer={
          <button
            type="button"
            onClick={() => setWorkDetailsOpen(false)}
            className="app-action-card-button app-action-card-button-neutral"
          >
            {t("close")}
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div className="small">{t("targetGross")} {formatMinutesAsHM(targetMinutes)}</div>
          <div className="small">{t("targetNet")} {formatMinutesAsHM(netTargetMinutes)}</div>
          <div className="small">{t("overtimeGross")} {formatMinutesAsHM(Math.max(0, overtimeGrossMinutes))}</div>
          <div className="small">{t("overtimeNet")} {formatMinutesAsHM(Math.max(0, overtimeNetMinutes))}</div>
          <div
            className="small"
            style={{
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--muted)",
            }}
          >
            {t("grossNetExplanation")}
          </div>
        </div>
      </Modal>

      <Modal
        open={progressDetailsOpen}
        onClose={() => setProgressDetailsOpen(false)}
        title={t("monthlyProgressDetails")}
        footer={
          <button
            type="button"
            onClick={() => setProgressDetailsOpen(false)}
            className="app-action-card-button app-action-card-button-neutral"
          >
            {t("close")}
          </button>
        }
        maxWidth={640}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div className="small">{t("currentWorkTime")} {formatMinutesAsHM(totalMinutes)}</div>
          <div className="small">{t("targetGross")} {formatMinutesAsHM(targetMinutes)}</div>
          <div className="small">{t("targetNet")} {formatMinutesAsHM(netTargetMinutes)}</div>
          <div className="small">{t("overtimeGross")} {formatMinutesAsHM(Math.max(0, overtimeGrossMinutes))}</div>
          <div className="small">{t("overtimeNet")} {formatMinutesAsHM(Math.max(0, overtimeNetMinutes))}</div>
          <div className="small">{t("vacationCredited")} {formatMinutesAsHM(vacationMinutesInfo)}</div>
          <div className="small">{t("sickCredited")} {formatMinutesAsHM(sickMinutesInfo)}</div>
          <div className="small">{t("holidayCredited")} {formatMinutesAsHM(holidayMinutes)}</div>
          <div className="small">{t("holidaysInMonth")} {holidayCountInMonth}</div>
          <div className="small">
            {t("unpaidAbsence")} {String(unpaidAbsenceDays).replace(".", ",")} {t("daysLabel")}
          </div>
          <div className="small">
            {t("unpaidAbsenceMinutes")} {formatMinutesAsHM(unpaidAbsenceMinutes)}
          </div>
        </div>
      </Modal>

      {/* Globaler Filter oben */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 6 }}>
              {t("overview")}
            </div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: 15,
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}
            >
              {t("dataFor")}{" "}
              <span style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
                {selectedMonthLabel} {selectedYear}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{t("year")}</div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="app-filter-select"
              >
                {years.map((y) => (
                  <option key={y} value={y} style={{ color: "black" }}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{t("month")}</div>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const nextMonth = e.target.value;
                  if (MONTH_OPTIONS.some((option) => option.value === nextMonth)) {
                    setSelectedMonth(nextMonth as MonthOption);
                  }
                }}
                className="app-filter-select"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value} style={{ color: "black" }}>
                    {t(m.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="card kpi">
          <div>
            <div className="small">
              {t("workHours")} · {selectedMonthLabel} {selectedYear}
            </div>
            <div className="big">{formatMinutesAsHM(totalMinutes)}</div>
            <div
              className="small"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
              }}
            >
              {t("details")}
              <button
                type="button"
                onClick={() => setWorkDetailsOpen(true)}
                className="app-info-icon-button"
                title={t("showWorkDetails")}
              >
                <Info size={15} />
              </button>
            </div>
          </div>
          <div className="app-kpi-icon"><FontAwesomeIcon icon={faBusinessTime} /></div>
        </div>


        <div className="card kpi">
          <div>
            <div className="small">
              {t("vacationDays")} · {selectedMonthLabel} {selectedYear}
            </div>
              <div className="big">{String(vacDays).replace(".", ",")}</div>
              {unpaidVacationDaysValue > 0 ? (
              <div className="small">
                {String(unpaidVacationDaysValue).replace(".", ",")} {t("daysUnpaid")}
              </div>
            ) : null}
          </div>
          <div className="app-kpi-icon"><TreePalm /></div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("remainingVacation")}</div>
            <div className="big">{String(remainingVacationDays).replace(".", ",")}</div>
            <div className="small">
              {String(usedVacationDaysYtd).replace(".", ",")} {t("usedOfConsumed")} {String(accruedVacationDays).replace(".", ",")} {t("daysUsed")}
            </div>
            <div className="small">
              {t("annualEntitlement")} {String(annualVacationDays).replace(".", ",")} {t("daysLabel")}
            </div>
          </div>
          <div className="app-kpi-icon"><RemainingVacationIcon size={22} /></div>
        </div>

        <div className="card kpi">
          <div>
            <div className="small">{t("sickDays")}</div>
            <div className="big">{sickDays}</div>
          </div>
          <div className="app-kpi-icon">🌡</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card card-olive" style={{ padding: 18, marginBottom: 14 }}>
        {t("monthProgress")} – {selectedMonthLabel} {selectedYear}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: "var(--muted)" }}>
            {t("stillUntilTarget")} {formatMinutesAsHM(Math.max(0, netTargetMinutes - totalMinutes))} {t("untilMonthlyTarget")}
            {baseTargetMinutes > 0 ? (
              <span>
                {" "}· {t("holidaysConsidered")}
                {holidayCountInMonth > 0 ? ` (${holidayCountInMonth})` : ""}
              </span>
            ) : null}
          </div>
          <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{formatMinutesAsHM(totalMinutes)} / {formatMinutesAsHM(netTargetMinutes)}</span>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--muted-2)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              <span>{t("details")}</span>
              <button
                type="button"
                onClick={() => setProgressDetailsOpen(true)}
                className="app-info-icon-button"
                title={t("showProgressDetails")}
              >
                <Info size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 10 }}>
          <div className="app-progress-track">
            <div
              className="app-progress-bar"
              style={{
                width: `${progress * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ✅ Abwesenheiten + Filter */}
      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div className="section-title">
            {t("absences")} – {selectedMonthLabel} {selectedYear}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="app-chip-neutral">
              {t("filtered")}: {filteredAbsenceCounts.total}
            </span>
            <span className="app-chip-sick">
              <Stethoscope /> {filteredAbsenceCounts.sick}
            </span>
            <span className="app-chip-vacation">
              <TreePalm /> {filteredAbsenceCounts.vac}
            </span>
            <span className="app-chip-warning">
              <UnpaidIcon /> {filteredAbsenceCounts.unpaidVac}
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: isAdmin ? "minmax(0,1.4fr) minmax(0,1fr) auto" : "minmax(0,1fr) auto",
            gap: 10,
          }}
        >
          {isAdmin ? (
            <input
              value={absQuery}
              onChange={(e) => setAbsQuery(e.target.value)}
              placeholder={t("searchName")}
              className="app-filter-input"
            />
          ) : null}

          <select
            value={absType}
            onChange={(e) => setAbsType(e.target.value as AbsFilterType)}
            className="app-filter-select"
          >
            <option value="ALL">{t("allTypes")}</option>
            <option value="SICK">{t("sick")}</option>
            <option value="VACATION">{t("vacation")}</option>
          </select>

          <button
            type="button"
            onClick={resetAbsFilters}
            className="app-filter-reset-button"
            title={t("resetFilters")}
          >
            ↺ {t("reset")}
          </button>
        </div>

        {loading ? (
          <div style={{ color: "var(--muted)", marginTop: 12 }}>{t("loading")}</div>
        ) : filteredBlocks.length === 0 ? (
          <div style={{ color: "var(--muted)", marginTop: 12 }}>{t("noAbsencesForFilters")}</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {filteredBlocks.map((b) => {
              const title =
                b.from === b.to
                  ? formatDateLocalized(language, b.from)
                  : `${formatDateLocalized(language, b.from)} – ${formatDateLocalized(language, b.to)}`;

              return (
                <div
                  key={`${b.user.id}-${b.type}-${b.from}-${b.to}`}
                  className="list-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 12px",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        display: "inline-block",
                        background: typeColor(b.type),
                      }}
                    />
                    <span style={{ fontWeight: 900 }}>{title}</span>
                    <span style={badgeStyle(b.type)}>{typeLabel(language, b.type, b.compensation)}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {formatDayCountLocalized(language, b.days)}
                    </span>
                    {b.type === "VACATION" && b.compensation === "UNPAID" ? (
                      <span style={{ color: "rgba(255, 184, 77, 0.95)", fontWeight: 900 }}>
                        {t("unpaid")}
                      </span>
                    ) : null}
                  </div>

                  <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{b.user.fullName}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* By employee */}
      {showByEmployee ? (
        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            {t("byEmployee")}
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {byEmployee.map((p) => (
                <div key={p.userId} className="list-item">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="app-user-initial-badge">
                          {p.name.trim().slice(0, 1)}
                        </div>
                        <div style={{ fontWeight: 900 }}>{p.name}</div>
                      </div>

                      <div style={{ color: "var(--muted-2)", marginTop: 8, display: "flex", gap: 18, flexWrap: "wrap" }}>
                        <span>🧾 {p.entries} {p.entries === 1 ? t("entry") : t("entries")}</span>
                        <span>🚗 {p.km.toFixed(0)} {t("km")}</span>
                        {p.sick > 0 ? (
                          <span style={{ color: "rgba(224, 75, 69, 0.95)" }}>
                            🌡 {String(p.sick).replace(".", ",")} {t("sick")}
                          </span>
                        ) : null}
                        {p.unpaidVac > 0 ? (
                          <span style={{ color: "rgba(255, 184, 77, 0.95)" }}>
                            💸 {String(p.unpaidVac).replace(".", ",")} {t("vacation")} {t("unpaid")}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ fontWeight: 900, color: "var(--accent)", fontSize: 18 }}>
                      {formatMinutesAsHM(p.minutes)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}