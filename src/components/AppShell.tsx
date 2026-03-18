"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAccentColorToDocument,
  applyTenantHeadBranding,
  getTenantAppleTouchIconHref,
  getTenantManifestHref,
  normalizeThemeColor,
  resetAccentColorOnDocument,
} from "@/lib/tenantBranding";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

type SessionData = {
  userId: string;
  fullName: string;
  role: "EMPLOYEE" | "ADMIN";
  companyId: string;
  companyName: string;
  companySubdomain: string;
  companyLogoUrl: string | null;
  primaryColor: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSessionData(v: unknown): v is SessionData {
  if (!isRecord(v)) return false;
  const userId = v["userId"];
  const fullName = v["fullName"];
  const role = v["role"];
  const companyId = v["companyId"];
  const companyName = v["companyName"];
  const companySubdomain = v["companySubdomain"];
  const companyLogoUrl = v["companyLogoUrl"];
  const primaryColor = v["primaryColor"];

  return (
    typeof userId === "string" &&
    typeof fullName === "string" &&
    (role === "EMPLOYEE" || role === "ADMIN") &&
    typeof companyId === "string" &&
    typeof companyName === "string" &&
    typeof companySubdomain === "string" &&
    (typeof companyLogoUrl === "string" || companyLogoUrl === null) &&
    (typeof primaryColor === "string" || primaryColor === null)
  );
}

function parseMe(j: unknown): SessionData | null {
  if (!isRecord(j)) return null;
  const s = j["session"];
  if (s === null) return null;
  return isSessionData(s) ? s : null;
}

function normalizeLogoSrc(
  value: string | null,
  companySubdomain: string
): string | null {
  const normalizedSubdomain = companySubdomain.trim().toLowerCase();

  if (normalizedSubdomain) {
    return `/tenant-assets/${normalizedSubdomain}/icon-512.jpeg`;
  }

  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    return null;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  return `/${trimmed}`;
}

type BrandConfig = {
  appTitle: string;
  displayName: string;
  slogan: string;
  logoUrl: string | null;
  accent: string;
  companySubdomain: string;
};

function buildBrandConfig(session: SessionData | null): BrandConfig {
  const fallback: BrandConfig = {
    appTitle: "Mitarbeiterportal",
    displayName: "Mitarbeiterportal",
    slogan: "#firmenportal",
    logoUrl: null,
    accent: "#b8cf3a",
    companySubdomain: "",
  };

  if (!session) {
    return fallback;
  }

  const companyName = session.companyName.trim();
  const accent = normalizeThemeColor(session.primaryColor);

  return {
    appTitle: `${companyName} Mitarbeiterportal`,
    displayName: companyName,
    slogan: "#einsatzplanung",
    logoUrl: session.companyLogoUrl,
    accent,
    companySubdomain: session.companySubdomain,
  };
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

type OpenTasksApiTask = {
  id: string;
  status: "OPEN" | "COMPLETED";
};

type OpenTasksApiResponse = {
  tasks: OpenTasksApiTask[];
};

type AdminRequestsApiResponse = {
  ok: true;
  requests: {
    status: "PENDING" | "APPROVED" | "REJECTED";
  }[];
};

function isAdminRequestsApiResponse(v: unknown): v is AdminRequestsApiResponse {
  if (!isRecord(v)) return false;
  if (v["ok"] !== true) return false;

  const requests = v["requests"];
  if (!Array.isArray(requests)) return false;

  return requests.every(
    (r) =>
      isRecord(r) &&
      (r["status"] === "PENDING" ||
        r["status"] === "APPROVED" ||
        r["status"] === "REJECTED")
  );
}

function isOpenTasksApiTask(v: unknown): v is OpenTasksApiTask {
  if (!isRecord(v)) return false;
  const id = v["id"];
  const status = v["status"];

  return (
    typeof id === "string" &&
    (status === "OPEN" || status === "COMPLETED")
  );
}

function isOpenTasksApiResponse(v: unknown): v is OpenTasksApiResponse {
  return (
    isRecord(v) &&
    Array.isArray(v["tasks"]) &&
    v["tasks"].every(isOpenTasksApiTask)
  );
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
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const [openVacationRequests, setOpenVacationRequests] = useState(0);
  const [openSickRequests, setOpenSickRequests] = useState(0);
  const [openCorrectionRequests, setOpenCorrectionRequests] = useState(0);

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

const loadOpenTaskCount = useCallback(async (): Promise<void> => {
  if (!session || session.role !== "EMPLOYEE") {
    setOpenTaskCount(0);
    return;
  }

  try {
    const res = await fetch("/api/tasks?status=OPEN", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const json: unknown = await res.json().catch(() => ({}));

    if (!res.ok || !isOpenTasksApiResponse(json)) {
      setOpenTaskCount(0);
      return;
    }

    setOpenTaskCount(json.tasks.length);
  } catch {
    setOpenTaskCount(0);
  }
}, [session]);

const loadAdminRequestCounts = useCallback(async (): Promise<void> => {
  if (!session || session.role !== "ADMIN") {
    setOpenVacationRequests(0);
    setOpenSickRequests(0);
    setOpenCorrectionRequests(0);
    return;
  }

  try {
    const [vacRes, sickRes, corrRes] = await Promise.all([
      fetch("/api/admin/absence-requests?type=VACATION&status=PENDING", {
        cache: "no-store",
        credentials: "include",
      }),
      fetch("/api/admin/absence-requests?type=SICK&status=PENDING", {
        cache: "no-store",
        credentials: "include",
      }),
      fetch("/api/admin/time-entry-correction-requests?status=PENDING", {
        cache: "no-store",
        credentials: "include",
      }),
    ]);

    const vacJson: unknown = await vacRes.json().catch(() => ({}));
    const sickJson: unknown = await sickRes.json().catch(() => ({}));
    const corrJson: unknown = await corrRes.json().catch(() => ({}));

    if (vacRes.ok && isAdminRequestsApiResponse(vacJson)) {
      setOpenVacationRequests(vacJson.requests.length);
    }

    if (sickRes.ok && isAdminRequestsApiResponse(sickJson)) {
      setOpenSickRequests(sickJson.requests.length);
    }

    if (corrRes.ok && isAdminRequestsApiResponse(corrJson)) {
      setOpenCorrectionRequests(corrJson.requests.length);
    }
  } catch {
    setOpenVacationRequests(0);
    setOpenSickRequests(0);
    setOpenCorrectionRequests(0);
  }
}, [session]);

  const isAdmin = session?.role === "ADMIN";
  const brand = buildBrandConfig(session);
  const brandLogoSrc = normalizeLogoSrc(
    brand.logoUrl,
    brand.companySubdomain
  );

  const employeeNavItems: NavItem[] = [
    { href: "/erfassung", label: "Erfassung", icon: "⊞" },
    { href: "/kalender", label: "Kalender", icon: "🗓" },
    { href: "/uebersicht", label: "Übersicht", icon: "▦" },
    { href: "/aufgaben", label: "Aufgaben", icon: "📋" },
  ];

  const adminNavItems: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
    { href: "/kalender", label: "Termine", icon: "🗓" },
    { href: "/admin/wochenplan", label: "Wochenplan", icon: "🧑‍💼" },
    { href: "/admin/urlaubsantraege", label: "Urlaubsanträge", icon: "🌴" },
    { href: "/admin/krankheitsantraege", label: "Krankheitsanträge", icon: "🤒" },
    { href: "/admin/nachtragsanfragen", label: "Nachtragsanträge", icon: "🕘" },
    { href: "/admin/tasks", label: "Aufgaben", icon: "📋" },
    { href: "/admin/password-reset", label: "Passwort-Reset", icon: "🔐" },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  useEffect(() => {
    void loadOpenTaskCount();
    void loadAdminRequestCounts();
  }, [loadOpenTaskCount, loadAdminRequestCounts, pathname]);

  useEffect(() => {
  function onTasksChanged() {
    void loadOpenTaskCount();
  }

  function onAdminRequestsChanged() {
    void loadAdminRequestCounts();
  }

  window.addEventListener("tasks-changed", onTasksChanged);
  window.addEventListener("admin-requests-changed", onAdminRequestsChanged);

  return () => {
    window.removeEventListener("tasks-changed", onTasksChanged);
    window.removeEventListener("admin-requests-changed", onAdminRequestsChanged);
  };
}, [loadOpenTaskCount, loadAdminRequestCounts]);

  useEffect(() => {
    applyAccentColorToDocument(brand.accent);

    return () => {
      resetAccentColorOnDocument();
    };
  }, [brand.accent]);

  useEffect(() => {
    applyTenantHeadBranding({
      title: brand.appTitle,
      themeColor: "#0b0f0c",
      appName: brand.displayName,
      manifestHref: getTenantManifestHref(brand.companySubdomain),
      appleTouchIconHref: getTenantAppleTouchIconHref(brand.companySubdomain),
    });
  }, [brand]);

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
      const targetLogin =
        session?.companySubdomain
          ? `/${session.companySubdomain}/login`
          : "/login";

      window.location.href = targetLogin;
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
            background: "rgba(14,16,14,0.92)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
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

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 0,
                  }}
                >
                  {brandLogoSrc ? (
                    <img
                      src={brandLogoSrc}
                      alt={`${brand.displayName} Logo`}
                      style={{
                        width: 92,
                        height: 92,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 110,
                        height: 34,
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--accent-soft, rgba(184, 207, 58, 0.14))",
                        border: "1px solid var(--accent-border, rgba(184, 207, 58, 0.35))",
                        color: "rgba(255,255,255,0.95)",
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: 0.3,
                      }}
                    >
                      {brand.displayName}
                    </div>
                  )}
                  <div
                    style={{
                      fontWeight: 900,
                      color: "rgba(255,255,255,0.95)",
                      lineHeight: 1.05,
                      marginTop: 6,
                    }}
                  >
                    {brand.displayName}
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
                    {activeLabel ?? brand.slogan}
                  </div>
                </div>
              </div>
            </div>

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
          <div
            className="md:hidden"
            style={{ position: "fixed", inset: 0, zIndex: 80, overflow: "hidden" }}
          >
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

            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: 320,
                maxWidth: "86vw",
                background: "#161916",
                color: "rgba(255,255,255,0.92)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                borderRight: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {isAdmin ? "Admin" : "Mitarbeiter"}
                  </div>
                  <div
                    style={{
                      fontWeight: 900,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {userName}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      height: 4,
                      width: 54,
                      borderRadius: 99,
                      background: "#A9C23F",
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

              <nav className="appshell-mobile-nav">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  const showTaskBadge =
                    !isAdmin && item.href === "/aufgaben" && openTaskCount > 0;

                  const showVacationBadge =
                    isAdmin && item.href === "/admin/urlaubsantraege" && openVacationRequests > 0;

                  const showSickBadge =
                    isAdmin && item.href === "/admin/krankheitsantraege" && openSickRequests > 0;

                  const showCorrectionBadge =
                    isAdmin && item.href === "/admin/nachtragsanfragen" && openCorrectionRequests > 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`appshell-nav-item ${active ? "is-active" : ""}`}
                    >
                      <span className="appshell-nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <span className="appshell-nav-label">{item.label}</span>

                        {showTaskBadge || showVacationBadge || showSickBadge || showCorrectionBadge ? (
                          <span
                            aria-label={`${openTaskCount} offene Aufgaben`}
                            style={{
                              minWidth: 22,
                              height: 22,
                              padding: "0 7px",
                              borderRadius: 999,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "var(--accent)",
                              color: "#111",
                              fontSize: 15,
                              fontWeight: 1000,
                              lineHeight: 1,
                              flexShrink: 0,
                            }}
                          >
                            {showTaskBadge
                              ? openTaskCount
                              : showVacationBadge
                                ? openVacationRequests
                                : showSickBadge
                                  ? openSickRequests
                                  : openCorrectionRequests}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div style={{ flex: 1 }} />

              <button
                type="button"
                onClick={handleLogout}
                className="appshell-logout-btn"
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
          <aside className="appshell-sidebar">
            <div className="appshell-sidebar-top">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {brandLogoSrc ? (
                  <img
                    src={brandLogoSrc}
                    alt={`${brand.displayName} Logo`}
                    style={{
                      width: 132,
                      height: 132,
                      objectFit: "contain",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 40,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--accent-soft, rgba(184, 207, 58, 0.14))",
                      border: "1px solid var(--accent-border, rgba(184, 207, 58, 0.35))",
                      color: "rgba(255,255,255,0.95)",
                      fontWeight: 900,
                      fontSize: 12,
                      letterSpacing: 0.3,
                    }}
                  >
                    {brand.displayName}
                  </div>
                )}
                <div style={{ minWidth: 0, paddingTop: 6 }}>
                  <div style={{ fontWeight: 900, lineHeight: 1.05 }}>{brand.displayName}</div>
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
                    {activeLabel ?? brand.slogan}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  height: 4,
                  width: 80,
                  borderRadius: 999,
                  background: "var(--accent)",
                }}
              />
            </div>

            <nav className="appshell-sidebar-nav">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                const showTaskBadge =
                  !isAdmin && item.href === "/aufgaben" && openTaskCount > 0;

                const showVacationBadge =
                  isAdmin && item.href === "/admin/urlaubsantraege" && openVacationRequests > 0;

                const showSickBadge =
                  isAdmin && item.href === "/admin/krankheitsantraege" && openSickRequests > 0;

                const showCorrectionBadge =
                  isAdmin && item.href === "/admin/nachtragsanfragen" && openCorrectionRequests > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`appshell-nav-item ${active ? "is-active" : ""}`}
                  >
                    <span className="appshell-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      <span
                        className="appshell-nav-label"
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </span>

                      {showTaskBadge ||
                      showVacationBadge ||
                      showSickBadge ||
                      showCorrectionBadge ? (
                        <span
                          aria-label={`${openTaskCount} offene Aufgaben`}
                          style={{
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            borderRadius: 999,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--accent)",
                            color: "#111",
                            fontSize: 12,
                            fontWeight: 1000,
                            lineHeight: 1,
                            flexShrink: 0,
                          }}
                        >
                          {showTaskBadge
                            ? openTaskCount
                            : showVacationBadge
                              ? openVacationRequests
                              : showSickBadge
                                ? openSickRequests
                                : openCorrectionRequests}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="appshell-sidebar-bottom">
              <div className="appshell-sidebar-logout-wrap">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="appshell-logout-btn"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

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
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 22,
                      lineHeight: 1.1,
                    }}
                  >
                    {activeLabel ?? brand.displayName}
                  </div>
                  <div
                    style={{
                      color: "var(--muted-2)",
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {isAdmin ? "Adminbereich" : "Mitarbeiterbereich"}
                  </div>
                </div>

                <div
                  ref={menuRef}
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
                    <div
                      className="appshell-username"
                      style={{ fontWeight: 800, fontSize: 13 }}
                    >
                      {userName}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: isAdmin
                            ? "rgba(0,200,255,0.14)"
                            : "rgba(255,255,255,0.06)",
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