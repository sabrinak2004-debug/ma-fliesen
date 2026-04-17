// src/lib/i18n.ts

export const APP_UI_LANGUAGES = ["DE", "EN", "IT", "TR", "SQ", "KU", "RO"] as const;

export type AppUiLanguage = (typeof APP_UI_LANGUAGES)[number];

export function isAppUiLanguage(value: unknown): value is AppUiLanguage {
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
    case "RO":  
      return "ro";
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
    case "RO":
      return "Română";
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

export type EmployeeAbsenceRequestsApiTextKey =
  | "notLoggedInWithPeriod"
  | "dateMustBeYmd"
  | "invalidAbsenceType"
  | "endBeforeStart"
  | "crossYearRequestsNotSupported"
  | "sickOnlyFullDayRequested"
  | "sickCannotBeRequestedUnpaid"
  | "halfDaysOnlyForVacation"
  | "halfVacationOnlySingleDateRequest"
  | "vacationNoWeekdays"
  | "approvedAbsenceAlreadyExists"
  | "pendingRequestAlreadyExists"
  | "newAbsenceRequestPushTitle";

export const EMPLOYEE_ABSENCE_REQUESTS_API_TEXTS: Record<
  EmployeeAbsenceRequestsApiTextKey,
  Record<AppUiLanguage, string>
> = {
  notLoggedInWithPeriod: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk je i identifikuar.",
    KU: "Têketin nehatiye kirin.",
    RO: "Nu ești autentificat.",
  },
  dateMustBeYmd: {
    DE: "Datum muss im Format JJJJ-MM-TT sein.",
    EN: "Date must be in YYYY-MM-DD format.",
    IT: "La data deve essere nel formato YYYY-MM-DD.",
    TR: "Tarih YYYY-MM-DD formatında olmalıdır.",
    SQ: "Data duhet të jetë në formatin YYYY-MM-DD.",
    KU: "Dîrok divê di formata YYYY-MM-DD de be.",
    RO: "Data trebuie să fie în formatul YYYY-MM-DD.",
  },
  invalidAbsenceType: {
    DE: "Ungültiger Abwesenheitstyp.",
    EN: "Invalid absence type.",
    IT: "Tipo di assenza non valido.",
    TR: "Geçersiz devamsızlık türü.",
    SQ: "Lloj i pavlefshëm mungese.",
    KU: "Cureya nebûnê nederbasdar e.",
    RO: "Tip de absență invalid.",
  },
  endBeforeStart: {
    DE: "Ende darf nicht vor Start liegen.",
    EN: "End must not be before start.",
    IT: "La fine non può essere prima dell'inizio.",
    TR: "Bitiş başlangıçtan önce olamaz.",
    SQ: "Mbarimi nuk mund të jetë para fillimit.",
    KU: "Dawî nikare berî destpêkê be.",
    RO: "Sfârșitul nu trebuie să fie înainte de început.",
  },
  crossYearRequestsNotSupported: {
    DE: "Jahresübergreifende Anträge werden aktuell noch nicht unterstützt.",
    EN: "Requests across calendar years are not supported yet.",
    IT: "Le richieste che coprono più anni non sono ancora supportate.",
    TR: "Yıllar arası talepler henüz desteklenmiyor.",
    SQ: "Kërkesat që përfshijnë disa vite kalendarike nuk mbështeten ende.",
    KU: "Daxwazên ku di navbera salan de ne hêj nayên piştgirîkirin.",
    RO: "Cererile care se întind pe mai mulți ani calendaristici nu sunt încă acceptate.",
  },
  sickOnlyFullDayRequested: {
    DE: "Krankheit kann nur ganztägig beantragt werden.",
    EN: "Sickness can only be requested as a full day.",
    IT: "La malattia può essere richiesta solo per l'intera giornata.",
    TR: "Hastalık sadece tam gün olarak talep edilebilir.",
    SQ: "Sëmundja mund të kërkohet vetëm për gjithë ditën.",
    KU: "Nexweşî tenê dikare wekî rojek tam were daxwaz kirin.",
    RO: "Boala poate fi solicitată doar ca zi întreagă.",
  },
  sickCannotBeRequestedUnpaid: {
    DE: "Krankheit darf nicht als unbezahlt beantragt werden.",
    EN: "Sickness must not be requested as unpaid.",
    IT: "La malattia non può essere richiesta come non retribuita.",
    TR: "Hastalık ücretsiz olarak talep edilemez.",
    SQ: "Sëmundja nuk mund të kërkohet si e papaguar.",
    KU: "Nexweşî nikare wekî bê mûçe were daxwaz kirin.",
    RO: "Boala nu poate fi solicitată ca neplătită.",
  },
  halfDaysOnlyForVacation: {
    DE: "Halbe Tage sind nur für Urlaub erlaubt.",
    EN: "Half days are only allowed for vacation.",
    IT: "I mezzi giorni sono consentiti solo per ferie.",
    TR: "Yarım gün sadece izin için kullanılabilir.",
    SQ: "Gjysmë ditët lejohen vetëm për pushim.",
    KU: "Nîv roj tenê ji bo bêhnvedanê tên destûrkirin.",
    RO: "Jumătățile de zi sunt permise doar pentru concediu.",
  },
  halfVacationOnlySingleDateRequest: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden.",
    EN: "A half vacation day may only be requested for exactly one date.",
    IT: "Una mezza giornata di ferie può essere richiesta solo per una sola data.",
    TR: "Yarım gün izin yalnızca tek bir tarih için talep edilebilir.",
    SQ: "Një gjysmë dite pushimi mund të kërkohet vetëm për një datë të vetme.",
    KU: "Nîv roj bêhnvedanê tenê ji bo tenê yek dîrokê dikare were daxwaz kirin.",
    RO: "O jumătate de zi de concediu poate fi solicitată doar pentru o singură dată.",
  },
  vacationNoWeekdays: {
    DE: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
    EN: "There are no workdays for vacation in the selected period. Weekends are automatically excluded.",
    IT: "Nel periodo selezionato non ci sono giorni lavorativi per ferie. I fine settimana vengono esclusi automaticamente.",
    TR: "Seçilen aralıkta izin için iş günü yok. Hafta sonları otomatik olarak hariç tutulur.",
    SQ: "Në periudhën e zgjedhur nuk ka ditë pune për pushim. Fundjavat përjashtohen automatikisht.",
    KU: "Di navbera hilbijartî de rojên karê ji bo bêhnvedanê tune ne. Dawiya hefteyê bixweber nayê hesibandin.",
    RO: "Nu există zile lucrătoare pentru concediu în perioada selectată. Zilele de weekend sunt excluse automat.",
  },
  approvedAbsenceAlreadyExists: {
    DE: "Im gewählten Zeitraum existiert bereits eine bestätigte Abwesenheit.",
    EN: "A confirmed absence already exists in the selected period.",
    IT: "Nel periodo selezionato esiste già un'assenza confermata.",
    TR: "Seçilen dönemde zaten onaylanmış bir devamsızlık var.",
    SQ: "Në periudhën e zgjedhur ekziston tashmë një mungesë e konfirmuar.",
    KU: "Di navbera hilbijartî de jixwe nebûnek pejirandî heye.",
    RO: "Există deja o absență confirmată în perioada selectată.",
  },
  pendingRequestAlreadyExists: {
    DE: "Im gewählten Zeitraum existiert bereits ein offener Antrag.",
    EN: "An open request already exists in the selected period.",
    IT: "Nel periodo selezionato esiste già una richiesta aperta.",
    TR: "Seçilen dönemde zaten açık bir talep var.",
    SQ: "Në periudhën e zgjedhur ekziston tashmë një kërkesë e hapur.",
    KU: "Di navbera hilbijartî de jixwe daxwazek vekirî heye.",
    RO: "Există deja o cerere deschisă în perioada selectată.",
  },
  newAbsenceRequestPushTitle: {
    DE: "Neuer Abwesenheitsantrag",
    EN: "New absence request",
    IT: "Nuova richiesta di assenza",
    TR: "Yeni devamsızlık talebi",
    SQ: "Kërkesë e re për mungesë",
    KU: "Daxwaza nebûnê ya nû",
    RO: "Cerere nouă de absență",
  },
};

export type AdminAbsenceRequestsApiTextKey =
  | "missingRequestId"
  | "requestNotFound"
  | "employeeInactive"
  | "onlyPendingCanBeApproved"
  | "onlyPendingCanBeRejected"
  | "endBeforeStart"
  | "crossYearApprovalNotSupported"
  | "halfDaysOnlyForVacation"
  | "approvedAbsenceAlreadyExists"
  | "vacationNoWeekdays"
  | "approvedPushTitle"
  | "approvedPushBody"
  | "rejectedPushTitle"
  | "rejectedPushBody"
  | "vacationRequestLabel"
  | "sickRequestLabel"
  | "paid"
  | "unpaid"
  | "halfVacationDayOn"
  | "fromTo";


export type AdminAbsenceRequestPushTextKey =
  | "typeVacation"
  | "typeSick"
  | "scopeHalfDay"
  | "compensationPaid"
  | "compensationUnpaid";

export const ADMIN_ABSENCE_REQUESTS_API_TEXTS: Record<
  AdminAbsenceRequestsApiTextKey,
  Record<AppUiLanguage, string>
