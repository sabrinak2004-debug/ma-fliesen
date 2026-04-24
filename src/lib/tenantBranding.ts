import type React from "react";

export const DEFAULT_THEME_COLOR = "#f4f2ee";
export const DEFAULT_BRAND_ACCENT = "#3f3b3d";
export const DEFAULT_APP_NAME = "Mitarbeiterportal";
export const DEFAULT_APP_SHORT_NAME = "Portal";
export const DEFAULT_APPLE_TOUCH_ICON = "/image_2.jpeg";
export const DEFAULT_MANIFEST_HREF = "/manifest.json";

export type TenantTheme = TenantThemeBase;

type TenantThemeBase = {
  bg: string;
  backgroundStart: string;
  backgroundFadeSoft: string;
  backgroundFadeEnd: string;
  panel: string;
  panel2: string;
  surface: string;
  surfaceStrong: string;
  inputBg: string;
  overlayBg: string;
  border: string;
  border2: string;
  text: string;
  muted: string;
  muted2: string;
  textSoft: string;
  textFaint: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  accentBorder: string;
  panelSoft: string;
  panelStrong: string;
  onAccent: string;
  sidebarStripe: string;
  badgeBg: string;
  badgeText: string;
  rolePillBg: string;
  todayBg: string;
  todayBorder: string;
  workBg: string;
  workBorder: string;
  vacationBg: string;
  vacationBorder: string;
  sickBg: string;
  sickBorder: string;
  holidayBg: string;
  holidayBorder: string;
  holidayText: string;
  floatingButtonBg: string;
  floatingButtonText: string;
  neutralCardBg: string;
  neutralCardBgStrong: string;
  success: string;
  successSoft: string;
  successBorder: string;
  successText: string;
  info: string;
  infoSoft: string;
  infoBorder: string;
  infoText: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;
  warningText: string;
  danger: string;
  danger2: string;
  dangerSoft: string;
  dangerBorder: string;
  dangerText: string;
  iconMuted?: string;
  iconFilter?: string;
  iconFilterVacation?: string;
  iconFilterUnpaid?: string;
};

const DEFAULT_TENANT_THEME: TenantTheme = buildThemeFromBase({
  bg: "#f4f2ee",
  panel: "#ffffff",
  panel2: "#ebe6df",
  surface: "rgba(0, 0, 0, 0.04)",
  surfaceStrong: "rgba(0, 0, 0, 0.06)",
  inputBg: "rgba(0, 0, 0, 0.06)",
  overlayBg: "rgba(255, 255, 255, 0.96)",
  border: "rgba(63, 59, 61, 0.14)",
  border2: "rgba(63, 59, 61, 0.18)",
  text: "#2f2b2c",
  muted: "#6f6963",
  muted2: "#918a83",
  textSoft: "#4c4748",
  textFaint: "#6a6460",
  accent: DEFAULT_BRAND_ACCENT,
  accent2: "#575152",
  onAccent: "#ffffff",
  sidebarStripe: "#3f3b3d",
  badgeBg: "#3f3b3d",
  badgeText: "#ffffff",
  rolePillBg: "rgba(63, 59, 61, 0.14)",
  todayBg: "rgba(63, 59, 61, 0.12)",
  todayBorder: "rgba(63, 59, 61, 0.32)",
  workBg: "rgba(63, 59, 61, 0.10)",
  workBorder: "rgba(63, 59, 61, 0.34)",
  vacationBg: "rgba(200, 193, 184, 0.32)",
  vacationBorder: "rgba(200, 193, 184, 0.62)",
  sickBg: "rgba(87, 81, 82, 0.14)",
  sickBorder: "rgba(87, 81, 82, 0.34)",
  holidayBg: "rgba(200, 193, 184, 0.24)",
  holidayBorder: "rgba(200, 193, 184, 0.52)",
  holidayText: "#575152",
  floatingButtonBg: "#3f3b3d",
  floatingButtonText: "#ffffff",
  neutralCardBg: "rgba(200, 193, 184, 0.14)",
  neutralCardBgStrong: "rgba(200, 193, 184, 0.24)",
});

