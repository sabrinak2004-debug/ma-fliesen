import LegalBackButton from "@/components/LegalBackButton";
import LegalContent from "@/components/LegalContent";

export default function NutzungsbedingungenPage() {
  const fallbackHref = "/";
  const initialLanguage = "DE" as const;

  return (
    <main className="legal-full-page">
      <LegalContent type="terms" initialLanguage={initialLanguage} />

      <div className="legal-page-actions">
        <LegalBackButton
          fallbackHref={fallbackHref}
          language={initialLanguage}
        />
      </div>
    </main>
  );
}