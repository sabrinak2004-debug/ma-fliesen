// src/lib/i18n.ts

export const APP_UI_LANGUAGES = ["DE", "EN", "IT", "TR", "SQ", "KU"] as const;

export type AppUiLanguage = (typeof APP_UI_LANGUAGES)[number];

export function isAppUiLanguage(value: unknown): value is AppUiLanguage {
  return (
    value === "DE" ||
    value === "EN" ||
    value === "IT" ||
    value === "TR" ||
    value === "SQ" ||
    value === "KU"
  );
}

export function normalizeAppUiLanguage(value: unknown): AppUiLanguage {
  return isAppUiLanguage(value) ? value : "DE";
}

export function toHtmlLang(language: AppUiLanguage): string {
  switch (language) {
    case "DE":
      return "de";
    case "EN":
      return "en";
    case "IT":
      return "it";
    case "TR":
      return "tr";
    case "SQ":
      return "sq";
    case "KU":
      return "ku";
    default:
      return "de";
  }
}

export function getLanguageLabel(language: AppUiLanguage): string {
  switch (language) {
    case "DE":
      return "Deutsch";
    case "EN":
      return "English";
    case "IT":
      return "Italiano";
    case "TR":
      return "Türkçe";
    case "SQ":
      return "Shqip";
    case "KU":
      return "Kurdî";
    default:
      return "Deutsch";
  }
}

export function translate<Key extends string>(
  language: AppUiLanguage,
  key: Key,
  dictionary: Record<Key, Record<AppUiLanguage, string>>
): string {
  const entry = dictionary[key];

  if (!entry) {
    return String(key);
  }

  return entry[language] ?? entry.DE;
}

export type TimeEntryCorrectionApiTextKey =
  | "notLoggedIn"
  | "employeeOnlyCreate"
  | "invalidTargetDate"
  | "pastDaysOnly"
  | "noLockedMissingEntries"
  | "requestNotRequiredForDate"
  | "existingPendingForPeriod"
  | "invalidWorkDate"
  | "missingRequestId"
  | "correctionRequestNotFound"
  | "requestNotFound"
  | "employeeInactive"
  | "onlyPendingCanBeApproved"
  | "onlyPendingCanBeRejected"
  | "newCorrectionRequestPushTitle"
  | "newCorrectionRequestPushBody"
  | "approvedPushTitle"
  | "approvedPushBody"
  | "rejectedPushTitle"
  | "rejectedPushBody";

export const TIME_ENTRY_CORRECTION_API_TEXTS: Record<
  TimeEntryCorrectionApiTextKey,
  Record<AppUiLanguage, string>
> = {
  notLoggedIn: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk je i identifikuar.",
    KU: "Têketin nehatiye kirin.",
  },
  employeeOnlyCreate: {
    DE: "Nur Mitarbeiter können Nachtragsanträge stellen.",
    EN: "Only employees can submit correction requests.",
    IT: "Solo i dipendenti possono inviare richieste di correzione.",
    TR: "Yalnızca çalışanlar düzeltme talebi oluşturabilir.",
    SQ: "Vetëm punonjësit mund të paraqesin kërkesa për korrigjim.",
    KU: "Tenê karmend dikarin daxwaza rastkirinê bişînin.",
  },
  invalidTargetDate: {
    DE: "targetDate muss YYYY-MM-DD sein.",
    EN: "targetDate must be in YYYY-MM-DD format.",
    IT: "targetDate deve essere nel formato YYYY-MM-DD.",
    TR: "targetDate YYYY-MM-DD formatında olmalıdır.",
    SQ: "targetDate duhet të jetë në formatin YYYY-MM-DD.",
    KU: "targetDate divê di formatê YYYY-MM-DD de be.",
  },
  pastDaysOnly: {
    DE: "Ein Nachtragsantrag ist nur für vergangene Tage möglich.",
    EN: "A correction request is only possible for past days.",
    IT: "Una richiesta di correzione è possibile solo per giorni passati.",
    TR: "Düzeltme talebi yalnızca geçmiş günler için mümkündür.",
    SQ: "Një kërkesë për korrigjim është e mundur vetëm për ditët e kaluara.",
    KU: "Daxwaza rastkirinê tenê ji bo rojên borî gengaz e.",
  },
  noLockedMissingEntries: {
    DE: "Aktuell gibt es keine gesperrten fehlenden Arbeitseinträge.",
    EN: "There are currently no locked missing work entries.",
    IT: "Attualmente non ci sono registrazioni di lavoro mancanti bloccate.",
    TR: "Şu anda kilitli eksik çalışma kayıtları yok.",
    SQ: "Aktualisht nuk ka hyrje pune të munguara të bllokuara.",
    KU: "Niha qeydkirinên karê winda yên girtî tune ne.",
  },
  requestNotRequiredForDate: {
    DE: "Für dieses Datum ist aktuell noch kein Nachtragsantrag erforderlich oder das Datum gehört nicht zu den gesperrten fehlenden Arbeitstagen.",
    EN: "No correction request is currently required for this date, or the date is not part of the locked missing workdays.",
    IT: "Per questa data al momento non è richiesta alcuna richiesta di correzione oppure la data non rientra tra i giorni lavorativi mancanti bloccati.",
    TR: "Bu tarih için şu anda bir düzeltme talebi gerekmiyor veya tarih kilitli eksik iş günleri arasında yer almıyor.",
    SQ: "Për këtë datë aktualisht nuk kërkohet ende një kërkesë për korrigjim ose data nuk bën pjesë në ditët e bllokuara me mungesë hyrjeje pune.",
    KU: "Ji bo vê dîrokê niha daxwaza rastkirinê ne pêwîst e an jî ev dîrok di nav rojên karê winda yên girtî de nayê.",
  },
  existingPendingForPeriod: {
    DE: "Für diesen Zeitraum existiert bereits ein offener Nachtragsantrag.",
    EN: "An open correction request already exists for this period.",
    IT: "Esiste già una richiesta di correzione aperta per questo periodo.",
    TR: "Bu dönem için zaten açık bir düzeltme talebi mevcut.",
    SQ: "Për këtë periudhë ekziston tashmë një kërkesë e hapur për korrigjim.",
    KU: "Ji bo vê demê jixwe daxwazek rastkirinê ya vekirî heye.",
  },
  invalidWorkDate: {
    DE: "workDate muss YYYY-MM-DD sein.",
    EN: "workDate must be in YYYY-MM-DD format.",
    IT: "workDate deve essere nel formato YYYY-MM-DD.",
    TR: "workDate YYYY-MM-DD formatında olmalıdır.",
    SQ: "workDate duhet të jetë në formatin YYYY-MM-DD.",
    KU: "workDate divê di formatê YYYY-MM-DD de be.",
  },
  missingRequestId: {
    DE: "Fehlende Request-ID.",
    EN: "Missing request ID.",
    IT: "ID richiesta mancante.",
    TR: "İstek kimliği eksik.",
    SQ: "Mungon ID-ja e kërkesës.",
    KU: "Nasnameya daxwazê kêm e.",
  },
  correctionRequestNotFound: {
    DE: "Nachtragsanfrage nicht gefunden.",
    EN: "Correction request not found.",
    IT: "Richiesta di correzione non trovata.",
    TR: "Düzeltme talebi bulunamadı.",
    SQ: "Kërkesa për korrigjim nuk u gjet.",
    KU: "Daxwaza rastkirinê nehat dîtin.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
  },
  employeeInactive: {
    DE: "Mitarbeiter ist nicht aktiv.",
    EN: "Employee is not active.",
    IT: "Il dipendente non è attivo.",
    TR: "Çalışan aktif değil.",
    SQ: "Punonjësi nuk është aktiv.",
    KU: "Karmend çalak nîne.",
  },
  onlyPendingCanBeApproved: {
    DE: "Nur offene Anträge können genehmigt werden.",
    EN: "Only open requests can be approved.",
    IT: "Solo le richieste aperte possono essere approvate.",
    TR: "Yalnızca açık talepler onaylanabilir.",
    SQ: "Vetëm kërkesat e hapura mund të miratohen.",
    KU: "Tenê daxwazên vekirî dikarin bêne pejirandin.",
  },
  onlyPendingCanBeRejected: {
    DE: "Nur offene Anträge können abgelehnt werden.",
    EN: "Only open requests can be rejected.",
    IT: "Solo le richieste aperte possono essere rifiutate.",
    TR: "Yalnızca açık talepler reddedilebilir.",
    SQ: "Vetëm kërkesat e hapura mund të refuzohen.",
    KU: "Tenê daxwazên vekirî dikarin bêne redkirin.",
  },
  newCorrectionRequestPushTitle: {
    DE: "Neuer Nachtragsantrag",
    EN: "New correction request",
    IT: "Nuova richiesta di correzione",
    TR: "Yeni düzeltme talebi",
    SQ: "Kërkesë e re për korrigjim",
    KU: "Daxwaza rastkirinê ya nû",
  },
  newCorrectionRequestPushBody: {
    DE: "{name} hat einen Nachtragsantrag für {dateLabel} gestellt.",
    EN: "{name} submitted a correction request for {dateLabel}.",
    IT: "{name} ha inviato una richiesta di correzione per {dateLabel}.",
    TR: "{name}, {dateLabel} için bir düzeltme talebi gönderdi.",
    SQ: "{name} paraqiti një kërkesë për korrigjim për {dateLabel}.",
    KU: "{name} ji bo {dateLabel} daxwaza rastkirinê şand.",
  },
  approvedPushTitle: {
    DE: "Nachtragsantrag genehmigt",
    EN: "Correction request approved",
    IT: "Richiesta di correzione approvata",
    TR: "Düzeltme talebi onaylandı",
    SQ: "Kërkesa për korrigjim u miratua",
    KU: "Daxwaza rastkirinê hate pejirandin",
  },
  approvedPushBody: {
    DE: "Dein Nachtragsantrag wurde genehmigt ({dateLabel}).",
    EN: "Your correction request was approved ({dateLabel}).",
    IT: "La tua richiesta di correzione è stata approvata ({dateLabel}).",
    TR: "Düzeltme talebin onaylandı ({dateLabel}).",
    SQ: "Kërkesa jote për korrigjim u miratua ({dateLabel}).",
    KU: "Daxwaza te ya rastkirinê hate pejirandin ({dateLabel}).",
  },
  rejectedPushTitle: {
    DE: "Nachtragsantrag abgelehnt",
    EN: "Correction request rejected",
    IT: "Richiesta di correzione rifiutata",
    TR: "Düzeltme talebi reddedildi",
    SQ: "Kërkesa për korrigjim u refuzua",
    KU: "Daxwaza rastkirinê hate redkirin",
  },
  rejectedPushBody: {
    DE: "Dein Nachtragsantrag wurde abgelehnt.",
    EN: "Your correction request was rejected.",
    IT: "La tua richiesta di correzione è stata rifiutata.",
    TR: "Düzeltme talebin reddedildi.",
    SQ: "Kërkesa jote për korrigjim u refuzua.",
    KU: "Daxwaza te ya rastkirinê hate redkirin.",
  },
};

export type LegalTextKey =
  | "back"
  | "privacyTitle"
  | "privacyUpdated"
  | "termsTitle"
  | "termsUpdated";

export const LEGAL_UI_TEXTS: Record<LegalTextKey, Record<AppUiLanguage, string>> = {
  back: {
    DE: "Zurück",
    EN: "Back",
    IT: "Indietro",
    TR: "Geri",
    SQ: "Kthehu",
    KU: "Vegere",
  },
  privacyTitle: {
    DE: "Datenschutzerklärung",
    EN: "Privacy Policy",
    IT: "Informativa sulla Privacy",
    TR: "Gizlilik Politikası",
    SQ: "Politika e Privatësisë",
    KU: "Polîtîkaya Nepenîtiyê",
  },
  privacyUpdated: {
    DE: "Letzte Aktualisierung: 30.03.2026",
    EN: "Last updated: 2026-03-30",
    IT: "Ultimo aggiornamento: 30.03.2026",
    TR: "Son güncelleme: 30.03.2026",
    SQ: "Përditësimi i fundit: 30.03.2026",
    KU: "Dawiya nûkirinê: 30.03.2026",
  },
  termsTitle: {
    DE: "Nutzungsbedingungen",
    EN: "Terms of Use",
    IT: "Termini di Utilizzo",
    TR: "Kullanım Koşulları",
    SQ: "Kushtet e Përdorimit",
    KU: "Mercên Bikaranînê",
  },
  termsUpdated: {
    DE: "Letzte Aktualisierung: 30.03.2026",
    EN: "Last updated: 2026-03-30",
    IT: "Ultimo aggiornamento: 30.03.2026",
    TR: "Son güncelleme: 30.03.2026",
    SQ: "Përditësimi i fundit: 30.03.2026",
    KU: "Dawiya nûkirinê: 30.03.2026",
  },
};

export type KalenderTextKey =
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
  | "calendarLoadingFallback"
  | "weekShortMon"
  | "weekShortTue"
  | "weekShortWed"
  | "weekShortThu"
  | "weekShortFri"
  | "weekShortSat"
  | "weekShortSun"
  | "calendarWeekLabel"
  | "loadingAbsencesRequests"
  | "for"
  | "selectDate"
  | "pleaseEnterTitle"
  | "timeMustBeHHMM"
  | "savingFailed"
  | "deletingFailed"
  | "networkDeleteError"
  | "employeePlanCouldNotBeLoaded"
  | "planCouldNotBeLoaded"
  | "networkPlanLoadError"
  | "networkEmployeePlanLoadError"
  | "appointmentsCouldNotBeLoaded"
  | "networkAppointmentsLoadError"
  | "planEntriesUnauthorized"
  | "planEntriesForbidden"
  | "planEntriesFromToMissing"
  | "planEntriesEmployeeNotFound"
  | "publicHolidayDefault"
  | "daysLabel"
  | "dayLabel"
  | "vacationConfirmedSingleDay"
  | "sickConfirmedHalfDay"
  | "sickConfirmedFullDay"
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
  | "december"
  | "mondayLong"
  | "tuesdayLong"
  | "wednesdayLong"
  | "thursdayLong"
  | "fridayLong"
  | "saturdayLong"
  | "sundayLong"
  | "dayMarkedAsHoliday"
  | "dashOnly";

export const KALENDER_DICTIONARY: Record<KalenderTextKey, Record<AppUiLanguage, string>> = {
  unexpectedResponse: {
    DE: "Unerwartete Antwort.",
    EN: "Unexpected response.",
    IT: "Risposta inattesa.",
    TR: "Beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur.",
    KU: "Bersiva neçaverêkirî.",
  },
  weekShortMon: {
    DE: "Mo",
    EN: "Mon",
    IT: "Lun",
    TR: "Pzt",
    SQ: "Hën",
    KU: "Dş",
  },
  weekShortTue: {
    DE: "Di",
    EN: "Tue",
    IT: "Mar",
    TR: "Sal",
    SQ: "Mar",
    KU: "Sê",
  },
  weekShortWed: {
    DE: "Mi",
    EN: "Wed",
    IT: "Mer",
    TR: "Çar",
    SQ: "Mër",
    KU: "Çr",
  },
  weekShortThu: {
    DE: "Do",
    EN: "Thu",
    IT: "Gio",
    TR: "Per",
    SQ: "Enj",
    KU: "Pnc",
  },
  weekShortFri: {
    DE: "Fr",
    EN: "Fri",
    IT: "Ven",
    TR: "Cum",
    SQ: "Pre",
    KU: "În",
  },
  weekShortSat: {
    DE: "Sa",
    EN: "Sat",
    IT: "Sab",
    TR: "Cmt",
    SQ: "Sht",
    KU: "Şem",
  },
  weekShortSun: {
    DE: "So",
    EN: "Sun",
    IT: "Dom",
    TR: "Paz",
    SQ: "Die",
    KU: "Yek",
  },
  calendarWeekLabel: {
    DE: "KW",
    EN: "CW",
    IT: "Sett.",
    TR: "HF",
    SQ: "JV",
    KU: "HJ",
  },
  loadingAbsencesRequests: {
    DE: "Abwesenheiten/Anträge laden…",
    EN: "Loading absences/requests…",
    IT: "Caricamento assenze/richieste…",
    TR: "Devamsızlıklar/talepler yükleniyor…",
    SQ: "Mungesat/kërkesat po ngarkohen…",
    KU: "Nebûn/daxwaz têne barkirin…",
  },
  for: {
    DE: "für",
    EN: "for",
    IT: "per",
    TR: "için",
    SQ: "për",
    KU: "ji bo",
  },
  selectDate: {
    DE: "Datum auswählen.",
    EN: "Please select a date.",
    IT: "Seleziona una data.",
    TR: "Lütfen bir tarih seçin.",
    SQ: "Ju lutem zgjidhni një datë.",
    KU: "Ji kerema xwe dîrokek hilbijêre.",
  },
  pleaseEnterTitle: {
    DE: "Bitte Titel eingeben.",
    EN: "Please enter a title.",
    IT: "Inserisci un titolo.",
    TR: "Lütfen bir başlık girin.",
    SQ: "Ju lutem shkruani një titull.",
    KU: "Ji kerema xwe sernavek binivîse.",
  },
  timeMustBeHHMM: {
    DE: "Start/Ende muss HH:MM sein.",
    EN: "Start/end must be HH:MM.",
    IT: "Inizio/fine deve essere HH:MM.",
    TR: "Başlangıç/bitiş HH:MM olmalı.",
    SQ: "Fillimi/fundi duhet të jetë HH:MM.",
    KU: "Destpêk/dawî divê HH:MM be.",
  },
  savingFailed: {
    DE: "Speichern fehlgeschlagen.",
    EN: "Saving failed.",
    IT: "Salvataggio non riuscito.",
    TR: "Kaydetme başarısız oldu.",
    SQ: "Ruajtja dështoi.",
    KU: "Tomarkirin têk çû.",
  },
  deletingFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Deleting failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin têk çû.",
  },
  networkDeleteError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Di jêbirinê de çewtiya torê.",
  },
  employeePlanCouldNotBeLoaded: {
    DE: "Plan des Mitarbeiters konnte nicht geladen werden.",
    EN: "Employee schedule could not be loaded.",
    IT: "Impossibile caricare il piano del dipendente.",
    TR: "Çalışan planı yüklenemedi.",
    SQ: "Plani i punonjësit nuk mund të ngarkohej.",
    KU: "Plana karmend nehat barkirin.",
  },
  planCouldNotBeLoaded: {
    DE: "Plan konnte nicht geladen werden.",
    EN: "Schedule could not be loaded.",
    IT: "Impossibile caricare il piano.",
    TR: "Plan yüklenemedi.",
    SQ: "Plani nuk mund të ngarkohej.",
    KU: "Plan nehat barkirin.",
  },
  networkPlanLoadError: {
    DE: "Netzwerkfehler beim Laden des Plans.",
    EN: "Network error while loading the schedule.",
    IT: "Errore di rete durante il caricamento del piano.",
    TR: "Plan yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të planit.",
    KU: "Di barkirina planê de çewtiya torê.",
  },
  networkEmployeePlanLoadError: {
    DE: "Netzwerkfehler beim Laden des Mitarbeiter-Plans.",
    EN: "Network error while loading the employee schedule.",
    IT: "Errore di rete durante il caricamento del piano del dipendente.",
    TR: "Çalışan planı yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të planit të punonjësit.",
    KU: "Di barkirina plana karmend de çewtiya torê.",
  },
  appointmentsCouldNotBeLoaded: {
    DE: "Termine konnten nicht geladen werden.",
    EN: "Appointments could not be loaded.",
    IT: "Impossibile caricare gli appuntamenti.",
    TR: "Randevular yüklenemedi.",
    SQ: "Takimet nuk mund të ngarkoheshin.",
    KU: "Hevdîtin nehatin barkirin.",
  },
  networkAppointmentsLoadError: {
    DE: "Netzwerkfehler beim Laden der Termine.",
    EN: "Network error while loading appointments.",
    IT: "Errore di rete durante il caricamento degli appuntamenti.",
    TR: "Randevular yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të takimeve.",
    KU: "Di barkirina hevdîtinan de çewtiya torê.",
  },
  planEntriesUnauthorized: {
    DE: "Nicht autorisiert.",
    EN: "Not authorized.",
    IT: "Non autorizzato.",
    TR: "Yetkiniz yok.",
    SQ: "I paautorizuar.",
    KU: "Destûr tune ye.",
  },
  planEntriesForbidden: {
    DE: "Kein Zugriff auf den Plan.",
    EN: "No access to the schedule.",
    IT: "Nessun accesso al piano.",
    TR: "Plana erişim yok.",
    SQ: "Nuk ka qasje në plan.",
    KU: "Gihîştin bi planê tune ye.",
  },
  planEntriesFromToMissing: {
    DE: "Start- oder Enddatum fehlt.",
    EN: "Start or end date is missing.",
    IT: "Manca la data di inizio o di fine.",
    TR: "Başlangıç veya bitiş tarihi eksik.",
    SQ: "Mungon data e fillimit ose e mbarimit.",
    KU: "Dîroka destpêkê an dawiyê tune ye.",
  },
  planEntriesEmployeeNotFound: {
    DE: "Mitarbeiter wurde nicht gefunden.",
    EN: "Employee was not found.",
    IT: "Dipendente non trovato.",
    TR: "Çalışan bulunamadı.",
    SQ: "Punonjësi nuk u gjet.",
    KU: "Karmend nehat dîtin.",
  },
  publicHolidayDefault: {
    DE: "Gesetzlicher Feiertag",
    EN: "Public holiday",
    IT: "Festività legale",
    TR: "Resmî tatil",
    SQ: "Festë zyrtare",
    KU: "Cejna fermî",
  },
  daysLabel: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  dayLabel: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  vacationConfirmedSingleDay: {
    DE: "🌴 Urlaub ({date})",
    EN: "🌴 Vacation ({date})",
    IT: "🌴 Ferie ({date})",
    TR: "🌴 İzin ({date})",
    SQ: "🌴 Pushim ({date})",
    KU: "🌴 Bêhnvedan ({date})",
  },
  sickConfirmedHalfDay: {
    DE: "🤒 Krank (0,5 Tag)",
    EN: "🤒 Sick (0.5 day)",
    IT: "🤒 Malattia (0,5 giorno)",
    TR: "🤒 Hasta (0,5 gün)",
    SQ: "🤒 I sëmurë (0,5 ditë)",
    KU: "🤒 Nexweş (0.5 roj)",
  },
  sickConfirmedFullDay: {
    DE: "🤒 Krank (1 Tag)",
    EN: "🤒 Sick (1 day)",
    IT: "🤒 Malattia (1 giorno)",
    TR: "🤒 Hasta (1 gün)",
    SQ: "🤒 I sëmurë (1 ditë)",
    KU: "🤒 Nexweş (1 roj)",
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
    DE: "Bezahlter Urlaub",
    EN: "Paid vacation",
    IT: "Ferie retribuite",
    TR: "Ücretli izin",
    SQ: "Pushim i paguar",
    KU: "Bêhnvedana bi mûçe",
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
  january: {
    DE: "Januar",
    EN: "January",
    IT: "Gennaio",
    TR: "Ocak",
    SQ: "Janar",
    KU: "Rêbendan",
  },
  february: {
    DE: "Februar",
    EN: "February",
    IT: "Febbraio",
    TR: "Şubat",
    SQ: "Shkurt",
    KU: "Reşemî",
  },
  march: {
    DE: "März",
    EN: "March",
    IT: "Marzo",
    TR: "Mart",
    SQ: "Mars",
    KU: "Adar",
  },
  april: {
    DE: "April",
    EN: "April",
    IT: "Aprile",
    TR: "Nisan",
    SQ: "Prill",
    KU: "Nîsan",
  },
  may: {
    DE: "Mai",
    EN: "May",
    IT: "Maggio",
    TR: "Mayıs",
    SQ: "Maj",
    KU: "Gulan",
  },
  june: {
    DE: "Juni",
    EN: "June",
    IT: "Giugno",
    TR: "Haziran",
    SQ: "Qershor",
    KU: "Hezîran",
  },
  july: {
    DE: "Juli",
    EN: "July",
    IT: "Luglio",
    TR: "Temmuz",
    SQ: "Korrik",
    KU: "Tîrmeh",
  },
  august: {
    DE: "August",
    EN: "August",
    IT: "Agosto",
    TR: "Ağustos",
    SQ: "Gusht",
    KU: "Tebax",
  },
  september: {
    DE: "September",
    EN: "September",
    IT: "Settembre",
    TR: "Eylül",
    SQ: "Shtator",
    KU: "Îlon",
  },
  october: {
    DE: "Oktober",
    EN: "October",
    IT: "Ottobre",
    TR: "Ekim",
    SQ: "Tetor",
    KU: "Cotmeh",
  },
  november: {
    DE: "November",
    EN: "November",
    IT: "Novembre",
    TR: "Kasım",
    SQ: "Nëntor",
    KU: "Mijdar",
  },
  december: {
    DE: "Dezember",
    EN: "December",
    IT: "Dicembre",
    TR: "Aralık",
    SQ: "Dhjetor",
    KU: "Kanûn",
  },
  mondayLong: {
    DE: "Montag",
    EN: "Monday",
    IT: "Lunedì",
    TR: "Pazartesi",
    SQ: "E hënë",
    KU: "Duşem",
  },
  tuesdayLong: {
    DE: "Dienstag",
    EN: "Tuesday",
    IT: "Martedì",
    TR: "Salı",
    SQ: "E martë",
    KU: "Sêşem",
  },
  wednesdayLong: {
    DE: "Mittwoch",
    EN: "Wednesday",
    IT: "Mercoledì",
    TR: "Çarşamba",
    SQ: "E mërkurë",
    KU: "Çarşem",
  },
  thursdayLong: {
    DE: "Donnerstag",
    EN: "Thursday",
    IT: "Giovedì",
    TR: "Perşembe",
    SQ: "E enjte",
    KU: "Pêncşem",
  },
  fridayLong: {
    DE: "Freitag",
    EN: "Friday",
    IT: "Venerdì",
    TR: "Cuma",
    SQ: "E premte",
    KU: "În",
  },
  saturdayLong: {
    DE: "Samstag",
    EN: "Saturday",
    IT: "Sabato",
    TR: "Cumartesi",
    SQ: "E shtunë",
    KU: "Şemî",
  },
  sundayLong: {
    DE: "Sonntag",
    EN: "Sunday",
    IT: "Domenica",
    TR: "Pazar",
    SQ: "E diel",
    KU: "Yekşem",
  },
  dayMarkedAsHoliday: {
    DE: "Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.",
    EN: "This day is marked as a public holiday in the calendar.",
    IT: "Questo giorno è contrassegnato come festività legale nel calendario.",
    TR: "Bu gün takvimde resmî tatil olarak işaretlenmiştir.",
    SQ: "Kjo ditë është shënuar si festë zyrtare në kalendar.",
    KU: "Ev roj di salnameyê de wekî cejna fermî hatiye nîşankirin.",
  },
  dashOnly: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    KU: "—",
  },
};

