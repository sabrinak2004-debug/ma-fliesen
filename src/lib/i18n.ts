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
  | "unpaidVacationHours"
  | "openActiveEmployeesList"
  | "openMissingEntriesList"
  | "openAbsencesList"
  | "openGeneralMissingEntriesList"
  | "expandCollapseTitle";

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
  | "insufficientPaidVacationHint";

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
    SQ: "Ende nuk ka dokumente.",
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