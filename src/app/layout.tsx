import type { Metadata, Viewport } from "next";
import PushBootstrap from "@/components/PushBootstrap";
import DesktopPwaWindowMode from "@/components/DesktopPwaWindowMode";
import { getSession } from "@/lib/auth";
import { normalizeAppUiLanguage, toHtmlLang } from "@/lib/i18n";
import {
  getTenantAppleTouchIconHref,
  getTenantManifestHref,
  getTenantThemeStyle,
  resolveTenantTheme,
} from "@/lib/tenantBranding";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mitarbeiterportal",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSessionStringValue(session: unknown, key: string): string | null {
  if (!isRecord(session)) {
    return null;
  }

  const value = session[key];
  return typeof value === "string" ? value : null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const language = normalizeAppUiLanguage(session?.language);
  const htmlLang = toHtmlLang(language);

  const companySubdomain = getSessionStringValue(session, "companySubdomain");
  const primaryColor = getSessionStringValue(session, "primaryColor");

  const tenantTheme =
    companySubdomain !== null
      ? resolveTenantTheme(companySubdomain, primaryColor)
      : null;

  const manifestHref =
    companySubdomain !== null
      ? getTenantManifestHref(companySubdomain)
      : "/manifest.json";

  const appleTouchIconHref =
    companySubdomain !== null
      ? getTenantAppleTouchIconHref(companySubdomain)
      : "/image_2.jpeg";

  const themeColor = tenantTheme ? tenantTheme.bg : "#f4f2ee";

  return (
    <html
      lang={htmlLang}
      style={tenantTheme ? getTenantThemeStyle(tenantTheme) : undefined}
    >
      <head>
        <meta name="theme-color" content={themeColor} />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content={themeColor} />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={themeColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mitarbeiterportal" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href={manifestHref} />
        <link rel="apple-touch-icon" href={appleTouchIconHref} />
      </head>
      <body>
        <div className="app-root-shell">
          <DesktopPwaWindowMode />
          <PushBootstrap language={language} />
          {children}
        </div>
      </body>
    </html>
  );
}