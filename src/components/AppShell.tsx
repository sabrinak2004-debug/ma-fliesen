"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Image from "next/image";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AppShell({
  children,
  activeLabel,
}: {
  children: React.ReactNode;
  activeLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <div style={{ padding: "18px 0 42px" }}>
      <div className="container-app">
        <div className="topbar" style={{ padding: 14, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            <div className="brand">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
  <Image
    src="/logo-ma-fliesen.png"
    alt="MA Fliesen Logo"
    width={120}
    height={40}
    priority
    style={{ objectFit: "contain" }}
  />
</div>

              <div>
                <div style={{ fontWeight: 900, lineHeight: 1.05 }}>MA Fliesen</div>
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
                🗓 Kalender
              </Link>
              <Link className={`pill ${isActive(pathname, "/uebersicht") ? "pill-active" : ""}`} href="/uebersicht">
                ▦ Übersicht
              </Link>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}