export type ErfassungTextKey =
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
  | "changesSaveFailed"
  | "dateStartEndMissing"
  | "sending"
  | "to"
  | "optionalReasonPlaceholder"
  | "existingCorrectionHint"
  | "currentMissingDaysNeedsRequest"
  | "currentMissingDaysUntilLock"
  | "employeeManagedServerSide"
  | "dayGrossBreakNet"
  | "monthJanuary"
  | "monthFebruary"
  | "monthMarch"
  | "monthApril"
  | "monthMay"
  | "monthJune"
  | "monthJuly"
  | "monthAugust"
  | "monthSeptember"
  | "monthOctober"
  | "monthNovember"
  | "monthDecember"
  | "weekdaySundayShort"
  | "weekdayMondayShort"
  | "weekdayTuesdayShort"
  | "weekdayWednesdayShort"
  | "weekdayThursdayShort"
  | "weekdayFridayShort"
  | "weekdaySaturdayShort"
  | "legalBreakHeadline"
  | "legalBreakAfterSixHours"
  | "legalBreakAfterNineHours"
  | "legalBreakAutoApplied"
  | "timesheetFutureDateEditForbidden"
  | "timesheetOlderMissingEntriesFirst"
  | "timesheetLockedDayRequiresCorrection";

export const ERFASSUNG_DICTIONARY: Record<ErfassungTextKey, Record<AppUiLanguage, string>> = {
  loading: {
    DE: "Lade...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
  },
  monthJanuary: {
    DE: "Januar",
    EN: "January",
    IT: "Gennaio",
    TR: "Ocak",
    SQ: "Janar",
    KU: "Rêbendan",
  },
  monthFebruary: {
    DE: "Februar",
    EN: "February",
    IT: "Febbraio",
    TR: "Şubat",
    SQ: "Shkurt",
    KU: "Reşemî",
  },
  monthMarch: {
    DE: "März",
    EN: "March",
    IT: "Marzo",
    TR: "Mart",
    SQ: "Mars",
    KU: "Adar",
  },
  monthApril: {
    DE: "April",
    EN: "April",
    IT: "Aprile",
    TR: "Nisan",
    SQ: "Prill",
    KU: "Nîsan",
  },
  monthMay: {
    DE: "Mai",
    EN: "May",
    IT: "Maggio",
    TR: "Mayıs",
    SQ: "Maj",
    KU: "Gulan",
  },
  monthJune: {
    DE: "Juni",
    EN: "June",
    IT: "Giugno",
    TR: "Haziran",
    SQ: "Qershor",
    KU: "Hezîran",
  },
  monthJuly: {
    DE: "Juli",
    EN: "July",
    IT: "Luglio",
    TR: "Temmuz",
    SQ: "Korrik",
    KU: "Tîrmeh",
  },
  monthAugust: {
    DE: "August",
    EN: "August",
    IT: "Agosto",
    TR: "Ağustos",
    SQ: "Gusht",
    KU: "Tebax",
  },
  monthSeptember: {
    DE: "September",
    EN: "September",
    IT: "Settembre",
    TR: "Eylül",
    SQ: "Shtator",
    KU: "Îlon",
  },
  monthOctober: {
    DE: "Oktober",
    EN: "October",
    IT: "Ottobre",
    TR: "Ekim",
    SQ: "Tetor",
    KU: "Cotmeh",
  },
  monthNovember: {
    DE: "November",
    EN: "November",
    IT: "Novembre",
    TR: "Kasım",
    SQ: "Nëntor",
    KU: "Mijdar",
  },
  monthDecember: {
    DE: "Dezember",
    EN: "December",
    IT: "Dicembre",
    TR: "Aralık",
    SQ: "Dhjetor",
    KU: "Kanûn",
  },
  weekdaySundayShort: {
    DE: "So.",
    EN: "Sun",
    IT: "Dom",
    TR: "Paz",
    SQ: "Die",
    KU: "Yek",
  },
  weekdayMondayShort: {
    DE: "Mo.",
    EN: "Mon",
    IT: "Lun",
    TR: "Pzt",
    SQ: "Hën",
    KU: "Duş",
  },
  weekdayTuesdayShort: {
    DE: "Di.",
    EN: "Tue",
    IT: "Mar",
    TR: "Sal",
    SQ: "Mar",
    KU: "Sêş",
  },
  weekdayWednesdayShort: {
    DE: "Mi.",
    EN: "Wed",
    IT: "Mer",
    TR: "Çar",
    SQ: "Mër",
    KU: "Çar",
  },
  weekdayThursdayShort: {
    DE: "Do.",
    EN: "Thu",
    IT: "Gio",
    TR: "Per",
    SQ: "Enj",
    KU: "Pênc",
  },
  weekdayFridayShort: {
    DE: "Fr.",
    EN: "Fri",
    IT: "Ven",
    TR: "Cum",
    SQ: "Pre",
    KU: "În",
  },
  weekdaySaturdayShort: {
    DE: "Sa.",
    EN: "Sat",
    IT: "Sab",
    TR: "Cmt",
    SQ: "Sht",
    KU: "Şem",
  },
  legalBreakHeadline: {
    DE: "Gesetzliche Pausen:",
    EN: "Legal breaks:",
    IT: "Pause legali:",
    TR: "Yasal molalar:",
    SQ: "Pushimet ligjore:",
    KU: "Navberên qanûnî:",
  },
  legalBreakAfterSixHours: {
    DE: "ab mehr als 6h: 30 Min",
    EN: "more than 6h: 30 min",
    IT: "oltre 6h: 30 min",
    TR: "6 saatten fazla: 30 dk",
    SQ: "mbi 6 orë: 30 min",
    KU: "zêdetirî 6 saetan: 30 deq",
  },
  legalBreakAfterNineHours: {
    DE: "ab mehr als 9h: 45 Min",
    EN: "more than 9h: 45 min",
    IT: "oltre 9h: 45 min",
    TR: "9 saatten fazla: 45 dk",
    SQ: "mbi 9 orë: 45 min",
    KU: "zêdetirî 9 saetan: 45 deq",
  },
  legalBreakAutoApplied: {
    DE: "Gesetzliche Pause automatisch eingetragen:",
    EN: "Legal break applied automatically:",
    IT: "Pausa legale applicata automaticamente:",
    TR: "Yasal mola otomatik uygulandı:",
    SQ: "Pushimi ligjor u zbatua automatikisht:",
    KU: "Navbera qanûnî bixweber hate sepandin:",
  },
  to: {
    DE: "bis",
    EN: "to",
    IT: "fino a",
    TR: "ile",
    SQ: "deri",
    KU: "heta",
  },
  dateStartEndMissing: {
    DE: "Datum / Beginn / Ende fehlt.",
    EN: "Date / start / end is missing.",
    IT: "Manca data / inizio / fine.",
    TR: "Tarih / başlangıç / bitiş eksik.",
    SQ: "Mungon data / fillimi / fundi.",
    KU: "Dîrok / destpêk / dawî kêm e.",
  },
  sending: {
    DE: "Sendet...",
    EN: "Sending...",
    IT: "Invio...",
    TR: "Gönderiliyor...",
    SQ: "Duke dërguar...",
    KU: "Tê şandin...",
  },
  optionalReasonPlaceholder: {
    DE: "Optional: kurze Begründung oder Hinweis",
    EN: "Optional: short reason or note",
    IT: "Opzionale: breve motivazione o nota",
    TR: "İsteğe bağlı: kısa açıklama veya not",
    SQ: "Opsionale: arsye ose shënim i shkurtër",
    KU: "Vebijarkî: ravekirinek kurt an nîşe",
  },
  existingCorrectionHint: {
    DE: "Hinweis: Für {range} existiert bereits ein offener Antrag.",
    EN: "Note: There is already an open request for {range}.",
    IT: "Nota: esiste già una richiesta aperta per {range}.",
    TR: "Not: {range} için zaten açık bir talep var.",
    SQ: "Shënim: për {range} ekziston tashmë një kërkesë e hapur.",
    KU: "Têbînî: ji bo {range} daxwazek vekirî heye.",
  },
  currentMissingDaysNeedsRequest: {
    DE: "Aktuell: {current}/{limit} fehlende Arbeitstage. Ein Nachtragsantrag ist erforderlich.",
    EN: "Current: {current}/{limit} missing workdays. A correction request is required.",
    IT: "Attuale: {current}/{limit} giorni lavorativi mancanti. È richiesta una domanda di integrazione.",
    TR: "Şu an: {current}/{limit} eksik iş günü. Düzeltme talebi gereklidir.",
    SQ: "Aktualisht: {current}/{limit} ditë pune të munguara. Kërkohet një kërkesë korrigjimi.",
    KU: "Niha: {current}/{limit} rojên karê yên wenda. Daxwaza rastkirinê pêwist e.",
  },
  currentMissingDaysUntilLock: {
    DE: "Aktuell: {current}/{limit} fehlende Arbeitstage bis zur Sperrung.",
    EN: "Current: {current}/{limit} missing workdays until lock.",
    IT: "Attuale: {current}/{limit} giorni lavorativi mancanti fino al blocco.",
    TR: "Şu an: kilide kadar {current}/{limit} eksik iş günü.",
    SQ: "Aktualisht: {current}/{limit} ditë pune të munguara deri në bllokim.",
    KU: "Niha: heta girtinê {current}/{limit} rojên karê yên wenda.",
  },
  employeeManagedServerSide: {
    DE: "Zuordnung wird serverseitig automatisch verwaltet.",
    EN: "Assignment is managed automatically on the server side.",
    IT: "L'assegnazione è gestita automaticamente dal server.",
    TR: "Atama sunucu tarafında otomatik olarak yönetilir.",
    SQ: "Caktimi menaxhohet automatikisht nga serveri.",
    KU: "Girêdan li aliyê serverê bixweber tê rêvebirin.",
  },
  dayGrossBreakNet: {
    DE: "Tag: Brutto {gross} · Wirksame Pause {breakValue} · Netto {netValue}",
    EN: "Day: Gross {gross} · Effective break {breakValue} · Net {netValue}",
    IT: "Giorno: Lordo {gross} · Pausa effettiva {breakValue} · Netto {netValue}",
    TR: "Gün: Brüt {gross} · Etkili mola {breakValue} · Net {netValue}",
    SQ: "Dita: Bruto {gross} · Pushimi efektiv {breakValue} · Neto {netValue}",
    KU: "Roj: Berî derxistin {gross} · Navbera bi bandor {breakValue} · Safî {netValue}",
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
  timesheetFutureDateEditForbidden: {
    DE: "Du kannst keine Einträge für zukünftige Tage bearbeiten.",
    EN: "You cannot edit entries for future days.",
    IT: "Non puoi modificare voci per giorni futuri.",
    TR: "Gelecek günler için kayıt düzenleyemezsiniz.",
    SQ: "Nuk mund të ndryshoni regjistrime për ditë të ardhshme.",
    KU: "Tu nikarî tomarên rojên pêşerojê sererast bikî.",
  },
  timesheetOlderMissingEntriesFirst: {
    DE: "Dir fehlen noch Arbeitseinträge ab dem {date}. Bitte trage zuerst die ältesten fehlenden Tage nach.",
    EN: "You still have missing work entries starting from {date}. Please add the oldest missing days first.",
    IT: "Ti mancano ancora registrazioni di lavoro a partire dal {date}. Inserisci prima i giorni mancanti più vecchi.",
    TR: "{date} tarihinden itibaren hâlâ eksik çalışma kayıtlarınız var. Lütfen önce en eski eksik günleri girin.",
    SQ: "Ju mungojnë ende regjistrime pune duke filluar nga {date}. Ju lutem regjistroni së pari ditët më të vjetra që mungojnë.",
    KU: "Ji {date} û pê ve hîn jî tomarên karê te kêm in. Ji kerema xwe pêşî rojên herî kevn ên winda binivîse.",
  },
  timesheetLockedDayRequiresCorrection: {
    DE: "Dieser vergangene Tag ist gesperrt. Bitte stelle einen Nachtragsantrag, damit der Admin ihn freigeben kann.",
    EN: "This past day is locked. Please submit a correction request so the admin can approve it.",
    IT: "Questo giorno passato è bloccato. Invia una richiesta di integrazione affinché l'admin possa approvarlo.",
    TR: "Bu geçmiş gün kilitlidir. Lütfen yöneticinin onaylayabilmesi için bir düzeltme talebi gönderin.",
    SQ: "Kjo ditë e kaluar është e bllokuar. Ju lutem dërgoni një kërkesë korrigjimi që admini ta miratojë.",
    KU: "Ev roja borî hatiye girtin. Ji kerema xwe daxwaza rastkirinê bişîne da ku admin wê veke.",
  },
};

export type AdminTasksTextKey =
  | "adminTasksActiveLabel"
  | "loading"
  | "loadError"
  | "unexpectedServerResponse"
  | "networkLoadError"
  | "createTaskError"
  | "createTaskSuccess"
  | "networkCreateError"
  | "createTaskTitle"
  | "employee"
  | "pleaseChoose"
  | "title"
  | "description"
  | "category"
  | "requiredAction"
  | "referenceStart"
  | "referenceEnd"
  | "createTaskSubmitting"
  | "createTaskSubmit"
  | "tasksOverview"
  | "searchPlaceholder"
  | "allCategories"
  | "openTasks"
  | "noOpenTasks"
  | "completedTasks"
  | "noCompletedTasks"
  | "employeePrefix"
  | "requiredPrefix"
  | "referenceRangePrefix"
  | "open"
  | "completedAt"
  | "completedBy"
  | "noReviewRequired"
  | "workEntryRequired"
  | "vacationEntryRequired"
  | "sickEntryRequired"
  | "categoryWorkTime"
  | "categoryVacation"
  | "categorySickness"
  | "categoryGeneral"
  | "until"
  | "dash"
  | "taskNotFound"
  | "noAccess"
  | "taskAlreadyCompleted"
  | "referenceWithoutDate"
  | "taskCompleteRequirementWorkTime"
  | "taskCompleteRequirementVacation"
  | "taskCompleteRequirementSickness"
  | "taskCompleteRequirementGeneric"
  | "notLoggedIn"
  | "invalidDate"
  | "breakRangeIncomplete"
  | "invalidBreakStart"
  | "invalidBreakEnd"
  | "notAllowed"
  | "employeeNotFoundOrInactive"
  | "workTimeEntryRequiredFirst"
  | "taskCompletedPushTitle"
  | "invalidData"
  | "entryNotFound"
  | "idMissing"
  | "notFound"
  | "sickOnlyFullDayRecorded"
  | "sickCannotBeUnpaidRecorded"
  | "halfDaysOnlyForVacation"
  | "halfVacationOnlySingleDateCreate"
  | "endDateBeforeStartDate"
  | "crossYearAbsencesNotSupportedCreate"
  | "employeesCannotCreateFinalAbsencesDirectly"
  | "noVacationWorkdaysInRange"
  | "toBeforeFrom"
  | "sickOnlyFullDay"
  | "sickCannotBeUnpaid"
  | "halfVacationOnlySingleDateEdit"
  | "newEndBeforeNewStart"
  | "crossYearAbsencesNotSupportedEdit"
  | "oldPaidVacationUnitsInvalid"
  | "oldUnpaidVacationUnitsInvalid"
  | "newPaidVacationUnitsInvalid"
  | "newUnpaidVacationUnitsInvalid"
  | "employeesCannotEditFinalAbsencesDirectly"
  | "vacationUnitsSplitMismatch"
  | "employeesCannotDeleteFinalAbsencesDirectly"
  | "idOrRangeRequired"
  | "notLoggedInWithPeriod"
  | "dateMustBeYmd"
  | "invalidAbsenceType"
  | "endBeforeStart"
  | "crossYearRequestsNotSupported"
  | "sickOnlyFullDayRequested"
  | "sickCannotBeRequestedUnpaid"
  | "halfVacationOnlySingleDateRequest"
  | "approvedAbsenceAlreadyExists"
  | "pendingRequestAlreadyExists"
  | "newAbsenceRequestPushTitle";

export const ADMIN_TASKS_UI_TEXTS: Record<
  AdminTasksTextKey,
  Record<AppUiLanguage, string>
> = {
  adminTasksActiveLabel: {
    DE: "Aufgaben verwalten",
    EN: "Manage tasks",
    IT: "Gestisci attività",
    TR: "Görevleri yönet",
    SQ: "Menaxho detyrat",
    KU: "Erkan birêve bibe",
  },
  loading: {
    DE: "Lade...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
  },
  loadError: {
    DE: "Aufgaben konnten nicht geladen werden.",
    EN: "Tasks could not be loaded.",
    IT: "Impossibile caricare le attività.",
    TR: "Görevler yüklenemedi.",
    SQ: "Detyrat nuk mund të ngarkoheshin.",
    KU: "Erk nehatin barkirin.",
  },
  unexpectedServerResponse: {
    DE: "Unerwartete Antwort vom Server.",
    EN: "Unexpected response from server.",
    IT: "Risposta imprevista dal server.",
    TR: "Sunucudan beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur nga serveri.",
    KU: "Bersiva nexwestî ji serverê.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Aufgaben.",
    EN: "Network error while loading tasks.",
    IT: "Errore di rete durante il caricamento delle attività.",
    TR: "Görevler yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të detyrave.",
    KU: "Dema barkirina erkan de xeletiya torê çêbû.",
  },
  createTaskError: {
    DE: "Aufgabe konnte nicht erstellt werden.",
    EN: "Task could not be created.",
    IT: "Impossibile creare l'attività.",
    TR: "Görev oluşturulamadı.",
    SQ: "Detyra nuk mund të krijohej.",
    KU: "Erk nehate afirandin.",
  },
  createTaskSuccess: {
    DE: "Aufgabe wurde erstellt.",
    EN: "Task was created.",
    IT: "Attività creata.",
    TR: "Görev oluşturuldu.",
    SQ: "Detyra u krijua.",
    KU: "Erk hate afirandin.",
  },
  networkCreateError: {
    DE: "Netzwerkfehler beim Erstellen der Aufgabe.",
    EN: "Network error while creating task.",
    IT: "Errore di rete durante la creazione dell'attività.",
    TR: "Görev oluşturulurken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë krijimit të detyrës.",
    KU: "Dema afirandina erkê de xeletiya torê çêbû.",
  },
  createTaskTitle: {
    DE: "Neue Aufgabe erstellen",
    EN: "Create new task",
    IT: "Crea nuova attività",
    TR: "Yeni görev oluştur",
    SQ: "Krijo detyrë të re",
    KU: "Erkeke nû biafirîne",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
  },
  pleaseChoose: {
    DE: "— Bitte wählen —",
    EN: "— Please choose —",
    IT: "— Seleziona —",
    TR: "— Lütfen seçin —",
    SQ: "— Ju lutem zgjidhni —",
    KU: "— Ji kerema xwe hilbijêre —",
  },
  title: {
    DE: "Titel",
    EN: "Title",
    IT: "Titolo",
    TR: "Başlık",
    SQ: "Titulli",
    KU: "Sernav",
  },
  description: {
    DE: "Beschreibung",
    EN: "Description",
    IT: "Descrizione",
    TR: "Açıklama",
    SQ: "Përshkrimi",
    KU: "Danasîn",
  },
  category: {
    DE: "Kategorie",
    EN: "Category",
    IT: "Categoria",
    TR: "Kategori",
    SQ: "Kategoria",
    KU: "Kategorî",
  },
  requiredAction: {
    DE: "Pflichtaktion",
    EN: "Required action",
    IT: "Azione richiesta",
    TR: "Gerekli işlem",
    SQ: "Veprimi i detyrueshëm",
    KU: "Çalakiya pêwîst",
  },
  referenceStart: {
    DE: "Bezugszeitraum von",
    EN: "Reference period from",
    IT: "Periodo di riferimento da",
    TR: "İlgili dönem başlangıcı",
    SQ: "Periudha referente nga",
    KU: "Dema referansê ji",
  },
  referenceEnd: {
    DE: "Bezugszeitraum bis",
    EN: "Reference period until",
    IT: "Periodo di riferimento fino a",
    TR: "İlgili dönem bitişi",
    SQ: "Periudha referente deri më",
    KU: "Dema referansê heta",
  },
  createTaskSubmitting: {
    DE: "Erstelle...",
    EN: "Creating...",
    IT: "Creazione in corso...",
    TR: "Oluşturuluyor...",
    SQ: "Duke krijuar...",
    KU: "Tê afirandin...",
  },
  createTaskSubmit: {
    DE: "Aufgabe erstellen",
    EN: "Create task",
    IT: "Crea attività",
    TR: "Görev oluştur",
    SQ: "Krijo detyrë",
    KU: "Erk biafirîne",
  },
  tasksOverview: {
    DE: "Aufgabenübersicht",
    EN: "Task overview",
    IT: "Panoramica attività",
    TR: "Görev genel görünümü",
    SQ: "Përmbledhje detyrash",
    KU: "Têgihîştina erkan",
  },
  searchPlaceholder: {
    DE: "Titel, Beschreibung oder Mitarbeiter suchen…",
    EN: "Search title, description, or employee…",
    IT: "Cerca titolo, descrizione o dipendente…",
    TR: "Başlık, açıklama veya çalışan ara…",
    SQ: "Kërko titull, përshkrim ose punonjës…",
    KU: "Sernav, danasîn an karmend bigere…",
  },
  allCategories: {
    DE: "Alle Kategorien",
    EN: "All categories",
    IT: "Tutte le categorie",
    TR: "Tüm kategoriler",
    SQ: "Të gjitha kategoritë",
    KU: "Hemû kategorî",
  },
  openTasks: {
    DE: "Offene Aufgaben",
    EN: "Open tasks",
    IT: "Attività aperte",
    TR: "Açık görevler",
    SQ: "Detyra të hapura",
    KU: "Erkên vekirî",
  },
  noOpenTasks: {
    DE: "Keine offenen Aufgaben vorhanden.",
    EN: "No open tasks available.",
    IT: "Nessuna attività aperta disponibile.",
    TR: "Açık görev yok.",
    SQ: "Nuk ka detyra të hapura.",
    KU: "Ti erkê vekirî tune ye.",
  },
  completedTasks: {
    DE: "Erledigte Aufgaben",
    EN: "Completed tasks",
    IT: "Attività completate",
    TR: "Tamamlanan görevler",
    SQ: "Detyra të përfunduara",
    KU: "Erkên temam bûyî",
  },
  noCompletedTasks: {
    DE: "Keine erledigten Aufgaben vorhanden.",
    EN: "No completed tasks available.",
    IT: "Nessuna attività completata disponibile.",
    TR: "Tamamlanan görev yok.",
    SQ: "Nuk ka detyra të përfunduara.",
    KU: "Ti erkê temam bûyî tune ye.",
  },
  employeePrefix: {
    DE: "Mitarbeiter:",
    EN: "Employee:",
    IT: "Dipendente:",
    TR: "Çalışan:",
    SQ: "Punonjësi:",
    KU: "Karmend:",
  },
  requiredPrefix: {
    DE: "Pflicht:",
    EN: "Required:",
    IT: "Obbligo:",
    TR: "Gerekli:",
    SQ: "Detyrim:",
    KU: "Pêwîst:",
  },
  referenceRangePrefix: {
    DE: "Bezugszeitraum:",
    EN: "Reference period:",
    IT: "Periodo di riferimento:",
    TR: "İlgili dönem:",
    SQ: "Periudha referente:",
    KU: "Dema referansê:",
  },
  open: {
    DE: "Öffnen",
    EN: "Open",
    IT: "Apri",
    TR: "Aç",
    SQ: "Hap",
    KU: "Veke",
  },
  completedAt: {
    DE: "Erledigt am:",
    EN: "Completed on:",
    IT: "Completata il:",
    TR: "Tamamlanma tarihi:",
    SQ: "Përfunduar më:",
    KU: "Di vê rojê de temam bû:",
  },
  completedBy: {
    DE: "Erledigt von:",
    EN: "Completed by:",
    IT: "Completata da:",
    TR: "Tamamlayan:",
    SQ: "Përfunduar nga:",
    KU: "Temam kirin ji aliyê:",
  },
  noReviewRequired: {
    DE: "Keine Pflichtprüfung",
    EN: "No required review",
    IT: "Nessun controllo obbligatorio",
    TR: "Zorunlu kontrol yok",
    SQ: "Pa kontroll të detyrueshëm",
    KU: "Kontrola mecbûrî tune",
  },
  workEntryRequired: {
    DE: "Arbeitszeit-Eintrag erforderlich",
    EN: "Work time entry required",
    IT: "Registrazione orario richiesta",
    TR: "Çalışma süresi kaydı gerekli",
    SQ: "Kërkohet regjistrim i orarit të punës",
    KU: "Tomarkirina demê ya karê pêwîst e",
  },
  vacationEntryRequired: {
    DE: "Urlaubs-Eintrag erforderlich",
    EN: "Vacation entry required",
    IT: "Registrazione ferie richiesta",
    TR: "İzin kaydı gerekli",
    SQ: "Kërkohet regjistrim i pushimit",
    KU: "Tomarkirina betlaneyê pêwîst e",
  },
  sickEntryRequired: {
    DE: "Krankheits-Eintrag erforderlich",
    EN: "Sick leave entry required",
    IT: "Registrazione malattia richiesta",
    TR: "Hastalık kaydı gerekli",
    SQ: "Kërkohet regjistrim i sëmundjes",
    KU: "Tomarkirina nexweşiyê pêwîst e",
  },
  categoryWorkTime: {
    DE: "Arbeitszeit",
    EN: "Work time",
    IT: "Orario di lavoro",
    TR: "Çalışma süresi",
    SQ: "Orari i punës",
    KU: "Dema karê",
  },
  categoryVacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Betlane",
  },
  categorySickness: {
    DE: "Krankheit",
    EN: "Sickness",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmundje",
    KU: "Nexweşî",
  },
  categoryGeneral: {
    DE: "Allgemein",
    EN: "General",
    IT: "Generale",
    TR: "Genel",
    SQ: "Përgjithshme",
    KU: "Giştî",
  },
  until: {
    DE: "bis",
    EN: "to",
    IT: "fino a",
    TR: "ile",
    SQ: "deri më",
    KU: "heta",
  },
  dash: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    KU: "—",
  },
  taskNotFound: {
    DE: "Aufgabe nicht gefunden.",
    EN: "Task not found.",
    IT: "Attività non trovata.",
    TR: "Görev bulunamadı.",
    SQ: "Detyra nuk u gjet.",
    KU: "Erk nehat dîtin.",
  },
  noAccess: {
    DE: "Kein Zugriff.",
    EN: "No access.",
    IT: "Nessun accesso.",
    TR: "Erişim yok.",
    SQ: "Nuk ka qasje.",
    KU: "Gihiştin tune ye.",
  },
  taskAlreadyCompleted: {
    DE: "Aufgabe ist bereits erledigt.",
    EN: "Task is already completed.",
    IT: "L'attività è già completata.",
    TR: "Görev zaten tamamlandı.",
    SQ: "Detyra është tashmë e kryer.",
    KU: "Erk jixwe qediya ye.",
  },
  referenceWithoutDate: {
    DE: "ohne Datum",
    EN: "without date",
    IT: "senza data",
    TR: "tarihsiz",
    SQ: "pa datë",
    KU: "bê dîrok",
  },
  taskCompleteRequirementWorkTime: {
    DE: "Die Aufgabe kann erst erledigt werden, wenn für {referenceLabel} alle erforderlichen Arbeitszeiteinträge vorhanden sind.",
    EN: "The task can only be completed once all required work time entries exist for {referenceLabel}.",
    IT: "L'attività può essere completata solo quando per {referenceLabel} sono presenti tutte le registrazioni richieste dell'orario di lavoro.",
    TR: "Görev ancak {referenceLabel} için gerekli tüm çalışma süresi kayıtları mevcut olduğunda tamamlanabilir.",
    SQ: "Detyra mund të përfundohet vetëm kur për {referenceLabel} ekzistojnë të gjitha regjistrimet e kërkuara të kohës së punës.",
    KU: "Erk tenê dema ku ji bo {referenceLabel} hemû tomarên pêwîst ên dema karê hene dikare were temamkirin.",
  },
  taskCompleteRequirementVacation: {
    DE: "Die Aufgabe kann erst erledigt werden, wenn für {referenceLabel} alle erforderlichen Urlaubseinträge oder passenden Urlaubsanträge vorhanden sind.",
    EN: "The task can only be completed once all required vacation entries or matching vacation requests exist for {referenceLabel}.",
    IT: "L'attività può essere completata solo quando per {referenceLabel} sono presenti tutte le registrazioni ferie richieste o le richieste ferie corrispondenti.",
    TR: "Görev ancak {referenceLabel} için gerekli tüm izin kayıtları veya uygun izin talepleri mevcut olduğunda tamamlanabilir.",
    SQ: "Detyra mund të përfundohet vetëm kur për {referenceLabel} ekzistojnë të gjitha regjistrimet e kërkuara të pushimit ose kërkesat përkatëse për pushim.",
    KU: "Erk tenê dema ku ji bo {referenceLabel} hemû tomarên pêwîst ên betlaneyê an daxwazên guncaw ên betlaneyê hene dikare were temamkirin.",
  },
  taskCompleteRequirementSickness: {
    DE: "Die Aufgabe kann erst erledigt werden, wenn für {referenceLabel} alle erforderlichen Krankheitseinträge oder passenden Krankheitsanträge vorhanden sind.",
    EN: "The task can only be completed once all required sickness entries or matching sickness requests exist for {referenceLabel}.",
    IT: "L'attività può essere completata solo quando per {referenceLabel} sono presenti tutte le registrazioni di malattia richieste o le richieste corrispondenti.",
    TR: "Görev ancak {referenceLabel} için gerekli tüm hastalık kayıtları veya uygun hastalık talepleri mevcut olduğunda tamamlanabilir.",
    SQ: "Detyra mund të përfundohet vetëm kur për {referenceLabel} ekzistojnë të gjitha regjistrimet e kërkuara të sëmundjes ose kërkesat përkatëse.",
    KU: "Erk tenê dema ku ji bo {referenceLabel} hemû tomarên pêwîst ên nexweşiyê an daxwazên guncaw ên nexweşiyê hene dikare were temamkirin.",
  },
  taskCompleteRequirementGeneric: {
    DE: "Die geforderte Aktion wurde noch nicht erfüllt.",
    EN: "The required action has not been fulfilled yet.",
    IT: "L'azione richiesta non è stata ancora completata.",
    TR: "Gerekli işlem henüz yerine getirilmedi.",
    SQ: "Veprimi i kërkuar nuk është përmbushur ende.",
    KU: "Çalakiya pêwîst hîn nehatiye cîbicîkirin.",
  },
  notLoggedIn: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk jeni i identifikuar.",
    KU: "Têketin nehatiye kirin.",
  },
  invalidDate: {
    DE: "Ungültiges Datum.",
    EN: "Invalid date.",
    IT: "Data non valida.",
    TR: "Geçersiz tarih.",
    SQ: "Datë e pavlefshme.",
    KU: "Dîroka nederbasdar.",
  },
  breakRangeIncomplete: {
    DE: "Bitte Pause von und bis vollständig eingeben.",
    EN: "Please enter both break start and break end.",
    IT: "Inserisci sia l'inizio sia la fine della pausa.",
    TR: "Lütfen mola başlangıcı ve bitişini eksiksiz girin.",
    SQ: "Ju lutem plotësoni fillimin dhe mbarimin e pushimit.",
    KU: "Ji kerema xwe destpêk û dawiya navberê bi temamî binivîse.",
  },
  invalidBreakStart: {
    DE: "Pause-Beginn ist ungültig.",
    EN: "Break start is invalid.",
    IT: "L'inizio della pausa non è valido.",
    TR: "Mola başlangıcı geçersiz.",
    SQ: "Fillimi i pushimit është i pavlefshëm.",
    KU: "Destpêka navberê nederbasdar e.",
  },
  invalidBreakEnd: {
    DE: "Pause-Ende ist ungültig.",
    EN: "Break end is invalid.",
    IT: "La fine della pausa non è valida.",
    TR: "Mola bitişi geçersiz.",
    SQ: "Mbarimi i pushimit është i pavlefshëm.",
    KU: "Dawiya navberê nederbasdar e.",
  },
  notAllowed: {
    DE: "Nicht erlaubt.",
    EN: "Not allowed.",
    IT: "Non consentito.",
    TR: "İzin verilmiyor.",
    SQ: "Nuk lejohet.",
    KU: "Destûr nayê dayîn.",
  },
  employeeNotFoundOrInactive: {
    DE: "Mitarbeiter nicht gefunden oder inaktiv.",
    EN: "Employee not found or inactive.",
    IT: "Dipendente non trovato o inattivo.",
    TR: "Çalışan bulunamadı veya pasif.",
    SQ: "Punonjësi nuk u gjet ose është joaktiv.",
    KU: "Karmend nehate dîtin an neçalak e.",
  },
  workTimeEntryRequiredFirst: {
    DE: "Trage erst deine Arbeitszeit für diesen Tag ein.",
    EN: "Please enter your work time for this day first.",
    IT: "Inserisci prima il tuo orario di lavoro per questo giorno.",
    TR: "Lütfen önce bu gün için çalışma süreni gir.",
    SQ: "Ju lutem fillimisht regjistroni orarin e punës për këtë ditë.",
    KU: "Ji kerema xwe pêşî ji bo vê rojê dema karê xwe binivîse.",
  },
  taskCompletedPushTitle: {
    DE: "Aufgabe erledigt",
    EN: "Task completed",
    IT: "Attività completata",
    TR: "Görev tamamlandı",
    SQ: "Detyra u përfundua",
    KU: "Erk hate temamkirin",
  },
  invalidData: {
    DE: "Ungültige Daten.",
    EN: "Invalid data.",
    IT: "Dati non validi.",
    TR: "Geçersiz veriler.",
    SQ: "Të dhëna të pavlefshme.",
    KU: "Daneyên nederbasdar.",
  },
  entryNotFound: {
    DE: "Eintrag nicht gefunden.",
    EN: "Entry not found.",
    IT: "Voce non trovata.",
    TR: "Kayıt bulunamadı.",
    SQ: "Regjistrimi nuk u gjet.",
    KU: "Tomar nehate dîtin.",
  },
  idMissing: {
    DE: "ID fehlt.",
    EN: "ID is missing.",
    IT: "Manca l'ID.",
    TR: "Kimlik eksik.",
    SQ: "ID mungon.",
    KU: "ID tune ye.",
  },
  notFound: {
    DE: "Nicht gefunden.",
    EN: "Not found.",
    IT: "Non trovato.",
    TR: "Bulunamadı.",
    SQ: "Nuk u gjet.",
    KU: "Nehate dîtin.",
  },
  sickOnlyFullDayRecorded: {
    DE: "Krankheit kann nur ganztägig erfasst werden.",
    EN: "Sickness can only be recorded as a full day.",
    IT: "La malattia può essere registrata solo per l'intera giornata.",
    TR: "Hastalık sadece tam gün olarak kaydedilebilir.",
    SQ: "Sëmundja mund të regjistrohet vetëm si ditë e plotë.",
    KU: "Nexweşî tenê dikare wekî rojek tevahî were tomar kirin.",
  },
  sickCannotBeUnpaidRecorded: {
    DE: "Krankheit darf nicht als unbezahlt erfasst werden.",
    EN: "Sickness cannot be recorded as unpaid.",
    IT: "La malattia non può essere registrata come non retribuita.",
    TR: "Hastalık ücretsiz olarak kaydedilemez.",
    SQ: "Sëmundja nuk mund të regjistrohet si e papaguar.",
    KU: "Nexweşî nikare wekî bêpere were tomar kirin.",
  },
  halfDaysOnlyForVacation: {
    DE: "Halbe Tage sind nur für Urlaub erlaubt.",
    EN: "Half days are only allowed for vacation.",
    IT: "Le mezze giornate sono consentite solo per le ferie.",
    TR: "Yarım günler yalnızca izin için geçerlidir.",
    SQ: "Gjysmë ditët lejohen vetëm për pushim.",
    KU: "Nîvroj tenê ji bo betlaneyê destûr heye.",
  },
  halfVacationOnlySingleDateCreate: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum angelegt werden.",
    EN: "A half vacation day can only be created for exactly one date.",
    IT: "Una mezza giornata di ferie può essere creata solo per una singola data.",
    TR: "Yarım izin günü yalnızca tek bir tarih için oluşturulabilir.",
    SQ: "Një gjysmë dite pushimi mund të krijohet vetëm për një datë të vetme.",
    KU: "Nîvroj betlaneyê tenê ji bo yek dîrokê dikare were afirandin.",
  },
  endDateBeforeStartDate: {
    DE: "Enddatum darf nicht vor Startdatum liegen.",
    EN: "End date must not be before start date.",
    IT: "La data di fine non può essere precedente alla data di inizio.",
    TR: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    SQ: "Data e mbarimit nuk mund të jetë para datës së fillimit.",
    KU: "Dîroka dawiyê nikare berî dîroka destpêkê be.",
  },
  crossYearAbsencesNotSupportedCreate: {
    DE: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr separat anlegen.",
    EN: "Absences spanning multiple years are not supported yet. Please create them separately for each calendar year.",
    IT: "Le assenze su più anni non sono ancora supportate. Creale separatamente per ogni anno solare.",
    TR: "Yıllar arası devreden devamsızlıklar henüz desteklenmiyor. Lütfen her takvim yılı için ayrı oluşturun.",
    SQ: "Mungesat që përfshijnë disa vite ende nuk mbështeten. Ju lutem krijojini veçmas për çdo vit kalendarik.",
    KU: "Nebûna ku li ser çend salan dirêj dibin hêj nayên piştgirî kirin. Ji kerema xwe ji bo her sala salnameyê cuda biafirînin.",
  },
  employeesCannotCreateFinalAbsencesDirectly: {
    DE: "Mitarbeiter dürfen keine finalen Abwesenheiten direkt anlegen. Bitte Antrag stellen.",
    EN: "Employees cannot create final absences directly. Please submit a request.",
    IT: "I dipendenti non possono creare assenze definitive direttamente. Invia invece una richiesta.",
    TR: "Çalışanlar kesin devamsızlıkları doğrudan oluşturamaz. Lütfen talep oluşturun.",
    SQ: "Punonjësit nuk mund të krijojnë drejtpërdrejt mungesa përfundimtare. Ju lutem paraqisni një kërkesë.",
    KU: "Karmend nikarin nebûnên dawî rasterast biafirînin. Ji kerema xwe daxwazek bişînin.",
  },
  noVacationWorkdaysInRange: {
    DE: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
    EN: "There are no workdays for vacation in the selected period. Weekends are excluded automatically.",
    IT: "Nel periodo selezionato non ci sono giorni lavorativi per le ferie. I fine settimana vengono esclusi automaticamente.",
    TR: "Seçilen aralıkta izin için iş günü yok. Hafta sonları otomatik olarak hariç tutulur.",
    SQ: "Në periudhën e zgjedhur nuk ka ditë pune për pushim. Fundjavat përjashtohen automatikisht.",
    KU: "Di navbera hilbijartî de ji bo betlaneyê rojên kar tune ne. Dawiyên hefteyê bixweber nayên jimartin.",
  },
  toBeforeFrom: {
    DE: "Bis-Datum darf nicht vor Von-Datum liegen.",
    EN: "End date must not be before start date.",
    IT: "La data di fine non può essere precedente alla data di inizio.",
    TR: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    SQ: "Data e mbarimit nuk mund të jetë para datës së fillimit.",
    KU: "Dîroka dawiyê nikare berî dîroka destpêkê be.",
  },
  sickOnlyFullDay: {
    DE: "Krankheit kann nur ganztägig sein.",
    EN: "Sickness can only be full day.",
    IT: "La malattia può essere solo a giornata intera.",
    TR: "Hastalık yalnızca tam gün olabilir.",
    SQ: "Sëmundja mund të jetë vetëm me ditë të plotë.",
    KU: "Nexweşî tenê dikare tevahî rojekê be.",
  },
  sickCannotBeUnpaid: {
    DE: "Krankheit darf nicht unbezahlt sein.",
    EN: "Sickness cannot be unpaid.",
    IT: "La malattia non può essere non retribuita.",
    TR: "Hastalık ücretsiz olamaz.",
    SQ: "Sëmundja nuk mund të jetë e papaguar.",
    KU: "Nexweşî nikare bêpere be.",
  },
  halfVacationOnlySingleDateEdit: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum bestehen.",
    EN: "A half vacation day can only exist for exactly one date.",
    IT: "Una mezza giornata di ferie può valere solo per una singola data.",
    TR: "Yarım izin günü yalnızca tek bir tarih için geçerli olabilir.",
    SQ: "Një gjysmë dite pushimi mund të vlejë vetëm për një datë të vetme.",
    KU: "Nîvroj betlaneyê tenê dikare ji bo yek dîrokê hebe.",
  },
  newEndBeforeNewStart: {
    DE: "Neues Enddatum darf nicht vor neuem Startdatum liegen.",
    EN: "New end date must not be before new start date.",
    IT: "La nuova data di fine non può essere precedente alla nuova data di inizio.",
    TR: "Yeni bitiş tarihi yeni başlangıç tarihinden önce olamaz.",
    SQ: "Data e re e mbarimit nuk mund të jetë para datës së re të fillimit.",
    KU: "Dîroka dawiyê ya nû nikare berî dîroka destpêkê ya nû be.",
  },
  crossYearAbsencesNotSupportedEdit: {
    DE: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr separat bearbeiten.",
    EN: "Absences spanning multiple years are not supported yet. Please edit them separately for each calendar year.",
    IT: "Le assenze su più anni non sono ancora supportate. Modificale separatamente per ogni anno solare.",
    TR: "Yıllar arası devreden devamsızlıklar henüz desteklenmiyor. Lütfen her takvim yılı için ayrı düzenleyin.",
    SQ: "Mungesat që përfshijnë disa vite ende nuk mbështeten. Ju lutem ndryshojini veçmas për çdo vit kalendarik.",
    KU: "Nebûna ku li ser çend salan dirêj dibin hêj nayên piştgirî kirin. Ji kerema xwe ji bo her sala salnameyê cuda biguherînin.",
  },
  oldPaidVacationUnitsInvalid: {
    DE: "Alte bezahlte Urlaubseinheiten sind ungültig.",
    EN: "Old paid vacation units are invalid.",
    IT: "Le vecchie unità di ferie retribuite non sono valide.",
    TR: "Eski ücretli izin birimleri geçersiz.",
    SQ: "Njësitë e vjetra të pushimit të paguar janë të pavlefshme.",
    KU: "Yekeyên kevn ên betlaneya bi pere nederbasdar in.",
  },
  oldUnpaidVacationUnitsInvalid: {
    DE: "Alte unbezahlte Urlaubseinheiten sind ungültig.",
    EN: "Old unpaid vacation units are invalid.",
    IT: "Le vecchie unità di ferie non retribuite non sono valide.",
    TR: "Eski ücretsiz izin birimleri geçersiz.",
    SQ: "Njësitë e vjetra të pushimit të papaguar janë të pavlefshme.",
    KU: "Yekeyên kevn ên betlaneya bêpere nederbasdar in.",
  },
  newPaidVacationUnitsInvalid: {
    DE: "Neue bezahlte Urlaubseinheiten sind ungültig.",
    EN: "New paid vacation units are invalid.",
    IT: "Le nuove unità di ferie retribuite non sono valide.",
    TR: "Yeni ücretli izin birimleri geçersiz.",
    SQ: "Njësitë e reja të pushimit të paguar janë të pavlefshme.",
    KU: "Yekeyên nû ên betlaneya bi pere nederbasdar in.",
  },
  newUnpaidVacationUnitsInvalid: {
    DE: "Neue unbezahlte Urlaubseinheiten sind ungültig.",
    EN: "New unpaid vacation units are invalid.",
    IT: "Le nuove unità di ferie non retribuite non sono valide.",
    TR: "Yeni ücretsiz izin birimleri geçersiz.",
    SQ: "Njësitë e reja të pushimit të papaguar janë të pavlefshme.",
    KU: "Yekeyên nû ên betlaneya bêpere nederbasdar in.",
  },
  employeesCannotEditFinalAbsencesDirectly: {
    DE: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt bearbeiten.",
    EN: "Employees cannot edit final absences directly.",
    IT: "I dipendenti non possono modificare direttamente le assenze definitive.",
    TR: "Çalışanlar kesin devamsızlıkları doğrudan düzenleyemez.",
    SQ: "Punonjësit nuk mund të ndryshojnë drejtpërdrejt mungesat përfundimtare.",
    KU: "Karmend nikarin nebûnên dawî rasterast biguherînin.",
  },
  vacationUnitsSplitMismatch: {
    DE: "Die neue Aufteilung in bezahlte und unbezahlte Urlaubseinheiten passt nicht zum Zeitraum.",
    EN: "The new split of paid and unpaid vacation units does not match the selected period.",
    IT: "La nuova suddivisione tra unità di ferie retribuite e non retribuite non corrisponde al periodo selezionato.",
    TR: "Ücretli ve ücretsiz izin birimlerinin yeni dağılımı seçilen döneme uymuyor.",
    SQ: "Ndarja e re e njësive të pushimit të paguar dhe të papaguar nuk përputhet me periudhën e zgjedhur.",
    KU: "Parvekirina nû ya yekeyên betlaneya bi pere û bêpere bi navbera hilbijartî re nagunce.",
  },
  employeesCannotDeleteFinalAbsencesDirectly: {
    DE: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt löschen.",
    EN: "Employees cannot delete final absences directly.",
    IT: "I dipendenti non possono eliminare direttamente le assenze definitive.",
    TR: "Çalışanlar kesin devamsızlıkları doğrudan silemez.",
    SQ: "Punonjësit nuk mund të fshijnë drejtpërdrejt mungesat përfundimtare.",
    KU: "Karmend nikarin nebûnên dawî rasterast jêbibin.",
  },
  idOrRangeRequired: {
    DE: "Entweder eine ID oder ein gültiger Bereich mit von, bis und Typ ist erforderlich.",
    EN: "Either an ID or a valid range with from, to, and type is required.",
    IT: "È richiesta un'ID oppure un intervallo valido con da, a e tipo.",
    TR: "Kimlik ya da from, to ve type içeren geçerli bir aralık gerekli.",
    SQ: "Kërkohet një ID ose një interval i vlefshëm me from, to dhe type.",
    KU: "Yan ID an jî navberek derbasdar bi from, to û type pêwîst e.",
  },
  notLoggedInWithPeriod: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk jeni i identifikuar.",
    KU: "Têketin nehatiye kirin.",
  },
  dateMustBeYmd: {
    DE: "Start- und Enddatum müssen im Format YYYY-MM-DD angegeben werden.",
    EN: "Start and end date must be in YYYY-MM-DD format.",
    IT: "La data di inizio e di fine devono essere nel formato YYYY-MM-DD.",
    TR: "Başlangıç ve bitiş tarihi YYYY-MM-DD formatında olmalıdır.",
    SQ: "Data e fillimit dhe e mbarimit duhet të jenë në formatin YYYY-MM-DD.",
    KU: "Dîroka destpêk û dawiyê divê di forma YYYY-MM-DD de bin.",
  },
  invalidAbsenceType: {
    DE: "Ungültiger Abwesenheitstyp.",
    EN: "Invalid absence type.",
    IT: "Tipo di assenza non valido.",
    TR: "Geçersiz devamsızlık türü.",
    SQ: "Lloj mungese i pavlefshëm.",
    KU: "Cureya nebûnê nederbasdar.",
  },
  endBeforeStart: {
    DE: "Ende darf nicht vor Start liegen.",
    EN: "End must not be before start.",
    IT: "La fine non può essere precedente all'inizio.",
    TR: "Bitiş başlangıçtan önce olamaz.",
    SQ: "Mbarimi nuk mund të jetë para fillimit.",
    KU: "Dawî nikare berî destpêkê be.",
  },
  crossYearRequestsNotSupported: {
    DE: "Jahresübergreifende Urlaubs- oder Krankheitsanträge werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr einen separaten Antrag stellen.",
    EN: "Vacation or sickness requests spanning multiple years are not supported yet. Please submit a separate request for each calendar year.",
    IT: "Le richieste di ferie o malattia su più anni non sono ancora supportate. Invia una richiesta separata per ogni anno solare.",
    TR: "Yıllar arası devreden izin veya hastalık talepleri henüz desteklenmiyor. Lütfen her takvim yılı için ayrı bir talep gönderin.",
    SQ: "Kërkesat për pushim ose sëmundje që përfshijnë disa vite ende nuk mbështeten. Ju lutem dërgoni një kërkesë të veçantë për çdo vit kalendarik.",
    KU: "Daxwazên betlane an nexweşiyê ku li ser çend salan dirêj dibin hêj nayên piştgirî kirin. Ji kerema xwe ji bo her sala salnameyê daxwazek cuda bişînin.",
  },
  sickOnlyFullDayRequested: {
    DE: "Krankheit kann nur ganztägig beantragt werden.",
    EN: "Sickness can only be requested as a full day.",
    IT: "La malattia può essere richiesta solo per l'intera giornata.",
    TR: "Hastalık yalnızca tam gün olarak talep edilebilir.",
    SQ: "Sëmundja mund të kërkohet vetëm si ditë e plotë.",
    KU: "Nexweşî tenê dikare wekî rojek tevahî were daxwaz kirin.",
  },
  sickCannotBeRequestedUnpaid: {
    DE: "Krankheit darf nicht als unbezahlt beantragt werden.",
    EN: "Sickness cannot be requested as unpaid.",
    IT: "La malattia non può essere richiesta come non retribuita.",
    TR: "Hastalık ücretsiz olarak talep edilemez.",
    SQ: "Sëmundja nuk mund të kërkohet si e papaguar.",
    KU: "Nexweşî nikare wekî bêpere were daxwaz kirin.",
  },
  halfVacationOnlySingleDateRequest: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden.",
    EN: "A half vacation day can only be requested for exactly one date.",
    IT: "Una mezza giornata di ferie può essere richiesta solo per una singola data.",
    TR: "Yarım izin günü yalnızca tek bir tarih için talep edilebilir.",
    SQ: "Një gjysmë dite pushimi mund të kërkohet vetëm për një datë të vetme.",
    KU: "Nîvroj betlaneyê tenê ji bo yek dîrokê dikare were daxwaz kirin.",
  },
  approvedAbsenceAlreadyExists: {
    DE: "Im gewünschten Zeitraum existiert bereits eine bestätigte Abwesenheit.",
    EN: "A confirmed absence already exists in the selected period.",
    IT: "Nel periodo desiderato esiste già un'assenza confermata.",
    TR: "Seçilen dönemde zaten onaylanmış bir devamsızlık var.",
    SQ: "Në periudhën e zgjedhur ekziston tashmë një mungesë e konfirmuar.",
    KU: "Di navbera xwestî de jixwe nebûnek pejirandî heye.",
  },
  pendingRequestAlreadyExists: {
    DE: "Für diesen Zeitraum existiert bereits ein offener Antrag.",
    EN: "An open request already exists for this period.",
    IT: "Per questo periodo esiste già una richiesta aperta.",
    TR: "Bu dönem için zaten açık bir talep mevcut.",
    SQ: "Për këtë periudhë ekziston tashmë një kërkesë e hapur.",
    KU: "Ji bo vê navberê jixwe daxwazek vekirî heye.",
  },
  newAbsenceRequestPushTitle: {
    DE: "Neuer Abwesenheitsantrag",
    EN: "New absence request",
    IT: "Nuova richiesta di assenza",
    TR: "Yeni devamsızlık talebi",
    SQ: "Kërkesë e re për mungesë",
    KU: "Daxwaza nû ya nebûnê",
  },
};

