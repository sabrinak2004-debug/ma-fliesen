import LegalBackButton from "@/components/LegalBackButton";
import LegalBackButton from "@/components/LegalBackButton";
import {
  getTenantThemeStyle,
  resolveTenantTheme,
} from "@/lib/tenantBranding";

export default function NutzungsbedingungenPage() {
  const theme = resolveTenantTheme("beispielbetrieb");
  const fallbackHref = "/";

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
          <h1 className="legal-page-title">Nutzungsbedingungen</h1>
          <div className="legal-page-updated">
            Letzte Aktualisierung: 30.03.2026
          </div>
          <div className="legal-page-content">
            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Nutzungsbedingungen gelten für die Nutzung der Webanwendung
              „saleo.app“.
            </p>

            <h2>2. Leistungsbeschreibung</h2>
            <p>Die App dient zur:</p>
            <ul>
              <li>Erfassung von Arbeitszeiten</li>
              <li>Verwaltung von Mitarbeitern</li>
              <li>Planung von Einsätzen</li>
              <li>Verwaltung von Abwesenheiten</li>
              <li>Aufgaben- und Kommunikationssystem</li>
            </ul>

            <h2>3. Nutzerrollen</h2>
            <p>Die App unterscheidet:</p>
            <ul>
              <li>Mitarbeiter</li>
              <li>Administratoren</li>
            </ul>
            <p>
              Administratoren haben erweiterte Rechte, z. B. Bearbeiten,
              Löschen und Genehmigen.
            </p>

            <h2>4. Pflichten der Nutzer</h2>
            <p>Mitarbeiter müssen:</p>
            <ul>
              <li>korrekte Arbeitszeiten eintragen</li>
              <li>Einträge zeitnah erfassen</li>
              <li>bei fehlenden Einträgen ggf. Nachtragsanträge stellen</li>
            </ul>

            <p>Administratoren dürfen:</p>
            <ul>
              <li>Daten verwalten</li>
              <li>Anträge genehmigen oder ablehnen</li>
              <li>Aufgaben erstellen</li>
            </ul>

            <h2>5. Verfügbarkeit</h2>
            <p>
              Die App wird bestmöglich verfügbar gehalten, jedoch ohne Garantie
              auf permanente Verfügbarkeit.
            </p>

            <h2>6. Haftung</h2>
            <p>Der Betreiber haftet nur für:</p>
            <ul>
              <li>Vorsatz</li>
              <li>grobe Fahrlässigkeit</li>
            </ul>

            <p>Keine Haftung besteht für:</p>
            <ul>
              <li>falsche Eingaben durch Nutzer</li>
              <li>Datenverlust außerhalb des Einflussbereichs</li>
            </ul>

            <h2>7. Nutzungseinschränkungen</h2>
            <p>Es ist untersagt:</p>
            <ul>
              <li>falsche Daten einzugeben</li>
              <li>unbefugten Zugriff zu versuchen</li>
              <li>die App missbräuchlich zu verwenden</li>
            </ul>

            <h2>8. Dokumente und Inhalte</h2>
            <p>Hochgeladene Dokumente dürfen:</p>
            <ul>
              <li>keine rechtswidrigen Inhalte enthalten</li>
              <li>nur für betriebliche Zwecke genutzt werden</li>
            </ul>

            <h2>9. Kündigung / Zugang</h2>
            <p>
              Der Zugang kann durch den Betreiber oder Administrator jederzeit
              deaktiviert werden.
            </p>

            <h2>10. Änderungen</h2>
            <p>Die Nutzungsbedingungen können jederzeit angepasst werden.</p>

            <h2>11. Anwendbares Recht</h2>
            <p>Es gilt deutsches Recht.</p>
          </div>

          <div className="legal-page-actions">
            <LegalBackButton fallbackHref={fallbackHref} label="Zurück" />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