const TENANT_THEMES: Record<string, TenantTheme> = {
  "ma-fliesen": buildThemeFromBase({
    bg: "#0b0f0c",
    backgroundStart: "#1f2709",
    backgroundFadeSoft: "#1f27090e",
    backgroundFadeEnd: "#0b0f0c",
    panel: "#111613",
    panel2: "#0f1411",
    surface: "rgba(255, 255, 255, 0.03)",
    surfaceStrong: "rgba(255, 255, 255, 0.06)",
    inputBg: "rgba(0, 0, 0, 0.25)",
    overlayBg: "rgba(17, 22, 19, 0.82)",
    border: "rgba(255, 255, 255, 0.08)",
    border2: "rgba(206, 231, 72, 0.25)",
    text: "rgba(255, 255, 255, 0.92)",
    muted: "rgba(255, 255, 255, 0.62)",
    muted2: "rgba(255, 255, 255, 0.45)",
    textSoft: "rgba(255, 255, 255, 0.84)",
    textFaint: "rgba(255, 255, 255, 0.72)",
    accent: "#b8cf3a",
    accent2: "#9db02f",
    onAccent: "#111613",
    sidebarStripe: "#b8cf3a",
    badgeBg: "#b8cf3a",
    badgeText: "#111613",
    rolePillBg: "rgba(184, 207, 58, 0.14)",
    todayBg: "rgba(184, 207, 58, 0.22)",
    todayBorder: "rgba(184, 207, 58, 0.55)",
    workBg: "rgba(184, 207, 58, 0.10)",
    workBorder: "rgba(184, 207, 58, 0.65)",
    vacationBg: "rgba(90, 167, 255, 0.14)",
    vacationBorder: "rgba(90, 167, 255, 0.65)",
    sickBg: "rgba(224, 75, 69, 0.18)",
    sickBorder: "rgba(224, 75, 69, 0.65)",
    holidayBg: "rgba(255, 196, 0, 0.12)",
    holidayBorder: "rgba(255, 196, 0, 0.65)",
    holidayText: "rgba(255, 196, 0, 0.95)",
    floatingButtonBg: "rgba(184, 207, 58, 0.95)",
    floatingButtonText: "rgba(0,0,0,0.9)",
    neutralCardBg: "rgba(255,255,255,0.02)",
    neutralCardBgStrong: "rgba(255,255,255,0.04)",
    iconMuted: "#7F817F",
    iconFilter: "#A63D38",
    iconFilterVacation: "#467DBA",
    iconFilterUnpaid: "#B89007",
  }),
  beispielbetrieb: buildThemeFromBase({
    bg: "#f4f2ee",
    backgroundStart: "#fff6ed",
    backgroundFadeSoft: "rgba(216, 216, 216, 0.14)",
    backgroundFadeEnd: "#f4f2ee",
    panel: "#ffffff",
    panel2: "#ebe6df",
    surface: "rgba(0, 0, 0, 0.04)",
    surfaceStrong: "rgba(0, 0, 0, 0.06)",
    inputBg: "rgba(0, 0, 0, 0.06)",
    overlayBg: "rgba(255, 255, 255, 0.96)",
    border: "rgba(63, 59, 61, 0.14)",
    border2: "rgba(63, 59, 61, 0.18)",
    text: "#2f2b2c",
    muted: "#6f6963",
    muted2: "#918a83",
    textSoft: "#4c4748",
    textFaint: "#6a6460",
    accent: "#3f3b3d",
    accent2: "#575152",
    onAccent: "#bebebe",
    sidebarStripe: "#3f3b3d",
    badgeBg: "#3f3b3d",
    badgeText: "#ffffff",
    rolePillBg: "rgba(63, 59, 61, 0.14)",
    todayBg: "rgba(63, 59, 61, 0.12)",
    todayBorder: "rgba(63, 59, 61, 0.32)",
    workBg: "rgba(63, 59, 61, 0.10)",
    workBorder: "rgba(63, 59, 61, 0.34)",
    vacationBg: "rgba(59, 130, 246, 0.16)",
    vacationBorder: "rgba(59, 130, 246, 0.62)",
    sickBg: "rgba(220, 38, 38, 0.16)",
    sickBorder: "rgba(220, 38, 38, 0.62)",
    holidayBg: "rgba(87, 143, 116, 0.16)",
    holidayBorder: "rgba(87, 143, 116, 0.62)",
    holidayText: "#578F74",
    floatingButtonBg: "#3f3b3d",
    floatingButtonText: "#ffffff",
    neutralCardBg: "rgba(200, 193, 184, 0.14)",
    neutralCardBgStrong: "rgba(200, 193, 184, 0.24)",
    iconFilter: "#DF6362",
    iconFilterVacation: "#71A1EF",
    iconFilterUnpaid: "#84AA97",
  }),
};

