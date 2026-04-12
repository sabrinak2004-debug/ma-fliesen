"use client";

import React, { useEffect, useRef } from "react";
import {
  normalizeAppUiLanguage,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  zIndex?: number;
  disableBackdropClose?: boolean;
  closeAriaLabel?: string;
};

type ModalTextKey = "close";

const MODAL_UI_TEXTS: Record<ModalTextKey, Record<AppUiLanguage, string>> = {
  close: {
    DE: "Schließen",
    EN: "Close",
    IT: "Chiudi",
    TR: "Kapat",
    SQ: "Mbyll",
    KU: "Bigire",
  },
};

function tModal(language: AppUiLanguage, key: ModalTextKey): string {
  return translate(language, key, MODAL_UI_TEXTS);
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = 920,
  zIndex = 50,
  disableBackdropClose = false,
  closeAriaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const onCloseRef = useRef(onClose);

  const resolvedLanguage = normalizeAppUiLanguage(
    typeof document !== "undefined" ? document.documentElement.lang.toUpperCase() : "DE"
  );

  const resolvedCloseAriaLabel =
    closeAriaLabel ?? tModal(resolvedLanguage, "close");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        background: "var(--app-overlay-backdrop)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        boxSizing: "border-box",
      }}
      onMouseDown={(e) => {
        if (disableBackdropClose) return;
        if (e.target === e.currentTarget) {
          onCloseRef.current();
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="app-modal-panel app-modal-panel-surface"
        style={{
          width: `min(${maxWidth}px, calc(100vw - 24px))`,
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "calc(100dvh - 24px)",
          overflow: "hidden",
          borderRadius: 16,
          boxShadow: "var(--app-shadow-strong)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          className="app-modal-header-surface"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flex: "0 0 auto",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              minWidth: 0,
            }}
          >
            {title ?? ""}
          </div>

          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label={resolvedCloseAriaLabel}
            className="app-modal-close-button"
            style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: 10,
              flex: "0 0 auto",
            }}
          >
            ✕
          </button>
        </div>

        <div
          className="app-modal-body"
          style={{
            padding: 16,
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            flex: "1 1 auto",
            minWidth: 0,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {children}
          </div>
        </div>

        {footer ? (
          <div
            className="app-modal-footer app-modal-footer-surface"
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
              flex: "0 0 auto",
              minWidth: 0,
              width: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}