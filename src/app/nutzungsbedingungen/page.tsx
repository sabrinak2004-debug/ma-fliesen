import LegalBackButton from "@/components/LegalBackButton";
import LegalContent from "@/components/LegalContent";

export default function NutzungsbedingungenPage() {
  const fallbackHref = "/";
  const initialLanguage = "DE" as const;

  return (
    <div className="page-section">
      <div className="container-app">
        <div className="card card-olive legal-page-card">
          <LegalContent type="terms" initialLanguage={initialLanguage} />

          <div className="legal-page-actions">
            <LegalBackButton
              fallbackHref={fallbackHref}
              language={initialLanguage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}