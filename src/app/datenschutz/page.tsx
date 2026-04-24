import LegalBackButton from "@/components/LegalBackButton";
import LegalContent from "@/components/LegalContent";
import {
  getTenantThemeStyle,
  resolveTenantTheme,
} from "@/lib/tenantBranding";

export default function DatenschutzPage() {
  const theme = resolveTenantTheme("beispielbetrieb");
  const fallbackHref = "/";
  const initialLanguage = "DE" as const;

  return (
    <div className="page-fullscreen legal-screen" style={getTenantThemeStyle(theme)}>
      <div className="legal-screen-inner">
        <div className="container-app">
          <div className="card card-olive legal-page-card">
            <LegalContent
              type="privacy"
              initialLanguage={initialLanguage}
            />

          <div className="legal-page-actions">
            <LegalBackButton
              fallbackHref={fallbackHref}
              language={initialLanguage}
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
