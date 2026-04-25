import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginClient from "../../login/LoginClient";
import {
  getTenantAppleTouchIconHref,
  getTenantManifestHref,
  normalizeTenantSubdomain,
  resolveTenantTheme,
} from "@/lib/tenantBranding";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  params: Promise<{
    companySubdomain: string;
  }>;
};

type TenantCompany = {
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

async function loadTenantCompany(
  companySubdomain: string
): Promise<TenantCompany | null> {
  const normalizedSubdomain = normalizeTenantSubdomain(companySubdomain);

  if (!normalizedSubdomain) {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: {
      subdomain: normalizedSubdomain,
    },
    select: {
      name: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
    },
  });

  return company;
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { companySubdomain } = await params;
  const company = await loadTenantCompany(companySubdomain);

  if (!company) {
    return {
      title: "Mitarbeiterportal",
    };
  }

  const theme = resolveTenantTheme(company.subdomain, company.primaryColor);

   return {
    title: `${company.name} Mitarbeiterportal`,
    manifest: getTenantManifestHref(company.subdomain),
    themeColor: theme.bg,
    appleWebApp: {
      capable: true,
      title: company.name,
      statusBarStyle: "default",
    },
    icons: {
      apple: getTenantAppleTouchIconHref(company.subdomain),
    },
  };
}

export default async function TenantLoginPage({ params }: LoginPageProps) {
  const { companySubdomain } = await params;
  const normalizedSubdomain = normalizeTenantSubdomain(companySubdomain);

  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin/dashboard");
    }

    redirect("/erfassung");
  }

  if (!normalizedSubdomain) {
    notFound();
  }

  const company = await loadTenantCompany(normalizedSubdomain);

  if (!company) {
    notFound();
  }

  return (
    <LoginClient
      companySubdomainOverride={company.subdomain}
      initialBrand={{
        displayName: company.name,
        subtitle: "Digitale Zeiterfassung & Einsatzplanung",
        badgeText: "Firmenlogin",
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        companySubdomain: company.subdomain,
      }}
    />
  );
}