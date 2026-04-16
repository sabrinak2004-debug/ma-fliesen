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
      DE: "d) Organisations- und Planungsdaten",
      EN: "d) Organization and planning data",
      IT: "d) Dati organizzativi e di pianificazione",
      TR: "d) Organizasyon ve planlama verileri",
      SQ: "d) Të dhëna organizimi dhe planifikimi",
      KU: "d) Daneyên rêxistin û planê",
      RO: "d) Date de organizare și planificare",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "Kalendereinträge",
        EN: "Calendar entries",
        IT: "Voci di calendario",
        TR: "Takvim kayıtları",
        SQ: "Regjistrime kalendari",
        KU: "Tomarên salnameyê",
        RO: "Intrări de calendar",
      },
      {
        DE: "Termine (inkl. Google Calendar Integration, falls aktiviert)",
        EN: "Appointments (including Google Calendar integration, if enabled)",
        IT: "Appuntamenti (incl. integrazione Google Calendar, se attivata)",
        TR: "Randevular (etkinse Google Calendar entegrasyonu dahil)",
        SQ: "Takime (përfshirë integrimin me Google Calendar, nëse aktivizohet)",
        KU: "Civîn (tevî entegrasyona Google Calendar, heke çalak be)",
        RO: "Programări (inclusiv integrare Google Calendar, dacă este activată)",
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
      DE: "Daten werden gespeichert, solange:",
      EN: "Data is stored as long as:",
      IT: "I dati vengono conservati finché:",
      TR: "Veriler şu süre boyunca saklanır:",
      SQ: "Të dhënat ruhen për aq kohë sa:",
      KU: "Dane heta vê demê tên tomarkirin:",
      RO: "Datele sunt stocate atât timp cât:",
    },
  },
  {
    kind: "ul",
    items: [
      {
        DE: "ein aktives Nutzerverhältnis besteht",
        EN: "an active user relationship exists",
        IT: "esiste un rapporto utente attivo",
        TR: "aktif bir kullanıcı ilişkisi mevcutsa",
        SQ: "ekziston një marrëdhënie aktive përdoruesi",
        KU: "têkiliyek bikarhênerê çalak hebe",
        RO: "există o relație activă cu utilizatorul",
      },
      {
        DE: "oder gesetzliche Aufbewahrungspflichten vorliegen",
        EN: "or legal retention obligations apply",
        IT: "oppure sussistono obblighi legali di conservazione",
        TR: "veya yasal saklama yükümlülükleri varsa",
        SQ: "ose ekzistojnë detyrime ligjore ruajtjeje",
        KU: "an jî berpirsiyarîyên qanûnî yên tomarkirinê hebe",
        RO: "sau există obligații legale de păstrare",
      },
    ],
  },
  {
    kind: "p",
    content: {
      DE: "Danach werden sie gelöscht.",
      EN: "After that, they are deleted.",
      IT: "Successivamente vengono cancellati.",
      TR: "Daha sonra silinirler.",
      SQ: "Pas kësaj fshihen.",
      KU: "Piştî wê têne jêbirin.",
      RO: "După aceea, acestea sunt șterse.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "9. Weitergabe von Daten",
      EN: "9. Disclosure of data",
      IT: "9. Comunicazione dei dati",
      TR: "9. Verilerin paylaşılması",
      SQ: "9. Dhënia e të dhënave",
      KU: "9. Parvekirina daneyan",
      RO: "9. Divulgarea datelor",
    },
  },
  {
    kind: "p",
    content: {
      DE: "Es erfolgt keine Weitergabe an Dritte, außer an technisch notwendige Dienste, z. B. Hosting, oder an die optionale Google Calendar Integration bei Aktivierung.",
      EN: "No data is disclosed to third parties except to technically necessary services, such as hosting, or to the optional Google Calendar integration if activated.",
      IT: "I dati non vengono comunicati a terzi, salvo ai servizi tecnicamente necessari, ad esempio hosting, o all’integrazione opzionale con Google Calendar se attivata.",
      TR: "Veriler, barındırma gibi teknik olarak gerekli hizmetler veya etkinleştirilmişse isteğe bağlı Google Calendar entegrasyonu dışında üçüncü taraflara aktarılmaz.",
      SQ: "Nuk bëhet dhënie e të dhënave te palë të treta, përveç shërbimeve teknikisht të nevojshme, si hostimi, ose integrimit opsional me Google Calendar nëse aktivizohet.",
      KU: "Dane ji bilî xizmetên ji aliyê teknîkî ve pêdivî, mînak hosting, an jî entegrasyona vebijarkî ya Google Calendar heke çalak be, ji aliyên sêyem re nayên dayîn.",
      RO: "Nu se divulgă date către terți, cu excepția serviciilor tehnic necesare, cum ar fi găzduirea, sau a integrării opționale cu Google Calendar dacă este activată.",
    },
  },
  {
    kind: "h2",
    content: {
      DE: "10. Sicherheit",
      EN: "10. Security",
      IT: "10. Sicurezza",
      TR: "10. Güvenlik",
      SQ: "10. Siguria",
      KU: "10. Ewlehî",
      RO: "10. Securitate",
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
      DE: "11. Rechte der Nutzer",
      EN: "11. Rights of users",
      IT: "11. Diritti degli utenti",
      TR: "11. Kullanıcı hakları",
      SQ: "11. Të drejtat e përdoruesve",
      KU: "11. Mafên bikarhêneran",
      RO: "11. Drepturile utilizatorilor",
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
      DE: "12. Kontakt",
      EN: "12. Contact",
      IT: "12. Contatto",
      TR: "12. İletişim",
      SQ: "12. Kontakti",
      KU: "12. Têkilî",
      RO: "12. Contact",
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