"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  applyTenantHeadBranding,
  applyTenantThemeToDocument,
  getTenantAppleTouchIconHref,
  getTenantManifestHref,
  resetTenantThemeOnDocument,
  resolveTenantTheme,
  TenantTheme,
} from "@/lib/tenantBranding";
import PushOnboarding from "@/components/PushOnboarding";
import {
  APP_UI_LANGUAGES,
  type AppUiLanguage,
  getLanguageLabel,
  normalizeAppUiLanguage,
  translate,
} from "@/lib/i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faChartColumn,
  faListCheck,
  faStethoscope,
  faLock
} from "@fortawesome/free-solid-svg-icons";
import { SquarePen, TreePalm } from "lucide-react";
import NotesClockIcon from "@/components/icons/NotesClockIcon";
import LockIcon from "@/components/icons/LockIcon";
import WeeklyStaffPlanIcon from "@/components/icons/WeeklyStaffPlanIcon";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;
  const userId = v["userId"];
  const fullName = v["fullName"];
  const role = v["role"];
  const language = v["language"];
  const companyId = v["companyId"];
  const companyName = v["companyName"];
  const companySubdomain = v["companySubdomain"];
  const companyLogoUrl = v["companyLogoUrl"];
  const primaryColor = v["primaryColor"];

  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN") &&
    (language === "DE" ||
      language === "EN" ||
      language === "IT" ||
      language === "TR" ||
      language === "SQ" ||
      language === "KU" || 
      language === "RO") &&
    typeof companyId === "string" &&
    typeof companyName === "string" &&
    typeof companySubdomain === "string" &&
    (typeof companyLogoUrl === "string" || companyLogoUrl === null) &&
    (typeof primaryColor === "string" || primaryColor === null)
  );
}

