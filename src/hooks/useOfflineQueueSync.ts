"use client";

import { useEffect, useRef } from "react";
import { flushOfflineQueue } from "@/lib/offline/sync";

export function useOfflineQueueSync(onSynced?: () => void): void {
  const syncingRef = useRef(false);

  useEffect(() => {
    async function runSync(): Promise<void> {
      if (syncingRef.current) {
        return;
      }

      syncingRef.current = true;

      try {
        const result = await flushOfflineQueue();

        if (result.processed > 0) {
          window.dispatchEvent(new Event("offline-queue-changed"));

          if (onSynced) {
            onSynced();
          }
        }
      } finally {
        syncingRef.current = false;
      }
    }

    function handleOnline(): void {
      void runSync();
    }

    window.addEventListener("online", handleOnline);
    void runSync();

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [onSynced]);
}