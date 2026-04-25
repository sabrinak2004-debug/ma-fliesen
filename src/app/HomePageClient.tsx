"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import PublicLanguageSelect from "@/components/PublicLanguageSelect";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import {
  applyDocumentLanguage,
  readPublicLanguage,
  writePublicLanguage,
} from "@/lib/publicLanguage";

type HomeTextKey =
  | "language"
  | "title"
  | "text"
  | "feature1Title"
  | "feature1Text"
  | "feature2Title"
  | "feature2Text"
  | "feature3Title"
  | "feature3Text"
  | "companyLogin"
  | "privacy"
  | "terms";

const HOME_TEXTS: Record<HomeTextKey, Record<AppUiLanguage, string>> = {
  language: {
    DE: "Sprache",
    EN: "Language",
    IT: "Lingua",
    TR: "Dil",
    SQ: "Gjuha",
    KU: "Ziman",
    RO: "Limba",
  },
  title: {
    DE: "Digitale Zeiterfassung und Mitarbeiterverwaltung für Unternehmen",
    EN: "Digital time tracking and employee management for companies",
    IT: "Rilevazione digitale del tempo e gestione dei dipendenti per aziende",
    TR: "Şirketler için dijital zaman takibi ve çalışan yönetimi",
    SQ: "Regjistrim digjital i orarit dhe menaxhim i punonjësve për kompani",
    KU: "Tomarkirina dîjîtal a demê û rêveberiya karmendan ji bo pargîdaniyan",
    RO: "Monitorizare digitală a timpului și gestionare a angajaților pentru companii",
  },
  text: {
    DE: "saleo ist eine Webanwendung für die Erfassung von Arbeitszeiten, Einsatzplanung, Abwesenheiten, Aufgaben und betriebliche Organisation. Mitarbeiter und Administratoren nutzen die Anwendung über einen geschützten Firmenzugang.",
    EN: "saleo is a web application for recording working hours, shift planning, absences, tasks and company organization. Employees and administrators use the application through a protected company login.",
    IT: "saleo è un'applicazione web per la registrazione degli orari di lavoro, la pianificazione degli impieghi, le assenze, le attività e l'organizzazione aziendale. Dipendenti e amministratori utilizzano l'applicazione tramite un accesso aziendale protetto.",
    TR: "saleo; çalışma saatlerinin kaydı, görev planlaması, devamsızlıklar, görevler ve şirket organizasyonu için bir web uygulamasıdır. Çalışanlar ve yöneticiler uygulamayı korumalı şirket girişi üzerinden kullanır.",
    SQ: "saleo është një aplikacion web për regjistrimin e orarit të punës, planifikimin e angazhimeve, mungesat, detyrat dhe organizimin e kompanisë. Punonjësit dhe administratorët e përdorin aplikacionin përmes një hyrjeje të mbrojtur të kompanisë.",
    KU: "saleo sepanek webê ye ji bo tomarkirina saetên xebatê, planandina karan, nebûn, erkan û rêxistina pargîdaniyê. Karmend û rêvebir sepana bi têketina parastî ya şirketê bikar tînin.",
    RO: "saleo este o aplicație web pentru înregistrarea orelor de lucru, planificarea schimburilor, absențe, sarcini și organizarea companiei. Angajații și administratorii folosesc aplicația printr-un login protejat al companiei.",
  },
  feature1Title: {
    DE: "Arbeitszeiten erfassen",
    EN: "Track working hours",
    IT: "Registrare gli orari di lavoro",
    TR: "Çalışma saatlerini kaydet",
    SQ: "Regjistro orarin e punës",
    KU: "Saetên xebatê tomar bike",
    RO: "Înregistrați orele de lucru",
  },
  feature1Text: {
    DE: "Startzeiten, Endzeiten, Pausen, Tätigkeiten, Einsatzorte und Fahrtzeiten digital dokumentieren.",
    EN: "Document start times, end times, breaks, activities, work locations and travel times digitally.",
    IT: "Documentare digitalmente orari di inizio, fine, pause, attività, luoghi di lavoro e tempi di viaggio.",
    TR: "Başlangıç saatlerini, bitiş saatlerini, molaları, faaliyetleri, çalışma yerlerini ve yolculuk sürelerini dijital olarak belgeleyin.",
    SQ: "Dokumentoni në mënyrë digjitale orën e fillimit, orën e mbarimit, pushimet, aktivitetet, vendet e punës dhe kohën e udhëtimit.",
    KU: "Demên destpêkê, bidawîbûnê, bêhnvedan, çalakî, cihên xebatê û demên rêwîtiyê bi dîjîtalî tomar bikin.",
    RO: "Documentați digital orele de început, orele de sfârșit, pauzele, activitățile, locațiile de muncă și timpii de călătorie.",
  },
  feature2Title: {
    DE: "Abwesenheiten verwalten",
    EN: "Manage absences",
    IT: "Gestire le assenze",
    TR: "Devamsızlıkları yönet",
    SQ: "Menaxho mungesat",
    KU: "Nebûnê birêve bibe",
    RO: "Gestionați absențele",
  },
  feature2Text: {
    DE: "Urlaub, Krankheit, Anträge und Genehmigungen strukturiert und nachvollziehbar verwalten.",
    EN: "Manage vacation, sickness, requests and approvals in a structured and traceable way.",
    IT: "Gestire ferie, malattia, richieste e approvazioni in modo strutturato e tracciabile.",
    TR: "İzin, hastalık, talepler ve onayları düzenli ve takip edilebilir şekilde yönetin.",
    SQ: "Menaxhoni pushimet, sëmundjet, kërkesat dhe miratimet në mënyrë të strukturuar dhe të gjurmueshme.",
    KU: "Îzin, nexweşî, daxwaz û pejirandinê bi awayekî rêkûpêk û şopbar birêve bibin.",
    RO: "Gestionați vacanțele, bolile, cererile și aprobările într-un mod structurat și trasabil.",
  },
  feature3Title: {
    DE: "Planung und Aufgaben",
    EN: "Planning and tasks",
    IT: "Pianificazione e attività",
    TR: "Planlama ve görevler",
    SQ: "Planifikim dhe detyra",
    KU: "Plan û erk",
    RO: "Planificare și sarcini",
  },
  feature3Text: {
    DE: "Wochenpläne, Termine, Dokumente, Aufgaben und Hinweise zentral für Mitarbeiter und Admins bereitstellen.",
    EN: "Provide weekly plans, appointments, documents, tasks and notes centrally for employees and admins.",
    IT: "Mettere a disposizione piani settimanali, appuntamenti, documenti, attività e note in modo centrale per dipendenti e admin.",
    TR: "Haftalık planları, randevuları, belgeleri, görevleri ve notları çalışanlar ve yöneticiler için merkezi olarak sağlayın.",
    SQ: "Ofroni në mënyrë qendrore plane javore, takime, dokumente, detyra dhe shënime për punonjësit dhe administratorët.",
    KU: "Planên heftane, civîn, belge, erk û nîşanî bi awayekî navendî ji bo karmend û rêvebiran peyda bikin.",
    RO: "Furnizați planuri săptămânale, întâlniri, documente, sarcini și note în mod central pentru angajați și administratori.",
  },
  companyLogin: {
    DE: "Zum Firmen-Login",
    EN: "Go to company login",
    IT: "Vai al login aziendale",
    TR: "Şirket girişine git",
    SQ: "Shko te hyrja e kompanisë",
    KU: "Biçe têketina şirketê",
    RO: "Accesați login-ul companiei",
  },
  privacy: {
    DE: "Datenschutz",
    EN: "Privacy",
    IT: "Privacy",
    TR: "Gizlilik",
    SQ: "Privatësia",
    KU: "Nepenî",
    RO: "Confidențialitate",
  },
  terms: {
    DE: "Nutzungsbedingungen",
    EN: "Terms of use",
    IT: "Condizioni d'uso",
    TR: "Kullanım koşulları",
    SQ: "Kushtet e përdorimit",
    KU: "Mercên bikaranînê",
    RO: "Termeni de utilizare",
  },
};

