"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { translate, type AppUiLanguage } from "@/lib/i18n";

type TaskStatus = "OPEN" | "COMPLETED";
type TaskCategory = "WORK_TIME" | "VACATION" | "SICKNESS" | "GENERAL";
type TaskRequiredAction =
  | "NONE"
  | "WORK_ENTRY_FOR_DATE"
  | "VACATION_ENTRY_FOR_DATE"
  | "SICK_ENTRY_FOR_DATE"
  | "CONFIRM_MONTHLY_WORK_ENTRIES";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  requiredAction: TaskRequiredAction;
  referenceDate: string | null;
  referenceStartDate: string | null;
  referenceEndDate: string | null;
  completedAt: string | null;
  completionNote: string | null;
  createdAt: string;
  createdByUser: {
    id: string;
    fullName: string;
  };
  completedByUser: {
    id: string;
    fullName: string;
  } | null;
};

type MissingWorkEntryAlert = {
  count: number;
  oldestMissingDate: string;
  newestMissingDate: string;
};

type TasksApiResponse = {
  tasks: TaskRow[];
  missingWorkEntryAlert?: MissingWorkEntryAlert | null;
};

type CategoryGroupKey = "WORK_TIME" | "VACATION" | "SICKNESS" | "GENERAL";

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

type AufgabenTextKey =
  | "dashLabel"
  | "tasksLoadFailed"
  | "unexpectedServerResponse"
  | "networkLoadError"
  | "taskCompleteFailed"
  | "taskCompletedSuccess"
  | "networkCompleteError"
  | "noDate"
  | "until"
  | "categoryWorkTime"
  | "categoryVacation"
  | "categorySickness"
  | "categoryGeneral"
  | "requiredNone"
  | "requiredWorkTime"
  | "requiredVacation"
  | "requiredSickness"
  | "requiredMonthlyWorkConfirmation"
  | "taskActionWorkTime"
  | "taskActionVacation"
  | "taskActionSickness"
  | "taskActionMonthlyWorkConfirmation"
  | "taskActionNone"
  | "openCapture"
  | "openMonthlyConfirmation"
  | "openVacation"
  | "openSickness"
  | "openGeneric"
  | "checking"
  | "done"
  | "missingEntriesDays"
  | "missingEntriesUntilToday"
  | "tapForDetails"
  | "todo"
  | "todoHint"
  | "loading"
  | "noOpenTasks"
  | "noOpenTasksInCategory"
  | "completedTasks"
  | "noCompletedTasks"
  | "required"
  | "referencePeriod"
  | "createdBy"
  | "completedOn"
  | "missingEntries"
  | "missingEntriesRange"
  | "missingEntriesModalHint"
  | "goToCapture"
  | "close"
  | "generalTaskCompletionNoteTitle"
  | "generalTaskCompletionNoteHint"
  | "completionNoteLabel"
  | "completionNotePlaceholder"
  | "completeWithoutNote"
  | "completeWithNote"
  | "completionNote"
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
  | "systemTaskWorkTimeSingleTitle"
  | "systemTaskWorkTimeMultiTitle"
  | "systemTaskWorkTimeSingleDescription"
  | "systemTaskWorkTimeMultiDescription";

