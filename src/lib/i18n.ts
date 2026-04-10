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
  | "unpaidVacationHours";

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
};