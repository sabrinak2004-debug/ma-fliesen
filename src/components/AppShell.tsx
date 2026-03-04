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

function mobileLinkStyle(active: boolean): React.CSSProperties {
  return {
    display: "block",
    padding: "12px 12px",
    borderRadius: 14,
    textDecoration: "none",
    fontWeight: 900,
    border: `1px solid ${active ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.12)"}`,
    background: active ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.9)",
    color: "rgba(0,0,0,0.92)",
  };
}

function mobileItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 14px",
    borderRadius: 18,
    textDecoration: "none",
    fontWeight: 900,

    // ✅ Active: dunkler Hintergrund + grüner Rand + weißer Text
    background: active ? "rgba(169,194,63,0.18)" : "rgba(255,255,255,0.06)",
    border: active ? "1px solid rgba(169,194,63,0.55)" : "1px solid rgba(255,255,255,0.12)",
    color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.82)",

    // optional: macht active “knackiger”
    boxShadow: active ? "0 10px 24px rgba(0,0,0,0.25)" : "none",
  };
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
  setMobileOpen(false);
}, [pathname]);

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
{/* MOBILE TOPBAR (nur < md) */}
<div
  className="md:hidden"
  style={{
    position: "sticky",
    top: 0,
    zIndex: 70,
    padding: 12,
    marginBottom: 12,
    background: "rgba(14,16,14,0.92)", // --bg-main
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.10)", // --border-light
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  }}
>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
    {/* Burger */}
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      aria-label="Menü öffnen"
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.95)",
        fontSize: 18,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      ☰
    </button>

    {/* Brand (Logo wirklich mittig) */}
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
          <Image
            src="/logo-ma-fliesen.jpeg"
            alt="ma-fliesen Logo"
            width={110}
            height={34}
            priority
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              fontWeight: 900,
              color: "rgba(255,255,255,0.95)",
              lineHeight: 1.05,
              marginTop: 6,
            }}
          >
            ma-fliesen
          </div>
          <div
            style={{
              fontSize: 12,
              marginTop: 2,
              color: "rgba(255,255,255,0.65)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 220,
            }}
          >
            {activeLabel ?? "#wirkönnendas"}
          </div>
        </div>
      </div>
    </div>

    {/* Avatar */}
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.95)",
        fontWeight: 900,
      }}
    >
      {userInitials}
    </div>
  </div>
</div>

{/* MOBILE SIDEBAR (nur < md) */}
{mobileOpen && (
  <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 80 }}>
    {/* Overlay (dunkel, leicht transparent) */}
    <button
      type="button"
      aria-label="Menü schließen"
      onClick={() => setMobileOpen(false)}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        border: "none",
        padding: 0,
      }}
    />

    {/* Drawer (dark + green accent) */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        width: 320,
        maxWidth: "86vw",
        background: "#161916", // --bg-card
        color: "rgba(255,255,255,0.92)", // --text-main
        boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderRight: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            {isAdmin ? "Admin" : "Mitarbeiter"}
          </div>
          <div style={{ fontWeight: 900, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {userName}
          </div>

          {/* kleiner grüner Akzent */}
          <div
            style={{
              marginTop: 10,
              height: 4,
              width: 54,
              borderRadius: 99,
              background: "#A9C23F", // accent green
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Schließen"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.95)",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ height: 6 }} />

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!isAdmin && (
          <Link href="/erfassung" style={mobileItemStyle(isActive(pathname, "/erfassung"))}>
            ⊞ Erfassung
          </Link>
        )}

        <Link href="/kalender" style={mobileItemStyle(isActive(pathname, "/kalender"))}>
          🗓 {isAdmin ? "Termine" : "Kalender"}
        </Link>

        {!isAdmin && (
          <Link href="/uebersicht" style={mobileItemStyle(isActive(pathname, "/uebersicht"))}>
            ▦ Übersicht
          </Link>
        )}

        {isAdmin && (
          <Link href="/admin/dashboard" style={mobileItemStyle(isActive(pathname, "/admin/dashboard"))}>
            ▦ Admin-Übersicht
          </Link>
        )}

        {isAdmin && (
          <Link href="/admin/wochenplan" style={mobileItemStyle(isActive(pathname, "/admin/wochenplan"))}>
            🧑‍💼 Wochenplan
          </Link>
        )}

        {isAdmin && (
          <Link href="/admin/password-reset" style={mobileItemStyle(isActive(pathname, "/admin/password-reset"))}>
            🔐 Passwort-Reset
          </Link>
        )}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "14px 14px",
          borderRadius: 18,
          border: "1px solid #9db02f",
          background: "#9db02fb6",
          color: "rgba(20, 12, 12, 0.92)",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  </div>
)}

        <div className="topbar hidden md:block" style={{ padding: 14, marginBottom: 18 }}>
          <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
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
              <div
                className="hidden md:flex"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                  paddingBottom: 4,
                }}
              >
                {!isAdmin && (
                  <Link className={`pill ${isActive(pathname, "/erfassung") ? "pill-active" : ""}`} href="/erfassung">
                    ⊞ Erfassung
                  </Link>
                )}

                <Link className={`pill ${isActive(pathname, "/admin/appointment") ? "pill-active" : ""}`} href="/kalender">
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
              <div ref={menuRef} className="hidden md:block" style={{ position: "relative" }}>
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
                    {/* Desktop/Tablet: Name + Rolle */}
                    <div className="appshell-username" style={{ fontWeight: 800, fontSize: 13 }}>
                      {userName}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: isAdmin ? "rgba(0,200,255,0.14)" : "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "rgba(255,255,255,0.92)",
                        }}
                      >
                        {isAdmin ? "ADMIN" : "MA"}
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
                        padding: "10px 12px",
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