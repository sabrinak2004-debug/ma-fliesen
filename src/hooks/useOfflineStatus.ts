"use client";

import { useEffect, useState } from "react";
import { getCurrentNetworkState } from "@/lib/offline/network";

export type OfflineStatus = {
  isOnline: boolean;
  checkedAt: string;
};

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>(() => getCurrentNetworkState());

  useEffect(() => {
    function updateOnlineStatus(): void {
      setStatus(getCurrentNetworkState());
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return status;
}