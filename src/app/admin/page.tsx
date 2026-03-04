"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

type DashboardApi =
  | {
      ok: true;
      todayIso: string;
      weekRange: { from: string; to: string };
      monthRange: { from: string; to: string };
      cards: {
        plannedToday: number;
        absencesToday: number;
        missingToday: number;
        missingWeek: number;
        monthWorkMinutes: number;
        employeesActive: number;
      };
    }
  | { ok: false; error: string };

function minutesToHM(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.abs(min % 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

const UI = {
  bg: "#0b1220",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.65)",
};

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        background: UI.card,
        border: `1px solid ${UI.border}`,
        borderRadius: 16,
        padding: 14,
        minHeight: 92,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 12, color: UI.muted }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: UI.text }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: UI.muted }}>{hint}</div> : <div />}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardApi | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);

      const r = await fetch("/api/admin/dashboard");
      const j: DashboardApi = await r.json();

      setData(j);
    } catch {
      setData({ ok: false, error: "Netzwerkfehler" });
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);

  const title = useMemo(() => {
    if (!data || !data.ok) return "Admin – Dashboard";
    return `Admin – Dashboard (${data.todayIso})`;
  }, [data]);

  return (
    <AppShell activeLabel="Admin">
      <div style={{ padding: 18, color: UI.text }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: UI.muted, marginBottom: 14 }}>
          Überblick über Planung, Abwesenheiten und fehlende Einträge.
        </div>

        {loading ? (
          <div style={{ color: UI.muted }}>Lade…</div>
        ) : !data || !data.ok ? (
          <div style={{ color: UI.muted }}>Fehler: {data?.ok === false ? data.error : "Unbekannt"}</div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <Card
                title="Aktive Mitarbeiter"
                value={String(data.cards.employeesActive)}
                hint="EMPLOYEE (aktiv)"
              />
              <Card
                title="Geplante Einsätze heute"
                value={String(data.cards.plannedToday)}
                hint="PlanEntry heute"
              />
              <Card
                title="Abwesenheiten heute"
                value={String(data.cards.absencesToday)}
                hint="Urlaub + Krank"
              />
              <Card
                title="Fehlende Einträge heute"
                value={String(data.cards.missingToday)}
                hint="keine WorkEntry heute"
              />
              <Card
                title="Fehlende Einträge diese Woche"
                value={String(data.cards.missingWeek)}
                hint={`${data.weekRange.from} – ${data.weekRange.to}`}
              />
              <Card
                title="Arbeitszeit im Monat"
                value={minutesToHM(data.cards.monthWorkMinutes)}
                hint={`${data.monthRange.from} – ${data.monthRange.to}`}
              />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
  href="/admin/wochenplan"
  style={{
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${UI.border}`,
    background: "rgba(255,255,255,0.04)",
    color: UI.text,
    textDecoration: "none",
    fontWeight: 700,
  }}
>
  → Wochenplan öffnen
</Link>

<Link
  href="/kalender"
  style={{
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${UI.border}`,
    background: "rgba(255,255,255,0.04)",
    color: UI.text,
    textDecoration: "none",
    fontWeight: 700,
  }}
>
  → Kalender öffnen
</Link>

<Link
  href="/uebersicht"
  style={{
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${UI.border}`,
    background: "rgba(255,255,255,0.04)",
    color: UI.text,
    textDecoration: "none",
    fontWeight: 700,
  }}
>
  → Übersicht öffnen
</Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}