> = {
  missingRequestId: {
    DE: "Fehlende Request-ID.",
    EN: "Missing request ID.",
    IT: "ID richiesta mancante.",
    TR: "Eksik talep kimliği.",
    SQ: "Mungon ID-ja e kërkesës.",
    KU: "Nasnameya daxwazê tune ye.",
    RO: "Lipsește ID-ul cererii.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
    RO: "Cererea nu a fost găsită.",
  },
  employeeInactive: {
    DE: "Mitarbeiter ist nicht aktiv.",
    EN: "Employee is not active.",
    IT: "Il dipendente non è attivo.",
    TR: "Çalışan aktif değil.",
    SQ: "Punonjësi nuk është aktiv.",
    KU: "Karmend çalak nîne.",
    RO: "Angajatul nu este activ.",
  },
  onlyPendingCanBeApproved: {
    DE: "Nur offene Anträge können genehmigt werden.",
    EN: "Only open requests can be approved.",
    IT: "Solo le richieste aperte possono essere approvate.",
    TR: "Sadece açık talepler onaylanabilir.",
    SQ: "Vetëm kërkesat e hapura mund të miratohen.",
    KU: "Tenê daxwazên vekirî dikarin bêne pejirandin.",
    RO: "Doar cererile deschise pot fi aprobate.",
  },
  onlyPendingCanBeRejected: {
    DE: "Nur offene Anträge können abgelehnt werden.",
    EN: "Only open requests can be rejected.",
    IT: "Solo le richieste aperte possono essere rifiutate.",
    TR: "Sadece açık talepler reddedilebilir.",
    SQ: "Vetëm kërkesat e hapura mund të refuzohen.",
    KU: "Tenê daxwazên vekirî dikarin bêne redkirin.",
    RO: "Doar cererile deschise pot fi respinse.",
  },
  endBeforeStart: {
    DE: "Ende darf nicht vor Start liegen.",
    EN: "End must not be before start.",
    IT: "La fine non può essere prima dell'inizio.",
    TR: "Bitiş başlangıçtan önce olamaz.",
    SQ: "Mbarimi nuk mund të jetë para fillimit.",
    KU: "Dawî nikare berî destpêkê be.",
    RO: "Sfârșitul nu trebuie să fie înainte de început.",
  },
  crossYearApprovalNotSupported: {
    DE: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr separat genehmigen.",
    EN: "Absences across calendar years are not supported yet. Please approve them separately for each calendar year.",
    IT: "Le assenze che coprono più anni non sono ancora supportate. Approvale separatamente per ogni anno solare.",
    TR: "Yıllar arası devamsızlıklar henüz desteklenmiyor. Lütfen her takvim yılı için ayrı ayrı onaylayın.",
    SQ: "Mungesat që përfshijnë disa vite kalendarike nuk mbështeten ende. Ju lutem miratojini veçmas për çdo vit kalendarik.",
    KU: "Nebûnên ku di navbera salan de ne hêj nayên piştgirîkirin. Ji kerema xwe wan ji bo her sala salnameyê cuda pejirîne.",
    RO: "Absențele care se întind pe mai mulți ani calendaristici nu sunt încă acceptate. Te rugăm să le aprobi separat pentru fiecare an calendaristic.",
  },
  halfDaysOnlyForVacation: {
    DE: "Halbe Tage sind nur für Urlaub erlaubt.",
    EN: "Half days are only allowed for vacation.",
    IT: "I mezzi giorni sono consentiti solo per ferie.",
    TR: "Yarım gün sadece izin için kullanılabilir.",
    SQ: "Gjysmë ditët lejohen vetëm për pushim.",
    KU: "Nîv roj tenê ji bo bêhnvedanê tên destûrkirin.",
    RO: "Jumătățile de zi sunt permise doar pentru concediu.",
  },
  approvedAbsenceAlreadyExists: {
    DE: "Im Zeitraum existiert bereits eine bestätigte Abwesenheit.",
    EN: "A confirmed absence already exists in this period.",
    IT: "Esiste già un'assenza confermata in questo periodo.",
    TR: "Bu dönemde zaten onaylanmış bir devamsızlık var.",
    SQ: "Në këtë periudhë ekziston tashmë një mungesë e konfirmuar.",
    KU: "Di vê navberê de jixwe nebûnek pejirandî heye.",
    RO: "Există deja o absență confirmată în această perioadă.",
  },
  vacationNoWeekdays: {
    DE: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
    EN: "There are no workdays for vacation in the selected period. Weekends are automatically excluded.",
    IT: "Nel periodo selezionato non ci sono giorni lavorativi per ferie. I fine settimana vengono esclusi automaticamente.",
    TR: "Seçilen aralıkta izin için iş günü yok. Hafta sonları otomatik olarak hariç tutulur.",
    SQ: "Në periudhën e zgjedhur nuk ka ditë pune për pushim. Fundjavat përjashtohen automatikisht.",
    KU: "Di navbera hilbijartî de rojên karê ji bo bêhnvedanê tune ne. Dawiya hefteyê bixweber nayê hesibandin.",
    RO: "Nu există zile lucrătoare pentru concediu în perioada selectată. Zilele de weekend sunt excluse automat.",
  },
  approvedPushTitle: {
    DE: "Antrag genehmigt",
    EN: "Request approved",
    IT: "Richiesta approvata",
    TR: "Talep onaylandı",
    SQ: "Kërkesa u miratua",
    KU: "Daxwaz hate pejirandin",
    RO: "Cerere aprobată",
  },
  approvedPushBody: {
    DE: "Dein {type} wurde genehmigt ({dateLabel}, {compensationLabel}).",
    EN: "Your {type} was approved ({dateLabel}, {compensationLabel}).",
    IT: "La tua {type} è stata approvata ({dateLabel}, {compensationLabel}).",
    TR: "{type} talebiniz onaylandı ({dateLabel}, {compensationLabel}).",
    SQ: "{type} juaj u miratua ({dateLabel}, {compensationLabel}).",
    KU: "{type} a te hate pejirandin ({dateLabel}, {compensationLabel}).",
    RO: "{type} tău a fost aprobat ({dateLabel}, {compensationLabel}).",
  },
  rejectedPushTitle: {
    DE: "Antrag abgelehnt",
    EN: "Request rejected",
    IT: "Richiesta rifiutata",
    TR: "Talep reddedildi",
    SQ: "Kërkesa u refuzua",
    KU: "Daxwaz hate redkirin",
    RO: "Cerere respinsă",
  },
  rejectedPushBody: {
    DE: "Dein {type} wurde abgelehnt.",
    EN: "Your {type} was rejected.",
    IT: "La tua {type} è stata rifiutata.",
    TR: "{type} talebiniz reddedildi.",
    SQ: "{type} juaj u refuzua.",
    KU: "{type} a te hate redkirin.",
    RO: "{type} tău a fost respins.",
  },
  vacationRequestLabel: {
    DE: "Urlaubsantrag",
    EN: "vacation request",
    IT: "richiesta ferie",
    TR: "izin talebi",
    SQ: "kërkesë pushimi",
    KU: "daxwaza bêhnvedanê",
    RO: "cerere de concediu",
  },
  sickRequestLabel: {
    DE: "Krankheitsantrag",
    EN: "sickness request",
    IT: "richiesta di malattia",
    TR: "hastalık talebi",
    SQ: "kërkesë sëmundjeje",
    KU: "daxwaza nexweşiyê",
    RO: "cerere de boală",
  },
  paid: {
    DE: "bezahlt",
    EN: "paid",
    IT: "retribuito",
    TR: "ücretli",
    SQ: "i paguar",
    KU: "bi mûçe",
    RO: "plătit",
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
  halfVacationDayOn: {
    DE: "halber Urlaubstag am {date}",
    EN: "half vacation day on {date}",
    IT: "mezza giornata di ferie il {date}",
    TR: "{date} tarihinde yarım gün izin",
    SQ: "gjysmë dite pushimi më {date}",
    KU: "nîv roj bêhnvedanê di {date} de",
    RO: "jumătate de zi de concediu pe {date}",
  },
  fromTo: {
    DE: "{startDate} bis {endDate}",
    EN: "{startDate} to {endDate}",
    IT: "dal {startDate} al {endDate}",
    TR: "{startDate} - {endDate}",
    SQ: "{startDate} deri më {endDate}",
    KU: "ji {startDate} heta {endDate}",
    RO: "de la {startDate} până la {endDate}",
  },
};

export const ADMIN_ABSENCE_REQUEST_PUSH_TEXTS: Record<
  AdminAbsenceRequestPushTextKey,
  Record<AppUiLanguage, string>
> = {
  typeVacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Betlane",
    RO: "Concediu",
  },
  typeSick: {
    DE: "Krankheit",
    EN: "Sickness",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmundje",
    KU: "Nexweşî",
    RO: "Boală",
  },
  scopeHalfDay: {
    DE: "Halber Tag",
    EN: "Half day",
    IT: "Mezza giornata",
    TR: "Yarım gün",
    SQ: "Gjysmë dite",
    KU: "Nîv roj",
    RO: "Jumătate de zi",
  },
  compensationPaid: {
    DE: "Bezahlt",
    EN: "Paid",
    IT: "Pagata",
    TR: "Ücretli",
    SQ: "E paguar",
    KU: "Bi pere",
    RO: "Plătit",
  },
  compensationUnpaid: {
    DE: "Unbezahlt",
    EN: "Unpaid",
    IT: "Non pagata",
    TR: "Ücretsiz",
    SQ: "E papaguar",
    KU: "Bêpere",
    RO: "Neplătit",
  },
};

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
    RO: "Neautentificat.",
  },
  employeeOnlyCreate: {
    DE: "Nur Mitarbeiter können Nachtragsanträge stellen.",
    EN: "Only employees can submit correction requests.",
    IT: "Solo i dipendenti possono inviare richieste di correzione.",
    TR: "Yalnızca çalışanlar düzeltme talebi oluşturabilir.",
    SQ: "Vetëm punonjësit mund të paraqesin kërkesa për korrigjim.",
    KU: "Tenê karmend dikarin daxwaza rastkirinê bişînin.",
    RO: "Doar angajații pot trimite cereri de corecție.",
  },
  invalidTargetDate: {
    DE: "targetDate muss YYYY-MM-DD sein.",
    EN: "targetDate must be in YYYY-MM-DD format.",
    IT: "targetDate deve essere nel formato YYYY-MM-DD.",
    TR: "targetDate YYYY-MM-DD formatında olmalıdır.",
    SQ: "targetDate duhet të jetë në formatin YYYY-MM-DD.",
    KU: "targetDate divê di formatê YYYY-MM-DD de be.",
    RO: "targetDate trebuie să fie în formatul YYYY-MM-DD.",
  },
  pastDaysOnly: {
    DE: "Ein Nachtragsantrag ist nur für vergangene Tage möglich.",
    EN: "A correction request is only possible for past days.",
    IT: "Una richiesta di correzione è possibile solo per giorni passati.",
    TR: "Düzeltme talebi yalnızca geçmiş günler için mümkündür.",
    SQ: "Një kërkesë për korrigjim është e mundur vetëm për ditët e kaluara.",
    KU: "Daxwaza rastkirinê tenê ji bo rojên borî gengaz e.",
    RO: "O cerere de corecție este posibilă doar pentru zilele trecute.",
  },
  noLockedMissingEntries: {
    DE: "Aktuell gibt es keine gesperrten fehlenden Arbeitseinträge.",
    EN: "There are currently no locked missing work entries.",
    IT: "Attualmente non ci sono registrazioni di lavoro mancanti bloccate.",
    TR: "Şu anda kilitli eksik çalışma kayıtları yok.",
    SQ: "Aktualisht nuk ka hyrje pune të munguara të bllokuara.",
    KU: "Niha qeydkirinên karê winda yên girtî tune ne.",
    RO: "În prezent nu există înregistrări de muncă lipsă blocate.",
  },
  requestNotRequiredForDate: {
    DE: "Für dieses Datum ist aktuell noch kein Nachtragsantrag erforderlich oder das Datum gehört nicht zu den gesperrten fehlenden Arbeitstagen.",
    EN: "No correction request is currently required for this date, or the date is not part of the locked missing workdays.",
    IT: "Per questa data al momento non è richiesta alcuna richiesta di correzione oppure la data non rientra tra i giorni lavorativi mancanti bloccati.",
    TR: "Bu tarih için şu anda bir düzeltme talebi gerekmiyor veya tarih kilitli eksik iş günleri arasında yer almıyor.",
    SQ: "Për këtë datë aktualisht nuk kërkohet ende një kërkesë për korrigjim ose data nuk bën pjesë në ditët e bllokuara me mungesë hyrjeje pune.",
    KU: "Ji bo vê dîrokê niha daxwaza rastkirinê ne pêwîst e an jî ev dîrok di nav rojên karê winda yên girtî de nayê.",
    RO: "Pentru această dată nu este necesară în prezent o cerere de corecție sau data nu face parte din zilele lucrătoare lipsă blocate.",
  },
  existingPendingForPeriod: {
    DE: "Für diesen Zeitraum existiert bereits ein offener Nachtragsantrag.",
    EN: "An open correction request already exists for this period.",
    IT: "Esiste già una richiesta di correzione aperta per questo periodo.",
    TR: "Bu dönem için zaten açık bir düzeltme talebi mevcut.",
    SQ: "Për këtë periudhë ekziston tashmë një kërkesë e hapur për korrigjim.",
    KU: "Ji bo vê demê jixwe daxwazek rastkirinê ya vekirî heye.",
    RO: "O cerere de corecție deschisă există deja pentru această perioadă.",
  },
  invalidWorkDate: {
    DE: "workDate muss YYYY-MM-DD sein.",
    EN: "workDate must be in YYYY-MM-DD format.",
    IT: "workDate deve essere nel formato YYYY-MM-DD.",
    TR: "workDate YYYY-MM-DD formatında olmalıdır.",
    SQ: "workDate duhet të jetë në formatin YYYY-MM-DD.",
    KU: "workDate divê di formatê YYYY-MM-DD de be.",
    RO: "workDate trebuie să fie în formatul YYYY-MM-DD.",
  },
  missingRequestId: {
    DE: "Fehlende Request-ID.",
    EN: "Missing request ID.",
    IT: "ID richiesta mancante.",
    TR: "İstek kimliği eksik.",
    SQ: "Mungon ID-ja e kërkesës.",
    KU: "Nasnameya daxwazê kêm e.",
    RO: "ID-ul cererii lipsește.",
  },
  correctionRequestNotFound: {
    DE: "Nachtragsanfrage nicht gefunden.",
    EN: "Correction request not found.",
    IT: "Richiesta di correzione non trovata.",
    TR: "Düzeltme talebi bulunamadı.",
    SQ: "Kërkesa për korrigjim nuk u gjet.",
    KU: "Daxwaza rastkirinê nehat dîtin.",
    RO: "Cererea de corecție nu a fost găsită.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
    RO: "Cererea nu a fost găsită.",
  },
  employeeInactive: {
    DE: "Mitarbeiter ist nicht aktiv.",
    EN: "Employee is not active.",
    IT: "Il dipendente non è attivo.",
    TR: "Çalışan aktif değil.",
    SQ: "Punonjësi nuk është aktiv.",
    KU: "Karmend çalak nîne.",
    RO: "Angajatul nu este activ.",
  },
  onlyPendingCanBeApproved: {
    DE: "Nur offene Anträge können genehmigt werden.",
    EN: "Only open requests can be approved.",
    IT: "Solo le richieste aperte possono essere approvate.",
    TR: "Yalnızca açık talepler onaylanabilir.",
    SQ: "Vetëm kërkesat e hapura mund të miratohen.",
    KU: "Tenê daxwazên vekirî dikarin bêne pejirandin.",
    RO: "Doar cererile deschise pot fi aprobate.",
  },
  onlyPendingCanBeRejected: {
    DE: "Nur offene Anträge können abgelehnt werden.",
    EN: "Only open requests can be rejected.",
    IT: "Solo le richieste aperte possono essere rifiutate.",
    TR: "Yalnızca açık talepler reddedilebilir.",
    SQ: "Vetëm kërkesat e hapura mund të refuzohen.",
    KU: "Tenê daxwazên vekirî dikarin bêne redkirin.",
    RO: "Doar cererile deschise pot fi respinse.",
  },
  newCorrectionRequestPushTitle: {
    DE: "Neuer Nachtragsantrag",
    EN: "New correction request",
    IT: "Nuova richiesta di correzione",
    TR: "Yeni düzeltme talebi",
    SQ: "Kërkesë e re për korrigjim",
    KU: "Daxwaza rastkirinê ya nû",
    RO: "Cerere de corecție nouă",
  },
  newCorrectionRequestPushBody: {
    DE: "{name} hat einen Nachtragsantrag für {dateLabel} gestellt.",
    EN: "{name} submitted a correction request for {dateLabel}.",
    IT: "{name} ha inviato una richiesta di correzione per {dateLabel}.",
    TR: "{name}, {dateLabel} için bir düzeltme talebi gönderdi.",
    SQ: "{name} paraqiti një kërkesë për korrigjim për {dateLabel}.",
    KU: "{name} ji bo {dateLabel} daxwaza rastkirinê şand.",
    RO: "{name} a trimis o cerere de corecție pentru {dateLabel}.",
  },
  approvedPushTitle: {
    DE: "Nachtragsantrag genehmigt",
    EN: "Correction request approved",
    IT: "Richiesta di correzione approvata",
    TR: "Düzeltme talebi onaylandı",
    SQ: "Kërkesa për korrigjim u miratua",
    KU: "Daxwaza rastkirinê hate pejirandin",
    RO: "Cerere de corecție aprobată",
  },
  approvedPushBody: {
    DE: "Dein Nachtragsantrag wurde genehmigt ({dateLabel}).",
    EN: "Your correction request was approved ({dateLabel}).",
    IT: "La tua richiesta di correzione è stata approvata ({dateLabel}).",
    TR: "Düzeltme talebin onaylandı ({dateLabel}).",
    SQ: "Kërkesa jote për korrigjim u miratua ({dateLabel}).",
    KU: "Daxwaza te ya rastkirinê hate pejirandin ({dateLabel}).",
    RO: "Cererea ta de corecție a fost aprobată ({dateLabel}).",
  },
  rejectedPushTitle: {
    DE: "Nachtragsantrag abgelehnt",
    EN: "Correction request rejected",
    IT: "Richiesta di correzione rifiutata",
    TR: "Düzeltme talebi reddedildi",
    SQ: "Kërkesa për korrigjim u refuzua",
    KU: "Daxwaza rastkirinê hate redkirin",
    RO: "Cerere de corecție respinsă",
  },
  rejectedPushBody: {
    DE: "Dein Nachtragsantrag wurde abgelehnt.",
    EN: "Your correction request was rejected.",
    IT: "La tua richiesta di correzione è stata rifiutata.",
    TR: "Düzeltme talebin reddedildi.",
    SQ: "Kërkesa jote për korrigjim u refuzua.",
    KU: "Daxwaza te ya rastkirinê hate redkirin.",
    RO: "Cererea ta de corecție a fost respinsă.",
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
    RO: "Înapoi",
  },
  privacyTitle: {
    DE: "Datenschutzerklärung",
    EN: "Privacy Policy",
    IT: "Informativa sulla Privacy",
    TR: "Gizlilik Politikası",
    SQ: "Politika e Privatësisë",
    KU: "Polîtîkaya Nepenîtiyê",
    RO: "Politica de confidențialitate",
  },
  privacyUpdated: {
    DE: "Letzte Aktualisierung: 30.03.2026",
    EN: "Last updated: 2026-03-30",
    IT: "Ultimo aggiornamento: 30.03.2026",
    TR: "Son güncelleme: 30.03.2026",
    SQ: "Përditësimi i fundit: 30.03.2026",
    KU: "Dawiya nûkirinê: 30.03.2026",
    RO: "Ultima actualizare: 30.03.2026",
  },
  termsTitle: {
    DE: "Nutzungsbedingungen",
    EN: "Terms of Use",
    IT: "Termini di Utilizzo",
    TR: "Kullanım Koşulları",
    SQ: "Kushtet e Përdorimit",
    KU: "Mercên Bikaranînê",
    RO: "Termeni de utilizare",
  },
  termsUpdated: {
    DE: "Letzte Aktualisierung: 30.03.2026",
    EN: "Last updated: 2026-03-30",
    IT: "Ultimo aggiornamento: 30.03.2026",
    TR: "Son güncelleme: 30.03.2026",
    SQ: "Përditësimi i fundit: 30.03.2026",
    KU: "Dawiya nûkirinê: 30.03.2026",
    RO: "Ultima actualizare: 30.03.2026",
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
    RO: "Răspuns neașteptat.",
  },
  weekShortMon: {
    DE: "Mo",
    EN: "Mon",
    IT: "Lun",
    TR: "Pzt",
    SQ: "Hën",
    KU: "Dş",
    RO: "Lun",
  },
  weekShortTue: {
    DE: "Di",
    EN: "Tue",
    IT: "Mar",
    TR: "Sal",
    SQ: "Mar",
    KU: "Sê",
    RO: "Mar",
  },
  weekShortWed: {
    DE: "Mi",
    EN: "Wed",
    IT: "Mer",
    TR: "Çar",
    SQ: "Mër",
    KU: "Çr",
    RO: "Mie",
  },
  weekShortThu: {
    DE: "Do",
    EN: "Thu",
    IT: "Gio",
    TR: "Per",
    SQ: "Enj",
    KU: "Pnc",
    RO: "Joi",
  },
  weekShortFri: {
    DE: "Fr",
    EN: "Fri",
    IT: "Ven",
    TR: "Cum",
    SQ: "Pre",
    KU: "În",
    RO: "Vin",
  },
  weekShortSat: {
    DE: "Sa",
    EN: "Sat",
    IT: "Sab",
    TR: "Cmt",
    SQ: "Sht",
    KU: "Şem",
    RO: "Sâm",
  },
  weekShortSun: {
    DE: "So",
    EN: "Sun",
    IT: "Dom",
    TR: "Paz",
    SQ: "Die",
    KU: "Yek",
    RO: "Dum",
  },
  calendarWeekLabel: {
    DE: "KW",
    EN: "CW",
    IT: "Sett.",
    TR: "HF",
    SQ: "JV",
    KU: "HJ",
    RO: "Săpt.",
  },
  loadingAbsencesRequests: {
    DE: "Abwesenheiten/Anträge laden…",
    EN: "Loading absences/requests…",
    IT: "Caricamento assenze/richieste…",
    TR: "Devamsızlıklar/talepler yükleniyor…",
    SQ: "Mungesat/kërkesat po ngarkohen…",
    KU: "Nebûn/daxwaz têne barkirin…",
    RO: "Se încarcă absențe/cereri…",
  },
  for: {
    DE: "für",
    EN: "for",
    IT: "per",
    TR: "için",
    SQ: "për",
    KU: "ji bo",
    RO: "pentru",
  },
  selectDate: {
    DE: "Datum auswählen.",
    EN: "Please select a date.",
    IT: "Seleziona una data.",
    TR: "Lütfen bir tarih seçin.",
    SQ: "Ju lutem zgjidhni një datë.",
    KU: "Ji kerema xwe dîrokek hilbijêre.",
    RO: "Vă rugăm să selectați o dată.",
  },
  pleaseEnterTitle: {
    DE: "Bitte Titel eingeben.",
    EN: "Please enter a title.",
    IT: "Inserisci un titolo.",
    TR: "Lütfen bir başlık girin.",
    SQ: "Ju lutem shkruani një titull.",
    KU: "Ji kerema xwe sernavek binivîse.",
    RO: "Vă rugăm să introduceți un titlu.",
  },
  timeMustBeHHMM: {
    DE: "Start/Ende muss HH:MM sein.",
    EN: "Start/end must be HH:MM.",
    IT: "Inizio/fine deve essere HH:MM.",
    TR: "Başlangıç/bitiş HH:MM olmalı.",
    SQ: "Fillimi/fundi duhet të jetë HH:MM.",
    KU: "Destpêk/dawî divê HH:MM be.",
    RO: "Început/sfârșit trebuie să fie HH:MM.",
  },
  savingFailed: {
    DE: "Speichern fehlgeschlagen.",
    EN: "Saving failed.",
    IT: "Salvataggio non riuscito.",
    TR: "Kaydetme başarısız oldu.",
    SQ: "Ruajtja dështoi.",
    KU: "Tomarkirin têk çû.",
    RO: "Salvarea a eșuat.",
  },
  deletingFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Deleting failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin têk çû.",
    RO: "Ștergerea a eșuat.",
  },
  networkDeleteError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Di jêbirinê de çewtiya torê.",
    RO: "Eroare de rețea la ștergere.",
  },
  employeePlanCouldNotBeLoaded: {
    DE: "Plan des Mitarbeiters konnte nicht geladen werden.",
    EN: "Employee schedule could not be loaded.",
    IT: "Impossibile caricare il piano del dipendente.",
    TR: "Çalışan planı yüklenemedi.",
    SQ: "Plani i punonjësit nuk mund të ngarkohej.",
    KU: "Plana karmend nehat barkirin.",
    RO: "Planul angajatului nu a putut fi încărcat.",
  },
  planCouldNotBeLoaded: {
    DE: "Plan konnte nicht geladen werden.",
    EN: "Schedule could not be loaded.",
    IT: "Impossibile caricare il piano.",
    TR: "Plan yüklenemedi.",
    SQ: "Plani nuk mund të ngarkohej.",
    KU: "Plan nehat barkirin.",
    RO: "Planul nu a putut fi încărcat.",
  },
  networkPlanLoadError: {
    DE: "Netzwerkfehler beim Laden des Plans.",
    EN: "Network error while loading the schedule.",
    IT: "Errore di rete durante il caricamento del piano.",
    TR: "Plan yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të planit.",
    KU: "Di barkirina planê de çewtiya torê.",
    RO: "Eroare de rețea la încărcarea planului.",
  },
  networkEmployeePlanLoadError: {
    DE: "Netzwerkfehler beim Laden des Mitarbeiter-Plans.",
    EN: "Network error while loading the employee schedule.",
    IT: "Errore di rete durante il caricamento del piano del dipendente.",
    TR: "Çalışan planı yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të planit të punonjësit.",
    KU: "Di barkirina plana karmend de çewtiya torê.",
    RO: "Eroare de rețea la încărcarea planului angajatului.",
  },
  appointmentsCouldNotBeLoaded: {
    DE: "Termine konnten nicht geladen werden.",
    EN: "Appointments could not be loaded.",
    IT: "Impossibile caricare gli appuntamenti.",
    TR: "Randevular yüklenemedi.",
    SQ: "Takimet nuk mund të ngarkoheshin.",
    KU: "Hevdîtin nehatin barkirin.",
    RO: "Programările nu au putut fi încărcate.",
  },
  networkAppointmentsLoadError: {
    DE: "Netzwerkfehler beim Laden der Termine.",
    EN: "Network error while loading appointments.",
    IT: "Errore di rete durante il caricamento degli appuntamenti.",
    TR: "Randevular yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të takimeve.",
    KU: "Di barkirina hevdîtinan de çewtiya torê.",
    RO: "Eroare de rețea la încărcarea programărilor.",
  },
  planEntriesUnauthorized: {
    DE: "Nicht autorisiert.",
    EN: "Not authorized.",
    IT: "Non autorizzato.",
    TR: "Yetkiniz yok.",
    SQ: "I paautorizuar.",
    KU: "Destûr tune ye.",
    RO: "Neautorizat.",
  },
  planEntriesForbidden: {
    DE: "Kein Zugriff auf den Plan.",
    EN: "No access to the schedule.",
    IT: "Nessun accesso al piano.",
    TR: "Plana erişim yok.",
    SQ: "Nuk ka qasje në plan.",
    KU: "Gihîştin bi planê tune ye.",
    RO: "Fără acces la program.",
  },
  planEntriesFromToMissing: {
    DE: "Start- oder Enddatum fehlt.",
    EN: "Start or end date is missing.",
    IT: "Manca la data di inizio o di fine.",
    TR: "Başlangıç veya bitiş tarihi eksik.",
    SQ: "Mungon data e fillimit ose e mbarimit.",
    KU: "Dîroka destpêkê an dawiyê tune ye.",
    RO: "Data de început sau de sfârșit lipsește.",
  },
  planEntriesEmployeeNotFound: {
    DE: "Mitarbeiter wurde nicht gefunden.",
    EN: "Employee was not found.",
    IT: "Dipendente non trovato.",
    TR: "Çalışan bulunamadı.",
    SQ: "Punonjësi nuk u gjet.",
    KU: "Karmend nehat dîtin.",
    RO: "Angajatul nu a fost găsit.",
  },
  publicHolidayDefault: {
    DE: "Gesetzlicher Feiertag",
    EN: "Public holiday",
    IT: "Festività legale",
    TR: "Resmî tatil",
    SQ: "Festë zyrtare",
    KU: "Cejna fermî",
    RO: "Sărbătoare legală",
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
  dayLabel: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zi",
  },
  vacationConfirmedSingleDay: {
    DE: "🌴 Urlaub ({date})",
    EN: "🌴 Vacation ({date})",
    IT: "🌴 Ferie ({date})",
    TR: "🌴 İzin ({date})",
    SQ: "🌴 Pushim ({date})",
    KU: "🌴 Bêhnvedan ({date})",
    RO: "🌴 Vacanță ({date})",
  },
  sickConfirmedHalfDay: {
    DE: "🤒 Krank (0,5 Tag)",
    EN: "🤒 Sick (0.5 day)",
    IT: "🤒 Malattia (0,5 giorno)",
    TR: "🤒 Hasta (0,5 gün)",
    SQ: "🤒 I sëmurë (0,5 ditë)",
    KU: "🤒 Nexweş (0.5 roj)",
    RO: "🤒 Bolnav (0,5 zi)",
  },
  sickConfirmedFullDay: {
    DE: "🤒 Krank (1 Tag)",
    EN: "🤒 Sick (1 day)",
    IT: "🤒 Malattia (1 giorno)",
    TR: "🤒 Hasta (1 gün)",
    SQ: "🤒 I sëmurë (1 ditë)",
    KU: "🤒 Nexweş (1 roj)",
    RO: "🤒 Bolnav (1 zi)",
  },
  statusOpen: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "Hapur",
    KU: "Vekirî",
    RO: "Deschis",
  },
  statusApproved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvata",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobat",
  },
  statusRejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutata",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respins",
  },
  paid: {
    DE: "Bezahlt",
    EN: "Paid",
    IT: "Pagato",
    TR: "Ücretli",
    SQ: "I paguar",
    KU: "Bi mûçe",
    RO: "Plătit",
  },
  unpaid: {
    DE: "Unbezahlt",
    EN: "Unpaid",
    IT: "Non retribuito",
    TR: "Ücretsiz",
    SQ: "I papaguar",
    KU: "Bê mûçe",
    RO: "Neplătit",
  },
  daysPaidDaysUnpaid: {
    DE: "{paid} Tage bezahlt · {unpaid} Tage unbezahlt",
    EN: "{paid} days paid · {unpaid} days unpaid",
    IT: "{paid} giorni pagati · {unpaid} giorni non retribuiti",
    TR: "{paid} gün ücretli · {unpaid} gün ücretsiz",
    SQ: "{paid} ditë të paguara · {unpaid} ditë të papaguara",
    KU: "{paid} roj bi mûçe · {unpaid} roj bê mûçe",
    RO: "{paid} zile plătite · {unpaid} zile neplătite",
  },
  ofWhichPaidUnpaid: {
    DE: "Davon {paid} Tage bezahlt und {unpaid} Tage unbezahlt.",
    EN: "Of which {paid} days paid and {unpaid} days unpaid.",
    IT: "Di cui {paid} giorni pagati e {unpaid} giorni non retribuiti.",
    TR: "Bunun {paid} günü ücretli ve {unpaid} günü ücretsiz.",
    SQ: "Prej tyre {paid} ditë të paguara dhe {unpaid} ditë të papaguara.",
    KU: "Ji wan {paid} roj bi mûçe û {unpaid} roj bê mûçe ne.",
    RO: "Dintre care {paid} zile plătite și {unpaid} zile neplătite.",
  },
  vacationRequestHalfDay: {
    DE: "🌴 Urlaubsantrag (halber Tag · {date})",
    EN: "🌴 Vacation request (half day · {date})",
    IT: "🌴 Richiesta ferie (mezza giornata · {date})",
    TR: "🌴 İzin talebi (yarım gün · {date})",
    SQ: "🌴 Kërkesë pushimi (gjysmë dite · {date})",
    KU: "🌴 Daxwaza bêhnvedanê (nîv roj · {date})",
    RO: "🌴 Cerere de vacanță (jumătate de zi · {date})",
  },
  vacationRequest: {
    DE: "Urlaubsantrag",
    EN: "Vacation request",
    IT: "Richiesta ferie",
    TR: "İzin talebi",
    SQ: "Kërkesë pushimi",
    KU: "Daxwaza bêhnvedanê",
    RO: "Cerere de vacanță",
  },
  sicknessRequest: {
    DE: "Krankheitsantrag",
    EN: "Sickness request",
    IT: "Richiesta malattia",
    TR: "Hastalık talebi",
    SQ: "Kërkesë sëmundjeje",
    KU: "Daxwaza nexweşiyê",
    RO: "Cerere de boală",
  },
  customer: {
    DE: "Kunde",
    EN: "Customer",
    IT: "Cliente",
    TR: "Müşteri",
    SQ: "Klient",
    KU: "Müşterî",
    RO: "Client",
  },
  site: {
    DE: "Baustelle",
    EN: "Site",
    IT: "Cantiere",
    TR: "Şantiye",
    SQ: "Kantier",
    KU: "Şantiye",
    RO: "Șantier",
  },
  internal: {
    DE: "Intern",
    EN: "Internal",
    IT: "Interno",
    TR: "Dahili",
    SQ: "I brendshëm",
    KU: "Navxweyî",
    RO: "Intern",
  },
  private: {
    DE: "Privat",
    EN: "Private",
    IT: "Privato",
    TR: "Özel",
    SQ: "Privat",
    KU: "Taybet",
    RO: "Privat",
  },
  today: {
    DE: "Heute",
    EN: "Today",
    IT: "Oggi",
    TR: "Bugün",
    SQ: "Sot",
    KU: "Îro",
    RO: "Astăzi",
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
  week: {
    DE: "Woche",
    EN: "Week",
    IT: "Settimana",
    TR: "Hafta",
    SQ: "Java",
    KU: "Hefte",
    RO: "Săptămână", 
  },
  myAdminAppointments: {
    DE: "Meine Admin-Termine",
    EN: "My admin appointments",
    IT: "I miei appuntamenti admin",
    TR: "Yönetici randevularım",
    SQ: "Takimet e mia si admin",
    KU: "Hevdîtinên min yên admin",
    RO: "Programările mele de admin",
  },
  employeeReadonlyCalendarHint: {
    DE: "Mitarbeiteransicht (read-only): Kalender zeigt Plan/Urlaub/Krank des Mitarbeiters.",
    EN: "Employee view (read-only): calendar shows the employee's schedule/vacation/sick days.",
    IT: "Vista dipendente (sola lettura): il calendario mostra piano/ferie/malattia del dipendente.",
    TR: "Çalışan görünümü (salt okunur): takvim çalışanın planını/iznini/hastalığını gösterir.",
    SQ: "Pamja e punonjësit (vetëm lexim): kalendari tregon planin/pushimin/sëmundjen e punonjësit.",
    KU: "Dîtina karmend (tenê-xwendin): salname plana/bêhnvedana/nexweşiya karmend nîşan dide.",
    RO: "Vizualizare angajat (doar citire): calendarul arată programul/ vacanța/ zilele de boală ale angajatului.",
  },
  connectGoogleCalendar: {
    DE: "Google Kalender verbinden",
    EN: "Connect Google Calendar",
    IT: "Collega Google Calendar",
    TR: "Google Takvim bağla",
    SQ: "Lidhu me Google Calendar",
    KU: "Google Calendar girêde",
    RO: "Conectează Google Calendar",
  },
  appointments: {
    DE: "Termine",
    EN: "Appointments",
    IT: "Appuntamenti",
    TR: "Randevular",
    SQ: "Takime",
    KU: "Hevdîtin",
    RO: "Programări",
  },
  holiday: {
    DE: "Feiertag",
    EN: "Holiday",
    IT: "Festività",
    TR: "Resmî tatil",
    SQ: "Festë zyrtare",
    KU: "Cejna fermî",
    RO: "Sărbătoare legală",
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
  sick: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malattia",
    TR: "Hasta",
    SQ: "I sëmurë",
    KU: "Nexweş",
    RO: "Bolnav",
  },
  noEntries: {
    DE: "Keine Einträge",
    EN: "No entries",
    IT: "Nessuna voce",
    TR: "Kayıt yok",
    SQ: "Nuk ka regjistrime",
    KU: "Tomar tune ne",
    RO: "Fără înregistrări",
  },
  loadingCalendar: {
    DE: "Lade Kalender...",
    EN: "Loading calendar...",
    IT: "Caricamento calendario...",
    TR: "Takvim yükleniyor...",
    SQ: "Kalendari po ngarkohet...",
    KU: "Salname tê barkirin...",
    RO: "Se încarcă calendarul...",
  },
  work: {
    DE: "Arbeit",
    EN: "Work",
    IT: "Lavoro",
    TR: "İş",
    SQ: "Punë",
    KU: "Kar",
    RO: "Muncă",
  },
  newAppointment: {
    DE: "Neuer Termin",
    EN: "New appointment",
    IT: "Nuovo appuntamento",
    TR: "Yeni randevu",
    SQ: "Takim i ri",
    KU: "Hevdîtina nû",
    RO: "Programare nouă",
  },
  day: {
    DE: "Tag",
    EN: "Day",
    IT: "Giorno",
    TR: "Gün",
    SQ: "Ditë",
    KU: "Roj",
    RO: "Zi",
  },
  loadingAppointments: {
    DE: "Lädt Termine...",
    EN: "Loading appointments...",
    IT: "Caricamento appuntamenti...",
    TR: "Randevular yükleniyor...",
    SQ: "Takimet po ngarkohen...",
    KU: "Hevdîtin têne barkirin...",
    RO: "Se încarcă programările...",
  },
  noAppointmentsForDay: {
    DE: "Keine Termine für diesen Tag.",
    EN: "No appointments for this day.",
    IT: "Nessun appuntamento per questo giorno.",
    TR: "Bu gün için randevu yok.",
    SQ: "Nuk ka takime për këtë ditë.",
    KU: "Ji bo vê rojê hevdîtin tune ne.",
    RO: "Fără programări pentru această zi.",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    KU: "Sererast bike",
    RO: "Editează",
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
  editAppointment: {
    DE: "Termin bearbeiten",
    EN: "Edit appointment",
    IT: "Modifica appuntamento",
    TR: "Randevuyu düzenle",
    SQ: "Ndrysho takimin",
    KU: "Hevdîtinê sererast bike",
    RO: "Editează programarea",
  },
  enterAppointment: {
    DE: "Termin eintragen",
    EN: "Create appointment",
    IT: "Inserisci appuntamento",
    TR: "Randevu gir",
    SQ: "Shto takim",
    KU: "Hevdîtinê tomar bike",
    RO: "Creează programare",
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
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
    RO: "Data",
  },
  start: {
    DE: "Start",
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
  categoryUiOnly: {
    DE: "Kategorie (UI-only)",
    EN: "Category (UI-only)",
    IT: "Categoria (solo UI)",
    TR: "Kategori (yalnızca arayüz)",
    SQ: "Kategoria (vetëm UI)",
    KU: "Kategorî (tenê UI)",
    RO: "Categorie (doar UI)",
  },
  title: {
    DE: "Titel",
    EN: "Title",
    IT: "Titolo",
    TR: "Başlık",
    SQ: "Titulli",
    KU: "Sernav",
    RO: "Titlu",
  },
  titlePlaceholder: {
    DE: "z. B. Kundentermin",
    EN: "e.g. customer appointment",
    IT: "es. appuntamento cliente",
    TR: "örn. müşteri randevusu",
    SQ: "p.sh. takim me klientin",
    KU: "mînak: hevdîtina müşterî",
    RO: "p.ex. programare cu client",
  },
  locationOptional: {
    DE: "Ort (optional)",
    EN: "Location (optional)",
    IT: "Luogo (opzionale)",
    TR: "Yer (isteğe bağlı)",
    SQ: "Vendi (opsionale)",
    KU: "Cih (vebijarkî)",
    RO: "Locație (opțional)",
  },
  locationPlaceholder: {
    DE: "z. B. Baustelle / Adresse",
    EN: "e.g. site / address",
    IT: "es. cantiere / indirizzo",
    TR: "örn. şantiye / adres",
    SQ: "p.sh. kantier / adresë",
    KU: "mînak: şantiye / navnîşan",
    RO: "p.ex. șantier / adresă",
  },
  noteOptional: {
    DE: "Notiz (optional)",
    EN: "Note (optional)",
    IT: "Nota (opzionale)",
    TR: "Not (isteğe bağlı)",
    SQ: "Shënim (opsionale)",
    KU: "Nîşe (vebijarkî)",
    RO: "Notă (opțional)",
  },
  notePlaceholder: {
    DE: "z. B. Ansprechpartner, Material, …",
    EN: "e.g. contact person, material, ...",
    IT: "es. referente, materiale, ...",
    TR: "örn. ilgili kişi, malzeme, ...",
    SQ: "p.sh. person kontakti, material, ...",
    KU: "mînak: kesê têkiliyê, materyal, ...",
    RO: "p.ex. persoană de contact, material, ...",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
    RO: "Se salvează...",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guherînan tomar bike",
    RO: "Salvează modificările",
  },
  save: {
    DE: "Eintragen",
    EN: "Save",
    IT: "Salva",
    TR: "Kaydet",
    SQ: "Ruaj",
    KU: "Tomar bike",
    RO: "Salvează",
  },
  viewingEmployeeCalendar: {
    DE: "Du siehst gerade den Kalender eines Mitarbeiters.",
    EN: "You are currently viewing an employee's calendar.",
    IT: "Stai visualizzando il calendario di un dipendente.",
    TR: "Şu anda bir çalışanın takvimini görüntülüyorsunuz.",
    SQ: "Po shihni kalendarin e një punonjësi.",
    KU: "Tu niha salnameya karmendekî dibînî.",
    RO: "În prezent vizualizați calendarul unui angajat.",
  },
  viewingEmployeeCalendarHint: {
    DE: "Bearbeitung und eigene Admin-Termine sind in dieser Ansicht deaktiviert.",
    EN: "Editing and your own admin appointments are disabled in this view.",
    IT: "La modifica e i tuoi appuntamenti admin sono disattivati in questa vista.",
    TR: "Bu görünümde düzenleme ve kendi yönetici randevularınız devre dışıdır.",
    SQ: "Ndryshimi dhe takimet tuaja si admin janë çaktivizuar në këtë pamje.",
    KU: "Li vê dîtinê de sererastkirin û hevdîtinên te yên admin neçalak in.",
    RO: "Editarea și propriile programări de admin sunt dezactivate în această vizualizare.",
  },
  employeeSchedule: {
    DE: "Einsatzplan des Mitarbeiters",
    EN: "Employee schedule",
    IT: "Piano del dipendente",
    TR: "Çalışan planı",
    SQ: "Plani i punonjësit",
    KU: "Plana karmend",
    RO: "Planul angajatului",
  },
  loadingPlan: {
    DE: "Lädt Plan...",
    EN: "Loading schedule...",
    IT: "Caricamento piano...",
    TR: "Plan yükleniyor...",
    SQ: "Plani po ngarkohet...",
    KU: "Plan tê barkirin...",
    RO: "Se încarcă planul...",
  },
  noScheduleForDay: {
    DE: "Kein Einsatz für diesen Tag geplant.",
    EN: "No assignment planned for this day.",
    IT: "Nessun incarico previsto per questo giorno.",
    TR: "Bu gün için planlanmış görev yok.",
    SQ: "Nuk ka angazhim të planifikuar për këtë ditë.",
    KU: "Ji bo vê rojê planek tune ye.",
    RO: "Nicio sarcină planificată pentru această zi.",
  },
  noLocationGiven: {
    DE: "📍 (kein Ort angegeben)",
    EN: "📍 (no location provided)",
    IT: "📍 (nessun luogo indicato)",
    TR: "📍 (yer belirtilmedi)",
    SQ: "📍 (nuk është dhënë vendi)",
    KU: "📍 (cih nehatiye dayîn)",
    RO: "📍 (fără locație specificată)",
  },
  travelMinutes: {
    DE: "Min Fahrzeit",
    EN: "min travel time",
    IT: "min di viaggio",
    TR: "dk yol süresi",
    SQ: "min udhëtim",
    KU: "deq rê",
    RO: "min timp de călătorie",
  },
  dayStatus: {
    DE: "Tagesstatus",
    EN: "Day status",
    IT: "Stato del giorno",
    TR: "Gün durumu",
    SQ: "Statusi i ditës",
    KU: "Rewşa rojê",
    RO: "Starea zilei",
  },
  scheduleExists: {
    DE: "Plan vorhanden",
    EN: "Schedule available",
    IT: "Piano disponibile",
    TR: "Plan mevcut",
    SQ: "Plani ekziston",
    KU: "Plan heye",
    RO: "Plan disponibil",
  },
  paidVacation: {
    DE: "Bezahlter Urlaub",
    EN: "Paid vacation",
    IT: "Ferie retribuite",
    TR: "Ücretli izin",
    SQ: "Pushim i paguar",
    KU: "Bêhnvedana bi mûçe",
    RO: "Vacanță plătită",
  },
  noEntriesForDay: {
    DE: "Keine Einträge für diesen Tag vorhanden.",
    EN: "No entries available for this day.",
    IT: "Nessuna voce disponibile per questo giorno.",
    TR: "Bu gün için kayıt yok.",
    SQ: "Nuk ka regjistrime për këtë ditë.",
    KU: "Ji bo vê rojê tomar tune ne.",
    RO: "Fără înregistrări disponibile pentru această zi.",
  },
  yourSchedule: {
    DE: "Dein Einsatzplan",
    EN: "Your schedule",
    IT: "Il tuo piano",
    TR: "Planın",
    SQ: "Plani yt",
    KU: "Plana te",
    RO: "Planul tău",
  },
  syncToEntry: {
    DE: "↪️ In Eintrag syncen",
    EN: "↪️ Sync to entry",
    IT: "↪️ Sincronizza in registrazione",
    TR: "↪️ Kayda aktar",
    SQ: "↪️ Sinkronizo te regjistrimi",
    KU: "↪️ Bi tomarê re hevrêz bike",
    RO: "↪️ Sincronizează în înregistrare",
  },
  documents: {
    DE: "📎 Dokumente",
    EN: "📎 Documents",
    IT: "📎 Documenti",
    TR: "📎 Belgeler",
    SQ: "📎 Dokumente",
    KU: "📎 Belge",
    RO: "📎 Documente",
  },
  syncPlanHint: {
    DE: "Übernimmt Datum, Tätigkeit und Einsatzort. Uhrzeiten und Fahrtminuten bitte in der Erfassung ergänzen.",
    EN: "Transfers date, activity, and location. Please complete times and travel minutes in the entry form.",
    IT: "Trasferisce data, attività e luogo. Completa orari e minuti di viaggio nella registrazione.",
    TR: "Tarih, faaliyet ve konumu aktarır. Saatleri ve yol dakikalarını lütfen kayıtta tamamlayın.",
    SQ: "Merr datën, aktivitetin dhe vendin. Ju lutem plotësoni oraret dhe minutat e udhëtimit te regjistrimi.",
    KU: "Dîrok, çalakî û cih digire. Ji kerema xwe dem û deqeyên rê di tomarê de temam bike.",
    RO: "Transferă data, activitatea și locația. Vă rugăm să completați orele și minutele de călătorie în formularul de înregistrare.",
  },
  publicHoliday: {
    DE: "Gesetzlicher Feiertag",
    EN: "Public holiday",
    IT: "Festività legale",
    TR: "Resmî tatil",
    SQ: "Festë zyrtare",
    KU: "Cejna fermî",
    RO: "Sărbătoare legală",
  },
  confirmedAbsence: {
    DE: "Bestätigte Abwesenheit",
    EN: "Confirmed absence",
    IT: "Assenza confermata",
    TR: "Onaylanmış devamsızlık",
    SQ: "Mungesë e konfirmuar",
    KU: "Nebûna pejirandî",
    RO: "Absență confirmată",
  },
  noConfirmedAbsence: {
    DE: "Keine bestätigte Abwesenheit eingetragen.",
    EN: "No confirmed absence recorded.",
    IT: "Nessuna assenza confermata registrata.",
    TR: "Onaylanmış devamsızlık kaydı yok.",
    SQ: "Nuk ka mungesë të konfirmuar të regjistruar.",
    KU: "Nebûna pejirandî nehatiye tomar kirin.",
    RO: "Nicio absență confirmată înregistrată.",
  },
  alreadyConfirmedRegistered: {
    DE: "Bereits vom Admin bestätigt und im Kalender registriert.",
    EN: "Already confirmed by admin and registered in the calendar.",
    IT: "Già confermata dall'admin e registrata nel calendario.",
    TR: "Zaten yönetici tarafından onaylandı ve takvime işlendi.",
    SQ: "Tashmë e konfirmuar nga admini dhe e regjistruar në kalendar.",
    KU: "Berê ji aliyê admin ve pejirandî û di salnameyê de tomar kirî ye.",
    RO: "Deja confirmată de admin și înregistrată în calendar.",
  },
  compensation: {
    DE: "Vergütung:",
    EN: "Compensation:",
    IT: "Retribuzione:",
    TR: "Ücretlendirme:",
    SQ: "Kompensimi:",
    KU: "Mûçe:",
    RO: "Compensație:",
  },
  myRequests: {
    DE: "Meine Anträge",
    EN: "My requests",
    IT: "Le mie richieste",
    TR: "Taleplerim",
    SQ: "Kërkesat e mia",
    KU: "Daxwazên min",
    RO: "Cererile mele",
  },
  noRequestForDay: {
    DE: "Kein Antrag für diesen Tag vorhanden.",
    EN: "No request exists for this day.",
    IT: "Non esiste alcuna richiesta per questo giorno.",
    TR: "Bu gün için talep yok.",
    SQ: "Nuk ka kërkesë për këtë ditë.",
    KU: "Ji bo vê rojê daxwaz tune ye.",
    RO: "Nu există nicio cerere pentru această zi.",
  },
  status: {
    DE: "Status:",
    EN: "Status:",
    IT: "Stato:",
    TR: "Durum:",
    SQ: "Statusi:",
    KU: "Rewş:",
    RO: "Stare:",
  },
  scope: {
    DE: "Umfang:",
    EN: "Scope:",
    IT: "Entità:",
    TR: "Kapsam:",
    SQ: "Shtrirja:",
    KU: "Berfirehî:",
    RO: "Domeniu:",
  },
  total: {
    DE: "Gesamt:",
    EN: "Total:",
    IT: "Totale:",
    TR: "Toplam:",
    SQ: "Totali:",
    KU: "Tevahî:",
    RO: "Total:",
  },
  processedBy: {
    DE: "Bearbeitet von:",
    EN: "Processed by:",
    IT: "Elaborato da:",
    TR: "İşleyen:",
    SQ: "Përpunuar nga:",
    KU: "Ji aliyê vê kesê ve hate xebitandin:",
    RO: "Procesat de:",
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
  requestDetails: {
    DE: "Antragsdetails",
    EN: "Request details",
    IT: "Dettagli richiesta",
    TR: "Talep detayları",
    SQ: "Detajet e kërkesës",
    KU: "Hûrguliyên daxwazê",
    RO: "Detalii cerere",
  },
  requestAbsence: {
    DE: "Abwesenheit beantragen",
    EN: "Request absence",
    IT: "Richiedi assenza",
    TR: "Devamsızlık talep et",
    SQ: "Kërko mungesë",
    KU: "Nebûnê daxwaz bike",
    RO: "Solicită absență",
  },
  wholeDayOnlyForSick: {
    DE: "Krankheit kann nur ganztägig beantragt werden.",
    EN: "Sickness can only be requested as a full day.",
    IT: "La malattia può essere richiesta solo per l'intera giornata.",
    TR: "Hastalık sadece tam gün olarak talep edilebilir.",
    SQ: "Sëmundja mund të kërkohet vetëm për gjithë ditën.",
    KU: "Nexweşî tenê dikare wekî rojek tam were daxwaz kirin.",
    RO: "Boala poate fi solicitată doar ca și zi întreagă.",
  },
  halfDaysOnlyVacation: {
    DE: "Halbe Tage sind nur für Urlaub erlaubt.",
    EN: "Half days are only allowed for vacation.",
    IT: "I mezzi giorni sono consentiti solo per ferie.",
    TR: "Yarım gün sadece izin için kullanılabilir.",
    SQ: "Gjysmë ditët lejohen vetëm për pushim.",
    KU: "Nîv roj tenê ji bo bêhnvedanê tên destûrkirin.",
    RO: "Jumătățile de zi sunt permise doar pentru vacanță.",
  },
  halfDaySingleDateOnly: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden.",
    EN: "A half vacation day may only be requested for exactly one date.",
    IT: "Una mezza giornata di ferie può essere richiesta solo per una sola data.",
    TR: "Yarım gün izin yalnızca tek bir tarih için talep edilebilir.",
    SQ: "Një gjysmë dite pushimi mund të kërkohet vetëm për një datë të vetme.",
    KU: "Nîv roj bêhnvedanê tenê ji bo tenê yek dîrokê dikare were daxwaz kirin.",
    RO: "O jumătate de zi de vacanță poate fi solicitată doar pentru o singură dată.",
  },
  vacationNoWeekdays: {
    DE: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
    EN: "There are no workdays for vacation in the selected period. Weekends are automatically excluded.",
    IT: "Nel periodo selezionato non ci sono giorni lavorativi per ferie. I fine settimana vengono esclusi automaticamente.",
    TR: "Seçilen aralıkta izin için iş günü yok. Hafta sonları otomatik olarak hariç tutulur.",
    SQ: "Në periudhën e zgjedhur nuk ka ditë pune për pushim. Fundjavat përjashtohen automatikisht.",
    KU: "Di navbera hilbijartî de rojên karê ji bo bêhnvedanê tune ne. Dawiya hefteyê bixweber nayê hesibandin.",
    RO: "Nu există zile lucrătoare pentru vacanță în perioada selectată. Zilele de weekend sunt excluse automat.",
  },
  sickCannotBeUnpaid: {
    DE: "Krankheit darf nicht als unbezahlt beantragt werden.",
    EN: "Sickness must not be requested as unpaid.",
    IT: "La malattia non può essere richiesta come non retribuita.",
    TR: "Hastalık ücretsiz olarak talep edilemez.",
    SQ: "Sëmundja nuk mund të kërkohet si e papaguar.",
    KU: "Nexweşî nikare wekî bê mûçe were daxwaz kirin.",
    RO: "Boala nu poate fi solicitată ca neplătită.",
  },
  requestCouldNotBeSaved: {
    DE: "Antrag konnte nicht gespeichert werden.",
    EN: "Request could not be saved.",
    IT: "Impossibile salvare la richiesta.",
    TR: "Talep kaydedilemedi.",
    SQ: "Kërkesa nuk mund të ruhej.",
    KU: "Daxwaz nehat tomarkirin.",
    RO: "Cererea nu a putut fi salvată.",
  },
  networkSaveError: {
    DE: "Netzwerkfehler beim Speichern.",
    EN: "Network error while saving.",
    IT: "Errore di rete durante il salvataggio.",
    TR: "Kaydetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes.",
    KU: "Di tomarkirinê de şaşiya torê.",
    RO: "Eroare de rețea în timpul salvării.",
  },
  pleaseSelectStartEnd: {
    DE: "Bitte Start- und Enddatum auswählen.",
    EN: "Please select start and end date.",
    IT: "Seleziona data di inizio e fine.",
    TR: "Lütfen başlangıç ve bitiş tarihini seçin.",
    SQ: "Ju lutem zgjidhni datën e fillimit dhe të mbarimit.",
    KU: "Ji kerema xwe dîroka destpêk û dawiyê hilbijêre.",
    RO: "Vă rugăm să selectați data de început și de sfârșit.",
  },
  endBeforeStart: {
    DE: "Ende darf nicht vor Start liegen.",
    EN: "End must not be before start.",
    IT: "La fine non può essere prima dell'inizio.",
    TR: "Bitiş başlangıçtan önce olamaz.",
    SQ: "Mbarimi nuk mund të jetë para fillimit.",
    KU: "Dawî nikare berî destpêkê be.",
    RO: "Sfârșitul nu trebuie să fie înainte de început.",
  },
  holidayMarked: {
    DE: "Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.",
    EN: "This day is marked as a public holiday in the calendar.",
    IT: "Questo giorno è contrassegnato come festività legale nel calendario.",
    TR: "Bu gün takvimde resmî tatil olarak işaretlenmiştir.",
    SQ: "Kjo ditë është shënuar si festë zyrtare në kalendar.",
    KU: "Ev roj di salnameyê de wekî cejna fermî hatiye nîşankirin.",
    RO: "Acestă zi este marcată ca sărbătoare legală în calendar.",
  },
  adminHolidayMarked: {
    DE: "Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.",
    EN: "This day is marked as a public holiday in the calendar.",
    IT: "Questo giorno è contrassegnato come festività legale nel calendario.",
    TR: "Bu gün takvimde resmî tatil olarak işaretlenmiştir.",
    SQ: "Kjo ditë është shënuar si festë zyrtare në kalendar.",
    KU: "Ev roj di salnameyê de wekî cejna fermî hatiye nîşankirin.",
    RO: "Acestă zi este marcată ca sărbătoare legală în calendar.",
  },
  startNewRequest: {
    DE: "Neuer Antrag",
    EN: "New request",
    IT: "Nuova richiesta",
    TR: "Yeni talep",
    SQ: "Kërkesë e re",
    KU: "Daxwaza nû",
    RO: "Cerere nouă",
  },
  absenceTypeVacation: {
    DE: "🌴 Urlaub",
    EN: "🌴 Vacation",
    IT: "🌴 Ferie",
    TR: "🌴 İzin",
    SQ: "🌴 Pushim",
    KU: "🌴 Bêhnvedan",
    RO: "🌴 Vacanță",
  },
  absenceTypeSick: {
    DE: "🤒 Krank",
    EN: "🤒 Sick",
    IT: "🤒 Malattia",
    TR: "🤒 Hasta",
    SQ: "🤒 I sëmurë",
    KU: "🤒 Nexweş",
    RO: "🤒 Bolnav",
  },
  scopeLabel: {
    DE: "Umfang",
    EN: "Scope",
    IT: "Entità",
    TR: "Kapsam",
    SQ: "Shtrirja",
    KU: "Berfirehî",
    RO: "Domeniu",
  },
  scopeHint: {
    DE: "Bei mehrtägigem Urlaub werden Samstage und Sonntage automatisch nicht mitgezählt.",
    EN: "For multi-day vacation, Saturdays and Sundays are automatically not counted.",
    IT: "Per ferie di più giorni, sabato e domenica non vengono conteggiati automaticamente.",
    TR: "Birden fazla günlük izinlerde cumartesi ve pazar otomatik olarak sayılmaz.",
    SQ: "Për pushimet disa ditore, të shtunat dhe të dielat nuk llogariten automatikisht.",
    KU: "Di bêhnvedanên pirrojan de şemî û yekşem bixweber nayên hesibandin.",
    RO: "Pentru vacanța de mai multe zile, sâmbetele și duminicile nu sunt numărate automat.",
  },
  fullVacationDay: {
    DE: "Ganzer Urlaubstag",
    EN: "Full vacation day",
    IT: "Intera giornata di ferie",
    TR: "Tam gün izin",
    SQ: "Ditë e plotë pushimi",
    KU: "Rojek bêhnvedanê ya tam",
    RO: "Zi întreagă de vacanță",
  },
  halfVacationDay: {
    DE: "Halber Urlaubstag",
    EN: "Half vacation day",
    IT: "Mezza giornata di ferie",
    TR: "Yarım gün izin",
    SQ: "Gjysmë dite pushimi",
    KU: "Nîv roj bêhnvedanê",
    RO: "Jumătate de zi de vacanță",
  },
  compensationLabel: {
    DE: "Vergütung",
    EN: "Compensation",
    IT: "Retribuzione",
    TR: "Ücretlendirme",
    SQ: "Kompensimi",
    KU: "Mûçe",
    RO: "Compensație",
  },
  compensationLockedHint: {
    DE: "Für diesen Antrag ist aktuell nicht genug bezahlter Urlaub verfügbar. Der Antrag wird deshalb vorläufig als unbezahlt eingereicht. Bei der Prüfung kann der Admin den Antrag ganz oder teilweise in bezahlten und unbezahlten Urlaub aufteilen.",
    EN: "There is currently not enough paid vacation available for this request. Therefore, the request is submitted temporarily as unpaid. During review, the admin can split it fully or partially into paid and unpaid vacation.",
    IT: "Al momento non c'è abbastanza ferie pagate disponibili per questa richiesta. Per questo la richiesta viene inviata temporaneamente come non retribuita. Durante la revisione, l'admin può suddividerla in ferie pagate e non retribuite.",
    TR: "Bu talep için şu anda yeterli ücretli izin mevcut değil. Bu nedenle talep geçici olarak ücretsiz olarak gönderilir. İnceleme sırasında yönetici talebi tamamen veya kısmen ücretli ve ücretsiz izin olarak ayırabilir.",
    SQ: "Aktualisht nuk ka mjaftueshëm pushim të paguar për këtë kërkesë. Prandaj kërkesa dërgohet përkohësisht si e papaguar. Gjatë shqyrtimit, admini mund ta ndajë plotësisht ose pjesërisht në pushim të paguar dhe të papaguar.",
    KU: "Ji bo vê daxwazê niha bêhnvedana bi mûçe têr nîne. Ji ber vê yekê daxwaz demkî wekî bê mûçe tê şandin. Di dema vekolînê de admin dikare wê bi tevahî an beşekî bike bêhnvedana bi mûçe û bê mûçe.",
    RO: "În prezent nu există suficientă vacanță plătită disponibilă pentru această cerere. Prin urmare, cererea este trimisă temporar ca neplătită. În timpul revizuirii, adminul poate să o împartă complet sau parțial în vacanță plătită și neplătită.",
  },
  compensationFlexibleHint: {
    DE: "Falls bezahlter Resturlaub nicht vollständig ausreicht, kann der Antrag bei der Prüfung ganz oder teilweise in bezahlten und unbezahlten Urlaub aufgeteilt werden.",
    EN: "If the remaining paid vacation is not fully sufficient, the request can be split during review fully or partially into paid and unpaid vacation.",
    IT: "Se il residuo di ferie pagate non è sufficiente, la richiesta può essere suddivisa durante la revisione in ferie pagate e non retribuite.",
    TR: "Kalan ücretli izin tamamen yeterli değilse, talep inceleme sırasında tamamen veya kısmen ücretli ve ücretsiz izin olarak ayrılabilir.",
    SQ: "Nëse pushimi i mbetur i paguar nuk mjafton plotësisht, kërkesa mund të ndahet gjatë shqyrtimit në pushim të paguar dhe të papaguar.",
    KU: "Heke bêhnvedana mayî ya bi mûçe bi tevahî têr nebe, daxwaz di dema vekolînê de dikare bi tevahî an beşekî bibe bêhnvedana bi mûçe û bê mûçe.",
    RO: "Dacă vacanța plătită rămasă nu este suficientă, cererea poate fi împărțită în timpul revizuirii complet sau parțial în vacanță plătită și neplătită.",
  },
  noteToAdmin: {
    DE: "Notiz an Admin",
    EN: "Note to admin",
    IT: "Nota per admin",
    TR: "Yöneticiye not",
    SQ: "Shënim për adminin",
    KU: "Nîşe ji bo admin",
    RO: "Notă pentru admin",
  },
  requestNotePlaceholder: {
    DE: "Optional: Hinweis zum Antrag",
    EN: "Optional: note for the request",
    IT: "Opzionale: nota sulla richiesta",
    TR: "İsteğe bağlı: talep notu",
    SQ: "Opsionale: shënim për kërkesën",
    KU: "Vebijarkî: nîşe ji bo daxwazê",
    RO: "Opțional: notă pentru cerere",
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
  newRequest: {
    DE: "Neuer Antrag",
    EN: "New request",
    IT: "Nuova richiesta",
    TR: "Yeni talep",
    SQ: "Kërkesë e re",
    KU: "Daxwaza nû",
    RO: "Cerere nouă",
  },
  sendRequest: {
    DE: "Antrag senden",
    EN: "Send request",
    IT: "Invia richiesta",
    TR: "Talebi gönder",
    SQ: "Dërgo kërkesën",
    KU: "Daxwazê bişîne",
    RO: "Trimite cererea",
  },
  calendarLoadingFallback: {
    DE: "Kalender lädt...",
    EN: "Calendar is loading...",
    IT: "Il calendario si sta caricando...",
    TR: "Takvim yükleniyor...",
    SQ: "Kalendari po ngarkohet...",
    KU: "Salname tê barkirin...",
    RO: "Calendar se încarcă...",
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
  mondayLong: {
    DE: "Montag",
    EN: "Monday",
    IT: "Lunedì",
    TR: "Pazartesi",
    SQ: "E hënë",
    KU: "Duşem",
    RO: "Luni",
  },
  tuesdayLong: {
    DE: "Dienstag",
    EN: "Tuesday",
    IT: "Martedì",
    TR: "Salı",
    SQ: "E martë",
    KU: "Sêşem",
    RO: "Marți",
  },
  wednesdayLong: {
    DE: "Mittwoch",
    EN: "Wednesday",
    IT: "Mercoledì",
    TR: "Çarşamba",
    SQ: "E mërkurë",
    KU: "Çarşem",
    RO: "Miercuri",
  },
  thursdayLong: {
    DE: "Donnerstag",
    EN: "Thursday",
    IT: "Giovedì",
    TR: "Perşembe",
    SQ: "E enjte",
    KU: "Pêncşem",
    RO: "Joi",
  },
  fridayLong: {
    DE: "Freitag",
    EN: "Friday",
    IT: "Venerdì",
    TR: "Cuma",
    SQ: "E premte",
    KU: "În",
    RO: "Vineri",
  },
  saturdayLong: {
    DE: "Samstag",
    EN: "Saturday",
    IT: "Sabato",
    TR: "Cumartesi",
    SQ: "E shtunë",
    KU: "Şemî",
    RO: "Sâmbătă",
  },
  sundayLong: {
    DE: "Sonntag",
    EN: "Sunday",
    IT: "Domenica",
    TR: "Pazar",
    SQ: "E diel",
    KU: "Yekşem",
    RO: "Duminică",
  },
  dayMarkedAsHoliday: {
    DE: "Dieser Tag ist als gesetzlicher Feiertag im Kalender markiert.",
    EN: "This day is marked as a public holiday in the calendar.",
    IT: "Questo giorno è contrassegnato come festività legale nel calendario.",
    TR: "Bu gün takvimde resmî tatil olarak işaretlenmiştir.",
    SQ: "Kjo ditë është shënuar si festë zyrtare në kalendar.",
    KU: "Ev roj di salnameyê de wekî cejna fermî hatiye nîşankirin.",
    RO: "Acestă zi este marcată ca sărbătoare legală în calendar.",
  },
  dashOnly: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    KU: "—",
    RO: "—",
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
    RO: "Se încarcă...",
  },
  monthJanuary: {
    DE: "Januar",
    EN: "January",
    IT: "Gennaio",
    TR: "Ocak",
    SQ: "Janar",
    KU: "Rêbendan",
    RO: "Ianuarie",
  },
  monthFebruary: {
    DE: "Februar",
    EN: "February",
    IT: "Febbraio",
    TR: "Şubat",
    SQ: "Shkurt",
    KU: "Reşemî",
    RO: "Februarie",
  },
  monthMarch: {
    DE: "März",
    EN: "March",
    IT: "Marzo",
    TR: "Mart",
    SQ: "Mars",
    KU: "Adar",
    RO: "Martie",
  },
  monthApril: {
    DE: "April",
    EN: "April",
    IT: "Aprile",
    TR: "Nisan",
    SQ: "Prill",
    KU: "Nîsan",
    RO: "Aprilie",
  },
  monthMay: {
    DE: "Mai",
    EN: "May",
    IT: "Maggio",
    TR: "Mayıs",
    SQ: "Maj",
    KU: "Gulan",
    RO: "Mai",

  },
  monthJune: {
    DE: "Juni",
    EN: "June",
    IT: "Giugno",
    TR: "Haziran",
    SQ: "Qershor",
    KU: "Hezîran",
    RO: "Iunie",
  },
  monthJuly: {
    DE: "Juli",
    EN: "July",
    IT: "Luglio",
    TR: "Temmuz",
    SQ: "Korrik",
    KU: "Tîrmeh",
    RO: "Iulie",
  },
  monthAugust: {
    DE: "August",
    EN: "August",
    IT: "Agosto",
    TR: "Ağustos",
    SQ: "Gusht",
    KU: "Tebax",
    RO: "August",
  },
  monthSeptember: {
    DE: "September",
    EN: "September",
    IT: "Settembre",
    TR: "Eylül",
    SQ: "Shtator",
    KU: "Îlon",
    RO: "Septembrie",
  },
  monthOctober: {
    DE: "Oktober",
    EN: "October",
    IT: "Ottobre",
    TR: "Ekim",
    SQ: "Tetor",
    KU: "Cotmeh",
    RO: "Octombrie",
  },
  monthNovember: {
    DE: "November",
    EN: "November",
    IT: "Novembre",
    TR: "Kasım",
    SQ: "Nëntor",
    KU: "Mijdar",
    RO: "Noiembrie",
  },
  monthDecember: {
    DE: "Dezember",
    EN: "December",
    IT: "Dicembre",
    TR: "Aralık",
    SQ: "Dhjetor",
    KU: "Kanûn",
    RO: "Decembrie",
  },
  weekdaySundayShort: {
    DE: "So.",
    EN: "Sun",
    IT: "Dom",
    TR: "Paz",
    SQ: "Die",
    KU: "Yek",
    RO: "Dum"
  },
  weekdayMondayShort: {
    DE: "Mo.",
    EN: "Mon",
    IT: "Lun",
    TR: "Pzt",
    SQ: "Hën",
    KU: "Duş",
    RO: "Lun"
  },
  weekdayTuesdayShort: {
    DE: "Di.",
    EN: "Tue",
    IT: "Mar",
    TR: "Sal",
    SQ: "Mar",
    KU: "Sêş",
    RO: "Mar"
  },
  weekdayWednesdayShort: {
    DE: "Mi.",
    EN: "Wed",
    IT: "Mer",
    TR: "Çar",
    SQ: "Mër",
    KU: "Çar",
    RO: "Mie"
  },
  weekdayThursdayShort: {
    DE: "Do.",
    EN: "Thu",
    IT: "Gio",
    TR: "Per",
    SQ: "Enj",
    KU: "Pênc",
    RO: "Joi"
  },
  weekdayFridayShort: {
    DE: "Fr.",
    EN: "Fri",
    IT: "Ven",
    TR: "Cum",
    SQ: "Pre",
    KU: "În",
    RO: "Vin"
  },
  weekdaySaturdayShort: {
    DE: "Sa.",
    EN: "Sat",
    IT: "Sab",
    TR: "Cmt",
    SQ: "Sht",
    KU: "Şem",
    RO: "Sâmbătă"
  },
  legalBreakHeadline: {
    DE: "Gesetzliche Pausen:",
    EN: "Legal breaks:",
    IT: "Pause legali:",
    TR: "Yasal molalar:",
    SQ: "Pushimet ligjore:",
    KU: "Navberên qanûnî:",
    RO: "Pauze legale:"
  },
  legalBreakAfterSixHours: {
    DE: "ab mehr als 6h: 30 Min",
    EN: "more than 6h: 30 min",
    IT: "oltre 6h: 30 min",
    TR: "6 saatten fazla: 30 dk",
    SQ: "mbi 6 orë: 30 min",
    KU: "zêdetirî 6 saetan: 30 deq",
    RO: "mai mult de 6h: 30 min"
  },
  legalBreakAfterNineHours: {
    DE: "ab mehr als 9h: 45 Min",
    EN: "more than 9h: 45 min",
    IT: "oltre 9h: 45 min",
    TR: "9 saatten fazla: 45 dk",
    SQ: "mbi 9 orë: 45 min",
    KU: "zêdetirî 9 saetan: 45 deq",
    RO: "mai mult de 9h: 45 min"
  },
  legalBreakAutoApplied: {
    DE: "Gesetzliche Pause automatisch eingetragen:",
    EN: "Legal break applied automatically:",
    IT: "Pausa legale applicata automaticamente:",
    TR: "Yasal mola otomatik uygulandı:",
    SQ: "Pushimi ligjor u zbatua automatikisht:",
    KU: "Navbera qanûnî bixweber hate sepandin:",
    RO: "Pauza legală aplicată automat:"
  },
  to: {
    DE: "bis",
    EN: "to",
    IT: "fino a",
    TR: "ile",
    SQ: "deri",
    KU: "heta",
    RO: "la"
  },
  dateStartEndMissing: {
    DE: "Datum / Beginn / Ende fehlt.",
    EN: "Date / start / end is missing.",
    IT: "Manca data / inizio / fine.",
    TR: "Tarih / başlangıç / bitiş eksik.",
    SQ: "Mungon data / fillimi / fundi.",
    KU: "Dîrok / destpêk / dawî kêm e.",
    RO: "Data / început / sfârșit lipsește.",
  },
  sending: {
    DE: "Sendet...",
    EN: "Sending...",
    IT: "Invio...",
    TR: "Gönderiliyor...",
    SQ: "Duke dërguar...",
    KU: "Tê şandin...",
    RO: "Se trimite...",
  },
  optionalReasonPlaceholder: {
    DE: "Optional: kurze Begründung oder Hinweis",
    EN: "Optional: short reason or note",
    IT: "Opzionale: breve motivazione o nota",
    TR: "İsteğe bağlı: kısa açıklama veya not",
    SQ: "Opsionale: arsye ose shënim i shkurtër",
    KU: "Vebijarkî: ravekirinek kurt an nîşe",
    RO: "Opțional: o scurtă justificare sau o notă explicativă"
  },
  existingCorrectionHint: {
    DE: "Hinweis: Für {range} existiert bereits ein offener Antrag.",
    EN: "Note: There is already an open request for {range}.",
    IT: "Nota: esiste già una richiesta aperta per {range}.",
    TR: "Not: {range} için zaten açık bir talep var.",
    SQ: "Shënim: për {range} ekziston tashmë një kërkesë e hapur.",
    KU: "Têbînî: ji bo {range} daxwazek vekirî heye.",
    RO: "Notă: Există deja o cerere deschisă pentru {range}"
  },
   currentMissingDaysNeedsRequest: {
    DE: "Aktuell: {current}/{limit} fehlende Arbeitstage. Ein Nachtragsantrag ist erforderlich.",
    EN: "Current: {current}/{limit} missing workdays. A correction request is required.",
    IT: "Attuale: {current}/{limit} giorni lavorativi mancanti. È richiesta una domanda di integrazione.",
    TR: "Şu an: {current}/{limit} eksik iş günü. Düzeltme talebi gereklidir.",
    SQ: "Aktualisht: {current}/{limit} ditë pune të munguara. Kërkohet një kërkesë korrigjimi.",
    RO: "În prezent: {current}/{limit} zile de lucru lipsă. Este necesară o cerere de corectare.",
    KU: "Niha: {current}/{limit} rojên karê yên wenda. Daxwaza rastkirinê pêwist e.",
  },
  currentMissingDaysUntilLock: {
    DE: "Aktuell: {current}/{limit} fehlende Arbeitstage bis zur Sperrung.",
    EN: "Current: {current}/{limit} missing workdays until lock.",
    IT: "Attuale: {current}/{limit} giorni lavorativi mancanti fino al blocco.",
    TR: "Şu an: kilide kadar {current}/{limit} eksik iş günü.",
    SQ: "Aktualisht: {current}/{limit} ditë pune të munguara deri në bllokim.",
    RO: "În prezent: {current}/{limit} zile de lucru lipsă până la blocare.",
    KU: "Niha: heta girtinê {current}/{limit} rojên karê yên wenda.",
  },
  employeeManagedServerSide: {
    DE: "Zuordnung wird serverseitig automatisch verwaltet.",
    EN: "Assignment is managed automatically on the server side.",
    IT: "L'assegnazione è gestita automaticamente dal server.",
    TR: "Atama sunucu tarafında otomatik olarak yönetilir.",
    SQ: "Caktimi menaxhohet automatikisht nga serveri.",
    RO: "Alocarea este gestionată automat pe partea de server.",
    KU: "Girêdan li aliyê serverê bixweber tê rêvebirin.",
  },
  dayGrossBreakNet: {
    DE: "Tag: Brutto {gross} · Wirksame Pause {breakValue} · Netto {netValue}",
    EN: "Day: Gross {gross} · Effective break {breakValue} · Net {netValue}",
    IT: "Giorno: Lordo {gross} · Pausa effettiva {breakValue} · Netto {netValue}",
    TR: "Gün: Brüt {gross} · Etkili mola {breakValue} · Net {netValue}",
    SQ: "Dita: Bruto {gross} · Pushimi efektiv {breakValue} · Neto {netValue}",
    RO: "Zi: Brut {gross} · Pauză efectivă {breakValue} · Net {netValue}",
    KU: "Roj: Berî derxistin {gross} · Navbera bi bandor {breakValue} · Safî {netValue}",
  },
  details: {
    DE: "Details anzeigen",
    EN: "Show details",
    IT: "Mostra dettagli",
    TR: "Detayları göster",
    SQ: "Trego detajet",
    RO: "Afișează detaliile",
    KU: "Xalqên nîşan bide",
  },
  cancel: {
    DE: "Abbrechen",
    EN: "Cancel",
    IT: "Annulla",
    TR: "İptal",
    SQ: "Anulo",
    RO: "Anulează",
    KU: "Betal bike",
  },
  enterActivity: {
    DE: "Bitte Tätigkeit eingeben.",
    EN: "Please enter an activity.",
    IT: "Inserisci un'attività.",
    TR: "Lütfen bir faaliyet girin.",
    SQ: "Ju lutem vendosni aktivitetin.",
    RO: "Te rugăm să introduci o activitate.",
    KU: "Ji kerema xwe çalakiyek binivîse.",
  },
  loginAgain: {
    DE: "Bitte neu einloggen.",
    EN: "Please log in again.",
    IT: "Effettua nuovamente l'accesso.",
    TR: "Lütfen tekrar giriş yapın.",
    SQ: "Ju lutem hyni përsëri.",
    RO: "Te rugăm să te autentifici din nou.",
    KU: "Ji kerema xwe dîsa têkeve.",
  },
  saveFailed: {
    DE: "Speichern fehlgeschlagen.",
    EN: "Saving failed.",
    IT: "Salvataggio non riuscito.",
    TR: "Kaydetme başarısız oldu.",
    SQ: "Ruajtja dështoi.",
    RO: "Salvarea a eșuat.",
    KU: "Tomarkirin bi ser neket.",
  },
  networkSaveError: {
    DE: "Netzwerkfehler beim Speichern.",
    EN: "Network error while saving.",
    IT: "Errore di rete durante il salvataggio.",
    TR: "Kaydetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes.",
    RO: "Eroare de rețea la salvare.",
    KU: "Di tomarkirinê de şaşiya torê.",
  },
  unknown: {
    DE: "Unbekannt",
    EN: "Unknown",
    IT: "Sconosciuto",
    TR: "Bilinmiyor",
    SQ: "I panjohur",
    RO: "Necunoscut",
    KU: "Nenas",
  },
  saveBreakIncomplete: {
    DE: "Bitte Pause von und bis vollständig eingeben.",
    EN: "Please enter both break start and end.",
    IT: "Inserisci in modo completo inizio e fine pausa.",
    TR: "Lütfen mola başlangıç ve bitişini tam girin.",
    SQ: "Ju lutem vendosni plotësisht fillimin dhe fundin e pushimit.",
    RO: "Te rugăm să introduci complet începutul și sfârșitul pauzei.",
    KU: "Ji kerema xwe destpêk û dawiya navberê bi tevahî binivîse.",
  },
  saveBreakFailed: {
    DE: "Pause speichern fehlgeschlagen.",
    EN: "Saving the break failed.",
    IT: "Salvataggio pausa non riuscito.",
    TR: "Mola kaydedilemedi.",
    SQ: "Ruajtja e pushimit dështoi.",
    RO: "Salvarea pauzei a eșuat.",
    KU: "Tomarkirina navberê bi ser neket.",
  },
  networkBreakSaveError: {
    DE: "Netzwerkfehler beim Speichern der Pause.",
    EN: "Network error while saving the break.",
    IT: "Errore di rete durante il salvataggio della pausa.",
    TR: "Mola kaydedilirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes së pushimit.",
    RO: "Eroare de rețea la salvarea pauzei.",
    KU: "Di tomarkirina navberê de şaşiya torê.",
  },
  correctionPastOnly: {
    DE: "Ein Nachtragsantrag ist nur für vergangene Tage möglich.",
    EN: "A correction request is only possible for past days.",
    IT: "Una richiesta di integrazione è possibile solo per giorni passati.",
    TR: "Düzeltme talebi yalnızca geçmiş günler için mümkündür.",
    SQ: "Kërkesa për korrigjim lejohet vetëm për ditët e kaluara.",
    RO: "O cerere de corectare este posibilă doar pentru zilele trecute.",
    KU: "Daxwaza rastkirinê tenê ji bo rojên borî gengaz e.",
  },
  correctionUnlockAlreadyExists: {
    DE: "Für diesen Tag existiert bereits eine aktive Freigabe.",
    EN: "An active approval already exists for this day.",
    IT: "Per questo giorno esiste già un'approvazione attiva.",
    TR: "Bu gün için zaten aktif bir onay var.",
    SQ: "Për këtë ditë ekziston tashmë një miratim aktiv.",
    RO: "Pentru această zi există deja o aprobare activă.",
    KU: "Ji bo vê rojê berê xweşandinê çalak heye.",
  },
  correctionPendingAlreadyExists: {
    DE: "Für diesen Tag existiert bereits ein offener Nachtragsantrag.",
    EN: "There is already an open correction request for this day.",
    IT: "Esiste già una richiesta aperta per questo giorno.",
    TR: "Bu gün için zaten açık bir düzeltme talebi var.",
    SQ: "Për këtë ditë ekziston tashmë një kërkesë e hapur.",
    RO: "Există deja o cerere de corectare deschisă pentru această zi.",
    KU: "Ji bo vê rojê daxwazek vekirî ya rastkirinê heye.",
  },
  correctionCreateFailed: {
    DE: "Nachtragsantrag konnte nicht erstellt werden.",
    EN: "The correction request could not be created.",
    IT: "Non è stato possibile creare la richiesta.",
    TR: "Düzeltme talebi oluşturulamadı.",
    SQ: "Kërkesa për korrigjim nuk mund të krijohej.",
    RO: "Cererea de corectare nu a putut fi creată.",
    KU: "Daxwaza rastkirinê nehat afirandin.",
  },
  correctionSentSuccess: {
    DE: "Nachtragsantrag wurde erfolgreich gesendet.",
    EN: "The correction request was sent successfully.",
    IT: "La richiesta è stata inviata con successo.",
    TR: "Düzeltme talebi başarıyla gönderildi.",
    SQ: "Kërkesa për korrigjim u dërgua me sukses.",
    RO: "Cererea de corectare a fost trimisă cu succes.",
    KU: "Daxwaza rastkirinê bi serkeftî hate şandin.",
  },
  networkCorrectionError: {
    DE: "Netzwerkfehler beim Senden des Nachtragsantrags.",
    EN: "Network error while sending the correction request.",
    IT: "Errore di rete durante l'invio della richiesta.",
    TR: "Düzeltme talebi gönderilirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë dërgimit të kërkesës.",
    RO: "Eroare de rețea la trimiterea cererii de corectare.",
    KU: "Di şandina daxwaza rastkirinê de şaşiya torê.",
  },
  syncTaskTaken: {
    DE: "Aufgabe übernommen. Bitte Start- und Endzeit ergänzen.",
    EN: "Task imported. Please add start and end time.",
    IT: "Attività importata. Aggiungi ora di inizio e fine.",
    TR: "Görev aktarıldı. Lütfen başlangıç ve bitiş saatini ekleyin.",
    SQ: "Detyra u mor. Ju lutem shtoni orën e fillimit dhe përfundimit.",
    RO: "Sarcina a fost preluată. Te rugăm să completezi ora de început și de sfârșit.",
    KU: "Erk hate standin. Ji kerema xwe dema destpêk û dawiyê zêde bike.",
  },
  syncDateTaken: {
    DE: "Datum aus der Benachrichtigung übernommen. Bitte Start- und Endzeit ergänzen.",
    EN: "Date imported from the notification. Please add start and end time.",
    IT: "Data importata dalla notifica. Aggiungi ora di inizio e fine.",
    TR: "Tarih bildirimden alındı. Lütfen başlangıç ve bitiş saatini ekleyin.",
    SQ: "Data u mor nga njoftimi. Ju lutem shtoni orën e fillimit dhe përfundimit.",
    RO: "Data a fost preluată din notificare. Te rugăm să completezi ora de început și de sfârșit.",
    KU: "Dîrok ji hişyariyê hate standin. Ji kerema xwe dema destpêk û dawiyê zêde bike.",
  },
  syncPlanTaken: {
    DE: "Planeintrag übernommen. Bitte Start- und Endzeit ergänzen.",
    EN: "Schedule entry imported. Please add start and end time.",
    IT: "Voce pianificata importata. Aggiungi ora di inizio e fine.",
    TR: "Plan kaydı aktarıldı. Lütfen başlangıç ve bitiş saatini ekleyin.",
    SQ: "Regjistrimi i planit u mor. Ju lutem shtoni orën e fillimit dhe përfundimit.",
    RO: "Intrarea din plan a fost preluată. Te rugăm să completezi ora de început și de sfârșit.",
    KU: "Tomara planê hate standin. Ji kerema xwe dema destpêk û dawiyê zêde bike.",
  },
  createEntry: {
    DE: "Stunden erfassen",
    EN: "Record hours",
    IT: "Registra ore",
    TR: "Saat gir",
    SQ: "Regjistro orët",
    RO: "Înregistrează orele",
    KU: "Demjimêran tomar bike",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    RO: "Angajat",
    KU: "Karmend",
  },
  entryAssignedAutomatically: {
    DE: "Der Eintrag wird automatisch deinem Konto zugeordnet.",
    EN: "The entry is automatically assigned to your account.",
    IT: "La voce viene assegnata automaticamente al tuo account.",
    TR: "Kayıt otomatik olarak hesabınıza atanır.",
    SQ: "Regjistrimi i caktohet automatikisht llogarisë suaj.",
    RO: "Înregistrarea este atribuită automat contului tău.",
    KU: "Tomar bixweber bi hesabê te ve tê girêdan.",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    RO: "Dată",
    KU: "Dîrok",
  },
  selectDate: {
    DE: "Datum auswählen",
    EN: "Select date",
    IT: "Seleziona data",
    TR: "Tarih seçin",
    SQ: "Zgjidh datën",
    RO: "Selectează data",
    KU: "Dîrok hilbijêre",
  },
  selectedPastDay: {
    DE: "Vergangener Tag ausgewählt",
    EN: "Past day selected",
    IT: "Giorno passato selezionato",
    TR: "Geçmiş gün seçildi",
    SQ: "U zgjodh një ditë e kaluar",
    RO: "A fost selectată o zi din trecut",
    KU: "Rojeke borî hate hilbijartin",
  },
  statusLoading: {
    DE: "Status für den ausgewählten Tag wird geladen...",
    EN: "Loading status for the selected day...",
    IT: "Caricamento stato per il giorno selezionato...",
    TR: "Seçilen günün durumu yükleniyor...",
    SQ: "Po ngarkohet statusi për ditën e zgjedhur...",
    RO: "Se încarcă statusul pentru ziua selectată...",
    KU: "Rewşa roja hilbijartî tê barkirin...",
  },
  noCorrectionBecauseAdminTask: {
    DE: "Für diesen Tag ist kein Nachtragsantrag erforderlich, weil du ihn über eine Admin-Aufgabe geöffnet hast.",
    EN: "No correction request is required for this day because you opened it through an admin task.",
    IT: "Per questo giorno non è necessaria una richiesta perché è stato aperto tramite un'attività admin.",
    TR: "Bu gün için düzeltme talebi gerekmez çünkü günü yönetici görevi üzerinden açtınız.",
    SQ: "Për këtë ditë nuk kërkohet kërkesë korrigjimi sepse e hapët përmes një detyre të adminit.",
    RO: "Pentru această zi nu este necesară o cerere de corectare deoarece ai deschis-o printr-o sarcină de admin.",
    KU: "Ji bo vê rojê daxwaza rastkirinê ne pêwist e, çimkî tu bi erkek admin ve vebûyî.",
  },
  directEntryPossible: {
    DE: "Du kannst den Eintrag für",
    EN: "You can enter the record for",
    IT: "Puoi registrare la voce per",
    TR: "Şu gün için kayıt yapabilirsiniz:",
    SQ: "Mund ta regjistroni hyrjen për",
    RO: "Poți introduce înregistrarea pentru",
    KU: "Tu dikarî tomara vê rojê bike ji bo",
  },
  releasedRangeFromTo: {
    DE: "Der freigegebene Zeitraum reicht von",
    EN: "The approved range goes from",
    IT: "L'intervallo approvato va da",
    TR: "Onaylanan aralık:",
    SQ: "Periudha e miratuar shkon nga",
    RO: "Perioada aprobată este de la",
    KU: "Navbera pejirandî ji ... heta ... ye",
  },
  adminReleasedDay: {
    DE: "Dieser Tag wurde vom Admin für den Nachtrag freigegeben. Du kannst ihn jetzt bearbeiten.",
    EN: "This day was approved by the admin for correction. You can edit it now.",
    IT: "Questo giorno è stato approvato dall'admin per l'integrazione. Ora puoi modificarlo.",
    TR: "Bu gün düzeltme için yönetici tarafından açıldı. Artık düzenleyebilirsiniz.",
    SQ: "Kjo ditë u miratua nga admini për korrigjim. Tani mund ta ndryshoni.",
    RO: "Această zi a fost aprobată de admin pentru corectare. O poți edita acum.",
    KU: "Ev roj ji aliyê admin ve ji bo rastkirinê hate vekirin. Naha tu dikarî sererast bikî.",
  },
  approvedRange: {
    DE: "Genehmigter Zeitraum:",
    EN: "Approved range:",
    IT: "Intervallo approvato:",
    TR: "Onaylanan aralık:",
    SQ: "Periudha e miratuar:",
    RO: "Interval aprobat:",
    KU: "Navbera pejirandî:",
  },
  pendingCorrectionExists: {
    DE: "Für diesen Tag existiert bereits ein offener Nachtragsantrag.",
    EN: "There is already an open correction request for this day.",
    IT: "Esiste già una richiesta aperta per questo giorno.",
    TR: "Bu gün için zaten açık bir düzeltme talebi var.",
    SQ: "Për këtë ditë ekziston tashmë një kërkesë e hapur.",
    RO: "Există deja o cerere de corectare deschisă pentru această zi.",
    KU: "Ji bo vê rojê daxwazek vekirî ya rastkirinê heye.",
  },
  pendingRange: {
    DE: "Offener Zeitraum:",
    EN: "Open range:",
    IT: "Intervallo aperto:",
    TR: "Açık aralık:",
    SQ: "Periudha e hapur:",
    RO: "Interval deschis:",
    KU: "Navbera vekirî:",
  },
  lastCorrectionRejected: {
    DE: "Der letzte Nachtragsantrag für diesen Zeitraum wurde abgelehnt.",
    EN: "The last correction request for this period was rejected.",
    IT: "L'ultima richiesta per questo periodo è stata rifiutata.",
    TR: "Bu dönem için son düzeltme talebi reddedildi.",
    SQ: "Kërkesa e fundit për këtë periudhë u refuzua.",
    RO: "Ultima cerere de corectare pentru această perioadă a fost respinsă.",
    KU: "Daxwaza dawî ya rastkirinê ji bo vê navberê hat redkirin.",
  },
  lastDecisionFor: {
    DE: "Letzte Entscheidung für:",
    EN: "Last decision for:",
    IT: "Ultima decisione per:",
    TR: "Son karar:",
    SQ: "Vendimi i fundit për:",
    RO: "Ultima decizie pentru:",
    KU: "Biryara dawî ji bo:",
  },
  sendNewCorrectionRequest: {
    DE: "Neuen Nachtragsantrag senden",
    EN: "Send new correction request",
    IT: "Invia nuova richiesta",
    TR: "Yeni düzeltme talebi gönder",
    SQ: "Dërgo kërkesë të re korrigjimi",
    RO: "Trimite o nouă cerere de corectare",
    KU: "Daxwaza nû ya rastkirinê bişîne",
  },
  correctionRequiredNow: {
    DE: "Für den ausgewählten Tag ist jetzt ein Nachtragsantrag erforderlich.",
    EN: "A correction request is now required for the selected day.",
    IT: "Per il giorno selezionato è ora richiesta una richiesta di integrazione.",
    TR: "Seçilen gün için artık düzeltme talebi gereklidir.",
    SQ: "Për ditën e zgjedhur tani kërkohet kërkesë korrigjimi.",
    RO: "Pentru ziua selectată este necesară acum o cerere de corectare.",
    KU: "Ji bo roja hilbijartî niha daxwaza rastkirinê pêwist e.",
  },
  correctionNotRequiredNow: {
    DE: "Für den ausgewählten Tag ist aktuell noch kein Nachtragsantrag erforderlich.",
    EN: "No correction request is currently required for the selected day.",
    IT: "Al momento non è richiesta una richiesta per il giorno selezionato.",
    TR: "Seçilen gün için şu anda düzeltme talebi gerekli değil.",
    SQ: "Aktualisht nuk kërkohet kërkesë korrigjimi për ditën e zgjedhur.",
    RO: "În prezent nu este necesară încă o cerere de corectare pentru ziua selectată.",
    KU: "Ji bo roja hilbijartî hêj daxwaza rastkirinê pêwist nîne.",
  },
  sendCorrectionRequest: {
    DE: "Nachtragsantrag senden",
    EN: "Send correction request",
    IT: "Invia richiesta",
    TR: "Düzeltme talebi gönder",
    SQ: "Dërgo kërkesën për korrigjim",
    RO: "Trimite cererea de corectare",
    KU: "Daxwaza rastkirinê bişîne",
  },
  start: { DE: "Beginn", EN: "Start", IT: "Inizio", TR: "Başlangıç", SQ: "Fillimi", RO: "Început", KU: "Destpêk" },
  end: { DE: "Ende", EN: "End", IT: "Fine", TR: "Bitiş", SQ: "Fundi", RO: "Sfârșit", KU: "Dawî" },
  workTimeCalculated: {
    DE: "Arbeitszeit (Tag berechnet)",
    EN: "Work time (day calculated)",
    IT: "Orario di lavoro (giorno calcolato)",
    TR: "Çalışma süresi (gün hesaplandı)",
    SQ: "Koha e punës (dita e llogaritur)",
    RO: "Timp de lucru (zi calculată)",
    KU: "Dema karê (roj hate hesibandin)",
  },
  gross: { DE: "Brutto", EN: "Gross", IT: "Lordo", TR: "Brüt", SQ: "Bruto", RO: "Brut", KU: "Berî derxistin" },
  legalBreak: {
    DE: "Gesetzliche Pause",
    EN: "Legal break",
    IT: "Pausa legale",
    TR: "Yasal mola",
    SQ: "Pushimi ligjor",
    RO: "Pauză legală",
    KU: "Navbera qanûnî",
  },
  net: { DE: "Netto", EN: "Net", IT: "Netto", TR: "Net", SQ: "Neto", RO: "Net", KU: "Safî" },
  activityPerformed: {
    DE: "Ausgeführte Tätigkeit",
    EN: "Performed activity",
    IT: "Attività svolta",
    TR: "Yapılan faaliyet",
    SQ: "Aktiviteti i kryer",
    RO: "Activitate efectuată",
    KU: "Çalakiya pêk hatî",
  },
  activityPlaceholder: {
    DE: "z.B. Fliesen verlegen, Verfugen...",
    EN: "e.g. laying tiles, grouting...",
    IT: "es. posa piastrelle, stuccatura...",
    TR: "örn. fayans döşeme, derz dolgu...",
    SQ: "p.sh. shtrim pllakash, fugim...",
    RO: "de ex. montare gresie, chituire...",
    KU: "mînak: danîna tileyan, dagirtina derzan...",
  },
  location: {
    DE: "Einsatzort",
    EN: "Location",
    IT: "Luogo di lavoro",
    TR: "Çalışma yeri",
    SQ: "Vendndodhja e punës",
    RO: "Locație",
    KU: "Cihê karê",
  },
  locationPlaceholder: {
    DE: "z.B. Musterstraße 5, München",
    EN: "e.g. Musterstraße 5, Munich",
    IT: "es. Musterstraße 5, Monaco",
    TR: "örn. Musterstraße 5, Münih",
    SQ: "p.sh. Musterstraße 5, Mynih",
    RO: "de ex. Musterstraße 5, München",
    KU: "mînak: Musterstraße 5, Munich",
  },
  noteForAdmin: {
    DE: "Notiz für Admin",
    EN: "Note for admin",
    IT: "Nota per admin",
    TR: "Yönetici için not",
    SQ: "Shënim për adminin",
    RO: "Notă pentru admin",
    KU: "Nîşe ji bo admin",
  },
  notePlaceholder: {
    DE: "Optional: Hinweise zum Einsatz, Material, Besonderheiten...",
    EN: "Optional: notes about the assignment, material, special cases...",
    IT: "Opzionale: note su incarico, materiale, particolarità...",
    TR: "İsteğe bağlı: görev, malzeme, özel durumlarla ilgili notlar...",
    SQ: "Opsionale: shënime për detyrën, materialin, veçoritë...",
    RO: "Opțional: note despre sarcină, material, particularități...",
    KU: "Vebijarkî: têbînî li ser kar, materyal, taybetî...",
  },
  noteOptionalVisibleToAdmin: {
    DE: "Diese Notiz ist optional und wird dem Admin beim Eintrag angezeigt.",
    EN: "This note is optional and will be shown to the admin with the entry.",
    IT: "Questa nota è facoltativa e sarà visibile all'admin.",
    TR: "Bu not isteğe bağlıdır ve kayıtla birlikte yöneticiye gösterilir.",
    SQ: "Ky shënim është opsional dhe do t'i shfaqet adminit te regjistrimi.",
    RO: "Această notă este opțională și va fi afișată adminului împreună cu înregistrarea.",
    KU: "Ev nîşe vebijarkî ye û bi tomarê re ji admin re tê nîşandan.",
  },
  travelMinutes: {
    DE: "Fahrzeit (Min.)",
    EN: "Travel time (min.)",
    IT: "Tempo di viaggio (min.)",
    TR: "Yol süresi (dk.)",
    SQ: "Koha e udhëtimit (min.)",
    RO: "Timp de deplasare (min.)",
    KU: "Dema rê (deq.)",
  },
  reset: {
    DE: "Zurücksetzen",
    EN: "Reset",
    IT: "Reimposta",
    TR: "Sıfırla",
    SQ: "Rivendos",
    RO: "Resetează",
    KU: "Vesaz bike",
  },
  saveEntry: {
    DE: "Eintrag speichern",
    EN: "Save entry",
    IT: "Salva voce",
    TR: "Kaydı kaydet",
    SQ: "Ruaj regjistrimin",
    RO: "Salvează înregistrarea",
    KU: "Tomarê tomar bike",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    RO: "Se salvează...",
    KU: "Tê tomarkirin...",
  },
  saveBreak: {
    DE: "Pause speichern",
    EN: "Save break",
    IT: "Salva pausa",
    TR: "Molayı kaydet",
    SQ: "Ruaj pushimin",
    RO: "Salvează pauza",
    KU: "Navberê tomar bike",
  },
  breakCapture: {
    DE: "Pause erfassen",
    EN: "Record break",
    IT: "Registra pausa",
    TR: "Mola gir",
    SQ: "Regjistro pushimin",
    RO: "Înregistrează pauza",
    KU: "Navberê tomar bike",
  },
  breakFrom: {
    DE: "Pause von",
    EN: "Break from",
    IT: "Pausa da",
    TR: "Mola başlangıcı",
    SQ: "Pushimi nga",
    RO: "Pauză de la",
    KU: "Navberê ji",
  },
  breakTo: {
    DE: "Pause bis",
    EN: "Break to",
    IT: "Pausa fino a",
    TR: "Mola bitişi",
    SQ: "Pushimi deri",
    RO: "Pauză până la",
    KU: "Navberê heta",
  },
  breakCalculation: {
    DE: "Pausenberechnung",
    EN: "Break calculation",
    IT: "Calcolo pausa",
    TR: "Mola hesaplaması",
    SQ: "Llogaritja e pushimit",
    RO: "Calculul pauzei",
    KU: "Hesabkirina navberê",
  },
  breakRuleInfo: {
    DE: "Die gesetzliche Pause richtet sich nach der gesamten Arbeitszeit des Tages. Falls du zu wenig Pause einträgst, ergänzt die App die fehlende Differenz automatisch.",
    EN: "The legal break depends on the total working time of the day. If you enter too little break time, the app automatically adds the missing difference.",
    IT: "La pausa legale dipende dal totale delle ore lavorate nel giorno. Se inserisci una pausa troppo breve, l'app aggiunge automaticamente la differenza mancante.",
    TR: "Yasal mola günün toplam çalışma süresine bağlıdır. Çok az mola girerseniz uygulama eksik farkı otomatik ekler.",
    SQ: "Pushimi ligjor varet nga koha totale e punës së ditës. Nëse vendosni shumë pak pushim, aplikacioni e plotëson automatikisht diferencën që mungon.",
    RO: "Pauza legală depinde de timpul total de lucru al zilei. Dacă introduci prea puțină pauză, aplicația adaugă automat diferența lipsă.",
    KU: "Navbera qanûnî li gorî tevahiya dema karê ya rojê ye. Heke tu navberek kêm binivîsî, sepan cudahiya mayî bixweber zêde dike.",
  },
  allEntries: {
    DE: "Alle Einträge",
    EN: "All entries",
    IT: "Tutte le voci",
    TR: "Tüm kayıtlar",
    SQ: "Të gjitha regjistrimet",
    RO: "Toate înregistrările",
    KU: "Hemû tomar",
  },
  year: { DE: "Jahr", EN: "Year", IT: "Anno", TR: "Yıl", SQ: "Viti", RO: "An", KU: "Sal" },
  allYears: {
    DE: "Alle Jahre",
    EN: "All years",
    IT: "Tutti gli anni",
    TR: "Tüm yıllar",
    SQ: "Të gjitha vitet",
    RO: "Toți anii",
    KU: "Hemû sal",
  },
  loadingEntries: {
    DE: "Lade Einträge...",
    EN: "Loading entries...",
    IT: "Caricamento voci...",
    TR: "Kayıtlar yükleniyor...",
    SQ: "Po ngarkohen regjistrimet...",
    RO: "Se încarcă înregistrările...",
    KU: "Tomar têne barkirin...",
  },
  noEntriesForYear: {
    DE: "Keine Einträge für das ausgewählte Jahr vorhanden.",
    EN: "No entries available for the selected year.",
    IT: "Nessuna voce disponibile per l'anno selezionato.",
    TR: "Seçilen yıl için kayıt yok.",
    SQ: "Nuk ka regjistrime për vitin e zgjedhur.",
    RO: "Nu există înregistrări pentru anul selectat.",
    KU: "Ji bo sala hilbijartî tomar tune ne.",
  },
  expandCollapse: {
    DE: "Ein-/Ausklappen",
    EN: "Expand/collapse",
    IT: "Espandi/comprimi",
    TR: "Aç/kapat",
    SQ: "Hap/mbyll",
    RO: "Extinde/restrânge",
    KU: "Veke/bigire",
  },
  entry: { DE: "Eintrag", EN: "entry", IT: "voce", TR: "kayıt", SQ: "regjistrim", RO: "înregistrare", KU: "tomar" },
  entries: { DE: "Einträge", EN: "entries", IT: "voci", TR: "kayıt", SQ: "regjistrime", RO: "înregistrări", KU: "tomar" },
  break: { DE: "Pause", EN: "break", IT: "pausa", TR: "mola", SQ: "pushim", RO: "pauză", KU: "navber" },
  showBreakDetails: {
    DE: "Pausen-Details anzeigen",
    EN: "Show break details",
    IT: "Mostra dettagli pausa",
    TR: "Mola detaylarını göster",
    SQ: "Shfaq detajet e pushimit",
    RO: "Afișează detaliile pauzei",
    KU: "Hûrguliyên navberê nîşan bide",
  },
  oClock: {
    DE: "Uhr",
    EN: "",
    IT: "",
    TR: "",
    SQ: "",
    RO: "",
    KU: "",
  },
  noActivityStored: {
    DE: "Keine Tätigkeit hinterlegt",
    EN: "No activity stored",
    IT: "Nessuna attività salvata",
    TR: "Kayıtlı faaliyet yok",
    SQ: "Nuk ka aktivitet të ruajtur",
    RO: "Nicio activitate salvată",
    KU: "Çalakî nehatiye tomar kirin",
  },
  noLocationStored: {
    DE: "Keine Baustelle / Adresse hinterlegt",
    EN: "No site / address stored",
    IT: "Nessun cantiere / indirizzo salvato",
    TR: "Kayıtlı şantiye / adres yok",
    SQ: "Nuk ka kantier / adresë të ruajtur",
    RO: "Niciun șantier / adresă salvată",
    KU: "Cihê şantiyê / navnîşan nehatiye tomar kirin",
  },
  travelTime: {
    DE: "Fahrtzeit:",
    EN: "Travel time:",
    IT: "Tempo di viaggio:",
    TR: "Yol süresi:",
    SQ: "Koha e udhëtimit:",
    RO: "Timp de deplasare:",
    KU: "Dema rê:",
  },
  showDetails: {
    DE: "Details anzeigen",
    EN: "Show details",
    IT: "Mostra dettagli",
    TR: "Detayları göster",
    SQ: "Shfaq detajet",
    RO: "Afișează detaliile",
    KU: "Hûrguliyan nîşan bide",
  },
  showNote: {
    DE: "Notiz anzeigen",
    EN: "Show note",
    IT: "Mostra nota",
    TR: "Notu göster",
    SQ: "Shfaq shënimin",
    RO: "Afișează nota",
    KU: "Nîşeyê nîşan bide",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    RO: "Editează",
    KU: "Sererast bike",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    RO: "Șterge",
    KU: "Jê bibe",
  },
  workTimeDetails: {
    DE: "Arbeitszeit-Details",
    EN: "Work time details",
    IT: "Dettagli orario di lavoro",
    TR: "Çalışma süresi detayları",
    SQ: "Detajet e kohës së punës",
    RO: "Detalii timp de lucru",
    KU: "Hûrguliyên dema karê",
  },
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    RO: "Închide",
    KU: "Bigire",
  },
  dateAndTime: {
    DE: "Datum & Zeit",
    EN: "Date & time",
    IT: "Data e ora",
    TR: "Tarih ve saat",
    SQ: "Data dhe ora",
    RO: "Dată și oră",
    KU: "Dîrok û dem",
  },
  netWorkTime: {
    DE: "Netto-Arbeitszeit",
    EN: "Net work time",
    IT: "Orario netto",
    TR: "Net çalışma süresi",
    SQ: "Koha neto e punës",
    RO: "Timp de lucru net",
    KU: "Dema safî ya karê",
  },
  siteOrAddress: {
    DE: "Baustelle / Adresse",
    EN: "Site / address",
    IT: "Cantiere / indirizzo",
    TR: "Şantiye / adres",
    SQ: "Kantieri / adresa",
    RO: "Șantier / adresă",
    KU: "Cihê karê / navnîşan",
  },
  breakDetails: {
    DE: "Pausen-Details",
    EN: "Break details",
    IT: "Dettagli pausa",
    TR: "Mola detayları",
    SQ: "Detajet e pushimit",
    RO: "Detalii pauză",
    KU: "Hûrguliyên navberê",
  },
  manualBreak: {
    DE: "Manuell eingetragene Pause",
    EN: "Manually entered break",
    IT: "Pausa inserita manualmente",
    TR: "Elle girilen mola",
    SQ: "Pushimi i futur manualisht",
    RO: "Pauză introdusă manual",
    KU: "Navbera bi destan hatiye nivîsîn",
  },
  noManualBreak: {
    DE: "Keine manuelle Pause eingetragen",
    EN: "No manual break entered",
    IT: "Nessuna pausa manuale inserita",
    TR: "Elle girilmiş mola yok",
    SQ: "Nuk ka pushim manual të futur",
    RO: "Nicio pauză manuală introdusă",
    KU: "Navbera bi destan nehatiye nivîsîn",
  },
  legallyRequired: {
    DE: "Gesetzlich erforderlich",
    EN: "Legally required",
    IT: "Legalmente richiesto",
    TR: "Yasal olarak gerekli",
    SQ: "E kërkuar ligjërisht",
    RO: "Necesar legal",
    KU: "Ji hêla qanûnê ve pêwist",
  },
  autoCompleted: {
    DE: "Automatisch ergänzt",
    EN: "Automatically added",
    IT: "Aggiunto automaticamente",
    TR: "Otomatik eklendi",
    SQ: "Plotësuar automatikisht",
    RO: "Completat automat",
    KU: "Bixweber hate zêdekirin",
  },
  noAutoCompletion: {
    DE: "Keine automatische Ergänzung",
    EN: "No automatic addition",
    IT: "Nessuna integrazione automatica",
    TR: "Otomatik ekleme yok",
    SQ: "Nuk ka plotësim automatik",
    RO: "Fără completare automată",
    KU: "Zêdekirina bixweber tune ye",
  },
  effectiveBreakTotal: {
    DE: "Wirksame Pause gesamt",
    EN: "Effective break total",
    IT: "Pausa effettiva totale",
    TR: "Toplam geçerli mola",
    SQ: "Pushimi efektiv total",
    RO: "Total pauză efectivă",
    KU: "Tevahiya navbera bi bandor",
  },
  note: {
    DE: "Notiz",
    EN: "Note",
    IT: "Nota",
    TR: "Not",
    SQ: "Shënim",
    RO: "Notă",
    KU: "Nîşe",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    RO: "Nicio notă disponibilă.",
    KU: "Nîşe tune ye.",
  },
  selectedDate: {
    DE: "Ausgewähltes Datum",
    EN: "Selected date",
    IT: "Data selezionata",
    TR: "Seçilen tarih",
    SQ: "Data e zgjedhur",
    RO: "Data selectată",
    KU: "Dîroka hilbijartî",
  },
  serverDeterminesCorrectionRange: {
    DE: "Der Server ermittelt automatisch den ältesten fehlenden Arbeitstag bis zu diesem Datum und erstellt daraus den passenden Nachtragszeitraum.",
    EN: "The server automatically determines the oldest missing workday up to this date and creates the matching correction period.",
    IT: "Il server determina automaticamente il giorno lavorativo mancante più vecchio fino a questa data e crea l'intervallo corretto.",
    TR: "Sunucu bu tarihe kadar en eski eksik iş gününü otomatik belirler ve uygun düzeltme aralığını oluşturur.",
    SQ: "Serveri përcakton automatikisht ditën më të vjetër të munguar të punës deri në këtë datë dhe krijon periudhën përkatëse.",
    RO: "Serverul determină automat cea mai veche zi de lucru lipsă până la această dată și creează perioada de corectare corespunzătoare.",
    KU: "Server bixweber roja karê ya herî kevn a wenda heta vê dîrokê diyar dike û navbera guncaw çêdike.",
  },
  existingCorrectionInfoLoading: {
    DE: "Bestehende Nachtragsinformationen werden geladen...",
    EN: "Loading existing correction information...",
    IT: "Caricamento informazioni esistenti...",
    TR: "Mevcut düzeltme bilgileri yükleniyor...",
    SQ: "Po ngarkohen informacionet ekzistuese të korrigjimit...",
    RO: "Se încarcă informațiile existente despre corectare...",
    KU: "Agahiyên rastkirinê yên heyî têne barkirin...",
  },
  activeUnlockAlreadyExists: {
    DE: "Für den ausgewählten Tag existiert bereits eine aktive Freigabe. Ein neuer Antrag ist aktuell nicht nötig.",
    EN: "An active approval already exists for the selected day. A new request is not needed right now.",
    IT: "Per il giorno selezionato esiste già un'approvazione attiva. Una nuova richiesta non è necessaria al momento.",
    TR: "Seçilen gün için zaten aktif bir onay var. Şu anda yeni bir talep gerekli değil.",
    SQ: "Për ditën e zgjedhur ekziston tashmë një miratim aktiv. Një kërkesë e re nuk nevojitet tani.",
    RO: "Pentru ziua selectată există deja o aprobare activă. O nouă cerere nu este necesară acum.",
    KU: "Ji bo roja hilbijartî berê xweşandinê çalak heye. Naha daxwazek nû ne pêwist e.",
  },
  correctionRequired: {
    DE: "Ein Nachtragsantrag ist erforderlich.",
    EN: "A correction request is required.",
    IT: "È richiesta una richiesta di integrazione.",
    TR: "Düzeltme talebi gereklidir.",
    SQ: "Kërkohet një kërkesë korrigjimi.",
    RO: "Este necesară o cerere de corectare.",
    KU: "Daxwaza rastkirinê pêwist e.",
  },
  missingDaysUntilLock: {
    DE: "fehlende Arbeitstage bis zur Sperrung.",
    EN: "missing workdays until lock.",
    IT: "giorni lavorativi mancanti fino al blocco.",
    TR: "kilide kadar eksik iş günü.",
    SQ: "ditë pune të munguara deri në bllokim.",
    RO: "zile de lucru lipsă până la blocare.",
    KU: "rojên karê yên wenda heta girtinê.",
  },
  sendRequest: {
    DE: "Antrag senden",
    EN: "Send request",
    IT: "Invia richiesta",
    TR: "Talep gönder",
    SQ: "Dërgo kërkesën",
    RO: "Trimite cererea",
    KU: "Daxwazê bişîne",
  },
  editEntry: {
    DE: "Eintrag bearbeiten",
    EN: "Edit entry",
    IT: "Modifica voce",
    TR: "Kaydı düzenle",
    SQ: "Ndrysho regjistrimin",
    RO: "Editează înregistrarea",
    KU: "Tomarê sererast bike",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    RO: "Salvează modificările",
    KU: "Guherînan tomar bike",
  },
  assignmentManagedServerSide: {
    DE: "Zuordnung wird serverseitig automatisch verwaltet.",
    EN: "Assignment is managed automatically on the server side.",
    IT: "L'assegnazione è gestita automaticamente dal server.",
    TR: "Atama sunucu tarafında otomatik yönetilir.",
    SQ: "Caktimi menaxhohet automatikisht nga serveri.",
    RO: "Alocarea este gestionată automat pe partea de server.",
    KU: "Girêdan li aliyê serverê bixweber tê rêvebirin.",
  },
  performedActivity: {
    DE: "Ausgeführte Tätigkeit",
    EN: "Performed activity",
    IT: "Attività svolta",
    TR: "Yapılan faaliyet",
    SQ: "Aktiviteti i kryer",
    RO: "Activitate efectuată",
    KU: "Çalakiya pêk hatî",
  },
  travelTimeMin: {
    DE: "Fahrzeit (Min.)",
    EN: "Travel time (min.)",
    IT: "Tempo di viaggio (min.)",
    TR: "Yol süresi (dk.)",
    SQ: "Koha e udhëtimit (min.)",
    RO: "Timp de deplasare (min.)",
    KU: "Dema rê (deq.)",
  },
  changesSaveFailed: {
    DE: "Bearbeiten fehlgeschlagen.",
    EN: "Editing failed.",
    IT: "Modifica non riuscita.",
    TR: "Düzenleme başarısız oldu.",
    SQ: "Ndryshimi dështoi.",
    RO: "Editarea a eșuat.",
    KU: "Sererastkirin bi ser neket.",
  },
  timesheetFutureDateEditForbidden: {
    DE: "Du kannst keine Einträge für zukünftige Tage bearbeiten.",
    EN: "You cannot edit entries for future days.",
    IT: "Non puoi modificare voci per giorni futuri.",
    TR: "Gelecek günler için kayıt düzenleyemezsiniz.",
    SQ: "Nuk mund të ndryshoni regjistrime për ditë të ardhshme.",
    RO: "Nu poți edita înregistrări pentru zile viitoare.",
    KU: "Tu nikarî tomarên rojên pêşerojê sererast bikî.",
  },
  timesheetOlderMissingEntriesFirst: {
    DE: "Dir fehlen noch Arbeitseinträge ab dem {date}. Bitte trage zuerst die ältesten fehlenden Tage nach.",
    EN: "You still have missing work entries starting from {date}. Please add the oldest missing days first.",
    IT: "Ti mancano ancora registrazioni di lavoro a partire dal {date}. Inserisci prima i giorni mancanti più vecchi.",
    TR: "{date} tarihinden itibaren hâlâ eksik çalışma kayıtlarınız var. Lütfen önce en eski eksik günleri girin.",
    SQ: "Ju mungojnë ende regjistrime pune duke filluar nga {date}. Ju lutem regjistroni së pari ditët më të vjetra që mungojnë.",
    RO: "Îți mai lipsesc înregistrări de muncă începând cu {date}. Te rugăm să introduci mai întâi cele mai vechi zile lipsă.",
    KU: "Ji {date} û pê ve hîn jî tomarên karê te kêm in. Ji kerema xwe pêşî rojên herî kevn ên winda binivîse.",
  },
  timesheetLockedDayRequiresCorrection: {
    DE: "Dieser vergangene Tag ist gesperrt. Bitte stelle einen Nachtragsantrag, damit der Admin ihn freigeben kann.",
    EN: "This past day is locked. Please submit a correction request so the admin can approve it.",
    IT: "Questo giorno passato è bloccato. Invia una richiesta di integrazione affinché l'admin possa approvarlo.",
    TR: "Bu geçmiş gün kilitlidir. Lütfen yöneticinin onaylayabilmesi için bir düzeltme talebi gönderin.",
    SQ: "Kjo ditë e kaluar është e bllokuar. Ju lutem dërgoni një kërkesë korrigjimi që admini ta miratojë.",
    RO: "Această zi trecută este blocată. Te rugăm să trimiți o cerere de corectare pentru ca adminul să o poată aproba.",
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
  | "newAbsenceRequestPushTitle"
  | "invalidRequest"
  | "assignedToUserIdMissing"
  | "titleMissing"
  | "invalidCategory"
  | "invalidRequiredAction"
  | "invalidReferenceRange"
  | "tasksOnlyForEmployees"
  | "newTaskPushTitle";

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
    RO: "Administrează sarcinile",
    KU: "Erkan birêve bibe",
  },
  loading: {
    DE: "Lade...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    RO: "Se încarcă...",
    KU: "Tê barkirin...",
  },
  loadError: {
    DE: "Aufgaben konnten nicht geladen werden.",
    EN: "Tasks could not be loaded.",
    IT: "Impossibile caricare le attività.",
    TR: "Görevler yüklenemedi.",
    SQ: "Detyrat nuk mund të ngarkoheshin.",
    RO: "Sarcinile nu au putut fi încărcate.",
    KU: "Erk nehatin barkirin.",
  },
  unexpectedServerResponse: {
    DE: "Unerwartete Antwort vom Server.",
    EN: "Unexpected response from server.",
    IT: "Risposta imprevista dal server.",
    TR: "Sunucudan beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur nga serveri.",
    RO: "Răspuns neașteptat de la server.",
    KU: "Bersiva nexwestî ji serverê.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Aufgaben.",
    EN: "Network error while loading tasks.",
    IT: "Errore di rete durante il caricamento delle attività.",
    TR: "Görevler yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të detyrave.",
    RO: "Eroare de rețea la încărcarea sarcinilor.",
    KU: "Dema barkirina erkan de xeletiya torê çêbû.",
  },
  createTaskError: {
    DE: "Aufgabe konnte nicht erstellt werden.",
    EN: "Task could not be created.",
    IT: "Impossibile creare l'attività.",
    TR: "Görev oluşturulamadı.",
    SQ: "Detyra nuk mund të krijohej.",
    RO: "Sarcina nu a putut fi creată.",
    KU: "Erk nehate afirandin.",
  },
  createTaskSuccess: {
    DE: "Aufgabe wurde erstellt.",
    EN: "Task was created.",
    IT: "Attività creata.",
    TR: "Görev oluşturuldu.",
    SQ: "Detyra u krijua.",
    RO: "Sarcina a fost creată.",
    KU: "Erk hate afirandin.",
  },
  networkCreateError: {
    DE: "Netzwerkfehler beim Erstellen der Aufgabe.",
    EN: "Network error while creating task.",
    IT: "Errore di rete durante la creazione dell'attività.",
    TR: "Görev oluşturulurken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë krijimit të detyrës.",
    RO: "Eroare de rețea la crearea sarcinii.",
    KU: "Dema afirandina erkê de xeletiya torê çêbû.",
  },
  createTaskTitle: {
    DE: "Neue Aufgabe erstellen",
    EN: "Create new task",
    IT: "Crea nuova attività",
    TR: "Yeni görev oluştur",
    SQ: "Krijo detyrë të re",
    RO: "Creează o sarcină nouă",
    KU: "Erkeke nû biafirîne",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    RO: "Angajat",
    KU: "Karmend",
  },
  pleaseChoose: {
    DE: "— Bitte wählen —",
    EN: "— Please choose —",
    IT: "— Seleziona —",
    TR: "— Lütfen seçin —",
    SQ: "— Ju lutem zgjidhni —",
    RO: "— Te rugăm să alegi —",
    KU: "— Ji kerema xwe hilbijêre —",
  },
  title: {
    DE: "Titel",
    EN: "Title",
    IT: "Titolo",
    TR: "Başlık",
    SQ: "Titulli",
    RO: "Titlu",
    KU: "Sernav",
  },
  description: {
    DE: "Beschreibung",
    EN: "Description",
    IT: "Descrizione",
    TR: "Açıklama",
    SQ: "Përshkrimi",
    RO: "Descriere",
    KU: "Danasîn",
  },
  category: {
    DE: "Kategorie",
    EN: "Category",
    IT: "Categoria",
    TR: "Kategori",
    SQ: "Kategoria",
    RO: "Categorie",
    KU: "Kategorî",
  },
  requiredAction: {
    DE: "Pflichtaktion",
    EN: "Required action",
    IT: "Azione richiesta",
    TR: "Gerekli işlem",
    SQ: "Veprimi i detyrueshëm",
    RO: "Acțiune necesară",
    KU: "Çalakiya pêwîst",
  },
  referenceStart: {
    DE: "Bezugszeitraum von",
    EN: "Reference period from",
    IT: "Periodo di riferimento da",
    TR: "İlgili dönem başlangıcı",
    SQ: "Periudha referente nga",
    RO: "Perioada de referință de la",
    KU: "Dema referansê ji",
  },
  referenceEnd: {
    DE: "Bezugszeitraum bis",
    EN: "Reference period until",
    IT: "Periodo di riferimento fino a",
    TR: "İlgili dönem bitişi",
    SQ: "Periudha referente deri më",
    RO: "Perioada de referință până la",
    KU: "Dema referansê heta",
  },
  createTaskSubmitting: {
    DE: "Erstelle...",
    EN: "Creating...",
    IT: "Creazione in corso...",
    TR: "Oluşturuluyor...",
    SQ: "Duke krijuar...",
    RO: "Se creează...",
    KU: "Tê afirandin...",
  },
  createTaskSubmit: {
    DE: "Aufgabe erstellen",
    EN: "Create task",
    IT: "Crea attività",
    TR: "Görev oluştur",
    SQ: "Krijo detyrë",
    RO: "Creează sarcina",
    KU: "Erk biafirîne",
  },
  tasksOverview: {
    DE: "Aufgabenübersicht",
    EN: "Task overview",
    IT: "Panoramica attività",
    TR: "Görev genel görünümü",
    SQ: "Përmbledhje detyrash",
    RO: "Prezentare generală a sarcinilor",
    KU: "Têgihîştina erkan",
  },
  searchPlaceholder: {
    DE: "Titel, Beschreibung oder Mitarbeiter suchen…",
    EN: "Search title, description, or employee…",
    IT: "Cerca titolo, descrizione o dipendente…",
    TR: "Başlık, açıklama veya çalışan ara…",
    SQ: "Kërko titull, përshkrim ose punonjës…",
    RO: "Caută titlu, descriere sau angajat…",
    KU: "Sernav, danasîn an karmend bigere…",
  },
  allCategories: {
    DE: "Alle Kategorien",
    EN: "All categories",
    IT: "Tutte le categorie",
    TR: "Tüm kategoriler",
    SQ: "Të gjitha kategoritë",
    RO: "Toate categoriile",
    KU: "Hemû kategorî",
  },
  openTasks: {
    DE: "Offene Aufgaben",
    EN: "Open tasks",
    IT: "Attività aperte",
    TR: "Açık görevler",
    SQ: "Detyra të hapura",
    RO: "Sarcini deschise",
    KU: "Erkên vekirî",
  },
  noOpenTasks: {
    DE: "Keine offenen Aufgaben vorhanden.",
    EN: "No open tasks available.",
    IT: "Nessuna attività aperta disponibile.",
    TR: "Açık görev yok.",
    SQ: "Nuk ka detyra të hapura.",
    RO: "Nu există sarcini deschise.",
    KU: "Ti erkê vekirî tune ye.",
  },
  completedTasks: {
    DE: "Erledigte Aufgaben",
    EN: "Completed tasks",
    IT: "Attività completate",
    TR: "Tamamlanan görevler",
    SQ: "Detyra të përfunduara",
    RO: "Sarcini finalizate",
    KU: "Erkên temam bûyî",
  },
  noCompletedTasks: {
    DE: "Keine erledigten Aufgaben vorhanden.",
    EN: "No completed tasks available.",
    IT: "Nessuna attività completata disponibile.",
    TR: "Tamamlanan görev yok.",
    SQ: "Nuk ka detyra të përfunduara.",
    RO: "Nu există sarcini finalizate.",
    KU: "Ti erkê temam bûyî tune ye.",
  },
  employeePrefix: {
    DE: "Mitarbeiter:",
    EN: "Employee:",
    IT: "Dipendente:",
    TR: "Çalışan:",
    SQ: "Punonjësi:",
    RO: "Angajat:",
    KU: "Karmend:",
  },
  requiredPrefix: {
    DE: "Pflicht:",
    EN: "Required:",
    IT: "Obbligo:",
    TR: "Gerekli:",
    SQ: "Detyrim:",
    RO: "Obligatoriu:",
    KU: "Pêwîst:",
  },
  referenceRangePrefix: {
    DE: "Bezugszeitraum:",
    EN: "Reference period:",
    IT: "Periodo di riferimento:",
    TR: "İlgili dönem:",
    SQ: "Periudha referente:",
    RO: "Perioada de referință:",
    KU: "Dema referansê:",
  },
  open: {
    DE: "Öffnen",
    EN: "Open",
    IT: "Apri",
    TR: "Aç",
    SQ: "Hap",
    RO: "Deschide",
    KU: "Veke",
  },
  completedAt: {
    DE: "Erledigt am:",
    EN: "Completed on:",
    IT: "Completata il:",
    TR: "Tamamlanma tarihi:",
    SQ: "Përfunduar më:",
    RO: "Finalizat la:",
    KU: "Di vê rojê de temam bû:",
  },
  completedBy: {
    DE: "Erledigt von:",
    EN: "Completed by:",
    IT: "Completata da:",
    TR: "Tamamlayan:",
    SQ: "Përfunduar nga:",
    RO: "Finalizat de:",
    KU: "Temam kirin ji aliyê:",
  },
  noReviewRequired: {
    DE: "Keine Pflichtprüfung",
    EN: "No required review",
    IT: "Nessun controllo obbligatorio",
    TR: "Zorunlu kontrol yok",
    SQ: "Pa kontroll të detyrueshëm",
    RO: "Fără verificare obligatorie",
    KU: "Kontrola mecbûrî tune",
  },
  workEntryRequired: {
    DE: "Arbeitszeit-Eintrag erforderlich",
    EN: "Work time entry required",
    IT: "Registrazione orario richiesta",
    TR: "Çalışma süresi kaydı gerekli",
    SQ: "Kërkohet regjistrim i orarit të punës",
    RO: "Este necesară înregistrarea timpului de lucru",
    KU: "Tomarkirina demê ya karê pêwîst e",
  },
  vacationEntryRequired: {
    DE: "Urlaubs-Eintrag erforderlich",
    EN: "Vacation entry required",
    IT: "Registrazione ferie richiesta",
    TR: "İzin kaydı gerekli",
    SQ: "Kërkohet regjistrim i pushimit",
    RO: "Este necesară înregistrarea concediului",
    KU: "Tomarkirina betlaneyê pêwîst e",
  },
  sickEntryRequired: {
    DE: "Krankheits-Eintrag erforderlich",
    EN: "Sick leave entry required",
    IT: "Registrazione malattia richiesta",
    TR: "Hastalık kaydı gerekli",
    SQ: "Kërkohet regjistrim i sëmundjes",
    RO: "Este necesară înregistrarea concediului medical",
    KU: "Tomarkirina nexweşiyê pêwîst e",
  },
  categoryWorkTime: {
    DE: "Arbeitszeit",
    EN: "Work time",
    IT: "Orario di lavoro",
    TR: "Çalışma süresi",
    SQ: "Orari i punës",
    RO: "Timp de lucru",
    KU: "Dema karê",
  },
  categoryVacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    RO: "Concediu",
    KU: "Betlane",
  },
  categorySickness: {
    DE: "Krankheit",
    EN: "Sickness",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmundje",
    RO: "Boală",
    KU: "Nexweşî",
  },
  categoryGeneral: {
    DE: "Allgemein",
    EN: "General",
    IT: "Generale",
    TR: "Genel",
    SQ: "Përgjithshme",
    RO: "General",
    KU: "Giştî",
  },
  until: {
    DE: "bis",
    EN: "to",
    IT: "fino a",
    TR: "ile",
    SQ: "deri më",
    RO: "până la",
    KU: "heta",
  },
  dash: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    RO: "—",
    KU: "—",
  },
  taskNotFound: {
    DE: "Aufgabe nicht gefunden.",
    EN: "Task not found.",
    IT: "Attività non trovata.",
    TR: "Görev bulunamadı.",
    SQ: "Detyra nuk u gjet.",
    RO: "Sarcina nu a fost găsită.",
    KU: "Erk nehat dîtin.",
  },
  noAccess: {
    DE: "Kein Zugriff.",
    EN: "No access.",
    IT: "Nessun accesso.",
    TR: "Erişim yok.",
    SQ: "Nuk ka qasje.",
    RO: "Fără acces.",
    KU: "Gihiştin tune ye.",
  },
  taskAlreadyCompleted: {
    DE: "Aufgabe ist bereits erledigt.",
    EN: "Task is already completed.",
    IT: "L'attività è già completata.",
    TR: "Görev zaten tamamlandı.",
    SQ: "Detyra është tashmë e kryer.",
    RO: "Sarcina este deja finalizată.",
    KU: "Erk jixwe qediya ye.",
  },
  referenceWithoutDate: {
    DE: "ohne Datum",
    EN: "without date",
    IT: "senza data",
    TR: "tarihsiz",
    SQ: "pa datë",
    RO: "fără dată",
    KU: "bê dîrok",
  },
  taskCompleteRequirementWorkTime: {
    DE: "Die Aufgabe kann erst erledigt werden, wenn für {referenceLabel} alle erforderlichen Arbeitszeiteinträge vorhanden sind.",
    EN: "The task can only be completed once all required work time entries exist for {referenceLabel}.",
    IT: "L'attività può essere completata solo quando per {referenceLabel} sono presenti tutte le registrazioni richieste dell'orario di lavoro.",
    TR: "Görev ancak {referenceLabel} için gerekli tüm çalışma süresi kayıtları mevcut olduğunda tamamlanabilir.",
    SQ: "Detyra mund të përfundohet vetëm kur për {referenceLabel} ekzistojnë të gjitha regjistrimet e kërkuara të kohës së punës.",
    RO: "Sarcina poate fi finalizată doar când există toate înregistrările necesare ale timpului de lucru pentru {referenceLabel}.",
    KU: "Erk tenê dema ku ji bo {referenceLabel} hemû tomarên pêwîst ên dema karê hene dikare were temamkirin.",
  },
  taskCompleteRequirementVacation: {
    DE: "Die Aufgabe kann erst erledigt werden, wenn für {referenceLabel} alle erforderlichen Urlaubseinträge oder passenden Urlaubsanträge vorhanden sind.",
    EN: "The task can only be completed once all required vacation entries or matching vacation requests exist for {referenceLabel}.",
    IT: "L'attività può essere completata solo quando per {referenceLabel} sono presenti tutte le registrazioni ferie richieste o le richieste ferie corrispondenti.",
    TR: "Görev ancak {referenceLabel} için gerekli tüm izin kayıtları veya uygun izin talepleri mevcut olduğunda tamamlanabilir.",
    SQ: "Detyra mund të përfundohet vetëm kur për {referenceLabel} ekzistojnë të gjitha regjistrimet e kërkuara të pushimit ose kërkesat përkatëse për pushim.",
    RO: "Sarcina poate fi finalizată doar când există toate înregistrările necesare de concediu sau cererile corespunzătoare pentru {referenceLabel}.",
    KU: "Erk tenê dema ku ji bo {referenceLabel} hemû tomarên pêwîst ên betlaneyê an daxwazên guncaw ên betlaneyê hene dikare were temamkirin.",
  },
  taskCompleteRequirementSickness: {
    DE: "Die Aufgabe kann erst erledigt werden, wenn für {referenceLabel} alle erforderlichen Krankheitseinträge oder passenden Krankheitsanträge vorhanden sind.",
    EN: "The task can only be completed once all required sickness entries or matching sickness requests exist for {referenceLabel}.",
    IT: "L'attività può essere completata solo quando per {referenceLabel} sono presenti tutte le registrazioni di malattia richieste o le richieste corrispondenti.",
    TR: "Görev ancak {referenceLabel} için gerekli tüm hastalık kayıtları veya uygun hastalık talepleri mevcut olduğunda tamamlanabilir.",
    SQ: "Detyra mund të përfundohet vetëm kur për {referenceLabel} ekzistojnë të gjitha regjistrimet e kërkuara të sëmundjes ose kërkesat përkatëse.",
    RO: "Sarcina poate fi finalizată doar când există toate înregistrările necesare de boală sau cererile corespunzătoare pentru {referenceLabel}.",
    KU: "Erk tenê dema ku ji bo {referenceLabel} hemû tomarên pêwîst ên nexweşiyê an daxwazên guncaw ên nexweşiyê hene dikare were temamkirin.",
  },
  taskCompleteRequirementGeneric: {
    DE: "Die geforderte Aktion wurde noch nicht erfüllt.",
    EN: "The required action has not been fulfilled yet.",
    IT: "L'azione richiesta non è stata ancora completata.",
    TR: "Gerekli işlem henüz yerine getirilmedi.",
    SQ: "Veprimi i kërkuar nuk është përmbushur ende.",
    RO: "Acțiunea necesară nu a fost încă îndeplinită.",
    KU: "Çalakiya pêwîst hîn nehatiye cîbicîkirin.",
  },
  notLoggedIn: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk jeni i identifikuar.",
    RO: "Neautentificat.",
    KU: "Têketin nehatiye kirin.",
  },
  invalidDate: {
    DE: "Ungültiges Datum.",
    EN: "Invalid date.",
    IT: "Data non valida.",
    TR: "Geçersiz tarih.",
    SQ: "Datë e pavlefshme.",
    RO: "Dată invalidă.",
    KU: "Dîroka nederbasdar.",
  },
  breakRangeIncomplete: {
    DE: "Bitte Pause von und bis vollständig eingeben.",
    EN: "Please enter both break start and break end.",
    IT: "Inserisci sia l'inizio sia la fine della pausa.",
    TR: "Lütfen mola başlangıcı ve bitişini eksiksiz girin.",
    SQ: "Ju lutem plotësoni fillimin dhe mbarimin e pushimit.",
    RO: "Te rugăm să introduci complet începutul și sfârșitul pauzei.",
    KU: "Ji kerema xwe destpêk û dawiya navberê bi temamî binivîse.",
  },
  invalidBreakStart: {
    DE: "Pause-Beginn ist ungültig.",
    EN: "Break start is invalid.",
    IT: "L'inizio della pausa non è valido.",
    TR: "Mola başlangıcı geçersiz.",
    SQ: "Fillimi i pushimit është i pavlefshëm.",
    RO: "Începutul pauzei este invalid.",
    KU: "Destpêka navberê nederbasdar e.",
  },
  invalidBreakEnd: {
    DE: "Pause-Ende ist ungültig.",
    EN: "Break end is invalid.",
    IT: "La fine della pausa non è valida.",
    TR: "Mola bitişi geçersiz.",
    SQ: "Mbarimi i pushimit është i pavlefshëm.",
    RO: "Sfârșitul pauzei este invalid.",
    KU: "Dawiya navberê nederbasdar e.",
  },
  notAllowed: {
    DE: "Nicht erlaubt.",
    EN: "Not allowed.",
    IT: "Non consentito.",
    TR: "İzin verilmiyor.",
    SQ: "Nuk lejohet.",
    RO: "Nu este permis.",
    KU: "Destûr nayê dayîn.",
  },
  employeeNotFoundOrInactive: {
    DE: "Mitarbeiter nicht gefunden oder inaktiv.",
    EN: "Employee not found or inactive.",
    IT: "Dipendente non trovato o inattivo.",
    TR: "Çalışan bulunamadı veya pasif.",
    SQ: "Punonjësi nuk u gjet ose është joaktiv.",
    RO: "Angajatul nu a fost găsit sau este inactiv.",
    KU: "Karmend nehate dîtin an neçalak e.",
  },
  workTimeEntryRequiredFirst: {
    DE: "Trage erst deine Arbeitszeit für diesen Tag ein.",
    EN: "Please enter your work time for this day first.",
    IT: "Inserisci prima il tuo orario di lavoro per questo giorno.",
    TR: "Lütfen önce bu gün için çalışma süreni gir.",
    SQ: "Ju lutem fillimisht regjistroni orarin e punës për këtë ditë.",
    RO: "Te rugăm să introduci mai întâi timpul tău de lucru pentru această zi.",
    KU: "Ji kerema xwe pêşî ji bo vê rojê dema karê xwe binivîse.",
  },
  taskCompletedPushTitle: {
    DE: "Aufgabe erledigt",
    EN: "Task completed",
    IT: "Attività completata",
    TR: "Görev tamamlandı",
    SQ: "Detyra u përfundua",
    RO: "Sarcină finalizată",
    KU: "Erk hate temamkirin",
  },
  invalidData: {
    DE: "Ungültige Daten.",
    EN: "Invalid data.",
    IT: "Dati non validi.",
    TR: "Geçersiz veriler.",
    SQ: "Të dhëna të pavlefshme.",
    RO: "Date invalide.",
    KU: "Daneyên nederbasdar.",
  },
  entryNotFound: {
    DE: "Eintrag nicht gefunden.",
    EN: "Entry not found.",
    IT: "Voce non trovata.",
    TR: "Kayıt bulunamadı.",
    SQ: "Regjistrimi nuk u gjet.",
    RO: "Înregistrarea nu a fost găsită.",
    KU: "Tomar nehate dîtin.",
  },
  idMissing: {
    DE: "ID fehlt.",
    EN: "ID is missing.",
    IT: "Manca l'ID.",
    TR: "Kimlik eksik.",
    SQ: "ID mungon.",
    RO: "Lipsește ID-ul.",
    KU: "ID tune ye.",
  },
  notFound: {
    DE: "Nicht gefunden.",
    EN: "Not found.",
    IT: "Non trovato.",
    TR: "Bulunamadı.",
    SQ: "Nuk u gjet.",
    RO: "Nu a fost găsit.",
    KU: "Nehate dîtin.",
  },
  sickOnlyFullDayRecorded: {
    DE: "Krankheit kann nur ganztägig erfasst werden.",
    EN: "Sickness can only be recorded as a full day.",
    IT: "La malattia può essere registrata solo per l'intera giornata.",
    TR: "Hastalık sadece tam gün olarak kaydedilebilir.",
    SQ: "Sëmundja mund të regjistrohet vetëm si ditë e plotë.",
    RO: "Boala poate fi înregistrată doar ca zi întreagă.",
    KU: "Nexweşî tenê dikare wekî rojek tevahî were tomar kirin.",
  },
  sickCannotBeUnpaidRecorded: {
    DE: "Krankheit darf nicht als unbezahlt erfasst werden.",
    EN: "Sickness cannot be recorded as unpaid.",
    IT: "La malattia non può essere registrata come non retribuita.",
    TR: "Hastalık ücretsiz olarak kaydedilemez.",
    SQ: "Sëmundja nuk mund të regjistrohet si e papaguar.",
    RO: "Boala nu poate fi înregistrată ca neplătită.",
    KU: "Nexweşî nikare wekî bêpere were tomar kirin.",
  },
  halfDaysOnlyForVacation: {
    DE: "Halbe Tage sind nur für Urlaub erlaubt.",
    EN: "Half days are only allowed for vacation.",
    IT: "Le mezze giornate sono consentite solo per le ferie.",
    TR: "Yarım günler yalnızca izin için geçerlidir.",
    SQ: "Gjysmë ditët lejohen vetëm për pushim.",
    RO: "Jumătățile de zi sunt permise doar pentru concediu.",
    KU: "Nîvroj tenê ji bo betlaneyê destûr heye.",
  },
  halfVacationOnlySingleDateCreate: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum angelegt werden.",
    EN: "A half vacation day can only be created for exactly one date.",
    IT: "Una mezza giornata di ferie può essere creata solo per una singola data.",
    TR: "Yarım izin günü yalnızca tek bir tarih için oluşturulabilir.",
    SQ: "Një gjysmë dite pushimi mund të krijohet vetëm për një datë të vetme.",
    RO: "O jumătate de zi de concediu poate fi creată doar pentru exact o singură dată.",
    KU: "Nîvroj betlaneyê tenê ji bo yek dîrokê dikare were afirandin.",
  },
  endDateBeforeStartDate: {
    DE: "Enddatum darf nicht vor Startdatum liegen.",
    EN: "End date must not be before start date.",
    IT: "La data di fine non può essere precedente alla data di inizio.",
    TR: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    SQ: "Data e mbarimit nuk mund të jetë para datës së fillimit.",
    RO: "Data de sfârșit nu poate fi înaintea datei de început.",
    KU: "Dîroka dawiyê nikare berî dîroka destpêkê be.",
  },
  crossYearAbsencesNotSupportedCreate: {
    DE: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr separat anlegen.",
    EN: "Absences spanning multiple years are not supported yet. Please create them separately for each calendar year.",
    IT: "Le assenze su più anni non sono ancora supportate. Creale separatamente per ogni anno solare.",
    TR: "Yıllar arası devreden devamsızlıklar henüz desteklenmiyor. Lütfen her takvim yılı için ayrı oluşturun.",
    SQ: "Mungesat që përfshijnë disa vite ende nuk mbështeten. Ju lutem krijojini veçmas për çdo vit kalendarik.",
    RO: "Absențele care se întind pe mai mulți ani nu sunt încă acceptate. Te rugăm să le creezi separat pentru fiecare an calendaristic.",
    KU: "Nebûna ku li ser çend salan dirêj dibin hêj nayên piştgirî kirin. Ji kerema xwe ji bo her sala salnameyê cuda biafirînin.",
  },
  employeesCannotCreateFinalAbsencesDirectly: {
    DE: "Mitarbeiter dürfen keine finalen Abwesenheiten direkt anlegen. Bitte Antrag stellen.",
    EN: "Employees cannot create final absences directly. Please submit a request.",
    IT: "I dipendenti non possono creare assenze definitive direttamente. Invia invece una richiesta.",
    TR: "Çalışanlar kesin devamsızlıkları doğrudan oluşturamaz. Lütfen talep oluşturun.",
    SQ: "Punonjësit nuk mund të krijojnë drejtpërdrejt mungesa përfundimtare. Ju lutem paraqisni një kërkesë.",
    RO: "Angajații nu pot crea direct absențe finale. Te rugăm să trimiți o cerere.",
    KU: "Karmend nikarin nebûnên dawî rasterast biafirînin. Ji kerema xwe daxwazek bişînin.",
  },
  noVacationWorkdaysInRange: {
    DE: "Im gewählten Zeitraum liegen keine Arbeitstage für Urlaub. Wochenenden werden automatisch nicht mitgezählt.",
    EN: "There are no workdays for vacation in the selected period. Weekends are excluded automatically.",
    IT: "Nel periodo selezionato non ci sono giorni lavorativi per le ferie. I fine settimana vengono esclusi automaticamente.",
    TR: "Seçilen aralıkta izin için iş günü yok. Hafta sonları otomatik olarak hariç tutulur.",
    SQ: "Në periudhën e zgjedhur nuk ka ditë pune për pushim. Fundjavat përjashtohen automatikisht.",
    RO: "În perioada selectată nu există zile lucrătoare pentru concediu. Weekendurile sunt excluse automat.",
    KU: "Di navbera hilbijartî de ji bo betlaneyê rojên kar tune ne. Dawiyên hefteyê bixweber nayên jimartin.",
  },
  toBeforeFrom: {
    DE: "Bis-Datum darf nicht vor Von-Datum liegen.",
    EN: "End date must not be before start date.",
    IT: "La data di fine non può essere precedente alla data di inizio.",
    TR: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    SQ: "Data e mbarimit nuk mund të jetë para datës së fillimit.",
    RO: "Data de sfârșit nu poate fi înaintea datei de început.",
    KU: "Dîroka dawiyê nikare berî dîroka destpêkê be.",
  },
  sickOnlyFullDay: {
    DE: "Krankheit kann nur ganztägig sein.",
    EN: "Sickness can only be full day.",
    IT: "La malattia può essere solo a giornata intera.",
    TR: "Hastalık yalnızca tam gün olabilir.",
    SQ: "Sëmundja mund të jetë vetëm me ditë të plotë.",
    RO: "Boala poate fi doar de zi întreagă.",
    KU: "Nexweşî tenê dikare tevahî rojekê be.",
  },
  sickCannotBeUnpaid: {
    DE: "Krankheit darf nicht unbezahlt sein.",
    EN: "Sickness cannot be unpaid.",
    IT: "La malattia non può essere non retribuita.",
    TR: "Hastalık ücretsiz olamaz.",
    SQ: "Sëmundja nuk mund të jetë e papaguar.",
    RO: "Boala nu poate fi neplătită.",
    KU: "Nexweşî nikare bêpere be.",
  },
  halfVacationOnlySingleDateEdit: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum bestehen.",
    EN: "A half vacation day can only exist for exactly one date.",
    IT: "Una mezza giornata di ferie può valere solo per una singola data.",
    TR: "Yarım izin günü yalnızca tek bir tarih için geçerli olabilir.",
    SQ: "Një gjysmë dite pushimi mund të vlejë vetëm për një datë të vetme.",
    RO: "O jumătate de zi de concediu poate exista doar pentru exact o singură dată.",
    KU: "Nîvroj betlaneyê tenê dikare ji bo yek dîrokê hebe.",
  },
  newEndBeforeNewStart: {
    DE: "Neues Enddatum darf nicht vor neuem Startdatum liegen.",
    EN: "New end date must not be before new start date.",
    IT: "La nuova data di fine non può essere precedente alla nuova data di inizio.",
    TR: "Yeni bitiş tarihi yeni başlangıç tarihinden önce olamaz.",
    SQ: "Data e re e mbarimit nuk mund të jetë para datës së re të fillimit.",
    RO: "Noua dată de sfârșit nu poate fi înaintea noii date de început.",
    KU: "Dîroka dawiyê ya nû nikare berî dîroka destpêkê ya nû be.",
  },
  crossYearAbsencesNotSupportedEdit: {
    DE: "Jahresübergreifende Abwesenheiten werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr separat bearbeiten.",
    EN: "Absences spanning multiple years are not supported yet. Please edit them separately for each calendar year.",
    IT: "Le assenze su più anni non sono ancora supportate. Modificale separatamente per ogni anno solare.",
    TR: "Yıllar arası devreden devamsızlıklar henüz desteklenmiyor. Lütfen her takvim yılı için ayrı düzenleyin.",
    SQ: "Mungesat që përfshijnë disa vite ende nuk mbështeten. Ju lutem ndryshojini veçmas për çdo vit kalendarik.",
    RO: "Absențele care se întind pe mai mulți ani nu sunt încă acceptate. Te rugăm să le editezi separat pentru fiecare an calendaristic.",
    KU: "Nebûna ku li ser çend salan dirêj dibin hêj nayên piştgirî kirin. Ji kerema xwe ji bo her sala salnameyê cuda biguherînin.",
  },
  oldPaidVacationUnitsInvalid: {
    DE: "Alte bezahlte Urlaubseinheiten sind ungültig.",
    EN: "Old paid vacation units are invalid.",
    IT: "Le vecchie unità di ferie retribuite non sono valide.",
    TR: "Eski ücretli izin birimleri geçersiz.",
    SQ: "Njësitë e vjetra të pushimit të paguar janë të pavlefshme.",
    RO: "Vechile unități de concediu plătit sunt invalide.",
    KU: "Yekeyên kevn ên betlaneya bi pere nederbasdar in.",
  },
  oldUnpaidVacationUnitsInvalid: {
    DE: "Alte unbezahlte Urlaubseinheiten sind ungültig.",
    EN: "Old unpaid vacation units are invalid.",
    IT: "Le vecchie unità di ferie non retribuite non sono valide.",
    TR: "Eski ücretsiz izin birimleri geçersiz.",
    SQ: "Njësitë e vjetra të pushimit të papaguar janë të pavlefshme.",
    RO: "Vechile unități de concediu neplătit sunt invalide.",
    KU: "Yekeyên kevn ên betlaneya bêpere nederbasdar in.",
  },
  newPaidVacationUnitsInvalid: {
    DE: "Neue bezahlte Urlaubseinheiten sind ungültig.",
    EN: "New paid vacation units are invalid.",
    IT: "Le nuove unità di ferie retribuite non sono valide.",
    TR: "Yeni ücretli izin birimleri geçersiz.",
    SQ: "Njësitë e reja të pushimit të paguar janë të pavlefshme.",
    RO: "Noile unități de concediu plătit sunt invalide.",
    KU: "Yekeyên nû ên betlaneya bi pere nederbasdar in.",
  },
  newUnpaidVacationUnitsInvalid: {
    DE: "Neue unbezahlte Urlaubseinheiten sind ungültig.",
    EN: "New unpaid vacation units are invalid.",
    IT: "Le nuove unità di ferie non retribuite non sono valide.",
    TR: "Yeni ücretsiz izin birimleri geçersiz.",
    SQ: "Njësitë e reja të pushimit të papaguar janë të pavlefshme.",
    RO: "Noile unități de concediu neplătit sunt invalide.",
    KU: "Yekeyên nû ên betlaneya bêpere nederbasdar in.",
  },
  employeesCannotEditFinalAbsencesDirectly: {
    DE: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt bearbeiten.",
    EN: "Employees cannot edit final absences directly.",
    IT: "I dipendenti non possono modificare direttamente le assenze definitive.",
    TR: "Çalışanlar kesin devamsızlıkları doğrudan düzenleyemez.",
    SQ: "Punonjësit nuk mund të ndryshojnë drejtpërdrejt mungesat përfundimtare.",
    RO: "Angajații nu pot edita direct absențele finale.",
    KU: "Karmend nikarin nebûnên dawî rasterast biguherînin.",
  },
  vacationUnitsSplitMismatch: {
    DE: "Die neue Aufteilung in bezahlte und unbezahlte Urlaubseinheiten passt nicht zum Zeitraum.",
    EN: "The new split of paid and unpaid vacation units does not match the selected period.",
    IT: "La nuova suddivisione tra unità di ferie retribuite e non retribuite non corrisponde al periodo selezionato.",
    TR: "Ücretli ve ücretsiz izin birimlerinin yeni dağılımı seçilen döneme uymuyor.",
    SQ: "Ndarja e re e njësive të pushimit të paguar dhe të papaguar nuk përputhet me periudhën e zgjedhur.",
    RO: "Noua împărțire a unităților de concediu plătit și neplătit nu se potrivește cu perioada selectată.",
    KU: "Parvekirina nû ya yekeyên betlaneya bi pere û bêpere bi navbera hilbijartî re nagunce.",
  },
  employeesCannotDeleteFinalAbsencesDirectly: {
    DE: "Mitarbeiter dürfen finale Abwesenheiten nicht direkt löschen.",
    EN: "Employees cannot delete final absences directly.",
    IT: "I dipendenti non possono eliminare direttamente le assenze definitive.",
    TR: "Çalışanlar kesin devamsızlıkları doğrudan silemez.",
    SQ: "Punonjësit nuk mund të fshijnë drejtpërdrejt mungesat përfundimtare.",
    RO: "Angajații nu pot șterge direct absențele finale.",
    KU: "Karmend nikarin nebûnên dawî rasterast jêbibin.",
  },
  idOrRangeRequired: {
    DE: "Entweder eine ID oder ein gültiger Bereich mit von, bis und Typ ist erforderlich.",
    EN: "Either an ID or a valid range with from, to, and type is required.",
    IT: "È richiesta un'ID oppure un intervallo valido con da, a e tipo.",
    TR: "Kimlik ya da from, to ve type içeren geçerli bir aralık gerekli.",
    SQ: "Kërkohet një ID ose një interval i vlefshëm me from, to dhe type.",
    RO: "Este necesar fie un ID, fie un interval valid cu from, to și type.",
    KU: "Yan ID an jî navberek derbasdar bi from, to û type pêwîst e.",
  },
  notLoggedInWithPeriod: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Giriş yapılmadı.",
    SQ: "Nuk jeni i identifikuar.",
    RO: "Neautentificat.",
    KU: "Têketin nehatiye kirin.",
  },
  dateMustBeYmd: {
    DE: "Start- und Enddatum müssen im Format YYYY-MM-DD angegeben werden.",
    EN: "Start and end date must be in YYYY-MM-DD format.",
    IT: "La data di inizio e di fine devono essere nel formato YYYY-MM-DD.",
    TR: "Başlangıç ve bitiş tarihi YYYY-MM-DD formatında olmalıdır.",
    SQ: "Data e fillimit dhe e mbarimit duhet të jenë në formatin YYYY-MM-DD.",
    RO: "Data de început și data de sfârșit trebuie să fie în formatul YYYY-MM-DD.",
    KU: "Dîroka destpêk û dawiyê divê di forma YYYY-MM-DD de bin.",
  },
  invalidAbsenceType: {
    DE: "Ungültiger Abwesenheitstyp.",
    EN: "Invalid absence type.",
    IT: "Tipo di assenza non valido.",
    TR: "Geçersiz devamsızlık türü.",
    SQ: "Lloj mungese i pavlefshëm.",
    RO: "Tip de absență invalid.",
    KU: "Cureya nebûnê nederbasdar.",
  },
  endBeforeStart: {
    DE: "Ende darf nicht vor Start liegen.",
    EN: "End must not be before start.",
    IT: "La fine non può essere precedente all'inizio.",
    TR: "Bitiş başlangıçtan önce olamaz.",
    SQ: "Mbarimi nuk mund të jetë para fillimit.",
    RO: "Sfârșitul nu poate fi înainte de început.",
    KU: "Dawî nikare berî destpêkê be.",
  },
  crossYearRequestsNotSupported: {
    DE: "Jahresübergreifende Urlaubs- oder Krankheitsanträge werden aktuell noch nicht unterstützt. Bitte je Kalenderjahr einen separaten Antrag stellen.",
    EN: "Vacation or sickness requests spanning multiple years are not supported yet. Please submit a separate request for each calendar year.",
    IT: "Le richieste di ferie o malattia su più anni non sono ancora supportate. Invia una richiesta separata per ogni anno solare.",
    TR: "Yıllar arası devreden izin veya hastalık talepleri henüz desteklenmiyor. Lütfen her takvim yılı için ayrı bir talep gönderin.",
    SQ: "Kërkesat për pushim ose sëmundje që përfshijnë disa vite ende nuk mbështeten. Ju lutem dërgoni një kërkesë të veçantë për çdo vit kalendarik.",
    RO: "Cererile de concediu sau boală care se întind pe mai mulți ani nu sunt încă acceptate. Te rugăm să trimiți o cerere separată pentru fiecare an calendaristic.",
    KU: "Daxwazên betlane an nexweşiyê ku li ser çend salan dirêj dibin hêj nayên piştgirî kirin. Ji kerema xwe ji bo her sala salnameyê daxwazek cuda bişînin.",
  },
  sickOnlyFullDayRequested: {
    DE: "Krankheit kann nur ganztägig beantragt werden.",
    EN: "Sickness can only be requested as a full day.",
    IT: "La malattia può essere richiesta solo per l'intera giornata.",
    TR: "Hastalık yalnızca tam gün olarak talep edilebilir.",
    SQ: "Sëmundja mund të kërkohet vetëm si ditë e plotë.",
    RO: "Boala poate fi solicitată doar ca zi întreagă.",
    KU: "Nexweşî tenê dikare wekî rojek tevahî were daxwaz kirin.",
  },
  sickCannotBeRequestedUnpaid: {
    DE: "Krankheit darf nicht als unbezahlt beantragt werden.",
    EN: "Sickness cannot be requested as unpaid.",
    IT: "La malattia non può essere richiesta come non retribuita.",
    TR: "Hastalık ücretsiz olarak talep edilemez.",
    SQ: "Sëmundja nuk mund të kërkohet si e papaguar.",
    RO: "Boala nu poate fi solicitată ca neplătită.",
    KU: "Nexweşî nikare wekî bêpere were daxwaz kirin.",
  },
  halfVacationOnlySingleDateRequest: {
    DE: "Ein halber Urlaubstag darf nur für genau ein Datum beantragt werden.",
    EN: "A half vacation day can only be requested for exactly one date.",
    IT: "Una mezza giornata di ferie può essere richiesta solo per una singola data.",
    TR: "Yarım izin günü yalnızca tek bir tarih için talep edilebilir.",
    SQ: "Një gjysmë dite pushimi mund të kërkohet vetëm për një datë të vetme.",
    RO: "O jumătate de zi de concediu poate fi solicitată doar pentru exact o singură dată.",
    KU: "Nîvroj betlaneyê tenê ji bo yek dîrokê dikare were daxwaz kirin.",
  },
  approvedAbsenceAlreadyExists: {
    DE: "Im gewünschten Zeitraum existiert bereits eine bestätigte Abwesenheit.",
    EN: "A confirmed absence already exists in the selected period.",
    IT: "Nel periodo desiderato esiste già un'assenza confermata.",
    TR: "Seçilen dönemde zaten onaylanmış bir devamsızlık var.",
    SQ: "Në periudhën e zgjedhur ekziston tashmë një mungesë e konfirmuar.",
    RO: "Există deja o absență confirmată în perioada selectată.",
    KU: "Di navbera xwestî de jixwe nebûnek pejirandî heye.",
  },
  pendingRequestAlreadyExists: {
    DE: "Für diesen Zeitraum existiert bereits ein offener Antrag.",
    EN: "An open request already exists for this period.",
    IT: "Per questo periodo esiste già una richiesta aperta.",
    TR: "Bu dönem için zaten açık bir talep mevcut.",
    SQ: "Për këtë periudhë ekziston tashmë një kërkesë e hapur.",
    RO: "Există deja o cerere deschisă pentru această perioadă.",
    KU: "Ji bo vê navberê jixwe daxwazek vekirî heye.",
  },
  newAbsenceRequestPushTitle: {
    DE: "Neuer Abwesenheitsantrag",
    EN: "New absence request",
    IT: "Nuova richiesta di assenza",
    TR: "Yeni devamsızlık talebi",
    SQ: "Kërkesë e re për mungesë",
    RO: "Cerere nouă de absență",
    KU: "Daxwaza nû ya nebûnê",
  },
  invalidRequest: {
    DE: "Ungültige Anfrage.",
    EN: "Invalid request.",
    IT: "Richiesta non valida.",
    TR: "Geçersiz istek.",
    SQ: "Kërkesë e pavlefshme.",
    RO: "Cerere invalidă.",
    KU: "Daxwaza nederbasdar.",
  },
  assignedToUserIdMissing: {
    DE: "assignedToUserId fehlt.",
    EN: "assignedToUserId is missing.",
    IT: "assignedToUserId manca.",
    TR: "assignedToUserId eksik.",
    SQ: "assignedToUserId mungon.",
    RO: "assignedToUserId lipsește.",
    KU: "assignedToUserId tune ye.",
  },
  titleMissing: {
    DE: "Titel fehlt.",
    EN: "Title is missing.",
    IT: "Manca il titolo.",
    TR: "Başlık eksik.",
    SQ: "Titulli mungon.",
    RO: "Titlul lipsește.",
    KU: "Sernav tune ye.",
  },
  invalidCategory: {
    DE: "Ungültige Kategorie.",
    EN: "Invalid category.",
    IT: "Categoria non valida.",
    TR: "Geçersiz kategori.",
    SQ: "Kategori e pavlefshme.",
    RO: "Categorie invalidă.",
    KU: "Kategorîya nederbasdar.",
  },
  invalidRequiredAction: {
    DE: "Ungültige Pflichtaktion.",
    EN: "Invalid required action.",
    IT: "Azione richiesta non valida.",
    TR: "Geçersiz gerekli işlem.",
    SQ: "Veprim i detyrueshëm i pavlefshëm.",
    RO: "Acțiune necesară invalidă.",
    KU: "Çalakiya pêwîst nederbasdar e.",
  },
  invalidReferenceRange: {
    DE: "Ungültiger Bezugszeitraum. Erwartet wird YYYY-MM-DD.",
    EN: "Invalid reference period. Expected format is YYYY-MM-DD.",
    IT: "Periodo di riferimento non valido. Formato atteso: YYYY-MM-DD.",
    TR: "Geçersiz ilgili dönem. Beklenen format YYYY-MM-DD.",
    SQ: "Periudhë referente e pavlefshme. Formati i pritur është YYYY-MM-DD.",
    RO: "Perioadă de referință invalidă. Formatul așteptat este YYYY-MM-DD.",
    KU: "Dema referansê nederbasdar e. Forma pêwîst YYYY-MM-DD ye.",
  },
  tasksOnlyForEmployees: {
    DE: "Aufgaben können nur Mitarbeitern zugewiesen werden.",
    EN: "Tasks can only be assigned to employees.",
    IT: "Le attività possono essere assegnate solo ai dipendenti.",
    TR: "Görevler yalnızca çalışanlara atanabilir.",
    SQ: "Detyrat mund t’u caktohen vetëm punonjësve.",
    RO: "Sarcinile pot fi atribuite doar angajaților.",
    KU: "Erk tenê dikarin ji karmendan re bên veqetandin.",
  },
  newTaskPushTitle: {
    DE: "Neue Aufgabe",
    EN: "New task",
    IT: "Nuova attività",
    TR: "Yeni görev",
    SQ: "Detyrë e re",
    RO: "Sarcină nouă",
    KU: "Erkeke nû",
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
    RO: "#putemfaceasta",
    KU: "#emdikarinbikin",
  },
  loadingInitial: {
    DE: "Lädt Nachtragsanfragen...",
    EN: "Loading correction requests...",
    IT: "Caricamento richieste di correzione...",
    TR: "Düzeltme talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat për korrigjim...",
    RO: "Se încarcă cererile de corectare...",
    KU: "Daxwazên rastkirinê têne barkirin...",
  },
  pendingRequestsKpi: {
    DE: "Offene Nachtragsanfragen",
    EN: "Open correction requests",
    IT: "Richieste di correzione aperte",
    TR: "Açık düzeltme talepleri",
    SQ: "Kërkesa të hapura për korrigjim",
    RO: "Cereri de corectare deschise",
    KU: "Daxwazên rastkirinê yên vekirî",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    RO: "Aprobate",
    KU: "Pejirandî",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    RO: "Respinse",
    KU: "Redkirî",
  },
  pageTitle: {
    DE: "Nachtragsanfragen",
    EN: "Correction requests",
    IT: "Richieste di correzione",
    TR: "Düzeltme talepleri",
    SQ: "Kërkesa për korrigjim",
    RO: "Cereri de corectare",
    KU: "Daxwazên rastkirinê",
  },
  pageDescription: {
    DE: "Hier siehst du alle Nachtragsanfragen deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.",
    EN: "Here you can see all correction requests from your employees and approve or reject open requests directly.",
    IT: "Qui puoi vedere tutte le richieste di correzione dei tuoi dipendenti e approvare o rifiutare direttamente quelle aperte.",
    TR: "Burada çalışanlarınızın tüm düzeltme taleplerini görebilir ve açık talepleri doğrudan onaylayabilir veya reddedebilirsiniz.",
    SQ: "Këtu mund të shohësh të gjitha kërkesat për korrigjim të punonjësve të tu dhe t'i miratosh ose refuzosh direkt kërkesat e hapura.",
    RO: "Aici poți vedea toate cererile de corectare ale angajaților tăi și poți aproba sau respinge direct cererile deschise.",
    KU: "Li vir hemû daxwazên rastkirinê yên karmendên xwe dibînî û dikarî daxwazên vekirî rasterast pejirînî an red bikî.",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    RO: "Angajat",
    KU: "Karmend",
  },
  allEmployees: {
    DE: "Alle Mitarbeiter",
    EN: "All employees",
    IT: "Tutti i dipendenti",
    TR: "Tüm çalışanlar",
    SQ: "Të gjithë punonjësit",
    RO: "Toți angajații",
    KU: "Hemû karmend",
  },
  selectedEmployee: {
    DE: "Ausgewählter Mitarbeiter",
    EN: "Selected employee",
    IT: "Dipendente selezionato",
    TR: "Seçilen çalışan",
    SQ: "Punonjësi i zgjedhur",
    RO: "Angajat selectat",
    KU: "Karmenda hilbijartî",
  },
  month: {
    DE: "Monat",
    EN: "Month",
    IT: "Mese",
    TR: "Ay",
    SQ: "Muaji",
    RO: "Lună",
    KU: "Meh",
  },
  loadError: {
    DE: "Nachtragsanfragen konnten nicht geladen werden.",
    EN: "Correction requests could not be loaded.",
    IT: "Impossibile caricare le richieste di correzione.",
    TR: "Düzeltme talepleri yüklenemedi.",
    SQ: "Kërkesat për korrigjim nuk mund të ngarkoheshin.",
    RO: "Cererile de corectare nu au putut fi încărcate.",
    KU: "Daxwazên rastkirinê nehatin barkirin.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Nachtragsanfragen.",
    EN: "Network error while loading correction requests.",
    IT: "Errore di rete durante il caricamento delle richieste di correzione.",
    TR: "Düzeltme talepleri yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të kërkesave për korrigjim.",
    RO: "Eroare de rețea la încărcarea cererilor de corectare.",
    KU: "Dema barkirina daxwazên rastkirinê de xeletiya torê çêbû.",
  },
  approveFailed: {
    DE: "Genehmigung fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onay başarısız oldu.",
    SQ: "Miratimi dështoi.",
    RO: "Aprobarea a eșuat.",
    KU: "Pejirandin serneket.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler bei der Genehmigung.",
    EN: "Network error during approval.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onay sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    RO: "Eroare de rețea în timpul aprobării.",
    KU: "Dema pejirandinê de xeletiya torê.",
  },
  rejectFailed: {
    DE: "Ablehnung fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız oldu.",
    SQ: "Refuzimi dështoi.",
    RO: "Respingerea a eșuat.",
    KU: "Redkirin serneket.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler bei der Ablehnung.",
    EN: "Network error during rejection.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    RO: "Eroare de rețea în timpul respingerii.",
    KU: "Dema redkirinê de xeletiya torê.",
  },
  deleteConfirm: {
    DE: "Möchtest du diese Nachtragsanfrage wirklich dauerhaft löschen?",
    EN: "Do you really want to permanently delete this correction request?",
    IT: "Vuoi davvero eliminare definitivamente questa richiesta di correzione?",
    TR: "Bu düzeltme talebini kalıcı olarak silmek istediğinizden emin misiniz?",
    SQ: "A dëshiron vërtet ta fshish përgjithmonë këtë kërkesë për korrigjim?",
    RO: "Sigur vrei să ștergi definitiv această cerere de corectare?",
    KU: "Tu bi rastî dixwazî vê daxwaza rastkirinê bi temamî jê bibî?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    RO: "Ștergerea a eșuat.",
    KU: "Jêbirin serneket.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    RO: "Eroare de rețea la ștergere.",
    KU: "Dema jêbirinê de xeletiya torê.",
  },
  open: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "E hapur",
    RO: "Deschis",
    KU: "Vekirî",
  },
  approved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvata",
    TR: "Onaylandı",
    SQ: "Miratuar",
    RO: "Aprobat",
    KU: "Pejirandî",
  },
  rejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutata",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    RO: "Respins",
    KU: "Redkirî",
  },
  request: {
    DE: "Nachtrag",
    EN: "Correction",
    IT: "Correzione",
    TR: "Düzeltme",
    SQ: "Korrigjim",
    RO: "Corectare",
    KU: "Rastkirin",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    RO: "zi",
    KU: "roj",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    RO: "zile",
    KU: "roj",
  },
  createdAt: {
    DE: "Erstellt:",
    EN: "Created:",
    IT: "Creata:",
    TR: "Oluşturuldu:",
    SQ: "Krijuar:",
    RO: "Creată:",
    KU: "Hate afirandin:",
  },
  decisionAt: {
    DE: "Entscheidung:",
    EN: "Decision:",
    IT: "Decisione:",
    TR: "Karar:",
    SQ: "Vendimi:",
    RO: "Decizie:",
    KU: "Biryar:",
  },
  period: {
    DE: "Zeitraum",
    EN: "Period",
    IT: "Periodo",
    TR: "Dönem",
    SQ: "Periudha",
    RO: "Perioadă",
    KU: "Dem",
  },
  employeeNote: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota del dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    RO: "Notă angajat",
    KU: "Nîşeya karmend",
  },
  adminNote: {
    DE: "Admin-Notiz",
    EN: "Admin note",
    IT: "Nota admin",
    TR: "Yönetici notu",
    SQ: "Shënim i administratorit",
    RO: "Notă admin",
    KU: "Nîşeya admin",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    RO: "Nicio notă disponibilă.",
    KU: "Ti nîşe tune ye.",
  },
  processedBy: {
    DE: "Bearbeitet von",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen kişi",
    SQ: "Përpunuar nga",
    RO: "Procesat de",
    KU: "Ji aliyê vê kesî ve hate kirin",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende nuk është vendosur",
    RO: "Încă nedecis",
    KU: "Hêj biryar nehatî dayîn",
  },
  deleting: {
    DE: "Löscht...",
    EN: "Deleting...",
    IT: "Eliminazione...",
    TR: "Siliniyor...",
    SQ: "Duke fshirë...",
    RO: "Se șterge...",
    KU: "Tê jêbirin...",
  },
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    RO: "Șterge",
    KU: "Jê bibe",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke u përpunuar...",
    RO: "Se procesează...",
    KU: "Tê pêvajokirin...",
  },
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    RO: "Respinge",
    KU: "Red bike",
  },
  approve: {
    DE: "Genehmigen",
    EN: "Approve",
    IT: "Approva",
    TR: "Onayla",
    SQ: "Mirato",
    RO: "Aprobă",
    KU: "Pejirîne",
  },
  emptyPending: {
    DE: "Keine offenen Nachtragsanfragen für diesen Filter.",
    EN: "No open correction requests for this filter.",
    IT: "Nessuna richiesta di correzione aperta per questo filtro.",
    TR: "Bu filtre için açık düzeltme talebi yok.",
    SQ: "Nuk ka kërkesa të hapura për korrigjim për këtë filtër.",
    RO: "Nu există cereri de corectare deschise pentru acest filtru.",
    KU: "Ji bo vî fîlterî daxwaza rastkirinê ya vekirî tune ye.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Nachtragsanfragen für diesen Filter.",
    EN: "No approved correction requests for this filter.",
    IT: "Nessuna richiesta di correzione approvata per questo filtro.",
    TR: "Bu filtre için onaylanmış düzeltme talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara për korrigjim për këtë filtër.",
    RO: "Nu există cereri de corectare aprobate pentru acest filtru.",
    KU: "Ji bo vî fîlterî daxwaza rastkirinê ya pejirandî tune ye.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Nachtragsanfragen für diesen Filter.",
    EN: "No rejected correction requests for this filter.",
    IT: "Nessuna richiesta di correzione rifiutata per questo filtro.",
    TR: "Bu filtre için reddedilmiş düzeltme talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara për korrigjim për këtë filtër.",
    RO: "Nu există cereri de corectare respinse pentru acest filtru.",
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
    RO: "Resetare parolă",
  },
  pageSubtitle: {
    DE: "Mitarbeiter klicken „Passwort vergessen“ → hier erscheinen Anfragen. Link erzeugen & senden (z.B. WhatsApp).",
    EN: "Employees click “Forgot password” → requests appear here. Create and send link (e.g. via WhatsApp).",
    IT: "I dipendenti cliccano su “Password dimenticata” → qui compaiono le richieste. Crea e invia il link (ad es. tramite WhatsApp).",
    TR: "Çalışanlar “Şifremi unuttum” seçeneğine tıklar → talepler burada görünür. Link oluşturup gönderin (ör. WhatsApp ile).",
    SQ: "Punonjësit klikojnë “Kam harruar fjalëkalimin” → kërkesat shfaqen këtu. Krijo dhe dërgo linkun (p.sh. me WhatsApp).",
    KU: "Karmend li “Şîfreyê min ji bîr kir” dike → daxwaz li vir xuya dibe. Girêdanê biafirîne û bişîne (mînak WhatsApp).",
    RO: "Angajații dau clic pe „Am uitat parola” → aici apar solicitările. Creează și trimite linkul (de ex. prin WhatsApp).",
  },
  loadError: {
    DE: "Konnte Anfragen nicht laden.",
    EN: "Could not load requests.",
    IT: "Impossibile caricare le richieste.",
    TR: "Talepler yüklenemedi.",
    SQ: "Nuk u ngarkuan kërkesat.",
    KU: "Daxwaz nehatin barkirin.",
    RO: "Solicitările nu au putut fi încărcate.",
  },
  resetFailed: {
    DE: "Reset fehlgeschlagen",
    EN: "Reset failed",
    IT: "Reimpostazione non riuscita",
    TR: "Sıfırlama başarısız oldu",
    SQ: "Rivendosja dështoi",
    KU: "Nûvekirin serneket",
    RO: "Resetarea a eșuat",
  },
  singleUseUntil: {
    DE: "Einmalig nutzbar. Spätestens gültig bis:",
    EN: "Usable once. Valid at the latest until:",
    IT: "Utilizzabile una sola volta. Valido al più tardi fino al:",
    TR: "Tek kullanımlık. En geç şu tarihe kadar geçerli:",
    SQ: "Përdoret vetëm një herë. I vlefshëm më së voni deri më:",
    KU: "Tenê carekê tê bikaranîn. Herî dereng heta vê demê derbasdar e:",
    RO: "Poate fi folosit o singură dată. Valabil cel târziu până la:",
  },
  copied: {
    DE: "Kopiert ✅",
    EN: "Copied ✅",
    IT: "Copiato ✅",
    TR: "Kopyalandı ✅",
    SQ: "U kopjua ✅",
    KU: "Hat kopîkirin ✅",
    RO: "Copiat ✅",
  },
  copyNotPossible: {
    DE: "Kopieren nicht möglich",
    EN: "Copying not possible",
    IT: "Copia non possibile",
    TR: "Kopyalama mümkün değil",
    SQ: "Kopjimi nuk është i mundur",
    KU: "Kopîkirin ne gengaz e",
    RO: "Copierea nu este posibilă",
  },
  loading: {
    DE: "lädt…",
    EN: "loading…",
    IT: "caricamento…",
    TR: "yükleniyor…",
    SQ: "duke u ngarkuar…",
    KU: "tê barkirin…",
    RO: "se încarcă…",
  },
  noOpenRequests: {
    DE: "Keine offenen Anfragen.",
    EN: "No open requests.",
    IT: "Nessuna richiesta aperta.",
    TR: "Açık talep yok.",
    SQ: "Nuk ka kërkesa të hapura.",
    KU: "Ti daxwaza vekirî tune ye.",
    RO: "Nu există solicitări deschise.",
  },
  requestPrefix: {
    DE: "Anfrage:",
    EN: "Request:",
    IT: "Richiesta:",
    TR: "Talep:",
    SQ: "Kërkesa:",
    KU: "Daxwaz:",
    RO: "Solicitare:",
  },
  passwordSetAt: {
    DE: "Passwort gesetzt am:",
    EN: "Password set on:",
    IT: "Password impostata il:",
    TR: "Şifre belirlenme tarihi:",
    SQ: "Fjalëkalimi u vendos më:",
    KU: "Vesaz di vê rojê de hate danîn:",
    RO: "Parola a fost setată la data de:",
  },
  createResetLink: {
    DE: "Reset-Link erstellen",
    EN: "Create reset link",
    IT: "Crea link di reset",
    TR: "Sıfırlama bağlantısı oluştur",
    SQ: "Krijo link rivendosjeje",
    KU: "Girêdana nûvekirinê biafirîne",
    RO: "Creează link de resetare",
  },
  resetLinkTitle: {
    DE: "Reset-Link",
    EN: "Reset link",
    IT: "Link di reset",
    TR: "Sıfırlama bağlantısı",
    SQ: "Link rivendosjeje",
    KU: "Girêdana nûvekirinê",
    RO: "Link de resetare",
  },
  copyLink: {
    DE: "Link kopieren",
    EN: "Copy link",
    IT: "Copia link",
    TR: "Bağlantıyı kopyala",
    SQ: "Kopjo linkun",
    KU: "Girêdanê kopî bike",
    RO: "Copiază linkul",
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
  hint: {
    DE: "Hinweis: Der Link kann nur einmal verwendet werden und wird nach erfolgreicher Nutzung sofort ungültig. Ohne Nutzung läuft er spätestens zum angegebenen Zeitpunkt ab.",
    EN: "Note: The link can only be used once and becomes invalid immediately after successful use. If unused, it expires at the stated time at the latest.",
    IT: "Nota: Il link può essere utilizzato una sola volta e diventa immediatamente non valido dopo l'uso riuscito. Se non utilizzato, scade al più tardi all'orario indicato.",
    TR: "Not: Bağlantı yalnızca bir kez kullanılabilir ve başarılı kullanımın ardından hemen geçersiz olur. Kullanılmazsa en geç belirtilen zamanda süresi dolar.",
    SQ: "Shënim: Linku mund të përdoret vetëm një herë dhe bëhet menjëherë i pavlefshëm pas përdorimit të suksesshëm. Nëse nuk përdoret, skadon më së voni në kohën e treguar.",
    KU: "Têbînî: Girêdan tenê carekê tê bikaranîn û piştî bikaranîna serkeftî di cih de nederbasdar dibe. Heke neyê bikaranîn, herî dereng di dema diyarkirî de bi dawî dibe.",
    RO: "Notă: Linkul poate fi folosit o singură dată și devine invalid imediat după utilizarea cu succes. Dacă nu este folosit, expiră cel târziu la data și ora indicate.",
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
    RO: "Calendarul se încarcă...",
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
    RO: "Tablou de bord",
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
  dashboardLoadError: {
    DE: "Dashboard konnte nicht geladen werden.",
    EN: "Dashboard could not be loaded.",
    IT: "Impossibile caricare il dashboard.",
    TR: "Gösterge paneli yüklenemedi.",
    SQ: "Paneli nuk mund të ngarkohej.",
    KU: "Dashboard nehate barkirin.",
    RO: "Tabloul de bord nu a putut fi încărcat.",
  },
  unexpectedDashboardResponse: {
    DE: "Unerwartete Dashboard-Antwort.",
    EN: "Unexpected dashboard response.",
    IT: "Risposta dashboard imprevista.",
    TR: "Beklenmeyen gösterge paneli yanıtı.",
    SQ: "Përgjigje e papritur nga paneli.",
    KU: "Bersiva dashboardê nexwestî bû.",
    RO: "Răspuns neașteptat de la tabloul de bord.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden.",
    EN: "Network error while loading.",
    IT: "Errore di rete durante il caricamento.",
    TR: "Yükleme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit.",
    KU: "Dema barkirinê de xeletiya torê.",
    RO: "Eroare de rețea la încărcare.",
  },
  exportDownloadError: {
    DE: "Export konnte nicht heruntergeladen werden.",
    EN: "Export could not be downloaded.",
    IT: "Impossibile scaricare l'esportazione.",
    TR: "Dışa aktarma indirilemedi.",
    SQ: "Eksporti nuk mund të shkarkohej.",
    KU: "Export nehate daxistin.",
    RO: "Exportul nu a putut fi descărcat.",
  },
  exportOpenError: {
    DE: "Export konnte nicht geöffnet werden.",
    EN: "Export could not be opened.",
    IT: "Impossibile aprire l'esportazione.",
    TR: "Dışa aktarma açılamadı.",
    SQ: "Eksporti nuk mund të hapej.",
    KU: "Export venebû.",
    RO: "Exportul nu a putut fi deschis.",
  },
  exportShareError: {
    DE: "Export konnte nicht geteilt oder gesichert werden.",
    EN: "Export could not be shared or saved.",
    IT: "Impossibile condividere o salvare l'esportazione.",
    TR: "Dışa aktarma paylaşılamadı veya kaydedilemedi.",
    SQ: "Eksporti nuk mund të ndahej ose ruhej.",
    KU: "Export nehat parvekirin an tomarkirin.",
    RO: "Exportul nu a putut fi partajat sau salvat.",
  },
  pushSendError: {
    DE: "Push konnte nicht gesendet werden.",
    EN: "Push could not be sent.",
    IT: "Impossibile inviare la notifica push.",
    TR: "Push bildirimi gönderilemedi.",
    SQ: "Njoftimi push nuk mund të dërgohej.",
    KU: "Push nehate şandin.",
    RO: "Notificarea push nu a putut fi trimisă.",
  },
  pushNetworkError: {
    DE: "Netzwerkfehler beim Senden des Reminders.",
    EN: "Network error while sending reminder.",
    IT: "Errore di rete durante l'invio del promemoria.",
    TR: "Hatırlatma gönderilirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë dërgimit të kujtesës.",
    KU: "Dema şandina bîranînê de xeletiya torê.",
    RO: "Eroare de rețea la trimiterea mementoului.",
  },
  pushSuccessPrefix: {
    DE: "Push an",
    EN: "Push sent to",
    IT: "Push inviato a",
    TR: "Push gönderildi:",
    SQ: "Push u dërgua te",
    KU: "Push hate şandin ji bo",
    RO: "Push trimis către",
  },
  saveFailed: {
    DE: "Speichern fehlgeschlagen.",
    EN: "Saving failed.",
    IT: "Salvataggio non riuscito.",
    TR: "Kaydetme başarısız oldu.",
    SQ: "Ruajtja dështoi.",
    KU: "Tomarkirin serneket.",
    RO: "Salvarea a eșuat.",
  },
  saveNetworkError: {
    DE: "Netzwerkfehler beim Speichern.",
    EN: "Network error while saving.",
    IT: "Errore di rete durante il salvataggio.",
    TR: "Kaydetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ruajtjes.",
    KU: "Dema tomarkirinê de xeletiya torê.",
    RO: "Eroare de rețea la salvare.",
  },
  deleteConfirm: {
    DE: "Diesen Eintrag wirklich löschen?",
    EN: "Really delete this entry?",
    IT: "Eliminare davvero questa voce?",
    TR: "Bu kayıt gerçekten silinsin mi?",
    SQ: "Ta fshijmë vërtet këtë hyrje?",
    KU: "Bi rastî vê tomariyê jê bibin?",
    RO: "Ștergi cu adevărat această înregistrare?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
    RO: "Ștergerea a eșuat.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
    RO: "Eroare de rețea la ștergere.",
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
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
    RO: "Închide",
  },
  download: {
    DE: "Download",
    EN: "Download",
    IT: "Scarica",
    TR: "İndir",
    SQ: "Shkarko",
    KU: "Daxe",
    RO: "Descarcă",
  },
  shareOrSave: {
    DE: "Teilen / Sichern",
    EN: "Share / Save",
    IT: "Condividi / Salva",
    TR: "Paylaş / Kaydet",
    SQ: "Ndaj / Ruaj",
    KU: "Parve bike / Tomar bike",
    RO: "Partajează / Salvează",
  },
  shareOrSaveTitle: {
    DE: "Export teilen oder sichern",
    EN: "Share or save export",
    IT: "Condividi o salva esportazione",
    TR: "Dışa aktarmayı paylaş veya kaydet",
    SQ: "Ndaje ose ruaje eksportin",
    KU: "Exportê parve bike an tomar bike",
    RO: "Partajează sau salvează exportul",
  },
  downloadTitle: {
    DE: "Export herunterladen",
    EN: "Download export",
    IT: "Scarica esportazione",
    TR: "Dışa aktarmayı indir",
    SQ: "Shkarko eksportin",
    KU: "Exportê daxîne",
    RO: "Descarcă exportul",
  },
  monthForOverviewAndExport: {
    DE: "Monat (für Übersicht + Export)",
    EN: "Month (for overview + export)",
    IT: "Mese (per panoramica + esportazione)",
    TR: "Ay (genel görünüm + dışa aktarma için)",
    SQ: "Muaji (për përmbledhje + eksport)",
    KU: "Meh (ji bo dîtin + export)",
    RO: "Lună (pentru prezentare generală + export)",
  },
  manageTasks: {
    DE: "Aufgaben verwalten",
    EN: "Manage tasks",
    IT: "Gestisci attività",
    TR: "Görevleri yönet",
    SQ: "Menaxho detyrat",
    KU: "Erkan birêve bibe",
    RO: "Gestionează sarcinile",
  },
  exportAdmin: {
    DE: "Export (Admin)",
    EN: "Export (Admin)",
    IT: "Esporta (Admin)",
    TR: "Dışa aktar (Yönetici)",
    SQ: "Eksport (Admin)",
    KU: "Export (Admin)",
    RO: "Export (Admin)",
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
    IT: "Periodo (CSV)",
    TR: "Aralık (CSV)",
    SQ: "Periudha (CSV)",
    KU: "Dem (CSV)",
    RO: "Interval (CSV)",
  },
  exportTarget: {
    DE: "Export-Ziel",
    EN: "Export target",
    IT: "Destinazione esportazione",
    TR: "Dışa aktarma hedefi",
    SQ: "Objektivi i eksportit",
    KU: "Armanca exportê",
    RO: "Destinația exportului",
  },
  allCombined: {
    DE: "Alle gesammelt",
    EN: "All combined",
    IT: "Tutti insieme",
    TR: "Tümü birlikte",
    SQ: "Të gjitha së bashku",
    KU: "Hemû bi hev re",
    RO: "Toate împreună",
  },
  singleEmployee: {
    DE: "Einzelner Mitarbeiter",
    EN: "Single employee",
    IT: "Singolo dipendente",
    TR: "Tek çalışan",
    SQ: "Një punonjës",
    KU: "Karmendek tenê",
    RO: "Un singur angajat",
  },
  selectEmployee: {
    DE: "Mitarbeiter auswählen",
    EN: "Select employee",
    IT: "Seleziona dipendente",
    TR: "Çalışan seç",
    SQ: "Zgjidh punonjësin",
    KU: "Karmend hilbijêre",
    RO: "Selectează angajatul",
  },
  pleaseChoose: {
    DE: "— Bitte wählen —",
    EN: "— Please choose —",
    IT: "— Seleziona —",
    TR: "— Lütfen seçin —",
    SQ: "— Ju lutem zgjidhni —",
    KU: "— Ji kerema xwe hilbijêre —",
    RO: "— Te rugăm să alegi —",
  },
  selectMonth: {
    DE: "Monat auswählen",
    EN: "Select month",
    IT: "Seleziona mese",
    TR: "Ay seç",
    SQ: "Zgjidh muajin",
    KU: "Meh hilbijêre",
    RO: "Selectează luna",
  },
  selectYear: {
    DE: "Jahr auswählen",
    EN: "Select year",
    IT: "Seleziona anno",
    TR: "Yıl seç",
    SQ: "Zgjidh vitin",
    KU: "Sal hilbijêre",
    RO: "Selectează anul",
  },
  selectRange: {
    DE: "Zeitraum auswählen",
    EN: "Select range",
    IT: "Seleziona periodo",
    TR: "Aralık seç",
    SQ: "Zgjidh periudhën",
    KU: "Dem hilbijêre",
    RO: "Selectează intervalul",
  },
  rangeFromToRequired: {
    DE: "Bitte Von und Bis auswählen.",
    EN: "Please select from and to.",
    IT: "Seleziona data iniziale e finale.",
    TR: "Lütfen başlangıç ve bitiş seçin.",
    SQ: "Ju lutem zgjidhni nga dhe deri më.",
    KU: "Ji kerema xwe ji û heta hilbijêre.",
    RO: "Te rugăm să selectezi data de început și de sfârșit.",
  },
  rangeFromAfterTo: {
    DE: "Von-Datum darf nicht nach dem Bis-Datum liegen.",
    EN: "Start date must not be after end date.",
    IT: "La data iniziale non può essere successiva alla data finale.",
    TR: "Başlangıç tarihi bitiş tarihinden sonra olamaz.",
    SQ: "Data e fillimit nuk mund të jetë pas datës së mbarimit.",
    KU: "Dîroka destpêkê nabe piştî dîroka dawiyê be.",
    RO: "Data de început nu poate fi după data de sfârșit.",
  },
  employeeRequired: {
    DE: "Bitte Mitarbeiter auswählen.",
    EN: "Please select an employee.",
    IT: "Seleziona un dipendente.",
    TR: "Lütfen bir çalışan seçin.",
    SQ: "Ju lutem zgjidhni një punonjës.",
    KU: "Ji kerema xwe karmendek hilbijêre.",
    RO: "Te rugăm să selectezi un angajat.",
  },
  employeeUnavailable: {
    DE: "Ausgewählter Mitarbeiter ist in dieser Ansicht nicht verfügbar.",
    EN: "Selected employee is not available in this view.",
    IT: "Il dipendente selezionato non è disponibile in questa vista.",
    TR: "Seçilen çalışan bu görünümde mevcut değil.",
    SQ: "Punonjësi i zgjedhur nuk është i disponueshëm në këtë pamje.",
    KU: "Karmenda hilbijartî di vê dîtinê de berdest nîne.",
    RO: "Angajatul selectat nu este disponibil în această vizualizare.",
  },
  activeEmployees: {
    DE: "Aktive Mitarbeiter",
    EN: "Active employees",
    IT: "Dipendenti attivi",
    TR: "Aktif çalışanlar",
    SQ: "Punonjës aktivë",
    KU: "Karmendên çalak",
    RO: "Angajați activi",
  },
  missingEntriesToday: {
    DE: "Fehlende Einträge (heute)",
    EN: "Missing entries (today)",
    IT: "Voci mancanti (oggi)",
    TR: "Eksik kayıtlar (bugün)",
    SQ: "Hyrje që mungojnë (sot)",
    KU: "Tomarên winda (îro)",
    RO: "Înregistrări lipsă (azi)",
  },
  absencesToday: {
    DE: "Abwesenheiten (heute)",
    EN: "Absences (today)",
    IT: "Assenze (oggi)",
    TR: "Devamsızlıklar (bugün)",
    SQ: "Mungesa (sot)",
    KU: "Nebûn (îro)",
    RO: "Absențe (azi)",
  },
  missingEntriesGeneral: {
    DE: "Fehlende Einträge (allgemein)",
    EN: "Missing entries (general)",
    IT: "Voci mancanti (generale)",
    TR: "Eksik kayıtlar (genel)",
    SQ: "Hyrje që mungojnë (në përgjithësi)",
    KU: "Tomarên winda (giştî)",
    RO: "Înregistrări lipsă (general)",
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
  active: {
    DE: "aktiv",
    EN: "active",
    IT: "attivo",
    TR: "aktif",
    SQ: "aktiv",
    KU: "çalak",
    RO: "activ",
  },
  noActiveEmployees: {
    DE: "Keine aktiven Mitarbeiter vorhanden.",
    EN: "No active employees available.",
    IT: "Nessun dipendente attivo disponibile.",
    TR: "Aktif çalışan yok.",
    SQ: "Nuk ka punonjës aktivë.",
    KU: "Ti karmenda çalak tune ye.",
    RO: "Nu există angajați activi.",
  },
  openToday: {
    DE: "heute offen",
    EN: "open today",
    IT: "aperto oggi",
    TR: "bugün açık",
    SQ: "hapur sot",
    KU: "îro vekirî",
    RO: "deschis astăzi",
  },
  noMissingEntriesToday: {
    DE: "Heute fehlen aktuell keine Einträge.",
    EN: "There are currently no missing entries today.",
    IT: "Attualmente non mancano voci oggi.",
    TR: "Bugün şu anda eksik kayıt yok.",
    SQ: "Aktualisht sot nuk mungojnë hyrje.",
    KU: "Îro niha ti tomarê winda tune ye.",
    RO: "În prezent nu lipsesc înregistrări pentru astăzi.",
  },
  noAbsencesToday: {
    DE: "Heute sind keine Mitarbeiter abwesend.",
    EN: "No employees are absent today.",
    IT: "Oggi nessun dipendente è assente.",
    TR: "Bugün devamsız çalışan yok.",
    SQ: "Sot nuk mungon asnjë punonjës.",
    KU: "Îro ti karmend tune ye ku nebe.",
    RO: "Astăzi nu lipsește niciun angajat.",
  },
  overdueDays: {
    DE: "überfällige Tage",
    EN: "overdue days",
    IT: "giorni in ritardo",
    TR: "gecikmiş günler",
    SQ: "ditë të vonuara",
    KU: "rojên derengmayî",
    RO: "zile restante",
  },
  sendPush: {
    DE: "Push senden",
    EN: "Send push",
    IT: "Invia push",
    TR: "Push gönder",
    SQ: "Dërgo push",
    KU: "Push bişîne",
    RO: "Trimite push",
  },
  sending: {
    DE: "Sende…",
    EN: "Sending…",
    IT: "Invio in corso…",
    TR: "Gönderiliyor…",
    SQ: "Duke dërguar…",
    KU: "Tê şandin…",
    RO: "Se trimite…",
  },
  noGeneralOverdueMissingEntries: {
    DE: "Aktuell gibt es keine allgemeinen überfälligen fehlenden Arbeitseinträge.",
    EN: "There are currently no general overdue missing work entries.",
    IT: "Attualmente non ci sono voci di lavoro mancanti e scadute in generale.",
    TR: "Şu anda genel gecikmiş eksik çalışma kaydı yok.",
    SQ: "Aktualisht nuk ka hyrje pune të munguar të vonuara në përgjithësi.",
    KU: "Niha bi giştî ti tomara karê winda ya derengmayî tune ye.",
    RO: "În prezent nu există în general înregistrări de muncă lipsă restante.",
  },
  workDetailsTitle: {
    DE: "Arbeitszeit-Details",
    EN: "Work time details",
    IT: "Dettagli orario di lavoro",
    TR: "Çalışma süresi detayları",
    SQ: "Detajet e orarit të punës",
    KU: "Hûrguliyên demê ya karê",
    RO: "Detalii timp de lucru",
  },
  breakDetailsTitle: {
    DE: "Pausen-Details",
    EN: "Break details",
    IT: "Dettagli pausa",
    TR: "Mola detayları",
    SQ: "Detajet e pushimit",
    KU: "Hûrguliyên bêhnvedanê",
    RO: "Detalii pauză",
  },
  employeeNoteTitle: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
    RO: "Notiță angajat",
  },
  editWorkTitle: {
    DE: "Arbeitszeit bearbeiten (Admin)",
    EN: "Edit work time (admin)",
    IT: "Modifica orario di lavoro (admin)",
    TR: "Çalışma süresini düzenle (yönetici)",
    SQ: "Ndrysho orarin e punës (admin)",
    KU: "Dema karê biguherîne (admin)",
    RO: "Editează timpul de lucru (admin)",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
    RO: "Angajat",
  },
  dateAndTime: {
    DE: "Datum & Zeit",
    EN: "Date & time",
    IT: "Data e ora",
    TR: "Tarih ve saat",
    SQ: "Data & ora",
    KU: "Dîrok û dem",
    RO: "Data și ora",
  },
  date: {
    DE: "Datum",
    EN: "Date",
    IT: "Data",
    TR: "Tarih",
    SQ: "Data",
    KU: "Dîrok",
    RO: "Data",
  },
  netWorkTime: {
    DE: "Netto-Arbeitszeit",
    EN: "Net work time",
    IT: "Tempo di lavoro netto",
    TR: "Net çalışma süresi",
    SQ: "Koha neto e punës",
    KU: "Dema karê ya net",
    RO: "Timp net de lucru",
  },
  siteOrAddress: {
    DE: "Baustelle / Adresse",
    EN: "Site / address",
    IT: "Cantiere / indirizzo",
    TR: "Şantiye / adres",
    SQ: "Kantier / adresë",
    KU: "Cihê karê / navnîşan",
    RO: "Șantier / adresă",
  },
  executedActivity: {
    DE: "Ausgeführte Tätigkeit",
    EN: "Executed activity",
    IT: "Attività svolta",
    TR: "Yapılan faaliyet",
    SQ: "Veprimtaria e kryer",
    KU: "Çalakiya hatiye kirin",
    RO: "Activitate efectuată",
  },
  travelTime: {
    DE: "Fahrtzeit",
    EN: "Travel time",
    IT: "Tempo di viaggio",
    TR: "Yol süresi",
    SQ: "Koha e udhëtimit",
    KU: "Dema rêyê",
    RO: "Timp de deplasare",
  },
  manualBreak: {
    DE: "Manuell eingetragene Pause",
    EN: "Manually entered break",
    IT: "Pausa inserita manualmente",
    TR: "Elle girilen mola",
    SQ: "Pushim i futur manualisht",
    KU: "Bêhnvedana bi destan hatiye nivîsandin",
    RO: "Pauză introdusă manual",
  },
  legallyRequired: {
    DE: "Gesetzlich erforderlich",
    EN: "Legally required",
    IT: "Richiesto per legge",
    TR: "Yasal olarak gerekli",
    SQ: "E kërkuar me ligj",
    KU: "Bi qanûnê pêwîst",
    RO: "Necesar legal",
  },
  autoSupplemented: {
    DE: "Automatisch ergänzt",
    EN: "Automatically supplemented",
    IT: "Integrato automaticamente",
    TR: "Otomatik tamamlandı",
    SQ: "Plotësuar automatikisht",
    KU: "Bi awayekî otomatîk hat zêdekirin",
    RO: "Completat automat",
  },
  noAutoSupplement: {
    DE: "Keine automatische Ergänzung",
    EN: "No automatic supplement",
    IT: "Nessuna integrazione automatica",
    TR: "Otomatik tamamlama yok",
    SQ: "Pa plotësim automatik",
    KU: "Ti zêdekirina otomatîk tune",
    RO: "Fără completare automată",
  },
  effectiveBreakTotal: {
    DE: "Wirksame Pause gesamt",
    EN: "Effective total break",
    IT: "Pausa effettiva totale",
    TR: "Toplam etkili mola",
    SQ: "Pushimi efektiv total",
    KU: "Bêhnvedana bi bandor a giştî",
    RO: "Pauză efectivă totală",
  },
  note: {
    DE: "Notiz",
    EN: "Note",
    IT: "Nota",
    TR: "Not",
    SQ: "Shënim",
    KU: "Nîşe",
    RO: "Notiță",
  },
  noNoteAvailable: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
    RO: "Nu există nicio notiță.",
  },
  dateAndTimeNotEditable: {
    DE: "Datum & Zeit (nicht änderbar)",
    EN: "Date & time (not editable)",
    IT: "Data e ora (non modificabili)",
    TR: "Tarih ve saat (değiştirilemez)",
    SQ: "Data & ora (nuk mund të ndryshohet)",
    KU: "Dîrok û dem (nayê guhertin)",
    RO: "Data și ora (nu pot fi modificate)",
  },
  activity: {
    DE: "Tätigkeit",
    EN: "Activity",
    IT: "Attività",
    TR: "Faaliyet",
    SQ: "Veprimtaria",
    KU: "Çalakî",
    RO: "Activitate",
  },
  location: {
    DE: "Ort",
    EN: "Location",
    IT: "Luogo",
    TR: "Konum",
    SQ: "Vendi",
    KU: "Cih",
    RO: "Locație",
  },
  travelTimeMinutes: {
    DE: "Fahrtzeit (Min)",
    EN: "Travel time (min)",
    IT: "Tempo di viaggio (min)",
    TR: "Yol süresi (dk)",
    SQ: "Koha e udhëtimit (min)",
    KU: "Dema rêyê (deq)",
    RO: "Timp de deplasare (min)",
  },
  saving: {
    DE: "Speichere…",
    EN: "Saving…",
    IT: "Salvataggio…",
    TR: "Kaydediliyor…",
    SQ: "Duke ruajtur…",
    KU: "Tê tomarkirin…",
    RO: "Se salvează…",
  },
  save: {
    DE: "Speichern",
    EN: "Save",
    IT: "Salva",
    TR: "Kaydet",
    SQ: "Ruaj",
    KU: "Tomar bike",
    RO: "Salvează",
  },
  monthTotal: {
    DE: "Monat (gesamt)",
    EN: "Month (total)",
    IT: "Mese (totale)",
    TR: "Ay (toplam)",
    SQ: "Muaji (gjithsej)",
    KU: "Meh (tevahî)",
    RO: "Lună (total)",
  },
  workTimeTotal: {
    DE: "Arbeitszeit gesamt:",
    EN: "Total work time:",
    IT: "Tempo di lavoro totale:",
    TR: "Toplam çalışma süresi:",
    SQ: "Koha totale e punës:",
    KU: "Dema karê ya giştî:",
    RO: "Timp total de lucru:",
  },
  vacation: {
    DE: "Urlaub:",
    EN: "Vacation:",
    IT: "Ferie:",
    TR: "İzin:",
    SQ: "Pushim:",
    KU: "Betlane:",
    RO: "Concediu:",
  },
  sick: {
    DE: "Krank:",
    EN: "Sick:",
    IT: "Malattia:",
    TR: "Hastalık:",
    SQ: "Sëmurë:",
    KU: "Nexweş:",
    RO: "Bolnav:",
  },
  unpaidVacation: {
    DE: "Urlaub unbezahlt:",
    EN: "Unpaid vacation:",
    IT: "Ferie non pagate:",
    TR: "Ücretsiz izin:",
    SQ: "Pushim i papaguar:",
    KU: "Betlaneya bêpere:",
    RO: "Concediu neplătit:",
  },
  overtimeGross: {
    DE: "Überstunden (Brutto):",
    EN: "Overtime (gross):",
    IT: "Straordinari (lordi):",
    TR: "Fazla mesai (brüt):",
    SQ: "Orë shtesë (bruto):",
    KU: "Demjimêrên zêde (brût):",
    RO: "Ore suplimentare (brut):",
  },
  entries: {
    DE: "Einträge:",
    EN: "Entries:",
    IT: "Voci:",
    TR: "Kayıtlar:",
    SQ: "Hyrje:",
    KU: "Tomar:",
    RO: "Înregistrări:",
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
  noDashboardData: {
    DE: "Keine Dashboarddaten verfügbar.",
    EN: "No dashboard data available.",
    IT: "Nessun dato dashboard disponibile.",
    TR: "Gösterge paneli verisi yok.",
    SQ: "Nuk ka të dhëna paneli.",
    KU: "Ti daneya dashboardê tune ye.",
    RO: "Nu sunt disponibile date pentru tabloul de bord.",
  },
  noEmployeesInPeriod: {
    DE: "Keine Mitarbeiter im Zeitraum.",
    EN: "No employees in selected period.",
    IT: "Nessun dipendente nel periodo selezionato.",
    TR: "Seçilen dönemde çalışan yok.",
    SQ: "Nuk ka punonjës në periudhën e zgjedhur.",
    KU: "Di dema hilbijartî de ti karmend tune ne.",
    RO: "Nu există angajați în perioada selectată.",
  },
  noEntries: {
    DE: "Keine Einträge.",
    EN: "No entries.",
    IT: "Nessuna voce.",
    TR: "Kayıt yok.",
    SQ: "Nuk ka hyrje.",
    KU: "Ti tomar tune ne.",
    RO: "Nu există înregistrări.",
  },
  expandCollapse: {
    DE: "Ein-/Ausklappen",
    EN: "Expand/collapse",
    IT: "Espandi/comprimi",
    TR: "Genişlet/daralt",
    SQ: "Hap/mbyll",
    KU: "Veke/bigire",
    RO: "Extinde/restrânge",
  },
  workTimes: {
    DE: "🛠 Arbeitszeiten",
    EN: "🛠 Work times",
    IT: "🛠 Orari di lavoro",
    TR: "🛠 Çalışma süreleri",
    SQ: "🛠 Orari i punës",
    KU: "🛠 Demên karê",
    RO: "🛠 Timpuri de lucru",
  },
  entry: {
    DE: "Eintrag",
    EN: "entry",
    IT: "voce",
    TR: "kayıt",
    SQ: "hyrje",
    KU: "tomar",
    RO: "înregistrare",
  },
  entriesPlural: {
    DE: "Einträge",
    EN: "entries",
    IT: "voci",
    TR: "kayıt",
    SQ: "hyrje",
    KU: "tomar",
    RO: "înregistrări",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zi",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zile",
  },
  pause: {
    DE: "Pause",
    EN: "break",
    IT: "pausa",
    TR: "mola",
    SQ: "pushim",
    KU: "bêhnvedan",
    RO: "pauză",
  },
  showBreakDetails: {
    DE: "Pausen-Details anzeigen",
    EN: "Show break details",
    IT: "Mostra dettagli pausa",
    TR: "Mola detaylarını göster",
    SQ: "Shfaq detajet e pushimit",
    KU: "Hûrguliyên bêhnvedanê nîşan bide",
    RO: "Arată detaliile pauzei",
  },
  showDetails: {
    DE: "Details anzeigen",
    EN: "Show details",
    IT: "Mostra dettagli",
    TR: "Detayları göster",
    SQ: "Shfaq detajet",
    KU: "Hûrguliyan nîşan bide",
    RO: "Arată detaliile",
  },
  showEmployeeNote: {
    DE: "Mitarbeiter-Notiz anzeigen",
    EN: "Show employee note",
    IT: "Mostra nota dipendente",
    TR: "Çalışan notunu göster",
    SQ: "Shfaq shënimin e punonjësit",
    KU: "Nîşeya karmend nîşan bide",
    RO: "Arată notița angajatului",
  },
  editWithoutTime: {
    DE: "Bearbeiten (ohne Zeit)",
    EN: "Edit (without time)",
    IT: "Modifica (senza orario)",
    TR: "Düzenle (saat olmadan)",
    SQ: "Ndrysho (pa orë)",
    KU: "Biguherîne (bê dem)",
    RO: "Editează (fără oră)",
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
  noSiteOrAddress: {
    DE: "Keine Baustelle / Adresse hinterlegt",
    EN: "No site / address stored",
    IT: "Nessun cantiere / indirizzo salvato",
    TR: "Şantiye / adres kayıtlı değil",
    SQ: "Nuk ka kantier / adresë të ruajtur",
    KU: "Ti cihê karê / navnîşan nehatî tomar kirin",
    RO: "Nu este salvat niciun șantier / nicio adresă",
  },
  noWorkTimesInMonth: {
    DE: "Keine Arbeitszeiten im Monat.",
    EN: "No work times in month.",
    IT: "Nessun orario di lavoro nel mese.",
    TR: "Ay içinde çalışma süresi yok.",
    SQ: "Nuk ka orar pune në muaj.",
    KU: "Di mehê de demê karê tune ye.",
    RO: "Nu există timpi de lucru în această lună.",
  },
  sickness: {
    DE: "🌡 Krankheit",
    EN: "🌡 Sickness",
    IT: "🌡 Malattia",
    TR: "🌡 Hastalık",
    SQ: "🌡 Sëmundje",
    KU: "🌡 Nexweşî",
    RO: "🌡 Boală",
  },
  period: {
    DE: "Zeitraum",
    EN: "period",
    IT: "periodo",
    TR: "dönem",
    SQ: "periudhë",
    KU: "dem",
    RO: "perioadă",
  },
  periods: {
    DE: "Zeiträume",
    EN: "periods",
    IT: "periodi",
    TR: "dönem",
    SQ: "periudha",
    KU: "dem",
    RO: "perioade",
  },
  sickLabel: {
    DE: "🌡 Krank",
    EN: "🌡 Sick",
    IT: "🌡 Malato",
    TR: "🌡 Hasta",
    SQ: "🌡 Sëmurë",
    KU: "🌡 Nexweş",
    RO: "🌡 Bolnav",
  },
  noSickDaysInMonth: {
    DE: "Keine Krankheitstage im Monat.",
    EN: "No sick days in month.",
    IT: "Nessun giorno di malattia nel mese.",
    TR: "Ay içinde hastalık günü yok.",
    SQ: "Nuk ka ditë sëmundjeje në muaj.",
    KU: "Di mehê de rojên nexweşiyê tune ne.",
    RO: "Nu există zile de boală în această lună.",
  },
  vacationLabel: {
    DE: "🌴 Urlaub",
    EN: "🌴 Vacation",
    IT: "🌴 Ferie",
    TR: "🌴 İzin",
    SQ: "🌴 Pushim",
    KU: "🌴 Betlane",
    RO: "🌴 Concediu",
  },
  vacationUnpaidLabel: {
    DE: "💸 Urlaub unbezahlt",
    EN: "💸 Unpaid vacation",
    IT: "💸 Ferie non pagate",
    TR: "💸 Ücretsiz izin",
    SQ: "💸 Pushim i papaguar",
    KU: "💸 Betlaneya bêpere",
    RO: "💸 Concediu neplătit",
  },
  noVacationInMonth: {
    DE: "Kein Urlaub im Monat.",
    EN: "No vacation in month.",
    IT: "Nessuna ferie nel mese.",
    TR: "Ay içinde izin yok.",
    SQ: "Nuk ka pushim në muaj.",
    KU: "Di mehê de betlane tune ye.",
    RO: "Nu există concediu în această lună.",
  },
  halfDay: {
    DE: "0,5 Tag",
    EN: "0.5 day",
    IT: "0,5 giorno",
    TR: "0,5 gün",
    SQ: "0,5 ditë",
    KU: "0.5 roj",
    RO: "0,5 zi",
  },
  dashboard: {
    DE: "Dashboard",
    EN: "Dashboard",
    IT: "Dashboard",
    TR: "Gösterge paneli",
    SQ: "Paneli",
    KU: "Dashboard",
    RO: "Tablou de bord",
  },
  activeEmployeesModal: {
    DE: "Aktive Mitarbeiter",
    EN: "Active employees",
    IT: "Dipendenti attivi",
    TR: "Aktif çalışanlar",
    SQ: "Punonjës aktivë",
    KU: "Karmendên çalak",
    RO: "Angajați activi",
  },
  missingEntriesTodayModal: {
    DE: "Fehlende Einträge heute",
    EN: "Missing entries today",
    IT: "Voci mancanti oggi",
    TR: "Bugün eksik kayıtlar",
    SQ: "Hyrje që mungojnë sot",
    KU: "Tomarên winda yên îro",
    RO: "Înregistrări lipsă astăzi",
  },
  absencesTodayModal: {
    DE: "Abwesenheiten heute",
    EN: "Absences today",
    IT: "Assenze oggi",
    TR: "Bugünkü devamsızlıklar",
    SQ: "Mungesa sot",
    KU: "Nebûnên îro",
    RO: "Absențe astăzi",
  },
  missingEntriesGeneralModal: {
    DE: "Fehlende Einträge (allgemein)",
    EN: "Missing entries (general)",
    IT: "Voci mancanti (generale)",
    TR: "Eksik kayıtlar (genel)",
    SQ: "Hyrje që mungojnë (në përgjithësi)",
    KU: "Tomarên winda (giştî)",
    RO: "Înregistrări lipsă (general)",
  },
  dash: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    KU: "—",
    RO: "—",
  },
  workTimeHours: {
    DE: "Arbeitszeit",
    EN: "Work time",
    IT: "Tempo di lavoro",
    TR: "Çalışma süresi",
    SQ: "Koha e punës",
    KU: "Dema karê",
    RO: "Timp de lucru",
  },
  vacationHours: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Betlane",
    RO: "Concediu",
  },
  sickHours: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmurë",
    KU: "Nexweş",
    RO: "Bolnav",
  },
  unpaidVacationHours: {
    DE: "Urlaub unbezahlt",
    EN: "Unpaid vacation",
    IT: "Ferie non pagate",
    TR: "Ücretsiz izin",
    SQ: "Pushim i papaguar",
    KU: "Betlaneya bêpere",
    RO: "Concediu neplătit",
  },
  openActiveEmployeesList: {
    DE: "Liste aktiver Mitarbeiter öffnen",
    EN: "Open list of active employees",
    IT: "Apri elenco dipendenti attivi",
    TR: "Aktif çalışan listesini aç",
    SQ: "Hap listën e punonjësve aktivë",
    KU: "Lîsteya karmendên çalak veke",
    RO: "Deschide lista angajaților activi",
  },
  openMissingEntriesList: {
    DE: "Liste fehlender Einträge öffnen",
    EN: "Open list of missing entries",
    IT: "Apri elenco voci mancanti",
    TR: "Eksik kayıtlar listesini aç",
    SQ: "Hap listën e hyrjeve që mungojnë",
    KU: "Lîsteya tomarên winda veke",
    RO: "Deschide lista înregistrărilor lipsă",
  },
  openAbsencesList: {
    DE: "Liste heutiger Abwesenheiten öffnen",
    EN: "Open list of today's absences",
    IT: "Apri elenco delle assenze di oggi",
    TR: "Bugünkü devamsızlık listesini aç",
    SQ: "Hap listën e mungesave të sotme",
    KU: "Lîsteya nebûnên îroyê veke",
    RO: "Deschide lista absențelor de astăzi",
  },
  openGeneralMissingEntriesList: {
    DE: "Liste allgemeiner überfälliger fehlender Arbeitseinträge öffnen",
    EN: "Open list of general overdue missing work entries",
    IT: "Apri elenco generale delle registrazioni di lavoro mancanti e scadute",
    TR: "Genel gecikmiş eksik çalışma kayıtları listesini aç",
    SQ: "Hap listën e hyrjeve të përgjithshme të munguar të vonuara të punës",
    KU: "Lîsteya giştî ya tomarên karê winda yên derengmayî veke",
    RO: "Deschide lista generală a înregistrărilor de muncă lipsă restante",
  },
  expandCollapseTitle: {
    DE: "Ein-/Ausklappen",
    EN: "Expand/collapse",
    IT: "Espandi/comprimi",
    TR: "Genişlet/daralt",
    SQ: "Hap/mbyll",
    KU: "Veke/bigire",
    RO: "Extinde/restrânge",
  },
  remindMissingNotLoggedIn: {
    DE: "Nicht eingeloggt.",
    EN: "Not logged in.",
    IT: "Accesso non effettuato.",
    TR: "Oturum açılmamış.",
    SQ: "Nuk jeni të identifikuar.",
    KU: "Têketin nehatiye kirin.",
    RO: "Nu ești autentificat.",
  },
  remindMissingForbidden: {
    DE: "Kein Zugriff.",
    EN: "Access denied.",
    IT: "Accesso negato.",
    TR: "Erişim reddedildi.",
    SQ: "Qasja u refuzua.",
    KU: "Gihîştin hat redkirin.",
    RO: "Acces refuzat.",
  },
  remindMissingInvalidBody: {
    DE: "Ungültige Anfrage.",
    EN: "Invalid request.",
    IT: "Richiesta non valida.",
    TR: "Geçersiz istek.",
    SQ: "Kërkesë e pavlefshme.",
    KU: "Daxwaza nederbasdar.",
    RO: "Solicitare invalidă.",
  },
  remindMissingEmployeeIdMissing: {
    DE: "Mitarbeiter-ID fehlt.",
    EN: "Employee ID is missing.",
    IT: "Manca l'ID del dipendente.",
    TR: "Çalışan kimliği eksik.",
    SQ: "Mungon ID-ja e punonjësit.",
    KU: "Nasnameya karmend kêm e.",
    RO: "Lipsește ID-ul angajatului.",
  },
  remindMissingEmployeeNotFound: {
    DE: "Mitarbeiter nicht gefunden.",
    EN: "Employee not found.",
    IT: "Dipendente non trovato.",
    TR: "Çalışan bulunamadı.",
    SQ: "Punonjësi nuk u gjet.",
    KU: "Karmend nehat dîtin.",
    RO: "Angajatul nu a fost găsit.",
  },
  remindMissingNoOverdueEntries: {
    DE: "Für diesen Mitarbeiter gibt es aktuell keine überfälligen fehlenden Arbeitseinträge.",
    EN: "There are currently no overdue missing work entries for this employee.",
    IT: "Attualmente non ci sono registrazioni di lavoro mancanti e scadute per questo dipendente.",
    TR: "Bu çalışan için şu anda gecikmiş eksik çalışma kaydı yok.",
    SQ: "Aktualisht nuk ka hyrje pune të munguar të vonuara për këtë punonjës.",
    KU: "Niha ji bo vî karmendî ti tomara karê winda ya derengmayî tune ye.",
    RO: "În prezent nu există înregistrări de muncă lipsă restante pentru acest angajat.",
  },
  remindMissingNoPushSubscription: {
    DE: "Für diesen Mitarbeiter ist keine aktive Push-Subscription vorhanden.",
    EN: "There is no active push subscription for this employee.",
    IT: "Per questo dipendente non è disponibile alcuna sottoscrizione push attiva.",
    TR: "Bu çalışan için aktif bir push aboneliği yok.",
    SQ: "Për këtë punonjës nuk ka abonim aktiv push.",
    KU: "Ji bo vî karmendî ti abonetiya push a çalak tune ye.",
    RO: "Nu există un abonament push activ pentru acest angajat.",
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
    RO: "#putemfaceasta",
  },
  loadingInitial: {
    DE: "Lädt Urlaubsanträge...",
    EN: "Loading vacation requests...",
    IT: "Caricamento richieste di ferie...",
    TR: "İzin talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat për pushim...",
    KU: "Daxwazên betlaneyê têne barkirin...",
    RO: "Se încarcă cererile de concediu...",
  },
  remainingVacation: {
    DE: "Resturlaub",
    EN: "Remaining vacation",
    IT: "Ferie residue",
    TR: "Kalan izin",
    SQ: "Pushimi i mbetur",
    KU: "Betlaneya mayî",
    RO: "Concediu rămas",
  },
  loadingVacationAccount: {
    DE: "Urlaubskonto wird geladen…",
    EN: "Vacation balance is loading…",
    IT: "Il saldo ferie si sta caricando…",
    TR: "İzin bakiyesi yükleniyor…",
    SQ: "Bilanci i pushimit po ngarkohet…",
    KU: "Hejmara betlaneyê tê barkirin…",
    RO: "Soldul concediului se încarcă…",
  },
  approvedPaidOfAccrued: {
    DE: "von",
    EN: "of",
    IT: "di",
    TR: "içinden",
    SQ: "nga",
    KU: "ji",
    RO: "din",
  },
  usedOfAccrued: {
    DE: "von",
    EN: "of",
    IT: "di",
    TR: "içinden",
    SQ: "nga",
    KU: "ji",
    RO: "din",
  },
  alreadyTaken: {
    DE: "Bereits genommen:",
    EN: "Already taken:",
    IT: "Già utilizzate:",
    TR: "Zaten kullanıldı:",
    SQ: "Të përdorura tashmë:",
    KU: "Jixwe hatine girtin:",
    RO: "Deja utilizat:",
  },
  asOf: {
    DE: "Stand",
    EN: "As of",
    IT: "Stato al",
    TR: "Durum",
    SQ: "Gjendja më",
    KU: "Rewş di",
    RO: "La data de",
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
    TR: "Seçilen çalışan",
    SQ: "Punonjësi i zgjedhur",
    KU: "Karmenda hilbijartî",
    RO: "Angajat selectat",
  },
  vacationYear: {
    DE: "Urlaubsjahr",
    EN: "Vacation year",
    IT: "Anno ferie",
    TR: "İzin yılı",
    SQ: "Viti i pushimit",
    KU: "Sala betlaneyê",
    RO: "Anul concediului",
  },
  asOfMonth: {
    DE: "Stand",
    EN: "As of",
    IT: "Stato",
    TR: "Durum",
    SQ: "Gjendja",
    KU: "Rewş",
    RO: "La data de",
  },
  pendingRequestsKpi: {
    DE: "Offene Urlaubsanträge",
    EN: "Open vacation requests",
    IT: "Richieste di ferie aperte",
    TR: "Açık izin talepleri",
    SQ: "Kërkesa të hapura për pushim",
    KU: "Daxwazên betlaneyê yên vekirî",
    RO: "Cereri de concediu deschise",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobat",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respins",
  },
  pageTitle: {
    DE: "Urlaubsanträge",
    EN: "Vacation requests",
    IT: "Richieste di ferie",
    TR: "İzin talepleri",
    SQ: "Kërkesa për pushim",
    KU: "Daxwazên betlaneyê",
    RO: "Cereri de concediu",
  },
  pageDescription: {
    DE: "Hier siehst du alle Urlaubsanträge deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.",
    EN: "Here you can see all vacation requests from your employees and approve or reject open requests directly.",
    IT: "Qui puoi vedere tutte le richieste di ferie dei tuoi dipendenti e approvare o rifiutare direttamente quelle aperte.",
    TR: "Burada çalışanlarınızın tüm izin taleplerini görebilir ve açık talepleri doğrudan onaylayabilir veya reddedebilirsiniz.",
    SQ: "Këtu mund të shohësh të gjitha kërkesat për pushim të punonjësve të tu dhe t'i miratosh ose refuzosh direkt kërkesat e hapura.",
    KU: "Li vir hemû daxwazên betlaneyê yên karmendên xwe dibînî û dikarî daxwazên vekirî rasterast pejirînî an red bikî.",
    RO: "Aici poți vedea toate cererile de concediu ale angajaților tăi și poți aproba sau respinge direct cererile deschise.",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
    RO: "Angajat",
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
  loadError: {
    DE: "Urlaubsanträge konnten nicht geladen werden.",
    EN: "Vacation requests could not be loaded.",
    IT: "Impossibile caricare le richieste di ferie.",
    TR: "İzin talepleri yüklenemedi.",
    SQ: "Kërkesat për pushim nuk mund të ngarkoheshin.",
    KU: "Daxwazên betlaneyê nehatin barkirin.",
    RO: "Cererile de concediu nu au putut fi încărcate.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Urlaubsanträge.",
    EN: "Network error while loading vacation requests.",
    IT: "Errore di rete durante il caricamento delle richieste di ferie.",
    TR: "İzin talepleri yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të kërkesave për pushim.",
    KU: "Dema barkirina daxwazên betlaneyê de xeletiya torê çêbû.",
    RO: "Eroare de rețea la încărcarea cererilor de concediu.",
  },
  remainingLoadError: {
    DE: "Resturlaub konnte nicht geladen werden.",
    EN: "Remaining vacation could not be loaded.",
    IT: "Impossibile caricare le ferie residue.",
    TR: "Kalan izin yüklenemedi.",
    SQ: "Pushimi i mbetur nuk mund të ngarkohej.",
    KU: "Betlaneya mayî nehate barkirin.",
    RO: "Concediul rămas nu a putut fi încărcat.",
  },
  remainingNetworkError: {
    DE: "Netzwerkfehler beim Laden des Resturlaubs.",
    EN: "Network error while loading remaining vacation.",
    IT: "Errore di rete durante il caricamento delle ferie residue.",
    TR: "Kalan izin yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të pushimit të mbetur.",
    KU: "Dema barkirina betlaneya mayî de xeletiya torê çêbû.",
    RO: "Eroare de rețea la încărcarea concediului rămas.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
    RO: "Cererea nu a fost găsită.",
  },
  approveFailed: {
    DE: "Genehmigung fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onay başarısız oldu.",
    SQ: "Miratimi dështoi.",
    KU: "Pejirandin serneket.",
    RO: "Aprobarea a eșuat.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler bei der Genehmigung.",
    EN: "Network error during approval.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onay sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    KU: "Dema pejirandinê de xeletiya torê.",
    RO: "Eroare de rețea în timpul aprobării.",
  },
  rejectFailed: {
    DE: "Ablehnung fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız oldu.",
    SQ: "Refuzimi dështoi.",
    KU: "Redkirin serneket.",
    RO: "Respingerea a eșuat.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler bei der Ablehnung.",
    EN: "Network error during rejection.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    KU: "Dema redkirinê de xeletiya torê.",
    RO: "Eroare de rețea în timpul respingerii.",
  },
  deleteConfirm: {
    DE: "Möchtest du diesen Urlaubsantrag wirklich dauerhaft löschen?",
    EN: "Do you really want to permanently delete this vacation request?",
    IT: "Vuoi davvero eliminare definitivamente questa richiesta di ferie?",
    TR: "Bu izin talebini kalıcı olarak silmek istediğinizden emin misiniz?",
    SQ: "A dëshiron vërtet ta fshish përgjithmonë këtë kërkesë për pushim?",
    KU: "Tu bi rastî dixwazî vê daxwaza betlaneyê bi temamî jê bibî?",
    RO: "Chiar dorești să ștergi definitiv această cerere de concediu?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
    RO: "Ștergerea a eșuat.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
    RO: "Eroare de rețea la ștergere.",
  },
  changeFailed: {
    DE: "Änderung fehlgeschlagen.",
    EN: "Change failed.",
    IT: "Modifica non riuscita.",
    TR: "Değişiklik başarısız oldu.",
    SQ: "Ndryshimi dështoi.",
    KU: "Guhertin serneket.",
    RO: "Modificarea a eșuat.",
  },
  updateFailed: {
    DE: "Antragsdaten konnten nicht aktualisiert werden.",
    EN: "Request data could not be updated.",
    IT: "Impossibile aggiornare i dati della richiesta.",
    TR: "Talep verileri güncellenemedi.",
    SQ: "Të dhënat e kërkesës nuk mund të përditësoheshin.",
    KU: "Daneyên daxwazê nehatin nûvekirin.",
    RO: "Datele cererii nu au putut fi actualizate.",
  },
  changeNetworkError: {
    DE: "Netzwerkfehler bei der Änderung.",
    EN: "Network error while changing.",
    IT: "Errore di rete durante la modifica.",
    TR: "Değişiklik sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ndryshimit.",
    KU: "Dema guhertinê de xeletiya torê.",
    RO: "Eroare de rețea în timpul modificării.",
  },
  statusOpen: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "E hapur",
    KU: "Vekirî",
    RO: "Deschis",
  },
  statusApproved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvata",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobat",
  },
  statusRejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutata",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respins",
  },
  createdAt: {
    DE: "Erstellt:",
    EN: "Created:",
    IT: "Creata:",
    TR: "Oluşturuldu:",
    SQ: "Krijuar:",
    KU: "Hate afirandin:",
    RO: "Creat:",
  },
  decisionAt: {
    DE: "Entscheidung:",
    EN: "Decision:",
    IT: "Decisione:",
    TR: "Karar:",
    SQ: "Vendimi:",
    KU: "Biryar:",
    RO: "Decizie:",
  },
  period: {
    DE: "Zeitraum",
    EN: "Period",
    IT: "Periodo",
    TR: "Dönem",
    SQ: "Periudha",
    KU: "Dem",
    RO: "Perioadă",
  },
  start: {
    DE: "Start",
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
  type: {
    DE: "Typ",
    EN: "Type",
    IT: "Tipo",
    TR: "Tür",
    SQ: "Lloji",
    KU: "Cure",
    RO: "Tip",
  },
  typeVacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Betlane",
    RO: "Concediu",
  },
  typeSick: {
    DE: "Krankheit",
    EN: "Sickness",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmundje",
    KU: "Nexweşî",
    RO: "Boală",
  },
  scope: {
    DE: "Umfang",
    EN: "Scope",
    IT: "Entità",
    TR: "Kapsam",
    SQ: "Shtrirja",
    KU: "Berfirehî",
    RO: "Amploare",
  },
  fullDay: {
    DE: "Ganzer Tag",
    EN: "Full day",
    IT: "Giornata intera",
    TR: "Tam gün",
    SQ: "Ditë e plotë",
    KU: "Rojek temam",
    RO: "Zi întreagă",
  },
  halfDay: {
    DE: "Halber Tag",
    EN: "Half day",
    IT: "Mezza giornata",
    TR: "Yarım gün",
    SQ: "Gjysmë dite",
    KU: "Nîv roj",
    RO: "Jumătate de zi",
  },
  compensation: {
    DE: "Vergütung",
    EN: "Compensation",
    IT: "Retribuzione",
    TR: "Ücretlendirme",
    SQ: "Kompensimi",
    KU: "Tezmînat",
    RO: "Compensație",
  },
  paid: {
    DE: "Bezahlt",
    EN: "Paid",
    IT: "Pagata",
    TR: "Ücretli",
    SQ: "E paguar",
    KU: "Bi pere",
    RO: "Plătit",
  },
  unpaid: {
    DE: "Unbezahlt",
    EN: "Unpaid",
    IT: "Non pagata",
    TR: "Ücretsiz",
    SQ: "E papaguar",
    KU: "Bêpere",
    RO: "Neplătit",
  },
  employeeNote: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota del dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
    RO: "Notița angajatului",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
    RO: "Nu există nicio notiță.",
  },
  processedBy: {
    DE: "Bearbeitet von",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen kişi",
    SQ: "Përpunuar nga",
    KU: "Ji aliyê vê kesî ve hate kirin",
    RO: "Procesat de",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende nuk është vendosur",
    KU: "Hêj biryar nehatî dayîn",
    RO: "Încă nedecis",
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
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
    RO: "Șterge",
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
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    KU: "Red bike",
    RO: "Respinge",
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
  approveCorrected: {
    DE: "Korrigieren & genehmigen",
    EN: "Correct & approve",
    IT: "Correggi e approva",
    TR: "Düzelt ve onayla",
    SQ: "Korrigjo dhe mirato",
    KU: "Rast bike û pejirîne",
    RO: "Corectează și aprobă",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke u përpunuar...",
    KU: "Tê pêvajokirin...",
    RO: "Se procesează...",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guhertinan tomar bike",
    RO: "Salvează modificările",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
    RO: "Se salvează...",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    KU: "Biguherîne",
    RO: "Editează",
  },
  openSection: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperte",
    TR: "Açık",
    SQ: "Të hapura",
    KU: "Vekirî",
    RO: "Deschise",
  },
  approvedSection: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Të miratuara",
    KU: "Pejirandî",
    RO: "Aprobate",
  },
  rejectedSection: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Të refuzuara",
    KU: "Redkirî",
    RO: "Respinse",
  },
  emptyOpen: {
    DE: "Keine offenen Urlaubsanträge für diesen Filter.",
    EN: "No open vacation requests for this filter.",
    IT: "Nessuna richiesta di ferie aperta per questo filtro.",
    TR: "Bu filtre için açık izin talebi yok.",
    SQ: "Nuk ka kërkesa të hapura për pushim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza betlaneyê ya vekirî tune ye.",
    RO: "Nu există cereri de concediu deschise pentru acest filtru.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Urlaubsanträge für diesen Filter.",
    EN: "No approved vacation requests for this filter.",
    IT: "Nessuna richiesta di ferie approvata per questo filtro.",
    TR: "Bu filtre için onaylanmış izin talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara për pushim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza betlaneyê ya pejirandî tune ye.",
    RO: "Nu există cereri de concediu aprobate pentru acest filtru.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Urlaubsanträge für diesen Filter.",
    EN: "No rejected vacation requests for this filter.",
    IT: "Nessuna richiesta di ferie rifiutata per questo filtro.",
    TR: "Bu filtre için reddedilmiş izin talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara për pushim për këtë filtër.",
    KU: "Ji bo vî fîlterî daxwaza betlaneyê ya redkirî tune ye.",
    RO: "Nu există cereri de concediu respinse pentru acest filtru.",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zi",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zile",
  },
  halfVacationDay: {
    DE: "halber Urlaubstag",
    EN: "half vacation day",
    IT: "mezza giornata di ferie",
    TR: "yarım izin günü",
    SQ: "gjysmë dite pushimi",
    KU: "nîv roja betlaneyê",
    RO: "jumătate de zi de concediu",
  },
  total: {
    DE: "gesamt",
    EN: "total",
    IT: "totale",
    TR: "toplam",
    SQ: "gjithsej",
    KU: "tevahî",
    RO: "total",
  },
  mixedCompensationPrefix: {
    DE: "Für diesen Antrag ist aktuell eine gemischte Vergütung vorgesehen.",
    EN: "A mixed compensation is currently planned for this request.",
    IT: "Per questa richiesta è attualmente prevista una retribuzione mista.",
    TR: "Bu talep için şu anda karma bir ücretlendirme öngörülüyor.",
    SQ: "Për këtë kërkesë aktualisht parashikohet një kompensim i përzier.",
    KU: "Ji bo vê daxwazê niha tezmînata tevlihev hatî plan kirin.",
    RO: "Pentru această cerere este prevăzută în prezent o compensație mixtă.",
  },
  insufficientPaidVacationHint: {
    DE: "Für diesen Antrag ist aktuell unbezahlter Urlaub vorgesehen, weil nicht genug bezahlter Urlaub verfügbar war.",
    EN: "Unpaid vacation is currently planned for this request because not enough paid vacation was available.",
    IT: "Per questa richiesta sono attualmente previste ferie non retribuite perché non erano disponibili abbastanza ferie retribuite.",
    TR: "Bu talep için şu anda ücretsiz izin öngörülüyor çünkü yeterli ücretli izin mevcut değildi.",
    SQ: "Për këtë kërkesë aktualisht është parashikuar pushim i papaguar, sepse nuk kishte mjaftueshëm pushim të paguar në dispozicion.",
    KU: "Ji bo vê daxwazê niha betlaneya bêpere hatî plan kirin, ji ber ku têra betlaneya bi pere tunebû.",
    RO: "Pentru această cerere este prevăzut în prezent concediu neplătit, deoarece nu a fost disponibil suficient concediu plătit.",
  },
  ofWhich: {
    DE: "davon",
    EN: "of which",
    IT: "di cui",
    TR: "bunların",
    SQ: "prej tyre",
    KU: "ji wan",
    RO: "din care",
  },
  and: {
    DE: "und",
    EN: "and",
    IT: "e",
    TR: "ve",
    SQ: "dhe",
    KU: "û",
    RO: "și",
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
    RO: "#putemfaceasta",
  },
  loadingInitial: {
    DE: "Lädt Krankheitsanträge...",
    EN: "Loading sickness requests...",
    IT: "Caricamento richieste di malattia...",
    TR: "Hastalık talepleri yükleniyor...",
    SQ: "Po ngarkohen kërkesat për sëmundje...",
    KU: "Daxwazên nexweşiyê têne barkirin...",
    RO: "Se încarcă cererile de boală...",
  },
  pendingRequestsKpi: {
    DE: "Offene Krankheitsanträge",
    EN: "Open sickness requests",
    IT: "Richieste di malattia aperte",
    TR: "Açık hastalık talepleri",
    SQ: "Kërkesa të hapura për sëmundje",
    KU: "Daxwazên nexweşiyê yên vekirî",
    RO: "Cereri de boală deschise",
  },
  approvedKpi: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobat",
  },
  rejectedKpi: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respins",
  },
  pageTitle: {
    DE: "Krankheitsanträge",
    EN: "Sickness requests",
    IT: "Richieste di malattia",
    TR: "Hastalık talepleri",
    SQ: "Kërkesa për sëmundje",
    KU: "Daxwazên nexweşiyê",
    RO: "Cereri de boală",
  },
  pageDescription: {
    DE: "Hier siehst du alle Krankheitsanträge deiner Mitarbeiter und kannst offene Anträge direkt genehmigen oder ablehnen.",
    EN: "Here you can see all sickness requests from your employees and approve or reject open requests directly.",
    IT: "Qui puoi vedere tutte le richieste di malattia dei tuoi dipendenti e approvare o rifiutare direttamente quelle aperte.",
    TR: "Burada çalışanlarınızın tüm hastalık taleplerini görebilir ve açık talepleri doğrudan onaylayabilir veya reddedebilirsiniz.",
    SQ: "Këtu mund të shohësh të gjitha kërkesat për sëmundje të punonjësve të tu dhe t'i miratosh ose refuzosh direkt kërkesat e hapura.",
    KU: "Li vir hemû daxwazên nexweşiyê yên karmendên xwe dibînî û dikarî daxwazên vekirî rasterast pejirînî an red bikî.",
    RO: "Aici poți vedea toate cererile de boală ale angajaților tăi și poți aproba sau respinge direct cererile deschise.",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
    RO: "Angajat",
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
    TR: "Seçilen çalışan",
    SQ: "Punonjësi i zgjedhur",
    KU: "Karmenda hilbijartî",
    RO: "Angajat selectat",
  },
  loadError: {
    DE: "Krankheitsanträge konnten nicht geladen werden.",
    EN: "Sickness requests could not be loaded.",
    IT: "Impossibile caricare le richieste di malattia.",
    TR: "Hastalık talepleri yüklenemedi.",
    SQ: "Kërkesat për sëmundje nuk mund të ngarkoheshin.",
    KU: "Daxwazên nexweşiyê nehatin barkirin.",
    RO: "Cererile de boală nu au putut fi încărcate.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Krankheitsanträge.",
    EN: "Network error while loading sickness requests.",
    IT: "Errore di rete durante il caricamento delle richieste di malattia.",
    TR: "Hastalık talepleri yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të kërkesave për sëmundje.",
    KU: "Dema barkirina daxwazên nexweşiyê de xeletiya torê çêbû.",
    RO: "Eroare de rețea la încărcarea cererilor de boală.",
  },
  requestNotFound: {
    DE: "Antrag nicht gefunden.",
    EN: "Request not found.",
    IT: "Richiesta non trovata.",
    TR: "Talep bulunamadı.",
    SQ: "Kërkesa nuk u gjet.",
    KU: "Daxwaz nehat dîtin.",
    RO: "Cererea nu a fost găsită.",
  },
  approveFailed: {
    DE: "Genehmigung fehlgeschlagen.",
    EN: "Approval failed.",
    IT: "Approvazione non riuscita.",
    TR: "Onay başarısız oldu.",
    SQ: "Miratimi dështoi.",
    KU: "Pejirandin serneket.",
    RO: "Aprobarea a eșuat.",
  },
  approveNetworkError: {
    DE: "Netzwerkfehler bei der Genehmigung.",
    EN: "Network error during approval.",
    IT: "Errore di rete durante l'approvazione.",
    TR: "Onay sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë miratimit.",
    KU: "Dema pejirandinê de xeletiya torê.",
    RO: "Eroare de rețea în timpul aprobării.",
  },
  rejectFailed: {
    DE: "Ablehnung fehlgeschlagen.",
    EN: "Rejection failed.",
    IT: "Rifiuto non riuscito.",
    TR: "Reddetme başarısız oldu.",
    SQ: "Refuzimi dështoi.",
    KU: "Redkirin serneket.",
    RO: "Respingerea a eșuat.",
  },
  rejectNetworkError: {
    DE: "Netzwerkfehler bei der Ablehnung.",
    EN: "Network error during rejection.",
    IT: "Errore di rete durante il rifiuto.",
    TR: "Reddetme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë refuzimit.",
    KU: "Dema redkirinê de xeletiya torê.",
    RO: "Eroare de rețea în timpul respingerii.",
  },
  deleteConfirm: {
    DE: "Möchtest du diesen Krankheitsantrag wirklich dauerhaft löschen?",
    EN: "Do you really want to permanently delete this sickness request?",
    IT: "Vuoi davvero eliminare definitivamente questa richiesta di malattia?",
    TR: "Bu hastalık talebini kalıcı olarak silmek istediğinizden emin misiniz?",
    SQ: "A dëshiron vërtet ta fshish përgjithmonë këtë kërkesë për sëmundje?",
    KU: "Tu bi rastî dixwazî vê daxwaza nexweşiyê bi temamî jê bibî?",
    RO: "Chiar vrei să ștergi definitiv această cerere de boală?",
  },
  deleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
    RO: "Ștergerea a eșuat.",
  },
  deleteNetworkError: {
    DE: "Netzwerkfehler beim Löschen.",
    EN: "Network error while deleting.",
    IT: "Errore di rete durante l'eliminazione.",
    TR: "Silme sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë fshirjes.",
    KU: "Dema jêbirinê de xeletiya torê.",
    RO: "Eroare de rețea la ștergere.",
  },
  changeFailed: {
    DE: "Änderung fehlgeschlagen.",
    EN: "Change failed.",
    IT: "Modifica non riuscita.",
    TR: "Değişiklik başarısız oldu.",
    SQ: "Ndryshimi dështoi.",
    KU: "Guhertin serneket.",
    RO: "Modificarea a eșuat.",
  },
  updateFailed: {
    DE: "Antragsdaten konnten nicht aktualisiert werden.",
    EN: "Request data could not be updated.",
    IT: "Impossibile aggiornare i dati della richiesta.",
    TR: "Talep verileri güncellenemedi.",
    SQ: "Të dhënat e kërkesës nuk mund të përditësoheshin.",
    KU: "Daneyên daxwazê nehatin nûvekirin.",
    RO: "Datele cererii nu au putut fi actualizate.",
  },
  changeNetworkError: {
    DE: "Netzwerkfehler bei der Änderung.",
    EN: "Network error while changing.",
    IT: "Errore di rete durante la modifica.",
    TR: "Değişiklik sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë ndryshimit.",
    KU: "Dema guhertinê de xeletiya torê.",
    RO: "Eroare de rețea la modificare.",
  },
  statusOpen: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperta",
    TR: "Açık",
    SQ: "E hapur",
    KU: "Vekirî",
    RO: "Deschis",
  },
  statusApproved: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvata",
    TR: "Onaylandı",
    SQ: "Miratuar",
    KU: "Pejirandî",
    RO: "Aprobat",
  },
  statusRejected: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutata",
    TR: "Reddedildi",
    SQ: "Refuzuar",
    KU: "Redkirî",
    RO: "Respins",
  },
  createdAt: {
    DE: "Erstellt:",
    EN: "Created:",
    IT: "Creata:",
    TR: "Oluşturuldu:",
    SQ: "Krijuar:",
    KU: "Hate afirandin:",
    RO: "Creat:",
  },
  decisionAt: {
    DE: "Entscheidung:",
    EN: "Decision:",
    IT: "Decisione:",
    TR: "Karar:",
    SQ: "Vendimi:",
    KU: "Biryar:",
    RO: "Decizie:",
  },
  period: {
    DE: "Zeitraum",
    EN: "Period",
    IT: "Periodo",
    TR: "Dönem",
    SQ: "Periudha",
    KU: "Dem",
    RO: "Perioadă",
  },
  start: {
    DE: "Start",
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
  employeeNote: {
    DE: "Mitarbeiter-Notiz",
    EN: "Employee note",
    IT: "Nota del dipendente",
    TR: "Çalışan notu",
    SQ: "Shënim i punonjësit",
    KU: "Nîşeya karmend",
    RO: "Notița angajatului",
  },
  noNote: {
    DE: "Keine Notiz vorhanden.",
    EN: "No note available.",
    IT: "Nessuna nota disponibile.",
    TR: "Not yok.",
    SQ: "Nuk ka shënim.",
    KU: "Ti nîşe tune ye.",
    RO: "Nu există nicio notiță.",
  },
  processedBy: {
    DE: "Bearbeitet von",
    EN: "Processed by",
    IT: "Elaborata da",
    TR: "İşleyen kişi",
    SQ: "Përpunuar nga",
    KU: "Ji aliyê vê kesî ve hate kirin",
    RO: "Procesat de",
  },
  notDecidedYet: {
    DE: "Noch nicht entschieden",
    EN: "Not decided yet",
    IT: "Non ancora deciso",
    TR: "Henüz karar verilmedi",
    SQ: "Ende nuk është vendosur",
    KU: "Hêj biryar nehatî dayîn",
    RO: "Încă nedecis",
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
  delete: {
    DE: "Löschen",
    EN: "Delete",
    IT: "Elimina",
    TR: "Sil",
    SQ: "Fshij",
    KU: "Jê bibe",
    RO: "Șterge",
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
  reject: {
    DE: "Ablehnen",
    EN: "Reject",
    IT: "Rifiuta",
    TR: "Reddet",
    SQ: "Refuzo",
    KU: "Red bike",
    RO: "Respinge",
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
  approveCorrected: {
    DE: "Korrigieren & genehmigen",
    EN: "Correct & approve",
    IT: "Correggi e approva",
    TR: "Düzelt ve onayla",
    SQ: "Korrigjo dhe mirato",
    KU: "Rast bike û pejirîne",
    RO: "Corectează și aprobă",
  },
  processing: {
    DE: "Verarbeitet...",
    EN: "Processing...",
    IT: "Elaborazione...",
    TR: "İşleniyor...",
    SQ: "Duke u përpunuar...",
    KU: "Tê pêvajokirin...",
    RO: "Se procesează...",
  },
  saveChanges: {
    DE: "Änderungen speichern",
    EN: "Save changes",
    IT: "Salva modifiche",
    TR: "Değişiklikleri kaydet",
    SQ: "Ruaj ndryshimet",
    KU: "Guhertinan tomar bike",
    RO: "Salvează modificările",
  },
  saving: {
    DE: "Speichert...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Duke ruajtur...",
    KU: "Tê tomarkirin...",
    RO: "Se salvează...",
  },
  edit: {
    DE: "Bearbeiten",
    EN: "Edit",
    IT: "Modifica",
    TR: "Düzenle",
    SQ: "Ndrysho",
    KU: "Biguherîne",
    RO: "Editează",
  },
  openSection: {
    DE: "Offen",
    EN: "Open",
    IT: "Aperte",
    TR: "Açık",
    SQ: "Të hapura",
    KU: "Vekirî",
    RO: "Deschise",
  },
  approvedSection: {
    DE: "Genehmigt",
    EN: "Approved",
    IT: "Approvate",
    TR: "Onaylandı",
    SQ: "Të miratuara",
    KU: "Pejirandî",
    RO: "Aprobate",
  },
  rejectedSection: {
    DE: "Abgelehnt",
    EN: "Rejected",
    IT: "Rifiutate",
    TR: "Reddedildi",
    SQ: "Të refuzuara",
    KU: "Redkirî",
    RO: "Respinse",
  },
  emptyOpen: {
    DE: "Keine offenen Krankheitsanträge.",
    EN: "No open sickness requests.",
    IT: "Nessuna richiesta di malattia aperta.",
    TR: "Açık hastalık talebi yok.",
    SQ: "Nuk ka kërkesa të hapura për sëmundje.",
    KU: "Ti daxwaza nexweşiyê ya vekirî tune ye.",
    RO: "Nu există cereri de boală deschise.",
  },
  emptyApproved: {
    DE: "Keine genehmigten Krankheitsanträge.",
    EN: "No approved sickness requests.",
    IT: "Nessuna richiesta di malattia approvata.",
    TR: "Onaylanmış hastalık talebi yok.",
    SQ: "Nuk ka kërkesa të miratuara për sëmundje.",
    KU: "Ti daxwaza nexweşiyê ya pejirandî tune ye.",
    RO: "Nu există cereri de boală aprobate.",
  },
  emptyRejected: {
    DE: "Keine abgelehnten Krankheitsanträge.",
    EN: "No rejected sickness requests.",
    IT: "Nessuna richiesta di malattia rifiutata.",
    TR: "Reddedilmiş hastalık talebi yok.",
    SQ: "Nuk ka kërkesa të refuzuara për sëmundje.",
    KU: "Ti daxwaza nexweşiyê ya redkirî tune ye.",
    RO: "Nu există cereri de boală respinse.",
  },
  day: {
    DE: "Tag",
    EN: "day",
    IT: "giorno",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zi",
  },
  days: {
    DE: "Tage",
    EN: "days",
    IT: "giorni",
    TR: "gün",
    SQ: "ditë",
    KU: "roj",
    RO: "zile",
  },
  sickLabel: {
    DE: "Krank",
    EN: "Sick",
    IT: "Malato",
    TR: "Hasta",
    SQ: "Sëmurë",
    KU: "Nexweş",
    RO: "Bolnav",
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
    RO: "Angajați",
  },
  pageTitle: {
    DE: "Mitarbeiter",
    EN: "Employees",
    IT: "Dipendenti",
    TR: "Çalışanlar",
    SQ: "Punonjësit",
    KU: "Karmend",
    RO: "Angajați",
  },
  pageSubtitle: {
    DE: "Reset-Link erstellen und dem Mitarbeiter schicken (z. B. per WhatsApp).",
    EN: "Create a reset link and send it to the employee (e.g. via WhatsApp).",
    IT: "Crea un link di reset e invialo al dipendente (ad es. tramite WhatsApp).",
    TR: "Sıfırlama bağlantısı oluştur ve çalışana gönder (ör. WhatsApp ile).",
    SQ: "Krijo një link rivendosjeje dhe dërgoja punonjësit (p.sh. me WhatsApp).",
    KU: "Girêdana nûvekirinê biafirîne û bişîne karmendê (mînak WhatsApp).",
    RO: "Creează un link de resetare și trimite-l angajatului (de ex. prin WhatsApp).",
  },
  loadError: {
    DE: "Konnte Mitarbeiter nicht laden.",
    EN: "Could not load employees.",
    IT: "Impossibile caricare i dipendenti.",
    TR: "Çalışanlar yüklenemedi.",
    SQ: "Punonjësit nuk mund të ngarkoheshin.",
    KU: "Karmend nehatin barkirin.",
    RO: "Angajații nu au putut fi încărcați.",
  },
  resetFailed: {
    DE: "Reset fehlgeschlagen.",
    EN: "Reset failed.",
    IT: "Reimpostazione non riuscita.",
    TR: "Sıfırlama başarısız oldu.",
    SQ: "Rivendosja dështoi.",
    KU: "Nûvekirin serneket.",
    RO: "Resetarea a eșuat.",
  },
  loading: {
    DE: "Lädt...",
    EN: "Loading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke u ngarkuar...",
    KU: "Tê barkirin...",
    RO: "Se încarcă...",
  },
  empty: {
    DE: "Keine Mitarbeiter gefunden.",
    EN: "No employees found.",
    IT: "Nessun dipendente trovato.",
    TR: "Çalışan bulunamadı.",
    SQ: "Nuk u gjet asnjë punonjës.",
    KU: "Ti karmend nehat dîtin.",
    RO: "Nu a fost găsit niciun angajat.",
  },
  createResetLink: {
    DE: "Reset-Link erstellen",
    EN: "Create reset link",
    IT: "Crea link di reset",
    TR: "Sıfırlama bağlantısı oluştur",
    SQ: "Krijo link rivendosjeje",
    KU: "Girêdana nûvekirinê biafirîne",
    RO: "Creează link de resetare",
  },
  resetLinkTitle: {
    DE: "Reset-Link",
    EN: "Reset link",
    IT: "Link di reset",
    TR: "Sıfırlama bağlantısı",
    SQ: "Link rivendosjeje",
    KU: "Girêdana nûvekirinê",
    RO: "Link de resetare",
  },
  validUntil: {
    DE: "Gültig bis:",
    EN: "Valid until:",
    IT: "Valido fino al:",
    TR: "Şu tarihe kadar geçerli:",
    SQ: "I vlefshëm deri më:",
    KU: "Derbasdar heta:",
    RO: "Valabil până la:",
  },
  copied: {
    DE: "Kopiert ✅",
    EN: "Copied ✅",
    IT: "Copiato ✅",
    TR: "Kopyalandı ✅",
    SQ: "U kopjua ✅",
    KU: "Hat kopîkirin ✅",
    RO: "Copiat ✅",
  },
  copyNotPossible: {
    DE: "Kopieren nicht möglich",
    EN: "Copying not possible",
    IT: "Copia non possibile",
    TR: "Kopyalama mümkün değil",
    SQ: "Kopjimi nuk është i mundur",
    KU: "Kopîkirin ne gengaz e",
    RO: "Copierea nu este posibilă",
  },
  copyLink: {
    DE: "Link kopieren",
    EN: "Copy link",
    IT: "Copia link",
    TR: "Bağlantıyı kopyala",
    SQ: "Kopjo linkun",
    KU: "Girêdanê kopî bike",
    RO: "Copiază linkul",
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
  hint: {
    DE: "Hinweis: Link ist einmalig. Danach ist er ungültig.",
    EN: "Note: The link can only be used once. Afterwards it becomes invalid.",
    IT: "Nota: Il link è monouso. Successivamente non sarà più valido.",
    TR: "Not: Bağlantı tek kullanımlıktır. Sonrasında geçersiz olur.",
    SQ: "Shënim: Linku përdoret vetëm një herë. Më pas bëhet i pavlefshëm.",
    KU: "Têbînî: Girêdan tenê carekê tê bikaranîn. Piştî wê nederbasdar dibe.",
    RO: "Notă: Linkul poate fi folosit o singură dată. După aceea devine invalid.",
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
  | "keepPrefixHint"
  | "unknown"
  | "maxAllowedPrefix"
  | "siteSheetDefaultTitle"
  | "forbidden"
  | "weekStartMissing"
  | "missingFields"
  | "invalidUserId"
  | "entryNotFound"
  | "fileReaderError"
  | "fileReaderAborted"
  | "invalidFileFormat"
  | "arrayBufferTimeout"
  | "documentUploadUnknownError"
  | "weeklyPlanLoadError"
  | "usersLoadError"
  | "adminNotesLoadError"
  | "planEntriesLoadError";

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
    RO: "Plan săptămânal",
  },
  loading: {
    DE: "lädt…",
    EN: "loading…",
    IT: "caricamento…",
    TR: "yükleniyor…",
    SQ: "duke u ngarkuar…",
    KU: "tê barkirin…",
    RO: "se încarcă…",
  },
  accessDenied: {
    DE: "Kein Zugriff (Admin benötigt).",
    EN: "No access (admin required).",
    IT: "Nessun accesso (serve admin).",
    TR: "Erişim yok (yönetici gerekli).",
    SQ: "Nuk ka qasje (kërkohet admin).",
    KU: "Gihîştin tune ye (admin pêwîst e).",
    RO: "Fără acces (este necesar un admin).",
  },
  pageTitle: {
    DE: "Wochenplanung",
    EN: "Weekly planning",
    IT: "Pianificazione settimanale",
    TR: "Haftalık planlama",
    SQ: "Planifikimi javor",
    KU: "Planandina hefteyî",
    RO: "Planificare săptămânală",
  },
  calendarWeek: {
    DE: "KW",
    EN: "CW",
    IT: "Sett.",
    TR: "HF",
    SQ: "Java",
    KU: "Heft",
    RO: "Săpt.",
  },
  previousWeek: {
    DE: "← Woche",
    EN: "← Week",
    IT: "← Settimana",
    TR: "← Hafta",
    SQ: "← Java",
    KU: "← Heft",
    RO: "← Săptămâna",
  },
  nextWeek: {
    DE: "Woche →",
    EN: "Week →",
    IT: "Settimana →",
    TR: "Hafta →",
    SQ: "Java →",
    KU: "Heft →",
    RO: "Săptămâna →",
  },
  appointmentsBack: {
    DE: "⟵ Termine",
    EN: "⟵ Appointments",
    IT: "⟵ Appuntamenti",
    TR: "⟵ Randevular",
    SQ: "⟵ Takimet",
    KU: "⟵ Civîn",
    RO: "⟵ Programări",
  },
  noEntries: {
    DE: "Keine Einträge.",
    EN: "No entries.",
    IT: "Nessuna voce.",
    TR: "Kayıt yok.",
    SQ: "Nuk ka hyrje.",
    KU: "Ti tomar tune ne.",
    RO: "Nu există înregistrări.",
  },
  adminNoteLabel: {
    DE: "🔒 Admin-Notiz",
    EN: "🔒 Admin note",
    IT: "🔒 Nota admin",
    TR: "🔒 Yönetici notu",
    SQ: "🔒 Shënim admini",
    KU: "🔒 Nîşeya admin",
    RO: "🔒 Notiță admin",
  },
  emptyValue: {
    DE: "(leer)",
    EN: "(empty)",
    IT: "(vuoto)",
    TR: "(boş)",
    SQ: "(bosh)",
    KU: "(vala)",
    RO: "(gol)",
  },
  entryCreate: {
    DE: "+ Eintrag (Plan)",
    EN: "+ Entry (plan)",
    IT: "+ Voce (piano)",
    TR: "+ Kayıt (plan)",
    SQ: "+ Hyrje (plan)",
    KU: "+ Tomar (plan)",
    RO: "+ Înregistrare (plan)",
  },
  noteCreate: {
    DE: "+ Notiz (Admin)",
    EN: "+ Note (admin)",
    IT: "+ Nota (admin)",
    TR: "+ Not (yönetici)",
    SQ: "+ Shënim (admin)",
    KU: "+ Nîşe (admin)",
    RO: "+ Notiță (admin)",
  },
  entryEditTitle: {
    DE: "Eintrag bearbeiten",
    EN: "Edit entry",
    IT: "Modifica voce",
    TR: "Kaydı düzenle",
    SQ: "Ndrysho hyrjen",
    KU: "Tomarê biguherîne",
    RO: "Editează înregistrarea",
  },
  entryCreateTitle: {
    DE: "Eintrag anlegen",
    EN: "Create entry",
    IT: "Crea voce",
    TR: "Kayıt oluştur",
    SQ: "Krijo hyrje",
    KU: "Tomar biafirîne",
    RO: "Creează înregistrare",
  },
  noteEditTitle: {
    DE: "Admin-Notiz bearbeiten",
    EN: "Edit admin note",
    IT: "Modifica nota admin",
    TR: "Yönetici notunu düzenle",
    SQ: "Ndrysho shënimin e adminit",
    KU: "Nîşeya admin biguherîne",
    RO: "Editează notița adminului",
  },
  noteCreateTitle: {
    DE: "Admin-Notiz anlegen",
    EN: "Create admin note",
    IT: "Crea nota admin",
    TR: "Yönetici notu oluştur",
    SQ: "Krijo shënim admini",
    KU: "Nîşeya admin biafirîne",
    RO: "Creează notiță admin",
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
  deleting: {
    DE: "Lösche…",
    EN: "Deleting…",
    IT: "Eliminazione…",
    TR: "Siliniyor…",
    SQ: "Duke fshirë…",
    KU: "Tê jêbirin…",
    RO: "Se șterge…",
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
  save: {
    DE: "Speichern",
    EN: "Save",
    IT: "Salva",
    TR: "Kaydet",
    SQ: "Ruaj",
    KU: "Tomar bike",
    RO: "Salvează",
  },
  saving: {
    DE: "Speichere…",
    EN: "Saving…",
    IT: "Salvataggio…",
    TR: "Kaydediliyor…",
    SQ: "Duke ruajtur…",
    KU: "Tê tomarkirin…",
    RO: "Se salvează…",
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
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjësi",
    KU: "Karmend",
    RO: "Angajat",
  },
  start: {
    DE: "Start",
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
    SQ: "Veprimtaria",
    KU: "Çalakî",
    RO: "Activitate",
  },
  location: {
    DE: "Ort",
    EN: "Location",
    IT: "Luogo",
    TR: "Konum",
    SQ: "Vendi",
    KU: "Cih",
    RO: "Locație",
  },
  travelMinutes: {
    DE: "Fahrzeit (Minuten)",
    EN: "Travel time (minutes)",
    IT: "Tempo di viaggio (minuti)",
    TR: "Yol süresi (dakika)",
    SQ: "Koha e udhëtimit (minuta)",
    KU: "Dema rêyê (deqîqe)",
    RO: "Timp de deplasare (minute)",
  },
  employeeNote: {
    DE: "Notiz (für Mitarbeiter)",
    EN: "Note (for employees)",
    IT: "Nota (per i dipendenti)",
    TR: "Not (çalışanlar için)",
    SQ: "Shënim (për punonjësit)",
    KU: "Nîşe (ji bo karmendan)",
    RO: "Notiță (pentru angajați)",
  },
  employeeNoteHelp: {
    DE: "Diese Notiz sehen Mitarbeiter im Kalender/Modal.",
    EN: "Employees can see this note in the calendar/modal.",
    IT: "I dipendenti vedono questa nota nel calendario/modal.",
    TR: "Çalışanlar bu notu takvim/modal içinde görür.",
    SQ: "Punonjësit e shohin këtë shënim në kalendar/modal.",
    KU: "Karmend ev nîşe di salname/modal de dibînin.",
    RO: "Angajații pot vedea această notiță în calendar/modal.",
  },
  documentsTitle: {
    DE: "📎 Dokumente (Baustellenzettel etc.)",
    EN: "📎 Documents (site sheets etc.)",
    IT: "📎 Documenti (rapporti di cantiere ecc.)",
    TR: "📎 Belgeler (şantiye formları vb.)",
    SQ: "📎 Dokumente (fletë kantieri etj.)",
    KU: "📎 Belge (pelên cihê karê û hwd.)",
    RO: "📎 Documente (fișe de șantier etc.)",
  },
  documentsSaveEntryFirst: {
    DE: "Speichere zuerst den Plan-Eintrag – danach kannst du Dokumente hochladen.",
    EN: "Save the plan entry first — then you can upload documents.",
    IT: "Salva prima la voce del piano — poi potrai caricare documenti.",
    TR: "Önce plan kaydını kaydet — ardından belge yükleyebilirsin.",
    SQ: "Ruaje fillimisht hyrjen e planit — më pas mund të ngarkosh dokumente.",
    KU: "Pêşî tomarê planê tomar bike — paşê dikarî belge bar bikî.",
    RO: "Salvează mai întâi înregistrarea planului — apoi poți încărca documente.",
  },
  documentsLoadError: {
    DE: "Dokumente konnten nicht geladen werden.",
    EN: "Documents could not be loaded.",
    IT: "Impossibile caricare i documenti.",
    TR: "Belgeler yüklenemedi.",
    SQ: "Dokumentet nuk mund të ngarkoheshin.",
    KU: "Belge nehatin barkirin.",
    RO: "Documentele nu au putut fi încărcate.",
  },
  documentsNetworkError: {
    DE: "Netzwerkfehler beim Laden der Dokumente.",
    EN: "Network error while loading documents.",
    IT: "Errore di rete durante il caricamento dei documenti.",
    TR: "Belgeler yüklenirken ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit të dokumenteve.",
    KU: "Dema barkirina belgeyan de xeletiya torê çêbû.",
    RO: "Eroare de rețea la încărcarea documentelor.",
  },
  documentReadError: {
    DE: "Datei konnte per FileReader nicht gelesen werden.",
    EN: "File could not be read via FileReader.",
    IT: "Il file non può essere letto tramite FileReader.",
    TR: "Dosya FileReader ile okunamadı.",
    SQ: "Skedari nuk mund të lexohej me FileReader.",
    KU: "Pel bi FileReader nehate xwendin.",
    RO: "Fișierul nu a putut fi citit prin FileReader.",
  },
  documentPreviewError: {
    DE: "Dokument konnte nicht in der App geöffnet werden.",
    EN: "Document could not be opened in the app.",
    IT: "Il documento non può essere aperto nell'app.",
    TR: "Belge uygulamada açılamadı.",
    SQ: "Dokumenti nuk mund të hapej në aplikacion.",
    KU: "Belge di appê de venebû.",
    RO: "Documentul nu a putut fi deschis în aplicație.",
  },
  documentShareUnavailable: {
    DE: "Auf diesem Gerät ist 'Teilen / Sichern' hier nicht verfügbar.",
    EN: "‘Share / Save’ is not available here on this device.",
    IT: "‘Condividi / Salva’ non è disponibile qui su questo dispositivo.",
    TR: "Bu cihazda burada ‘Paylaş / Kaydet’ kullanılamıyor.",
    SQ: "‘Ndaj / Ruaj’ nuk është i disponueshëm këtu në këtë pajisje.",
    KU: "Li ser vê cîhazê de ‘Parve bike / Tomar bike’ li vir tune ye.",
    RO: "„Partajează / Salvează” nu este disponibil aici pe acest dispozitiv.",
  },
  documentShareError: {
    DE: "Dokument konnte nicht geteilt bzw. gespeichert werden.",
    EN: "Document could not be shared or saved.",
    IT: "Il documento non può essere condiviso o salvato.",
    TR: "Belge paylaşılamadı veya kaydedilemedi.",
    SQ: "Dokumenti nuk mund të ndahej ose ruhej.",
    KU: "Belge nehat parvekirin an tomarkirin.",
    RO: "Documentul nu a putut fi partajat sau salvat.",
  },
  documentMissingFile: {
    DE: "Bitte eine Datei auswählen.",
    EN: "Please select a file.",
    IT: "Seleziona un file.",
    TR: "Lütfen bir dosya seçin.",
    SQ: "Ju lutem zgjidhni një skedar.",
    KU: "Ji kerema xwe pelek hilbijêre.",
    RO: "Te rog selectează un fișier.",
  },
  documentInvalidType: {
    DE: "Dateityp nicht erlaubt. Erlaubt sind PDF, JPG, PNG und WEBP.",
    EN: "File type not allowed. Allowed: PDF, JPG, PNG, and WEBP.",
    IT: "Tipo di file non consentito. Consentiti: PDF, JPG, PNG e WEBP.",
    TR: "Dosya türüne izin verilmiyor. İzin verilenler: PDF, JPG, PNG ve WEBP.",
    SQ: "Lloji i skedarit nuk lejohet. Lejohen: PDF, JPG, PNG dhe WEBP.",
    KU: "Cureyê pelê ne destûr e. PDF, JPG, PNG û WEBP destûr in.",
    RO: "Tip de fișier nepermis. Sunt permise PDF, JPG, PNG și WEBP.",
  },
  documentEmptyFile: {
    DE: "Die gewählte Datei ist leer.",
    EN: "The selected file is empty.",
    IT: "Il file selezionato è vuoto.",
    TR: "Seçilen dosya boş.",
    SQ: "Skedari i zgjedhur është bosh.",
    KU: "Pelê hilbijartî vala ye.",
    RO: "Fișierul selectat este gol.",
  },
  documentTooLarge: {
    DE: "Datei zu groß",
    EN: "File too large",
    IT: "File troppo grande",
    TR: "Dosya çok büyük",
    SQ: "Skedari është shumë i madh",
    KU: "Pel pir mezin e",
    RO: "Fișier prea mare",
  },
  documentUploadReadError: {
    DE: "Die Datei konnte auf diesem Gerät nicht gelesen werden.",
    EN: "The file could not be read on this device.",
    IT: "Il file non può essere letto su questo dispositivo.",
    TR: "Dosya bu cihazda okunamadı.",
    SQ: "Skedari nuk mund të lexohej në këtë pajisje.",
    KU: "Pel li ser vê cîhazê nehat xwendin.",
    RO: "Fișierul nu a putut fi citit pe acest dispozitiv.",
  },
  documentUploadTimeout: {
    DE: "Upload dauert zu lange. Bitte Datei erneut auswählen und erneut versuchen.",
    EN: "Upload is taking too long. Please reselect the file and try again.",
    IT: "Il caricamento richiede troppo tempo. Seleziona di nuovo il file e riprova.",
    TR: "Yükleme çok uzun sürüyor. Lütfen dosyayı tekrar seçip yeniden deneyin.",
    SQ: "Ngarkimi po zgjat shumë. Ju lutem zgjidhni përsëri skedarin dhe provoni sërish.",
    KU: "Barkirin pir dirêj dibe. Ji kerema xwe pelê dîsa hilbijêre û dîsa biceribîne.",
    RO: "Încărcarea durează prea mult. Te rog selectează din nou fișierul și încearcă iar.",
  },
  documentUploadFailed: {
    DE: "Upload fehlgeschlagen.",
    EN: "Upload failed.",
    IT: "Caricamento non riuscito.",
    TR: "Yükleme başarısız oldu.",
    SQ: "Ngarkimi dështoi.",
    KU: "Barkirin serneket.",
    RO: "Încărcarea a eșuat.",
  },
  documentUploadNetworkError: {
    DE: "Netzwerkfehler beim Upload.",
    EN: "Network error during upload.",
    IT: "Errore di rete durante il caricamento.",
    TR: "Yükleme sırasında ağ hatası oluştu.",
    SQ: "Gabim rrjeti gjatë ngarkimit.",
    KU: "Dema barkirinê de xeletiya torê çêbû.",
    RO: "Eroare de rețea în timpul încărcării.",
  },
  documentDeleteConfirm: {
    DE: "Dokument wirklich löschen?",
    EN: "Really delete document?",
    IT: "Eliminare davvero il documento?",
    TR: "Belge gerçekten silinsin mi?",
    SQ: "Të fshihet vërtet dokumenti?",
    KU: "Belge bi rastî were jêbirin?",
    RO: "Chiar vrei să ștergi documentul?",
  },
  documentDeleteFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
    RO: "Ștergerea a eșuat.",
  },
  title: {
    DE: "Titel",
    EN: "Title",
    IT: "Titolo",
    TR: "Başlık",
    SQ: "Titulli",
    KU: "Sernav",
    RO: "Titlu",
  },
  file: {
    DE: "Datei",
    EN: "File",
    IT: "File",
    TR: "Dosya",
    SQ: "Skedari",
    KU: "Pel",
    RO: "Fișier",
  },
  uploadDocument: {
    DE: "Dokument hochladen",
    EN: "Upload document",
    IT: "Carica documento",
    TR: "Belge yükle",
    SQ: "Ngarko dokument",
    KU: "Belge bar bike",
    RO: "Încarcă document",
  },
  uploading: {
    DE: "Upload...",
    EN: "Uploading...",
    IT: "Caricamento...",
    TR: "Yükleniyor...",
    SQ: "Duke ngarkuar...",
    KU: "Tê barkirin...",
    RO: "Se încarcă...",
  },
  documentAllowedInfo: {
    DE: "Erlaubt: PDF, JPG, PNG, WEBP · max. 15 MB",
    EN: "Allowed: PDF, JPG, PNG, WEBP · max. 15 MB",
    IT: "Consentiti: PDF, JPG, PNG, WEBP · max. 15 MB",
    TR: "İzin verilenler: PDF, JPG, PNG, WEBP · maks. 15 MB",
    SQ: "Lejohen: PDF, JPG, PNG, WEBP · maks. 15 MB",
    KU: "Destûr in: PDF, JPG, PNG, WEBP · herî zêde 15 MB",
    RO: "Permise: PDF, JPG, PNG, WEBP · max. 15 MB",
  },
  loadingDocuments: {
    DE: "Lade Dokumente...",
    EN: "Loading documents...",
    IT: "Caricamento documenti...",
    TR: "Belgeler yükleniyor...",
    SQ: "Po ngarkohen dokumentet...",
    KU: "Belge têne barkirin...",
    RO: "Se încarcă documentele...",
  },
  noDocuments: {
    DE: "Noch keine Dokumente.",
    EN: "No documents yet.",
    IT: "Nessun documento ancora.",
    TR: "Henüz belge yok.",
    SQ: "Nuk ka ende dokumente.",
    KU: "Hêj belge tune ne.",
    RO: "Încă nu există documente.",
  },
  previewInApp: {
    DE: "In App ansehen",
    EN: "View in app",
    IT: "Visualizza nell'app",
    TR: "Uygulamada göster",
    SQ: "Shiko në aplikacion",
    KU: "Di appê de bibîne",
    RO: "Vezi în aplicație",
  },
  shareOrSave: {
    DE: "Teilen / Sichern",
    EN: "Share / Save",
    IT: "Condividi / Salva",
    TR: "Paylaş / Kaydet",
    SQ: "Ndaj / Ruaj",
    KU: "Parve bike / Tomar bike",
    RO: "Partajează / Salvează",
  },
  document: {
    DE: "Dokument",
    EN: "Document",
    IT: "Documento",
    TR: "Belge",
    SQ: "Dokument",
    KU: "Belge",
    RO: "Document",
  },
  noPreviewAvailable: {
    DE: "Keine Vorschau verfügbar.",
    EN: "No preview available.",
    IT: "Nessuna anteprima disponibile.",
    TR: "Önizleme mevcut değil.",
    SQ: "Nuk ka parashikim.",
    KU: "Pêşdîtin tune ye.",
    RO: "Previzualizare indisponibilă.",
  },
  internalAdminNoteInfo: {
    DE: "✅ Admin-Notiz wird nicht hier gespeichert — dafür gibt es separat “+ Notiz (Admin)” im Wochenplan.",
    EN: "✅ Admin note is not stored here — use the separate “+ Note (admin)” in the weekly plan.",
    IT: "✅ La nota admin non viene salvata qui — usa il separato “+ Nota (admin)” nel piano settimanale.",
    TR: "✅ Yönetici notu burada kaydedilmez — bunun için haftalık planda ayrı “+ Not (yönetici)” vardır.",
    SQ: "✅ Shënimi i adminit nuk ruhet këtu — për këtë përdor “+ Shënim (admin)” te plani javor.",
    KU: "✅ Nîşeya admin li vir nayê tomarkirin — ji bo vê yekê di plana hefteyî de “+ Nîşe (admin)” heye.",
    RO: "✅ Notița adminului nu este salvată aici — pentru asta există separat „+ Notiță (admin)” în planul săptămânal.",
  },
  pleaseSelectEmployee: {
    DE: "Bitte Mitarbeiter wählen.",
    EN: "Please select an employee.",
    IT: "Seleziona un dipendente.",
    TR: "Lütfen bir çalışan seçin.",
    SQ: "Ju lutem zgjidhni një punonjës.",
    KU: "Ji kerema xwe karmendek hilbijêre.",
    RO: "Te rog selectează un angajat.",
  },
  pleaseSelectDate: {
    DE: "Bitte Datum wählen.",
    EN: "Please select a date.",
    IT: "Seleziona una data.",
    TR: "Lütfen bir tarih seçin.",
    SQ: "Ju lutem zgjidhni një datë.",
    KU: "Ji kerema xwe dîrokek hilbijêre.",
    RO: "Te rog selectează o dată.",
  },
  pleaseSelectStartEnd: {
    DE: "Bitte Start/Ende angeben.",
    EN: "Please provide start/end.",
    IT: "Indica inizio/fine.",
    TR: "Lütfen başlangıç/bitiş girin.",
    SQ: "Ju lutem jepni fillimin/fundin.",
    KU: "Ji kerema xwe destpêk/dawî binivîse.",
    RO: "Te rog completează începutul/sfârșitul.",
  },
  saveEntryFailed: {
    DE: "Speichern fehlgeschlagen:",
    EN: "Saving failed:",
    IT: "Salvataggio non riuscito:",
    TR: "Kaydetme başarısız oldu:",
    SQ: "Ruajtja dështoi:",
    KU: "Tomarkirin serneket:",
    RO: "Salvarea a eșuat:",
  },
  deleteEntryConfirm: {
    DE: "Plan-Eintrag wirklich löschen?",
    EN: "Really delete plan entry?",
    IT: "Eliminare davvero la voce del piano?",
    TR: "Plan kaydı gerçekten silinsin mi?",
    SQ: "Të fshihet vërtet hyrja e planit?",
    KU: "Tomara planê bi rastî were jêbirin?",
    RO: "Chiar vrei să ștergi înregistrarea planului?",
  },
  deleteEntryFailed: {
    DE: "Löschen fehlgeschlagen.",
    EN: "Delete failed.",
    IT: "Eliminazione non riuscita.",
    TR: "Silme başarısız oldu.",
    SQ: "Fshirja dështoi.",
    KU: "Jêbirin serneket.",
    RO: "Ștergerea a eșuat.",
  },
  saveNoteFailed: {
    DE: "Notiz speichern fehlgeschlagen:",
    EN: "Saving note failed:",
    IT: "Salvataggio nota non riuscito:",
    TR: "Not kaydedilemedi:",
    SQ: "Ruajtja e shënimit dështoi:",
    KU: "Tomarkirina nîşeyê serneket:",
    RO: "Salvarea notiței a eșuat:",
  },
  deleteNoteConfirm: {
    DE: "Admin-Notiz wirklich löschen?",
    EN: "Really delete admin note?",
    IT: "Eliminare davvero la nota admin?",
    TR: "Yönetici notu gerçekten silinsin mi?",
    SQ: "Të fshihet vërtet shënimi i adminit?",
    KU: "Nîşeya admin bi rastî were jêbirin?",
    RO: "Chiar vrei să ștergi notița adminului?",
  },
  deleteNoteFailed: {
    DE: "Notiz löschen fehlgeschlagen",
    EN: "Deleting note failed",
    IT: "Eliminazione nota non riuscita",
    TR: "Not silinemedi",
    SQ: "Fshirja e shënimit dështoi",
    KU: "Jêbirina nîşeyê serneket",
    RO: "Ștergerea notiței a eșuat",
  },
  adminNoteEdit: {
    DE: "Admin-Notiz bearbeiten",
    EN: "Edit admin note",
    IT: "Modifica nota admin",
    TR: "Yönetici notunu düzenle",
    SQ: "Ndrysho shënimin e adminit",
    KU: "Nîşeya admin biguherîne",
    RO: "Editează notița adminului",
  },
  adminNoteCreate: {
    DE: "Admin-Notiz anlegen",
    EN: "Create admin note",
    IT: "Crea nota admin",
    TR: "Yönetici notu oluştur",
    SQ: "Krijo shënim admini",
    KU: "Nîşeya admin biafirîne",
    RO: "Creează notiță admin",
  },
  internalAdminNote: {
    DE: "Interne Admin-Notiz (nur für Admin)",
    EN: "Internal admin note (admin only)",
    IT: "Nota admin interna (solo admin)",
    TR: "Dahili yönetici notu (yalnızca yönetici)",
    SQ: "Shënim i brendshëm i adminit (vetëm për admin)",
    KU: "Nîşeya hundirîn a admin (tenê ji bo admin)",
    RO: "Notiță internă admin (doar pentru admin)",
  },
  internalAdminNoteHelp: {
    DE: "Bleibt intern und wird niemals an Mitarbeiter ausgeliefert.",
    EN: "Remains internal and is never shown to employees.",
    IT: "Rimane interna e non viene mai mostrata ai dipendenti.",
    TR: "Dahili kalır ve çalışanlara asla gösterilmez.",
    SQ: "Mbetet e brendshme dhe nuk u shfaqet kurrë punonjësve.",
    KU: "Hundirîn dimîne û qet ji karmendan re nayê nîşandan.",
    RO: "Rămâne internă și nu este afișată niciodată angajaților.",
  },
  employeeNotePrefix: {
    DE: "📝 MA:",
    EN: "📝 Emp:",
    IT: "📝 Dip:",
    TR: "📝 Çal:",
    SQ: "📝 Pun:",
    KU: "📝 Kar:",
    RO: "📝 Ang:",
  },
  editPlanEntryTitle: {
    DE: "Eintrag bearbeiten",
    EN: "Edit entry",
    IT: "Modifica voce",
    TR: "Kaydı düzenle",
    SQ: "Ndrysho hyrjen",
    KU: "Tomarê biguherîne",
    RO: "Editează înregistrarea",
  },
  createPlanEntryTitle: {
    DE: "Eintrag anlegen",
    EN: "Create entry",
    IT: "Crea voce",
    TR: "Kayıt oluştur",
    SQ: "Krijo hyrje",
    KU: "Tomar biafirîne",
    RO: "Creează înregistrare",
  },
  editAdminNoteTitle: {
    DE: "Admin-Notiz bearbeiten",
    EN: "Edit admin note",
    IT: "Modifica nota admin",
    TR: "Yönetici notunu düzenle",
    SQ: "Ndrysho shënimin e adminit",
    KU: "Nîşeya admin biguherîne",
    RO: "Editează notița adminului",
  },
  createAdminNoteTitle: {
    DE: "Admin-Notiz anlegen",
    EN: "Create admin note",
    IT: "Crea nota admin",
    TR: "Yönetici notu oluştur",
    SQ: "Krijo shënim admini",
    KU: "Nîşeya admin biafirîne",
    RO: "Creează notiță admin",
  },
  monday: {
    DE: "Montag",
    EN: "Monday",
    IT: "Lunedì",
    TR: "Pazartesi",
    SQ: "E hënë",
    KU: "Duşem",
    RO: "Luni",
  },
  tuesday: {
    DE: "Dienstag",
    EN: "Tuesday",
    IT: "Martedì",
    TR: "Salı",
    SQ: "E martë",
    KU: "Sêşem",
    RO: "Marți",
  },
  wednesday: {
    DE: "Mittwoch",
    EN: "Wednesday",
    IT: "Mercoledì",
    TR: "Çarşamba",
    SQ: "E mërkurë",
    KU: "Çarşem",
    RO: "Miercuri",
  },
  thursday: {
    DE: "Donnerstag",
    EN: "Thursday",
    IT: "Giovedì",
    TR: "Perşembe",
    SQ: "E enjte",
    KU: "Pêncşem",
    RO: "Joi",
  },
  friday: {
    DE: "Freitag",
    EN: "Friday",
    IT: "Venerdì",
    TR: "Cuma",
    SQ: "E premte",
    KU: "În",
    RO: "Vineri",
  },
  saturday: {
    DE: "Samstag",
    EN: "Saturday",
    IT: "Sabato",
    TR: "Cumartesi",
    SQ: "E shtunë",
    KU: "Şemî",
    RO: "Sâmbătă",
  },
  repairWork: {
    DE: "Rep. Arbeiten",
    EN: "Repair work",
    IT: "Lavori di riparazione",
    TR: "Tamir işleri",
    SQ: "Punë riparimi",
    KU: "Karên tamîrê",
    RO: "Lucrări de reparații",
  },
  subcontractors: {
    DE: "Subunternehmer",
    EN: "Subcontractors",
    IT: "Subappaltatori",
    TR: "Taşeronlar",
    SQ: "Nënkontraktorë",
    KU: "Binpeymanbar",
    RO: "Subcontractori",
  },
  keepPrefixHint: {
    DE: "Lass den Prefix stehen, sonst erscheint es nicht in der Spezial-Zeile.",
    EN: "Keep the prefix, otherwise it will not appear in the special row.",
    IT: "Mantieni il prefisso, altrimenti non apparirà nella riga speciale.",
    TR: "Öneki bırakın, aksi halde özel satırda görünmez.",
    SQ: "Mbaje prefiksin, përndryshe nuk do të shfaqet në rreshtin special.",
    KU: "Pêşgirê bihêle, wekî din di rêza taybet de dernakeve.",
    RO: "Păstrează prefixul, altfel nu va apărea în rândul special.",
  },
  unknown: {
    DE: "Unbekannt",
    EN: "Unknown",
    IT: "Sconosciuto",
    TR: "Bilinmiyor",
    SQ: "E panjohur",
    KU: "Nenas",
    RO: "Necunoscut",
  },
  maxAllowedPrefix: {
    DE: "Maximal erlaubt sind",
    EN: "Maximum allowed is",
    IT: "Il massimo consentito è",
    TR: "İzin verilen maksimum",
    SQ: "Maksimumi i lejuar është",
    KU: "Herî zêde destûr dayî ye",
    RO: "Maximul permis este",
  },
  siteSheetDefaultTitle: {
    DE: "Baustellenzettel",
    EN: "Site sheet",
    IT: "Rapporto di cantiere",
    TR: "Şantiye formu",
    SQ: "Fletë kantieri",
    KU: "Pelê şantiye",
    RO: "Fișă de șantier",
  },
  forbidden: {
    DE: "Kein Zugriff.",
    EN: "Forbidden.",
    IT: "Accesso negato.",
    TR: "Erişim engellendi.",
    SQ: "Qasja u ndalua.",
    KU: "Gihîştin qedexe ye.",
    RO: "Acces interzis.",
  },
  weekStartMissing: {
    DE: "weekStart fehlt.",
    EN: "weekStart is missing.",
    IT: "weekStart manca.",
    TR: "weekStart eksik.",
    SQ: "weekStart mungon.",
    KU: "weekStart tune ye.",
    RO: "weekStart lipsește.",
  },
  missingFields: {
    DE: "Pflichtfelder fehlen.",
    EN: "Required fields are missing.",
    IT: "Mancano campi obbligatori.",
    TR: "Zorunlu alanlar eksik.",
    SQ: "Fushat e detyrueshme mungojnë.",
    KU: "Qadên pêwîst kêm in.",
    RO: "Câmpurile obligatorii lipsesc.",
  },
  invalidUserId: {
    DE: "Ungültige userId.",
    EN: "Invalid userId.",
    IT: "userId non valida.",
    TR: "Geçersiz userId.",
    SQ: "userId e pavlefshme.",
    KU: "userId nederbasdar e.",
    RO: "userId invalid.",
  },
  entryNotFound: {
    DE: "Eintrag nicht gefunden.",
    EN: "Entry not found.",
    IT: "Voce non trovata.",
    TR: "Kayıt bulunamadı.",
    SQ: "Regjistrimi nuk u gjet.",
    KU: "Tomar nehate dîtin.",
    RO: "Înregistrarea nu a fost găsită.",
  },
  fileReaderError: {
    DE: "Die Datei konnte nicht gelesen werden.",
    EN: "The file could not be read.",
    IT: "Impossibile leggere il file.",
    TR: "Dosya okunamadı.",
    SQ: "Skedari nuk mund të lexohej.",
    KU: "Pel nayê xwendin.",
    RO: "Fișierul nu a putut fi citit.",
  },
  fileReaderAborted: {
    DE: "Das Lesen der Datei wurde abgebrochen.",
    EN: "Reading the file was aborted.",
    IT: "La lettura del file è stata interrotta.",
    TR: "Dosyanın okunması iptal edildi.",
    SQ: "Leximi i skedarit u anulua.",
    KU: "Xwendina pelê hate betalkirin.",
    RO: "Citirea fișierului a fost întreruptă.",
  },
  invalidFileFormat: {
    DE: "Ungültiges Dateiformat.",
    EN: "Invalid file format.",
    IT: "Formato file non valido.",
    TR: "Geçersiz dosya biçimi.",
    SQ: "Format i pavlefshëm i skedarit.",
    KU: "Formata pelê nederbasdar e.",
    RO: "Format de fișier invalid.",
  },
  arrayBufferTimeout: {
    DE: "Zeitüberschreitung beim Lesen der Datei.",
    EN: "Timed out while reading the file.",
    IT: "Tempo scaduto durante la lettura del file.",
    TR: "Dosya okunurken zaman aşımı oluştu.",
    SQ: "Koha skadoi gjatë leximit të skedarit.",
    KU: "Dema xwendina pelê derbas bû.",
    RO: "Timpul pentru citirea fișierului a expirat.",
  },
  documentUploadUnknownError: {
    DE: "Das Dokument konnte nicht hochgeladen werden.",
    EN: "The document could not be uploaded.",
    IT: "Impossibile caricare il documento.",
    TR: "Belge yüklenemedi.",
    SQ: "Dokumenti nuk mund të ngarkohej.",
    KU: "Belge nayê barkirin.",
    RO: "Documentul nu a putut fi încărcat.",
  },
  weeklyPlanLoadError: {
    DE: "Der Wochenplan konnte nicht geladen werden.",
    EN: "The weekly plan could not be loaded.",
    IT: "Impossibile caricare il piano settimanale.",
    TR: "Haftalık plan yüklenemedi.",
    SQ: "Plani javor nuk mund të ngarkohej.",
    KU: "Plana hefteyî nayê barkirin.",
    RO: "Planul săptămânal nu a putut fi încărcat.",
  },
  usersLoadError: {
    DE: "Die Mitarbeiter konnten nicht geladen werden.",
    EN: "The employees could not be loaded.",
    IT: "Impossibile caricare i dipendenti.",
    TR: "Çalışanlar yüklenemedi.",
    SQ: "Punonjësit nuk mund të ngarkoheshin.",
    KU: "Karmend nayên barkirin.",
    RO: "Angajații nu au putut fi încărcați.",
  },
  adminNotesLoadError: {
    DE: "Die Admin-Notizen konnten nicht geladen werden.",
    EN: "The admin notes could not be loaded.",
    IT: "Impossibile caricare le note admin.",
    TR: "Yönetici notları yüklenemedi.",
    SQ: "Shënimet e administratorit nuk mund të ngarkoheshin.",
    KU: "Nîşaneyên admin nayên barkirin.",
    RO: "Notițele administratorului nu au putut fi încărcate.",
  },
  planEntriesLoadError: {
    DE: "Die Plan-Einträge konnten nicht geladen werden.",
    EN: "The plan entries could not be loaded.",
    IT: "Impossibile caricare le voci del piano.",
    TR: "Plan kayıtları yüklenemedi.",
    SQ: "Regjistrimet e planit nuk mund të ngarkoheshin.",
    KU: "Tomarên planê nayên barkirin.",
    RO: "Înregistrările planului nu au putut fi încărcate.",
  },
};