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
      style={{
        ...getTenantThemeStyle(theme),
        position: "relative",
        minHeight: "100dvh",
        color: "var(--text)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--bg)",
          backgroundImage:
            "radial-gradient(1200px 600px at 10% 10%, var(--accent-soft), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(var(--accent-rgb), 0.06), transparent 60%)",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundSize: "1200px 600px, 900px 600px",
          backgroundPosition: "0 0, 100% 0",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100dvh",
        }}
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
    </div>
  );
}