export type AdminCorrectionRequestsTextKey =
  | "activeLabel"
  | "loadingInitial"
  | "pendingRequestsKpi"
  | "approvedKpi"
  | "rejectedKpi"
  | "pageTitle"
  | "pageDescription"
  | "employee"
  | "allEmployees"
  | "selectedEmployee"
  | "month"
  | "loadError"
  | "networkLoadError"
  | "approveFailed"
  | "approveNetworkError"
  | "rejectFailed"
  | "rejectNetworkError"
  | "deleteConfirm"
  | "deleteFailed"
  | "deleteNetworkError"
  | "open"
  | "approved"
  | "rejected"
  | "request"
  | "day"
  | "days"
  | "createdAt"
  | "decisionAt"
  | "period"
  | "employeeNote"
  | "adminNote"
  | "noNote"
  | "processedBy"
  | "notDecidedYet"
  | "deleting"
  | "delete"
  | "processing"
  | "reject"
  | "approve"
  | "emptyPending"
  | "emptyApproved"
  | "emptyRejected";

export const ADMIN_CORRECTION_REQUESTS_UI_TEXTS: Record<
  AdminCorrectionRequestsTextKey,
  Record<AppUiLanguage, string>
> = {
  activeLabel: {
    DE: "#wirkönnendas",
    EN: "#wecandothis",
    IT: "#possiamofarlo",
    TR: "#bunuyaparız",
    SQ: "#nemundemiabëjmë",
    KU: "#emdikarinbikin",
  },
  loadingInitial: {
    DE: "Lädt Nachtragsanfragen...",
    EN: "Loading correction requests...",
    IT: "Caricamento richieste di correzione...",
    TR: "Düzeltme talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat për korrigjim...",
    KU: "Daxwazên rastkirinê têne barkirin...",
  },
  pendingRequestsKpi: {
    DE: "Offene Nachtragsanfragen",
    EN: "Open correction requests",
    IT: "Richieste di correzione aperte",
    TR: "Açık düzeltme talepleri",
    SQ: "Kërkesa të hapura për korrigjim",
    KU: "Daxwazên rastkirinê yên vekirî",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
  },
  pageTitle: {
    DE: "Nachtragsanfragen",
    EN: "Correction requests",
    IT: "Richieste di correzione",
    TR: "Düzeltme talepleri",
    SQ: "Kërkesa për korrigjim",
    KU: "Daxwazên rastkirinê",
  },
  pageDescription: {
    DE: "Hier siehst du alle Nachtragsanfragen deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.",
    EN: "Here you can see all correction requests from your employees and approve or reject open requests directly.",
    IT: "Qui puoi vedere tutte le richieste di correzione dei tuoi dipendenti e approvare o rifiutare direttamente quelle aperte.",
    TR: "Burada çalışanlarınızın tüm düzeltme taleplerini görebilir ve açık talepleri doğrudan onaylayabilir veya reddedebilirsiniz.",
    SQ: "Këtu mund të shohësh të gjitha kërkesat për korrigjim të punonjësve të tu dhe t'i miratosh ose refuzosh direkt kërkesat e hapura.",
    KU: "Li vir hemû daxwazên rastkirinê yên karmendên xwe dibînî û dikarî daxwazên vekirî rasterast pejirînî an red bikî.",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
  },
  allEmployees: {
    DE: "Alle Mitarbeiter",
    EN: "All employees",
    IT: "Tutti i dipendenti",
    TR: "Tüm çalışanlar",
    SQ: "Të gjithë punonjësit",
    KU: "Hemû karmend",
  },
  selectedEmployee: {
    DE: "Ausgewählter Mitarbeiter",
    EN: "Selected employee",
    IT: "Dipendente selezionato",
    TR: "Seçilen çalışan",
    SQ: "Punonjësi i zgjedhur",
    KU: "Karmenda hilbijartî",
  },
  month: {
    DE: "Monat",
    EN: "Month",
    IT: "Mese",
    TR: "Ay",
    SQ: "Muaji",
    KU: "Meh",
  },
  loadError: {
    DE: "Nachtragsanfragen konnten nicht geladen werden.",
    EN: "Correction requests could not be loaded.",
    IT: "Impossibile caricare le richieste di correzione.",
    TR: "Düzeltme talepleri yüklenemedi.",
    SQ: "Kërkesat për korrigjim nuk mund të ngarkoheshin.",
    KU: "Daxwazên rastkirinê nehatin barkirin.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Nachtragsanfragen.",
    EN: "Network error while loading correction requests.",
    IT: "Errore di rete durante il caricamento delle richieste di correzione.",
    TR: "Düzeltme talepleri yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të kërkesave për korrigjim.",
    KU: "Dema barkirina daxwazên rastkirinê de xeletiya torê çêbû.",
  },
  approveFailed: {
    DE: "Genehmigung fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onay başarısız oldu.",
    SQ: "Miratimi dështoi.",
    KU: "Pejirandin serneket.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler bei der Genehmigung.",
    EN: "Network error during approval.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onay sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    KU: "Dema pejirandinê de xeletiya torê.",
  },
  rejectFailed: {
    DE: "Ablehnung fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız oldu.",
    SQ: "Refuzimi dështoi.",
    KU: "Redkirin serneket.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler bei der Ablehnung.",
    EN: "Network error during rejection.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    KU: "Dema redkirinê de xeletiya torê.",
  },
  deleteConfirm: {
    DE: "Möchtest du diese Nachtragsanfrage wirklich dauerhaft löschen?",
    EN: "Do you really want to permanently delete this correction request?",
    IT: "Vuoi davvero eliminare definitivamente questa richiesta di correzione?",
    TR: "Bu düzeltme talebini kalıcı olarak silmek istediğinizden emin misiniz?",
    SQ: "A dëshiron vërtet ta fshish përgjithmonë këtë kërkesë për korrigjim?",
    KU: "Tu bi rastî dixwazî vê daxwaza rastkirinê bi temamî jê bibî?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
  },
  open: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "E hapur",
    KU: "Vekirî",
  },
  approved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvata",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
  },
  rejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutata",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
  },
  request: {
    DE: "Nachtrag",
    EN: "Correction",
    IT: "Correzione",
    TR: "Düzeltme",
    SQ: "Korrigjim",
    KU: "Rastkirin",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  createdAt: {
    DE: "Erstellt:",
    EN: "Created:",
    IT: "Creata:",
    TR: "Oluşturuldu:",
    SQ: "Krijuar:",
    KU: "Hate afirandin:",
  },
  decisionAt: {
    DE: "Entscheidung:",
    EN: "Decision:",
    IT: "Decisione:",
    TR: "Karar:",
    SQ: "Vendimi:",
    KU: "Biryar:",
  },
  period: {
    DE: "Zeitraum",
    EN: "Period",
    IT: "Periodo",
    TR: "Dönem",
    SQ: "Periudha",
    KU: "Dem",
  },
  employeeNote: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota del dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
  },
  adminNote: {
    DE: "Admin-Notiz",
    EN: "Admin note",
    IT: "Nota admin",
    TR: "Yönetici notu",
    SQ: "Shënim i administratorit",
    KU: "Nîşeya admin",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
  },
  processedBy: {
    DE: "Bearbeitet von",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen kişi",
    SQ: "Përpunuar nga",
    KU: "Ji aliyê vê kesî ve hate kirin",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende nuk është vendosur",
    KU: "Hêj biryar nehatî dayîn",
  },
  deleting: {
    DE: "Löscht...",
    EN: "Deleting...",
    IT: "Eliminazione...",
    TR: "Siliniyor...",
    SQ: "Duke fshirë...",
    KU: "Tê jêbirin...",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke u përpunuar...",
    KU: "Tê pêvajokirin...",
  },
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    KU: "Red bike",
  },
  approve: {
    DE: "Genehmigen",
    EN: "Approve",
    IT: "Approva",
    TR: "Onayla",
    SQ: "Mirato",
    KU: "Pejirîne",
  },
  emptyPending: {
    DE: "Keine offenen Nachtragsanfragen für diesen Filter.",
    EN: "No open correction requests for this filter.",
    IT: "Nessuna richiesta di correzione aperta per questo filtro.",
    TR: "Bu filtre için açık düzeltme talebi yok.",
    SQ: "Nuk ka kërkesa të hapura për korrigjim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza rastkirinê ya vekirî tune ye.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Nachtragsanfragen für diesen Filter.",
    EN: "No approved correction requests for this filter.",
    IT: "Nessuna richiesta di correzione approvata per questo filtro.",
    TR: "Bu filtre için onaylanmış düzeltme talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara për korrigjim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza rastkirinê ya pejirandî tune ye.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Nachtragsanfragen für diesen Filter.",
    EN: "No rejected correction requests for this filter.",
    IT: "Nessuna richiesta di correzione rifiutata per questo filtro.",
    TR: "Bu filtre için reddedilmiş düzeltme talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara për korrigjim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza rastkirinê ya redkirî tune ye.",
  },
};

