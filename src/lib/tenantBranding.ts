export const DEFAULT_THEME_COLOR = "#0b0f0c";
export const DEFAULT_BRAND_ACCENT = "#b8cf3a";
export const DEFAULT_APP_NAME = "Mitarbeiterportal";
export const DEFAULT_APP_SHORT_NAME = "Portal";
export const DEFAULT_APPLE_TOUCH_ICON = "/image_2.jpeg";
export const DEFAULT_MANIFEST_HREF = "/manifest.json";

export type TenantTheme = {
  bg: string;
  panel: string;
  panel2: string;
  surface: string;
  surfaceStrong: string;
  inputBg: string;
  overlayBg: string;
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
};

const DEFAULT_TENANT_THEME: TenantTheme = {
  bg: "#0b0f0c",
  panel: "#111613",
  panel2: "#0f1411",
  surface: "rgba(255, 255, 255, 0.03)",
  surfaceStrong: "rgba(255, 255, 255, 0.06)",
  inputBg: "rgba(0, 0, 0, 0.25)",
  overlayBg: "rgba(17, 22, 19, 0.82)",
  accent: DEFAULT_BRAND_ACCENT,
  accent2: "#9db02f",
  accentSoft: "rgba(184, 207, 58, 0.14)",
  accentBorder: "rgba(184, 207, 58, 0.35)",
  panelSoft: "rgba(184, 207, 58, 0.08)",
  panelStrong: "rgba(184, 207, 58, 0.18)",
  onAccent: "#111613",
  sidebarStripe: "#b8cf3a",
  badgeBg: "#b8cf3a",
  badgeText: "#111613",
  rolePillBg: "rgba(184, 207, 58, 0.14)",
  todayBg: "rgba(184, 207, 58, 0.22)",
  todayBorder: "rgba(184, 207, 58, 0.55)",
};

const TENANT_THEMES: Record<string, Partial<TenantTheme>> = {
  "ma-fliesen": {
    bg: "#0b0f0c",
    panel: "#111613",
    panel2: "#0f1411",
    surface: "rgba(255, 255, 255, 0.03)",
    surfaceStrong: "rgba(255, 255, 255, 0.06)",
    inputBg: "rgba(0, 0, 0, 0.25)",
    overlayBg: "rgba(17, 22, 19, 0.82)",
    accent: "#b8cf3a",
    accent2: "#9db02f",
    accentSoft: "rgba(184, 207, 58, 0.14)",
    accentBorder: "rgba(184, 207, 58, 0.35)",
    panelSoft: "rgba(184, 207, 58, 0.08)",
    panelStrong: "rgba(184, 207, 58, 0.18)",
    onAccent: "#111613",
    sidebarStripe: "#b8cf3a",
    badgeBg: "#b8cf3a",
    badgeText: "#111613",
    rolePillBg: "rgba(184, 207, 58, 0.14)",
    todayBg: "rgba(184, 207, 58, 0.22)",
    todayBorder: "rgba(184, 207, 58, 0.55)",
  },
  beispielbetrieb: {
    bg: "#0d100d",
    panel: "#151915",
    panel2: "#121612",
    surface: "rgba(255, 255, 255, 0.025)",
    surfaceStrong: "rgba(255, 255, 255, 0.055)",
    inputBg: "rgba(8, 10, 8, 0.42)",
    overlayBg: "rgba(21, 25, 21, 0.84)",
    accent: "#ccc6bc",
    accent2: "#b9b2a6",
    accentSoft: "rgba(204, 198, 188, 0.16)",
    accentBorder: "rgba(204, 198, 188, 0.34)",
    panelSoft: "rgba(204, 198, 188, 0.08)",
    panelStrong: "rgba(204, 198, 188, 0.18)",
    onAccent: "#111613",
    sidebarStripe: "#e7e1d7",
    badgeBg: "#ccc6bc",
    badgeText: "#111613",
    rolePillBg: "rgba(204, 198, 188, 0.16)",
    todayBg: "rgba(204, 198, 188, 0.26)",
    todayBorder: "rgba(204, 198, 188, 0.52)",
  },
};

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

export function resolveTenantTheme(
  subdomain: string,
  primaryColor?: string | null
): TenantTheme {
  const normalizedSubdomain = normalizeTenantSubdomain(subdomain);
  const override = TENANT_THEMES[normalizedSubdomain] ?? {};
  const accent = normalizeThemeColor(override.accent ?? primaryColor);

  const accent2 =
    typeof override.accent2 === "string" && isHexColor(override.accent2)
      ? override.accent2
      : accent;

  return {
    bg: override.bg ?? DEFAULT_TENANT_THEME.bg,
    panel: override.panel ?? DEFAULT_TENANT_THEME.panel,
    panel2: override.panel2 ?? DEFAULT_TENANT_THEME.panel2,
    surface: override.surface ?? DEFAULT_TENANT_THEME.surface,
    surfaceStrong: override.surfaceStrong ?? DEFAULT_TENANT_THEME.surfaceStrong,
    inputBg: override.inputBg ?? DEFAULT_TENANT_THEME.inputBg,
    overlayBg: override.overlayBg ?? DEFAULT_TENANT_THEME.overlayBg,
    accent,
    accent2,
    accentSoft:
      override.accentSoft ??
      rgbaFromHex(accent, 0.14, DEFAULT_TENANT_THEME.accentSoft),
    accentBorder:
      override.accentBorder ??
      rgbaFromHex(accent, 0.35, DEFAULT_TENANT_THEME.accentBorder),
    panelSoft:
      override.panelSoft ??
      rgbaFromHex(accent, 0.08, DEFAULT_TENANT_THEME.panelSoft),
    panelStrong:
      override.panelStrong ??
      rgbaFromHex(accent, 0.18, DEFAULT_TENANT_THEME.panelStrong),
    onAccent: override.onAccent ?? DEFAULT_TENANT_THEME.onAccent,
    sidebarStripe: override.sidebarStripe ?? accent,
    badgeBg: override.badgeBg ?? accent,
    badgeText: override.badgeText ?? DEFAULT_TENANT_THEME.badgeText,
    rolePillBg:
      override.rolePillBg ??
      rgbaFromHex(accent, 0.14, DEFAULT_TENANT_THEME.rolePillBg),
    todayBg:
      override.todayBg ??
      rgbaFromHex(accent, 0.22, DEFAULT_TENANT_THEME.todayBg),
    todayBorder:
      override.todayBorder ??
      rgbaFromHex(accent, 0.55, DEFAULT_TENANT_THEME.todayBorder),
  };
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

export function applyTenantThemeToDocument(theme: TenantTheme): void {
  const root = document.documentElement;
  const rgb = hexToRgb(theme.accent);

  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--panel", theme.panel);
  root.style.setProperty("--panel-2", theme.panel2);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-strong", theme.surfaceStrong);
  root.style.setProperty("--input-bg", theme.inputBg);
  root.style.setProperty("--overlay-bg", theme.overlayBg);
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

  if (rgb) {
    root.style.setProperty("--accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
}

export function resetTenantThemeOnDocument(): void {
  const root = document.documentElement;
  root.style.removeProperty("--bg");
  root.style.removeProperty("--panel");
  root.style.removeProperty("--panel-2");
  root.style.removeProperty("--surface");
  root.style.removeProperty("--surface-strong");
  root.style.removeProperty("--input-bg");
  root.style.removeProperty("--overlay-bg");
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