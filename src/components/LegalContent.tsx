"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LEGAL_UI_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";
import { readPublicLanguage } from "@/lib/publicLanguage";

type LegalContentType = "privacy" | "terms";

type LegalContentProps = {
  type: LegalContentType;
  initialLanguage: AppUiLanguage;
};

type LegalBlock =
  | { kind: "h2"; content: Record<AppUiLanguage, string> }
  | { kind: "h3"; content: Record<AppUiLanguage, string> }
  | { kind: "p"; content: Record<AppUiLanguage, string> }
  | { kind: "ul"; items: Record<AppUiLanguage, string>[] };

const PRIVACY_BLOCKS: LegalBlock[] = [
  {
    kind: "h2",
    content: {
      DE: "1. Allgemeine Hinweise",
      EN: "1. General Information",
      IT: "1. Informazioni Generali",
      TR: "1. Genel Bilgiler",
      SQ: "1. Informacione të Përgjithshme",
      KU: "1. Agahiyên Giştî",
      RO: "1. Informații Generale",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten bei der Nutzung der Webanwendung „saleo.app“ (digitale Zeiterfassung und Mitarbeiterverwaltung).",
      EN: "This privacy policy explains the processing of personal data when using the web application “saleo.app” (digital time tracking and employee management).",
      IT: "La presente informativa sulla privacy descrive il trattamento dei dati personali durante l’utilizzo dell’applicazione web “saleo.app” (rilevazione digitale del tempo e gestione dei dipendenti).",
      TR: "Bu gizlilik politikası, “saleo.app” web uygulamasının (dijital zaman takibi ve çalışan yönetimi) kullanımı sırasında kişisel verilerin işlenmesini açıklar.",
      SQ: "Kjo politikë privatësie shpjegon përpunimin e të dhënave personale gjatë përdorimit të aplikacionit web “saleo.app” (regjistrim dixhital i kohës dhe menaxhim i punonjësve).",
      KU: "Ev polîtîkaya nepenîtiyê pêvajoya daneyên kesane di dema bikaranîna sepanê ya webê “saleo.app” de şirove dike (tomarkirina demê ya dîjîtal û rêveberiya karmendan).",
      RO: "Această politică de confidențialitate explică procesarea datelor personale atunci când utilizați aplicația web “saleo.app” (urmărirea digitală a timpului și gestionarea angajaților).",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "2. Verantwortlicher",
      EN: "2. Controller",
      IT: "2. Titolare del trattamento",
      TR: "2. Veri Sorumlusu",
      SQ: "2. Përgjegjësi i përpunimit",
      KU: "2. Berpirsa pêvajoyê",
      RO: "2. Operatorul de date",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Verantwortlich für die Datenverarbeitung ist:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
      EN: "The controller responsible for data processing is:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
      IT: "Il titolare del trattamento è:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
      TR: "Veri işleme faaliyetinden sorumlu kişi:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
      SQ: "Përgjegjëse për përpunimin e të dhënave është:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
      KU: "Berpirsa pêvajoya daneyan ev e:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
      RO: "Operatorul responsabil pentru procesarea datelor este:\nSabrina Klausmeier\nStetter Weg 11, 70794 Filderstadt\nsabrinak2004@gmail.com",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "3. Verarbeitete Daten",
      EN: "3. Processed Data",
      IT: "3. Dati trattati",
      TR: "3. İşlenen Veriler",
      SQ: "3. Të dhënat e përpunuara",
      KU: "3. Daneyên tên pêvajokirin",
      RO: "3. Datele procesate",
    },
  },
  {
    kind: "h3",
    content: {
      DE: "a) Benutzerdaten",
      EN: "a) User data",
      IT: "a) Dati utente",
      TR: "a) Kullanıcı verileri",
      SQ: "a) Të dhënat e përdoruesit",
      KU: "a) Daneyên bikarhênerê",
      RO: "a) Datele utilizatorului",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Name (fullName)",
        EN: "Name (fullName)",
        IT: "Nome (fullName)",
        TR: "Ad (fullName)",
        SQ: "Emri (fullName)",
        KU: "Nav (fullName)",
        RO: "Nume (fullName)",
      },
      {
        DE: "Benutzerrolle (Mitarbeiter / Admin)",
        EN: "User role (Employee / Admin)",
        IT: "Ruolo utente (Dipendente / Admin)",
        TR: "Kullanıcı rolü (Çalışan / Yönetici)",
        SQ: "Roli i përdoruesit (Punonjës / Admin)",
        KU: "Rolê bikarhênerê (Karmend / Rêvebir)",
        RO: "Rolul utilizatorului (Angajat / Admin)",
      },
      {
        DE: "Login-Daten (verschlüsselt)",
        EN: "Login data (encrypted)",
        IT: "Dati di accesso (criptati)",
        TR: "Giriş verileri (şifrelenmiş)",
        SQ: "Të dhënat e hyrjes (të enkriptuara)",
        KU: "Daneyên têketinê (şîfrekirî)",
        RO: "Datele de autentificare (criptate)",
      },
      {
        DE: "Firmenzugehörigkeit",
        EN: "Company affiliation",
        IT: "Appartenenza aziendale",
        TR: "Şirket bağlantısı",
        SQ: "Përkatësia e kompanisë",
        KU: "Girêdana pargîdaniyê",
        RO: "Afilierea companiei",
      },
    ],
  },
  {
    kind: "h3",
    content: {
      DE: "b) Arbeitszeitdaten",
      EN: "b) Working time data",
      IT: "b) Dati sull’orario di lavoro",
      TR: "b) Çalışma süresi verileri",
      SQ: "b) Të dhënat e kohës së punës",
      KU: "b) Daneyên demjimêra karê",
      RO: "b) Datele timpului de lucru",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Arbeitszeiten (Start, Ende)",
        EN: "Working times (start, end)",
        IT: "Orari di lavoro (inizio, fine)",
        TR: "Çalışma saatleri (başlangıç, bitiş)",
        SQ: "Orari i punës (fillimi, fundi)",
        KU: "Demjimêrên karê (destpêk, dawî)",
        RO: "Orele de lucru (început, sfârșit)",
      },
      {
        DE: "Pausen",
        EN: "Breaks",
        IT: "Pause",
        TR: "Molalar",
        SQ: "Pushimet",
        KU: "Navber",
        RO: "Pauze",
      },
      {
        DE: "Tätigkeiten",
        EN: "Activities",
        IT: "Attività",
        TR: "Faaliyetler",
        SQ: "Aktivitetet",
        KU: "Çalakî",
        RO: "Activități",
      },
      {
        DE: "Einsatzorte",
        EN: "Work locations",
        IT: "Luoghi di impiego",
        TR: "Görev yerleri",
        SQ: "Vendet e punës",
        KU: "Cihên karê",
        RO: "Locații de muncă",
      },
      {
        DE: "Fahrtzeiten",
        EN: "Travel times",
        IT: "Tempi di viaggio",
        TR: "Yol süreleri",
        SQ: "Kohët e udhëtimit",
        KU: "Demên rêwîtiyê",
        RO: "Timp de călătorie",
      },
      {
        DE: "Notizen",
        EN: "Notes",
        IT: "Note",
        TR: "Notlar",
        SQ: "Shënime",
        KU: "Nîşe",
        RO: "Note",
      },
    ],
  },
  {
    kind: "h3",
    content: {
      DE: "c) Abwesenheitsdaten",
      EN: "c) Absence data",
      IT: "c) Dati di assenza",
      TR: "c) Devamsızlık verileri",
      SQ: "c) Të dhënat e mungesës",
      KU: "c) Daneyên nebûnê",
      RO: "c) Datele de absență",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Urlaub (bezahlt/unbezahlt, halbe Tage möglich)",
        EN: "Vacation (paid/unpaid, half days possible)",
        IT: "Ferie (retribuite/non retribuite, possibili mezze giornate)",
        TR: "İzin (ücretli/ücretsiz, yarım gün mümkün)",
        SQ: "Pushim (i paguar / i papaguar, të mundshme gjysmë dite)",
        KU: "Îzin (mûçe/heqî, nîv roj jî heye)",
        RO: "Vacanță (plătită/neplătită, posibilă jumătate de zi)",
      },
      {
        DE: "Krankheitstage",
        EN: "Sick days",
        IT: "Giorni di malattia",
        TR: "Hastalık günleri",
        SQ: "Ditët e sëmundjes",
        KU: "Rojên nexweşiyê",
        RO: "Zile de boală",
      },
      {
        DE: "Anträge (Urlaub, Krankheit, Nachträge)",
        EN: "Requests (vacation, sickness, corrections)",
        IT: "Richieste (ferie, malattia, correzioni)",
        TR: "Talepler (izin, hastalık, düzeltme)",
        SQ: "Kërkesa (pushim, sëmundje, korrigjime)",
        KU: "Daxwaz (îzin, nexweşî, rastkirin)",
        RO: "Cereri (vacanță, boală, corecții)",
      },
    ],
  },
{
  kind: "h3",
  content: {
    DE: "d) Organisations-, Kalender- und Planungsdaten",
    EN: "d) Organization, calendar and planning data",
    IT: "d) Dati organizzativi, di calendario e di pianificazione",
    TR: "d) Organizasyon, takvim ve planlama verileri",
    SQ: "d) Të dhëna organizimi, kalendari dhe planifikimi",
    KU: "d) Daneyên rêxistin, salname û planê",
    RO: "d) Date de organizare, calendar și planificare",
  },
},
{
  kind: "p",
  content: {
    DE: "In der App können Kalendereinträge, Termine, Wochenpläne und Aufgaben verarbeitet werden. Wenn ein Nutzer die optionale Google Calendar Integration aktiviert, verarbeitet die App zusätzlich Google-Kalenderdaten.",
    EN: "Calendar entries, appointments, weekly plans and tasks may be processed in the app. If a user activates the optional Google Calendar integration, the app additionally processes Google Calendar data.",
    IT: "Nell’app possono essere trattati voci di calendario, appuntamenti, piani settimanali e attività. Se un utente attiva l’integrazione opzionale con Google Calendar, l’app tratta inoltre dati di Google Calendar.",
    TR: "Uygulamada takvim kayıtları, randevular, haftalık planlar ve görevler işlenebilir. Kullanıcı isteğe bağlı Google Calendar entegrasyonunu etkinleştirirse, uygulama ayrıca Google Calendar verilerini işler.",
    SQ: "Në aplikacion mund të përpunohen regjistrime kalendari, takime, plane javore dhe detyra. Nëse një përdorues aktivizon integrimin opsional me Google Calendar, aplikacioni përpunon gjithashtu të dhëna të Google Calendar.",
    KU: "Di sepanê de tomarên salnameyê, civîn, planên heftane û erk dikarin werin pêvajokirin. Heke bikarhêner entegrasyona vebijarkî ya Google Calendar çalak bike, sepan her wiha daneyên Google Calendar jî pêvajoyê dike.",
    RO: "În aplicație pot fi procesate intrări de calendar, programări, planuri săptămânale și sarcini. Dacă un utilizator activează integrarea opțională Google Calendar, aplicația procesează suplimentar date Google Calendar.",
  },
},
{
  kind: "ul",
  items: [
    {
      DE: "Kalendereinträge und Termine",
      EN: "Calendar entries and appointments",
      IT: "Voci di calendario e appuntamenti",
      TR: "Takvim kayıtları ve randevular",
      SQ: "Regjistrime kalendari dhe takime",
      KU: "Tomarên salnameyê û civîn",
      RO: "Intrări de calendar și programări",
    },
    {
      DE: "Titel, Startzeit, Endzeit, Ort und Notizen/Beschreibungen von Terminen",
      EN: "Titles, start times, end times, locations and notes/descriptions of appointments",
      IT: "Titoli, orari di inizio, orari di fine, luoghi e note/descrizioni degli appuntamenti",
      TR: "Randevuların başlıkları, başlangıç saatleri, bitiş saatleri, konumları ve notları/açıklamaları",
      SQ: "Tituj, koha e fillimit, koha e përfundimit, vendndodhjet dhe shënimet/përshkrimet e takimeve",
      KU: "Sernav, demên destpêkê, demên dawî, cih û nîşe/şiroveyên civînan",
      RO: "Titluri, ore de început, ore de sfârșit, locații și note/descrieri ale programărilor",
    },
    {
      DE: "Google Calendar ID, Google Event ID, Google iCalUID, Google ETag und Google-Aktualisierungszeitpunkt",
      EN: "Google Calendar ID, Google Event ID, Google iCalUID, Google ETag and Google updated timestamp",
      IT: "ID Google Calendar, ID evento Google, Google iCalUID, Google ETag e data di aggiornamento Google",
      TR: "Google Calendar ID, Google Event ID, Google iCalUID, Google ETag ve Google güncelleme zamanı",
      SQ: "Google Calendar ID, Google Event ID, Google iCalUID, Google ETag dhe koha e përditësimit nga Google",
      KU: "Google Calendar ID, Google Event ID, Google iCalUID, Google ETag û dema nûkirina Google",
      RO: "Google Calendar ID, Google Event ID, Google iCalUID, Google ETag și momentul actualizării Google",
    },
    {
      DE: "Synchronisationsdaten wie Sync-Token, letzter Synchronisationszeitpunkt und Synchronisationsquelle",
      EN: "Synchronization data such as sync token, last synchronization time and synchronization source",
      IT: "Dati di sincronizzazione come token di sincronizzazione, ultimo momento di sincronizzazione e fonte della sincronizzazione",
      TR: "Senkronizasyon belirteci, son senkronizasyon zamanı ve senkronizasyon kaynağı gibi senkronizasyon verileri",
      SQ: "Të dhëna sinkronizimi si sync token, koha e fundit e sinkronizimit dhe burimi i sinkronizimit",
      KU: "Daneyên hevdemkirinê wekî sync-token, dema dawî ya hevdemkirinê û çavkaniya hevdemkirinê",
      RO: "Date de sincronizare precum sync token, ultimul moment al sincronizării și sursa sincronizării",
    },
    {
      DE: "OAuth-Verbindungsdaten, insbesondere Refresh Token, soweit für die Verbindung mit Google Calendar erforderlich",
      EN: "OAuth connection data, especially refresh tokens, where required for the connection with Google Calendar",
      IT: "Dati di connessione OAuth, in particolare refresh token, se necessari per la connessione con Google Calendar",
      TR: "Google Calendar bağlantısı için gerekli olduğu ölçüde OAuth bağlantı verileri, özellikle refresh token",
      SQ: "Të dhëna lidhjeje OAuth, veçanërisht refresh token, kur kërkohen për lidhjen me Google Calendar",
      KU: "Daneyên girêdana OAuth, bi taybetî refresh token, heke ji bo girêdana bi Google Calendar re pêdivî be",
      RO: "Date de conectare OAuth, în special refresh token, dacă sunt necesare pentru conexiunea cu Google Calendar",
    },
    {
      DE: "Channel- und Webhook-Daten von Google, insbesondere Channel ID, Resource ID und Ablaufzeitpunkt des Channels",
      EN: "Google channel and webhook data, especially channel ID, resource ID and channel expiration time",
      IT: "Dati di canale e webhook di Google, in particolare ID canale, ID risorsa e scadenza del canale",
      TR: "Google kanal ve webhook verileri, özellikle kanal ID, kaynak ID ve kanal sona erme zamanı",
      SQ: "Të dhëna kanali dhe webhook nga Google, veçanërisht channel ID, resource ID dhe koha e skadimit të kanalit",
      KU: "Daneyên channel û webhook ên Google, bi taybetî channel ID, resource ID û dema qedandina channelê",
      RO: "Date de canal și webhook Google, în special channel ID, resource ID și momentul expirării canalului",
    },
    {
      DE: "Wochenpläne",
      EN: "Weekly plans",
      IT: "Piani settimanali",
      TR: "Haftalık planlar",
      SQ: "Plane javore",
      KU: "Planên heftane",
      RO: "Planuri săptămânale",
    },
    {
      DE: "Aufgaben",
      EN: "Tasks",
      IT: "Attività",
      TR: "Görevler",
      SQ: "Detyra",
      KU: "Erk",
      RO: "Sarcini",
    },
  ],
},
  {
    kind: "h3",
    content: {
      DE: "e) Dokumente",
      EN: "e) Documents",
      IT: "e) Documenti",
      TR: "e) Belgeler",
      SQ: "e) Dokumentet",
      KU: "e) Belge",
      RO: "e) Documente",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Hochgeladene Dateien (z. B. Baustellenzettel)",
        EN: "Uploaded files (e.g. construction site sheets)",
        IT: "File caricati (ad es. fogli di cantiere)",
        TR: "Yüklenen dosyalar (örn. şantiye formları)",
        SQ: "Skedarë të ngarkuar (p.sh. fletë kantieri)",
        KU: "Pelên barkirî (mînak belgeyên şantiyê)",
        RO: "Fișiere încărcate (de ex. fișe de șantier)",
      },
    ],
  },
  {
    kind: "h3",
    content: {
      DE: "f) Technische Daten",
      EN: "f) Technical data",
      IT: "f) Dati tecnici",
      TR: "f) Teknik veriler",
      SQ: "f) Të dhëna teknike",
      KU: "f) Daneyên teknîkî",
      RO: "f) Date tehnice",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Session-Daten (Login-Cookies)",
        EN: "Session data (login cookies)",
        IT: "Dati di sessione (cookie di login)",
        TR: "Oturum verileri (giriş çerezleri)",
        SQ: "Të dhëna sesioni (cookie hyrjeje)",
        KU: "Daneyên danişînê (cookieyên têketinê)",
        RO: "Date de sesiune (cookie-uri de autentificare)",
      },
      {
        DE: "Push-Benachrichtigungen (Browser-Subscription)",
        EN: "Push notifications (browser subscription)",
        IT: "Notifiche push (abbonamento browser)",
        TR: "Push bildirimleri (tarayıcı aboneliği)",
        SQ: "Njoftime push (abonim i shfletuesit)",
        KU: "Agahdariyên push (abonetiya gerokê)",
        RO: "Notificări push (abonament browser)",
      },
      {
        DE: "Zeitstempel (createdAt, updatedAt)",
        EN: "Timestamps (createdAt, updatedAt)",
        IT: "Timestamp (createdAt, updatedAt)",
        TR: "Zaman damgaları (createdAt, updatedAt)",
        SQ: "Kohë-shënime (createdAt, updatedAt)",
        KU: "Demanîşan (createdAt, updatedAt)",
        RO: "Timestamps (createdAt, updatedAt)",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "4. Zweck der Verarbeitung",
      EN: "4. Purpose of processing",
      IT: "4. Finalità del trattamento",
      TR: "4. İşleme amacı",
      SQ: "4. Qëllimi i përpunimit",
      KU: "4. Armanca pêvajoyê",
      RO: "4. Scopul prelucrării",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die Verarbeitung erfolgt zur:",
      EN: "Processing is carried out for the following purposes:",
      IT: "Il trattamento viene effettuato per:",
      TR: "İşleme şu amaçlarla yapılır:",
      SQ: "Përpunimi kryhet për:",
      KU: "Pêvajokirin ji bo van armancan tê kirin:",
      RO: "Prelucrarea se realizează în următoarele scopuri:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Arbeitszeiterfassung",
        EN: "Time tracking",
        IT: "Rilevazione del tempo di lavoro",
        TR: "Çalışma süresi takibi",
        SQ: "Regjistrimi i kohës së punës",
        KU: "Tomarkirina demê ya karê",
        RO: "Urmărirea timpului",
      },
      {
        DE: "Verwaltung von Mitarbeitern",
        EN: "Employee management",
        IT: "Gestione dei dipendenti",
        TR: "Çalışan yönetimi",
        SQ: "Menaxhimi i punonjësve",
        KU: "Rêveberiya karmendan",
        RO: "Gestionarea angajaților",
      },
      {
        DE: "Planung von Einsätzen",
        EN: "Planning of assignments",
        IT: "Pianificazione degli impieghi",
        TR: "Görev planlaması",
        SQ: "Planifikimi i angazhimeve",
        KU: "Planandina cihgirtinan",
        RO: "Planificarea sarcinilor",
      },
      {
        DE: "Bearbeitung von Urlaubs- und Krankheitsanträgen",
        EN: "Processing vacation and sick leave requests",
        IT: "Gestione delle richieste di ferie e malattia",
        TR: "İzin ve hastalık taleplerinin işlenmesi",
        SQ: "Përpunimi i kërkesave për pushim dhe sëmundje",
        KU: "Pêvajoya daxwazên îzin û nexweşiyê",
        RO: "Procesarea cererilor de concediu și boală",
      },
      {
        DE: "Kommunikation über Aufgaben und Benachrichtigungen",
        EN: "Communication via tasks and notifications",
        IT: "Comunicazione tramite attività e notifiche",
        TR: "Görevler ve bildirimler üzerinden iletişim",
        SQ: "Komunikim përmes detyrave dhe njoftimeve",
        KU: "Têkilî bi erk û agahdariyan re",
        RO: "Comunicare prin sarcini și notificări",
      },
    ],
  },
  {
  kind: "p",
  content: {
    DE: "Bei aktivierter Google Calendar Integration erfolgt die Verarbeitung zusätzlich zur Synchronisation von Terminen zwischen saleo.app und Google Calendar.",
    EN: "If the Google Calendar integration is enabled, processing is additionally carried out to synchronize appointments between saleo.app and Google Calendar.",
    IT: "Se l’integrazione con Google Calendar è attivata, il trattamento viene effettuato inoltre per sincronizzare gli appuntamenti tra saleo.app e Google Calendar.",
    TR: "Google Calendar entegrasyonu etkinleştirildiğinde, veriler ayrıca saleo.app ile Google Calendar arasında randevuları senkronize etmek için işlenir.",
    SQ: "Nëse aktivizohet integrimi me Google Calendar, përpunimi kryhet gjithashtu për të sinkronizuar takimet midis saleo.app dhe Google Calendar.",
    KU: "Heke entegrasyona Google Calendar çalak be, pêvajokirin her wiha ji bo hevdemkirina civînan di navbera saleo.app û Google Calendar de tê kirin.",
    RO: "Dacă integrarea Google Calendar este activată, procesarea se realizează suplimentar pentru sincronizarea programărilor între saleo.app și Google Calendar.",
  },
},
{
  kind: "ul",
  items: [
    {
      DE: "Anzeige von Google-Kalendereinträgen innerhalb der App",
      EN: "Displaying Google calendar entries within the app",
      IT: "Visualizzazione delle voci di Google Calendar all’interno dell’app",
      TR: "Google takvim kayıtlarının uygulama içinde gösterilmesi",
      SQ: "Shfaqja e regjistrimeve të Google Calendar brenda aplikacionit",
      KU: "Nîşandana tomarên Google Calendar di hundurê sepanê de",
      RO: "Afișarea intrărilor Google Calendar în aplicație",
    },
    {
      DE: "Übertragung von in der App erstellten oder geänderten Terminen in den verbundenen Google-Kalender",
      EN: "Transferring appointments created or changed in the app to the connected Google Calendar",
      IT: "Trasferimento degli appuntamenti creati o modificati nell’app al Google Calendar collegato",
      TR: "Uygulamada oluşturulan veya değiştirilen randevuların bağlı Google Calendar’a aktarılması",
      SQ: "Transferimi i takimeve të krijuara ose të ndryshuara në aplikacion te Google Calendar i lidhur",
      KU: "Veguhastina civînên ku di sepanê de hatine afirandin an guhertin bo Google Calendar a girêdayî",
      RO: "Transferul programărilor create sau modificate în aplicație către Google Calendar conectat",
    },
    {
      DE: "Übernahme von in Google Calendar erstellten oder geänderten Terminen in die App",
      EN: "Importing appointments created or changed in Google Calendar into the app",
      IT: "Importazione nell’app degli appuntamenti creati o modificati in Google Calendar",
      TR: "Google Calendar’da oluşturulan veya değiştirilen randevuların uygulamaya alınması",
      SQ: "Marrja në aplikacion e takimeve të krijuara ose të ndryshuara në Google Calendar",
      KU: "Anîna civînên ku di Google Calendar de hatine afirandin an guhertin bo sepanê",
      RO: "Preluarea în aplicație a programărilor create sau modificate în Google Calendar",
    },
    {
      DE: "Abgleich von Änderungen und Vermeidung doppelter Kalendereinträge",
      EN: "Synchronizing changes and avoiding duplicate calendar entries",
      IT: "Sincronizzazione delle modifiche ed evitamento di voci duplicate nel calendario",
      TR: "Değişikliklerin eşleştirilmesi ve yinelenen takvim kayıtlarının önlenmesi",
      SQ: "Sinkronizimi i ndryshimeve dhe shmangia e regjistrimeve të dyfishta në kalendar",
      KU: "Hevdemkirina guhertinan û astengkirina tomarên dubare yên salnameyê",
      RO: "Sincronizarea modificărilor și evitarea intrărilor duplicate în calendar",
    },
  ],
},
{
  kind: "p",
  content: {
    DE: "Wenn die Google Calendar Integration aktiviert ist, findet eine bidirektionale Synchronisation statt. Das bedeutet: Termine, die in der App erstellt, geändert oder gelöscht werden, können an Google Calendar übertragen werden. Ebenso können Termine, die in Google Calendar erstellt, geändert oder gelöscht werden, in der App übernommen und dort angezeigt bzw. gespeichert werden.",
    EN: "If the Google Calendar integration is enabled, bidirectional synchronization takes place. This means that appointments created, changed or deleted in the app may be transferred to Google Calendar. Likewise, appointments created, changed or deleted in Google Calendar may be imported into the app and displayed or stored there.",
    IT: "Se l’integrazione con Google Calendar è attivata, avviene una sincronizzazione bidirezionale. Ciò significa che gli appuntamenti creati, modificati o eliminati nell’app possono essere trasferiti a Google Calendar. Allo stesso modo, gli appuntamenti creati, modificati o eliminati in Google Calendar possono essere importati nell’app e visualizzati o salvati lì.",
    TR: "Google Calendar entegrasyonu etkinleştirilirse çift yönlü senkronizasyon gerçekleşir. Bu, uygulamada oluşturulan, değiştirilen veya silinen randevuların Google Calendar’a aktarılabileceği anlamına gelir. Aynı şekilde Google Calendar’da oluşturulan, değiştirilen veya silinen randevular uygulamaya alınabilir ve orada gösterilebilir veya saklanabilir.",
    SQ: "Nëse aktivizohet integrimi me Google Calendar, kryhet sinkronizim dykahësh. Kjo do të thotë se takimet e krijuara, të ndryshuara ose të fshira në aplikacion mund të transferohen në Google Calendar. Po ashtu, takimet e krijuara, të ndryshuara ose të fshira në Google Calendar mund të merren në aplikacion dhe të shfaqen ose të ruhen atje.",
    KU: "Heke entegrasyona Google Calendar çalak be, hevdemkirina du-alî pêk tê. Ev tê wê wateyê ku civînên di sepanê de hatine afirandin, guhertin an jêbirin dikarin bo Google Calendar werin veguhastin. Her wiha civînên ku di Google Calendar de hatine afirandin, guhertin an jêbirin dikarin werin anîn bo sepanê û li wir werin nîşandan an tomarkirin.",
    RO: "Dacă integrarea Google Calendar este activată, are loc o sincronizare bidirecțională. Aceasta înseamnă că programările create, modificate sau șterse în aplicație pot fi transferate către Google Calendar. De asemenea, programările create, modificate sau șterse în Google Calendar pot fi preluate în aplicație și afișate sau stocate acolo.",
  },
},
  {
    kind: "h2",
    content: {
      DE: "5. Rechtsgrundlage",
      EN: "5. Legal basis",
      IT: "5. Base giuridica",
      TR: "5. Hukuki dayanak",
      SQ: "5. Baza ligjore",
      KU: "5. Bingehê qanûnî",
      RO: "5. Baza legală",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die Verarbeitung erfolgt gemäß:",
      EN: "Processing is based on:",
      IT: "Il trattamento si basa su:",
      TR: "İşleme şu hükümlere dayanır:",
      SQ: "Përpunimi bazohet në:",
      KU: "Pêvajokirin li ser van bingehan e:",
      RO: "Prelucrarea se bazează pe:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)",
        EN: "Art. 6(1)(b) GDPR (performance of a contract)",
        IT: "Art. 6 par. 1 lett. b GDPR (esecuzione del contratto)",
        TR: "KVKK/GDPR Madde 6(1)(b) (sözleşmenin ifası)",
        SQ: "Neni 6(1)(b) GDPR (zbatimi i kontratës)",
        KU: "Art. 6(1)(b) GDPR (bicihanîna peymanê)",
        RO: "Art. 6(1)(b) GDPR (executarea unui contract)",
      },
      {
        DE: "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter Organisation)",
        EN: "Art. 6(1)(f) GDPR (legitimate interest in efficient organization)",
        IT: "Art. 6 par. 1 lett. f GDPR (legittimo interesse a un’organizzazione efficiente)",
        TR: "GDPR Madde 6(1)(f) (verimli organizasyonda meşru menfaat)",
        SQ: "Neni 6(1)(f) GDPR (interes legjitim për organizim efikas)",
        KU: "Art. 6(1)(f) GDPR (berjewendiya rewa ji bo rêxistina bi bandor)",
        RO: "Art. 6(1)(f) GDPR (interes legitim în organizarea eficientă)",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "6. Push-Benachrichtigungen",
      EN: "6. Push Notifications",
      IT: "6. Notifiche push",
      TR: "6. Push Bildirimleri",
      SQ: "6. Njoftimet push",
      KU: "6. Agahdariyên push",
      RO: "6. Notificări push",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die App kann Push-Benachrichtigungen senden, z. B. bei Anträgen oder Aufgaben. Diese werden nur nach Zustimmung aktiviert.",
      EN: "The app may send push notifications, for example for requests or tasks. These are activated only after consent.",
      IT: "L’app può inviare notifiche push, ad esempio per richieste o attività. Queste vengono attivate solo previo consenso.",
      TR: "Uygulama, örneğin talepler veya görevler için push bildirimleri gönderebilir. Bunlar yalnızca onay sonrasında etkinleştirilir.",
      SQ: "Aplikacioni mund të dërgojë njoftime push, për shembull për kërkesa ose detyra. Këto aktivizohen vetëm pas pëlqimit.",
      KU: "Sepan dikare agahdariyên push bişîne, mînak ji bo daxwaz an erk. Ev tenê piştî razîbûnê çalak dibin.",
      RO: "Aplicația poate trimite notificări push, de exemplu pentru cereri sau sarcini. Acestea sunt activate doar după consimțământ.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "7. Cookies / Sessions",
      EN: "7. Cookies / Sessions",
      IT: "7. Cookie / Sessioni",
      TR: "7. Çerezler / Oturumlar",
      SQ: "7. Cookies / Sesione",
      KU: "7. Cookie / Danişîn",
      RO: "7. Cookie-uri / Sesiuni",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Zur Authentifizierung wird ein Session-Cookie verwendet. Dieses ist technisch notwendig und enthält keine Tracking-Daten.",
      EN: "A session cookie is used for authentication. It is technically necessary and does not contain tracking data.",
      IT: "Per l’autenticazione viene utilizzato un cookie di sessione. È tecnicamente necessario e non contiene dati di tracciamento.",
      TR: "Kimlik doğrulama için bir oturum çerezi kullanılır. Bu teknik olarak gereklidir ve izleme verisi içermez.",
      SQ: "Për autentifikim përdoret një cookie sesioni. Ai është teknikisht i nevojshëm dhe nuk përmban të dhëna gjurmimi.",
      KU: "Ji bo nasnamekirinê cookieyek danişînê tê bikaranîn. Ew ji aliyê teknîkî ve pêdivî ye û daneyên şopandinê nagire.",
      RO: "Pentru autentificare se folosește un cookie de sesiune. Acesta este tehnic necesar și nu conține date de urmărire.",
    },
  },
{
  kind: "h2",
  content: {
    DE: "8. Speicherung und Löschung",
    EN: "8. Storage and deletion",
    IT: "8. Conservazione e cancellazione",
    TR: "8. Saklama ve silme",
    SQ: "8. Ruajtja dhe fshirja",
    KU: "8. Tomarkirin û jêbirin",
    RO: "8. Stocare și ștergere",
  },
},
{
  kind: "p",
  content: {
    DE: "Daten werden gespeichert, solange dies für die Bereitstellung der App-Funktionen, ein aktives Nutzerverhältnis, gesetzliche Aufbewahrungspflichten, Dokumentation, Sicherheit oder Fehlerbehebung erforderlich ist.",
    EN: "Data is stored as long as this is required to provide the app functions, maintain an active user relationship, comply with legal retention obligations, or for documentation, security or troubleshooting purposes.",
    IT: "I dati vengono conservati finché ciò è necessario per fornire le funzioni dell’app, mantenere un rapporto utente attivo, rispettare obblighi legali di conservazione oppure per documentazione, sicurezza o risoluzione dei problemi.",
    TR: "Veriler, uygulama işlevlerinin sağlanması, aktif kullanıcı ilişkisinin sürdürülmesi, yasal saklama yükümlülüklerine uyulması veya dokümantasyon, güvenlik ya da hata giderme amaçları için gerekli olduğu sürece saklanır.",
    SQ: "Të dhënat ruhen për aq kohë sa kjo është e nevojshme për ofrimin e funksioneve të aplikacionit, marrëdhënien aktive me përdoruesin, detyrimet ligjore të ruajtjes, dokumentimin, sigurinë ose zgjidhjen e problemeve.",
    KU: "Dane heta wê demê tên tomarkirin ku ji bo peydakirina fonksiyonên sepanê, têkiliya bikarhênerê ya çalak, erkên qanûnî yên tomarkirinê, belgekirin, ewlehî an çareserkirina kêşeyan pêdivî be.",
    RO: "Datele sunt stocate atât timp cât este necesar pentru furnizarea funcțiilor aplicației, o relație activă cu utilizatorul, obligații legale de păstrare, documentare, securitate sau remedierea erorilor.",
  },
},
{
  kind: "p",
  content: {
    DE: "Bei aktivierter Google Calendar Integration werden die für die Synchronisation erforderlichen Google-Verbindungsdaten und Kalenderdaten gespeichert, solange die Verbindung aktiv ist oder die Daten für die Kalenderfunktion erforderlich sind.",
    EN: "If the Google Calendar integration is enabled, the Google connection data and calendar data required for synchronization are stored as long as the connection is active or the data is required for the calendar function.",
    IT: "Se l’integrazione con Google Calendar è attivata, i dati di connessione Google e i dati di calendario necessari per la sincronizzazione vengono conservati finché la connessione è attiva o i dati sono necessari per la funzione calendario.",
    TR: "Google Calendar entegrasyonu etkinse, senkronizasyon için gerekli Google bağlantı verileri ve takvim verileri, bağlantı aktif olduğu veya takvim işlevi için gerekli olduğu sürece saklanır.",
    SQ: "Nëse integrimi me Google Calendar është aktivizuar, të dhënat e lidhjes me Google dhe të dhënat e kalendarit që nevojiten për sinkronizim ruhen për aq kohë sa lidhja është aktive ose të dhënat nevojiten për funksionin e kalendarit.",
    KU: "Heke entegrasyona Google Calendar çalak be, daneyên girêdana Google û daneyên salnameyê yên ji bo hevdemkirinê pêdivî heta dema ku girêdan çalak e an dane ji bo fonksiyona salnameyê pêdivî ne tên tomarkirin.",
    RO: "Dacă integrarea Google Calendar este activată, datele de conectare Google și datele de calendar necesare sincronizării sunt stocate atât timp cât conexiunea este activă sau datele sunt necesare pentru funcția de calendar.",
  },
},
{
  kind: "p",
  content: {
    DE: "Nach Trennung der Google Calendar Verbindung werden keine weiteren neuen Google-Kalenderdaten synchronisiert. Eine Löschung bereits gespeicherter Daten kann über den Verantwortlichen angefragt werden.",
    EN: "After disconnecting the Google Calendar connection, no further new Google calendar data is synchronized. Deletion of already stored data may be requested from the controller.",
    IT: "Dopo la disconnessione da Google Calendar, non vengono più sincronizzati nuovi dati di Google Calendar. La cancellazione dei dati già memorizzati può essere richiesta al titolare del trattamento.",
    TR: "Google Calendar bağlantısı kesildikten sonra yeni Google takvim verileri artık senkronize edilmez. Önceden saklanan verilerin silinmesi veri sorumlusundan talep edilebilir.",
    SQ: "Pas shkëputjes së lidhjes me Google Calendar, nuk sinkronizohen më të dhëna të reja të Google Calendar. Fshirja e të dhënave tashmë të ruajtura mund të kërkohet nga përgjegjësi i përpunimit.",
    KU: "Piştî qutkirina girêdana Google Calendar, êdî daneyên nû yên Google Calendar nayên hevdemkirin. Jêbirina daneyên ku berê hatine tomarkirin dikare ji berpirsa pêvajoyê were xwestin.",
    RO: "După deconectarea conexiunii Google Calendar, nu se mai sincronizează date noi Google Calendar. Ștergerea datelor deja stocate poate fi solicitată operatorului.",
  },
},
{
  kind: "h2",
  content: {
    DE: "9. Google Calendar Integration",
    EN: "9. Google Calendar Integration",
    IT: "9. Integrazione Google Calendar",
    TR: "9. Google Calendar Entegrasyonu",
    SQ: "9. Integrimi me Google Calendar",
    KU: "9. Entegrasyona Google Calendar",
    RO: "9. Integrarea Google Calendar",
  },
},
{
  kind: "p",
  content: {
    DE: "Die App bietet eine optionale Integration mit Google Calendar. Die Verbindung wird nur hergestellt, wenn der Nutzer diese Funktion aktiv nutzt und sich über Google verbindet.",
    EN: "The app offers an optional integration with Google Calendar. The connection is only established if the user actively uses this function and connects through Google.",
    IT: "L’app offre un’integrazione opzionale con Google Calendar. La connessione viene stabilita solo se l’utente utilizza attivamente questa funzione e si collega tramite Google.",
    TR: "Uygulama, Google Calendar ile isteğe bağlı bir entegrasyon sunar. Bağlantı yalnızca kullanıcı bu işlevi aktif olarak kullanır ve Google üzerinden bağlanırsa kurulur.",
    SQ: "Aplikacioni ofron një integrim opsional me Google Calendar. Lidhja krijohet vetëm nëse përdoruesi e përdor aktivisht këtë funksion dhe lidhet përmes Google.",
    KU: "Sepan entegrasyonek vebijarkî bi Google Calendar re pêşkêş dike. Girêdan tenê dema ku bikarhêner vê fonksiyonê bi awayekî çalak bikar bîne û bi Google ve girê bide tê avakirin.",
    RO: "Aplicația oferă o integrare opțională cu Google Calendar. Conexiunea este stabilită doar dacă utilizatorul folosește activ această funcție și se conectează prin Google.",
  },
},
{
  kind: "h3",
  content: {
    DE: "a) Zugriff auf Google-Nutzerdaten",
    EN: "a) Access to Google user data",
    IT: "a) Accesso ai dati utente Google",
    TR: "a) Google kullanıcı verilerine erişim",
    SQ: "a) Qasja në të dhënat e përdoruesit të Google",
    KU: "a) Gihîştina daneyên bikarhênerê Google",
    RO: "a) Acces la datele utilizatorului Google",
  },
},
{
  kind: "p",
  content: {
    DE: "Bei aktivierter Google Calendar Integration kann die App auf Daten des verbundenen Google-Kalenders zugreifen. Dazu gehören insbesondere:",
    EN: "If the Google Calendar integration is enabled, the app may access data from the connected Google Calendar. This includes in particular:",
    IT: "Se l’integrazione con Google Calendar è attivata, l’app può accedere ai dati del Google Calendar collegato. Ciò include in particolare:",
    TR: "Google Calendar entegrasyonu etkinleştirildiğinde, uygulama bağlı Google Calendar’daki verilere erişebilir. Bunlar özellikle şunları içerir:",
    SQ: "Nëse integrimi me Google Calendar është aktivizuar, aplikacioni mund të ketë qasje në të dhënat e Google Calendar të lidhur. Kjo përfshin veçanërisht:",
    KU: "Heke entegrasyona Google Calendar çalak be, sepan dikare bigihîje daneyên Google Calendar a girêdayî. Ev bi taybetî van dihewîne:",
    RO: "Dacă integrarea Google Calendar este activată, aplicația poate accesa date din Google Calendar conectat. Acestea includ în special:",
  },
},
{
  kind: "ul",
  items: [
    {
      DE: "Kalenderinformationen, insbesondere die Kalender-ID",
      EN: "Calendar information, especially the calendar ID",
      IT: "Informazioni del calendario, in particolare l’ID del calendario",
      TR: "Takvim bilgileri, özellikle takvim ID’si",
      SQ: "Informacione kalendari, veçanërisht ID-ja e kalendarit",
      KU: "Agahiyên salnameyê, bi taybetî ID-ya salnameyê",
      RO: "Informații despre calendar, în special ID-ul calendarului",
    },
    {
      DE: "Kalendereinträge mit Titel, Startzeit, Endzeit, Ort und Beschreibung/Notizen",
      EN: "Calendar entries with title, start time, end time, location and description/notes",
      IT: "Voci di calendario con titolo, ora di inizio, ora di fine, luogo e descrizione/note",
      TR: "Başlık, başlangıç zamanı, bitiş zamanı, konum ve açıklama/notlar içeren takvim kayıtları",
      SQ: "Regjistrime kalendari me titull, kohë fillimi, kohë përfundimi, vendndodhje dhe përshkrim/shënime",
      KU: "Tomarên salnameyê bi sernav, dema destpêkê, dema dawî, cih û şirove/nîşe",
      RO: "Intrări de calendar cu titlu, oră de început, oră de sfârșit, locație și descriere/note",
    },
    {
      DE: "technische Google-Kalenderdaten wie Google Event ID, Google iCalUID, Google ETag und Google-Aktualisierungszeitpunkt",
      EN: "technical Google calendar data such as Google Event ID, Google iCalUID, Google ETag and Google updated timestamp",
      IT: "dati tecnici di Google Calendar come Google Event ID, Google iCalUID, Google ETag e data di aggiornamento Google",
      TR: "Google Event ID, Google iCalUID, Google ETag ve Google güncelleme zamanı gibi teknik Google takvim verileri",
      SQ: "të dhëna teknike të Google Calendar si Google Event ID, Google iCalUID, Google ETag dhe koha e përditësimit nga Google",
      KU: "daneyên teknîkî yên Google Calendar wekî Google Event ID, Google iCalUID, Google ETag û dema nûkirina Google",
      RO: "date tehnice Google Calendar precum Google Event ID, Google iCalUID, Google ETag și momentul actualizării Google",
    },
    {
      DE: "Synchronisationsdaten wie Sync-Token, letzter Synchronisationszeitpunkt und Synchronisationsquelle",
      EN: "synchronization data such as sync token, last synchronization time and synchronization source",
      IT: "dati di sincronizzazione come token di sincronizzazione, ultimo momento di sincronizzazione e fonte della sincronizzazione",
      TR: "sync token, son senkronizasyon zamanı ve senkronizasyon kaynağı gibi senkronizasyon verileri",
      SQ: "të dhëna sinkronizimi si sync token, koha e fundit e sinkronizimit dhe burimi i sinkronizimit",
      KU: "daneyên hevdemkirinê wekî sync-token, dema dawî ya hevdemkirinê û çavkaniya hevdemkirinê",
      RO: "date de sincronizare precum sync token, ultimul moment al sincronizării și sursa sincronizării",
    },
    {
      DE: "technische Daten für Änderungsbenachrichtigungen, insbesondere Channel ID, Resource ID und Ablaufzeitpunkt des Google-Channels",
      EN: "technical data for change notifications, especially channel ID, resource ID and expiration time of the Google channel",
      IT: "dati tecnici per notifiche di modifica, in particolare ID canale, ID risorsa e scadenza del canale Google",
      TR: "değişiklik bildirimleri için teknik veriler, özellikle kanal ID, kaynak ID ve Google kanalının sona erme zamanı",
      SQ: "të dhëna teknike për njoftime ndryshimesh, veçanërisht channel ID, resource ID dhe koha e skadimit të kanalit Google",
      KU: "daneyên teknîkî ji bo agahdariyên guhertinê, bi taybetî channel ID, resource ID û dema qedandina channel-a Google",
      RO: "date tehnice pentru notificări de modificare, în special channel ID, resource ID și momentul expirării canalului Google",
    },
  ],
},
{
  kind: "h3",
  content: {
    DE: "b) Nutzung der Google-Daten",
    EN: "b) Use of Google data",
    IT: "b) Utilizzo dei dati Google",
    TR: "b) Google verilerinin kullanımı",
    SQ: "b) Përdorimi i të dhënave Google",
    KU: "b) Bikaranîna daneyên Google",
    RO: "b) Utilizarea datelor Google",
  },
},
{
  kind: "p",
  content: {
    DE: "Die Google-Kalenderdaten werden ausschließlich verwendet, um die Kalenderfunktion innerhalb der App bereitzustellen und Termine zwischen der App und Google Calendar zu synchronisieren. Die App verwendet Google-Kalenderdaten nicht für Werbung, Profilbildung, Tracking oder den Verkauf an Dritte.",
    EN: "Google calendar data is used exclusively to provide the calendar function within the app and to synchronize appointments between the app and Google Calendar. The app does not use Google calendar data for advertising, profiling, tracking or sale to third parties.",
    IT: "I dati di Google Calendar vengono utilizzati esclusivamente per fornire la funzione calendario all’interno dell’app e sincronizzare gli appuntamenti tra l’app e Google Calendar. L’app non utilizza i dati di Google Calendar per pubblicità, profilazione, tracciamento o vendita a terzi.",
    TR: "Google takvim verileri yalnızca uygulama içindeki takvim işlevini sağlamak ve uygulama ile Google Calendar arasında randevuları senkronize etmek için kullanılır. Uygulama Google takvim verilerini reklam, profil oluşturma, izleme veya üçüncü taraflara satış için kullanmaz.",
    SQ: "Të dhënat e Google Calendar përdoren ekskluzivisht për të ofruar funksionin e kalendarit brenda aplikacionit dhe për të sinkronizuar takimet midis aplikacionit dhe Google Calendar. Aplikacioni nuk përdor të dhënat e Google Calendar për reklamim, profilizim, gjurmim ose shitje te palë të treta.",
    KU: "Daneyên Google Calendar tenê ji bo peydakirina fonksiyona salnameyê di hundurê sepanê de û ji bo hevdemkirina civînan di navbera sepanê û Google Calendar de tên bikaranîn. Sepan daneyên Google Calendar ji bo reklam, profîlkirin, şopandin an firotinê ji aliyên sêyem re bikar nayîne.",
    RO: "Datele Google Calendar sunt utilizate exclusiv pentru furnizarea funcției de calendar în aplicație și pentru sincronizarea programărilor între aplicație și Google Calendar. Aplicația nu utilizează date Google Calendar pentru publicitate, profilare, urmărire sau vânzare către terți.",
  },
},
{
  kind: "h3",
  content: {
    DE: "c) Speicherung der Google-Daten",
    EN: "c) Storage of Google data",
    IT: "c) Conservazione dei dati Google",
    TR: "c) Google verilerinin saklanması",
    SQ: "c) Ruajtja e të dhënave Google",
    KU: "c) Tomarkirina daneyên Google",
    RO: "c) Stocarea datelor Google",
  },
},
{
  kind: "p",
  content: {
    DE: "Zur Bereitstellung der Synchronisation speichert die App die für die Verbindung und den Abgleich erforderlichen Daten. Dazu gehören insbesondere OAuth-Verbindungsdaten, Kalender-ID, Sync-Token, Channel-Daten, Google Event ID, Google iCalUID, Google ETag, Google-Aktualisierungszeitpunkt, synchronisierte Termindaten und Zeitstempel wie createdAt, updatedAt und lastSyncedAt.",
    EN: "To provide synchronization, the app stores the data required for the connection and synchronization. This includes in particular OAuth connection data, calendar ID, sync token, channel data, Google Event ID, Google iCalUID, Google ETag, Google updated timestamp, synchronized appointment data and timestamps such as createdAt, updatedAt and lastSyncedAt.",
    IT: "Per fornire la sincronizzazione, l’app memorizza i dati necessari per la connessione e il confronto. Ciò include in particolare dati di connessione OAuth, ID calendario, sync token, dati del canale, Google Event ID, Google iCalUID, Google ETag, data di aggiornamento Google, dati degli appuntamenti sincronizzati e timestamp come createdAt, updatedAt e lastSyncedAt.",
    TR: "Senkronizasyonu sağlamak için uygulama, bağlantı ve eşleştirme için gerekli verileri saklar. Bunlar özellikle OAuth bağlantı verileri, takvim ID’si, sync token, kanal verileri, Google Event ID, Google iCalUID, Google ETag, Google güncelleme zamanı, senkronize randevu verileri ve createdAt, updatedAt ve lastSyncedAt gibi zaman damgalarını içerir.",
    SQ: "Për të ofruar sinkronizimin, aplikacioni ruan të dhënat e nevojshme për lidhjen dhe krahasimin. Kjo përfshin veçanërisht të dhëna lidhjeje OAuth, ID kalendari, sync token, të dhëna kanali, Google Event ID, Google iCalUID, Google ETag, kohën e përditësimit nga Google, të dhëna të sinkronizuara të takimeve dhe kohë-shënime si createdAt, updatedAt dhe lastSyncedAt.",
    KU: "Ji bo peydakirina hevdemkirinê, sepan daneyên ji bo girêdan û berhevkirinê pêdivî tomar dike. Ev bi taybetî daneyên girêdana OAuth, ID-ya salnameyê, sync-token, daneyên channelê, Google Event ID, Google iCalUID, Google ETag, dema nûkirina Google, daneyên civînên hevdemkirî û demanîşan wekî createdAt, updatedAt û lastSyncedAt dihewîne.",
    RO: "Pentru furnizarea sincronizării, aplicația stochează datele necesare pentru conexiune și sincronizare. Acestea includ în special date de conectare OAuth, ID calendar, sync token, date de canal, Google Event ID, Google iCalUID, Google ETag, momentul actualizării Google, date sincronizate ale programărilor și marcaje temporale precum createdAt, updatedAt și lastSyncedAt.",
  },
},
{
  kind: "h3",
  content: {
    DE: "d) Weitergabe von Google-Daten",
    EN: "d) Disclosure of Google data",
    IT: "d) Comunicazione dei dati Google",
    TR: "d) Google verilerinin paylaşılması",
    SQ: "d) Dhënia e të dhënave Google",
    KU: "d) Parvekirina daneyên Google",
    RO: "d) Divulgarea datelor Google",
  },
},
{
  kind: "p",
  content: {
    DE: "Google-Kalenderdaten werden nicht an unbeteiligte Dritte verkauft oder zu Werbezwecken weitergegeben. Eine Übertragung findet nur statt, soweit dies für die gewünschte Kalenderfunktion erforderlich ist, insbesondere zwischen Google Calendar und der App sowie an technisch notwendige Dienstleister wie Hosting- oder Datenbankanbieter.",
    EN: "Google calendar data is not sold to unrelated third parties or disclosed for advertising purposes. A transfer only takes place to the extent required for the requested calendar function, especially between Google Calendar and the app and to technically necessary service providers such as hosting or database providers.",
    IT: "I dati di Google Calendar non vengono venduti a terzi non coinvolti né comunicati per finalità pubblicitarie. Il trasferimento avviene solo nella misura necessaria per la funzione calendario richiesta, in particolare tra Google Calendar e l’app e verso fornitori tecnici necessari come hosting o database provider.",
    TR: "Google takvim verileri ilgisiz üçüncü taraflara satılmaz veya reklam amaçlarıyla paylaşılmaz. Aktarım yalnızca istenen takvim işlevi için gerekli olduğu ölçüde gerçekleşir, özellikle Google Calendar ile uygulama arasında ve barındırma veya veritabanı sağlayıcıları gibi teknik olarak gerekli hizmet sağlayıcılara.",
    SQ: "Të dhënat e Google Calendar nuk u shiten palëve të treta të papërfshira dhe nuk jepen për qëllime reklamimi. Transferimi bëhet vetëm për aq sa është i nevojshëm për funksionin e kërkuar të kalendarit, veçanërisht midis Google Calendar dhe aplikacionit, si dhe te ofrues teknikisht të nevojshëm si hostimi ose ofruesit e bazës së të dhënave.",
    KU: "Daneyên Google Calendar ji aliyên sêyem ên têkildar nebûne re nayên firotin an ji bo armancên reklamê nayên parvekirin. Veguhastin tenê bi qasî ku ji bo fonksiyona salnameyê ya xwestî pêdivî be pêk tê, bi taybetî di navbera Google Calendar û sepanê de û ji bo peydakirinên teknîkî yên pêdivî wekî hosting an peydakirinên danegehê.",
    RO: "Datele Google Calendar nu sunt vândute unor terți neimplicați și nu sunt divulgate în scopuri publicitare. Transferul are loc doar în măsura necesară pentru funcția de calendar solicitată, în special între Google Calendar și aplicație, precum și către furnizori tehnici necesari, cum ar fi furnizori de găzduire sau baze de date.",
  },
},
{
  kind: "h3",
  content: {
    DE: "e) Widerruf und Trennung der Verbindung",
    EN: "e) Revocation and disconnection",
    IT: "e) Revoca e disconnessione",
    TR: "e) İptal ve bağlantının kesilmesi",
    SQ: "e) Revokimi dhe shkëputja e lidhjes",
    KU: "e) Paşvekişandin û qutkirina girêdanê",
    RO: "e) Revocare și deconectare",
  },
},
{
  kind: "p",
  content: {
    DE: "Der Nutzer kann die Verbindung zu Google Calendar widerrufen, indem er die Verbindung in der App trennt oder den Zugriff über sein Google-Konto entfernt.",
    EN: "The user may revoke the connection to Google Calendar by disconnecting the connection in the app or removing access through their Google account.",
    IT: "L’utente può revocare la connessione a Google Calendar disconnettendo la connessione nell’app oppure rimuovendo l’accesso tramite il proprio account Google.",
    TR: "Kullanıcı, uygulamadaki bağlantıyı keserek veya Google hesabı üzerinden erişimi kaldırarak Google Calendar bağlantısını iptal edebilir.",
    SQ: "Përdoruesi mund ta revokojë lidhjen me Google Calendar duke e shkëputur lidhjen në aplikacion ose duke hequr qasjen përmes llogarisë së tij Google.",
    KU: "Bikarhêner dikare girêdana bi Google Calendar re paşve bikişîne bi qutkirina girêdanê di sepanê de an bi rakirina gihîştinê di hesabê xwe yê Google de.",
    RO: "Utilizatorul poate revoca conexiunea la Google Calendar prin deconectarea conexiunii în aplicație sau prin eliminarea accesului din contul său Google.",
  },
},
{
  kind: "h3",
  content: {
    DE: "f) Einhaltung der Google API Services User Data Policy",
    EN: "f) Compliance with the Google API Services User Data Policy",
    IT: "f) Rispetto della Google API Services User Data Policy",
    TR: "f) Google API Services User Data Policy’ye uyum",
    SQ: "f) Pajtueshmëria me Google API Services User Data Policy",
    KU: "f) Guncawbûna bi Google API Services User Data Policy re",
    RO: "f) Respectarea Google API Services User Data Policy",
  },
},
{
  kind: "p",
  content: {
    DE: "Die Nutzung und Übertragung von Informationen, die über Google APIs erhalten werden, erfolgt in Übereinstimmung mit der Google API Services User Data Policy, einschließlich der Anforderungen zur eingeschränkten Nutzung.",
    EN: "The use and transfer of information received from Google APIs complies with the Google API Services User Data Policy, including the Limited Use requirements.",
    IT: "L’utilizzo e il trasferimento delle informazioni ricevute dalle API di Google avvengono in conformità con la Google API Services User Data Policy, inclusi i requisiti di Limited Use.",
    TR: "Google API’lerinden alınan bilgilerin kullanımı ve aktarımı, Limited Use gereklilikleri dahil olmak üzere Google API Services User Data Policy’ye uygun olarak gerçekleşir.",
    SQ: "Përdorimi dhe transferimi i informacionit të marrë nga Google APIs bëhet në përputhje me Google API Services User Data Policy, përfshirë kërkesat e Limited Use.",
    KU: "Bikaranîn û veguhastina agahiyên ku ji Google APIs tên wergirtin li gorî Google API Services User Data Policy pêk tê, tevî daxwazên Limited Use.",
    RO: "Utilizarea și transferul informațiilor primite prin Google APIs se realizează în conformitate cu Google API Services User Data Policy, inclusiv cerințele Limited Use.",
  },
},
{
  kind: "h2",
  content: {
    DE: "10. Weitergabe von Daten",
    EN: "10. Disclosure of data",
    IT: "10. Comunicazione dei dati",
    TR: "10. Verilerin paylaşılması",
    SQ: "10. Dhënia e të dhënave",
    KU: "10. Parvekirina daneyan",
    RO: "10. Divulgarea datelor",
  },
},
{
  kind: "p",
  content: {
    DE: "Eine Weitergabe personenbezogener Daten erfolgt nicht an unbeteiligte Dritte und nicht zu Werbezwecken. Eine Weitergabe oder Übertragung kann jedoch erfolgen, soweit dies für den Betrieb der App oder die vom Nutzer aktivierten Funktionen erforderlich ist. Dazu gehören insbesondere Hosting- und Datenbankdienste, Google Calendar bei aktivierter Integration sowie technische Dienstleister für Speicherung, Sicherheit, Benachrichtigungen oder Synchronisation.",
    EN: "Personal data is not disclosed to unrelated third parties and not for advertising purposes. However, disclosure or transfer may take place where required for operating the app or for functions activated by the user. This includes in particular hosting and database services, Google Calendar if the integration is enabled, and technical service providers for storage, security, notifications or synchronization.",
    IT: "I dati personali non vengono comunicati a terzi non coinvolti e non per finalità pubblicitarie. Tuttavia, la comunicazione o il trasferimento possono avvenire se necessari per il funzionamento dell’app o per le funzioni attivate dall’utente. Ciò include in particolare servizi di hosting e database, Google Calendar se l’integrazione è attivata e fornitori tecnici per archiviazione, sicurezza, notifiche o sincronizzazione.",
    TR: "Kişisel veriler ilgisiz üçüncü taraflara ve reklam amaçlarıyla aktarılmaz. Ancak uygulamanın işletilmesi veya kullanıcı tarafından etkinleştirilen işlevler için gerekli olduğunda paylaşım veya aktarım gerçekleşebilir. Bunlara özellikle barındırma ve veritabanı hizmetleri, entegrasyon etkinse Google Calendar ve depolama, güvenlik, bildirimler veya senkronizasyon için teknik hizmet sağlayıcılar dahildir.",
    SQ: "Të dhënat personale nuk u jepen palëve të treta të papërfshira dhe jo për qëllime reklamimi. Megjithatë, dhënia ose transferimi mund të ndodhë nëse është i nevojshëm për funksionimin e aplikacionit ose për funksionet e aktivizuara nga përdoruesi. Kjo përfshin veçanërisht shërbime hostimi dhe baze të dhënash, Google Calendar nëse integrimi është aktivizuar, si dhe ofrues teknikë për ruajtje, siguri, njoftime ose sinkronizim.",
    KU: "Daneyên kesane ji aliyên sêyem ên têkildar nebûne re û ne ji bo armancên reklamê nayên dayîn. Lê parvekirin an veguhastin dikare pêk were heke ji bo xebitandina sepanê an fonksiyonên ku bikarhêner çalak kiriye pêdivî be. Ev bi taybetî xizmetên hosting û danegehê, Google Calendar heke entegrasyon çalak be, û peydakirinên teknîkî ji bo tomarkirin, ewlehî, agahdarî an hevdemkirinê dihewîne.",
    RO: "Datele personale nu sunt divulgate unor terți neimplicați și nu în scopuri publicitare. Totuși, divulgarea sau transferul poate avea loc dacă este necesar pentru operarea aplicației sau pentru funcțiile activate de utilizator. Acestea includ în special servicii de găzduire și baze de date, Google Calendar dacă integrarea este activată și furnizori tehnici pentru stocare, securitate, notificări sau sincronizare.",
  },
},
{
  kind: "h2",
  content: {
    DE: "11. Sicherheit",
    EN: "11. Security",
    IT: "11. Sicurezza",
    TR: "11. Güvenlik",
    SQ: "11. Siguria",
    KU: "11. Ewlehî",
    RO: "11. Securitate",
  },
},
{
  kind: "p",
  content: {
    DE: "Die Daten werden durch geeignete technische Maßnahmen geschützt:",
    EN: "The data is protected through appropriate technical measures:",
    IT: "I dati sono protetti mediante adeguate misure tecniche:",
    TR: "Veriler uygun teknik önlemlerle korunur:",
    SQ: "Të dhënat mbrohen përmes masave teknike të përshtatshme:",
    KU: "Dane bi rêbazên teknîkî yên guncaw tên parastin:",
    RO: "Datele sunt protejate prin măsuri tehnice adecvate:",
  },
},
{
  kind: "ul",
  items: [
    {
      DE: "Verschlüsselte Speicherung von Passwörtern",
      EN: "Encrypted password storage",
      IT: "Conservazione crittografata delle password",
      TR: "Parolaların şifreli saklanması",
      SQ: "Ruajtje e enkriptuar e fjalëkalimeve",
      KU: "Tomarkirina şîfreyan a şîfrekirî",
      RO: "Stocare criptată a parolelor",
    },
    {
      DE: "Zugriffsbeschränkungen (Admin / Mitarbeiter)",
      EN: "Access restrictions (Admin / Employee)",
      IT: "Limitazioni di accesso (Admin / Dipendente)",
      TR: "Erişim kısıtlamaları (Yönetici / Çalışan)",
      SQ: "Kufizime të qasjes (Admin / Punonjës)",
      KU: "Sînorkirina gihîştinê (Rêvebir / Karmend)",
      RO: "Restricții de acces (Admin / Angajat)",
    },
    {
      DE: "Serverseitige Validierung",
      EN: "Server-side validation",
      IT: "Validazione lato server",
      TR: "Sunucu taraflı doğrulama",
      SQ: "Validim nga ana e serverit",
      KU: "Piştrastkirina aliyê serverê",
      RO: "Validare pe partea de server",
    },
  ],
},
{
  kind: "h2",
  content: {
    DE: "12. Rechte der Nutzer",
    EN: "12. Rights of users",
    IT: "12. Diritti degli utenti",
    TR: "12. Kullanıcı hakları",
    SQ: "12. Të drejtat e përdoruesve",
    KU: "12. Mafên bikarhêneran",
    RO: "12. Drepturile utilizatorilor",
  },
},
{
  kind: "p",
  content: {
    DE: "Nutzer haben das Recht auf:",
    EN: "Users have the right to:",
    IT: "Gli utenti hanno diritto a:",
    TR: "Kullanıcılar şu haklara sahiptir:",
    SQ: "Përdoruesit kanë të drejtë për:",
    KU: "Bikarhêneran mafê van hene:",
    RO: "Utilizatorii au dreptul la:",
  },
},
{
  kind: "ul",
  items: [
    {
      DE: "Auskunft",
      EN: "Access",
      IT: "Accesso",
      TR: "Bilgi alma",
      SQ: "Qasje",
      KU: "Agahî bistînin",
      RO: "Acces",
    },
    {
      DE: "Berichtigung",
      EN: "Rectification",
      IT: "Rettifica",
      TR: "Düzeltme",
      SQ: "Korrigjim",
      KU: "Rastkirin",
      RO: "Rectificare",
    },
    {
      DE: "Löschung",
      EN: "Erasure",
      IT: "Cancellazione",
      TR: "Silme",
      SQ: "Fshirje",
      KU: "Jêbirin",
      RO: "Ștergere",
    },
    {
      DE: "Einschränkung der Verarbeitung",
      EN: "Restriction of processing",
      IT: "Limitazione del trattamento",
      TR: "İşlemenin kısıtlanması",
      SQ: "Kufizim i përpunimit",
      KU: "Sînorkirina pêvajoyê",
      RO: "Restricționarea prelucrării",
    },
    {
      DE: "Datenübertragbarkeit",
      EN: "Data portability",
      IT: "Portabilità dei dati",
      TR: "Veri taşınabilirliği",
      SQ: "Transportueshmëri e të dhënave",
      KU: "Veguhastina daneyan",
      RO: "Portabilitatea datelor",
    },
  ],
},
{
  kind: "h2",
  content: {
    DE: "13. Kontakt",
    EN: "13. Contact",
    IT: "13. Contatto",
    TR: "13. İletişim",
    SQ: "13. Kontakti",
    KU: "13. Têkilî",
    RO: "13. Contact",
  },
},
{
  kind: "p",
  content: {
    DE: "Bei Fragen zum Datenschutz:\nsabrinak2004@gmail.com",
    EN: "For privacy-related questions:\nsabrinak2004@gmail.com",
    IT: "Per domande sulla privacy:\nsabrinak2004@gmail.com",
    TR: "Gizlilikle ilgili sorular için:\nsabrinak2004@gmail.com",
    SQ: "Për pyetje rreth privatësisë:\nsabrinak2004@gmail.com",
    KU: "Ji bo pirsên derbarê nepenîtiyê:\nsabrinak2004@gmail.com",
    RO: "Pentru întrebări legate de confidențialitate:\nsabrinak2004@gmail.com",
  },
},
  ];