export type AdminPasswordResetTextKey =
  | "pageTitle"
  | "pageSubtitle"
  | "loadError"
  | "resetFailed"
  | "singleUseUntil"
  | "copied"
  | "copyNotPossible"
  | "loading"
  | "noOpenRequests"
  | "requestPrefix"
  | "passwordSetAt"
  | "createResetLink"
  | "resetLinkTitle"
  | "copyLink"
  | "close"
  | "hint";

export const ADMIN_PASSWORD_RESET_UI_TEXTS: Record<
  AdminPasswordResetTextKey,
  Record<AppUiLanguage, string>
> = {
  pageTitle: {
    DE: "Passwort-Reset",
    EN: "Password reset",
    IT: "Reimpostazione password",
    TR: "Şifre sıfırlama",
    SQ: "Rivendosja e fjalëkalimit",
    KU: "Vesazê nûvekirin",
  },
  pageSubtitle: {
    DE: "Mitarbeiter klicken „Passwort vergessen“ → hier erscheinen Anfragen. Link erzeugen & senden (z.B. WhatsApp).",
    EN: "Employees click “Forgot password” → requests appear here. Create and send link (e.g. via WhatsApp).",
    IT: "I dipendenti cliccano su “Password dimenticata” → qui compaiono le richieste. Crea e invia il link (ad es. tramite WhatsApp).",
    TR: "Çalışanlar “Şifremi unuttum” seçeneğine tıklar → talepler burada görünür. Link oluşturup gönderin (ör. WhatsApp ile).",
    SQ: "Punonjësit klikojnë “Kam harruar fjalëkalimin” → kërkesat shfaqen këtu. Krijo dhe dërgo linkun (p.sh. me WhatsApp).",
    KU: "Karmend li “Şîfreyê min ji bîr kir” dike → daxwaz li vir xuya dibe. Girêdanê biafirîne û bişîne (mînak WhatsApp).",
  },
  loadError: {
    DE: "Konnte Anfragen nicht laden.",
    EN: "Could not load requests.",
    IT: "Impossibile caricare le richieste.",
    TR: "Talepler yüklenemedi.",
    SQ: "Nuk u ngarkuan kërkesat.",
    KU: "Daxwaz nehatin barkirin.",
  },
  resetFailed: {
    DE: "Reset fehlgeschlagen",
    EN: "Reset failed",
    IT: "Reimpostazione non riuscita",
    TR: "Sıfırlama başarısız oldu",
    SQ: "Rivendosja dështoi",
    KU: "Nûvekirin serneket",
  },
  singleUseUntil: {
    DE: "Einmalig nutzbar. Spätestens gültig bis:",
    EN: "Usable once. Valid at the latest until:",
    IT: "Utilizzabile una sola volta. Valido al più tardi fino al:",
    TR: "Tek kullanımlık. En geç şu tarihe kadar geçerli:",
    SQ: "Përdoret vetëm një herë. I vlefshëm më së voni deri më:",
    KU: "Tenê carekê tê bikaranîn. Herî dereng heta vê demê derbasdar e:",
  },
  copied: {
    DE: "Kopiert ✅",
    EN: "Copied ✅",
    IT: "Copiato ✅",
    TR: "Kopyalandı ✅",
    SQ: "U kopjua ✅",
    KU: "Hat kopîkirin ✅",
  },
  copyNotPossible: {
    DE: "Kopieren nicht möglich",
    EN: "Copying not possible",
    IT: "Copia non possibile",
    TR: "Kopyalama mümkün değil",
    SQ: "Kopjimi nuk është i mundur",
    KU: "Kopîkirin ne gengaz e",
  },
  loading: {
    DE: "lädt…",
    EN: "loading…",
    IT: "caricamento…",
    TR: "yükleniyor…",
    SQ: "duke u ngarkuar…",
    KU: "tê barkirin…",
  },
  noOpenRequests: {
    DE: "Keine offenen Anfragen.",
    EN: "No open requests.",
    IT: "Nessuna richiesta aperta.",
    TR: "Açık talep yok.",
    SQ: "Nuk ka kërkesa të hapura.",
    KU: "Ti daxwaza vekirî tune ye.",
  },
  requestPrefix: {
    DE: "Anfrage:",
    EN: "Request:",
    IT: "Richiesta:",
    TR: "Talep:",
    SQ: "Kërkesa:",
    KU: "Daxwaz:",
  },
  passwordSetAt: {
    DE: "Passwort gesetzt am:",
    EN: "Password set on:",
    IT: "Password impostata il:",
    TR: "Şifre belirlenme tarihi:",
    SQ: "Fjalëkalimi u vendos më:",
    KU: "Vesaz di vê rojê de hate danîn:",
  },
  createResetLink: {
    DE: "Reset-Link erstellen",
    EN: "Create reset link",
    IT: "Crea link di reset",
    TR: "Sıfırlama bağlantısı oluştur",
    SQ: "Krijo link rivendosjeje",
    KU: "Girêdana nûvekirinê biafirîne",
  },
  resetLinkTitle: {
    DE: "Reset-Link",
    EN: "Reset link",
    IT: "Link di reset",
    TR: "Sıfırlama bağlantısı",
    SQ: "Link rivendosjeje",
    KU: "Girêdana nûvekirinê",
  },
  copyLink: {
    DE: "Link kopieren",
    EN: "Copy link",
    IT: "Copia link",
    TR: "Bağlantıyı kopyala",
    SQ: "Kopjo linkun",
    KU: "Girêdanê kopî bike",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  hint: {
    DE: "Hinweis: Der Link kann nur einmal verwendet werden und wird nach erfolgreicher Nutzung sofort ungültig. Ohne Nutzung läuft er spätestens zum angegebenen Zeitpunkt ab.",
    EN: "Note: The link can only be used once and becomes invalid immediately after successful use. If unused, it expires at the stated time at the latest.",
    IT: "Nota: Il link può essere utilizzato una sola volta e diventa immediatamente non valido dopo l'uso riuscito. Se non utilizzato, scade al più tardi all'orario indicato.",
    TR: "Not: Bağlantı yalnızca bir kez kullanılabilir ve başarılı kullanımın ardından hemen geçersiz olur. Kullanılmazsa en geç belirtilen zamanda süresi dolar.",
    SQ: "Shënim: Linku mund të përdoret vetëm një herë dhe bëhet menjëherë i pavlefshëm pas përdorimit të suksesshëm. Nëse nuk përdoret, skadon më së voni në kohën e treguar.",
    KU: "Têbînî: Girêdan tenê carekê tê bikaranîn û piştî bikaranîna serkeftî di cih de nederbasdar dibe. Heke neyê bikaranîn, herî dereng di dema diyarkirî de bi dawî dibe.",
  },
};

export type AdminAppointmentsTextKey = "calendarLoading";

export const ADMIN_APPOINTMENTS_UI_TEXTS: Record<
  AdminAppointmentsTextKey,
  Record<AppUiLanguage, string>
> = {
  calendarLoading: {
    DE: "Kalender lädt...",
    EN: "Calendar loading...",
    IT: "Caricamento calendario...",
    TR: "Takvim yükleniyor...",
    SQ: "Kalendari po ngarkohet...",
    KU: "Salname tê barkirin...",
  },
};
export type AdminDashboardTextKey =
  | "activeLabel"
  | "loading"
  | "dashboardLoadError"
  | "unexpectedDashboardResponse"
  | "networkLoadError"
  | "exportDownloadError"
  | "exportOpenError"
  | "exportShareError"
  | "pushSendError"
  | "pushNetworkError"
  | "pushSuccessPrefix"
  | "saveFailed"
  | "saveNetworkError"
  | "deleteConfirm"
  | "deleteFailed"
  | "deleteNetworkError"
  | "cancel"
  | "close"
  | "download"
  | "shareOrSave"
  | "shareOrSaveTitle"
  | "downloadTitle"
  | "monthForOverviewAndExport"
  | "manageTasks"
  | "exportAdmin"
  | "monthCsv"
  | "yearZip"
  | "rangeCsv"
  | "exportTarget"
  | "allCombined"
  | "singleEmployee"
  | "selectEmployee"
  | "pleaseChoose"
  | "selectMonth"
  | "selectYear"
  | "selectRange"
  | "rangeFromToRequired"
  | "rangeFromAfterTo"
  | "employeeRequired"
  | "employeeUnavailable"
  | "activeEmployees"
  | "missingEntriesToday"
  | "absencesToday"
  | "missingEntriesGeneral"
  | "details"
  | "active"
  | "noActiveEmployees"
  | "openToday"
  | "noMissingEntriesToday"
  | "noAbsencesToday"
  | "overdueDays"
  | "sendPush"
  | "sending"
  | "noGeneralOverdueMissingEntries"
  | "workDetailsTitle"
  | "breakDetailsTitle"
  | "employeeNoteTitle"
  | "editWorkTitle"
  | "employee"
  | "dateAndTime"
  | "date"
  | "netWorkTime"
  | "siteOrAddress"
  | "executedActivity"
  | "travelTime"
  | "manualBreak"
  | "legallyRequired"
  | "autoSupplemented"
  | "noAutoSupplement"
  | "effectiveBreakTotal"
  | "note"
  | "noNoteAvailable"
  | "dateAndTimeNotEditable"
  | "activity"
  | "location"
  | "travelTimeMinutes"
  | "saving"
  | "save"
  | "monthTotal"
  | "workTimeTotal"
  | "vacation"
  | "sick"
  | "unpaidVacation"
  | "overtimeGross"
  | "entries"
  | "byEmployee"
  | "noDashboardData"
  | "noEmployeesInPeriod"
  | "noEntries"
  | "expandCollapse"
  | "workTimes"
  | "entry"
  | "entriesPlural"
  | "day"
  | "days"
  | "pause"
  | "showBreakDetails"
  | "showDetails"
  | "showEmployeeNote"
  | "editWithoutTime"
  | "delete"
  | "noSiteOrAddress"
  | "noWorkTimesInMonth"
  | "sickness"
  | "period"
  | "periods"
  | "sickLabel"
  | "noSickDaysInMonth"
  | "vacationLabel"
  | "vacationUnpaidLabel"
  | "noVacationInMonth"
  | "halfDay"
  | "dashboard"
  | "activeEmployeesModal"
  | "missingEntriesTodayModal"
  | "absencesTodayModal"
  | "missingEntriesGeneralModal"
  | "dash"
  | "workTimeHours"
  | "vacationHours"
  | "sickHours"
  | "unpaidVacationHours"
  | "openActiveEmployeesList"
  | "openMissingEntriesList"
  | "openAbsencesList"
  | "openGeneralMissingEntriesList"
  | "expandCollapseTitle"
  | "remindMissingNotLoggedIn"
  | "remindMissingForbidden"
  | "remindMissingInvalidBody"
  | "remindMissingEmployeeIdMissing"
  | "remindMissingEmployeeNotFound"
  | "remindMissingNoOverdueEntries"
  | "remindMissingNoPushSubscription";

export const ADMIN_DASHBOARD_UI_TEXTS: Record<
  AdminDashboardTextKey,
  Record<AppUiLanguage, string>
> = {
  activeLabel: {
    DE: "Dashboard",
    EN: "Dashboard",
    IT: "Dashboard",
    TR: "Gösterge paneli",
    SQ: "Paneli",
    KU: "Dashboard",
  },
  loading: {
    DE: "Lade...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
  },
  dashboardLoadError: {
    DE: "Dashboard konnte nicht geladen werden.",
    EN: "Dashboard could not be loaded.",
    IT: "Impossibile caricare il dashboard.",
    TR: "Gösterge paneli yüklenemedi.",
    SQ: "Paneli nuk mund të ngarkohej.",
    KU: "Dashboard nehate barkirin.",
  },
  unexpectedDashboardResponse: {
    DE: "Unerwartete Dashboard-Antwort.",
    EN: "Unexpected dashboard response.",
    IT: "Risposta dashboard imprevista.",
    TR: "Beklenmeyen gösterge paneli yanıtı.",
    SQ: "Përgjigje e papritur nga paneli.",
    KU: "Bersiva dashboardê nexwestî bû.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden.",
    EN: "Network error while loading.",
    IT: "Errore di rete durante il caricamento.",
    TR: "Yükleme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit.",
    KU: "Dema barkirinê de xeletiya torê.",
  },
  exportDownloadError: {
    DE: "Export konnte nicht heruntergeladen werden.",
    EN: "Export could not be downloaded.",
    IT: "Impossibile scaricare l'esportazione.",
    TR: "Dışa aktarma indirilemedi.",
    SQ: "Eksporti nuk mund të shkarkohej.",
    KU: "Export nehate daxistin.",
  },
  exportOpenError: {
    DE: "Export konnte nicht geöffnet werden.",
    EN: "Export could not be opened.",
    IT: "Impossibile aprire l'esportazione.",
    TR: "Dışa aktarma açılamadı.",
    SQ: "Eksporti nuk mund të hapej.",
    KU: "Export venebû.",
  },
  exportShareError: {
    DE: "Export konnte nicht geteilt oder gesichert werden.",
    EN: "Export could not be shared or saved.",
    IT: "Impossibile condividere o salvare l'esportazione.",
    TR: "Dışa aktarma paylaşılamadı veya kaydedilemedi.",
    SQ: "Eksporti nuk mund të ndahej ose ruhej.",
    KU: "Export nehat parvekirin an tomarkirin.",
  },
  pushSendError: {
    DE: "Push konnte nicht gesendet werden.",
    EN: "Push could not be sent.",
    IT: "Impossibile inviare la notifica push.",
    TR: "Push bildirimi gönderilemedi.",
    SQ: "Njoftimi push nuk mund të dërgohej.",
    KU: "Push nehate şandin.",
  },
  pushNetworkError: {
    DE: "Netzwerkfehler beim Senden des Reminders.",
    EN: "Network error while sending reminder.",
    IT: "Errore di rete durante l'invio del promemoria.",
    TR: "Hatırlatma gönderilirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë dërgimit të kujtesës.",
    KU: "Dema şandina bîranînê de xeletiya torê.",
  },
  pushSuccessPrefix: {
    DE: "Push an",
    EN: "Push sent to",
    IT: "Push inviato a",
    TR: "Push gönderildi:",
    SQ: "Push u dërgua te",
    KU: "Push hate şandin ji bo",
  },
  saveFailed: {
    DE: "Speichern fehlgeschlagen.",
    EN: "Saving failed.",
    IT: "Salvataggio non riuscito.",
    TR: "Kaydetme başarısız oldu.",
    SQ: "Ruajtja dështoi.",
    KU: "Tomarkirin serneket.",
  },
  saveNetworkError: {
    DE: "Netzwerkfehler beim Speichern.",
    EN: "Network error while saving.",
    IT: "Errore di rete durante il salvataggio.",
    TR: "Kaydetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes.",
    KU: "Dema tomarkirinê de xeletiya torê.",
  },
  deleteConfirm: {
    DE: "Diesen Eintrag wirklich löschen?",
    EN: "Really delete this entry?",
    IT: "Eliminare davvero questa voce?",
    TR: "Bu kayıt gerçekten silinsin mi?",
    SQ: "Ta fshijmë vërtet këtë hyrje?",
    KU: "Bi rastî vê tomariyê jê bibin?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    KU: "Betal bike",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  download: {
    DE: "Download",
    EN: "Download",
    IT: "Scarica",
    TR: "İndir",
    SQ: "Shkarko",
    KU: "Daxe",
  },
  shareOrSave: {
    DE: "Teilen / Sichern",
    EN: "Share / Save",
    IT: "Condividi / Salva",
    TR: "Paylaş / Kaydet",
    SQ: "Ndaj / Ruaj",
    KU: "Parve bike / Tomar bike",
  },
  shareOrSaveTitle: {
    DE: "Export teilen oder sichern",
    EN: "Share or save export",
    IT: "Condividi o salva esportazione",
    TR: "Dışa aktarmayı paylaş veya kaydet",
    SQ: "Ndaje ose ruaje eksportin",
    KU: "Exportê parve bike an tomar bike",
  },
  downloadTitle: {
    DE: "Export herunterladen",
    EN: "Download export",
    IT: "Scarica esportazione",
    TR: "Dışa aktarmayı indir",
    SQ: "Shkarko eksportin",
    KU: "Exportê daxîne",
  },
  monthForOverviewAndExport: {
    DE: "Monat (für Übersicht + Export)",
    EN: "Month (for overview + export)",
    IT: "Mese (per panoramica + esportazione)",
    TR: "Ay (genel görünüm + dışa aktarma için)",
    SQ: "Muaji (për përmbledhje + eksport)",
    KU: "Meh (ji bo dîtin + export)",
  },
  manageTasks: {
    DE: "Aufgaben verwalten",
    EN: "Manage tasks",
    IT: "Gestisci attività",
    TR: "Görevleri yönet",
    SQ: "Menaxho detyrat",
    KU: "Erkan birêve bibe",
  },
  exportAdmin: {
    DE: "Export (Admin)",
    EN: "Export (Admin)",
    IT: "Esporta (Admin)",
    TR: "Dışa aktar (Yönetici)",
    SQ: "Eksport (Admin)",
    KU: "Export (Admin)",
  },
  monthCsv: {
    DE: "Monat (CSV)",
    EN: "Month (CSV)",
    IT: "Mese (CSV)",
    TR: "Ay (CSV)",
    SQ: "Muaji (CSV)",
    KU: "Meh (CSV)",
  },
  yearZip: {
    DE: "Jahr (ZIP)",
    EN: "Year (ZIP)",
    IT: "Anno (ZIP)",
    TR: "Yıl (ZIP)",
    SQ: "Viti (ZIP)",
    KU: "Sal (ZIP)",
  },
  rangeCsv: {
    DE: "Zeitraum (CSV)",
    EN: "Range (CSV)",
    IT: "Periodo (CSV)",
    TR: "Aralık (CSV)",
    SQ: "Periudha (CSV)",
    KU: "Dem (CSV)",
  },
  exportTarget: {
    DE: "Export-Ziel",
    EN: "Export target",
    IT: "Destinazione esportazione",
    TR: "Dışa aktarma hedefi",
    SQ: "Objektivi i eksportit",
    KU: "Armanca exportê",
  },
  allCombined: {
    DE: "Alle gesammelt",
    EN: "All combined",
    IT: "Tutti insieme",
    TR: "Tümü birlikte",
    SQ: "Të gjitha së bashku",
    KU: "Hemû bi hev re",
  },
  singleEmployee: {
    DE: "Einzelner Mitarbeiter",
    EN: "Single employee",
    IT: "Singolo dipendente",
    TR: "Tek çalışan",
    SQ: "Një punonjës",
    KU: "Karmendek tenê",
  },
  selectEmployee: {
    DE: "Mitarbeiter auswählen",
    EN: "Select employee",
    IT: "Seleziona dipendente",
    TR: "Çalışan seç",
    SQ: "Zgjidh punonjësin",
    KU: "Karmend hilbijêre",
  },
  pleaseChoose: {
    DE: "— Bitte wählen —",
    EN: "— Please choose —",
    IT: "— Seleziona —",
    TR: "— Lütfen seçin —",
    SQ: "— Ju lutem zgjidhni —",
    KU: "— Ji kerema xwe hilbijêre —",
  },
  selectMonth: {
    DE: "Monat auswählen",
    EN: "Select month",
    IT: "Seleziona mese",
    TR: "Ay seç",
    SQ: "Zgjidh muajin",
    KU: "Meh hilbijêre",
  },
  selectYear: {
    DE: "Jahr auswählen",
    EN: "Select year",
    IT: "Seleziona anno",
    TR: "Yıl seç",
    SQ: "Zgjidh vitin",
    KU: "Sal hilbijêre",
  },
  selectRange: {
    DE: "Zeitraum auswählen",
    EN: "Select range",
    IT: "Seleziona periodo",
    TR: "Aralık seç",
    SQ: "Zgjidh periudhën",
    KU: "Dem hilbijêre",
  },
  rangeFromToRequired: {
    DE: "Bitte Von und Bis auswählen.",
    EN: "Please select from and to.",
    IT: "Seleziona data iniziale e finale.",
    TR: "Lütfen başlangıç ve bitiş seçin.",
    SQ: "Ju lutem zgjidhni nga dhe deri më.",
    KU: "Ji kerema xwe ji û heta hilbijêre.",
  },
  rangeFromAfterTo: {
    DE: "Von-Datum darf nicht nach dem Bis-Datum liegen.",
    EN: "Start date must not be after end date.",
    IT: "La data iniziale non può essere successiva alla data finale.",
    TR: "Başlangıç tarihi bitiş tarihinden sonra olamaz.",
    SQ: "Data e fillimit nuk mund të jetë pas datës së mbarimit.",
    KU: "Dîroka destpêkê nabe piştî dîroka dawiyê be.",
  },
  employeeRequired: {
    DE: "Bitte Mitarbeiter auswählen.",
    EN: "Please select an employee.",
    IT: "Seleziona un dipendente.",
    TR: "Lütfen bir çalışan seçin.",
    SQ: "Ju lutem zgjidhni një punonjës.",
    KU: "Ji kerema xwe karmendek hilbijêre.",
  },
  employeeUnavailable: {
    DE: "Ausgewählter Mitarbeiter ist in dieser Ansicht nicht verfügbar.",
    EN: "Selected employee is not available in this view.",
    IT: "Il dipendente selezionato non è disponibile in questa vista.",
    TR: "Seçilen çalışan bu görünümde mevcut değil.",
    SQ: "Punonjësi i zgjedhur nuk është i disponueshëm në këtë pamje.",
    KU: "Karmenda hilbijartî di vê dîtinê de berdest nîne.",
  },
  activeEmployees: {
    DE: "Aktive Mitarbeiter",
    EN: "Active employees",
    IT: "Dipendenti attivi",
    TR: "Aktif çalışanlar",
    SQ: "Punonjës aktivë",
    KU: "Karmendên çalak",
  },
  missingEntriesToday: {
    DE: "Fehlende Einträge (heute)",
    EN: "Missing entries (today)",
    IT: "Voci mancanti (oggi)",
    TR: "Eksik kayıtlar (bugün)",
    SQ: "Hyrje që mungojnë (sot)",
    KU: "Tomarên winda (îro)",
  },
  absencesToday: {
    DE: "Abwesenheiten (heute)",
    EN: "Absences (today)",
    IT: "Assenze (oggi)",
    TR: "Devamsızlıklar (bugün)",
    SQ: "Mungesa (sot)",
    KU: "Nebûn (îro)",
  },
  missingEntriesGeneral: {
    DE: "Fehlende Einträge (allgemein)",
    EN: "Missing entries (general)",
    IT: "Voci mancanti (generale)",
    TR: "Eksik kayıtlar (genel)",
    SQ: "Hyrje që mungojnë (në përgjithësi)",
    KU: "Tomarên winda (giştî)",
  },
  details: {
    DE: "Details",
    EN: "Details",
    IT: "Dettagli",
    TR: "Detaylar",
    SQ: "Detaje",
    KU: "Hûrgulî",
  },
  active: {
    DE: "aktiv",
    EN: "active",
    IT: "attivo",
    TR: "aktif",
    SQ: "aktiv",
    KU: "çalak",
  },
  noActiveEmployees: {
    DE: "Keine aktiven Mitarbeiter vorhanden.",
    EN: "No active employees available.",
    IT: "Nessun dipendente attivo disponibile.",
    TR: "Aktif çalışan yok.",
    SQ: "Nuk ka punonjës aktivë.",
    KU: "Ti karmenda çalak tune ye.",
  },
  openToday: {
    DE: "heute offen",
    EN: "open today",
    IT: "aperto oggi",
    TR: "bugün açık",
    SQ: "hapur sot",
    KU: "îro vekirî",
  },
  noMissingEntriesToday: {
    DE: "Heute fehlen aktuell keine Einträge.",
    EN: "There are currently no missing entries today.",
    IT: "Attualmente non mancano voci oggi.",
    TR: "Bugün şu anda eksik kayıt yok.",
    SQ: "Aktualisht sot nuk mungojnë hyrje.",
    KU: "Îro niha ti tomarê winda tune ye.",
  },
  noAbsencesToday: {
    DE: "Heute sind keine Mitarbeiter abwesend.",
    EN: "No employees are absent today.",
    IT: "Oggi nessun dipendente è assente.",
    TR: "Bugün devamsız çalışan yok.",
    SQ: "Sot nuk mungon asnjë punonjës.",
    KU: "Îro ti karmend tune ye ku nebe.",
  },
  overdueDays: {
    DE: "überfällige Tage",
    EN: "overdue days",
    IT: "giorni in ritardo",
    TR: "gecikmiş günler",
    SQ: "ditë të vonuara",
    KU: "rojên derengmayî",
  },
  sendPush: {
    DE: "Push senden",
    EN: "Send push",
    IT: "Invia push",
    TR: "Push gönder",
    SQ: "Dërgo push",
    KU: "Push bişîne",
  },
  sending: {
    DE: "Sende…",
    EN: "Sending…",
    IT: "Invio in corso…",
    TR: "Gönderiliyor…",
    SQ: "Duke dërguar…",
    KU: "Tê şandin…",
  },
  noGeneralOverdueMissingEntries: {
    DE: "Aktuell gibt es keine allgemeinen überfälligen fehlenden Arbeitseinträge.",
    EN: "There are currently no general overdue missing work entries.",
    IT: "Attualmente non ci sono voci di lavoro mancanti e scadute in generale.",
    TR: "Şu anda genel gecikmiş eksik çalışma kaydı yok.",
    SQ: "Aktualisht nuk ka hyrje pune të munguar të vonuara në përgjithësi.",
    KU: "Niha bi giştî ti tomara karê winda ya derengmayî tune ye.",
  },
  workDetailsTitle: {
    DE: "Arbeitszeit-Details",
    EN: "Work time details",
    IT: "Dettagli orario di lavoro",
    TR: "Çalışma süresi detayları",
    SQ: "Detajet e orarit të punës",
    KU: "Hûrguliyên demê ya karê",
  },
  breakDetailsTitle: {
    DE: "Pausen-Details",
    EN: "Break details",
    IT: "Dettagli pausa",
    TR: "Mola detayları",
    SQ: "Detajet e pushimit",
    KU: "Hûrguliyên bêhnvedanê",
  },
  employeeNoteTitle: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
  },
  editWorkTitle: {
    DE: "Arbeitszeit bearbeiten (Admin)",
    EN: "Edit work time (admin)",
    IT: "Modifica orario di lavoro (admin)",
    TR: "Çalışma süresini düzenle (yönetici)",
    SQ: "Ndrysho orarin e punës (admin)",
    KU: "Dema karê biguherîne (admin)",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
  },
  dateAndTime: {
    DE: "Datum & Zeit",
    EN: "Date & time",
    IT: "Data e ora",
    TR: "Tarih ve saat",
    SQ: "Data & ora",
    KU: "Dîrok û dem",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
  },
  netWorkTime: {
    DE: "Netto-Arbeitszeit",
    EN: "Net work time",
    IT: "Tempo di lavoro netto",
    TR: "Net çalışma süresi",
    SQ: "Koha neto e punës",
    KU: "Dema karê ya net",
  },
  siteOrAddress: {
    DE: "Baustelle / Adresse",
    EN: "Site / address",
    IT: "Cantiere / indirizzo",
    TR: "Şantiye / adres",
    SQ: "Kantier / adresë",
    KU: "Cihê karê / navnîşan",
  },
  executedActivity: {
    DE: "Ausgeführte Tätigkeit",
    EN: "Executed activity",
    IT: "Attività svolta",
    TR: "Yapılan faaliyet",
    SQ: "Veprimtaria e kryer",
    KU: "Çalakiya hatiye kirin",
  },
  travelTime: {
    DE: "Fahrtzeit",
    EN: "Travel time",
    IT: "Tempo di viaggio",
    TR: "Yol süresi",
    SQ: "Koha e udhëtimit",
    KU: "Dema rêyê",
  },
  manualBreak: {
    DE: "Manuell eingetragene Pause",
    EN: "Manually entered break",
    IT: "Pausa inserita manualmente",
    TR: "Elle girilen mola",
    SQ: "Pushim i futur manualisht",
    KU: "Bêhnvedana bi destan hatiye nivîsandin",
  },
  legallyRequired: {
    DE: "Gesetzlich erforderlich",
    EN: "Legally required",
    IT: "Richiesto per legge",
    TR: "Yasal olarak gerekli",
    SQ: "E kërkuar me ligj",
    KU: "Bi qanûnê pêwîst",
  },
  autoSupplemented: {
    DE: "Automatisch ergänzt",
    EN: "Automatically supplemented",
    IT: "Integrato automaticamente",
    TR: "Otomatik tamamlandı",
    SQ: "Plotësuar automatikisht",
    KU: "Bi awayekî otomatîk hat zêdekirin",
  },
  noAutoSupplement: {
    DE: "Keine automatische Ergänzung",
    EN: "No automatic supplement",
    IT: "Nessuna integrazione automatica",
    TR: "Otomatik tamamlama yok",
    SQ: "Pa plotësim automatik",
    KU: "Ti zêdekirina otomatîk tune",
  },
  effectiveBreakTotal: {
    DE: "Wirksame Pause gesamt",
    EN: "Effective total break",
    IT: "Pausa effettiva totale",
    TR: "Toplam etkili mola",
    SQ: "Pushimi efektiv total",
    KU: "Bêhnvedana bi bandor a giştî",
  },
  note: {
    DE: "Notiz",
    EN: "Note",
    IT: "Nota",
    TR: "Not",
    SQ: "Shënim",
    KU: "Nîşe",
  },
  noNoteAvailable: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
  },
  dateAndTimeNotEditable: {
    DE: "Datum & Zeit (nicht änderbar)",
    EN: "Date & time (not editable)",
    IT: "Data e ora (non modificabili)",
    TR: "Tarih ve saat (değiştirilemez)",
    SQ: "Data & ora (nuk mund të ndryshohet)",
    KU: "Dîrok û dem (nayê guhertin)",
  },
  activity: {
    DE: "Tätigkeit",
    EN: "Activity",
    IT: "Attività",
    TR: "Faaliyet",
    SQ: "Veprimtaria",
    KU: "Çalakî",
  },
  location: {
    DE: "Ort",
    EN: "Location",
    IT: "Luogo",
    TR: "Konum",
    SQ: "Vendi",
    KU: "Cih",
  },
  travelTimeMinutes: {
    DE: "Fahrtzeit (Min)",
    EN: "Travel time (min)",
    IT: "Tempo di viaggio (min)",
    TR: "Yol süresi (dk)",
    SQ: "Koha e udhëtimit (min)",
    KU: "Dema rêyê (deq)",
  },
  saving: {
    DE: "Speichere…",
    EN: "Saving…",
    IT: "Salvataggio…",
    TR: "Kaydediliyor…",
    SQ: "Duke ruajtur…",
    KU: "Tê tomarkirin…",
  },
  save: {
    DE: "Speichern",
    EN: "Save",
    IT: "Salva",
    TR: "Kaydet",
    SQ: "Ruaj",
    KU: "Tomar bike",
  },
  monthTotal: {
    DE: "Monat (gesamt)",
    EN: "Month (total)",
    IT: "Mese (totale)",
    TR: "Ay (toplam)",
    SQ: "Muaji (gjithsej)",
    KU: "Meh (tevahî)",
  },
  workTimeTotal: {
    DE: "Arbeitszeit gesamt:",
    EN: "Total work time:",
    IT: "Tempo di lavoro totale:",
    TR: "Toplam çalışma süresi:",
    SQ: "Koha totale e punës:",
    KU: "Dema karê ya giştî:",
  },
  vacation: {
    DE: "Urlaub:",
    EN: "Vacation:",
    IT: "Ferie:",
    TR: "İzin:",
    SQ: "Pushim:",
    KU: "Betlane:",
  },
  sick: {
    DE: "Krank:",
    EN: "Sick:",
    IT: "Malattia:",
    TR: "Hastalık:",
    SQ: "Sëmurë:",
    KU: "Nexweş:",
  },
  unpaidVacation: {
    DE: "Urlaub unbezahlt:",
    EN: "Unpaid vacation:",
    IT: "Ferie non pagate:",
    TR: "Ücretsiz izin:",
    SQ: "Pushim i papaguar:",
    KU: "Betlaneya bêpere:",
  },
  overtimeGross: {
    DE: "Überstunden (Brutto):",
    EN: "Overtime (gross):",
    IT: "Straordinari (lordi):",
    TR: "Fazla mesai (brüt):",
    SQ: "Orë shtesë (bruto):",
    KU: "Demjimêrên zêde (brût):",
  },
  entries: {
    DE: "Einträge:",
    EN: "Entries:",
    IT: "Voci:",
    TR: "Kayıtlar:",
    SQ: "Hyrje:",
    KU: "Tomar:",
  },
  byEmployee: {
    DE: "Nach Mitarbeiter",
    EN: "By employee",
    IT: "Per dipendente",
    TR: "Çalışana göre",
    SQ: "Sipas punonjësit",
    KU: "Li gorî karmend",
  },
  noDashboardData: {
    DE: "Keine Dashboarddaten verfügbar.",
    EN: "No dashboard data available.",
    IT: "Nessun dato dashboard disponibile.",
    TR: "Gösterge paneli verisi yok.",
    SQ: "Nuk ka të dhëna paneli.",
    KU: "Ti daneya dashboardê tune ye.",
  },
  noEmployeesInPeriod: {
    DE: "Keine Mitarbeiter im Zeitraum.",
    EN: "No employees in selected period.",
    IT: "Nessun dipendente nel periodo selezionato.",
    TR: "Seçilen dönemde çalışan yok.",
    SQ: "Nuk ka punonjës në periudhën e zgjedhur.",
    KU: "Di dema hilbijartî de ti karmend tune ne.",
  },
  noEntries: {
    DE: "Keine Einträge.",
    EN: "No entries.",
    IT: "Nessuna voce.",
    TR: "Kayıt yok.",
    SQ: "Nuk ka hyrje.",
    KU: "Ti tomar tune ne.",
  },
  expandCollapse: {
    DE: "Ein-/Ausklappen",
    EN: "Expand/collapse",
    IT: "Espandi/comprimi",
    TR: "Genişlet/daralt",
    SQ: "Hap/mbyll",
    KU: "Veke/bigire",
  },
  workTimes: {
    DE: "🛠 Arbeitszeiten",
    EN: "🛠 Work times",
    IT: "🛠 Orari di lavoro",
    TR: "🛠 Çalışma süreleri",
    SQ: "🛠 Orari i punës",
    KU: "🛠 Demên karê",
  },
  entry: {
    DE: "Eintrag",
    EN: "entry",
    IT: "voce",
    TR: "kayıt",
    SQ: "hyrje",
    KU: "tomar",
  },
  entriesPlural: {
    DE: "Einträge",
    EN: "entries",
    IT: "voci",
    TR: "kayıt",
    SQ: "hyrje",
    KU: "tomar",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  pause: {
    DE: "Pause",
    EN: "break",
    IT: "pausa",
    TR: "mola",
    SQ: "pushim",
    KU: "bêhnvedan",
  },
  showBreakDetails: {
    DE: "Pausen-Details anzeigen",
    EN: "Show break details",
    IT: "Mostra dettagli pausa",
    TR: "Mola detaylarını göster",
    SQ: "Shfaq detajet e pushimit",
    KU: "Hûrguliyên bêhnvedanê nîşan bide",
  },
  showDetails: {
    DE: "Details anzeigen",
    EN: "Show details",
    IT: "Mostra dettagli",
    TR: "Detayları göster",
    SQ: "Shfaq detajet",
    KU: "Hûrguliyan nîşan bide",
  },
  showEmployeeNote: {
    DE: "Mitarbeiter-Notiz anzeigen",
    EN: "Show employee note",
    IT: "Mostra nota dipendente",
    TR: "Çalışan notunu göster",
    SQ: "Shfaq shënimin e punonjësit",
    KU: "Nîşeya karmend nîşan bide",
  },
  editWithoutTime: {
    DE: "Bearbeiten (ohne Zeit)",
    EN: "Edit (without time)",
    IT: "Modifica (senza orario)",
    TR: "Düzenle (saat olmadan)",
    SQ: "Ndrysho (pa orë)",
    KU: "Biguherîne (bê dem)",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
  },
  noSiteOrAddress: {
    DE: "Keine Baustelle / Adresse hinterlegt",
    EN: "No site / address stored",
    IT: "Nessun cantiere / indirizzo salvato",
    TR: "Şantiye / adres kayıtlı değil",
    SQ: "Nuk ka kantier / adresë të ruajtur",
    KU: "Ti cihê karê / navnîşan nehatî tomar kirin",
  },
  noWorkTimesInMonth: {
    DE: "Keine Arbeitszeiten im Monat.",
    EN: "No work times in month.",
    IT: "Nessun orario di lavoro nel mese.",
    TR: "Ay içinde çalışma süresi yok.",
    SQ: "Nuk ka orar pune në muaj.",
    KU: "Di mehê de demê karê tune ye.",
  },
  sickness: {
    DE: "🌡 Krankheit",
    EN: "🌡 Sickness",
    IT: "🌡 Malattia",
    TR: "🌡 Hastalık",
    SQ: "🌡 Sëmundje",
    KU: "🌡 Nexweşî",
  },
  period: {
    DE: "Zeitraum",
    EN: "period",
    IT: "periodo",
    TR: "dönem",
    SQ: "periudhë",
    KU: "dem",
  },
  periods: {
    DE: "Zeiträume",
    EN: "periods",
    IT: "periodi",
    TR: "dönem",
    SQ: "periudha",
    KU: "dem",
  },
  sickLabel: {
    DE: "🌡 Krank",
    EN: "🌡 Sick",
    IT: "🌡 Malato",
    TR: "🌡 Hasta",
    SQ: "🌡 Sëmurë",
    KU: "🌡 Nexweş",
  },
  noSickDaysInMonth: {
    DE: "Keine Krankheitstage im Monat.",
    EN: "No sick days in month.",
    IT: "Nessun giorno di malattia nel mese.",
    TR: "Ay içinde hastalık günü yok.",
    SQ: "Nuk ka ditë sëmundjeje në muaj.",
    KU: "Di mehê de rojên nexweşiyê tune ne.",
  },
  vacationLabel: {
    DE: "🌴 Urlaub",
    EN: "🌴 Vacation",
    IT: "🌴 Ferie",
    TR: "🌴 İzin",
    SQ: "🌴 Pushim",
    KU: "🌴 Betlane",
  },
  vacationUnpaidLabel: {
    DE: "💸 Urlaub unbezahlt",
    EN: "💸 Unpaid vacation",
    IT: "💸 Ferie non pagate",
    TR: "💸 Ücretsiz izin",
    SQ: "💸 Pushim i papaguar",
    KU: "💸 Betlaneya bêpere",
  },
  noVacationInMonth: {
    DE: "Kein Urlaub im Monat.",
    EN: "No vacation in month.",
    IT: "Nessuna ferie nel mese.",
    TR: "Ay içinde izin yok.",
    SQ: "Nuk ka pushim në muaj.",
    KU: "Di mehê de betlane tune ye.",
  },
  halfDay: {
    DE: "0,5 Tag",
    EN: "0.5 day",
    IT: "0,5 giorno",
    TR: "0,5 gün",
    SQ: "0,5 ditë",
    KU: "0.5 roj",
  },
  dashboard: {
    DE: "Dashboard",
    EN: "Dashboard",
    IT: "Dashboard",
    TR: "Gösterge paneli",
    SQ: "Paneli",
    KU: "Dashboard",
  },
  activeEmployeesModal: {
    DE: "Aktive Mitarbeiter",
    EN: "Active employees",
    IT: "Dipendenti attivi",
    TR: "Aktif çalışanlar",
    SQ: "Punonjës aktivë",
    KU: "Karmendên çalak",
  },
  missingEntriesTodayModal: {
    DE: "Fehlende Einträge heute",
    EN: "Missing entries today",
    IT: "Voci mancanti oggi",
    TR: "Bugün eksik kayıtlar",
    SQ: "Hyrje që mungojnë sot",
    KU: "Tomarên winda yên îro",
  },
  absencesTodayModal: {
    DE: "Abwesenheiten heute",
    EN: "Absences today",
    IT: "Assenze oggi",
    TR: "Bugünkü devamsızlıklar",
    SQ: "Mungesa sot",
    KU: "Nebûnên îro",
  },
  missingEntriesGeneralModal: {
    DE: "Fehlende Einträge (allgemein)",
    EN: "Missing entries (general)",
    IT: "Voci mancanti (generale)",
    TR: "Eksik kayıtlar (genel)",
    SQ: "Hyrje që mungojnë (në përgjithësi)",
    KU: "Tomarên winda (giştî)",
  },
  dash: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    KU: "—",
  },
  workTimeHours: {
    DE: "Arbeitszeit",
    EN: "Work time",
    IT: "Tempo di lavoro",
    TR: "Çalışma süresi",
    SQ: "Koha e punës",
    KU: "Dema karê",
  },
  vacationHours: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Betlane",
  },
  sickHours: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmurë",
    KU: "Nexweş",
  },
  unpaidVacationHours: {
    DE: "Urlaub unbezahlt",
    EN: "Unpaid vacation",
    IT: "Ferie non pagate",
    TR: "Ücretsiz izin",
    SQ: "Pushim i papaguar",
    KU: "Betlaneya bêpere",
  },
  openActiveEmployeesList: {
    DE: "Liste aktiver Mitarbeiter öffnen",
    EN: "Open list of active employees",
    IT: "Apri elenco dipendenti attivi",
    TR: "Aktif çalışan listesini aç",
    SQ: "Hap listën e punonjësve aktivë",
    KU: "Lîsteya karmendên çalak veke",
  },
  openMissingEntriesList: {
    DE: "Liste fehlender Einträge öffnen",
    EN: "Open list of missing entries",
    IT: "Apri elenco voci mancanti",
    TR: "Eksik kayıtlar listesini aç",
    SQ: "Hap listën e hyrjeve që mungojnë",
    KU: "Lîsteya tomarên winda veke",
  },
  openAbsencesList: {
    DE: "Liste heutiger Abwesenheiten öffnen",
    EN: "Open list of today's absences",
    IT: "Apri elenco delle assenze di oggi",
    TR: "Bugünkü devamsızlık listesini aç",
    SQ: "Hap listën e mungesave të sotme",
    KU: "Lîsteya nebûnên îroyê veke",
  },
  openGeneralMissingEntriesList: {
    DE: "Liste allgemeiner überfälliger fehlender Arbeitseinträge öffnen",
    EN: "Open list of general overdue missing work entries",
    IT: "Apri elenco generale delle registrazioni di lavoro mancanti e scadute",
    TR: "Genel gecikmiş eksik çalışma kayıtları listesini aç",
    SQ: "Hap listën e hyrjeve të përgjithshme të munguar të vonuara të punës",
    KU: "Lîsteya giştî ya tomarên karê winda yên derengmayî veke",
  },
  expandCollapseTitle: {
    DE: "Ein-/Ausklappen",
    EN: "Expand/collapse",
    IT: "Espandi/comprimi",
    TR: "Genişlet/daralt",
    SQ: "Hap/mbyll",
    KU: "Veke/bigire",
  },
  remindMissingNotLoggedIn: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Oturum açılmamış.",
    SQ: "Nuk jeni të identifikuar.",
    KU: "Têketin nehatiye kirin.",
  },
  remindMissingForbidden: {
    DE: "Kein Zugriff.",
    EN: "Access denied.",
    IT: "Accesso negato.",
    TR: "Erişim reddedildi.",
    SQ: "Qasja u refuzua.",
    KU: "Gihîştin hat redkirin.",
  },
  remindMissingInvalidBody: {
    DE: "Ungültige Anfrage.",
    EN: "Invalid request.",
    IT: "Richiesta non valida.",
    TR: "Geçersiz istek.",
    SQ: "Kërkesë e pavlefshme.",
    KU: "Daxwaza nederbasdar.",
  },
  remindMissingEmployeeIdMissing: {
    DE: "Mitarbeiter-ID fehlt.",
    EN: "Employee ID is missing.",
    IT: "Manca l'ID del dipendente.",
    TR: "Çalışan kimliği eksik.",
    SQ: "Mungon ID-ja e punonjësit.",
    KU: "Nasnameya karmend kêm e.",
  },
  remindMissingEmployeeNotFound: {
    DE: "Mitarbeiter nicht gefunden.",
    EN: "Employee not found.",
    IT: "Dipendente non trovato.",
    TR: "Çalışan bulunamadı.",
    SQ: "Punonjësi nuk u gjet.",
    KU: "Karmend nehat dîtin.",
  },
  remindMissingNoOverdueEntries: {
    DE: "Für diesen Mitarbeiter gibt es aktuell keine überfälligen fehlenden Arbeitseinträge.",
    EN: "There are currently no overdue missing work entries for this employee.",
    IT: "Attualmente non ci sono registrazioni di lavoro mancanti e scadute per questo dipendente.",
    TR: "Bu çalışan için şu anda gecikmiş eksik çalışma kaydı yok.",
    SQ: "Aktualisht nuk ka hyrje pune të munguar të vonuara për këtë punonjës.",
    KU: "Niha ji bo vî karmendî ti tomara karê winda ya derengmayî tune ye.",
  },
  remindMissingNoPushSubscription: {
    DE: "Für diesen Mitarbeiter ist keine aktive Push-Subscription vorhanden.",
    EN: "There is no active push subscription for this employee.",
    IT: "Per questo dipendente non è disponibile alcuna sottoscrizione push attiva.",
    TR: "Bu çalışan için aktif bir push aboneliği yok.",
    SQ: "Për këtë punonjës nuk ka abonim aktiv push.",
    KU: "Ji bo vî karmendî ti abonetiya push a çalak tune ye.",
  },
};
export type AdminVacationRequestsTextKey =
  | "activeLabel"
  | "loadingInitial"
  | "remainingVacation"
  | "loadingVacationAccount"
  | "approvedPaidOfAccrued"
  | "usedOfAccrued"
  | "alreadyTaken"
  | "asOf"
  | "allEmployees"
  | "selectedEmployee"
  | "vacationYear"
  | "asOfMonth"
  | "pendingRequestsKpi"
  | "approvedKpi"
  | "rejectedKpi"
  | "pageTitle"
  | "pageDescription"
  | "employee"
  | "month"
  | "loadError"
  | "networkLoadError"
  | "remainingLoadError"
  | "remainingNetworkError"
  | "requestNotFound"
  | "approveFailed"
  | "approveNetworkError"
  | "rejectFailed"
  | "rejectNetworkError"
  | "deleteConfirm"
  | "deleteFailed"
  | "deleteNetworkError"
  | "changeFailed"
  | "updateFailed"
  | "changeNetworkError"
  | "statusOpen"
  | "statusApproved"
  | "statusRejected"
  | "createdAt"
  | "decisionAt"
  | "period"
  | "start"
  | "end"
  | "type"
  | "typeVacation"
  | "typeSick"
  | "scope"
  | "fullDay"
  | "halfDay"
  | "compensation"
  | "paid"
  | "unpaid"
  | "employeeNote"
  | "noNote"
  | "processedBy"
  | "notDecidedYet"
  | "cancel"
  | "delete"
  | "deleting"
  | "reject"
  | "approve"
  | "approveCorrected"
  | "processing"
  | "saveChanges"
  | "saving"
  | "edit"
  | "openSection"
  | "approvedSection"
  | "rejectedSection"
  | "emptyOpen"
  | "emptyApproved"
  | "emptyRejected"
  | "day"
  | "days"
  | "halfVacationDay"
  | "total"
  | "mixedCompensationPrefix"
  | "insufficientPaidVacationHint"
  | "ofWhich"
  | "and";

