import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_APP_NAME,
  DEFAULT_APP_SHORT_NAME,
  DEFAULT_THEME_COLOR,
  getTenantIcon192Href,
  getTenantIcon512Href,
  normalizeTenantSubdomain,
  resolveTenantTheme,
} from "@/lib/tenantBranding";

type ManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
};

type WebAppManifest = {
  id: string;
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
};

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const rawCompany = searchParams.get("company") ?? "";
  const companySubdomain = normalizeTenantSubdomain(rawCompany);

  if (!companySubdomain) {
    const fallbackManifest: WebAppManifest = {
      id: "/",
      name: DEFAULT_APP_NAME,
      short_name: DEFAULT_APP_SHORT_NAME,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: DEFAULT_THEME_COLOR,
      theme_color: DEFAULT_THEME_COLOR,
      icons: [
        {
          src: "/image_2.jpeg",
          sizes: "192x192",
          type: "image/jpeg",
        },
      ],
    };

    return NextResponse.json(fallbackManifest, {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  const company = await prisma.company.findUnique({
    where: {
      subdomain: companySubdomain,
    },
    select: {
      name: true,
      subdomain: true,
      primaryColor: true,
    },
  });

  if (!company) {
    return NextResponse.json(
      { ok: false, error: "Firma nicht gefunden." },
      {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
        },
      }
    );
  }

  const tenantTheme = resolveTenantTheme(
    company.subdomain,
    company.primaryColor
  );

  const themeColor = tenantTheme.bg;
  const appName = `${company.name} Mitarbeiterportal`;
  const shortName =
    company.name.length > 12 ? company.name.slice(0, 12) : company.name;

  const manifest: WebAppManifest = {
    id: `/app/${company.subdomain}`,
    name: appName,
    short_name: shortName,
    start_url: `/${company.subdomain}/login?source=pwa`,
    scope: "/",
    display: "standalone",
    background_color: themeColor,
    theme_color: themeColor,
    icons: [
      {
        src: getTenantIcon192Href(company.subdomain),
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any maskable",
      },
      {
        src: getTenantIcon512Href(company.subdomain),
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}