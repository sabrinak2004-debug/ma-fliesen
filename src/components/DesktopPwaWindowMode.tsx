"use client";

import { useEffect } from "react";

function isNavigatorStandalone(): boolean {
  const standaloneNavigator = navigator as Navigator & {
    standalone?: unknown;
  };

  return standaloneNavigator.standalone === true;
}

function isStandaloneDisplayMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    isNavigatorStandalone()
  );
}

function isDesktopViewport(): boolean {
  return window.matchMedia("(min-width: 768px)").matches;
}

function isProbablyFullscreenWindow(): boolean {
  const widthDifference = Math.abs(window.outerWidth - window.screen.width);
  const heightDifference = Math.abs(window.outerHeight - window.screen.height);

  return widthDifference <= 24 && heightDifference <= 32;
}

export default function DesktopPwaWindowMode() {
  useEffect(() => {
    let animationFrameId = 0;

    function updateWindowModeClass(): void {
      window.cancelAnimationFrame(animationFrameId);

      animationFrameId = window.requestAnimationFrame(() => {
        const root = document.documentElement;

        const shouldTrack =
          isStandaloneDisplayMode() && isDesktopViewport();

        if (!shouldTrack) {
          root.classList.remove(
            "app-standalone-windowed",
            "app-standalone-fullscreen"
          );
          return;
        }

        const fullscreenWindow = isProbablyFullscreenWindow();

        root.classList.toggle("app-standalone-fullscreen", fullscreenWindow);
        root.classList.toggle("app-standalone-windowed", !fullscreenWindow);
      });
    }

    updateWindowModeClass();

    window.addEventListener("resize", updateWindowModeClass);
    window.visualViewport?.addEventListener("resize", updateWindowModeClass);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateWindowModeClass);
      window.visualViewport?.removeEventListener(
        "resize",
        updateWindowModeClass
      );

      document.documentElement.classList.remove(
        "app-standalone-windowed",
        "app-standalone-fullscreen"
      );
    };
  }, []);

  return null;
}