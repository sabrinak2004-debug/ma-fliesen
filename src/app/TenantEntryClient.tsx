"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/Toast";
import PublicLanguageSelect from "@/components/PublicLanguageSelect";
import { translate, type AppUiLanguage } from "@/lib/i18n";
import {
  applyDocumentLanguage,
  readPublicLanguage,
  writePublicLanguage,
} from "@/lib/publicLanguage";

type PublicCompany = {
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

type PublicCompanySuccessResponse = {
  ok: true;
  company: PublicCompany;
};

type PublicCompanyErrorResponse = {
  ok: false;
  error?: string;
};

type PublicCompanyResponse =
  | PublicCompanySuccessResponse
  | PublicCompanyErrorResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPublicCompany(value: unknown): value is PublicCompany {
  if (!isRecord(value)) return false;

  const name = value["name"];
  const subdomain = value["subdomain"];
  const logoUrl = value["logoUrl"];
  const primaryColor = value["primaryColor"];

  return (
    typeof name === "string" &&
    typeof subdomain === "string" &&
    (typeof logoUrl === "string" || logoUrl === null) &&
    (typeof primaryColor === "string" || primaryColor === null)
  );
}

function parsePublicCompanyResponse(
  value: unknown
): PublicCompanyResponse | null {
  if (!isRecord(value)) return null;

  const ok = value["ok"];

  if (ok === true) {
    const company = value["company"];
    if (!isPublicCompany(company)) return null;

    return {
      ok: true,
      company,
    };
  }

  if (ok === false) {
    const error = value["error"];
    return {
      ok: false,
      error: typeof error === "string" ? error : undefined,
    };
  }

  return null;
}

function normalizeInput(value: string): string {
  return value.trim();
}

type TenantEntryTextKey =
  | "language"
  | "badge"
  | "title"
  | "text"
  | "companyName"
  | "companyNamePlaceholder"
  | "submitChecking"
  | "submitContinue"
  | "footnote"
  | "privacy"
  | "terms"
  | "enterCompany"
  | "companyNotFound"
  | "companyCheckFailed"
  | "queryMissing";

const TENANT_ENTRY_TEXTS: Record<
  TenantEntryTextKey,
  Record<AppUiLanguage, string>
> = {
  language: {
    DE: "Sprache",
    EN: "Language",
    IT: "Lingua",
    TR: "Dil",
    SQ: "Gjuha",
    KU: "Ziman",
    RO: "Limba",
  },
  badge: {
    DE: "Firmenzugang",
    EN: "Company access",
    IT: "Accesso aziendale",
    TR: "Şirket erişimi",
    SQ: "Qasja e kompanisë",
    KU: "Gihîştina şirketê",
    RO: "Acces companie",
  },
  title: {
    DE: "Willkommen bei saleo!",
    EN: "Welcome to saleo!",
    IT: "Benvenuto in saleo!",
    TR: "saleo'ya hoş geldiniz!",
    SQ: "Mirë se vini në saleo!",
    KU: "Bi xêr hatî saleo!",
    RO: "Bine ați venit la saleo!",
  },
  text: {
    DE: "Gib bitte deinen Firmennamen ein, damit wir dich zum richtigen Login weiterleiten können.",
    EN: "Please enter your company name so we can redirect you to the correct login.",
    IT: "Inserisci il nome della tua azienda, così possiamo reindirizzarti al login corretto.",
    TR: "Sizi doğru giriş sayfasına yönlendirebilmemiz için lütfen şirket adınızı girin.",
    SQ: "Ju lutem shkruani emrin e kompanisë suaj që t'ju ridrejtojmë te hyrja e duhur.",
    KU: "Ji kerema xwe navê şirketa xwe binivîse da ku em te ber bi têketina rast re bişînin.",
    RO: "Vă rugăm să introduceți numele companiei, astfel încât să vă putem redirecționa către login-ul corect.",
  },
  companyName: {
    DE: "Ihr Firmenname",
    EN: "Your company name",
    IT: "Nome della tua azienda",
    TR: "Şirket adınız",
    SQ: "Emri i kompanisë suaj",
    KU: "Navê şirketa we",
    RO: "Numele companiei dvs.",
  },
  companyNamePlaceholder: {
    DE: "z.B. Musterfirma",
    EN: "e.g. Example Company",
    IT: "es. Azienda Esempio",
    TR: "örn. Örnek Şirket",
    SQ: "p.sh. Kompania Shembull",
    KU: "mînak: Şirketa Nimûne",
    RO: "ex. Compania Exemplu",
  },
  submitChecking: {
    DE: "Firma wird geprüft...",
    EN: "Checking company...",
    IT: "Verifica azienda...",
    TR: "Şirket kontrol ediliyor...",
    SQ: "Po kontrollohet kompania...",
    KU: "Şirket tê kontrolkirin...",
    RO: "Se verifică compania...",
  },
  submitContinue: {
    DE: "Weiter zum Firmen-Login",
    EN: "Continue to company login",
    IT: "Vai al login aziendale",
    TR: "Şirket girişine devam et",
    SQ: "Vazhdo te hyrja e kompanisë",
    KU: "Berdewam bike bi têketina şirketê",
    RO: "Continuă la login-ul companiei",
  },
  footnote: {
    DE: "Nach erfolgreicher Prüfung wirst du automatisch zu dem passenden Firmen-Login weitergeleitet.",
    EN: "After successful verification, you will automatically be redirected to the matching company login.",
    IT: "Dopo la verifica riuscita, verrai reindirizzato automaticamente al login aziendale corretto.",
    TR: "Başarılı kontrolden sonra doğru şirket girişine otomatik olarak yönlendirileceksiniz.",
    SQ: "Pas verifikimit të suksesshëm, do të ridrejtoheni automatikisht te hyrja e duhur e kompanisë.",
    KU: "Piştî kontrola serkeftî, tu bixweber ber bi têketina şirketa guncan ve tên şandin.",
    RO: "După verificarea cu succes, veți fi redirecționat automat către login-ul companiei potrivite.",
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
  enterCompany: {
    DE: "Bitte gib deinen Firmennamen oder die Subdomain ein.",
    EN: "Please enter your company name or subdomain.",
    IT: "Inserisci il nome della tua azienda o il sottodominio.",
    TR: "Lütfen şirket adınızı veya alt alan adınızı girin.",
    SQ: "Ju lutem shkruani emrin e kompanisë ose nën-domenin.",
    KU: "Ji kerema xwe navê şirketê an bin-domenê binivîse.",
    RO: "Vă rugăm să introduceți numele companiei sau subdomeniul.",
  },
  queryMissing: {
    DE: "Bitte gib deinen Firmennamen oder die Subdomain ein.",
    EN: "Please enter your company name or subdomain.",
    IT: "Inserisci il nome della tua azienda o il sottodominio.",
    TR: "Lütfen şirket adınızı veya alt alan adınızı girin.",
    SQ: "Ju lutem shkruani emrin e kompanisë ose nën-domenin.",
    KU: "Ji kerema xwe navê şirketê an bin-domenê binivîse.",
    RO: "Vă rugăm să introduceți numele companiei sau subdomeniul.",
  },
  companyNotFound: {
    DE: "Die Firma wurde nicht gefunden. Bitte prüfe deine Eingabe.",
    EN: "Company not found. Please check your input.",
    IT: "Azienda non trovata. Controlla i dati inseriti.",
    TR: "Şirket bulunamadı. Lütfen girişinizi kontrol edin.",
    SQ: "Kompania nuk u gjet. Ju lutem kontrolloni shkrimin.",
    KU: "Şirket nehat dîtin. Ji kerema xwe têketina xwe kontrol bike.",
    RO: "Companie negăsită. Vă rugăm să verificați datele introduse.",
  },
  companyCheckFailed: {
    DE: "Die Firma konnte gerade nicht geprüft werden. Bitte versuche es erneut.",
    EN: "The company could not be checked right now. Please try again.",
    IT: "Impossibile verificare l'azienda in questo momento. Riprova.",
    TR: "Şirket şu anda kontrol edilemedi. Lütfen tekrar deneyin.",
    SQ: "Kompania nuk mund të kontrollohej tani. Ju lutem provoni përsëri.",
    KU: "Şirket niha nehat kontrolkirin. Ji kerema xwe dîsa biceribîne.",
    RO: "Compania nu a putut fi verificată chiar acum. Vă rugăm să încercați din nou.",
  },
};

function tTenantEntry(
  language: AppUiLanguage,
  key: TenantEntryTextKey
): string {
  return translate(language, key, TENANT_ENTRY_TEXTS);
}

function getTenantEntryApiErrorMessage(
  language: AppUiLanguage,
  error?: string
): string {
  switch (error) {
    case "PUBLIC_COMPANY_QUERY_MISSING":
      return tTenantEntry(language, "queryMissing");
    case "PUBLIC_COMPANY_NOT_FOUND":
      return tTenantEntry(language, "companyNotFound");
    default:
      return tTenantEntry(language, "companyCheckFailed");
  }
}

export default function TenantEntryClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<AppUiLanguage>(() =>
    readPublicLanguage()
  );

  const isDisabled = useMemo(() => {
    return isSubmitting || normalizeInput(query).length === 0;
  }, [isSubmitting, query]);

  useEffect(() => {
    writePublicLanguage(language);
    applyDocumentLanguage(language);
  }, [language]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const normalizedQuery = normalizeInput(query);

    if (!normalizedQuery) {
      setToastMessage(tTenantEntry(language, "enterCompany"));
      return;
    }

    try {
      setIsSubmitting(true);
      setToastMessage(null);

      const response = await fetch(
        `/api/public-company?query=${encodeURIComponent(normalizedQuery)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const json: unknown = await response.json().catch(() => null);
      const parsed = parsePublicCompanyResponse(json);

      if (!parsed || !parsed.ok) {
        setToastMessage(
          getTenantEntryApiErrorMessage(language, parsed?.error)
        );
        return;
      }

      router.push(`/${parsed.company.subdomain}/login`);
    } catch {
      setToastMessage(
        tTenantEntry(language, "companyCheckFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="tenant-entry-shell">
        <div className="container-app">
          <div className="card tenant-entry-card">
            <div style={{ maxWidth: 260, marginBottom: 18 }}>
              <PublicLanguageSelect
                value={language}
                onChange={setLanguage}
                label={tTenantEntry(language, "language")}
              />
            </div>
            <div className="tenant-entry-header">
              <div className="tenant-entry-badge">
                {tTenantEntry(language, "badge")}
              </div>

              <h1 className="tenant-entry-title">
                {tTenantEntry(language, "title")}
              </h1>

              <p className="tenant-entry-text">
                {tTenantEntry(language, "text")}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="tenant-entry-form-grid">
                <div>
                  <div className="label">
                    {tTenantEntry(language, "companyName")}
                  </div>
                  <input
                    className="input"
                    type="text"
                    placeholder={tTenantEntry(language, "companyNamePlaceholder")}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoComplete="organization"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-accent tenant-entry-submit-btn"
                  disabled={isDisabled}
                >
                  {isSubmitting
                    ? tTenantEntry(language, "submitChecking")
                    : tTenantEntry(language, "submitContinue")}
                </button>
              </div>
            </form>

            <div className="tenant-entry-footnote">
              {tTenantEntry(language, "footnote")}
            </div>

            <div className="login-legal-links">
              <Link href="/datenschutz" className="login-legal-link">
                {tTenantEntry(language, "privacy")}
              </Link>

              <span className="login-legal-separator">•</span>

              <Link href="/nutzungsbedingungen" className="login-legal-link">
                {tTenantEntry(language, "terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toastMessage ? <Toast message={toastMessage} /> : null}
    </>
  );
}