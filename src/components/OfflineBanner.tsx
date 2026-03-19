"use client";

import React from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export default function OfflineBanner() {
  const { isOnline } = useOfflineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        background: "rgba(224, 75, 69, 0.92)",
        color: "#ffffff",
        padding: "10px 14px",
        fontSize: "14px",
        fontWeight: 600,
        textAlign: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      Offline-Modus aktiv – es werden gespeicherte Daten angezeigt.
    </div>
  );
}