export const ADMIN_VACATION_REQUESTS_UI_TEXTS: Record<
  AdminVacationRequestsTextKey,
  Record<AppUiLanguage, string>
> = {
  activeLabel: {
    DE: "#wirkönnendas",
    EN: "#wecandothis",
    IT: "#possiamofarlo",
    TR: "#bunuyaparız",
    SQ: "#nemundemiabëjmë",
    KU: "#emdikarinbikin",
  },
  loadingInitial: {
    DE: "Lädt Urlaubsanträge...",
    EN: "Loading vacation requests...",
    IT: "Caricamento richieste di ferie...",
    TR: "İzin talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat për pushim...",
    KU: "Daxwazên betlaneyê têne barkirin...",
  },
  remainingVacation: {
    DE: "Resturlaub",
    EN: "Remaining vacation",
    IT: "Ferie residue",
    TR: "Kalan izin",
    SQ: "Pushimi i mbetur",
    KU: "Betlaneya mayî",
  },
  loadingVacationAccount: {
    DE: "Urlaubskonto wird geladen…",
    EN: "Vacation balance is loading…",
    IT: "Il saldo ferie si sta caricando…",
    TR: "İzin bakiyesi yükleniyor…",
    SQ: "Bilanci i pushimit po ngarkohet…",
    KU: "Hejmara betlaneyê tê barkirin…",
  },
  approvedPaidOfAccrued: {
    DE: "von",
    EN: "of",
    IT: "di",
    TR: "içinden",
    SQ: "nga",
    KU: "ji",
  },
  usedOfAccrued: {
    DE: "von",
    EN: "of",
    IT: "di",
    TR: "içinden",
    SQ: "nga",
    KU: "ji",
  },
  alreadyTaken: {
    DE: "Bereits genommen:",
    EN: "Already taken:",
    IT: "Già utilizzate:",
    TR: "Zaten kullanıldı:",
    SQ: "Të përdorura tashmë:",
    KU: "Jixwe hatine girtin:",
  },
  asOf: {
    DE: "Stand",
    EN: "As of",
    IT: "Stato al",
    TR: "Durum",
    SQ: "Gjendja më",
    KU: "Rewş di",
  },
  allEmployees: {
    DE: "Alle Mitarbeiter",
    EN: "All employees",
    IT: "Tutti i dipendenti",
    TR: "Tüm çalışanlar",
    SQ: "Të gjithë punonjësit",
    KU: "Hemû karmend",
  },
  selectedEmployee: {
    DE: "Ausgewählter Mitarbeiter",
    EN: "Selected employee",
    IT: "Dipendente selezionato",
    TR: "Seçilen çalışan",
    SQ: "Punonjësi i zgjedhur",
    KU: "Karmenda hilbijartî",
  },
  vacationYear: {
    DE: "Urlaubsjahr",
    EN: "Vacation year",
    IT: "Anno ferie",
    TR: "İzin yılı",
    SQ: "Viti i pushimit",
    KU: "Sala betlaneyê",
  },
  asOfMonth: {
    DE: "Stand",
    EN: "As of",
    IT: "Stato",
    TR: "Durum",
    SQ: "Gjendja",
    KU: "Rewş",
  },
  pendingRequestsKpi: {
    DE: "Offene Urlaubsanträge",
    EN: "Open vacation requests",
    IT: "Richieste di ferie aperte",
    TR: "Açık izin talepleri",
    SQ: "Kërkesa të hapura për pushim",
    KU: "Daxwazên betlaneyê yên vekirî",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
  },
  pageTitle: {
    DE: "Urlaubsanträge",
    EN: "Vacation requests",
    IT: "Richieste di ferie",
    TR: "İzin talepleri",
    SQ: "Kërkesa për pushim",
    KU: "Daxwazên betlaneyê",
  },
  pageDescription: {
    DE: "Hier siehst du alle Urlaubsanträge deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.",
    EN: "Here you can see all vacation requests from your employees and approve or reject open requests directly.",
    IT: "Qui puoi vedere tutte le richieste di ferie dei tuoi dipendenti e approvare o rifiutare direttamente quelle aperte.",
    TR: "Burada çalışanlarınızın tüm izin taleplerini görebilir ve açık talepleri doğrudan onaylayabilir veya reddedebilirsiniz.",
    SQ: "Këtu mund të shohësh të gjitha kërkesat për pushim të punonjësve të tu dhe t'i miratosh ose refuzosh direkt kërkesat e hapura.",
    KU: "Li vir hemû daxwazên betlaneyê yên karmendên xwe dibînî û dikarî daxwazên vekirî rasterast pejirînî an red bikî.",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
  },
  month: {
    DE: "Monat",
    EN: "Month",
    IT: "Mese",
    TR: "Ay",
    SQ: "Muaji",
    KU: "Meh",
  },
  loadError: {
    DE: "Urlaubsanträge konnten nicht geladen werden.",
    EN: "Vacation requests could not be loaded.",
    IT: "Impossibile caricare le richieste di ferie.",
    TR: "İzin talepleri yüklenemedi.",
    SQ: "Kërkesat për pushim nuk mund të ngarkoheshin.",
    KU: "Daxwazên betlaneyê nehatin barkirin.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Urlaubsanträge.",
    EN: "Network error while loading vacation requests.",
    IT: "Errore di rete durante il caricamento delle richieste di ferie.",
    TR: "İzin talepleri yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të kërkesave për pushim.",
    KU: "Dema barkirina daxwazên betlaneyê de xeletiya torê çêbû.",
  },
  remainingLoadError: {
    DE: "Resturlaub konnte nicht geladen werden.",
    EN: "Remaining vacation could not be loaded.",
    IT: "Impossibile caricare le ferie residue.",
    TR: "Kalan izin yüklenemedi.",
    SQ: "Pushimi i mbetur nuk mund të ngarkohej.",
    KU: "Betlaneya mayî nehate barkirin.",
  },
  remainingNetworkError: {
    DE: "Netzwerkfehler beim Laden des Resturlaubs.",
    EN: "Network error while loading remaining vacation.",
    IT: "Errore di rete durante il caricamento delle ferie residue.",
    TR: "Kalan izin yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të pushimit të mbetur.",
    KU: "Dema barkirina betlaneya mayî de xeletiya torê çêbû.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
  },
  approveFailed: {
    DE: "Genehmigung fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onay başarısız oldu.",
    SQ: "Miratimi dështoi.",
    KU: "Pejirandin serneket.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler bei der Genehmigung.",
    EN: "Network error during approval.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onay sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    KU: "Dema pejirandinê de xeletiya torê.",
  },
  rejectFailed: {
    DE: "Ablehnung fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız oldu.",
    SQ: "Refuzimi dështoi.",
    KU: "Redkirin serneket.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler bei der Ablehnung.",
    EN: "Network error during rejection.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    KU: "Dema redkirinê de xeletiya torê.",
  },
  deleteConfirm: {
    DE: "Möchtest du diesen Urlaubsantrag wirklich dauerhaft löschen?",
    EN: "Do you really want to permanently delete this vacation request?",
    IT: "Vuoi davvero eliminare definitivamente questa richiesta di ferie?",
    TR: "Bu izin talebini kalıcı olarak silmek istediğinizden emin misiniz?",
    SQ: "A dëshiron vërtet ta fshish përgjithmonë këtë kërkesë për pushim?",
    KU: "Tu bi rastî dixwazî vê daxwaza betlaneyê bi temamî jê bibî?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
  },
  changeFailed: {
    DE: "Änderung fehlgeschlagen.",
    EN: "Change failed.",
    IT: "Modifica non riuscita.",
    TR: "Değişiklik başarısız oldu.",
    SQ: "Ndryshimi dështoi.",
    KU: "Guhertin serneket.",
  },
  updateFailed: {
    DE: "Antragsdaten konnten nicht aktualisiert werden.",
    EN: "Request data could not be updated.",
    IT: "Impossibile aggiornare i dati della richiesta.",
    TR: "Talep verileri güncellenemedi.",
    SQ: "Të dhënat e kërkesës nuk mund të përditësoheshin.",
    KU: "Daneyên daxwazê nehatin nûvekirin.",
  },
  changeNetworkError: {
    DE: "Netzwerkfehler bei der Änderung.",
    EN: "Network error while changing.",
    IT: "Errore di rete durante la modifica.",
    TR: "Değişiklik sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ndryshimit.",
    KU: "Dema guhertinê de xeletiya torê.",
  },
  statusOpen: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "E hapur",
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
  createdAt: {
    DE: "Erstellt:",
    EN: "Created:",
    IT: "Creata:",
    TR: "Oluşturuldu:",
    SQ: "Krijuar:",
    KU: "Hate afirandin:",
  },
  decisionAt: {
    DE: "Entscheidung:",
    EN: "Decision:",
    IT: "Decisione:",
    TR: "Karar:",
    SQ: "Vendimi:",
    KU: "Biryar:",
  },
  period: {
    DE: "Zeitraum",
    EN: "Period",
    IT: "Periodo",
    TR: "Dönem",
    SQ: "Periudha",
    KU: "Dem",
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
  type: {
    DE: "Typ",
    EN: "Type",
    IT: "Tipo",
    TR: "Tür",
    SQ: "Lloji",
    KU: "Cure",
  },
  typeVacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Betlane",
  },
  typeSick: {
    DE: "Krankheit",
    EN: "Sickness",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmundje",
    KU: "Nexweşî",
  },
  scope: {
    DE: "Umfang",
    EN: "Scope",
    IT: "Entità",
    TR: "Kapsam",
    SQ: "Shtrirja",
    KU: "Berfirehî",
  },
  fullDay: {
    DE: "Ganzer Tag",
    EN: "Full day",
    IT: "Giornata intera",
    TR: "Tam gün",
    SQ: "Ditë e plotë",
    KU: "Rojek temam",
  },
  halfDay: {
    DE: "Halber Tag",
    EN: "Half day",
    IT: "Mezza giornata",
    TR: "Yarım gün",
    SQ: "Gjysmë dite",
    KU: "Nîv roj",
  },
  compensation: {
    DE: "Vergütung",
    EN: "Compensation",
    IT: "Retribuzione",
    TR: "Ücretlendirme",
    SQ: "Kompensimi",
    KU: "Tezmînat",
  },
  paid: {
    DE: "Bezahlt",
    EN: "Paid",
    IT: "Pagata",
    TR: "Ücretli",
    SQ: "E paguar",
    KU: "Bi pere",
  },
  unpaid: {
    DE: "Unbezahlt",
    EN: "Unpaid",
    IT: "Non pagata",
    TR: "Ücretsiz",
    SQ: "E papaguar",
    KU: "Bêpere",
  },
  employeeNote: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota del dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
  },
  processedBy: {
    DE: "Bearbeitet von",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen kişi",
    SQ: "Përpunuar nga",
    KU: "Ji aliyê vê kesî ve hate kirin",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende nuk është vendosur",
    KU: "Hêj biryar nehatî dayîn",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    KU: "Betal bike",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
  },
  deleting: {
    DE: "Löscht...",
    EN: "Deleting...",
    IT: "Eliminazione...",
    TR: "Siliniyor...",
    SQ: "Duke fshirë...",
    KU: "Tê jêbirin...",
  },
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    KU: "Red bike",
  },
  approve: {
    DE: "Genehmigen",
    EN: "Approve",
    IT: "Approva",
    TR: "Onayla",
    SQ: "Mirato",
    KU: "Pejirîne",
  },
  approveCorrected: {
    DE: "Korrigieren & genehmigen",
    EN: "Correct & approve",
    IT: "Correggi e approva",
    TR: "Düzelt ve onayla",
    SQ: "Korrigjo dhe mirato",
    KU: "Rast bike û pejirîne",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke u përpunuar...",
    KU: "Tê pêvajokirin...",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guhertinan tomar bike",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    KU: "Biguherîne",
  },
  openSection: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperte",
    TR: "Açık",
    SQ: "Të hapura",
    KU: "Vekirî",
  },
  approvedSection: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Të miratuara",
    KU: "Pejirandî",
  },
  rejectedSection: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Të refuzuara",
    KU: "Redkirî",
  },
  emptyOpen: {
    DE: "Keine offenen Urlaubsanträge für diesen Filter.",
    EN: "No open vacation requests for this filter.",
    IT: "Nessuna richiesta di ferie aperta per questo filtro.",
    TR: "Bu filtre için açık izin talebi yok.",
    SQ: "Nuk ka kërkesa të hapura për pushim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza betlaneyê ya vekirî tune ye.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Urlaubsanträge für diesen Filter.",
    EN: "No approved vacation requests for this filter.",
    IT: "Nessuna richiesta di ferie approvata per questo filtro.",
    TR: "Bu filtre için onaylanmış izin talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara për pushim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza betlaneyê ya pejirandî tune ye.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Urlaubsanträge für diesen Filter.",
    EN: "No rejected vacation requests for this filter.",
    IT: "Nessuna richiesta di ferie rifiutata per questo filtro.",
    TR: "Bu filtre için reddedilmiş izin talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara për pushim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza betlaneyê ya redkirî tune ye.",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  halfVacationDay: {
    DE: "halber Urlaubstag",
    EN: "half vacation day",
    IT: "mezza giornata di ferie",
    TR: "yarım izin günü",
    SQ: "gjysmë dite pushimi",
    KU: "nîv roja betlaneyê",
  },
  total: {
    DE: "gesamt",
    EN: "total",
    IT: "totale",
    TR: "toplam",
    SQ: "gjithsej",
    KU: "tevahî",
  },
  mixedCompensationPrefix: {
    DE: "Für diesen Antrag ist aktuell eine gemischte Vergütung vorgesehen.",
    EN: "A mixed compensation is currently planned for this request.",
    IT: "Per questa richiesta è attualmente prevista una retribuzione mista.",
    TR: "Bu talep için şu anda karma bir ücretlendirme öngörülüyor.",
    SQ: "Për këtë kërkesë aktualisht parashikohet një kompensim i përzier.",
    KU: "Ji bo vê daxwazê niha tezmînata tevlihev hatî plan kirin.",
  },
  insufficientPaidVacationHint: {
    DE: "Für diesen Antrag ist aktuell unbezahlter Urlaub vorgesehen, weil nicht genug bezahlter Urlaub verfügbar war.",
    EN: "Unpaid vacation is currently planned for this request because not enough paid vacation was available.",
    IT: "Per questa richiesta sono attualmente previste ferie non retribuite perché non erano disponibili abbastanza ferie retribuite.",
    TR: "Bu talep için şu anda ücretsiz izin öngörülüyor çünkü yeterli ücretli izin mevcut değildi.",
    SQ: "Për këtë kërkesë aktualisht është parashikuar pushim i papaguar, sepse nuk kishte mjaftueshëm pushim të paguar në dispozicion.",
    KU: "Ji bo vê daxwazê niha betlaneya bêpere hatî plan kirin, ji ber ku têra betlaneya bi pere tunebû.",
  },
  ofWhich: {
    DE: "davon",
    EN: "of which",
    IT: "di cui",
    TR: "bunların",
    SQ: "prej tyre",
    KU: "ji wan",
  },
  and: {
    DE: "und",
    EN: "and",
    IT: "e",
    TR: "ve",
    SQ: "dhe",
    KU: "û",
  },
};

