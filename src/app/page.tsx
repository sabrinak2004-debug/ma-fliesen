import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin/dashboard");
    }

    redirect("/erfassung");
  }

  return (
    <div style={{ padding: "40px 0" }}>
      <div className="container-app">
        <div className="landing-hero-card card card-olive">
          <div className="landing-badge">saleo</div>

          <h1 className="landing-title">
            Digitale Zeiterfassung und Mitarbeiterverwaltung für Unternehmen
          </h1>

          <p className="landing-text">
            saleo ist eine Webanwendung für die Erfassung von Arbeitszeiten,
            Einsatzplanung, Abwesenheiten, Aufgaben und betriebliche
            Organisation. Mitarbeiter und Administratoren nutzen die Anwendung
            über einen geschützten Firmenzugang.
          </p>

          <div className="landing-feature-grid">
            <div className="landing-feature card">
              <div className="landing-feature-title">Arbeitszeiten erfassen</div>
              <div className="landing-feature-text">
                Startzeiten, Endzeiten, Pausen, Tätigkeiten, Einsatzorte und
                Fahrtzeiten digital dokumentieren.
              </div>
            </div>

            <div className="landing-feature card">
              <div className="landing-feature-title">Abwesenheiten verwalten</div>
              <div className="landing-feature-text">
                Urlaub, Krankheit, Anträge und Genehmigungen strukturiert und
                nachvollziehbar verwalten.
              </div>
            </div>

            <div className="landing-feature card">
              <div className="landing-feature-title">Planung und Aufgaben</div>
              <div className="landing-feature-text">
                Wochenpläne, Termine, Dokumente, Aufgaben und Hinweise zentral
                für Mitarbeiter und Admins bereitstellen.
              </div>
            </div>
          </div>

          <div className="landing-action-row">
            <Link
              href="/firmenzugang"
              className="btn btn-accent"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Zum Firmen-Login
            </Link>
          </div>

          <div className="landing-legal-row">
            <Link href="/datenschutz" className="landing-legal-link">
              Datenschutz
            </Link>

            <span className="landing-legal-separator">•</span>

            <Link href="/nutzungsbedingungen" className="landing-legal-link">
              Nutzungsbedingungen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}