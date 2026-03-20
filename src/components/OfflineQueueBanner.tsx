"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { readOfflineQueue } from "@/lib/offline/queue";
import { flushOfflineQueue } from "@/lib/offline/sync";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

type SyncState = "idle" | "syncing" | "success" | "error";

function getQueueCount(): number {
  return readOfflineQueue().length;
}

export default function OfflineQueueBanner() {
  const { isOnline } = useOfflineStatus();
  const [queueCount, setQueueCount] = useState<number>(() => getQueueCount());
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const autoSyncRanRef = useRef(false);

  useEffect(() => {
    function updateQueueCount(): void {
      setQueueCount(getQueueCount());
    }

    window.addEventListener("storage", updateQueueCount);
    window.addEventListener("focus", updateQueueCount);
    window.addEventListener("online", updateQueueCount);
    window.addEventListener("offline-queue-changed", updateQueueCount as EventListener);

    return () => {
      window.removeEventListener("storage", updateQueueCount);
      window.removeEventListener("focus", updateQueueCount);
      window.removeEventListener("online", updateQueueCount);
      window.removeEventListener("offline-queue-changed", updateQueueCount as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    if (autoSyncRanRef.current) return;
    if (queueCount === 0) return;

    autoSyncRanRef.current = true;

    void (async () => {
      const result = await flushOfflineQueue();
      const after = getQueueCount();
      setQueueCount(after);

      if (result.failed > 0) {
        setSyncState("error");
        setStatusMessage(
          `${result.processed} Aktion(en) synchronisiert, ${result.failed} Aktion(en) noch offen.`
        );
        return;
      }

      if (result.processed > 0) {
        setSyncState("success");
        setStatusMessage(`${result.processed} Aktion(en) erfolgreich synchronisiert.`);
      }
    })();
  }, [isOnline, queueCount]);

  useEffect(() => {
    if (syncState === "idle") return;

    const timer = window.setTimeout(() => {
      setSyncState("idle");
      setStatusMessage("");
      setQueueCount(getQueueCount());
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [syncState]);

  const visible = useMemo(() => {
    return queueCount > 0 || syncState === "syncing" || statusMessage.trim() !== "";
  }, [queueCount, syncState, statusMessage]);

  async function handleManualSync(): Promise<void> {
    if (!isOnline) {
      setSyncState("error");
      setStatusMessage("Keine Synchronisierung möglich, solange du offline bist.");
      return;
    }

    if (queueCount === 0) {
      return;
    }

    setSyncState("syncing");
    setStatusMessage("");

    try {
      const result = await flushOfflineQueue();
      const after = getQueueCount();
      setQueueCount(after);

      if (result.failed > 0) {
        setSyncState("error");
        setStatusMessage(
          `${result.processed} Aktion(en) synchronisiert, ${result.failed} Aktion(en) noch offen.`
        );
        return;
      }

      setSyncState("success");
      setStatusMessage(`${result.processed} Aktion(en) erfolgreich synchronisiert.`);
    } catch {
      setSyncState("error");
      setStatusMessage("Synchronisierung ist fehlgeschlagen.");
    }
  }

  if (!visible) {
    return null;
  }

  const background =
    syncState === "error"
      ? "rgba(224, 75, 69, 0.92)"
      : syncState === "success"
      ? "rgba(184, 207, 58, 0.92)"
      : "rgba(255, 196, 0, 0.92)";

  const textColor =
    syncState === "success" ? "rgba(15, 20, 17, 0.95)" : "rgba(255,255,255,0.96)";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1001,
        width: "100%",
        background,
        color: textColor,
        padding: "10px 14px",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.4 }}>
          {syncState === "syncing"
            ? "Offline-Aktionen werden synchronisiert..."
            : statusMessage.trim()
            ? statusMessage
            : `${queueCount} Offline-Aktion(en) warten auf Synchronisierung.`}
        </div>

        <button
          type="button"
          onClick={() => void handleManualSync()}
          disabled={!isOnline || syncState === "syncing" || queueCount === 0}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.12)",
            color: textColor,
            cursor:
              !isOnline || syncState === "syncing" || queueCount === 0
                ? "not-allowed"
                : "pointer",
            fontWeight: 900,
            opacity: !isOnline || syncState === "syncing" || queueCount === 0 ? 0.7 : 1,
          }}
        >
          {syncState === "syncing" ? "Synchronisiert..." : "Jetzt synchronisieren"}
        </button>
      </div>
    </div>
  );
}