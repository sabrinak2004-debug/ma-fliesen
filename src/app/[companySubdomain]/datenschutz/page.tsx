import LegalBackButton from "@/components/LegalBackButton";
import { notFound } from "next/navigation";
import { normalizeTenantSubdomain } from "@/lib/tenantBranding";

type TenantDatenschutzPageProps = {
  params: Promise<{
    companySubdomain: string;
  }>;
};

export default async function TenantDatenschutzPage({
  params,
}: TenantDatenschutzPageProps) {
  const { companySubdomain } = await params;
  const normalizedSubdomain = normalizeTenantSubdomain(companySubdomain);

  if (!normalizedSubdomain) {
    notFound();
  }

  return (
    <div className="legal-page-shell">
      <div className="container-app">
        <div className="card card-olive legal-page-card">
          <h1 className="legal-page-title">Datenschutzerklärung</h1>

          <div className="legal-page-updated">
            Letzte Aktualisierung: 30.03.2026
          </div>

          <div className="legal-page-content">
            <h2>1. Allgemeine Hinweise</h2>
            <p>
              Diese Datenschutzerklärung informiert über die Verarbeitung
              personenbezogener Daten bei der Nutzung der Webanwendung
              „saleo.app“ (digitale Zeiterfassung und Mitarbeiterverwaltung).
            </p>

            <h2>2. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung ist:
              <br />
              Sabrina Klausmeier
              <br />
              Stetter Weg 11, 70794 Filderstadt
              <br />
              sabrinak2004@gmail.com
            </p>

            <h2>3. Verarbeitete Daten</h2>

            <h3>a) Benutzerdaten</h3>
            <ul>
              <li>Name (fullName)</li>
              <li>Benutzerrolle (Mitarbeiter / Admin)</li>
              <li>Login-Daten (verschlüsselt)</li>
              <li>Firmenzugehörigkeit</li>
            </ul>

            <h3>b) Arbeitszeitdaten</h3>
            <ul>
              <li>Arbeitszeiten (Start, Ende)</li>
              <li>Pausen</li>
              <li>Tätigkeiten</li>
              <li>Einsatzorte</li>
              <li>Fahrtzeiten</li>
              <li>Notizen</li>
            </ul>

            <h3>c) Abwesenheitsdaten</h3>
            <ul>
              <li>Urlaub (bezahlt/unbezahlt, halbe Tage möglich)</li>
              <li>Krankheitstage</li>
              <li>Anträge (Urlaub, Krankheit, Nachträge)</li>
            </ul>

            <h3>d) Organisations- und Planungsdaten</h3>
            <ul>
              <li>Kalendereinträge</li>
              <li>Termine (inkl. Google Calendar Integration, falls aktiviert)</li>
              <li>Wochenpläne</li>
              <li>Aufgaben</li>
            </ul>

            <h3>e) Dokumente</h3>
            <ul>
              <li>Hochgeladene Dateien (z. B. Baustellenzettel)</li>
            </ul>

            <h3>f) Technische Daten</h3>
            <ul>
              <li>Session-Daten (Login-Cookies)</li>
              <li>Push-Benachrichtigungen (Browser-Subscription)</li>
              <li>Zeitstempel (createdAt, updatedAt)</li>
            </ul>

            <h2>4. Zweck der Verarbeitung</h2>
            <p>Die Verarbeitung erfolgt zur:</p>
            <ul>
              <li>Arbeitszeiterfassung</li>
              <li>Verwaltung von Mitarbeitern</li>
              <li>Planung von Einsätzen</li>
              <li>Bearbeitung von Urlaubs- und Krankheitsanträgen</li>
              <li>Kommunikation über Aufgaben und Benachrichtigungen</li>
            </ul>

            <h2>5. Rechtsgrundlage</h2>
            <p>Die Verarbeitung erfolgt gemäß:</p>
            <ul>
              <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
              <li>
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter
                Organisation)
              </li>
            </ul>

            <h2>6. Push-Benachrichtigungen</h2>
            <p>
              Die App kann Push-Benachrichtigungen senden, z. B. bei Anträgen
              oder Aufgaben. Diese werden nur nach Zustimmung aktiviert.
            </p>

            <h2>7. Cookies / Sessions</h2>
            <p>
              Zur Authentifizierung wird ein Session-Cookie verwendet. Dieses ist
              technisch notwendig und enthält keine Tracking-Daten.
            </p>

            <h2>8. Speicherung und Löschung</h2>
            <p>Daten werden gespeichert, solange:</p>
            <ul>
              <li>ein aktives Nutzerverhältnis besteht</li>
              <li>oder gesetzliche Aufbewahrungspflichten vorliegen</li>
            </ul>
            <p>Danach werden sie gelöscht.</p>

            <h2>9. Weitergabe von Daten</h2>
            <p>
              Es erfolgt keine Weitergabe an Dritte, außer an technisch
              notwendige Dienste, z. B. Hosting, oder an die optionale Google
              Calendar Integration bei Aktivierung.
            </p>

            <h2>10. Sicherheit</h2>
            <p>
              Die Daten werden durch geeignete technische Maßnahmen geschützt:
            </p>
            <ul>
              <li>Verschlüsselte Speicherung von Passwörtern</li>
              <li>Zugriffsbeschränkungen (Admin / Mitarbeiter)</li>
              <li>Serverseitige Validierung</li>
            </ul>

            <h2>11. Rechte der Nutzer</h2>
            <p>Nutzer haben das Recht auf:</p>
            <ul>
              <li>Auskunft</li>
              <li>Berichtigung</li>
              <li>Löschung</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
            </ul>

            <h2>12. Kontakt</h2>
            <p>
              Bei Fragen zum Datenschutz:
              <br />
              sabrinak2004@gmail.com
            </p>
          </div>

          <div className="legal-page-actions">
            <LegalBackButton
              fallbackHref={`/${normalizedSubdomain}/login`}
              label="Zurück"
            />
          </div>
        </div>
      </div>
    </div>
  );
}