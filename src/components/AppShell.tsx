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


type NavItem = {
  href: string;
  label: string;
  icon: string;
};

function mobileItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 14,
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 16,
    color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.82)",
    background: active ? "rgba(169,194,63,0.12)" : "transparent",
    borderLeft: active ? "4px solid #A9C23F" : "4px solid transparent",
    paddingLeft: active ? 12 : 16,
    transition: "all 0.15s ease",
  };
}

function desktopSidebarItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 15,
    color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)",
    background: active ? "rgba(184,207,58,0.12)" : "transparent",
    border: active
      ? "1px solid rgba(184,207,58,0.32)"
      : "1px solid transparent",
    boxShadow: active ? "0 0 0 1px rgba(184,207,58,0.06) inset" : "none",
    transition: "all 0.15s ease",
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
  const [sessionLoading, setSessionLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);


  useEffect(() => {
    let alive = true;

    async function loadSession() {
      try {
        setSessionLoading(true);

        const res = await fetch("/api/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const json = (await res.json()) as unknown;

        if (!alive) return;
        setSession(parseMe(json));
      } catch {
        if (!alive) return;
        setSession(null);
      } finally {
        if (!alive) return;
        setSessionLoading(false);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadSession();
      }
    }

    function onFocus() {
      void loadSession();
    }

    function onPageShow() {
      void loadSession();
    }

    void loadSession();

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
    const employeeNavItems: NavItem[] = [
    { href: "/erfassung", label: "Erfassung", icon: "⊞" },
    { href: "/kalender", label: "Kalender", icon: "🗓" },
    { href: "/uebersicht", label: "Übersicht", icon: "▦" },
  ];

  const adminNavItems: NavItem[] = [
    { href: "/kalender", label: "Termine", icon: "🗓" },
    { href: "/admin/dashboard", label: "Admin-Übersicht", icon: "▦" },
    { href: "/admin/wochenplan", label: "Wochenplan", icon: "🧑‍💼" },
    { href: "/admin/urlaubsantraege", label: "Urlaubsanträge", icon: "🌴" },
    { href: "/admin/krankheitsantraege", label: "Krankheitsanträge", icon: "🤒" },
    { href: "/admin/password-reset", label: "Passwort-Reset", icon: "🔐" },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  useEffect(() => {
  setMobileOpen(false);
}, [pathname]);

useEffect(() => {
  document.body.style.overflow = mobileOpen ? "hidden" : "";
  return () => {
    document.body.style.overflow = "";
  };
}, [mobileOpen]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } finally {
      setMenuOpen(false);
      setMobileOpen(false);
      window.location.href = "/login";
    }
  }

  const userName = sessionLoading
    ? "Lade..."
    : session?.fullName ?? "Nicht eingeloggt";

  const userInitials =
    sessionLoading ? "…" : session ? initialsFromName(session.fullName) : "U";

  return (
    <div style={{ padding: "18px 0 42px" }}>
      <div className="container-app">
{/* MOBILE TOPBAR (nur < md) */}
<div
  className="md:hidden"
  style={{
    position: "relative",
    zIndex: 1,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: "calc(12px + env(safe-area-inset-top))",
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
  <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 80, overflow: "hidden" }}>
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
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={mobileItemStyle(isActive(pathname, item.href))}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
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

        {/* MOBILE CONTENT */}
        <div className="md:hidden" style={{ minWidth: 0 }}>
          {children}
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="appshell-desktop hidden md:grid">
          {/* Sidebar */}
          <aside className="appshell-sidebar">
            <div className="appshell-sidebar-top">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Image
                  src="/logo-ma-fliesen.jpeg"
                  alt="ma-fliesen Logo"
                  width={120}
                  height={40}
                  priority
                  style={{ objectFit: "contain" }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, lineHeight: 1.05 }}>ma-fliesen</div>
                  <div
                    style={{
                      color: "var(--muted-2)",
                      fontSize: 12,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {activeLabel ?? "#wirkönnendas"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  height: 4,
                  width: 56,
                  borderRadius: 999,
                  background: "var(--accent)",
                }}
              />
            </div>

            <nav className="appshell-sidebar-nav">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={desktopSidebarItemStyle(active)}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 22,
                        display: "inline-flex",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ minWidth: 0 }}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="appshell-sidebar-bottom">
              <div
                style={{
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    border: "1px solid #9db02f",
                    background: "#9db02f61",
                    color: "rgba(20, 12, 12, 0.92)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="appshell-content">
            <div className="topbar" style={{ padding: 14, marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1.1 }}>
                    {activeLabel ?? "ma-fliesen"}
                  </div>
                  <div style={{ color: "var(--muted-2)", fontSize: 13, marginTop: 4 }}>
                    {isAdmin ? "Adminbereich" : "Mitarbeiterbereich"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.06)",
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

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      lineHeight: 1.1,
                    }}
                  >
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
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}