"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  applyTenantHeadBranding,
  applyTenantThemeToDocument,
  getTenantAppleTouchIconHref,
  getTenantManifestHref,
  getTenantThemeStyle,
  resetTenantThemeOnDocument,
  resolveTenantTheme,
  type TenantTheme,
} from "@/lib/tenantBranding";
import Link from "next/link";
import PublicLanguageSelect from "@/components/PublicLanguageSelect";
import {
  normalizeAppUiLanguage,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";
import {
  applyDocumentLanguage,
  readPublicLanguage,
  writePublicLanguage,
} from "@/lib/publicLanguage";

type Role = "ADMIN" | "EMPLOYEE";

type PrecheckResponse =
  | { ok: true; allowed: true; role: Role; needsPasswordSetup: boolean }
  | { ok: false; allowed: false }
  | { ok: false; error: string };

type LoginResponse = { ok: true; role?: Role } | { ok: false; error: string };

type ForgotResponse = { ok: true } | { ok: false; error: string };

type LoginTextKey =
  | "language"
  | "companyAccess"
  | "employeeName"
  | "employeeNamePlaceholder"
  | "checkingAccess"
  | "nameNotStored"
  | "accessOkAdmin"
  | "accessOkEmployee"
  | "enterName"
  | "noAccess"
  | "waitForCheck"
  | "passwordTooShort"
  | "passwordMismatch"
  | "enterPassword"
  | "unexpectedServerResponse"
  | "loginFailed"
  | "loginNetworkError"
  | "forgotEnterNameFirst"
  | "forgotWaitForCheck"
  | "forgotRequestFailed"
  | "forgotRequestCreated"
  | "forgotNetworkError"
  | "setPasswordFirstTime"
  | "newPasswordPlaceholder"
  | "repeatPassword"
  | "repeatPasswordPlaceholder"
  | "hidePassword"
  | "showPassword"
  | "password"
  | "forgotPassword"
  | "forgotCreating"
  | "pleaseWait"
  | "savePasswordAndLogin"
  | "login"
  | "privacy"
  | "terms"
  | "loginFootnote";

const LOGIN_TEXTS: Record<LoginTextKey, Record<AppUiLanguage, string>> = {
  language: {
    DE: "Sprache",
    EN: "Language",
    IT: "Lingua",
    TR: "Dil",
    SQ: "Gjuha",
    KU: "Ziman",
  },
  companyAccess: {
    DE: "Firmenzugang",
    EN: "Company access",
    IT: "Accesso aziendale",
    TR: "Şirket erişimi",
    SQ: "Qasja e kompanisë",
    KU: "Gihîştina şirketê",
  },
  employeeName: {
    DE: "Mitarbeitername",
    EN: "Employee name",
    IT: "Nome dipendente",
    TR: "Çalışan adı",
    SQ: "Emri i punonjësit",
    KU: "Navê karmendê",
  },
  employeeNamePlaceholder: {
    DE: "Vor- und Nachname (muss hinterlegt sein)",
    EN: "First and last name (must be stored)",
    IT: "Nome e cognome (devono essere registrati)",
    TR: "Ad ve soyad (kayıtlı olmalıdır)",
    SQ: "Emri dhe mbiemri (duhet të jetë i regjistruar)",
    KU: "Nav û paşnav (divê tomarkirî be)",
  },
  checkingAccess: {
    DE: "Prüfe Zugriff...",
    EN: "Checking access...",
    IT: "Verifica accesso...",
    TR: "Erişim kontrol ediliyor...",
    SQ: "Po kontrollohet qasja...",
    KU: "Gihîştin tê kontrolkirin...",
  },
  nameNotStored: {
    DE: "Name nicht hinterlegt.",
    EN: "Name not found.",
    IT: "Nome non registrato.",
    TR: "İsim kayıtlı değil.",
    SQ: "Emri nuk është i regjistruar.",
    KU: "Nav tomar nekiriye.",
  },
  accessOkAdmin: {
    DE: "Zugriff OK. (Admin)",
    EN: "Access OK. (Admin)",
    IT: "Accesso OK. (Admin)",
    TR: "Erişim tamam. (Yönetici)",
    SQ: "Qasja në rregull. (Admin)",
    KU: "Gihîştin baş e. (Rêvebir)",
  },
  accessOkEmployee: {
    DE: "Zugriff OK. (Mitarbeiter)",
    EN: "Access OK. (Employee)",
    IT: "Accesso OK. (Dipendente)",
    TR: "Erişim tamam. (Çalışan)",
    SQ: "Qasja në rregull. (Punonjës)",
    KU: "Gihîştin baş e. (Karmend)",
  },
  enterName: {
    DE: "Bitte Namen eingeben.",
    EN: "Please enter your name.",
    IT: "Inserisci il nome.",
    TR: "Lütfen isminizi girin.",
    SQ: "Ju lutem shkruani emrin.",
    KU: "Ji kerema xwe navê xwe binivîse.",
  },
  noAccess: {
    DE: "Kein Zugriff. Name ist nicht hinterlegt.",
    EN: "No access. Name is not stored.",
    IT: "Nessun accesso. Il nome non è registrato.",
    TR: "Erişim yok. İsim kayıtlı değil.",
    SQ: "Nuk ka qasje. Emri nuk është i regjistruar.",
    KU: "Gihîştin tune. Nav tomar nekiriye.",
  },
  waitForCheck: {
    DE: "Bitte kurz warten – Zugriff wird geprüft.",
    EN: "Please wait a moment – access is being checked.",
    IT: "Attendere un momento: l'accesso è in verifica.",
    TR: "Lütfen biraz bekleyin – erişim kontrol ediliyor.",
    SQ: "Ju lutem prisni pak - qasja po kontrollohet.",
    KU: "Ji kerema xwe hinek bisekine - gihîştin tê kontrolkirin.",
  },
  passwordTooShort: {
    DE: "Passwort muss mind. 8 Zeichen haben.",
    EN: "Password must be at least 8 characters.",
    IT: "La password deve contenere almeno 8 caratteri.",
    TR: "Şifre en az 8 karakter olmalıdır.",
    SQ: "Fjalëkalimi duhet të ketë të paktën 8 karaktere.",
    KU: "Şîfre divê herî kêm 8 tîpan hebe.",
  },
  passwordMismatch: {
    DE: "Passwörter stimmen nicht überein.",
    EN: "Passwords do not match.",
    IT: "Le password non coincidono.",
    TR: "Şifreler eşleşmiyor.",
    SQ: "Fjalëkalimet nuk përputhen.",
    KU: "Şîfre hev nagirin.",
  },
  enterPassword: {
    DE: "Bitte Passwort eingeben.",
    EN: "Please enter your password.",
    IT: "Inserisci la password.",
    TR: "Lütfen şifrenizi girin.",
    SQ: "Ju lutem shkruani fjalëkalimin.",
    KU: "Ji kerema xwe şîfreyê binivîse.",
  },
  unexpectedServerResponse: {
    DE: "Unerwartete Antwort vom Server.",
    EN: "Unexpected response from server.",
    IT: "Risposta inattesa dal server.",
    TR: "Sunucudan beklenmeyen yanıt.",
    SQ: "Përgjigje e papritur nga serveri.",
    KU: "Bersiva nedihatî ji serverê.",
  },
  loginFailed: {
    DE: "Login fehlgeschlagen.",
    EN: "Login failed.",
    IT: "Accesso non riuscito.",
    TR: "Giriş başarısız.",
    SQ: "Hyrja dështoi.",
    KU: "Têketin têk çû.",
  },
  loginNetworkError: {
    DE: "Netzwerkfehler beim Login.",
    EN: "Network error during login.",
    IT: "Errore di rete durante l'accesso.",
    TR: "Giriş sırasında ağ hatası.",
    SQ: "Gabim rrjeti gjatë hyrjes.",
    KU: "Di têketinê de çewtiya torê.",
  },
  forgotEnterNameFirst: {
    DE: "Bitte zuerst deinen Namen eingeben.",
    EN: "Please enter your name first.",
    IT: "Inserisci prima il tuo nome.",
    TR: "Lütfen önce isminizi girin.",
    SQ: "Ju lutem së pari shkruani emrin tuaj.",
    KU: "Ji kerema xwe pêşî navê xwe binivîse.",
  },
  forgotWaitForCheck: {
    DE: "Bitte kurz warten – Zugriff wird geprüft.",
    EN: "Please wait a moment – access is being checked.",
    IT: "Attendere un momento: l'accesso è in verifica.",
    TR: "Lütfen biraz bekleyin – erişim kontrol ediliyor.",
    SQ: "Ju lutem prisni pak - qasja po kontrollohet.",
    KU: "Ji kerema xwe hinek bisekine - gihîştin tê kontrolkirin.",
  },
  forgotRequestFailed: {
    DE: "Anfrage fehlgeschlagen.",
    EN: "Request failed.",
    IT: "Richiesta non riuscita.",
    TR: "İstek başarısız.",
    SQ: "Kërkesa dështoi.",
    KU: "Daxwaz têk çû.",
  },
  forgotRequestCreated: {
    DE: "Anfrage wurde erstellt. Bitte wende dich an den Admin – er sendet dir einen Reset-Link.",
    EN: "Request created. Please contact the admin - they will send you a reset link.",
    IT: "Richiesta creata. Contatta l'admin: ti invierà un link di reset.",
    TR: "İstek oluşturuldu. Lütfen yöneticiye başvurun - size bir sıfırlama bağlantısı gönderecektir.",
    SQ: "Kërkesa u krijua. Ju lutem kontaktoni administratorin - ai do t'ju dërgojë një link rivendosjeje.",
    KU: "Daxwaz hate afirandin. Ji kerema xwe bi rêvebir re têkilî daynin - ew dê lînkek nûkirinê ji we re bişîne.",
  },
  forgotNetworkError: {
    DE: "Netzwerkfehler. Bitte später erneut versuchen.",
    EN: "Network error. Please try again later.",
    IT: "Errore di rete. Riprova più tardi.",
    TR: "Ağ hatası. Lütfen daha sonra tekrar deneyin.",
    SQ: "Gabim rrjeti. Ju lutem provoni më vonë.",
    KU: "Çewtiya torê. Ji kerema xwe paşê dîsa biceribîne.",
  },
  setPasswordFirstTime: {
    DE: "Passwort festlegen (nur beim ersten Mal)",
    EN: "Set password (first time only)",
    IT: "Imposta password (solo la prima volta)",
    TR: "Şifre belirle (yalnızca ilk kez)",
    SQ: "Vendos fjalëkalimin (vetëm herën e parë)",
    KU: "Şîfreyê diyar bike (tenê cara yekem)",
  },
  newPasswordPlaceholder: {
    DE: "Neues Passwort (mind. 8 Zeichen)",
    EN: "New password (min. 8 characters)",
    IT: "Nuova password (min. 8 caratteri)",
    TR: "Yeni şifre (en az 8 karakter)",
    SQ: "Fjalëkalim i ri (min. 8 karaktere)",
    KU: "Şîfreya nû (herî kêm 8 tîp)",
  },
  repeatPassword: {
    DE: "Passwort wiederholen",
    EN: "Repeat password",
    IT: "Ripeti password",
    TR: "Şifreyi tekrar girin",
    SQ: "Përsërit fjalëkalimin",
    KU: "Şîfreyê dubare bike",
  },
  repeatPasswordPlaceholder: {
    DE: "Passwort wiederholen",
    EN: "Repeat password",
    IT: "Ripeti password",
    TR: "Şifreyi tekrar girin",
    SQ: "Përsërit fjalëkalimin",
    KU: "Şîfreyê dubare bike",
  },
  hidePassword: {
    DE: "Passwort verbergen",
    EN: "Hide password",
    IT: "Nascondi password",
    TR: "Şifreyi gizle",
    SQ: "Fshihe fjalëkalimin",
    KU: "Şîfreyê veşêre",
  },
  showPassword: {
    DE: "Passwort anzeigen",
    EN: "Show password",
    IT: "Mostra password",
    TR: "Şifreyi göster",
    SQ: "Shfaq fjalëkalimin",
    KU: "Şîfreyê nîşan bide",
  },
  password: {
    DE: "Passwort",
    EN: "Password",
    IT: "Password",
    TR: "Şifre",
    SQ: "Fjalëkalimi",
    KU: "Şîfre",
  },
  forgotPassword: {
    DE: "Passwort vergessen?",
    EN: "Forgot password?",
    IT: "Password dimenticata?",
    TR: "Şifrenizi mi unuttunuz?",
    SQ: "Keni harruar fjalëkalimin?",
    KU: "Şîfreyê ji bîr kir?",
  },
  forgotCreating: {
    DE: "Anfrage wird erstellt...",
    EN: "Creating request...",
    IT: "Creazione richiesta...",
    TR: "İstek oluşturuluyor...",
    SQ: "Po krijohet kërkesa...",
    KU: "Daxwaz tê afirandin...",
  },
  pleaseWait: {
    DE: "Bitte warten...",
    EN: "Please wait...",
    IT: "Attendere...",
    TR: "Lütfen bekleyin...",
    SQ: "Ju lutem prisni...",
    KU: "Ji kerema xwe bisekine...",
  },
  savePasswordAndLogin: {
    DE: "Passwort speichern & Login",
    EN: "Save password & log in",
    IT: "Salva password e accedi",
    TR: "Şifreyi kaydet ve giriş yap",
    SQ: "Ruaj fjalëkalimin dhe hyr",
    KU: "Şîfreyê tomar bike û têkeve",
  },
  login: {
    DE: "Login",
    EN: "Log in",
    IT: "Accedi",
    TR: "Giriş yap",
    SQ: "Hyr",
    KU: "Têkeve",
  },
  privacy: {
    DE: "Datenschutz",
    EN: "Privacy",
    IT: "Privacy",
    TR: "Gizlilik",
    SQ: "Privatësia",
    KU: "Nepenî",
  },
  terms: {
    DE: "Nutzungsbedingungen",
    EN: "Terms of use",
    IT: "Condizioni d'uso",
    TR: "Kullanım koşulları",
    SQ: "Kushtet e përdorimit",
    KU: "Mercên bikaranînê",
  },
  loginFootnote: {
    DE: "Nur hinterlegte Mitarbeiter können sich anmelden. Beim ersten Login wird ein Passwort festgelegt.",
    EN: "Only stored employees can sign in. A password is set during the first login.",
    IT: "Solo i dipendenti registrati possono accedere. Alla prima registrazione viene impostata una password.",
    TR: "Yalnızca kayıtlı çalışanlar giriş yapabilir. İlk girişte bir şifre belirlenir.",
    SQ: "Vetëm punonjësit e regjistruar mund të hyjnë. Në hyrjen e parë vendoset një fjalëkalim.",
    KU: "Tenê karmendên tomarkirî dikarin têkevin. Di têketina yekem de şîfre tê diyarkirin.",
  },
};

function tLogin(language: AppUiLanguage, key: LoginTextKey): string {
  return translate(language, key, LOGIN_TEXTS);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type PublicBrand = {
  displayName: string;
  subtitle: string;
  badgeText: string;
  logoUrl: string | null;
  primaryColor: string | null;
  companySubdomain: string;
};

type LoginClientProps = {
  companySubdomainOverride?: string;
  initialBrand?: PublicBrand;
};

function extractCompanySubdomainFromBrowser(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const host = window.location.hostname.trim().toLowerCase();

  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return "";
  }

  if (host.endsWith(".vercel.app")) {
    return "";
  }

  const parts = host.split(".");
  return parts[0] ?? "";
}

function normalizeLogoSrc(
  value: string | null,
  companySubdomain: string
): string | null {
  if (value) {
    const trimmed = value.trim();

    if (trimmed !== "") {
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("data:")
      ) {
        return trimmed;
      }

      return `/${trimmed}`;
    }
  }

  const normalizedSubdomain = companySubdomain.trim().toLowerCase();

  if (normalizedSubdomain) {
    return `/tenant-assets/${normalizedSubdomain}/icon-512.jpeg`;
  }

  return null;
}