export function createTenantTheme(
  input: {
    bg: string;
    backgroundStart?: string;
    backgroundFadeSoft?: string;
    backgroundFadeEnd?: string;
    panel: string;
    panel2: string;
    surface: string;
    surfaceStrong: string;
    inputBg: string;
    overlayBg: string;
    border: string;
    border2: string;
    text: string;
    muted: string;
    muted2: string;
    textSoft: string;
    textFaint: string;
    accent: string;
    accent2?: string;
    onAccent?: string;
    sidebarStripe?: string;
    badgeBg?: string;
    badgeText?: string;
    rolePillBg?: string;
    todayBg?: string;
    todayBorder?: string;
    workBg?: string;
    workBorder?: string;
    vacationBg?: string;
    vacationBorder?: string;
    sickBg?: string;
    sickBorder?: string;
    holidayBg?: string;
    holidayBorder?: string;
    holidayText?: string;
    floatingButtonBg?: string;
    floatingButtonText?: string;
    neutralCardBg?: string;
    neutralCardBgStrong?: string;
    iconMuted?: string;
    iconFilter?: string;
    iconFilterVacation?: string;
    iconFilterUnpaid?: string;
  }
): TenantTheme {
  return buildThemeFromBase({
    ...input,
    onAccent: input.onAccent ?? "#111613",
  });
}

export function normalizeTenantSubdomain(value: string): string {
  return value.trim().toLowerCase();
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{6})$/.test(value);
}

export function normalizeThemeColor(value: string | null | undefined): string {
  if (typeof value === "string" && isHexColor(value)) {
    return value;
  }

  return DEFAULT_BRAND_ACCENT;
}