const TERMS_BLOCKS: LegalBlock[] = [
  {
    kind: "h2",
    content: {
      DE: "1. Geltungsbereich",
      EN: "1. Scope",
      IT: "1. Ambito di applicazione",
      TR: "1. Kapsam",
      SQ: "1. Fusha e zbatimit",
      KU: "1. Qada sepandinê",
      RO: "1. Domeniu de aplicare",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Diese Nutzungsbedingungen gelten für die Nutzung der Webanwendung „saleo.app“.",
      EN: "These terms of use apply to the use of the web application “saleo.app”.",
      IT: "Le presenti condizioni d’uso si applicano all’utilizzo dell’applicazione web “saleo.app”.",
      TR: "Bu kullanım koşulları, “saleo.app” web uygulamasının kullanımını kapsar.",
      SQ: "Këto kushte përdorimi vlejnë për përdorimin e aplikacionit web “saleo.app”.",
      KU: "Ev mercên bikaranînê ji bo bikaranîna sepanê ya webê “saleo.app” derbasdar in.",
      RO: "Acești termeni de utilizare se aplică utilizării aplicației web “saleo.app”.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "2. Leistungsbeschreibung",
      EN: "2. Description of services",
      IT: "2. Descrizione dei servizi",
      TR: "2. Hizmet açıklaması",
      SQ: "2. Përshkrimi i shërbimeve",
      KU: "2. Danasîna xizmetan",
      RO: "2. Descrierea serviciilor",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die App dient zur:",
      EN: "The app is used for:",
      IT: "L’app serve a:",
      TR: "Uygulama şu amaçlarla kullanılır:",
      SQ: "Aplikacioni shërben për:",
      KU: "Sepan ji bo van armancan tê bikaranîn:",
      RO: "Aplicația este utilizată pentru:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Erfassung von Arbeitszeiten",
        EN: "Recording working times",
        IT: "Registrazione degli orari di lavoro",
        TR: "Çalışma sürelerinin kaydı",
        SQ: "Regjistrimin e orarit të punës",
        KU: "Tomarkirina demjimêrên karê",
        RO: "Înregistrarea timpului de lucru",
      },
      {
        DE: "Verwaltung von Mitarbeitern",
        EN: "Managing employees",
        IT: "Gestione dei dipendenti",
        TR: "Çalışanların yönetimi",
        SQ: "Menaxhimin e punonjësve",
        KU: "Rêveberiya karmendan",
        RO: "Gestionarea angajaților",
      },
      {
        DE: "Planung von Einsätzen",
        EN: "Planning assignments",
        IT: "Pianificazione degli impieghi",
        TR: "Görev planlaması",
        SQ: "Planifikimin e angazhimeve",
        KU: "Planandina cihgirtinan",
        RO: "Planificarea sarcinilor",
      },
      {
        DE: "Verwaltung von Abwesenheiten",
        EN: "Managing absences",
        IT: "Gestione delle assenze",
        TR: "Devamsızlıkların yönetimi",
        SQ: "Menaxhimin e mungesave",
        KU: "Rêveberiya nebûnê",
        RO: "Gestionarea absențelor",
      },
      {
        DE: "Aufgaben- und Kommunikationssystem",
        EN: "Task and communication system",
        IT: "Sistema di attività e comunicazione",
        TR: "Görev ve iletişim sistemi",
        SQ: "Sistem detyrash dhe komunikimi",
        KU: "Pergala erk û têkiliyê",
        RO: "Sistem de sarcini și comunicare",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "3. Nutzerrollen",
      EN: "3. User roles",
      IT: "3. Ruoli utente",
      TR: "3. Kullanıcı rolleri",
      SQ: "3. Rolet e përdoruesve",
      KU: "3. Rolên bikarhêneran",
      RO: "3. Roluri de utilizator",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die App unterscheidet:",
      EN: "The app distinguishes between:",
      IT: "L’app distingue tra:",
      TR: "Uygulama şu rolleri ayırır:",
      SQ: "Aplikacioni dallon:",
      KU: "Sepan van rolan ji hev dide:",
      RO: "Aplicația face distincție între:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Mitarbeiter",
        EN: "Employees",
        IT: "Dipendenti",
        TR: "Çalışanlar",
        SQ: "Punonjës",
        KU: "Karmend",
        RO: "Angajați",
      },
      {
        DE: "Administratoren",
        EN: "Administrators",
        IT: "Amministratori",
        TR: "Yöneticiler",
        SQ: "Administratorë",
        KU: "Rêvebir",
        RO: "Administratori",
      },
    ],
  },
  {
    kind: "p",
    content: {
      DE: "Administratoren haben erweiterte Rechte, z. B. Bearbeiten, Löschen und Genehmigen.",
      EN: "Administrators have extended rights, for example editing, deleting, and approving.",
      IT: "Gli amministratori hanno diritti estesi, ad esempio modifica, eliminazione e approvazione.",
      TR: "Yöneticiler; düzenleme, silme ve onaylama gibi genişletilmiş haklara sahiptir.",
      SQ: "Administratorët kanë të drejta të zgjeruara, për shembull redaktim, fshirje dhe miratim.",
      KU: "Rêvebiran mafên berfirehtir hene, mînak sererastkirin, jêbirin û pejirandin.",
      RO: "Administratorii au drepturi extinse, de exemplu editare, ștergere și aprobare.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "4. Pflichten der Nutzer",
      EN: "4. User obligations",
      IT: "4. Obblighi degli utenti",
      TR: "4. Kullanıcı yükümlülükleri",
      SQ: "4. Detyrimet e përdoruesve",
      KU: "4. Erkên bikarhêneran",
      RO: "4. Obligațiile utilizatorilor",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Mitarbeiter müssen:",
      EN: "Employees must:",
      IT: "I dipendenti devono:",
      TR: "Çalışanlar şunları yapmalıdır:",
      SQ: "Punonjësit duhet:",
      KU: "Karmendan divê:",
      RO: "Angajații trebuie să:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "korrekte Arbeitszeiten eintragen",
        EN: "enter correct working times",
        IT: "inserire correttamente gli orari di lavoro",
        TR: "doğru çalışma saatlerini girmek",
        SQ: "të regjistrojnë saktë orarin e punës",
        KU: "demjimêrên karê rast binivîsin",
        RO: "introduceți corect orele de lucru",
      },
      {
        DE: "Einträge zeitnah erfassen",
        EN: "record entries promptly",
        IT: "registrare le voci tempestivamente",
        TR: "kayıtları zamanında girmek",
        SQ: "t’i regjistrojnë hyrjet në kohë",
        KU: "tomaran di wextê xwe de bikin",
        RO: "înregistrați intrările prompt",
      },
      {
        DE: "bei fehlenden Einträgen ggf. Nachtragsanträge stellen",
        EN: "submit correction requests if entries are missing",
        IT: "presentare richieste di correzione in caso di voci mancanti",
        TR: "eksik kayıtlar varsa gerekirse düzeltme talebi oluşturmak",
        SQ: "nëse mungojnë hyrje, të bëjnë kërkesa korrigjimi",
        KU: "heke tomar kêm be, daxwaza rastkirinê bikin",
        RO: "trimiteți cereri de corecție dacă intrările lipsesc",
      },
    ],
  },
  {
    kind: "p",
    content: {
      DE: "Administratoren dürfen:",
      EN: "Administrators may:",
      IT: "Gli amministratori possono:",
      TR: "Yöneticiler şunları yapabilir:",
      SQ: "Administratorët mund të:",
      KU: "Rêvebiran dikarin:",
      RO: "Administratorii pot:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Daten verwalten",
        EN: "manage data",
        IT: "gestire i dati",
        TR: "verileri yönetmek",
        SQ: "menaxhojnë të dhënat",
        KU: "danean bi rê ve bibin",
        RO: "gestionați datele",
      },
      {
        DE: "Anträge genehmigen oder ablehnen",
        EN: "approve or reject requests",
        IT: "approvare o rifiutare richieste",
        TR: "talepleri onaylamak veya reddetmek",
        SQ: "miratojnë ose refuzojnë kërkesa",
        KU: "daxwazan pejirînin an red bikin",
        RO: "aprobați sau respingeți cererile",
      },
      {
        DE: "Aufgaben erstellen",
        EN: "create tasks",
        IT: "creare attività",
        TR: "görev oluşturmak",
        SQ: "krijojnë detyra",
        KU: "erkan biafirînin",
        RO: "creați sarcini",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "5. Verfügbarkeit",
      EN: "5. Availability",
      IT: "5. Disponibilità",
      TR: "5. Kullanılabilirlik",
      SQ: "5. Disponueshmëria",
      KU: "5. Amadeyî",
      RO: "5. Disponibilitate",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die App wird bestmöglich verfügbar gehalten, jedoch ohne Garantie auf permanente Verfügbarkeit.",
      EN: "The app is kept available as best as possible, but without any guarantee of permanent availability.",
      IT: "L’app viene mantenuta disponibile nel miglior modo possibile, ma senza garanzia di disponibilità permanente.",
      TR: "Uygulama mümkün olan en yüksek erişilebilirlikle sunulur, ancak sürekli erişilebilirlik garanti edilmez.",
      SQ: "Aplikacioni mbahet sa më i disponueshëm që të jetë e mundur, por pa garanci për disponueshmëri të përhershme.",
      KU: "Sepan bi qasî ku pêkan be amade tê girtin, lê bê garantiya amadeya domdar.",
      RO: "Aplicația este menținută disponibilă cât mai bine posibil, dar fără nicio garanție de disponibilitate permanentă.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "6. Haftung",
      EN: "6. Liability",
      IT: "6. Responsabilità",
      TR: "6. Sorumluluk",
      SQ: "6. Përgjegjësia",
      KU: "6. Berpirsyarî",
      RO: "6. Răspundere",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Der Betreiber haftet nur für:",
      EN: "The operator is liable only for:",
      IT: "Il gestore risponde solo per:",
      TR: "İşletmeci yalnızca şu durumlarda sorumludur:",
      SQ: "Operatori mban përgjegjësi vetëm për:",
      KU: "Xwediyê pergalê tenê ji bo van berpirsyar e:",
      RO: "Operatorul este răspunzător doar pentru:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Vorsatz",
        EN: "intent",
        IT: "dolo",
        TR: "kasıt",
        SQ: "qëllim",
        KU: "qest",
        RO: "intenție",
      },
      {
        DE: "grobe Fahrlässigkeit",
        EN: "gross negligence",
        IT: "colpa grave",
        TR: "ağır ihmal",
        SQ: "pakujdesi e rëndë",
        KU: "xemsariya giran",
        RO: "neglijență gravă",
      },
    ],
  },
  {
    kind: "p",
    content: {
      DE: "Keine Haftung besteht für:",
      EN: "No liability is assumed for:",
      IT: "Non si assume alcuna responsabilità per:",
      TR: "Şu durumlar için sorumluluk kabul edilmez:",
      SQ: "Nuk ka përgjegjësi për:",
      KU: "Ji bo van ti berpirsyarî tune ye:",
      RO: "Nu se asumă nicio răspundere pentru:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "falsche Eingaben durch Nutzer",
        EN: "incorrect entries made by users",
        IT: "inserimenti errati da parte degli utenti",
        TR: "kullanıcıların yanlış girişleri",
        SQ: "hyrje të pasakta nga përdoruesit",
        KU: "têketinên şaş yên bikarhêneran",
        RO: "intrări incorecte făcute de utilizatori",
      },
      {
        DE: "Datenverlust außerhalb des Einflussbereichs",
        EN: "data loss outside the sphere of influence",
        IT: "perdita di dati al di fuori della sfera di influenza",
        TR: "kontrol alanı dışındaki veri kaybı",
        SQ: "humbje të dhënash jashtë zonës së ndikimit",
        KU: "windabûna daneyan li derveyî qada kontrolê",
        RO: "pierdere de date în afara sferei de influență",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "7. Nutzungseinschränkungen",
      EN: "7. Restrictions of use",
      IT: "7. Limitazioni d’uso",
      TR: "7. Kullanım kısıtlamaları",
      SQ: "7. Kufizimet e përdorimit",
      KU: "7. Sînorkirinên bikaranînê",
      RO: "7. Restricții de utilizare",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Es ist untersagt:",
      EN: "It is prohibited to:",
      IT: "È vietato:",
      TR: "Şunlar yasaktır:",
      SQ: "Ndalohet:",
      KU: "Qedexe ye:",
      RO: "Este interzis să:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "falsche Daten einzugeben",
        EN: "enter false data",
        IT: "inserire dati falsi",
        TR: "yanlış veri girmek",
        SQ: "të futen të dhëna të rreme",
        KU: "dane şaş têkevin",
        RO: "introduceți date false",
      },
      {
        DE: "unbefugten Zugriff zu versuchen",
        EN: "attempt unauthorized access",
        IT: "tentare accessi non autorizzati",
        TR: "yetkisiz erişim girişiminde bulunmak",
        SQ: "të tentohet qasje e paautorizuar",
        KU: "hewldana gihîştina bêdestûr",
        RO: "încercați acces neautorizat",
      },
      {
        DE: "die App missbräuchlich zu verwenden",
        EN: "misuse the app",
        IT: "utilizzare impropriamente l’app",
        TR: "uygulamayı kötüye kullanmak",
        SQ: "të keqpërdoret aplikacioni",
        KU: "sepana bi awayekî xerab bikar bîne",
        RO: "abuzarea de aplicație",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "8. Dokumente und Inhalte",
      EN: "8. Documents and content",
      IT: "8. Documenti e contenuti",
      TR: "8. Belgeler ve içerikler",
      SQ: "8. Dokumentet dhe përmbajtja",
      KU: "8. Belge û naverok",
      RO: "8. Documente și conținut",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Hochgeladene Dokumente dürfen:",
      EN: "Uploaded documents may:",
      IT: "I documenti caricati devono:",
      TR: "Yüklenen belgeler:",
      SQ: "Dokumentet e ngarkuara duhet:",
      KU: "Belgeyên barkirî divê:",
      RO: "Documentele încărcate trebuie să:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "keine rechtswidrigen Inhalte enthalten",
        EN: "not contain unlawful content",
        IT: "non contenere contenuti illeciti",
        TR: "hukuka aykırı içerik barındırmamalıdır",
        SQ: "të mos përmbajnë përmbajtje të paligjshme",
        KU: "naveroka neqanûnî nebin",
        RO: "să nu conțină conținut ilegal",
      },
      {
        DE: "nur für betriebliche Zwecke genutzt werden",
        EN: "be used only for business purposes",
        IT: "essere utilizzati solo per scopi aziendali",
        TR: "yalnızca iş amaçlı kullanılmalıdır",
        SQ: "të përdoren vetëm për qëllime të biznesit",
        KU: "tenê ji bo armancên karî werin bikaranîn",
        RO: "să fie folosite doar în scopuri de afaceri",
      },
    ],
  },
  {
    kind: "h2",
    content: {
      DE: "9. Kündigung / Zugang",
      EN: "9. Termination / Access",
      IT: "9. Recesso / Accesso",
      TR: "9. Fesih / Erişim",
      SQ: "9. Ndërprerja / Qasja",
      KU: "9. Betalkirin / Gihîştin",
      RO: "9. Reziliere / Acces",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Der Zugang kann durch den Betreiber oder Administrator jederzeit deaktiviert werden.",
      EN: "Access may be deactivated at any time by the operator or administrator.",
      IT: "L’accesso può essere disattivato in qualsiasi momento dal gestore o dall’amministratore.",
      TR: "Erişim, işletmeci veya yönetici tarafından her zaman devre dışı bırakılabilir.",
      SQ: "Qasja mund të çaktivizohet në çdo kohë nga operatori ose administratori.",
      KU: "Gihîştin dikare her dem ji aliyê xwedî pergalê an rêvebir ve were neçalakirin.",
      RO: "Accesul poate fi dezactivat în orice moment de către operator sau administrator.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "10. Änderungen",
      EN: "10. Changes",
      IT: "10. Modifiche",
      TR: "10. Değişiklikler",
      SQ: "10. Ndryshime",
      KU: "10. Guhertin",
      RO: "10. Modificări",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Die Nutzungsbedingungen können jederzeit angepasst werden.",
      EN: "The terms of use may be amended at any time.",
      IT: "I termini di utilizzo possono essere modificati in qualsiasi momento.",
      TR: "Kullanım koşulları her zaman değiştirilebilir.",
      SQ: "Kushtet e përdorimit mund të ndryshohen në çdo kohë.",
      KU: "Mercên bikaranînê dikarin her dem werin guhertin.",
      RO: "Termenii de utilizare pot fi modificați în orice moment.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "11. Anwendbares Recht",
      EN: "11. Applicable law",
      IT: "11. Legge applicabile",
      TR: "11. Uygulanacak hukuk",
      SQ: "11. Ligji i zbatueshëm",
      KU: "11. Hiqûqa tên sepandin",
      RO: "11. Legea aplicabilă",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Es gilt deutsches Recht.",
      EN: "German law applies.",
      IT: "Si applica il diritto tedesco.",
      TR: "Alman hukuku uygulanır.",
      SQ: "Zbatohet ligji gjerman.",
      KU: "Hiqûqa Alman tê sepandin.",
      RO: "Se aplică legea germană.",
    },
  },
];

