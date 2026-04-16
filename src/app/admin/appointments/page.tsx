"use client";

import React, { Suspense, useEffect, useState } from "react";
import KalenderPage from "@/app/kalender/page";
import {
  ADMIN_APPOINTMENTS_UI_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";

type AdminSessionDTO = {
  userId: string;
  fullName: string;
  role: "ADMIN" | "EMPLOYEE";
  language: AppUiLanguage;
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isAppLanguage(v: unknown): v is AppUiLanguage {
  return (
    v === "DE" ||
    v === "EN" ||
    v === "IT" ||
    v === "TR" ||
    v === "SQ" ||
    v === "KU"
  );
}

function isAdminSessionDTO(v: unknown): v is AdminSessionDTO {
  return (
    isRecord(v) &&
    isString(v["userId"]) &&
    isString(v["fullName"]) &&
    (v["role"] === "ADMIN" || v["role"] === "EMPLOYEE") &&
    isAppLanguage(v["language"]) &&
    isString(v["companyId"]) &&
    isString(v["companyName"]) &&
    isString(v["companySubdomain"]) &&
    (isString(v["companyLogoUrl"]) || v["companyLogoUrl"] === null) &&
    (isString(v["primaryColor"]) || v["primaryColor"] === null)
  );
}

function parseMeSession(v: unknown): AdminSessionDTO | null {
  if (!isRecord(v)) return null;
  const session = v["session"];
  if (session === null) return null;
  return isAdminSessionDTO(session) ? session : null;
}

export default function AdminAppointmentsPage(): React.ReactElement {
  const [language, setLanguage] = useState<AppUiLanguage>("DE");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data: unknown = await response.json().catch(() => ({}));
        if (!alive) return;

        const session = parseMeSession(data);
        if (session) {
          setLanguage(normalizeAppUiLanguage(session.language));
        }
      } catch {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <Suspense
      fallback={
        <div className="card" style={{ padding: 16 }}>
          <div style={{ color: "var(--muted)" }}>
            {translate(language, "calendarLoading", ADMIN_APPOINTMENTS_UI_TEXTS)}
          </div>
        </div>
      }
    >
      <KalenderPage forceAdminOwnCalendar />
    </Suspense>
  );
}