export type AdminSickRequestsTextKey =
  | "activeLabel"
  | "loadingInitial"
  | "pendingRequestsKpi"
  | "approvedKpi"
  | "rejectedKpi"
  | "pageTitle"
  | "pageDescription"
  | "employee"
  | "month"
  | "allEmployees"
  | "selectedEmployee"
  | "loadError"
  | "networkLoadError"
  | "requestNotFound"
  | "approveFailed"
  | "approveNetworkError"
  | "rejectFailed"
  | "rejectNetworkError"
  | "deleteConfirm"
  | "deleteFailed"
  | "deleteNetworkError"
  | "changeFailed"
  | "updateFailed"
  | "changeNetworkError"
  | "statusOpen"
  | "statusApproved"
  | "statusRejected"
  | "createdAt"
  | "decisionAt"
  | "period"
  | "start"
  | "end"
  | "employeeNote"
  | "noNote"
  | "processedBy"
  | "notDecidedYet"
  | "cancel"
  | "delete"
  | "deleting"
  | "reject"
  | "approve"
  | "approveCorrected"
  | "processing"
  | "saveChanges"
  | "saving"
  | "edit"
  | "openSection"
  | "approvedSection"
  | "rejectedSection"
  | "emptyOpen"
  | "emptyApproved"
  | "emptyRejected"
  | "day"
  | "days"
  | "sickLabel";