export default function LoginClient({
  companySubdomainOverride,
  initialBrand,
}: LoginClientProps) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPassword2, setShowNewPassword2] = useState(false);

  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);
  const [companySubdomain, setCompanySubdomain] = useState(
    companySubdomainOverride ?? ""
  );

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [language, setLanguage] = useState<AppUiLanguage>(() =>
    readPublicLanguage()
  );

  const nameTrim = useMemo(() => fullName.trim(), [fullName]);

  const fallbackBrand: PublicBrand = {
    displayName: "Mitarbeiterportal",
    subtitle: "Digitale Zeiterfassung & Einsatzplanung",
    badgeText: "Portal",
    logoUrl: null,
    primaryColor: "#b8cf3a",
    companySubdomain: "",
  };

  const brand = initialBrand ?? fallbackBrand;
  const logoSrc = normalizeLogoSrc(
    brand.logoUrl,
    companySubdomainOverride ?? companySubdomain ?? ""
  );

    const effectiveCompanySubdomain =
    companySubdomain || companySubdomainOverride || "";

  const legalBasePath = effectiveCompanySubdomain
    ? `/${effectiveCompanySubdomain}`
    : "";

  const privacyHref = `${legalBasePath}/datenschutz`;
  const termsHref = `${legalBasePath}/nutzungsbedingungen`;

  const reqIdRef = useRef(0);
    const serverTheme: TenantTheme = resolveTenantTheme(
    effectiveCompanySubdomain,
    brand.primaryColor
  );

  const pageThemeStyle = getTenantThemeStyle(serverTheme);

  useEffect(() => {
    writePublicLanguage(language);
    applyDocumentLanguage(language);
  }, [language]);

  useEffect(() => {
    if (companySubdomainOverride) {
      setCompanySubdomain(companySubdomainOverride);
      return;
    }

    setCompanySubdomain(extractCompanySubdomainFromBrowser());
  }, [companySubdomainOverride]);

  useEffect(() => {
    const effectiveSubdomain = companySubdomainOverride ?? companySubdomain;
    const loginTheme = resolveTenantTheme(
      effectiveSubdomain,
      brand.primaryColor
    );

    applyTenantThemeToDocument(loginTheme);

    applyTenantHeadBranding({
      title: `${brand.displayName} Mitarbeiterportal`,
      themeColor: loginTheme.bg,
      appName: brand.displayName,
      manifestHref: getTenantManifestHref(effectiveSubdomain),
      appleTouchIconHref: getTenantAppleTouchIconHref(effectiveSubdomain),
    });

    return () => {
      resetTenantThemeOnDocument();
    };
  }, [
    brand.displayName,
    brand.primaryColor,
    companySubdomain,
    companySubdomainOverride,
  ]);

  useEffect(() => {
    const myId = ++reqIdRef.current;

    (async () => {
      setError(null);
      setForgotInfo(null);
      setAllowed(null);
      setRole(null);
      setNeedsSetup(false);

      setPassword("");
      setNewPassword("");
      setNewPassword2("");

      setShowPassword(false);
      setShowNewPassword(false);
      setShowNewPassword2(false);

      if (nameTrim.length < 3) {
        return;
      }

      setChecking(true);

      try {
        await wait(250);

        const params = new URLSearchParams({
          fullName: nameTrim,
        });

        if (companySubdomain) {
          params.set("companySubdomain", companySubdomain);
        }

        const response = await fetch(`/api/auth/precheck?${params.toString()}`);
        const json = (await response.json()) as PrecheckResponse;

        if (reqIdRef.current !== myId) {
          return;
        }

        if (typeof json === "object" && json !== null && "ok" in json && json.ok === true) {
          setAllowed(true);
          setRole(json.role);
          setNeedsSetup(json.needsPasswordSetup);
        } else {
          setAllowed(false);
        }
      } catch {
        if (reqIdRef.current !== myId) {
          return;
        }

        setAllowed(false);
      } finally {
        if (reqIdRef.current === myId) {
          setChecking(false);
        }
      }
    })();
  }, [nameTrim, companySubdomain]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setForgotInfo(null);

    if (!nameTrim) {
      setError(tLogin(language, "enterName"));
      return;
    }

    if (allowed === false) {
      setError(tLogin(language, "noAccess"));
      return;
    }

    if (checking || allowed === null) {
      setError(tLogin(language, "waitForCheck"));
      return;
    }

    if (needsSetup) {
      if (newPassword.length < 8) {
        setError(tLogin(language, "passwordTooShort"));
        return;
      }

      if (newPassword !== newPassword2) {
        setError(tLogin(language, "passwordMismatch"));
        return;
      }
    } else {
      if (!password) {
        setError(tLogin(language, "enterPassword"));
        return;
      }
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          needsSetup
            ? {
                fullName: nameTrim,
                newPassword,
                companySubdomain,
                language,
              }
            : {
                fullName: nameTrim,
                password,
                companySubdomain,
                language,
              }
        ),
      });

      const data = (await res.json()) as unknown;

      const parsed: LoginResponse =
        typeof data === "object" && data !== null && "ok" in data
          ? (data as LoginResponse)
          : { ok: false, error: tLogin(language, "unexpectedServerResponse") };

      if (!res.ok || !parsed.ok) {
        setError(!parsed.ok ? parsed.error : tLogin(language, "loginFailed"));
        return;
      }

      window.location.replace(
        parsed.role === "ADMIN" ? "/admin/dashboard" : "/erfassung"
      );
    } catch {
      setError(tLogin(language, "loginNetworkError"));
    } finally {
      setBusy(false);
    }
  }

  async function requestForgotPassword() {
    setError(null);
    setForgotInfo(null);

    if (nameTrim.length < 3) {
      setForgotInfo(tLogin(language, "forgotEnterNameFirst"));
      return;
    }

    if (checking || allowed === null) {
      setForgotInfo(tLogin(language, "forgotWaitForCheck"));
      return;
    }

    setForgotBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: nameTrim,
          companySubdomain,
        }),
      });

      const data = (await res.json()) as unknown;

      const parsed: ForgotResponse =
        isRecord(data) && typeof data.ok === "boolean"
          ? (data as ForgotResponse)
          : { ok: false, error: tLogin(language, "unexpectedServerResponse") };

      if (!res.ok || !parsed.ok) {
        setForgotInfo(
          !parsed.ok ? parsed.error : tLogin(language, "forgotRequestFailed")
        );
        return;
      }

      setForgotInfo(tLogin(language, "forgotRequestCreated"));
    } catch {
      setForgotInfo(tLogin(language, "forgotNetworkError"));
    } finally {
      setForgotBusy(false);
    }
  }

  const statusText = useMemo(() => {
    if (nameTrim.length < 3) {
      return "";
    }

    if (checking) {
      return tLogin(language, "checkingAccess");
    }

    if (allowed === false) {
      return tLogin(language, "nameNotStored");
    }

    if (allowed === true && role) {
      return role === "ADMIN"
        ? tLogin(language, "accessOkAdmin")
        : tLogin(language, "accessOkEmployee");
    }

    return "";
  }, [nameTrim.length, checking, allowed, role, language]);

  const eyeBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    color: "var(--muted-2)",
    lineHeight: 1,
    fontSize: 16,
  };

  return (
    <div
      style={{
        ...pageThemeStyle,
        minHeight: "100dvh",
        backgroundColor: "var(--bg)",
        backgroundImage:
          "radial-gradient(1200px 600px at 10% 10%, var(--accent-soft), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(var(--accent-rgb), 0.06), transparent 60%)",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "1200px 600px, 900px 600px",
        backgroundPosition: "0 0, 100% 0",
      }}
    >
      <div style={{ padding: "40px 0" }}>
        <div className="container-app">
        <div
          className="card card-olive"
          style={{
            padding: 20,
            width: "min(620px, 100%)",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div
              style={{
                width: 220,
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`${brand.displayName} Logo`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  className="brand-logo-fallback"
                  style={{
                    width: 140,
                    height: 40,
                    fontSize: 12,
                  }}
                >
                  {brand.displayName}
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ color: "var(--muted)" }}>{brand.subtitle}</div>
            {companySubdomain ? (
              <div style={{ color: "var(--muted-2)", fontSize: 12, marginTop: 6 }}>
                {tLogin(language, "companyAccess")}: {companySubdomain}
              </div>
            ) : null}
          </div>

          <div className="hr" style={{ margin: "14px 0" }} />

          <PublicLanguageSelect
            value={language}
            onChange={setLanguage}
            label={tLogin(language, "language")}
          />

          <form onSubmit={submit}>
            <div style={{ marginBottom: 12 }}>
              <div className="label">{tLogin(language, "employeeName")}</div>
              <input
                className="input"
                placeholder={tLogin(language, "employeeNamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
              <div style={{ color: "var(--muted-2)", fontSize: 12, marginTop: 6 }}>
                {statusText}
              </div>
            </div>

            {allowed && role === "EMPLOYEE" && needsSetup ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div className="label">
                    {tLogin(language, "setPasswordFirstTime")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showNewPassword ? "text" : "password"}
                      placeholder={tLogin(language, "newPasswordPlaceholder")}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={
                        showNewPassword
                          ? tLogin(language, "hidePassword")
                          : tLogin(language, "showPassword")
                      }
                      style={eyeBtnStyle}
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div className="label">{tLogin(language, "repeatPassword")}</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showNewPassword2 ? "text" : "password"}
                      placeholder={tLogin(language, "repeatPasswordPlaceholder")}
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword2((prev) => !prev)}
                      aria-label={
                        showNewPassword2
                          ? tLogin(language, "hidePassword")
                          : tLogin(language, "showPassword")
                      }
                      style={eyeBtnStyle}
                    >
                      {showNewPassword2 ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            {allowed && !needsSetup ? (
              <div style={{ marginBottom: 12 }}>
                <div className="label">{tLogin(language, "password")}</div>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    placeholder={tLogin(language, "password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? tLogin(language, "hidePassword")
                        : tLogin(language, "showPassword")
                    }
                    style={eyeBtnStyle}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={requestForgotPassword}
                    disabled={forgotBusy}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--muted-2)",
                      cursor: forgotBusy ? "not-allowed" : "pointer",
                      fontSize: 12,
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {forgotBusy
                      ? tLogin(language, "forgotCreating")
                      : tLogin(language, "forgotPassword")}
                  </button>
                </div>
              </div>
            ) : null}

            {(error || forgotInfo) && (
              <div
                className={`card app-inline-alert ${
                  error ? "app-inline-alert-danger" : "app-inline-alert-neutral"
                }`}
              >
                <span style={{ fontWeight: 700 }}>
                  {error ?? forgotInfo}
                </span>
              </div>
            )}

            <button
              className="btn btn-accent"
              disabled={busy || checking || allowed !== true}
              style={{ width: "100%" }}
            >
              {busy
                ? tLogin(language, "pleaseWait")
                : needsSetup
                  ? tLogin(language, "savePasswordAndLogin")
                  : tLogin(language, "login")}
            </button>

            <div className="login-legal-links">
              <Link href={privacyHref} className="login-legal-link">
                {tLogin(language, "privacy")}
              </Link>

              <span className="login-legal-separator">•</span>

              <Link href={termsHref} className="login-legal-link">
                {tLogin(language, "terms")}
              </Link>
            </div>

            <div style={{ color: "var(--muted-2)", marginTop: 10, fontSize: 12 }}>
              {tLogin(language, "loginFootnote")}
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
