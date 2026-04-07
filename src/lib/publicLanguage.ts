// src/lib/publicLanguage.ts
import { normalizeAppUiLanguage, type AppUiLanguage } from "@/lib/i18n";

export const PUBLIC_LANGUAGE_STORAGE_KEY = "app_public_language";

export function readPublicLanguage(): AppUiLanguage {
  if (typeof window === "undefined") {
    return "DE";
  }

  try {
    return normalizeAppUiLanguage(
      window.localStorage.getItem(PUBLIC_LANGUAGE_STORAGE_KEY)
    );
  } catch {
    return "DE";
  }
}

export function writePublicLanguage(language: AppUiLanguage): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PUBLIC_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // ignore localStorage errors
  }
}

export function applyDocumentLanguage(language: AppUiLanguage): void {
  if (typeof document === "undefined") {
    return;
  }

  const html = document.documentElement;

  switch (language) {
    case "DE":
      html.lang = "de";
      break;
    case "EN":
      html.lang = "en";
      break;
    case "IT":
      html.lang = "it";
      break;
    case "TR":
      html.lang = "tr";
      break;
    case "SQ":
      html.lang = "sq";
      break;
    case "KU":
      html.lang = "ku";
      break;
    default:
      html.lang = "de";
      break;
  }
}