function tHome(language: AppUiLanguage, key: HomeTextKey): string {
  return translate(language, key, HOME_TEXTS);
}

export default function HomePageClient(): React.ReactElement {
  const [language, setLanguage] = useState<AppUiLanguage>(() =>
    readPublicLanguage()
  );

  useEffect(() => {
    writePublicLanguage(language);
    applyDocumentLanguage(language);
  }, [language]);

  return (
      <div className="container-app">
        <div className="landing-hero-card card card-olive">
          <div className="landing-badge">saleo</div>

          <div style={{ maxWidth: 260, marginBottom: 18 }}>
            <PublicLanguageSelect
              value={language}
              onChange={setLanguage}
              label={tHome(language, "language")}
            />
          </div>

          <h1 className="landing-title">{tHome(language, "title")}</h1>

          <p className="landing-text">{tHome(language, "text")}</p>

          <div className="landing-feature-grid">
            <div className="landing-feature card">
              <div className="landing-feature-title">
                {tHome(language, "feature1Title")}
              </div>
              <div className="landing-feature-text">
                {tHome(language, "feature1Text")}
              </div>
            </div>

            <div className="landing-feature card">
              <div className="landing-feature-title">
                {tHome(language, "feature2Title")}
              </div>
              <div className="landing-feature-text">
                {tHome(language, "feature2Text")}
              </div>
            </div>

            <div className="landing-feature card">
              <div className="landing-feature-title">
                {tHome(language, "feature3Title")}
              </div>
              <div className="landing-feature-text">
                {tHome(language, "feature3Text")}
              </div>
            </div>
          </div>

          <div className="landing-action-row">
            <Link
              href="/firmenzugang"
              className="btn btn-accent link-button-inline"
            >
              {tHome(language, "companyLogin")}
            </Link>
          </div>

          <div className="landing-legal-row">
            <Link href="/datenschutz" className="landing-legal-link">
              {tHome(language, "privacy")}
            </Link>

            <span className="landing-legal-separator">•</span>

            <Link href="/nutzungsbedingungen" className="landing-legal-link">
              {tHome(language, "terms")}
            </Link>
          </div>
        </div>
      </div>
  );
}