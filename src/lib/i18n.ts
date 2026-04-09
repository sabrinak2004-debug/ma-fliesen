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