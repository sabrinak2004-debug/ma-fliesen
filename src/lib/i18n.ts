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
  | "dash";

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