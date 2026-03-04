"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
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

function initialsFromName(fullName: string) {
  const parts = fullName
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const isAdmin = session?.role === "ADMIN";

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setMenuOpen(false);
      window.location.href = "/login";
    }
  }

  const userName = session?.fullName ?? "Nicht eingeloggt";
  const userInitials = session ? initialsFromName(session.fullName) : "U";

  return (
    <div style={{ padding: "18px 0 42px" }}>
      <div className="container-app">
        <div className="topbar" style={{ padding: 14, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            {/* Brand */}
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

            {/* Nav + User menu */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isAdmin && (
                  <Link className={`pill ${isActive(pathname, "/erfassung") ? "pill-active" : ""}`} href="/erfassung">
                    ⊞ Erfassung
                  </Link>
                )}

                <Link className={`pill ${isActive(pathname, "/kalender") ? "pill-active" : ""}`} href="/kalender">
                  {isAdmin ? "🗓 Termine" : "🗓 Kalender"}
                </Link>

                {!isAdmin && (
                  <Link className={`pill ${isActive(pathname, "/uebersicht") ? "pill-active" : ""}`} href="/uebersicht">
                    ▦ Übersicht
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    className={`pill ${isActive(pathname, "/admin/dashboard") ? "pill-active" : ""}`}
                    href="/admin/dashboard"
                  >
                    ▦ Admin-Übersicht
                  </Link>
                )}

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

              {/* User dropdown */}
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.06)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      letterSpacing: 0.5,
                      background: "rgba(255,255,255,0.14)",
                    }}
                    aria-hidden="true"
                  >
                    {userInitials}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{userName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: isAdmin ? "rgba(255,170,0,0.16)" : "rgba(0,200,255,0.14)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.92)",
                        }}
                      >
                        {isAdmin ? "ADMIN" : "MITARBEITER"}
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.8 }} aria-hidden="true">
                        ▾
                      </span>
                    </div>
                  </div>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 10px)",
                      minWidth: 230,
                      padding: 10,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(20,20,20,0.92)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                      zIndex: 50,
                    }}
                  >
                    <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{userName}</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                        Rolle: {isAdmin ? "Admin" : "Mitarbeiter"}
                      </div>
                    </div>

                    <div style={{ height: 10 }} />

                    {!isAdmin && (
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        style={{
                          display: "block",
                          padding: "10px 12px",
                          borderRadius: 12,
                          textDecoration: "none",
                          fontWeight: 800,
                          color: "rgba(255,255,255,0.92)",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        🔐 Account
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "5px 7px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,80,80,0.16)",
                        color: "rgba(255,255,255,0.96)",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}