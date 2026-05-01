"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
    RO: "Închide",
  },
};

function tModal(language: AppUiLanguage, key: ModalTextKey): string {
  return translate(language, key, MODAL_UI_TEXTS);
}

function resolveDocumentLanguage(): AppUiLanguage {
  if (typeof document === "undefined") {
    return "DE";
  }

  return normalizeAppUiLanguage(document.documentElement.lang.toUpperCase());
}

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = 760,
  zIndex = 5000,
  disableBackdropClose = false,
  closeAriaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  const resolvedLanguage = resolveDocumentLanguage();

  const resolvedCloseAriaLabel =
    closeAriaLabel ?? tModal(resolvedLanguage, "close");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("app-modal-open");

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.classList.remove("app-modal-open");
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="app-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px, 2.4vw, 22px)",
        background: "var(--app-overlay-backdrop)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        boxSizing: "border-box",
      }}
      onMouseDown={(event) => {
        if (disableBackdropClose) return;

        if (event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="app-modal-panel app-modal-panel-solid"
        style={{
          width: `min(${maxWidth}px, calc(100vw - 24px))`,
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "min(88svh, 760px)",
          overflow: "hidden",
          borderRadius: 18,
          boxShadow: "var(--app-shadow-strong)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          outline: "none",
        }}
      >
        <div
          className="app-modal-header-surface"
          style={{
            padding: "12px 14px",
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
              fontSize: 15,
              fontWeight: 800,
              color: "var(--text)",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
            padding: 14,
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
              padding: 14,
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
    </div>,
    document.body
  );
}