const AUFGABEN_DICTIONARY: Record<AufgabenTextKey, Record<AppUiLanguage, string>> = {
  dashLabel: {
    DE: "Meine Aufgaben",
    EN: "My tasks",
    IT: "Le mie attività",
    TR: "Görevlerim",
    SQ: "Detyrat e mia",
    KU: "Erkên min",
    RO: "Sarcinile mele",
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
  tasksLoadFailed: {
    DE: "Aufgaben konnten nicht geladen werden.",
    EN: "Tasks could not be loaded.",
    IT: "Impossibile caricare le attività.",
    TR: "Görevler yüklenemedi.",
    SQ: "Detyrat nuk mund të ngarkoheshin.",
    KU: "Erk nehatin barkirin.",
    RO: "Sarcinile nu au putut fi încărcate.",
  },
  unexpectedServerResponse: {
    DE: "Unerwartete Antwort vom Server.",
    EN: "Unexpected server response.",
    IT: "Risposta inattesa dal server.",
    TR: "Sunucudan beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur nga serveri.",
    KU: "Bersiva neçaverêkirî ji serverê.",
    RO: "Răspuns neașteptat de la server.",
  },
  networkLoadError: {
    DE: "Netzwerkfehler beim Laden der Aufgaben.",
    EN: "Network error while loading tasks.",
    IT: "Errore di rete durante il caricamento delle attività.",
    TR: "Görevler yüklenirken ağ hatası.",
    SQ: "Gabim rrjeti gjatë ngarkimit të detyrave.",
    KU: "Di barkirina erkan de şaşiya torê.",
    RO: "Eroare de rețea la încărcarea sarcinilor.",
  },
  taskCompleteFailed: {
    DE: "Aufgabe konnte nicht abgeschlossen werden.",
    EN: "Task could not be completed.",
    IT: "Impossibile completare l'attività.",
    TR: "Görev tamamlanamadı.",
    SQ: "Detyra nuk mund të përfundohej.",
    KU: "Erk nehat temamkirin.",
    RO: "Sarcina nu a putut fi finalizată.",
  },
  taskCompletedSuccess: {
    DE: "Aufgabe wurde als erledigt markiert.",
    EN: "Task was marked as completed.",
    IT: "L'attività è stata contrassegnata come completata.",
    TR: "Görev tamamlandı olarak işaretlendi.",
    SQ: "Detyra u shënua si e kryer.",
    KU: "Erk wekî qediya hat nîşankirin.",
    RO: "Sarcina a fost marcată ca finalizată.",
  },
  networkCompleteError: {
    DE: "Netzwerkfehler beim Abschließen der Aufgabe.",
    EN: "Network error while completing the task.",
    IT: "Errore di rete durante il completamento dell'attività.",
    TR: "Görev tamamlanırken ağ hatası.",
    SQ: "Gabim rrjeti gjatë përfundimit të detyrës.",
    KU: "Di temamkirina erkê de şaşiya torê.",
    RO: "Eroare de rețea la finalizarea sarcinii.",
  },
  noDate: {
    DE: "—",
    EN: "—",
    IT: "—",
    TR: "—",
    SQ: "—",
    KU: "—",
    RO: "—",
  },
  until: {
    DE: "bis",
    EN: "to",
    IT: "fino a",
    TR: "ile",
    SQ: "deri",
    KU: "heta",
    RO: "până la",
  },
  categoryWorkTime: {
    DE: "Arbeitszeit",
    EN: "Work time",
    IT: "Orario di lavoro",
    TR: "Çalışma süresi",
    SQ: "Koha e punës",
    KU: "Dema karê",
    RO: "Timp de lucru",
  },
  categoryVacation: {
    DE: "Urlaub",
    EN: "Vacation",
    IT: "Ferie",
    TR: "İzin",
    SQ: "Pushim",
    KU: "Bêhnvedan",
    RO: "Vacanță",
  },
  categorySickness: {
    DE: "Krankheit",
    EN: "Sickness",
    IT: "Malattia",
    TR: "Hastalık",
    SQ: "Sëmundje",
    KU: "Nexweşî",
    RO: "Boală",
  },
  categoryGeneral: {
    DE: "Allgemein",
    EN: "General",
    IT: "Generale",
    TR: "Genel",
    SQ: "Të përgjithshme",
    KU: "Giştî",
    RO: "General",
  },
  requiredNone: {
    DE: "Keine direkte Pflichtprüfung",
    EN: "No direct required check",
    IT: "Nessun controllo obbligatorio diretto",
    TR: "Doğrudan zorunlu kontrol yok",
    SQ: "Nuk ka kontroll të drejtpërdrejtë të detyrueshëm",
    KU: "Kontrola rasterast ya mecbûrî tune ye",
    RO: "Nicio verificare directă necesară",
  },
  requiredWorkTime: {
    DE: "Arbeitszeit-Eintrag erforderlich",
    EN: "Work time entry required",
    IT: "Registrazione orario richiesta",
    TR: "Çalışma süresi kaydı gerekli",
    SQ: "Kërkohet regjistrim i kohës së punës",
    KU: "Tomara dema karê pêwist e",
    RO: "Înregistrare timp de lucru necesară",
  },
  requiredVacation: {
    DE: "Urlaubs-Eintrag erforderlich",
    EN: "Vacation entry required",
    IT: "Registrazione ferie richiesta",
    TR: "İzin kaydı gerekli",
    SQ: "Kërkohet regjistrim pushimi",
    KU: "Tomara bêhnvedanê pêwist e",
    RO: "Înregistrare concediu necesară",
  },
  requiredSickness: {
    DE: "Krankheits-Eintrag erforderlich",
    EN: "Sickness entry required",
    IT: "Registrazione malattia richiesta",
    TR: "Hastalık kaydı gerekli",
    SQ: "Kërkohet regjistrim sëmundjeje",
    KU: "Tomara nexweşiyê pêwist e",
    RO: "Înregistrare boală necesară",
  },
  requiredMonthlyWorkConfirmation: {
    DE: "Monatliche Arbeitszeitbestätigung erforderlich",
    EN: "Monthly work time confirmation required",
    IT: "Conferma mensile dell'orario di lavoro richiesta",
    TR: "Aylık çalışma süresi onayı gerekli",
    SQ: "Kërkohet konfirmimi mujor i kohës së punës",
    KU: "Piştrastkirina mehane ya dema karê pêwist e",
    RO: "Este necesară confirmarea lunară a timpului de lucru",
  },
  taskActionWorkTime: {
    DE: "Bitte trage deine Arbeitszeit für {referenceText} ein, bevor du die Aufgabe als erledigt markierst.",
    EN: "Please enter your work time for {referenceText} before marking the task as completed.",
    IT: "Inserisci il tuo orario di lavoro per {referenceText} prima di segnare l'attività come completata.",
    TR: "Görevi tamamlandı olarak işaretlemeden önce lütfen {referenceText} için çalışma sürenizi girin.",
    SQ: "Ju lutem regjistroni kohën tuaj të punës për {referenceText} përpara se ta shënoni detyrën si të kryer.",
    KU: "Ji kerema xwe berî ku erkê wekî qediya nîşan bikî, dema karê xwe ji bo {referenceText} binivîse.",
    RO: "Vă rugăm să introduceți timpul de lucru pentru {referenceText} înainte de a marca sarcina ca finalizată.",
  },
  taskActionVacation: {
    DE: "Bitte erfasse für {referenceText} den Urlaub bzw. stelle den passenden Urlaubsantrag, bevor du die Aufgabe abschließt.",
    EN: "Please record the vacation for {referenceText} or submit the matching vacation request before completing the task.",
    IT: "Registra le ferie per {referenceText} oppure invia la richiesta corretta prima di completare l'attività.",
    TR: "Görevi tamamlamadan önce lütfen {referenceText} için izni kaydedin veya uygun izin talebini gönderin.",
    SQ: "Ju lutem regjistroni pushimin për {referenceText} ose dërgoni kërkesën përkatëse përpara se ta përfundoni detyrën.",
    KU: "Ji kerema xwe berî ku erkê temam bikî, bêhnvedanê ji bo {referenceText} tomar bike an daxwaza guncaw bişîne.",
    RO: "Vă rugăm să înregistrați concediul pentru {referenceText} sau să trimiteți cererea de concediu corespunzătoare înainte de a finaliza sarcina.",
  },
  taskActionSickness: {
    DE: "Bitte erfasse für {referenceText} die Krankheit bzw. stelle den passenden Krankheitsantrag, bevor du die Aufgabe abschließt.",
    EN: "Please record the sickness for {referenceText} or submit the matching sick leave request before completing the task.",
    IT: "Registra la malattia per {referenceText} oppure invia la richiesta corretta prima di completare l'attività.",
    TR: "Görevi tamamlamadan önce lütfen {referenceText} için hastalığı kaydedin veya uygun hastalık talebini gönderin.",
    SQ: "Ju lutem regjistroni sëmundjen për {referenceText} ose dërgoni kërkesën përkatëse përpara se ta përfundoni detyrën.",
    KU: "Ji kerema xwe berî ku erkê temam bikî, nexweşiyê ji bo {referenceText} tomar bike an daxwaza guncaw bişîne.",
    RO: "Vă rugăm să înregistrați boala pentru {referenceText} sau să trimiteți cererea de concediu medical corespunzătoare înainte de a finaliza sarcina.",
  },
  taskActionMonthlyWorkConfirmation: {
    DE: "Bitte prüfe und bestätige deine Arbeitszeiteinträge für {referenceText}. Diese Bestätigung ersetzt die monatliche Unterschrift auf dem Stundenzettel.",
    EN: "Please review and confirm your work time entries for {referenceText}. This confirmation replaces the monthly signature on the timesheet.",
    IT: "Controlla e conferma le registrazioni dell'orario di lavoro per {referenceText}. Questa conferma sostituisce la firma mensile sul foglio ore.",
    TR: "Lütfen {referenceText} için çalışma süresi kayıtlarınızı kontrol edip onaylayın. Bu onay, aylık zaman çizelgesi imzasının yerine geçer.",
    SQ: "Ju lutem kontrolloni dhe konfirmoni regjistrimet e kohës së punës për {referenceText}. Ky konfirmim zëvendëson nënshkrimin mujor në fletën e orëve.",
    KU: "Ji kerema xwe tomarên dema karê ji bo {referenceText} kontrol û piştrast bike. Ev piştrastkirin li şûna îmzeya mehane ya pelê demê tê.",
    RO: "Vă rugăm să verificați și să confirmați înregistrările timpului de lucru pentru {referenceText}. Această confirmare înlocuiește semnătura lunară pe pontaj.",
  },
  taskActionNone: {
    DE: "Bitte prüfe die Aufgabe und markiere sie erst als erledigt, wenn du sie wirklich abgeschlossen hast.",
    EN: "Please review the task and only mark it as completed once it is truly finished.",
    IT: "Controlla l'attività e segnala come completata solo quando è davvero conclusa.",
    TR: "Lütfen görevi kontrol edin ve gerçekten tamamlandığında tamamlandı olarak işaretleyin.",
    SQ: "Ju lutem kontrolloni detyrën dhe shënojeni si të kryer vetëm kur të jetë përfunduar vërtet.",
    KU: "Ji kerema xwe erkê kontrol bike û tenê dema ku bi rastî qediya bû wekî qediya nîşan bike.",
    RO: "Vă rugăm să revizuiți sarcina și să o marcați ca finalizată doar atunci când este cu adevărat terminată.",
  },
  openCapture: {
    DE: "Zur Erfassung",
    EN: "Go to time entry",
    IT: "Vai alla registrazione",
    TR: "Kayda git",
    SQ: "Te regjistrimi",
    KU: "Biçe tomarê",
    RO: "La înregistrare",
  },
  openMonthlyConfirmation: {
    DE: "Arbeitszeiten bestätigen",
    EN: "Confirm work times",
    IT: "Conferma gli orari",
    TR: "Çalışma saatlerini onayla",
    SQ: "Konfirmo oraret e punës",
    KU: "Demên karê piştrast bike",
    RO: "Confirmați orele de lucru",
  },
  openVacation: {
    DE: "Zum Urlaub",
    EN: "Go to vacation",
    IT: "Vai alle ferie",
    TR: "İzne git",
    SQ: "Te pushimi",
    KU: "Biçe bêhnvedanê",
    RO: "La concediu",
  },
  openSickness: {
    DE: "Zur Krankheit",
    EN: "Go to sickness",
    IT: "Vai alla malattia",
    TR: "Hastalığa git",
    SQ: "Te sëmundja",
    KU: "Biçe nexweşiyê",
    RO: "La boală",
  },
  openGeneric: {
    DE: "Öffnen",
    EN: "Open",
    IT: "Apri",
    TR: "Aç",
    SQ: "Hape",
    KU: "Veke",
    RO: "Deschide",
  },
  checking: {
    DE: "Prüfe...",
    EN: "Checking...",
    IT: "Verifica...",
    TR: "Kontrol ediliyor...",
    SQ: "Po kontrollohet...",
    KU: "Tê kontrolkirin...",
    RO: "Se verifică...",
  },
  done: {
    DE: "Erledigt",
    EN: "Done",
    IT: "Completata",
    TR: "Tamamlandı",
    SQ: "E kryer",
    KU: "Qediya",
    RO: "Finalizată",
  },
  missingEntriesDays: {
    DE: "Es fehlen Einträge für {count} {dayWord}",
    EN: "Entries are missing for {count} {dayWord}",
    IT: "Mancano registrazioni per {count} {dayWord}",
    TR: "{count} {dayWord} için kayıt eksik",
    SQ: "Mungojnë regjistrime për {count} {dayWord}",
    KU: "Tomar ji bo {count} {dayWord} wenda ne",
    RO: "Lipsesc înregistrări pentru {count} {dayWord}",
  },
  missingEntriesUntilToday: {
    DE: "Fehlende Einträge bis heute – tippe hier für Details.",
    EN: "Missing entries up to today – tap here for details.",
    IT: "Registrazioni mancanti fino a oggi – tocca qui per i dettagli.",
    TR: "Bugüne kadar eksik kayıtlar – detaylar için buraya dokunun.",
    SQ: "Regjistrime të mungesës deri sot – prekni këtu për detaje.",
    KU: "Tomarên wenda heta îro – ji bo hûrguliyan li vir bitikîne.",
    RO: "Lipsesc înregistrări până astăzi – atingeți aici pentru detalii.",
  },
  tapForDetails: {
    DE: "tippe hier für Details.",
    EN: "tap here for details.",
    IT: "tocca qui per i dettagli.",
    TR: "detaylar için buraya dokunun.",
    SQ: "prekni këtu për detaje.",
    KU: "ji bo hûrguliyan li vir bitikîne.",
    RO: "atingeți aici pentru detalii.",
  },
  todo: {
    DE: "Zu erledigen",
    EN: "To do",
    IT: "Da fare",
    TR: "Yapılacaklar",
    SQ: "Për t'u bërë",
    KU: "Yên ku divê bên kirin",
    RO: "De făcut",
  },
  todoHint: {
    DE: "Öffne die jeweilige Aufgabe über den passenden Button und markiere sie erst danach als erledigt. Bei datumsbezogenen Aufgaben prüft die App automatisch, ob der erforderliche Eintrag wirklich vorhanden ist.",
    EN: "Open the relevant task using the matching button and only mark it as done afterwards. For date-based tasks, the app automatically checks whether the required entry actually exists.",
    IT: "Apri l'attività tramite il pulsante corretto e segnala come completata solo dopo. Per le attività legate a una data, l'app verifica automaticamente se la registrazione richiesta esiste davvero.",
    TR: "İlgili görevi uygun düğmeyle açın ve ancak sonra tamamlandı olarak işaretleyin. Tarihe bağlı görevlerde uygulama gerekli kaydın gerçekten mevcut olup olmadığını otomatik kontrol eder.",
    SQ: "Hapni detyrën përkatëse me butonin e duhur dhe shënojeni si të kryer vetëm më pas. Për detyrat sipas datës, aplikacioni kontrollon automatikisht nëse regjistrimi i kërkuar ekziston vërtet.",
    KU: "Erka têkildar bi bişkoka guncaw veke û tenê piştî wê wekî qediya nîşan bike. Ji bo erkên bi dîrokê re têkildar, sepan bixweber kontrol dike ka tomarê pêwist bi rastî heye yan na.",
    RO: "Deschideți sarcina relevantă folosind butonul corespunzător și marcați-o ca finalizată doar după aceea. Pentru sarcinile bazate pe dată, aplicația verifică automat dacă înregistrarea necesară există cu adevărat.",
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
  noOpenTasks: {
    DE: "Keine offenen Aufgaben vorhanden.",
    EN: "No open tasks available.",
    IT: "Nessuna attività aperta disponibile.",
    TR: "Açık görev yok.",
    SQ: "Nuk ka detyra të hapura.",
    KU: "Erkên vekirî tune ne.",
    RO: "Nu există sarcini deschise.",
  },
  noOpenTasksInCategory: {
    DE: "Keine offenen Aufgaben.",
    EN: "No open tasks.",
    IT: "Nessuna attività aperta.",
    TR: "Açık görev yok.",
    SQ: "Nuk ka detyra të hapura.",
    KU: "Erkên vekirî tune ne.",
    RO: "Nu există sarcini deschise.",
  },
  completedTasks: {
    DE: "Erledigte Aufgaben",
    EN: "Completed tasks",
    IT: "Attività completate",
    TR: "Tamamlanan görevler",
    SQ: "Detyrat e kryera",
    KU: "Erkên qediya",
    RO: "Sarcini finalizate",
  },
  noCompletedTasks: {
    DE: "Keine erledigten Aufgaben vorhanden.",
    EN: "No completed tasks available.",
    IT: "Nessuna attività completata disponibile.",
    TR: "Tamamlanmış görev yok.",
    SQ: "Nuk ka detyra të kryera.",
    KU: "Erkên qediya tune ne.",
    RO: "Nu există sarcini finalizate.",
  },
  required: {
    DE: "Pflicht:",
    EN: "Required:",
    IT: "Obbligo:",
    TR: "Gerekli:",
    SQ: "Detyrueshme:",
    KU: "Pêwist:",
    RO: "Obligatoriu:",
  },
  referencePeriod: {
    DE: "Bezugszeitraum:",
    EN: "Reference period:",
    IT: "Periodo di riferimento:",
    TR: "Referans dönemi:",
    SQ: "Periudha referente:",
    KU: "Navbera referansê:",
    RO: "Perioada de referință:",
  },
  createdBy: {
    DE: "Erstellt von:",
    EN: "Created by:",
    IT: "Creato da:",
    TR: "Oluşturan:",
    SQ: "Krijuar nga:",
    KU: "Ji aliyê vê kesê ve hate afirandin:",
    RO: "Creat de:",
  },
  completedOn: {
    DE: "Erledigt am:",
    EN: "Completed on:",
    IT: "Completata il:",
    TR: "Tamamlanma tarihi:",
    SQ: "E kryer më:",
    KU: "Di vê dîrokê de qediya:",
    RO: "Finalizată la:",
  },
  missingEntries: {
    DE: "Fehlende Einträge",
    EN: "Missing entries",
    IT: "Registrazioni mancanti",
    TR: "Eksik kayıtlar",
    SQ: "Regjistrime që mungojnë",
    KU: "Tomarên wenda",
    RO: "Înregistrări lipsă",
  },
  missingEntriesRange: {
    DE: "Fehlende Einträge:",
    EN: "Missing entries:",
    IT: "Registrazioni mancanti:",
    TR: "Eksik kayıtlar:",
    SQ: "Regjistrime që mungojnë:",
    KU: "Tomarên wenda:",
    RO: "Înregistrări lipsă:",
  },
  missingEntriesModalHint: {
    DE: "Es werden nur vergangene bzw. aktuell bereits fehlende Tage angezeigt. Zukünftige Tage werden hier nicht berücksichtigt.",
    EN: "Only past or currently already missing days are shown. Future days are not considered here.",
    IT: "Vengono mostrati solo i giorni passati o già mancanti. I giorni futuri non vengono considerati qui.",
    TR: "Burada yalnızca geçmiş veya şu anda eksik olan günler gösterilir. Gelecek günler dikkate alınmaz.",
    SQ: "Këtu shfaqen vetëm ditët e kaluara ose aktualisht të munguarat. Ditët e ardhshme nuk merren parasysh.",
    KU: "Li vir tenê rojên borî an rojên ku niha wenda ne tên nîşandan. Rojên pêşerojê li vir nayên hesibandin.",
    RO: "Aici sunt afișate doar zilele trecute sau cele care lipsesc în prezent. Zilele viitoare nu sunt luate în considerare aici.",
  },
  goToCapture: {
    DE: "Zur Erfassung",
    EN: "Go to time entry",
    IT: "Vai alla registrazione",
    TR: "Kayda git",
    SQ: "Te regjistrimi",
    KU: "Biçe tomarê",
    RO: "La înregistrare",
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
  generalTaskCompletionNoteTitle: {
    DE: "Allgemeine Aufgabe erledigen",
    EN: "Complete general task",
    IT: "Completa attività generale",
    TR: "Genel görevi tamamla",
    SQ: "Përfundo detyrën e përgjithshme",
    KU: "Erka giştî temam bike",
    RO: "Finalizați sarcina generală",
  },
  generalTaskCompletionNoteHint: {
    DE: "Du kannst optional eine kurze Notiz hinzufügen. Die Aufgabe kann auch ohne Notiz erledigt werden.",
    EN: "You can optionally add a short note. The task can also be completed without a note.",
    IT: "Puoi aggiungere facoltativamente una breve nota. L'attività può essere completata anche senza nota.",
    TR: "İsteğe bağlı olarak kısa bir not ekleyebilirsiniz. Görev not olmadan da tamamlanabilir.",
    SQ: "Mund të shtoni opsionalisht një shënim të shkurtër. Detyra mund të përfundohet edhe pa shënim.",
    KU: "Tu dikarî bi awayekî vebijarkî notek kurt lê zêde bikî. Erk bê not jî dikare were temamkirin.",
    RO: "Puteți adăuga opțional o scurtă notă. Sarcina poate fi finalizată și fără notă.",
  },
  completionNoteLabel: {
    DE: "Notiz zur Erledigung",
    EN: "Completion note",
    IT: "Nota di completamento",
    TR: "Tamamlama notu",
    SQ: "Shënim për përfundimin",
    KU: "Nota temamkirinê",
    RO: "Notă de finalizare",
  },
  completionNotePlaceholder: {
    DE: "Optionale Notiz eingeben...",
    EN: "Enter optional note...",
    IT: "Inserisci una nota facoltativa...",
    TR: "İsteğe bağlı not girin...",
    SQ: "Vendosni një shënim opsional...",
    KU: "Notek vebijarkî binivîse...",
    RO: "Introduceți o notă opțională...",
  },
  completeWithoutNote: {
    DE: "Ohne Notiz erledigen",
    EN: "Complete without note",
    IT: "Completa senza nota",
    TR: "Not olmadan tamamla",
    SQ: "Përfundo pa shënim",
    KU: "Bê not temam bike",
    RO: "Finalizați fără notă",
  },
  completeWithNote: {
    DE: "Mit Notiz erledigen",
    EN: "Complete with note",
    IT: "Completa con nota",
    TR: "Not ile tamamla",
    SQ: "Përfundo me shënim",
    KU: "Bi not temam bike",
    RO: "Finalizați cu notă",
  },
  completionNote: {
    DE: "Notiz:",
    EN: "Note:",
    IT: "Nota:",
    TR: "Not:",
    SQ: "Shënim:",
    KU: "Not:",
    RO: "Notă:",
  },
  systemTaskWorkTimeSingleTitle: {
    DE: "Arbeitszeit für {date} nachtragen",
    EN: "Add work time for {date}",
    IT: "Inserisci l'orario di lavoro per {date}",
    TR: "{date} için çalışma süresini gir",
    SQ: "Regjistro kohën e punës për {date}",
    KU: "Dema karê ji bo {date} binivîse",
    RO: "Adăugați timpul de lucru pentru {date}",
  },
  systemTaskWorkTimeMultiTitle: {
    DE: "Arbeitszeiten ab {date} nachtragen",
    EN: "Add work times from {date}",
    IT: "Inserisci gli orari di lavoro a partire dal {date}",
    TR: "{date} tarihinden itibaren çalışma sürelerini gir",
    SQ: "Regjistro kohët e punës nga {date}",
    KU: "Demên karê ji {date} û pê ve binivîse",
    RO: "Adăugați timpii de lucru de la {date}",
  },
  systemTaskWorkTimeSingleDescription: {
    DE: "Bitte trage deine fehlende Arbeitszeit für {date} in der App nach.",
    EN: "Please add your missing work time for {date} in the app.",
    IT: "Inserisci nell'app il tuo orario di lavoro mancante per il {date}.",
    TR: "Lütfen uygulamada {date} için eksik çalışma sürenizi girin.",
    SQ: "Ju lutem shtoni në aplikacion kohën tuaj të munguar të punës për {date}.",
    KU: "Ji kerema xwe dema karê xwe ya winda ji bo {date} di sepanê de binivîse.",
    RO: "Vă rugăm să adăugați timpul de lucru lipsă pentru {date} în aplicație.",
  },
  systemTaskWorkTimeMultiDescription: {
    DE: "Dir fehlen Arbeitszeiteinträge für mehrere Tage ({from} bis {to}). Bitte beginne mit dem ältesten offenen Tag {referenceDate}.",
    EN: "You are missing work time entries for multiple days ({from} to {to}). Please start with the oldest open day {referenceDate}.",
    IT: "Mancano registrazioni dell'orario di lavoro per più giorni ({from} fino al {to}). Inizia dal giorno aperto più vecchio: {referenceDate}.",
    TR: "Birden fazla gün için çalışma süresi kaydınız eksik ({from} ile {to} arası). Lütfen en eski açık gün olan {referenceDate} ile başlayın.",
    SQ: "Ju mungojnë regjistrimet e kohës së punës për disa ditë ({from} deri më {to}). Ju lutem filloni me ditën më të vjetër të hapur {referenceDate}.",
    KU: "Ji bo çend rojan tomarên dema karê te kêm in ({from} heta {to}). Ji kerema xwe bi roja herî kevn a vekirî {referenceDate} dest pê bike.",
    RO: "Vă lipsesc înregistrări de timp de lucru pentru mai multe zile ({from} până la {to}). Vă rugăm să începeți cu cea mai veche zi deschisă {referenceDate}.",
  },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isTaskCategory(v: unknown): v is TaskCategory {
  return (
    v === "WORK_TIME" ||
    v === "VACATION" ||
    v === "SICKNESS" ||
    v === "GENERAL"
  );
}

function isTaskStatus(v: unknown): v is TaskStatus {
  return v === "OPEN" || v === "COMPLETED";
}

function isTaskRequiredAction(v: unknown): v is TaskRequiredAction {
  return (
    v === "NONE" ||
    v === "WORK_ENTRY_FOR_DATE" ||
    v === "VACATION_ENTRY_FOR_DATE" ||
    v === "SICK_ENTRY_FOR_DATE" ||
    v === "CONFIRM_MONTHLY_WORK_ENTRIES"
  );
}

function isTaskRow(v: unknown): v is TaskRow {
  if (!isRecord(v)) return false;

  const createdByUser = v["createdByUser"];
  const completedByUser = v["completedByUser"];

  return (
    isString(v["id"]) &&
    isString(v["title"]) &&
    (v["description"] === null || isString(v["description"])) &&
    isTaskCategory(v["category"]) &&
    isTaskStatus(v["status"]) &&
    isTaskRequiredAction(v["requiredAction"]) &&
    (v["referenceDate"] === null || isString(v["referenceDate"])) &&
    (v["referenceStartDate"] === null || isString(v["referenceStartDate"])) &&
    (v["referenceEndDate"] === null || isString(v["referenceEndDate"])) &&
    (v["completedAt"] === null || isString(v["completedAt"])) &&
    (v["completionNote"] === null || isString(v["completionNote"])) &&
    isString(v["createdAt"]) &&
    isRecord(createdByUser) &&
    isString(createdByUser["id"]) &&
    isString(createdByUser["fullName"]) &&
    (completedByUser === null ||
      (isRecord(completedByUser) &&
        isString(completedByUser["id"]) &&
        isString(completedByUser["fullName"])))
  );
}

function isMissingWorkEntryAlert(v: unknown): v is MissingWorkEntryAlert {
  return (
    isRecord(v) &&
    typeof v["count"] === "number" &&
    isString(v["oldestMissingDate"]) &&
    isString(v["newestMissingDate"])
  );
}

function isTasksApiResponse(v: unknown): v is TasksApiResponse {
  return (
    isRecord(v) &&
    Array.isArray(v["tasks"]) &&
    v["tasks"].every(isTaskRow) &&
    (v["missingWorkEntryAlert"] === undefined ||
      v["missingWorkEntryAlert"] === null ||
      isMissingWorkEntryAlert(v["missingWorkEntryAlert"]))
  );
}

function formatDateLocalized(
  language: AppUiLanguage,
  value: string | null
): string {
  if (!value) {
    return translate(language, "noDate", AUFGABEN_DICTIONARY);
  }

  const normalized = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return translate(language, "noDate", AUFGABEN_DICTIONARY);
  }

  const [year, month, day] = normalized.split("-");

  switch (language) {
    case "EN":
      return `${month}/${day}/${year}`;
    case "IT":
      return `${day}/${month}/${year}`;
    case "TR":
      return `${day}.${month}.${year}`;
    case "SQ":
      return `${day}.${month}.${year}`;
    case "KU":
      return `${day}.${month}.${year}`;
    case "RO":
      return `${day}.${month}.${year}`;
    case "DE":
    default:
      return `${day}.${month}.${year}`;
  }
}

function formatDateLongLocalized(
  language: AppUiLanguage,
  value: string
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [, month, day] = value.split("-");

  const monthKeys = [
    "monthJanuary",
    "monthFebruary",
    "monthMarch",
    "monthApril",
    "monthMay",
    "monthJune",
    "monthJuly",
    "monthAugust",
    "monthSeptember",
    "monthOctober",
    "monthNovember",
    "monthDecember",
  ] as const;

  const monthKey = monthKeys[Number(month) - 1];
  if (!monthKey) return value;

  const monthName = translate(language, monthKey, AUFGABEN_DICTIONARY);

  switch (language) {
    case "EN":
      return `${monthName} ${Number(day)}`;
    case "IT":
      return `${Number(day)} ${monthName}`;
    case "TR":
      return `${Number(day)} ${monthName}`;
    case "SQ":
      return `${Number(day)} ${monthName}`;
    case "KU":
      return `${Number(day)} ${monthName}`;
    case "RO":
      return `${Number(day)} ${monthName}`;
    case "DE":
    default:
      return `${day}. ${monthName}`;
  }
}

function formatReferenceRangeLocalized(
  language: AppUiLanguage,
  startDate: string | null,
  endDate: string | null,
  fallbackDate: string | null
): string {
  const start = startDate ?? fallbackDate;
  const end = endDate ?? startDate ?? fallbackDate;

  if (!start) return translate(language, "noDate", AUFGABEN_DICTIONARY);
  if (!end) return formatDateLocalized(language, start);
  if (start === end) return formatDateLocalized(language, start);

  return `${formatDateLocalized(language, start)} ${translate(language, "until", AUFGABEN_DICTIONARY)} ${formatDateLocalized(language, end)}`;
}

function replaceTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

function localizeSystemTaskTitle(
  language: AppUiLanguage,
  title: string
): string {
  const singleMatch = title.match(
    /^Arbeitszeit für (\d{4}-\d{2}-\d{2}) nachtragen$/
  );
  if (singleMatch) {
    return replaceTemplate(
      translate(language, "systemTaskWorkTimeSingleTitle", AUFGABEN_DICTIONARY),
      {
        date: formatDateLocalized(language, singleMatch[1]),
      }
    );
  }

  const multiMatch = title.match(
    /^Arbeitszeiten ab (\d{4}-\d{2}-\d{2}) nachtragen$/
  );
  if (multiMatch) {
    return replaceTemplate(
      translate(language, "systemTaskWorkTimeMultiTitle", AUFGABEN_DICTIONARY),
      {
        date: formatDateLocalized(language, multiMatch[1]),
      }
    );
  }

  return title;
}

function localizeSystemTaskDescription(
  language: AppUiLanguage,
  description: string
): string {
  const singleMatch = description.match(
    /^Bitte trage deine fehlende Arbeitszeit für (\d{4}-\d{2}-\d{2}) in der App nach\.$/
  );
  if (singleMatch) {
    return replaceTemplate(
      translate(
        language,
        "systemTaskWorkTimeSingleDescription",
        AUFGABEN_DICTIONARY
      ),
      {
        date: formatDateLocalized(language, singleMatch[1]),
      }
    );
  }

  const multiMatch = description.match(
    /^Dir fehlen Arbeitszeiteinträge für mehrere Tage \((\d{4}-\d{2}-\d{2}) bis (\d{4}-\d{2}-\d{2})\)\. Bitte beginne mit dem ältesten offenen Tag (\d{4}-\d{2}-\d{2})\.$/
  );
  if (multiMatch) {
    return replaceTemplate(
      translate(
        language,
        "systemTaskWorkTimeMultiDescription",
        AUFGABEN_DICTIONARY
      ),
      {
        from: formatDateLocalized(language, multiMatch[1]),
        to: formatDateLocalized(language, multiMatch[2]),
        referenceDate: formatDateLocalized(language, multiMatch[3]),
      }
    );
  }

  return description;
}

function dayWordByCount(language: AppUiLanguage, count: number): string {
  switch (language) {
    case "EN":
      return count === 1 ? "day" : "days";
    case "IT":
      return count === 1 ? "giorno" : "giorni";
    case "TR":
      return "gün";
    case "SQ":
      return "ditë";
    case "KU":
      return "roj";
    case "RO":
      return count === 1 ? "zi" : "zile";
    case "DE":
    default:
      return count === 1 ? "Tag" : "Tage";
  }
}

function categoryLabel(language: AppUiLanguage, category: TaskCategory): string {
  switch (category) {
    case "WORK_TIME":
      return translate(language, "categoryWorkTime", AUFGABEN_DICTIONARY);
    case "VACATION":
      return translate(language, "categoryVacation", AUFGABEN_DICTIONARY);
    case "SICKNESS":
      return translate(language, "categorySickness", AUFGABEN_DICTIONARY);
    case "GENERAL":
      return translate(language, "categoryGeneral", AUFGABEN_DICTIONARY);
  }
}

function getTaskCategoryBadgeStyle(
  category: TaskCategory,
  compact = false
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: "nowrap",
    padding: compact ? "6px 10px" : "7px 12px",
    fontSize: compact ? 12 : 13,
  };

  switch (category) {
    case "WORK_TIME":
      return {
        ...baseStyle,
        border: "1px solid var(--brand-work-border)",
        background: "var(--brand-work-bg)",
        color: "var(--text-soft)",
      };
    case "VACATION":
      return {
        ...baseStyle,
        border: "1px solid var(--brand-vacation-border)",
        background: "var(--brand-vacation-bg)",
        color: "var(--info-text)",
      };
    case "SICKNESS":
      return {
        ...baseStyle,
        border: "1px solid var(--brand-sick-border)",
        background: "var(--brand-sick-bg)",
        color: "var(--danger-text)",
      };
    case "GENERAL":
      return {
        ...baseStyle,
        border: "1px solid var(--border)",
        background: "var(--surface-strong)",
        color: "var(--text-soft)",
      };
  }
}

function requiredActionLabel(
  language: AppUiLanguage,
  requiredAction: TaskRequiredAction
): string {
  switch (requiredAction) {
    case "NONE":
      return translate(language, "requiredNone", AUFGABEN_DICTIONARY);
    case "WORK_ENTRY_FOR_DATE":
      return translate(language, "requiredWorkTime", AUFGABEN_DICTIONARY);
    case "VACATION_ENTRY_FOR_DATE":
      return translate(language, "requiredVacation", AUFGABEN_DICTIONARY);
    case "SICK_ENTRY_FOR_DATE":
      return translate(language, "requiredSickness", AUFGABEN_DICTIONARY);
    case "CONFIRM_MONTHLY_WORK_ENTRIES":
      return translate(language, "requiredMonthlyWorkConfirmation", AUFGABEN_DICTIONARY);
  }
}

function taskActionHref(task: TaskRow): string {
  if (task.requiredAction === "CONFIRM_MONTHLY_WORK_ENTRIES") {
    const startDate = task.referenceStartDate ?? task.referenceDate;
    const monthKey = startDate ? startDate.slice(0, 7) : "";

    const params = new URLSearchParams();

    if (monthKey) {
      params.set("confirmMonth", monthKey);
    }

    params.set("sourceTaskId", task.id);

    const query = params.toString();
    return query ? `/erfassung?${query}` : "/erfassung";
  }

  if (task.category === "WORK_TIME") {
    const params = new URLSearchParams();

    const syncDate =
      task.referenceStartDate ||
      task.referenceDate ||
      task.referenceEndDate;

    if (syncDate) {
      params.set("syncDate", syncDate.slice(0, 10));
    }

    if (task.requiredAction === "WORK_ENTRY_FOR_DATE") {
      params.set("sourceTaskId", task.id);
    }

    const query = params.toString();
    return query ? `/erfassung?${query}` : "/erfassung";
  }

  if (task.category === "VACATION" || task.category === "SICKNESS") {
    const params = new URLSearchParams();

    const startDate =
      task.referenceStartDate ||
      task.referenceDate ||
      task.referenceEndDate;

    const endDate =
      task.referenceEndDate ||
      task.referenceStartDate ||
      task.referenceDate;

    const openDate = startDate || endDate;

    if (openDate) {
      params.set("openDate", openDate.slice(0, 10));
    }

    if (startDate) {
      params.set("absenceStart", startDate.slice(0, 10));
    }

    if (endDate) {
      params.set("absenceEnd", endDate.slice(0, 10));
    }

    params.set(
      "absenceType",
      task.category === "SICKNESS" ? "SICK" : "VACATION"
    );

    if (
      task.requiredAction === "VACATION_ENTRY_FOR_DATE" ||
      task.requiredAction === "SICK_ENTRY_FOR_DATE"
    ) {
      params.set("sourceTaskId", task.id);
    }

    return `/kalender?${params.toString()}`;
  }

  return "/aufgaben";
}

function taskActionText(language: AppUiLanguage, task: TaskRow): string {
  const referenceText = formatReferenceRangeLocalized(
    language,
    task.referenceStartDate,
    task.referenceEndDate,
    task.referenceDate
  );

  switch (task.requiredAction) {
    case "WORK_ENTRY_FOR_DATE":
      return replaceTemplate(
        translate(language, "taskActionWorkTime", AUFGABEN_DICTIONARY),
        { referenceText }
      );
    case "VACATION_ENTRY_FOR_DATE":
      return replaceTemplate(
        translate(language, "taskActionVacation", AUFGABEN_DICTIONARY),
        { referenceText }
      );
    case "SICK_ENTRY_FOR_DATE":
      return replaceTemplate(
        translate(language, "taskActionSickness", AUFGABEN_DICTIONARY),
        { referenceText }
      );
    case "CONFIRM_MONTHLY_WORK_ENTRIES":
      return replaceTemplate(
        translate(language, "taskActionMonthlyWorkConfirmation", AUFGABEN_DICTIONARY),
        { referenceText }
      );
    case "NONE":
      return translate(language, "taskActionNone", AUFGABEN_DICTIONARY);
  }
}

function sortTasksByDateDesc(tasks: TaskRow[]): TaskRow[] {
  return tasks.slice().sort((a, b) => {
    const aPrimary =
      a.referenceStartDate ??
      a.referenceDate ??
      a.referenceEndDate ??
      a.completedAt ??
      a.createdAt;

    const bPrimary =
      b.referenceStartDate ??
      b.referenceDate ??
      b.referenceEndDate ??
      b.completedAt ??
      b.createdAt;

    const byPrimary = bPrimary.slice(0, 19).localeCompare(aPrimary.slice(0, 19));
    if (byPrimary !== 0) {
      return byPrimary;
    }

    return b.createdAt.slice(0, 19).localeCompare(a.createdAt.slice(0, 19));
  });
}

export default function AufgabenPage() {
  const [language, setLanguage] = useState<AppUiLanguage>("DE");
  const t = React.useCallback(
    (key: AufgabenTextKey): string =>
      translate(language, key, AUFGABEN_DICTIONARY),
    [language]
  );
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTaskId, setActionTaskId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [missingWorkEntryAlert, setMissingWorkEntryAlert] =
    useState<MissingWorkEntryAlert | null>(null);
  const [showMissingWorkEntryModal, setShowMissingWorkEntryModal] = useState(false);
  const [generalCompletionTask, setGeneralCompletionTask] = useState<TaskRow | null>(null);
  const [generalCompletionNote, setGeneralCompletionNote] = useState("");

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

  const loadTasks = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : t("tasksLoadFailed");
        setError(message);
        setTasks([]);
        setMissingWorkEntryAlert(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("tasks-changed"));
        }
        return;
      }

      if (!isTasksApiResponse(data)) {
        setError(t("unexpectedServerResponse"));
        setTasks([]);
        setMissingWorkEntryAlert(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("tasks-changed"));
        }
        return;
      }

      setTasks(data.tasks);
      setMissingWorkEntryAlert(data.missingWorkEntryAlert ?? null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks-changed"));
      }
    } catch {
      setError(t("networkLoadError"));
      setTasks([]);
      setMissingWorkEntryAlert(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tasks-changed"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const openTasks = useMemo(
    () => sortTasksByDateDesc(tasks.filter((task) => task.status === "OPEN")),
    [tasks]
  );

  const completedTasks = useMemo(
    () => sortTasksByDateDesc(tasks.filter((task) => task.status === "COMPLETED")),
    [tasks]
  );

  const groupedOpenTasks = useMemo(() => {
    const groups: Record<CategoryGroupKey, TaskRow[]> = {
      WORK_TIME: [],
      VACATION: [],
      SICKNESS: [],
      GENERAL: [],
    };

    for (const task of openTasks) {
      groups[task.category].push(task);
    }

    return groups;
  }, [openTasks]);

  const missingWorkEntryRangeText = useMemo(() => {
    if (!missingWorkEntryAlert) return "";

    const fromText = formatDateLongLocalized(language, missingWorkEntryAlert.oldestMissingDate);
    const toText = formatDateLongLocalized(language, missingWorkEntryAlert.newestMissingDate);

    return fromText === toText
      ? fromText
      : `${fromText} ${translate(language, "until", AUFGABEN_DICTIONARY)} ${toText}`;
  }, [missingWorkEntryAlert, language]);

  async function completeTask(
    taskId: string,
    completionNote?: string
  ): Promise<void> {
    setActionTaskId(taskId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/complete`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completionNote: completionNote?.trim() || undefined,
        }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(data) && isString(data["error"])
            ? data["error"]
            : t("taskCompleteFailed");
        setError(message);
        return;
      }

      setGeneralCompletionTask(null);
      setGeneralCompletionNote("");
      setSuccess(t("taskCompletedSuccess"));
      await loadTasks();
    } catch {
      setError(t("networkCompleteError"));
    } finally {
      setActionTaskId("");
    }
  }

  function openGeneralCompletionModal(task: TaskRow): void {
    setError("");
    setSuccess("");
    setGeneralCompletionTask(task);
    setGeneralCompletionNote("");
  }

  function renderTaskCard(task: TaskRow, allowComplete: boolean): React.ReactElement {
    const localizedTitle = localizeSystemTaskTitle(language, task.title);
    const localizedDescription = task.description
      ? localizeSystemTaskDescription(language, task.description)
      : null;

    return (
      <div
        key={task.id}
        className="tenant-soft-panel"
        style={{
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontWeight: 1000 }}>{localizedTitle}</div>
          <div style={getTaskCategoryBadgeStyle(task.category, true)}>
            {categoryLabel(language, task.category)}
          </div>
        </div>

        <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
          {t("required")} {requiredActionLabel(language, task.requiredAction)}
        </div>

        <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
          {t("referencePeriod")} {formatReferenceRangeLocalized(
            language,
            task.referenceStartDate,
            task.referenceEndDate,
            task.referenceDate
          )}
        </div>

        <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
          {t("createdBy")} {task.createdByUser.fullName}
        </div>

        {allowComplete ? (
          <div
            className="tenant-soft-panel-strong"
            style={{
              color: "var(--text-soft)",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {taskActionText(language, task)}
          </div>
        ) : null}

        {task.completedAt ? (
          <div style={{ color: "var(--muted-2)", fontSize: 13 }}>
            {t("completedOn")} {formatDateLocalized(language, task.completedAt)}
          </div>
        ) : null}
        {!allowComplete && task.completionNote ? (
          <div
            className="tenant-soft-panel-strong"
            style={{
              color: "var(--text-soft)",
              fontSize: 13,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
            }}
          >
            <strong>{t("completionNote")}</strong> {task.completionNote}
          </div>
        ) : null}

        {localizedDescription ? (
          <div style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>
            {localizedDescription}
          </div>
        ) : null}

        {allowComplete ? (
          <div
            style={{
              display: "flex",
              justifyContent: task.category === "GENERAL" ? "flex-end" : "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {task.category !== "GENERAL" ? (
              <Link
                href={taskActionHref(task)}
                className="tenant-action-link"
              >
                {task.requiredAction === "CONFIRM_MONTHLY_WORK_ENTRIES"
                    ? t("openMonthlyConfirmation")
                    : task.category === "WORK_TIME"
                    ? t("openCapture")
                    : task.category === "VACATION"
                    ? t("openVacation")
                    : t("openSickness")}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() =>
                task.category === "GENERAL"
                  ? openGeneralCompletionModal(task)
                  : void completeTask(task.id)
              }
              disabled={actionTaskId === task.id}
              className="tenant-action-button"
            >
              {actionTaskId === task.id ? t("checking") : t("done")}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <AppShell activeLabel={t("dashLabel")}>
      <div style={{ display: "grid", gap: 16 }}>
        {missingWorkEntryAlert ? (
          <button
            type="button"
            onClick={() => setShowMissingWorkEntryModal(true)}
            className="tenant-status-card tenant-status-card-danger"
            style={{
              width: "100%",
              textAlign: "left",
              color: "var(--text)",
              cursor: "pointer",
              display: "grid",
              gap: 6,
            }}
          >
            <div
              className="tenant-status-text-danger"
              style={{ fontWeight: 1000 }}
            >
              {replaceTemplate(t("missingEntriesDays"), {
                count: missingWorkEntryAlert.count,
                dayWord: dayWordByCount(language, missingWorkEntryAlert.count),
              })}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-soft)",
              }}
            >
              {t("missingEntriesUntilToday")}
            </div>
          </button>
        ) : null}
        {error ? (
          <div className="card tenant-status-card tenant-status-card-danger" style={{ padding: 14 }}>
            <div className="tenant-status-text-danger" style={{ fontWeight: 900 }}>
              {error}
            </div>
          </div>
        ) : null}

        {success ? (
          <div
            className="card tenant-status-card tenant-status-card-success"
            style={{ padding: 14 }}
          >
            <div
              className="tenant-status-text-success"
              style={{ fontWeight: 900 }}
            >
              {success}
            </div>
          </div>
        ) : null}

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            {t("todo")}
          </div>

          <div
            style={{
              marginBottom: 14,
              color: "var(--muted)",
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            {t("todoHint")}
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
          ) : openTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>{t("noOpenTasks")}</div>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {(
                [
                  ["WORK_TIME", t("categoryWorkTime")],
                  ["VACATION", t("categoryVacation")],
                  ["SICKNESS", t("categorySickness")],
                  ["GENERAL", t("categoryGeneral")],
                ] as Array<[CategoryGroupKey, string]>
              ).map(([groupKey, label]) => {
                const groupTasks = groupedOpenTasks[groupKey];
                return (
                  <div key={groupKey} style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        ...getTaskCategoryBadgeStyle(groupKey),
                        fontSize: 16,
                        fontWeight: 1000,
                        justifySelf: "start",
                      }}
                    >
                      {label}
                    </div>

                    {groupTasks.length === 0 ? (
                      <div style={{ color: "var(--muted)", paddingLeft: 2 }}>
                        {t("noOpenTasksInCategory")}
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {groupTasks.map((task) => renderTaskCard(task, true))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            {t("completedTasks")}
          </div>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>{t("loading")}</div>
          ) : completedTasks.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>{t("noCompletedTasks")}</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {completedTasks.map((task) => renderTaskCard(task, false))}
            </div>
          )}
        </div>
        <Modal
          open={Boolean(generalCompletionTask)}
          title={t("generalTaskCompletionNoteTitle")}
          onClose={() => {
            if (actionTaskId) return;
            setGeneralCompletionTask(null);
            setGeneralCompletionNote("");
          }}
          maxWidth={620}
          disableBackdropClose={Boolean(actionTaskId)}
          disableEscapeClose={Boolean(actionTaskId)}
          footer={
            generalCompletionTask ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setGeneralCompletionTask(null);
                    setGeneralCompletionNote("");
                  }}
                  disabled={Boolean(actionTaskId)}
                  className="tenant-action-link"
                >
                  {t("close")}
                </button>

                <button
                  type="button"
                  onClick={() => void completeTask(generalCompletionTask.id)}
                  disabled={actionTaskId === generalCompletionTask.id}
                  className="tenant-action-link"
                >
                  {actionTaskId === generalCompletionTask.id
                    ? t("checking")
                    : t("completeWithoutNote")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void completeTask(generalCompletionTask.id, generalCompletionNote)
                  }
                  disabled={actionTaskId === generalCompletionTask.id}
                  className="tenant-action-button"
                >
                  {actionTaskId === generalCompletionTask.id
                    ? t("checking")
                    : t("completeWithNote")}
                </button>
              </>
            ) : null
          }
        >
          {generalCompletionTask ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  color: "var(--text-soft)",
                  lineHeight: 1.5,
                }}
              >
                {t("generalTaskCompletionNoteHint")}
              </div>

              <div
                className="tenant-soft-panel-strong"
                style={{
                  color: "var(--text-soft)",
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {generalCompletionTask.title}
              </div>

              <label
                style={{
                  display: "grid",
                  gap: 8,
                  color: "var(--text-soft)",
                  fontWeight: 900,
                }}
              >
                {t("completionNoteLabel")}
                <textarea
                  value={generalCompletionNote}
                  onChange={(event) => setGeneralCompletionNote(event.target.value)}
                  placeholder={t("completionNotePlaceholder")}
                  maxLength={1000}
                  rows={4}
                  className="textarea"
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: 96,
                  }}
                />
              </label>
            </div>
          ) : null}
        </Modal>
        {showMissingWorkEntryModal && missingWorkEntryAlert ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setShowMissingWorkEntryModal(false)}
            className="tenant-modal-overlay"
          >
            <div
              onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
              className="tenant-modal-panel"
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div
                  className="tenant-status-text-danger"
                  style={{
                    fontWeight: 1000,
                    fontSize: 18,
                  }}
                >
                  {t("missingEntries")}
                </div>
                <div
                  style={{
                    color: "var(--text-soft)",
                    lineHeight: 1.5,
                  }}
                >
                  {t("missingEntriesRange")} {missingWorkEntryRangeText}
                </div>
                <div
                  style={{
                    color: "var(--muted-2)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {t("missingEntriesModalHint")}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <Link
                  href={`/erfassung?syncDate=${encodeURIComponent(
                    missingWorkEntryAlert.oldestMissingDate
                  )}`}
                  onClick={() => setShowMissingWorkEntryModal(false)}
                  className="tenant-action-button"
                >
                  {t("goToCapture")}
                </Link>

                <button
                  type="button"
                  onClick={() => setShowMissingWorkEntryModal(false)}
                  className="tenant-action-link"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}