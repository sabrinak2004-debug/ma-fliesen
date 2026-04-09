import { google } from "googleapis";

export const SUPPORTED_LANGUAGES = ["DE", "EN", "IT", "TR", "SQ", "KU"] as const;

export type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number];

type GoogleTranslateLanguageCode =
  | "de"
  | "en"
  | "it"
  | "tr"
  | "sq"
  | "ku";

type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{
      translatedText?: string;
      detectedSourceLanguage?: string;
    }>;
    detections?: Array<
      Array<{
        language?: string;
        confidence?: number;
      }>
    >;
  };
};

export type TranslationMap = Record<SupportedLang, string>;

export type TranslateAllLanguagesResult = {
  sourceLanguage: SupportedLang | null;
  translations: TranslationMap;
};

const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID ?? "";
const GOOGLE_CLOUD_CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL ?? "";
const GOOGLE_CLOUD_PRIVATE_KEY = (process.env.GOOGLE_CLOUD_PRIVATE_KEY ?? "").replace(
  /\\n/g,
  "\n"
);

function assertGoogleTranslateConfig(): void {
  if (!GOOGLE_CLOUD_PROJECT_ID) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID fehlt.");
  }

  if (!GOOGLE_CLOUD_CLIENT_EMAIL) {
    throw new Error("GOOGLE_CLOUD_CLIENT_EMAIL fehlt.");
  }

  if (!GOOGLE_CLOUD_PRIVATE_KEY) {
    throw new Error("GOOGLE_CLOUD_PRIVATE_KEY fehlt.");
  }
}

function mapAppLangToGoogleLang(lang: SupportedLang): GoogleTranslateLanguageCode {
  switch (lang) {
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
  }
}

function normalizeGoogleLangToAppLang(language: string | null | undefined): SupportedLang | null {
  if (!language) {
    return null;
  }

  const normalized = language.toLowerCase();

  if (normalized === "de" || normalized.startsWith("de-")) {
    return "DE";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "EN";
  }

  if (normalized === "it" || normalized.startsWith("it-")) {
    return "IT";
  }

  if (normalized === "tr" || normalized.startsWith("tr-")) {
    return "TR";
  }

  if (normalized === "sq" || normalized.startsWith("sq-")) {
    return "SQ";
  }

  if (
    normalized === "ku" ||
    normalized.startsWith("ku-") ||
    normalized === "ckb" ||
    normalized.startsWith("ckb-")
  ) {
    return "KU";
  }

  return null;
}

async function getGoogleAccessToken(): Promise<string> {
  assertGoogleTranslateConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: GOOGLE_CLOUD_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/cloud-translation"],
  });

  const client = await auth.getClient();
  const tokenResult = await client.getAccessToken();
  const token = typeof tokenResult === "string" ? tokenResult : tokenResult?.token;

  if (!token) {
    throw new Error("Google Cloud Access Token konnte nicht geladen werden.");
  }

  return token;
}

async function callGoogleTranslate(
  path: "translate" | "detect",
  body: Record<string, unknown>
): Promise<GoogleTranslateResponse> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2/${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google-Übersetzung fehlgeschlagen: ${errorText}`);
  }

  return (await response.json()) as GoogleTranslateResponse;
}

export async function detectLanguage(text: string): Promise<SupportedLang | null> {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  const response = await callGoogleTranslate("detect", {
    q: trimmed,
  });

  const detectedLanguage = response.data?.detections?.[0]?.[0]?.language;

  return normalizeGoogleLangToAppLang(detectedLanguage);
}

export async function translateText(args: {
  text: string;
  targetLanguage: SupportedLang;
  sourceLanguage?: SupportedLang | null;
}): Promise<string> {
  const trimmed = args.text.trim();

  if (!trimmed) {
    return "";
  }

  if (args.sourceLanguage && args.sourceLanguage === args.targetLanguage) {
    return args.text;
  }

  const response = await callGoogleTranslate("translate", {
    q: args.text,
    target: mapAppLangToGoogleLang(args.targetLanguage),
    ...(args.sourceLanguage
      ? { source: mapAppLangToGoogleLang(args.sourceLanguage) }
      : {}),
    format: "text",
  });

  const translatedText = response.data?.translations?.[0]?.translatedText;

  return translatedText?.trim() ? translatedText : args.text;
}

export async function translateAllLanguages(
  text: string,
  sourceLanguage?: SupportedLang | null
): Promise<TranslateAllLanguagesResult> {
  const trimmed = text.trim();

  const emptyResult: TranslationMap = {
    DE: "",
    EN: "",
    IT: "",
    TR: "",
    SQ: "",
    KU: "",
  };

  if (!trimmed) {
    return {
      sourceLanguage: sourceLanguage ?? null,
      translations: emptyResult,
    };
  }

  const resolvedSourceLanguage = sourceLanguage ?? (await detectLanguage(text));

  const entries = await Promise.all(
    SUPPORTED_LANGUAGES.map(async (language) => {
      if (resolvedSourceLanguage === language) {
        return [language, text] as const;
      }

      const translated = await translateText({
        text,
        targetLanguage: language,
        sourceLanguage: resolvedSourceLanguage,
      });

      return [language, translated] as const;
    })
  );

  const translations: TranslationMap = {
    DE: "",
    EN: "",
    IT: "",
    TR: "",
    SQ: "",
    KU: "",
  };

  for (const [language, translatedText] of entries) {
    translations[language] = translatedText;
  }

  return {
    sourceLanguage: resolvedSourceLanguage,
    translations,
  };
}