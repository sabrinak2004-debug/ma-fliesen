"use client";

import { useEffect } from "react";

export default function PushBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Worker Registrierung fehlgeschlagen:", err);
    });
  }, []);

  return null;
}