import LegalBackButton from "@/components/LegalBackButton";
import LegalContent from "@/components/LegalContent";
import {
  getTenantThemeStyle,
  resolveTenantTheme,
} from "@/lib/tenantBranding";

export default function NutzungsbedingungenPage() {
  const theme = resolveTenantTheme("beispielbetrieb");
  const fallbackHref = "/";
  const initialLanguage = "DE" as const;

  return (
    <div
      style={{
        ...getTenantThemeStyle(theme),
        minHeight: "100dvh",
        backgroundColor: "var(--bg)",
        backgroundImage:
          "radial-gradient(1200px 600px at 10% 10%, var(--accent-soft), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(var(--accent-rgb), 0.06), transparent 60%)",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "1200px 600px, 900px 600px",
        backgroundPosition: "0 0, 100% 0",
      }}
    >
      <div className="page-section">
        <div className="container-app">
          <div className="card card-olive legal-page-card">
            <LegalContent
              type="terms"
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