function parseMe(j: unknown): SessionData | null {
  if (!isRecord(j)) return null;
  const s = j["session"];
  if (s === null) return null;
  return isSessionData(s) ? s : null;
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

type BrandConfig = {
  appTitle: string;
  displayName: string;
  slogan: string;
  logoUrl: string | null;
  theme: TenantTheme;
  companySubdomain: string;
};

function buildBrandConfig(session: SessionData | null): BrandConfig {
  const fallback: BrandConfig = {
    appTitle: "Mitarbeiterportal",
    displayName: "Mitarbeiterportal",
    slogan: "#firmenportal",
    logoUrl: null,
    theme: resolveTenantTheme(""),
    companySubdomain: "",
  };

  if (!session) {
    return fallback;
  }

  const companyName = session.companyName.trim();

  return {
    appTitle: `${companyName} Mitarbeiterportal`,
    displayName: companyName,
    slogan: "#einsatzplanung",
    logoUrl: session.companyLogoUrl,
    theme: resolveTenantTheme(session.companySubdomain, session.primaryColor),
    companySubdomain: session.companySubdomain,
  };
}

function initialsFromName(fullName: string) {
  const parts = fullName
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

type NavItem = {
  href: string;
  labelKey: AppShellTextKey;
  icon: React.ReactNode;
};

type OpenTasksApiTask = {
  id: string;
  status: "OPEN" | "COMPLETED";
};

type OpenTasksApiResponse = {
  tasks: OpenTasksApiTask[];
};

type AdminRequestsApiResponse = {
  ok: true;
  requests: {
    status: "PENDING" | "APPROVED" | "REJECTED";
  }[];
};

type AppShellTextKey =
  | "capture"
  | "calendar"
  | "overview"
  | "tasks"
  | "dashboard"
  | "appointments"
  | "weeklyPlan"
  | "vacationRequests"
  | "sickRequests"
  | "correctionRequests"
  | "passwordReset"
  | "menuOpen"
  | "menuClose"
  | "close"
  | "logout"
  | "loading"
  | "admin"
  | "employee"
  | "adminArea"
  | "employeeArea"
  | "openItems"
  | "openTasksAria"
  | "language"
  | "languageSaving"
  | "languageSaved"
  | "languageSaveError";

const APP_SHELL_TEXTS: Record<AppShellTextKey, Record<AppUiLanguage, string>> = {
  capture: {
    DE: "Erfassung",
    EN: "Time Entry",
    IT: "Rilevazione",
    TR: "Zaman Girişi",
    SQ: "Regjistrimi",
    KU: "Tomarkirin",
    RO: "Înregistrare",
  },
  calendar: {
    DE: "Kalender",
    EN: "Calendar",
    IT: "Calendario",
    TR: "Takvim",
    SQ: "Kalendari",
    KU: "Salname",
    RO: "Calendar",
  },
  overview: {
    DE: "Übersicht",
    EN: "Overview",
    IT: "Panoramica",
    TR: "Genel Bakış",
    SQ: "Përmbledhje",
    KU: "Têgihiştin",
    RO: "Prezentare generală",
  },
  tasks: {
    DE: "Aufgaben",
    EN: "Tasks",
    IT: "Attività",
    TR: "Görevler",
    SQ: "Detyrat",
    KU: "Erk",
    RO: "Sarcini",
  },
  dashboard: {
    DE: "Dashboard",
    EN: "Dashboard",
    IT: "Dashboard",
    TR: "Panel",
    SQ: "Paneli",
    KU: "Dashboard",
    RO: "Tablou de bord",
  },
  appointments: {
    DE: "Termine",
    EN: "Appointments",
    IT: "Appuntamenti",
    TR: "Randevular",
    SQ: "Takimet",
    KU: "Civîn",
    RO: "Programări",
  },
  weeklyPlan: {
    DE: "Wochenplan",
    EN: "Weekly Plan",
    IT: "Piano Settimanale",
    TR: "Haftalık Plan",
    SQ: "Plani Javor",
    KU: "Plana Heftane",
    RO: "Plan săptămânal",
  },
  vacationRequests: {
    DE: "Urlaubsanträge",
    EN: "Vacation Requests",
    IT: "Richieste di Ferie",
    TR: "İzin Talepleri",
    SQ: "Kërkesat për Pushim",
    KU: "Daxwazên Îzinê",
    RO: "Cereri de concediu",
  },
  sickRequests: {
    DE: "Krankheitsanträge",
    EN: "Sick Leave Requests",
    IT: "Richieste di Malattia",
    TR: "Hastalık Talepleri",
    SQ: "Kërkesat për Sëmundje",
    KU: "Daxwazên Nexweşiyê",
    RO: "Cereri de concediu medical",
  },
  correctionRequests: {
    DE: "Nachtragsanträge",
    EN: "Correction Requests",
    IT: "Richieste di Correzione",
    TR: "Düzeltme Talepleri",
    SQ: "Kërkesat për Korrigjim",
    KU: "Daxwazên Rastkirinê",
    RO: "Cereri de corecție",
  },
  passwordReset: {
    DE: "Passwort-Reset",
    EN: "Password Reset",
    IT: "Reimpostazione Password",
    TR: "Şifre Sıfırlama",
    SQ: "Rivendosja e Fjalëkalimit",
    KU: "Nûkirina Şîfreyê",
    RO: "Resetare parolă",
  },
  menuOpen: {
    DE: "Menü öffnen",
    EN: "Open menu",
    IT: "Apri menu",
    TR: "Menüyü aç",
    SQ: "Hap menunë",
    KU: "Menuyê veke",
    RO: "Deschide meniul",
  },
  menuClose: {
    DE: "Menü schließen",
    EN: "Close menu",
    IT: "Chiudi menu",
    TR: "Menüyü kapat",
    SQ: "Mbyll menunë",
    KU: "Menuyê bigire",
    RO: "Închide meniul",
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
  logout: {
    DE: "Logout",
    EN: "Log out",
    IT: "Esci",
    TR: "Çıkış yap",
    SQ: "Dilnişanê derkeve",
    KU: "Derkeve",
    RO: "Deconectare",
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
  admin: {
    DE: "Admin",
    EN: "Admin",
    IT: "Admin",
    TR: "Yönetici",
    SQ: "Admin",
    KU: "Rêvebir",
    RO: "Admin",
  },
  employee: {
    DE: "Mitarbeiter",
    EN: "Employee",
    IT: "Dipendente",
    TR: "Çalışan",
    SQ: "Punonjës",
    KU: "Karmend",
    RO: "Angajat",
  },
  adminArea: {
    DE: "Adminbereich",
    EN: "Admin Area",
    IT: "Area Admin",
    TR: "Yönetici Alanı",
    SQ: "Zona e Adminit",
    KU: "Qada Rêvebirê",
    RO: "Zona admin",
  },
  employeeArea: {
    DE: "Mitarbeiterbereich",
    EN: "Employee Area",
    IT: "Area Dipendenti",
    TR: "Çalışan Alanı",
    SQ: "Zona e Punonjësit",
    KU: "Qada Karmendan",
    RO: "Zona angajat",
  },
  openItems: {
    DE: "Offene Elemente",
    EN: "Open items",
    IT: "Elementi aperti",
    TR: "Açık öğeler",
    SQ: "Elemente të hapura",
    KU: "Hêmanên vekirî",
    RO: "Elemente deschise",
  },
  openTasksAria: {
    DE: "offene Aufgaben",
    EN: "open tasks",
    IT: "attività aperte",
    TR: "açık görev",
    SQ: "detyra të hapura",
    KU: "erkên vekirî",
    RO: "sarcini deschise",
  },
  language: {
    DE: "Sprache",
    EN: "Language",
    IT: "Lingua",
    TR: "Dil",
    SQ: "Gjuha",
    KU: "Ziman",
    RO: "Limba",
  },
  languageSaving: {
    DE: "Sprache wird gespeichert...",
    EN: "Saving language...",
    IT: "Salvataggio lingua...",
    TR: "Dil kaydediliyor...",
    SQ: "Gjuha po ruhet...",
    KU: "Ziman tê tomar kirin...",
    RO: "Se salvează limba...",
  },
  languageSaved: {
    DE: "Sprache gespeichert.",
    EN: "Language saved.",
    IT: "Lingua salvata.",
    TR: "Dil kaydedildi.",
    SQ: "Gjuha u ruajt.",
    KU: "Ziman hate tomar kirin.",
    RO: "Limba a fost salvată.",
  },
  languageSaveError: {
    DE: "Sprache konnte nicht gespeichert werden.",
    EN: "Language could not be saved.",
    IT: "Impossibile salvare la lingua.",
    TR: "Dil kaydedilemedi.",
    SQ: "Gjuha nuk mund të ruhej.",
    KU: "Ziman nehat tomar kirin.",
    RO: "Limba nu a putut fi salvată.",
  },
};

function tAppShell(language: AppUiLanguage, key: AppShellTextKey): string {
  return translate(language, key, APP_SHELL_TEXTS);
}

function isAdminRequestsApiResponse(v: unknown): v is AdminRequestsApiResponse {
  if (!isRecord(v)) return false;
  if (v["ok"] !== true) return false;

  const requests = v["requests"];
  if (!Array.isArray(requests)) return false;

  return requests.every(
    (r) =>
      isRecord(r) &&
      (r["status"] === "PENDING" ||
        r["status"] === "APPROVED" ||
        r["status"] === "REJECTED")
  );
}

function isOpenTasksApiTask(v: unknown): v is OpenTasksApiTask {
  if (!isRecord(v)) return false;
  const id = v["id"];
  const status = v["status"];

  return (
    typeof id === "string" &&
    (status === "OPEN" || status === "COMPLETED")
  );
}

function isOpenTasksApiResponse(v: unknown): v is OpenTasksApiResponse {
  return (
    isRecord(v) &&
    Array.isArray(v["tasks"]) &&
    v["tasks"].every(isOpenTasksApiTask)
  );
}

export default function AppShell({
  children,
  activeLabel,
}: {
  children: React.ReactNode;
  activeLabel?: string;
}) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem("app_session_cache");
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      return isSessionData(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });
  const [sessionLoading, setSessionLoading] = useState(true);
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [openVacationRequests, setOpenVacationRequests] = useState(0);
  const [openSickRequests, setOpenSickRequests] = useState(0);
  const [openCorrectionRequests, setOpenCorrectionRequests] = useState(0);

  const [, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageMessage, setLanguageMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadSession() {
      try {
        setSessionLoading(true);

        const res = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const json = (await res.json()) as unknown;

        const parsed = parseMe(json);

        if (!alive) return;

        setSession(parsed);

        try {
          if (parsed) {
            window.localStorage.setItem("app_session_cache", JSON.stringify(parsed));
          } else {
            window.localStorage.removeItem("app_session_cache");
          }
        } catch {
          // ignore localStorage errors
        }
      } catch {
        if (!alive) return;

        setSession(null);

        try {
          window.localStorage.removeItem("app_session_cache");
        } catch {
          // ignore localStorage errors
        }
      } finally {
        if (!alive) return;
        setSessionLoading(false);
      }
    }

    void loadSession();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const loadOpenTaskCount = useCallback(async (): Promise<void> => {
    if (!session || session.role !== "EMPLOYEE") {
      setOpenTaskCount(0);
      return;
    }

    try {
      const res = await fetch("/api/tasks?status=OPEN", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const json: unknown = await res.json().catch(() => ({}));

      if (!res.ok || !isOpenTasksApiResponse(json)) {
        setOpenTaskCount(0);
        return;
      }

      setOpenTaskCount(json.tasks.length);
    } catch {
      setOpenTaskCount(0);
    }
  }, [session]);

  const loadAdminRequestCounts = useCallback(async (): Promise<void> => {
    if (!session || session.role !== "ADMIN") {
      setOpenVacationRequests(0);
      setOpenSickRequests(0);
      setOpenCorrectionRequests(0);
      return;
    }

    try {
      const [vacRes, sickRes, corrRes] = await Promise.all([
        fetch("/api/admin/absence-requests?type=VACATION&status=PENDING", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/absence-requests?type=SICK&status=PENDING", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/time-entry-correction-requests?status=PENDING", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const vacJson: unknown = await vacRes.json().catch(() => ({}));
      const sickJson: unknown = await sickRes.json().catch(() => ({}));
      const corrJson: unknown = await corrRes.json().catch(() => ({}));

      if (vacRes.ok && isAdminRequestsApiResponse(vacJson)) {
        setOpenVacationRequests(vacJson.requests.length);
      }

      if (sickRes.ok && isAdminRequestsApiResponse(sickJson)) {
        setOpenSickRequests(sickJson.requests.length);
      }

      if (corrRes.ok && isAdminRequestsApiResponse(corrJson)) {
        setOpenCorrectionRequests(corrJson.requests.length);
      }
    } catch {
      setOpenVacationRequests(0);
      setOpenSickRequests(0);
      setOpenCorrectionRequests(0);
    }
  }, [session]);

  const pathnameSuggestsAdmin = pathname.startsWith("/admin");
  const resolvedRole: "ADMIN" | "EMPLOYEE" =
    session?.role ?? (pathnameSuggestsAdmin ? "ADMIN" : "EMPLOYEE");
  const isAdmin = resolvedRole === "ADMIN";
  const currentLanguage = normalizeAppUiLanguage(session?.language);

  const brand = session ? buildBrandConfig(session) : null;
  const brandLogoSrc = brand
    ? normalizeLogoSrc(brand.logoUrl, brand.companySubdomain)
    : null;

  const employeeNavItems: NavItem[] = [
    {
      href: "/erfassung",
      labelKey: "capture",
      icon: <NotesClockIcon style={{color:"var(--tenant-icon-filter-unpaid"}} />,
    },
    {
      href: "/kalender",
      labelKey: "calendar",
      icon: <FontAwesomeIcon icon={faCalendar} />,
    },
    {
      href: "/uebersicht",
      labelKey: "overview",
      icon: <FontAwesomeIcon icon={faChartColumn} />,
    },
    {
      href: "/aufgaben",
      labelKey: "tasks",
      icon: <FontAwesomeIcon icon={faListCheck} />,
    },
  ];

  const adminNavItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    labelKey: "dashboard",
    icon: <FontAwesomeIcon icon={faChartColumn} />,
  },
  {
    href: "/admin/appointments",
    labelKey: "appointments",
    icon: <FontAwesomeIcon icon={faCalendar} />,
  },
  {
    href: "/admin/wochenplan",
    labelKey: "weeklyPlan",
    icon: <WeeklyStaffPlanIcon style={{color:"var(--tenant-icon-muted"}}/>,
  },
  {
    href: "/admin/urlaubsantraege",
    labelKey: "vacationRequests",
    icon: <TreePalm />,
  },
  {
    href: "/admin/krankheitsantraege",
    labelKey: "sickRequests",
    icon: <FontAwesomeIcon icon={faStethoscope} />,
  },
  {
    href: "/admin/nachtragsanfragen",
    labelKey: "correctionRequests",
    icon: <SquarePen strokeWidth={2} />,
  },
  {
    href: "/admin/tasks",
    labelKey: "tasks",
    icon: <FontAwesomeIcon icon={faListCheck} />,
  },
  {
    href: "/admin/password-reset",
    labelKey: "passwordReset",
    icon: <LockIcon size={2400} strokewidth={2} />,
  },
];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;
  const navReady = session !== null || !sessionLoading;

  useEffect(() => {
    void loadOpenTaskCount();
    void loadAdminRequestCounts();
  }, [loadOpenTaskCount, loadAdminRequestCounts, pathname]);

  useEffect(() => {
    function onTasksChanged() {
      void loadOpenTaskCount();
    }

    function onAdminRequestsChanged() {
      void loadAdminRequestCounts();
    }

    window.addEventListener("tasks-changed", onTasksChanged);
    window.addEventListener("admin-requests-changed", onAdminRequestsChanged);

    return () => {
      window.removeEventListener("tasks-changed", onTasksChanged);
      window.removeEventListener("admin-requests-changed", onAdminRequestsChanged);
    };
  }, [loadOpenTaskCount, loadAdminRequestCounts]);

  useEffect(() => {
    if (!brand) return;

    applyTenantThemeToDocument(brand.theme);

    return () => {
      resetTenantThemeOnDocument();
    };
  }, [brand]);

  useEffect(() => {
    if (!brand) return;

    applyTenantHeadBranding({
      title: brand.appTitle,
      themeColor: brand.theme.bg,
      appName: brand.displayName,
      manifestHref: getTenantManifestHref(brand.companySubdomain),
      appleTouchIconHref: getTenantAppleTouchIconHref(brand.companySubdomain),
    });
  }, [brand]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!languageMessage) return;

    const timeout = window.setTimeout(() => {
      setLanguageMessage(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [languageMessage]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } finally {
      setMenuOpen(false);
      setMobileOpen(false);
      try {
        window.localStorage.removeItem("app_session_cache");
      } catch {
        // ignore localStorage errors
      }
      const targetLogin =
        session?.companySubdomain
          ? `/${session.companySubdomain}/login`
          : "/login";

      window.location.href = targetLogin;
    }
  }

  async function handleLanguageChange(nextLanguage: AppUiLanguage) {
    if (!session) return;
    if (nextLanguage === currentLanguage) return;

    setLanguageSaving(true);
    setLanguageMessage(null);

    try {
      const response = await fetch("/api/me/language", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          language: nextLanguage,
        }),
      });

      const json: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setLanguageMessage(tAppShell(currentLanguage, "languageSaveError"));
        return;
      }

      setSession((prev) =>
        prev
          ? {
              ...prev,
              language: nextLanguage,
            }
          : prev
      );

      try {
        const cachedRaw = window.localStorage.getItem("app_session_cache");
        const cachedParsed: unknown = cachedRaw ? JSON.parse(cachedRaw) : null;

        if (isSessionData(cachedParsed)) {
          window.localStorage.setItem(
            "app_session_cache",
            JSON.stringify({
              ...cachedParsed,
              language: nextLanguage,
            })
          );
        }
      } catch {
        // ignore localStorage errors
      }

      if (
        isRecord(json) &&
        json["ok"] === true &&
        typeof json["language"] === "string"
      ) {
        document.documentElement.lang = nextLanguage.toLowerCase();
      }

      setLanguageMessage(tAppShell(nextLanguage, "languageSaved"));
    } catch {
      setLanguageMessage(tAppShell(currentLanguage, "languageSaveError"));
    } finally {
      setLanguageSaving(false);
    }
  }

  const userName =
    sessionLoading && !session
      ? tAppShell(currentLanguage, "loading")
      : session?.fullName ??
        (isAdmin
          ? tAppShell(currentLanguage, "admin")
          : tAppShell(currentLanguage, "employee"));

  const userInitials =
    sessionLoading && !session
      ? "…"
      : session
        ? initialsFromName(session.fullName)
        : isAdmin
          ? "A"
          : "M";

  return (
    <div style={{ padding: "18px 0 42px" }}>
      <div className="container-app">
        {/* MOBILE TOPBAR (nur < md) */}
        <div
          className="md:hidden appshell-glass-panel"
          style={{
            position: "relative",
            zIndex: 1,
            left: 0,
            right: 0,
            padding: 12,
            paddingTop: "calc(12px + env(safe-area-inset-top))",
            marginBottom: 12,
            borderRadius: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={tAppShell(currentLanguage, "menuOpen")}
              className="appshell-icon-btn"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              ☰
            </button>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 0,
                  }}
                >
                  {brandLogoSrc ? (
                    <img
                      src={brandLogoSrc}
                      alt={`${brand?.displayName ?? "Logo"} Logo`}
                      style={{
                        width: 92,
                        height: 92,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : brand ? (
                    <div
                      className="brand-logo-fallback"
                      style={{
                        width: 110,
                        height: 34,
                        fontSize: 12,
                      }}
                    >
                      {brand.displayName}
                    </div>
                  ) : null}
                  <div
                    style={{
                      fontWeight: 900,
                      color: "var(--text)",
                      lineHeight: 1.05,
                      marginTop: 6,
                    }}
                  >
                    {brand?.displayName ?? ""}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 220,
                    }}
                  >
                    {activeLabel ?? brand?.slogan ?? ""}
                  </div>
                </div>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="appshell-user-avatar"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {userInitials}
            </div>
          </div>
        </div>

        {/* MOBILE SIDEBAR (nur < md) */}
        {mobileOpen && (
          <div
            className="md:hidden"
            style={{ position: "fixed", inset: 0, zIndex: 80, overflow: "hidden" }}
          >
          <button
            type="button"
            aria-label={tAppShell(currentLanguage, "menuClose")}
            onClick={() => setMobileOpen(false)}
            className="appshell-mobile-backdrop"
          />

            <div className="appshell-drawer-surface appshell-mobile-drawer">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 12,
                      color: "var(--muted)",
                    }}
                  >
                    {isAdmin
                      ? tAppShell(currentLanguage, "admin")
                      : tAppShell(currentLanguage, "employee")}
                  </div>
                  <div
                    style={{
                      fontWeight: 900,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {userName}
                  </div>

                  <div
                    className="appshell-section-stripe"
                    style={{
                      marginTop: 10,
                      height: 4,
                      width: 54,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={tAppShell(currentLanguage, "close")}
                  className="appshell-icon-btn"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    fontWeight: 900,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ height: 6 }} />

              <nav className="appshell-mobile-nav">
                {(navReady ? navItems : []).map((item) => {
                  const active = isActive(pathname, item.href);
                  const showTaskBadge =
                    !isAdmin && item.href === "/aufgaben" && openTaskCount > 0;

                  const showVacationBadge =
                    isAdmin && item.href === "/admin/urlaubsantraege" && openVacationRequests > 0;

                  const showSickBadge =
                    isAdmin && item.href === "/admin/krankheitsantraege" && openSickRequests > 0;

                  const showCorrectionBadge =
                    isAdmin && item.href === "/admin/nachtragsanfragen" && openCorrectionRequests > 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`appshell-nav-item ${active ? "is-active" : ""}`}
                    >
                      <span className="appshell-nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <span className="appshell-nav-label">
                          {tAppShell(currentLanguage, item.labelKey)}
                        </span>

                        {showTaskBadge || showVacationBadge || showSickBadge || showCorrectionBadge ? (
                          <span
                            aria-label={tAppShell(currentLanguage, "openItems")}
                            className="appshell-nav-badge appshell-nav-badge-mobile"
                          >
                            {showTaskBadge
                              ? openTaskCount
                              : showVacationBadge
                                ? openVacationRequests
                                : showSickBadge
                                  ? openSickRequests
                                  : openCorrectionRequests}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div style={{ flex: 1 }} />

              <div className="appshell-language-panel">
                <label className="appshell-language-label">
                  {tAppShell(currentLanguage, "language")}
                </label>

                <select
                  className="input appshell-language-select"
                  value={currentLanguage}
                  onChange={(event) => {
                    void handleLanguageChange(
                      normalizeAppUiLanguage(event.target.value)
                    );
                  }}
                  disabled={!session || languageSaving}
                >
                  {APP_UI_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {getLanguageLabel(language)}
                    </option>
                  ))}
                </select>

                {languageSaving ? (
                  <div className="appshell-language-message">
                    {tAppShell(currentLanguage, "languageSaving")}
                  </div>
                ) : languageMessage ? (
                  <div className="appshell-language-message">
                    {languageMessage}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="appshell-logout-btn"
              >
                {tAppShell(currentLanguage, "logout")}
              </button>
            </div>
          </div>
        )}

        {/* MOBILE CONTENT */}
        <div className="md:hidden" style={{ minWidth: 0 }}>
          <PushOnboarding language={currentLanguage} />
          {children}
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="appshell-desktop hidden md:grid">
          <aside className="appshell-sidebar">
            <div className="appshell-sidebar-top">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {brandLogoSrc ? (
                  <img
                    src={brandLogoSrc}
                    alt={`${brand?.displayName ?? "Logo"} Logo`}
                    style={{
                      width: 132,
                      height: 132,
                      objectFit: "contain",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                ) : brand ? (
                  <div
                    className="brand-logo-fallback"
                    style={{
                      width: 120,
                      height: 40,
                      fontSize: 12,
                    }}
                  >
                    {brand.displayName}
                  </div>
                ) : null}
                <div style={{ minWidth: 0, paddingTop: 6 }}>
                  <div style={{ fontWeight: 900, lineHeight: 1.05 }}>{brand?.displayName ?? ""}</div>
                  <div
                    style={{
                      color: "var(--muted-2)",
                      fontSize: 12,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {activeLabel ?? brand?.slogan ?? ""}
                  </div>
                </div>
              </div>

              <div
                className="appshell-section-stripe"
                style={{
                  marginTop: 14,
                  height: 4,
                  width: 80,
                }}
              />
            </div>

            <nav className="appshell-sidebar-nav">
              {(navReady ? navItems : []).map((item) => {
                const active = isActive(pathname, item.href);
                const showTaskBadge =
                  !isAdmin && item.href === "/aufgaben" && openTaskCount > 0;

                const showVacationBadge =
                  isAdmin && item.href === "/admin/urlaubsantraege" && openVacationRequests > 0;

                const showSickBadge =
                  isAdmin && item.href === "/admin/krankheitsantraege" && openSickRequests > 0;

                const showCorrectionBadge =
                  isAdmin && item.href === "/admin/nachtragsanfragen" && openCorrectionRequests > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`appshell-nav-item ${active ? "is-active" : ""}`}
                  >
                    <span className="appshell-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      <span
                        className="appshell-nav-label"
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                      {tAppShell(currentLanguage, item.labelKey)}
                      </span>

                      {showTaskBadge ||
                      showVacationBadge ||
                      showSickBadge ||
                      showCorrectionBadge ? (
                        <span
                          aria-label={`${openTaskCount} ${tAppShell(
                            currentLanguage,
                            "openTasksAria"
                          )}`}
                          className="appshell-nav-badge appshell-nav-badge-desktop"
                        >
                          {showTaskBadge
                            ? openTaskCount
                            : showVacationBadge
                              ? openVacationRequests
                              : showSickBadge
                                ? openSickRequests
                                : openCorrectionRequests}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="appshell-sidebar-bottom">
              <div className="appshell-language-panel appshell-language-panel-desktop">
                <label className="appshell-language-label">
                  {tAppShell(currentLanguage, "language")}
                </label>

                <select
                  className="input appshell-language-select"
                  value={currentLanguage}
                  onChange={(event) => {
                    void handleLanguageChange(
                      normalizeAppUiLanguage(event.target.value)
                    );
                  }}
                  disabled={!session || languageSaving}
                >
                  {APP_UI_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {getLanguageLabel(language)}
                    </option>
                  ))}
                </select>

                {languageSaving ? (
                  <div className="appshell-language-message">
                    {tAppShell(currentLanguage, "languageSaving")}
                  </div>
                ) : languageMessage ? (
                  <div className="appshell-language-message">
                    {languageMessage}
                  </div>
                ) : null}
              </div>

              <div className="appshell-sidebar-logout-wrap">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="appshell-logout-btn"
                >
                  {tAppShell(currentLanguage, "logout")}
                </button>
              </div>
            </div>
          </aside>

          <div className="appshell-content">
            <div className="topbar" style={{ padding: 14, marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 22,
                      lineHeight: 1.1,
                    }}
                  >
                    {activeLabel ?? brand?.slogan ?? ""}
                  </div>
                  <div
                    style={{
                      color: "var(--muted-2)",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {isAdmin
                      ? tAppShell(currentLanguage, "adminArea")
                      : tAppShell(currentLanguage, "employeeArea")}
                  </div>
                </div>

                <div
                  ref={menuRef}
                  className="appshell-user-chip"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 14,
                  }}
                >
                  <div
                    className="appshell-user-avatar"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      letterSpacing: 0.5,
                    }}
                    aria-hidden="true"
                  >
                    {userInitials}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      lineHeight: 1.1,
                    }}
                  >
                    <div
                      className="appshell-username"
                      style={{ fontWeight: 800, fontSize: 13 }}
                    >
                      {userName}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <span className="appshell-role-badge">
                        {isAdmin
                          ? tAppShell(currentLanguage, "admin")
                          : tAppShell(currentLanguage, "employee")}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "var(--muted-2)",
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {tAppShell(currentLanguage, "language")}:{" "}
                      {getLanguageLabel(currentLanguage)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <PushOnboarding language={currentLanguage} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}