export const ADMIN_SICK_REQUESTS_UI_TEXTS: Record<
  AdminSickRequestsTextKey,
  Record<AppUiLanguage, string>
> = {
  activeLabel: {
    DE: "#wirkönnendas",
    EN: "#wecandothis",
    IT: "#possiamofarlo",
    TR: "#bunuyaparız",
    SQ: "#nemundemiabëjmë",
    KU: "#emdikarinbikin",
  },
  loadingInitial: {
    DE: "Lädt Krankheitsanträge...",
    EN: "Loading sickness requests...",
    IT: "Caricamento richieste di malattia...",
    TR: "Hastalık talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat për sëmundje...",
    KU: "Daxwazên nexweşiyê têne barkirin...",
  },
  pendingRequestsKpi: {
    DE: "Offene Krankheitsanträge",
    EN: "Open sickness requests",
    IT: "Richieste di malattia aperte",
    TR: "Açık hastalık talepleri",
    SQ: "Kërkesa të hapura për sëmundje",
    KU: "Daxwazên nexweşiyê yên vekirî",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
  },
  pageTitle: {
    DE: "Krankheitsanträge",
    EN: "Sickness requests",
    IT: "Richieste di malattia",
    TR: "Hastalık talepleri",
    SQ: "Kërkesa për sëmundje",
    KU: "Daxwazên nexweşiyê",
  },
  pageDescription: {
    DE: "Hier siehst du alle Krankheitsanträge deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.",
    EN: "Here you can see all sickness requests from your employees and approve or reject open requests directly.",
    IT: "Qui puoi vedere tutte le richieste di malattia dei tuoi dipendenti e approvare o rifiutare direttamente quelle aperte.",
    TR: "Burada çalışanlarınızın tüm hastalık taleplerini görebilir ve açık talepleri doğrudan onaylayabilir veya reddedebilirsiniz.",
    SQ: "Këtu mund të shohësh të gjitha kërkesat për sëmundje të punonjësve të tu dhe t'i miratosh ose refuzosh direkt kërkesat e hapura.",
    KU: "Li vir hemû daxwazên nexweşiyê yên karmendên xwe dibînî û dikarî daxwazên vekirî rasterast pejirînî an red bikî.",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
  },
  month: {
    DE: "Monat",
    EN: "Month",
    IT: "Mese",
    TR: "Ay",
    SQ: "Muaji",
    KU: "Meh",
  },
  allEmployees: {
    DE: "Alle Mitarbeiter",
    EN: "All employees",
    IT: "Tutti i dipendenti",
    TR: "Tüm çalışanlar",
    SQ: "Të gjithë punonjësit",
    KU: "Hemû karmend",
  },
  selectedEmployee: {
    DE: "Ausgewählter Mitarbeiter",
    EN: "Selected employee",
    IT: "Dipendente selezionato",
    TR: "Seçilen çalışan",
    SQ: "Punonjësi i zgjedhur",
    KU: "Karmenda hilbijartî",
  },
  loadError: {
    DE: "Krankheitsanträge konnten nicht geladen werden.",
    EN: "Sickness requests could not be loaded.",
    IT: "Impossibile caricare le richieste di malattia.",
    TR: "Hastalık talepleri yüklenemedi.",
    SQ: "Kërkesat për sëmundje nuk mund të ngarkoheshin.",
    KU: "Daxwazên nexweşiyê nehatin barkirin.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Krankheitsanträge.",
    EN: "Network error while loading sickness requests.",
    IT: "Errore di rete durante il caricamento delle richieste di malattia.",
    TR: "Hastalık talepleri yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të kërkesave për sëmundje.",
    KU: "Dema barkirina daxwazên nexweşiyê de xeletiya torê çêbû.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
  },
  approveFailed: {
    DE: "Genehmigung fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onay başarısız oldu.",
    SQ: "Miratimi dështoi.",
    KU: "Pejirandin serneket.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler bei der Genehmigung.",
    EN: "Network error during approval.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onay sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    KU: "Dema pejirandinê de xeletiya torê.",
  },
  rejectFailed: {
    DE: "Ablehnung fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız oldu.",
    SQ: "Refuzimi dështoi.",
    KU: "Redkirin serneket.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler bei der Ablehnung.",
    EN: "Network error during rejection.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    KU: "Dema redkirinê de xeletiya torê.",
  },
  deleteConfirm: {
    DE: "Möchtest du diesen Krankheitsantrag wirklich dauerhaft löschen?",
    EN: "Do you really want to permanently delete this sickness request?",
    IT: "Vuoi davvero eliminare definitivamente questa richiesta di malattia?",
    TR: "Bu hastalık talebini kalıcı olarak silmek istediğinizden emin misiniz?",
    SQ: "A dëshiron vërtet ta fshish përgjithmonë këtë kërkesë për sëmundje?",
    KU: "Tu bi rastî dixwazî vê daxwaza nexweşiyê bi temamî jê bibî?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
  },
  changeFailed: {
    DE: "Änderung fehlgeschlagen.",
    EN: "Change failed.",
    IT: "Modifica non riuscita.",
    TR: "Değişiklik başarısız oldu.",
    SQ: "Ndryshimi dështoi.",
    KU: "Guhertin serneket.",
  },
  updateFailed: {
    DE: "Antragsdaten konnten nicht aktualisiert werden.",
    EN: "Request data could not be updated.",
    IT: "Impossibile aggiornare i dati della richiesta.",
    TR: "Talep verileri güncellenemedi.",
    SQ: "Të dhënat e kërkesës nuk mund të përditësoheshin.",
    KU: "Daneyên daxwazê nehatin nûvekirin.",
  },
  changeNetworkError: {
    DE: "Netzwerkfehler bei der Änderung.",
    EN: "Network error while changing.",
    IT: "Errore di rete durante la modifica.",
    TR: "Değişiklik sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ndryshimit.",
    KU: "Dema guhertinê de xeletiya torê.",
  },
  statusOpen: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "E hapur",
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
  createdAt: {
    DE: "Erstellt:",
    EN: "Created:",
    IT: "Creata:",
    TR: "Oluşturuldu:",
    SQ: "Krijuar:",
    KU: "Hate afirandin:",
  },
  decisionAt: {
    DE: "Entscheidung:",
    EN: "Decision:",
    IT: "Decisione:",
    TR: "Karar:",
    SQ: "Vendimi:",
    KU: "Biryar:",
  },
  period: {
    DE: "Zeitraum",
    EN: "Period",
    IT: "Periodo",
    TR: "Dönem",
    SQ: "Periudha",
    KU: "Dem",
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
  employeeNote: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota del dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
  },
  processedBy: {
    DE: "Bearbeitet von",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen kişi",
    SQ: "Përpunuar nga",
    KU: "Ji aliyê vê kesî ve hate kirin",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende nuk është vendosur",
    KU: "Hêj biryar nehatî dayîn",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    KU: "Betal bike",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
  },
  deleting: {
    DE: "Löscht...",
    EN: "Deleting...",
    IT: "Eliminazione...",
    TR: "Siliniyor...",
    SQ: "Duke fshirë...",
    KU: "Tê jêbirin...",
  },
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    KU: "Red bike",
  },
  approve: {
    DE: "Genehmigen",
    EN: "Approve",
    IT: "Approva",
    TR: "Onayla",
    SQ: "Mirato",
    KU: "Pejirîne",
  },
  approveCorrected: {
    DE: "Korrigieren & genehmigen",
    EN: "Correct & approve",
    IT: "Correggi e approva",
    TR: "Düzelt ve onayla",
    SQ: "Korrigjo dhe mirato",
    KU: "Rast bike û pejirîne",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke u përpunuar...",
    KU: "Tê pêvajokirin...",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guhertinan tomar bike",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    KU: "Biguherîne",
  },
  openSection: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperte",
    TR: "Açık",
    SQ: "Të hapura",
    KU: "Vekirî",
  },
  approvedSection: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Të miratuara",
    KU: "Pejirandî",
  },
  rejectedSection: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Të refuzuara",
    KU: "Redkirî",
  },
  emptyOpen: {
    DE: "Keine offenen Krankheitsanträge.",
    EN: "No open sickness requests.",
    IT: "Nessuna richiesta di malattia aperta.",
    TR: "Açık hastalık talebi yok.",
    SQ: "Nuk ka kërkesa të hapura për sëmundje.",
    KU: "Ti daxwaza nexweşiyê ya vekirî tune ye.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Krankheitsanträge.",
    EN: "No approved sickness requests.",
    IT: "Nessuna richiesta di malattia approvata.",
    TR: "Onaylanmış hastalık talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara për sëmundje.",
    KU: "Ti daxwaza nexweşiyê ya pejirandî tune ye.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Krankheitsanträge.",
    EN: "No rejected sickness requests.",
    IT: "Nessuna richiesta di malattia rifiutata.",
    TR: "Reddedilmiş hastalık talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara për sëmundje.",
    KU: "Ti daxwaza nexweşiyê ya redkirî tune ye.",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
  },
  sickLabel: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malato",
    TR: "Hasta",
    SQ: "Sëmurë",
    KU: "Nexweş",
  },
};

export type AdminUsersTextKey =
  | "activeLabel"
  | "pageTitle"
  | "pageSubtitle"
  | "loadError"
  | "resetFailed"
  | "loading"
  | "empty"
  | "createResetLink"
  | "resetLinkTitle"
  | "validUntil"
  | "copied"
  | "copyNotPossible"
  | "copyLink"
  | "close"
  | "hint";

export const ADMIN_USERS_UI_TEXTS: Record<
  AdminUsersTextKey,
  Record<AppUiLanguage, string>