function renderMultilineText(text: string): React.ReactNode {
  const lines = text.split("\n");

  return lines.map((line, index) => (
    <React.Fragment key={`${line}-${index}`}>
      {index > 0 ? <br /> : null}
      {line}
    </React.Fragment>
  ));
}

export default function LegalContent({
  type,
  initialLanguage,
}: LegalContentProps): React.ReactElement {
  const [language, setLanguage] = useState<AppUiLanguage>(initialLanguage);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    const nextLanguage = normalizeAppUiLanguage(readPublicLanguage());
    setLanguage(nextLanguage);
  }, []);

  const blocks = useMemo(() => {
    return type === "privacy" ? PRIVACY_BLOCKS : TERMS_BLOCKS;
  }, [type]);

  const title =
    type === "privacy"
      ? translate(language, "privacyTitle", LEGAL_UI_TEXTS)
      : translate(language, "termsTitle", LEGAL_UI_TEXTS);

  const updated =
    type === "privacy"
      ? translate(language, "privacyUpdated", LEGAL_UI_TEXTS)
      : translate(language, "termsUpdated", LEGAL_UI_TEXTS);

  return (
    <>
      <h1 className="legal-page-title">{title}</h1>

      <div className="legal-page-updated">{updated}</div>

      <div className="legal-page-content">
        {blocks.map((block, index) => {
          if (block.kind === "h2") {
            return <h2 key={index}>{block.content[language]}</h2>;
          }

          if (block.kind === "h3") {
            return <h3 key={index}>{block.content[language]}</h3>;
          }

          if (block.kind === "p") {
            return <p key={index}>{renderMultilineText(block.content[language])}</p>;
          }

          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item[language]}</li>
              ))}
            </ul>
          );
        })}
      </div>
    </>
  );
}