export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  if (!isHexColor(hex)) {
    return null;
  }

  const normalized = hex.slice(1);

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbaFromHex(hex: string, alpha: number, fallback: string): string {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return fallback;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function buildThemeFromBase(
  base: {
    bg: string;
    backgroundStart?: string;
    backgroundFadeSoft?: string;
    backgroundFadeEnd?: string;
    panel: string;
    panel2: string;
    surface: string;
    surfaceStrong: string;
    inputBg: string;
    overlayBg: string;
    border: string;
    border2: string;
    text: string;
    muted: string;
    muted2: string;
    textSoft: string;
    textFaint: string;
    accent: string;
    accent2?: string;
    onAccent: string;
    sidebarStripe?: string;
    badgeBg?: string;
    badgeText?: string;
    rolePillBg?: string;
    todayBg?: string;
    todayBorder?: string;
    workBg?: string;
    workBorder?: string;
    vacationBg?: string;
    vacationBorder?: string;
    sickBg?: string;
    sickBorder?: string;
    holidayBg?: string;
    holidayBorder?: string;
    holidayText?: string;
    floatingButtonBg?: string;
    floatingButtonText?: string;
    neutralCardBg?: string;
    neutralCardBgStrong?: string;
    iconMuted?: string;
    iconFilter?: string;
    iconFilterVacation?: string;
    iconFilterUnpaid?: string;
  }
): TenantTheme {
  const accent = normalizeThemeColor(base.accent);
  const accent2 =
    typeof base.accent2 === "string" && isHexColor(base.accent2)
      ? base.accent2
      : accent;

  return {
    bg: base.bg,
    backgroundStart: base.backgroundStart ?? base.bg,
    backgroundFadeSoft:
      base.backgroundFadeSoft ??
      rgbaFromHex(accent, 0.16, "rgba(107, 107, 107, 0.16)"),
    backgroundFadeEnd: base.backgroundFadeEnd ?? base.bg,
    panel: base.panel,
    panel2: base.panel2,
    surface: base.surface,
    surfaceStrong: base.surfaceStrong,
    inputBg: base.inputBg,
    overlayBg: base.overlayBg,
    border: base.border,
    border2: base.border2,
    text: base.text,
    muted: base.muted,
    muted2: base.muted2,
    textSoft: base.textSoft,
    textFaint: base.textFaint,
    accent,
    accent2,
    accentSoft: rgbaFromHex(accent, 0.14, "rgba(184, 207, 58, 0.14)"),
    accentBorder: rgbaFromHex(accent, 0.35, "rgba(184, 207, 58, 0.35)"),
    panelSoft: rgbaFromHex(accent, 0.08, "rgba(184, 207, 58, 0.08)"),
    panelStrong: rgbaFromHex(accent, 0.18, "rgba(184, 207, 58, 0.18)"),
    onAccent: base.onAccent,
    sidebarStripe: base.sidebarStripe ?? accent,
    badgeBg: base.badgeBg ?? accent,
    badgeText: base.badgeText ?? base.onAccent,
    rolePillBg:
      base.rolePillBg ?? rgbaFromHex(accent, 0.14, "rgba(184, 207, 58, 0.14)"),
    todayBg:
      base.todayBg ?? rgbaFromHex(accent, 0.22, "rgba(184, 207, 58, 0.22)"),
    todayBorder:
      base.todayBorder ?? rgbaFromHex(accent, 0.55, "rgba(184, 207, 58, 0.55)"),
    workBg:
      base.workBg ?? rgbaFromHex(accent, 0.10, "rgba(184, 207, 58, 0.10)"),
    workBorder:
      base.workBorder ?? rgbaFromHex(accent, 0.65, "rgba(184, 207, 58, 0.65)"),
    vacationBg: base.vacationBg ?? "rgba(90, 167, 255, 0.14)",
    vacationBorder: base.vacationBorder ?? "rgba(90, 167, 255, 0.65)",
    sickBg: base.sickBg ?? "rgba(224, 75, 69, 0.18)",
    sickBorder: base.sickBorder ?? "rgba(224, 75, 69, 0.65)",
    holidayBg: base.holidayBg ?? "rgba(255, 196, 0, 0.12)",
    holidayBorder: base.holidayBorder ?? "rgba(255, 196, 0, 0.65)",
    holidayText: base.holidayText ?? "rgba(255, 196, 0, 0.95)",
    floatingButtonBg: base.floatingButtonBg ?? accent,
    floatingButtonText: base.floatingButtonText ?? base.onAccent,
    neutralCardBg: base.neutralCardBg ?? "rgba(255,255,255,0.02)",
    neutralCardBgStrong: base.neutralCardBgStrong ?? "rgba(255,255,255,0.04)",
    success: accent,
    successSoft: rgbaFromHex(accent, 0.14, "rgba(184, 207, 58, 0.14)"),
    successBorder: rgbaFromHex(accent, 0.35, "rgba(184, 207, 58, 0.35)"),
    successText: accent,
    info: base.vacationBorder ?? "rgba(90, 167, 255, 0.65)",
    infoSoft: base.vacationBg ?? "rgba(90, 167, 255, 0.14)",
    infoBorder: base.vacationBorder ?? "rgba(90, 167, 255, 0.65)",
    infoText: base.vacationBorder ?? "rgba(90, 167, 255, 0.65)",
    warning: base.holidayText ?? "rgba(255, 196, 0, 0.95)",
    warningSoft: base.holidayBg ?? "rgba(255, 196, 0, 0.12)",
    warningBorder: base.holidayBorder ?? "rgba(255, 196, 0, 0.65)",
    warningText: base.holidayText ?? "rgba(255, 196, 0, 0.95)",
    danger: base.sickBorder ?? "#e04b45",
    danger2: "#c63b36",
    dangerSoft: base.sickBg ?? "rgba(224, 75, 69, 0.18)",
    dangerBorder: base.sickBorder ?? "rgba(224, 75, 69, 0.65)",
    dangerText: base.sickBorder ?? "#e04b45",
    iconMuted: base.iconMuted,
    iconFilter: base.iconFilter,
    iconFilterVacation: base.iconFilterVacation,
    iconFilterUnpaid: base.iconFilterUnpaid,
  };
};

export function resolveTenantTheme(
  subdomain: string,
  primaryColor?: string | null
): TenantTheme {
  const normalizedSubdomain = normalizeTenantSubdomain(subdomain);
  const preset = TENANT_THEMES[normalizedSubdomain];

  if (preset) {
    return preset;
  }

  if (primaryColor) {
    return createTenantTheme({
      bg: DEFAULT_TENANT_THEME.bg,
      panel: DEFAULT_TENANT_THEME.panel,
      panel2: DEFAULT_TENANT_THEME.panel2,
      surface: DEFAULT_TENANT_THEME.surface,
      surfaceStrong: DEFAULT_TENANT_THEME.surfaceStrong,
      inputBg: DEFAULT_TENANT_THEME.inputBg,
      overlayBg: DEFAULT_TENANT_THEME.overlayBg,
      border: DEFAULT_TENANT_THEME.border,
      border2: DEFAULT_TENANT_THEME.border2,
      text: DEFAULT_TENANT_THEME.text,
      muted: DEFAULT_TENANT_THEME.muted,
      muted2: DEFAULT_TENANT_THEME.muted2,
      textSoft: DEFAULT_TENANT_THEME.textSoft,
      textFaint: DEFAULT_TENANT_THEME.textFaint,
      accent: primaryColor,
      accent2: primaryColor,
      onAccent: DEFAULT_TENANT_THEME.onAccent,
      sidebarStripe: primaryColor,
      badgeBg: primaryColor,
      badgeText: DEFAULT_TENANT_THEME.badgeText,
      rolePillBg: DEFAULT_TENANT_THEME.rolePillBg,
      todayBg: DEFAULT_TENANT_THEME.todayBg,
      todayBorder: DEFAULT_TENANT_THEME.todayBorder,
      workBg: DEFAULT_TENANT_THEME.workBg,
      workBorder: DEFAULT_TENANT_THEME.workBorder,
      vacationBg: DEFAULT_TENANT_THEME.vacationBg,
      vacationBorder: DEFAULT_TENANT_THEME.vacationBorder,
      sickBg: DEFAULT_TENANT_THEME.sickBg,
      sickBorder: DEFAULT_TENANT_THEME.sickBorder,
      holidayBg: DEFAULT_TENANT_THEME.holidayBg,
      holidayBorder: DEFAULT_TENANT_THEME.holidayBorder,
      holidayText: DEFAULT_TENANT_THEME.holidayText,
      floatingButtonBg: primaryColor,
      floatingButtonText: DEFAULT_TENANT_THEME.floatingButtonText,
      neutralCardBg: DEFAULT_TENANT_THEME.neutralCardBg,
      neutralCardBgStrong: DEFAULT_TENANT_THEME.neutralCardBgStrong,
    });
  }

  return DEFAULT_TENANT_THEME;
}

export function getTenantAssetBasePath(subdomain: string): string {
  const normalized = normalizeTenantSubdomain(subdomain);

  if (!normalized) {
    return "";
  }

  return `/tenant-assets/${normalized}`;
}

export function getTenantIcon192Href(subdomain: string): string {
  const basePath = getTenantAssetBasePath(subdomain);
  return basePath ? `${basePath}/icon-192.jpeg` : DEFAULT_APPLE_TOUCH_ICON;
}

export function getTenantIcon512Href(subdomain: string): string {
  const basePath = getTenantAssetBasePath(subdomain);
  return basePath ? `${basePath}/icon-512.jpeg` : DEFAULT_APPLE_TOUCH_ICON;
}

export function getTenantAppleTouchIconHref(subdomain: string): string {
  const basePath = getTenantAssetBasePath(subdomain);
  return basePath ? `${basePath}/apple-touch-icon.png` : DEFAULT_APPLE_TOUCH_ICON;
}

export function getTenantManifestHref(subdomain: string): string {
  const normalized = normalizeTenantSubdomain(subdomain);

  if (!normalized) {
    return DEFAULT_MANIFEST_HREF;
  }

  return `/api/manifest?company=${encodeURIComponent(normalized)}`;
}

function ensureMetaTag(
  selector: string,
  create: () => HTMLMetaElement
): HTMLMetaElement {
  const existing = document.head.querySelector(selector);

  if (existing instanceof HTMLMetaElement) {
    return existing;
  }

  const element = create();
  document.head.appendChild(element);
  return element;
}

function ensureLinkTag(
  selector: string,
  create: () => HTMLLinkElement
): HTMLLinkElement {
  const existing = document.head.querySelector(selector);

  if (existing instanceof HTMLLinkElement) {
    return existing;
  }

  const element = create();
  document.head.appendChild(element);
  return element;
}

export function getTenantThemeStyle(
  theme: TenantTheme
): React.CSSProperties {
  const rgb = hexToRgb(theme.accent);

  const style: React.CSSProperties & Record<string, string> = {
    "--bg": theme.bg,
    "--tenant-background-start": theme.backgroundStart,
    "--tenant-background-fade-soft": theme.backgroundFadeSoft,
    "--tenant-background-fade-end": theme.backgroundFadeEnd,
    "--panel": theme.panel,
    "--panel-2": theme.panel2,
    "--surface": theme.surface,
    "--surface-strong": theme.surfaceStrong,
    "--input-bg": theme.inputBg,
    "--overlay-bg": theme.overlayBg,
    "--border": theme.border,
    "--border-2": theme.border2,
    "--text": theme.text,
    "--muted": theme.muted,
    "--muted-2": theme.muted2,
    "--tenant-icon-muted": theme.iconMuted ?? theme.muted2,
    "--tenant-icon-filter": theme.iconFilter ?? theme.muted2,
    "--tenant-icon-filter-vacation": theme.iconFilterVacation ?? theme.muted2,
    "--tenant-icon-filter-unpaid": theme.iconFilterUnpaid ?? theme.muted2,
    "--text-soft": theme.textSoft,
    "--text-faint": theme.textFaint,
    "--accent": theme.accent,
    "--accent-2": theme.accent2,
    "--accent-soft": theme.accentSoft,
    "--accent-border": theme.accentBorder,
    "--brand-panel-soft": theme.panelSoft,
    "--brand-panel-strong": theme.panelStrong,
    "--brand-on-accent": theme.onAccent,
    "--brand-sidebar-stripe": theme.sidebarStripe,
    "--brand-badge-bg": theme.badgeBg,
    "--brand-badge-text": theme.badgeText,
    "--brand-role-pill-bg": theme.rolePillBg,
    "--brand-calendar-today-bg": theme.todayBg,
    "--brand-calendar-today-border": theme.todayBorder,
    "--brand-work-bg": theme.workBg,
    "--brand-work-border": theme.workBorder,
    "--brand-vacation-bg": theme.vacationBg,
    "--brand-vacation-border": theme.vacationBorder,
    "--brand-sick-bg": theme.sickBg,
    "--brand-sick-border": theme.sickBorder,
    "--brand-holiday-bg": theme.holidayBg,
    "--brand-holiday-border": theme.holidayBorder,
    "--brand-holiday-text": theme.holidayText,
    "--brand-floating-btn-bg": theme.floatingButtonBg,
    "--brand-floating-btn-text": theme.floatingButtonText,
    "--brand-neutral-card-bg": theme.neutralCardBg,
    "--brand-neutral-card-bg-strong": theme.neutralCardBgStrong,
    "--success": theme.success,
    "--success-soft": theme.successSoft,
    "--success-border": theme.successBorder,
    "--success-text": theme.successText,
    "--info": theme.info,
    "--info-soft": theme.infoSoft,
    "--info-border": theme.infoBorder,
    "--info-text": theme.infoText,
    "--warning": theme.warning,
    "--warning-soft": theme.warningSoft,
    "--warning-border": theme.warningBorder,
    "--warning-text": theme.warningText,
    "--danger": theme.danger,
    "--danger-2": theme.danger2,
    "--danger-soft": theme.dangerSoft,
    "--danger-border": theme.dangerBorder,
    "--danger-text": theme.dangerText,
  };

  if (rgb) {
    style["--accent-rgb"] = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  }

  return style;
}

export function applyTenantThemeToDocument(theme: TenantTheme): void {
  const root = document.documentElement;
  const rgb = hexToRgb(theme.accent);

  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--tenant-background-start", theme.backgroundStart);
  root.style.setProperty("--tenant-background-fade-soft", theme.backgroundFadeSoft);
  root.style.setProperty("--tenant-background-fade-end", theme.backgroundFadeEnd);
  root.style.setProperty("--panel", theme.panel);
  root.style.setProperty("--panel-2", theme.panel2);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-strong", theme.surfaceStrong);
  root.style.setProperty("--input-bg", theme.inputBg);
  root.style.setProperty("--overlay-bg", theme.overlayBg);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--border-2", theme.border2);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--muted-2", theme.muted2);
  root.style.setProperty("--tenant-icon-muted", theme.iconMuted ?? theme.muted2);
  root.style.setProperty("--tenant-icon-filter", theme.iconFilter ?? theme.muted2);
  root.style.setProperty("--tenant-icon-filter-vacation", theme.iconFilterVacation ?? theme.muted2);
  root.style.setProperty("--tenant-icon-filter-unpaid", theme.iconFilterUnpaid ?? theme.muted2);
  root.style.setProperty("--text-soft", theme.textSoft);
  root.style.setProperty("--text-faint", theme.textFaint);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-2", theme.accent2);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--accent-border", theme.accentBorder);
  root.style.setProperty("--brand-panel-soft", theme.panelSoft);
  root.style.setProperty("--brand-panel-strong", theme.panelStrong);
  root.style.setProperty("--brand-on-accent", theme.onAccent);
  root.style.setProperty("--brand-sidebar-stripe", theme.sidebarStripe);
  root.style.setProperty("--brand-badge-bg", theme.badgeBg);
  root.style.setProperty("--brand-badge-text", theme.badgeText);
  root.style.setProperty("--brand-role-pill-bg", theme.rolePillBg);
  root.style.setProperty("--brand-calendar-today-bg", theme.todayBg);
  root.style.setProperty("--brand-calendar-today-border", theme.todayBorder);
  root.style.setProperty("--brand-work-bg", theme.workBg);
  root.style.setProperty("--brand-work-border", theme.workBorder);
  root.style.setProperty("--brand-vacation-bg", theme.vacationBg);
  root.style.setProperty("--brand-vacation-border", theme.vacationBorder);
  root.style.setProperty("--brand-sick-bg", theme.sickBg);
  root.style.setProperty("--brand-sick-border", theme.sickBorder);
  root.style.setProperty("--brand-holiday-bg", theme.holidayBg);
  root.style.setProperty("--brand-holiday-border", theme.holidayBorder);
  root.style.setProperty("--brand-holiday-text", theme.holidayText);
  root.style.setProperty("--brand-floating-btn-bg", theme.floatingButtonBg);
  root.style.setProperty("--brand-floating-btn-text", theme.floatingButtonText);
  root.style.setProperty("--brand-neutral-card-bg", theme.neutralCardBg);
  root.style.setProperty("--brand-neutral-card-bg-strong", theme.neutralCardBgStrong);
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--success-soft", theme.successSoft);
  root.style.setProperty("--success-border", theme.successBorder);
  root.style.setProperty("--success-text", theme.successText);
  root.style.setProperty("--info", theme.info);
  root.style.setProperty("--info-soft", theme.infoSoft);
  root.style.setProperty("--info-border", theme.infoBorder);
  root.style.setProperty("--info-text", theme.infoText);
  root.style.setProperty("--warning", theme.warning);
  root.style.setProperty("--warning-soft", theme.warningSoft);
  root.style.setProperty("--warning-border", theme.warningBorder);
  root.style.setProperty("--warning-text", theme.warningText);
  root.style.setProperty("--danger", theme.danger);
  root.style.setProperty("--danger-2", theme.danger2);
  root.style.setProperty("--danger-soft", theme.dangerSoft);
  root.style.setProperty("--danger-border", theme.dangerBorder);
  root.style.setProperty("--danger-text", theme.dangerText);

  if (rgb) {
    root.style.setProperty("--accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
}

export function resetTenantThemeOnDocument(): void {
  const root = document.documentElement;
  root.style.removeProperty("--bg");
  root.style.removeProperty("--tenant-background-start");
  root.style.removeProperty("--tenant-background-fade-soft");
  root.style.removeProperty("--tenant-background-fade-end");
  root.style.removeProperty("--panel");
  root.style.removeProperty("--panel-2");
  root.style.removeProperty("--surface");
  root.style.removeProperty("--surface-strong");
  root.style.removeProperty("--input-bg");
  root.style.removeProperty("--overlay-bg");
  root.style.removeProperty("--border");
  root.style.removeProperty("--border-2");
  root.style.removeProperty("--text");
  root.style.removeProperty("--muted");
  root.style.removeProperty("--muted-2");
  root.style.removeProperty("--tenant-icon-muted");
  root.style.removeProperty("--tenant-icon-filter");
  root.style.removeProperty("--tenant-icon-filter-vacation");
  root.style.removeProperty("--tenant-icon-filter-unpaid");
  root.style.removeProperty("--text-soft");
  root.style.removeProperty("--text-faint");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-2");
  root.style.removeProperty("--accent-rgb");
  root.style.removeProperty("--accent-soft");
  root.style.removeProperty("--accent-border");
  root.style.removeProperty("--brand-panel-soft");
  root.style.removeProperty("--brand-panel-strong");
  root.style.removeProperty("--brand-on-accent");
  root.style.removeProperty("--brand-sidebar-stripe");
  root.style.removeProperty("--brand-badge-bg");
  root.style.removeProperty("--brand-badge-text");
  root.style.removeProperty("--brand-role-pill-bg");
  root.style.removeProperty("--brand-calendar-today-bg");
  root.style.removeProperty("--brand-calendar-today-border");
  root.style.removeProperty("--brand-work-bg");
  root.style.removeProperty("--brand-work-border");
  root.style.removeProperty("--brand-vacation-bg");
  root.style.removeProperty("--brand-vacation-border");
  root.style.removeProperty("--brand-sick-bg");
  root.style.removeProperty("--brand-sick-border");
  root.style.removeProperty("--brand-holiday-bg");
  root.style.removeProperty("--brand-holiday-border");
  root.style.removeProperty("--brand-holiday-text");
  root.style.removeProperty("--brand-floating-btn-bg");
  root.style.removeProperty("--brand-floating-btn-text");
  root.style.removeProperty("--brand-neutral-card-bg");
  root.style.removeProperty("--brand-neutral-card-bg-strong");
  root.style.removeProperty("--success");
  root.style.removeProperty("--success-soft");
  root.style.removeProperty("--success-border");
  root.style.removeProperty("--success-text");
  root.style.removeProperty("--info");
  root.style.removeProperty("--info-soft");
  root.style.removeProperty("--info-border");
  root.style.removeProperty("--info-text");
  root.style.removeProperty("--warning");
  root.style.removeProperty("--warning-soft");
  root.style.removeProperty("--warning-border");
  root.style.removeProperty("--warning-text");
  root.style.removeProperty("--danger");
  root.style.removeProperty("--danger-2");
  root.style.removeProperty("--danger-soft");
  root.style.removeProperty("--danger-border");
  root.style.removeProperty("--danger-text");
}

export function applyAccentColorToDocument(accent: string): void {
  applyTenantThemeToDocument(resolveTenantTheme("", accent));
}

export function resetAccentColorOnDocument(): void {
  resetTenantThemeOnDocument();
}

type ApplyTenantHeadBrandingInput = {
  title: string;
  themeColor: string;
  appName: string;
  manifestHref: string;
  appleTouchIconHref: string;
};

export function applyTenantHeadBranding(
  input: ApplyTenantHeadBrandingInput
): void {
  document.title = input.title;

  const themeMeta = ensureMetaTag('meta[name="theme-color"]', () => {
    const element = document.createElement("meta");
    element.name = "theme-color";
    return element;
  });
  themeMeta.content = input.themeColor;

  const appleTitleMeta = ensureMetaTag(
    'meta[name="apple-mobile-web-app-title"]',
    () => {
      const element = document.createElement("meta");
      element.name = "apple-mobile-web-app-title";
      return element;
    }
  );
  appleTitleMeta.content = input.appName;

  const manifestLink = ensureLinkTag('link[rel="manifest"]', () => {
    const element = document.createElement("link");
    element.rel = "manifest";
    return element;
  });
  manifestLink.href = input.manifestHref;

  const appleTouchIconLink = ensureLinkTag(
    'link[rel="apple-touch-icon"]',
    () => {
      const element = document.createElement("link");
      element.rel = "apple-touch-icon";
      return element;
    }
  );
  appleTouchIconLink.href = input.appleTouchIconHref;
}