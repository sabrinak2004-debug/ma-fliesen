"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;
  const userId = v["userId"];
  const fullName = v["fullName"];
  const role = v["role"];
  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN")
  );
}

function parseMe(j: unknown): SessionData | null {
  if (!isRecord(j)) return null;
  const s = j["session"];
  if (s === null) return null;
  return isSessionData(s) ? s : null;
}

export default function AppShell({
  children,
  activeLabel,
}: {
  children: React.ReactNode;
  activeLabel?: string;
}) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((j: unknown) => {
        if (!alive) return;
        setSession(parseMe(j));
      })
      .catch(() => setSession(null));
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = session?.role === "ADMIN";

  return (
    <div style={{ padding: "18px 0 42px" }}>
      <div className="container-app">
        <div className="topbar" style={{ padding: 14, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div className="brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Image
                src="/logo-ma-fliesen.jpeg"
                alt="ma-fliesen Logo"
                width={120}
                height={40}
                priority
                style={{ objectFit: "contain" }}
              />

              <div>
                <div style={{ fontWeight: 900, lineHeight: 1.05 }}>ma-fliesen</div>
                <div style={{ color: "var(--muted-2)", fontSize: 12, marginTop: 2 }}>
                  {activeLabel ?? "#wirkönnendas"}
                </div>
              </div>
            </div>

            <div className="nav-pills">
              <Link className={`pill ${isActive(pathname, "/erfassung") ? "pill-active" : ""}`} href="/erfassung">
                ⊞ Erfassung
              </Link>

              <Link className={`pill ${isActive(pathname, "/kalender") ? "pill-active" : ""}`} href="/kalender">
                {isAdmin ? "🗓 Termine" : "🗓 Kalender"}
              </Link>

              <Link className={`pill ${isActive(pathname, "/uebersicht") ? "pill-active" : ""}`} href="/uebersicht">
                ▦ Übersicht
              </Link>

              {isAdmin && (
                <Link
                  className={`pill ${isActive(pathname, "/admin/wochenplan") ? "pill-active" : ""}`}
                  href="/admin/wochenplan"
                >
                  🧑‍💼 Wochenplan
                </Link>
              )}

              {isAdmin && (
                <Link
                  className={`pill ${isActive(pathname, "/admin/password-reset") ? "pill-active" : ""}`}
                  href="/admin/password-reset"
                >
                  🔐 Passwort-Reset
                </Link>
              )}
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}