> = {
  activeLabel: {
    DE: "Mitarbeiter",
    EN: "Employees",
    IT: "Dipendenti",
    TR: "Çalışanlar",
    SQ: "Punonjësit",
    KU: "Karmend",
  },
  pageTitle: {
    DE: "Mitarbeiter",
    EN: "Employees",
    IT: "Dipendenti",
    TR: "Çalışanlar",
    SQ: "Punonjësit",
    KU: "Karmend",
  },
  pageSubtitle: {
    DE: "Reset-Link erstellen und dem Mitarbeiter schicken (z. B. per WhatsApp).",
    EN: "Create a reset link and send it to the employee (e.g. via WhatsApp).",
    IT: "Crea un link di reset e invialo al dipendente (ad es. tramite WhatsApp).",
    TR: "Sıfırlama bağlantısı oluştur ve çalışana gönder (ör. WhatsApp ile).",
    SQ: "Krijo një link rivendosjeje dhe dërgoja punonjësit (p.sh. me WhatsApp).",
    KU: "Girêdana nûvekirinê biafirîne û bişîne karmendê (mînak WhatsApp).",
  },
  loadError: {
    DE: "Konnte Mitarbeiter nicht laden.",
    EN: "Could not load employees.",
    IT: "Impossibile caricare i dipendenti.",
    TR: "Çalışanlar yüklenemedi.",
    SQ: "Punonjësit nuk mund të ngarkoheshin.",
    KU: "Karmend nehatin barkirin.",
  },
  resetFailed: {
    DE: "Reset fehlgeschlagen.",
    EN: "Reset failed.",
    IT: "Reimpostazione non riuscita.",
    TR: "Sıfırlama başarısız oldu.",
    SQ: "Rivendosja dështoi.",
    KU: "Nûvekirin serneket.",
  },
  loading: {
    DE: "Lädt...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
  },
  empty: {
    DE: "Keine Mitarbeiter gefunden.",
    EN: "No employees found.",
    IT: "Nessun dipendente trovato.",
    TR: "Çalışan bulunamadı.",
    SQ: "Nuk u gjet asnjë punonjës.",
    KU: "Ti karmend nehat dîtin.",
  },
  createResetLink: {
    DE: "Reset-Link erstellen",
    EN: "Create reset link",
    IT: "Crea link di reset",
    TR: "Sıfırlama bağlantısı oluştur",
    SQ: "Krijo link rivendosjeje",
    KU: "Girêdana nûvekirinê biafirîne",
  },
  resetLinkTitle: {
    DE: "Reset-Link",
    EN: "Reset link",
    IT: "Link di reset",
    TR: "Sıfırlama bağlantısı",
    SQ: "Link rivendosjeje",
    KU: "Girêdana nûvekirinê",
  },
  validUntil: {
    DE: "Gültig bis:",
    EN: "Valid until:",
    IT: "Valido fino al:",
    TR: "Şu tarihe kadar geçerli:",
    SQ: "I vlefshëm deri më:",
    KU: "Derbasdar heta:",
  },
  copied: {
    DE: "Kopiert ✅",
    EN: "Copied ✅",
    IT: "Copiato ✅",
    TR: "Kopyalandı ✅",
    SQ: "U kopjua ✅",
    KU: "Hat kopîkirin ✅",
  },
  copyNotPossible: {
    DE: "Kopieren nicht möglich",
    EN: "Copying not possible",
    IT: "Copia non possibile",
    TR: "Kopyalama mümkün değil",
    SQ: "Kopjimi nuk është i mundur",
    KU: "Kopîkirin ne gengaz e",
  },
  copyLink: {
    DE: "Link kopieren",
    EN: "Copy link",
    IT: "Copia link",
    TR: "Bağlantıyı kopyala",
    SQ: "Kopjo linkun",
    KU: "Girêdanê kopî bike",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  hint: {
    DE: "Hinweis: Link ist einmalig. Danach ist er ungültig.",
    EN: "Note: The link can only be used once. Afterwards it becomes invalid.",
    IT: "Nota: Il link è monouso. Successivamente non sarà più valido.",
    TR: "Not: Bağlantı tek kullanımlıktır. Sonrasında geçersiz olur.",
    SQ: "Shënim: Linku përdoret vetëm një herë. Më pas bëhet i pavlefshëm.",
    KU: "Têbînî: Girêdan tenê carekê tê bikaranîn. Piştî wê nederbasdar dibe.",
  },
};
export type AdminWeeklyPlanTextKey =
  | "activeLabel"
  | "loading"
  | "accessDenied"
  | "pageTitle"
  | "calendarWeek"
  | "previousWeek"
  | "nextWeek"
  | "appointmentsBack"
  | "noEntries"
  | "adminNoteLabel"
  | "emptyValue"
  | "entryCreate"
  | "noteCreate"
  | "entryEditTitle"
  | "entryCreateTitle"
  | "noteEditTitle"
  | "noteCreateTitle"
  | "delete"
  | "deleting"
  | "close"
  | "save"
  | "saving"
  | "date"
  | "employee"
  | "start"
  | "end"
  | "activity"
  | "location"
  | "travelMinutes"
  | "employeeNote"
  | "employeeNoteHelp"
  | "documentsTitle"
  | "documentsSaveEntryFirst"
  | "documentsLoadError"
  | "documentsNetworkError"
  | "documentReadError"
  | "documentPreviewError"
  | "documentShareUnavailable"
  | "documentShareError"
  | "documentMissingFile"
  | "documentInvalidType"
  | "documentEmptyFile"
  | "documentTooLarge"
  | "documentUploadReadError"
  | "documentUploadTimeout"
  | "documentUploadFailed"
  | "documentUploadNetworkError"
  | "documentDeleteConfirm"
  | "documentDeleteFailed"
  | "title"
  | "file"
  | "uploadDocument"
  | "uploading"
  | "documentAllowedInfo"
  | "loadingDocuments"
  | "noDocuments"
  | "previewInApp"
  | "shareOrSave"
  | "document"
  | "noPreviewAvailable"
  | "internalAdminNoteInfo"
  | "pleaseSelectEmployee"
  | "pleaseSelectDate"
  | "pleaseSelectStartEnd"
  | "saveEntryFailed"
  | "deleteEntryConfirm"
  | "deleteEntryFailed"
  | "saveNoteFailed"
  | "deleteNoteConfirm"
  | "deleteNoteFailed"
  | "adminNoteEdit"
  | "adminNoteCreate"
  | "internalAdminNote"
  | "internalAdminNoteHelp"
  | "employeeNotePrefix"
  | "editPlanEntryTitle"
  | "createPlanEntryTitle"
  | "editAdminNoteTitle"
  | "createAdminNoteTitle"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "repairWork"
  | "subcontractors"
  | "keepPrefixHint";

export const ADMIN_WEEKLY_PLAN_UI_TEXTS: Record<
  AdminWeeklyPlanTextKey,
  Record<AppUiLanguage, string>
> = {
  activeLabel: {
    DE: "Wochenplan",
    EN: "Weekly plan",
    IT: "Piano settimanale",
    TR: "Haftalık plan",
    SQ: "Plani javor",
    KU: "Plana hefteyî",
  },
  loading: {
    DE: "lädt…",
    EN: "loading…",
    IT: "caricamento…",
    TR: "yükleniyor…",
    SQ: "duke u ngarkuar…",
    KU: "tê barkirin…",
  },
  accessDenied: {
    DE: "Kein Zugriff (Admin benötigt).",
    EN: "No access (admin required).",
    IT: "Nessun accesso (serve admin).",
    TR: "Erişim yok (yönetici gerekli).",
    SQ: "Nuk ka qasje (kërkohet admin).",
    KU: "Gihîştin tune ye (admin pêwîst e).",
  },
  pageTitle: {
    DE: "Wochenplanung",
    EN: "Weekly planning",
    IT: "Pianificazione settimanale",
    TR: "Haftalık planlama",
    SQ: "Planifikimi javor",
    KU: "Planandina hefteyî",
  },
  calendarWeek: {
    DE: "KW",
    EN: "CW",
    IT: "Sett.",
    TR: "HF",
    SQ: "Java",
    KU: "Heft",
  },
  previousWeek: {
    DE: "← Woche",
    EN: "← Week",
    IT: "← Settimana",
    TR: "← Hafta",
    SQ: "← Java",
    KU: "← Heft",
  },
  nextWeek: {
    DE: "Woche →",
    EN: "Week →",
    IT: "Settimana →",
    TR: "Hafta →",
    SQ: "Java →",
    KU: "Heft →",
  },
  appointmentsBack: {
    DE: "⟵ Termine",
    EN: "⟵ Appointments",
    IT: "⟵ Appuntamenti",
    TR: "⟵ Randevular",
    SQ: "⟵ Takimet",
    KU: "⟵ Civîn",
  },
  noEntries: {
    DE: "Keine Einträge.",
    EN: "No entries.",
    IT: "Nessuna voce.",
    TR: "Kayıt yok.",
    SQ: "Nuk ka hyrje.",
    KU: "Ti tomar tune ne.",
  },
  adminNoteLabel: {
    DE: "🔒 Admin-Notiz",
    EN: "🔒 Admin note",
    IT: "🔒 Nota admin",
    TR: "🔒 Yönetici notu",
    SQ: "🔒 Shënim admini",
    KU: "🔒 Nîşeya admin",
  },
  emptyValue: {
    DE: "(leer)",
    EN: "(empty)",
    IT: "(vuoto)",
    TR: "(boş)",
    SQ: "(bosh)",
    KU: "(vala)",
  },
  entryCreate: {
    DE: "+ Eintrag (Plan)",
    EN: "+ Entry (plan)",
    IT: "+ Voce (piano)",
    TR: "+ Kayıt (plan)",
    SQ: "+ Hyrje (plan)",
    KU: "+ Tomar (plan)",
  },
  noteCreate: {
    DE: "+ Notiz (Admin)",
    EN: "+ Note (admin)",
    IT: "+ Nota (admin)",
    TR: "+ Not (yönetici)",
    SQ: "+ Shënim (admin)",
    KU: "+ Nîşe (admin)",
  },
  entryEditTitle: {
    DE: "Eintrag bearbeiten",
    EN: "Edit entry",
    IT: "Modifica voce",
    TR: "Kaydı düzenle",
    SQ: "Ndrysho hyrjen",
    KU: "Tomarê biguherîne",
  },
  entryCreateTitle: {
    DE: "Eintrag anlegen",
    EN: "Create entry",
    IT: "Crea voce",
    TR: "Kayıt oluştur",
    SQ: "Krijo hyrje",
    KU: "Tomar biafirîne",
  },
  noteEditTitle: {
    DE: "Admin-Notiz bearbeiten",
    EN: "Edit admin note",
    IT: "Modifica nota admin",
    TR: "Yönetici notunu düzenle",
    SQ: "Ndrysho shënimin e adminit",
    KU: "Nîşeya admin biguherîne",
  },
  noteCreateTitle: {
    DE: "Admin-Notiz anlegen",
    EN: "Create admin note",
    IT: "Crea nota admin",
    TR: "Yönetici notu oluştur",
    SQ: "Krijo shënim admini",
    KU: "Nîşeya admin biafirîne",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
  },
  deleting: {
    DE: "Lösche…",
    EN: "Deleting…",
    IT: "Eliminazione…",
    TR: "Siliniyor…",
    SQ: "Duke fshirë…",
    KU: "Tê jêbirin…",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
  save: {
    DE: "Speichern",
    EN: "Save",
    IT: "Salva",
    TR: "Kaydet",
    SQ: "Ruaj",
    KU: "Tomar bike",
  },
  saving: {
    DE: "Speichere…",
    EN: "Saving…",
    IT: "Salvataggio…",
    TR: "Kaydediliyor…",
    SQ: "Duke ruajtur…",
    KU: "Tê tomarkirin…",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
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
  activity: {
    DE: "Tätigkeit",
    EN: "Activity",
    IT: "Attività",
    TR: "Faaliyet",
    SQ: "Veprimtaria",
    KU: "Çalakî",
  },
  location: {
    DE: "Ort",
    EN: "Location",
    IT: "Luogo",
    TR: "Konum",
    SQ: "Vendi",
    KU: "Cih",
  },
  travelMinutes: {
    DE: "Fahrzeit (Minuten)",
    EN: "Travel time (minutes)",
    IT: "Tempo di viaggio (minuti)",
    TR: "Yol süresi (dakika)",
    SQ: "Koha e udhëtimit (minuta)",
    KU: "Dema rêyê (deqîqe)",
  },
  employeeNote: {
    DE: "Notiz (für Mitarbeiter)",
    EN: "Note (for employees)",
    IT: "Nota (per i dipendenti)",
    TR: "Not (çalışanlar için)",
    SQ: "Shënim (për punonjësit)",
    KU: "Nîşe (ji bo karmendan)",
  },
  employeeNoteHelp: {
    DE: "Diese Notiz sehen Mitarbeiter im Kalender/Modal.",
    EN: "Employees can see this note in the calendar/modal.",
    IT: "I dipendenti vedono questa nota nel calendario/modal.",
    TR: "Çalışanlar bu notu takvim/modal içinde görür.",
    SQ: "Punonjësit e shohin këtë shënim në kalendar/modal.",
    KU: "Karmend ev nîşe di salname/modal de dibînin.",
  },
  documentsTitle: {
    DE: "📎 Dokumente (Baustellenzettel etc.)",
    EN: "📎 Documents (site sheets etc.)",
    IT: "📎 Documenti (rapporti di cantiere ecc.)",
    TR: "📎 Belgeler (şantiye formları vb.)",
    SQ: "📎 Dokumente (fletë kantieri etj.)",
    KU: "📎 Belge (pelên cihê karê û hwd.)",
  },
  documentsSaveEntryFirst: {
    DE: "Speichere zuerst den Plan-Eintrag – danach kannst du Dokumente hochladen.",
    EN: "Save the plan entry first — then you can upload documents.",
    IT: "Salva prima la voce del piano — poi potrai caricare documenti.",
    TR: "Önce plan kaydını kaydet — ardından belge yükleyebilirsin.",
    SQ: "Ruaje fillimisht hyrjen e planit — më pas mund të ngarkosh dokumente.",
    KU: "Pêşî tomarê planê tomar bike — paşê dikarî belge bar bikî.",
  },
  documentsLoadError: {
    DE: "Dokumente konnten nicht geladen werden.",
    EN: "Documents could not be loaded.",
    IT: "Impossibile caricare i documenti.",
    TR: "Belgeler yüklenemedi.",
    SQ: "Dokumentet nuk mund të ngarkoheshin.",
    KU: "Belge nehatin barkirin.",
  },
  documentsNetworkError: {
    DE: "Netzwerkfehler beim Laden der Dokumente.",
    EN: "Network error while loading documents.",
    IT: "Errore di rete durante il caricamento dei documenti.",
    TR: "Belgeler yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të dokumenteve.",
    KU: "Dema barkirina belgeyan de xeletiya torê çêbû.",
  },
  documentReadError: {
    DE: "Datei konnte per FileReader nicht gelesen werden.",
    EN: "File could not be read via FileReader.",
    IT: "Il file non può essere letto tramite FileReader.",
    TR: "Dosya FileReader ile okunamadı.",
    SQ: "Skedari nuk mund të lexohej me FileReader.",
    KU: "Pel bi FileReader nehate xwendin.",
  },
  documentPreviewError: {
    DE: "Dokument konnte nicht in der App geöffnet werden.",
    EN: "Document could not be opened in the app.",
    IT: "Il documento non può essere aperto nell'app.",
    TR: "Belge uygulamada açılamadı.",
    SQ: "Dokumenti nuk mund të hapej në aplikacion.",
    KU: "Belge di appê de venebû.",
  },
  documentShareUnavailable: {
    DE: "Auf diesem Gerät ist 'Teilen / Sichern' hier nicht verfügbar.",
    EN: "‘Share / Save’ is not available here on this device.",
    IT: "‘Condividi / Salva’ non è disponibile qui su questo dispositivo.",
    TR: "Bu cihazda burada ‘Paylaş / Kaydet’ kullanılamıyor.",
    SQ: "‘Ndaj / Ruaj’ nuk është i disponueshëm këtu në këtë pajisje.",
    KU: "Li ser vê cîhazê de ‘Parve bike / Tomar bike’ li vir tune ye.",
  },
  documentShareError: {
    DE: "Dokument konnte nicht geteilt bzw. gespeichert werden.",
    EN: "Document could not be shared or saved.",
    IT: "Il documento non può essere condiviso o salvato.",
    TR: "Belge paylaşılamadı veya kaydedilemedi.",
    SQ: "Dokumenti nuk mund të ndahej ose ruhej.",
    KU: "Belge nehat parvekirin an tomarkirin.",
  },
  documentMissingFile: {
    DE: "Bitte eine Datei auswählen.",
    EN: "Please select a file.",
    IT: "Seleziona un file.",
    TR: "Lütfen bir dosya seçin.",
    SQ: "Ju lutem zgjidhni një skedar.",
    KU: "Ji kerema xwe pelek hilbijêre.",
  },
  documentInvalidType: {
    DE: "Dateityp nicht erlaubt. Erlaubt sind PDF, JPG, PNG und WEBP.",
    EN: "File type not allowed. Allowed: PDF, JPG, PNG, and WEBP.",
    IT: "Tipo di file non consentito. Consentiti: PDF, JPG, PNG e WEBP.",
    TR: "Dosya türüne izin verilmiyor. İzin verilenler: PDF, JPG, PNG ve WEBP.",
    SQ: "Lloji i skedarit nuk lejohet. Lejohen: PDF, JPG, PNG dhe WEBP.",
    KU: "Cureyê pelê ne destûr e. PDF, JPG, PNG û WEBP destûr in.",
  },
  documentEmptyFile: {
    DE: "Die gewählte Datei ist leer.",
    EN: "The selected file is empty.",
    IT: "Il file selezionato è vuoto.",
    TR: "Seçilen dosya boş.",
    SQ: "Skedari i zgjedhur është bosh.",
    KU: "Pelê hilbijartî vala ye.",
  },
  documentTooLarge: {
    DE: "Datei zu groß",
    EN: "File too large",
    IT: "File troppo grande",
    TR: "Dosya çok büyük",
    SQ: "Skedari është shumë i madh",
    KU: "Pel pir mezin e",
  },
  documentUploadReadError: {
    DE: "Die Datei konnte auf diesem Gerät nicht gelesen werden.",
    EN: "The file could not be read on this device.",
    IT: "Il file non può essere letto su questo dispositivo.",
    TR: "Dosya bu cihazda okunamadı.",
    SQ: "Skedari nuk mund të lexohej në këtë pajisje.",
    KU: "Pel li ser vê cîhazê nehat xwendin.",
  },
  documentUploadTimeout: {
    DE: "Upload dauert zu lange. Bitte Datei erneut auswählen und erneut versuchen.",
    EN: "Upload is taking too long. Please reselect the file and try again.",
    IT: "Il caricamento richiede troppo tempo. Seleziona di nuovo il file e riprova.",
    TR: "Yükleme çok uzun sürüyor. Lütfen dosyayı tekrar seçip yeniden deneyin.",
    SQ: "Ngarkimi po zgjat shumë. Ju lutem zgjidhni përsëri skedarin dhe provoni sërish.",
    KU: "Barkirin pir dirêj dibe. Ji kerema xwe pelê dîsa hilbijêre û dîsa biceribîne.",
  },
  documentUploadFailed: {
    DE: "Upload fehlgeschlagen.",
    EN: "Upload failed.",
    IT: "Caricamento non riuscito.",
    TR: "Yükleme başarısız oldu.",
    SQ: "Ngarkimi dështoi.",
    KU: "Barkirin serneket.",
  },
  documentUploadNetworkError: {
    DE: "Netzwerkfehler beim Upload.",
    EN: "Network error during upload.",
    IT: "Errore di rete durante il caricamento.",
    TR: "Yükleme sırasında ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit.",
    KU: "Dema barkirinê de xeletiya torê çêbû.",
  },
  documentDeleteConfirm: {
    DE: "Dokument wirklich löschen?",
    EN: "Really delete document?",
    IT: "Eliminare davvero il documento?",
    TR: "Belge gerçekten silinsin mi?",
    SQ: "Të fshihet vërtet dokumenti?",
    KU: "Belge bi rastî were jêbirin?",
  },
  documentDeleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
  },
  title: {
    DE: "Titel",
    EN: "Title",
    IT: "Titolo",
    TR: "Başlık",
    SQ: "Titulli",
    KU: "Sernav",
  },
  file: {
    DE: "Datei",
    EN: "File",
    IT: "File",
    TR: "Dosya",
    SQ: "Skedari",
    KU: "Pel",
  },
  uploadDocument: {
    DE: "Dokument hochladen",
    EN: "Upload document",
    IT: "Carica documento",
    TR: "Belge yükle",
    SQ: "Ngarko dokument",
    KU: "Belge bar bike",
  },
  uploading: {
    DE: "Upload...",
    EN: "Uploading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke ngarkuar...",
    KU: "Tê barkirin...",
  },
  documentAllowedInfo: {
    DE: "Erlaubt: PDF, JPG, PNG, WEBP · max. 15 MB",
    EN: "Allowed: PDF, JPG, PNG, WEBP · max. 15 MB",
    IT: "Consentiti: PDF, JPG, PNG, WEBP · max. 15 MB",
    TR: "İzin verilenler: PDF, JPG, PNG, WEBP · maks. 15 MB",
    SQ: "Lejohen: PDF, JPG, PNG, WEBP · maks. 15 MB",
    KU: "Destûr in: PDF, JPG, PNG, WEBP · herî zêde 15 MB",
  },
  loadingDocuments: {
    DE: "Lade Dokumente...",
    EN: "Loading documents...",
    IT: "Caricamento documenti...",
    TR: "Belgeler yükleniyor...",
    SQ: "Po ngarkohen dokumentet...",
    KU: "Belge têne barkirin...",
  },
  noDocuments: {
    DE: "Noch keine Dokumente.",
    EN: "No documents yet.",
    IT: "Nessun documento ancora.",
    TR: "Henüz belge yok.",
    SQ: "Nuk ka ende dokumente.",
    KU: "Hêj belge tune ne.",
  },
  previewInApp: {
    DE: "In App ansehen",
    EN: "View in app",
    IT: "Visualizza nell'app",
    TR: "Uygulamada göster",
    SQ: "Shiko në aplikacion",
    KU: "Di appê de bibîne",
  },
  shareOrSave: {
    DE: "Teilen / Sichern",
    EN: "Share / Save",
    IT: "Condividi / Salva",
    TR: "Paylaş / Kaydet",
    SQ: "Ndaj / Ruaj",
    KU: "Parve bike / Tomar bike",
  },
  document: {
    DE: "Dokument",
    EN: "Document",
    IT: "Documento",
    TR: "Belge",
    SQ: "Dokument",
    KU: "Belge",
  },
  noPreviewAvailable: {
    DE: "Keine Vorschau verfügbar.",
    EN: "No preview available.",
    IT: "Nessuna anteprima disponibile.",
    TR: "Önizleme mevcut değil.",
    SQ: "Nuk ka parashikim.",
    KU: "Pêşdîtin tune ye.",
  },
  internalAdminNoteInfo: {
    DE: "✅ Admin-Notiz wird nicht hier gespeichert — dafür gibt es separat “+ Notiz (Admin)” im Wochenplan.",
    EN: "✅ Admin note is not stored here — use the separate “+ Note (admin)” in the weekly plan.",
    IT: "✅ La nota admin non viene salvata qui — usa il separato “+ Nota (admin)” nel piano settimanale.",
    TR: "✅ Yönetici notu burada kaydedilmez — bunun için haftalık planda ayrı “+ Not (yönetici)” vardır.",
    SQ: "✅ Shënimi i adminit nuk ruhet këtu — për këtë përdor “+ Shënim (admin)” te plani javor.",
    KU: "✅ Nîşeya admin li vir nayê tomarkirin — ji bo vê yekê di plana hefteyî de “+ Nîşe (admin)” heye.",
  },
  pleaseSelectEmployee: {
    DE: "Bitte Mitarbeiter wählen.",
    EN: "Please select an employee.",
    IT: "Seleziona un dipendente.",
    TR: "Lütfen bir çalışan seçin.",
    SQ: "Ju lutem zgjidhni një punonjës.",
    KU: "Ji kerema xwe karmendek hilbijêre.",
  },
  pleaseSelectDate: {
    DE: "Bitte Datum wählen.",
    EN: "Please select a date.",
    IT: "Seleziona una data.",
    TR: "Lütfen bir tarih seçin.",
    SQ: "Ju lutem zgjidhni një datë.",
    KU: "Ji kerema xwe dîrokek hilbijêre.",
  },
  pleaseSelectStartEnd: {
    DE: "Bitte Start/Ende angeben.",
    EN: "Please provide start/end.",
    IT: "Indica inizio/fine.",
    TR: "Lütfen başlangıç/bitiş girin.",
    SQ: "Ju lutem jepni fillimin/fundin.",
    KU: "Ji kerema xwe destpêk/dawî binivîse.",
  },
  saveEntryFailed: {
    DE: "Speichern fehlgeschlagen:",
    EN: "Saving failed:",
    IT: "Salvataggio non riuscito:",
    TR: "Kaydetme başarısız oldu:",
    SQ: "Ruajtja dështoi:",
    KU: "Tomarkirin serneket:",
  },
  deleteEntryConfirm: {
    DE: "Plan-Eintrag wirklich löschen?",
    EN: "Really delete plan entry?",
    IT: "Eliminare davvero la voce del piano?",
    TR: "Plan kaydı gerçekten silinsin mi?",
    SQ: "Të fshihet vërtet hyrja e planit?",
    KU: "Tomara planê bi rastî were jêbirin?",
  },
  deleteEntryFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
  },
  saveNoteFailed: {
    DE: "Notiz speichern fehlgeschlagen:",
    EN: "Saving note failed:",
    IT: "Salvataggio nota non riuscito:",
    TR: "Not kaydedilemedi:",
    SQ: "Ruajtja e shënimit dështoi:",
    KU: "Tomarkirina nîşeyê serneket:",
  },
  deleteNoteConfirm: {
    DE: "Admin-Notiz wirklich löschen?",
    EN: "Really delete admin note?",
    IT: "Eliminare davvero la nota admin?",
    TR: "Yönetici notu gerçekten silinsin mi?",
    SQ: "Të fshihet vërtet shënimi i adminit?",
    KU: "Nîşeya admin bi rastî were jêbirin?",
  },
  deleteNoteFailed: {
    DE: "Notiz löschen fehlgeschlagen",
    EN: "Deleting note failed",
    IT: "Eliminazione nota non riuscita",
    TR: "Not silinemedi",
    SQ: "Fshirja e shënimit dështoi",
    KU: "Jêbirina nîşeyê serneket",
  },
  adminNoteEdit: {
    DE: "Admin-Notiz bearbeiten",
    EN: "Edit admin note",
    IT: "Modifica nota admin",
    TR: "Yönetici notunu düzenle",
    SQ: "Ndrysho shënimin e adminit",
    KU: "Nîşeya admin biguherîne",
  },
  adminNoteCreate: {
    DE: "Admin-Notiz anlegen",
    EN: "Create admin note",
    IT: "Crea nota admin",
    TR: "Yönetici notu oluştur",
    SQ: "Krijo shënim admini",
    KU: "Nîşeya admin biafirîne",
  },
  internalAdminNote: {
    DE: "Interne Admin-Notiz (nur für Admin)",
    EN: "Internal admin note (admin only)",
    IT: "Nota admin interna (solo admin)",
    TR: "Dahili yönetici notu (yalnızca yönetici)",
    SQ: "Shënim i brendshëm i adminit (vetëm për admin)",
    KU: "Nîşeya hundirîn a admin (tenê ji bo admin)",
  },
  internalAdminNoteHelp: {
    DE: "Bleibt intern und wird niemals an Mitarbeiter ausgeliefert.",
    EN: "Remains internal and is never shown to employees.",
    IT: "Rimane interna e non viene mai mostrata ai dipendenti.",
    TR: "Dahili kalır ve çalışanlara asla gösterilmez.",
    SQ: "Mbetet e brendshme dhe nuk u shfaqet kurrë punonjësve.",
    KU: "Hundirîn dimîne û qet ji karmendan re nayê nîşandan.",
  },
  employeeNotePrefix: {
    DE: "📝 MA:",
    EN: "📝 Emp:",
    IT: "📝 Dip:",
    TR: "📝 Çal:",
    SQ: "📝 Pun:",
    KU: "📝 Kar:",
  },
  editPlanEntryTitle: {
    DE: "Eintrag bearbeiten",
    EN: "Edit entry",
    IT: "Modifica voce",
    TR: "Kaydı düzenle",
    SQ: "Ndrysho hyrjen",
    KU: "Tomarê biguherîne",
  },
  createPlanEntryTitle: {
    DE: "Eintrag anlegen",
    EN: "Create entry",
    IT: "Crea voce",
    TR: "Kayıt oluştur",
    SQ: "Krijo hyrje",
    KU: "Tomar biafirîne",
  },
  editAdminNoteTitle: {
    DE: "Admin-Notiz bearbeiten",
    EN: "Edit admin note",
    IT: "Modifica nota admin",
    TR: "Yönetici notunu düzenle",
    SQ: "Ndrysho shënimin e adminit",
    KU: "Nîşeya admin biguherîne",
  },
  createAdminNoteTitle: {
    DE: "Admin-Notiz anlegen",
    EN: "Create admin note",
    IT: "Crea nota admin",
    TR: "Yönetici notu oluştur",
    SQ: "Krijo shënim admini",
    KU: "Nîşeya admin biafirîne",
  },
  monday: {
    DE: "Montag",
    EN: "Monday",
    IT: "Lunedì",
    TR: "Pazartesi",
    SQ: "E hënë",
    KU: "Duşem",
  },
  tuesday: {
    DE: "Dienstag",
    EN: "Tuesday",
    IT: "Martedì",
    TR: "Salı",
    SQ: "E martë",
    KU: "Sêşem",
  },
  wednesday: {
    DE: "Mittwoch",
    EN: "Wednesday",
    IT: "Mercoledì",
    TR: "Çarşamba",
    SQ: "E mërkurë",
    KU: "Çarşem",
  },
  thursday: {
    DE: "Donnerstag",
    EN: "Thursday",
    IT: "Giovedì",
    TR: "Perşembe",
    SQ: "E enjte",
    KU: "Pêncşem",
  },
  friday: {
    DE: "Freitag",
    EN: "Friday",
    IT: "Venerdì",
    TR: "Cuma",
    SQ: "E premte",
    KU: "În",
  },
  saturday: {
    DE: "Samstag",
    EN: "Saturday",
    IT: "Sabato",
    TR: "Cumartesi",
    SQ: "E shtunë",
    KU: "Şemî",
  },
  repairWork: {
    DE: "Rep. Arbeiten",
    EN: "Repair work",
    IT: "Lavori di riparazione",
    TR: "Tamir işleri",
    SQ: "Punë riparimi",
    KU: "Karên tamîrê",
  },
  subcontractors: {
    DE: "Subunternehmer",
    EN: "Subcontractors",
    IT: "Subappaltatori",
    TR: "Taşeronlar",
    SQ: "Nënkontraktorë",
    KU: "Binpeymanbar",
  },
  keepPrefixHint: {
    DE: "Lass den Prefix stehen, sonst erscheint es nicht in der Spezial-Zeile.",
    EN: "Keep the prefix, otherwise it will not appear in the special row.",
    IT: "Mantieni il prefisso, altrimenti non apparirà nella riga speciale.",
    TR: "Öneki bırakın, aksi halde özel satırda görünmez.",
    SQ: "Mbaje prefiksin, përndryshe nuk do të shfaqet në rreshtin special.",
    KU: "Pêşgirê bihêle, wekî din di rêza taybet de dernakeve.",
  },
};