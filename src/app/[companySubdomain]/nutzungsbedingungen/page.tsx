import LegalBackButton from "@/components/LegalBackButton";
import LegalContent from "@/components/LegalContent";
import { getSession } from "@/lib/auth";
import { normalizeAppUiLanguage } from "@/lib/i18n";
import { notFound } from "next/navigation";
import {
  getTenantThemeStyle,
  normalizeTenantSubdomain,
  resolveTenantTheme,
} from "@/lib/tenantBranding";

type TenantNutzungsbedingungenPageProps = {
  params: Promise<{
    companySubdomain: string;
  }>;
};

export default async function TenantNutzungsbedingungenPage({
  params,
}: TenantNutzungsbedingungenPageProps) {
  const { companySubdomain } = await params;
  const normalizedSubdomain = normalizeTenantSubdomain(companySubdomain);

  if (!normalizedSubdomain) {
    notFound();
  }
  const theme = resolveTenantTheme(normalizedSubdomain);
  const session = await getSession();
  const language = normalizeAppUiLanguage(session?.language);

      return (
    <div
      className="tenant-legal-root"
      style={getTenantThemeStyle(theme)}
    >
      <div className="legal-page-shell">
        <div className="container-app">
          <div className="card card-olive legal-page-card">
            <LegalContent
              type="terms"
              initialLanguage={language}
            />

            <div className="legal-page-actions">
              <LegalBackButton
                fallbackHref={`/${normalizedSubdomain}/login`}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}