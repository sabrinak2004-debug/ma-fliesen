export const DEFAULT_THEME_COLOR = "#0b0f0c";
export const DEFAULT_APP_NAME = "Mitarbeiterportal";
export const DEFAULT_APP_SHORT_NAME = "Portal";
export const DEFAULT_APPLE_TOUCH_ICON = "/image_2.jpeg";
export const DEFAULT_MANIFEST_HREF = "/manifest.json";

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

  return DEFAULT_THEME_COLOR;
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

export function getTenantAssetBasePath(subdomain: string): string {
  const normalized = normalizeTenantSubdomain(subdomain);

  if (!normalized) {
    return "";
  }

  return `/tenant-assets/${normalized}`;
}

export function getTenantIcon192Href(subdomain: string): string {
  const basePath = getTenantAssetBasePath(subdomain);
  return basePath ? `${basePath}/icon-192.png` : DEFAULT_APPLE_TOUCH_ICON;
}

export function getTenantIcon512Href(subdomain: string): string {
  const basePath = getTenantAssetBasePath(subdomain);
  return basePath ? `${basePath}/icon-512.png` : DEFAULT_APPLE_TOUCH_ICON;
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

export function applyAccentColorToDocument(accent: string): void {
  const root = document.documentElement;
  const safeAccent = normalizeThemeColor(accent);
  const rgb = hexToRgb(safeAccent);

  root.style.setProperty("--accent", safeAccent);

  if (rgb) {
    root.style.setProperty("--accent-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty("--accent-soft", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`);
    root.style.setProperty("--accent-border", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
  }
}

export function resetAccentColorOnDocument(): void {
  const root = document.documentElement;
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-rgb");
  root.style.removeProperty("--accent-soft");
  root.style.removeProperty("--accent-border");
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