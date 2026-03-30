"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import Link from "next/link";

type PublicCompany = {
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

type PublicCompanySuccessResponse = {
  ok: true;
  company: PublicCompany;
};

type PublicCompanyErrorResponse = {
  ok: false;
  error?: string;
};

type PublicCompanyResponse =
  | PublicCompanySuccessResponse
  | PublicCompanyErrorResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPublicCompany(value: unknown): value is PublicCompany {
  if (!isRecord(value)) return false;

  const name = value["name"];
  const subdomain = value["subdomain"];
  const logoUrl = value["logoUrl"];
  const primaryColor = value["primaryColor"];

  return (
    typeof name === "string" &&
    typeof subdomain === "string" &&
    (typeof logoUrl === "string" || logoUrl === null) &&
    (typeof primaryColor === "string" || primaryColor === null)
  );
}

function parsePublicCompanyResponse(value: unknown): PublicCompanyResponse | null {
  if (!isRecord(value)) return null;

  const ok = value["ok"];

  if (ok === true) {
    const company = value["company"];
    if (!isPublicCompany(company)) return null;

    return {
      ok: true,
      company,
    };
  }

  if (ok === false) {
    const error = value["error"];
    return {
      ok: false,
      error: typeof error === "string" ? error : undefined,
    };
  }

  return null;
}

function normalizeInput(value: string): string {
  return value.trim();
}

export default function TenantEntryClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isDisabled = useMemo(() => {
    return isSubmitting || normalizeInput(query).length === 0;
  }, [isSubmitting, query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedQuery = normalizeInput(query);

    if (!normalizedQuery) {
      setToastMessage("Bitte gib deinen Firmennamen oder die Subdomain ein.");
      return;
    }

    try {
      setIsSubmitting(true);
      setToastMessage(null);

      const response = await fetch(
        `/api/public-company?query=${encodeURIComponent(normalizedQuery)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const json: unknown = await response.json().catch(() => null);
      const parsed = parsePublicCompanyResponse(json);

      if (!parsed || !parsed.ok) {
        setToastMessage(
          parsed?.error ?? "Die Firma wurde nicht gefunden. Bitte prüfe deine Eingabe."
        );
        return;
      }

      router.push(`/${parsed.company.subdomain}/login`);
    } catch {
      setToastMessage("Die Firma konnte gerade nicht geprüft werden. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 0",
            }}
      >
        <div className="container-app">
          <div
            className="card"
            style={{
              maxWidth: 560,
              margin: "0 auto",
              padding: 24,
              borderRadius: 24,
              background: "rgba(17, 22, 19, 0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent-border)",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "var(--text)",
                }}
              >
                Firmenzugang
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                }}
              >
              Willkommen bei saleo!
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  fontSize: 15,
                  lineHeight: 1.5,
                }}
              >
                Gib bitte deinen Firmennamen ein, damit wir dich
                zum richtigen Login weiterleiten können.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div className="label">Ihr Firmenname</div>
                  <input
                    className="input"
                    type="text"
                    placeholder="z.B. Musterfirma"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoComplete="organization"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={isDisabled}
                  style={{
                    width: "100%",
                    minHeight: 48,
                    fontWeight: 900,
                  }}
                >
                  {isSubmitting ? "Firma wird geprüft..." : "Weiter zum Firmen-Login"}
                </button>
              </div>
            </form>

            <div
              style={{
                marginTop: 18,
                color: "var(--muted-2)",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Nach erfolgreicher Prüfung wirst du automatisch zu dem
              passenden Firmen-Login weitergeleitet.
            </div>
            <div className="login-legal-links">
              <Link href="/datenschutz" className="login-legal-link">
                Datenschutz
              </Link>

              <span className="login-legal-separator">•</span>

              <Link href="/nutzungsbedingungen" className="login-legal-link">
                Nutzungsbedingungen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {toastMessage ? <Toast message={toastMessage} /> : null}
    </>
  );
}