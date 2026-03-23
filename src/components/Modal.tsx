"use client";

import React, { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
  zIndex?: number;
  disableBackdropClose?: boolean;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = 920,
  zIndex = 50,
  disableBackdropClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
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
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        boxSizing: "border-box",
      }}
      onMouseDown={(e) => {
        if (disableBackdropClose) return;
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="app-modal-panel"
        style={{
          width: `min(${maxWidth}px, calc(100vw - 24px))`,
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "calc(100dvh - 24px)",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(12,12,12,0.92)",
          boxShadow: "0 18px 70px rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
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
              color: "rgba(255,255,255,0.92)",
              minWidth: 0,
            }}
          >
            {title ?? ""}
          </div>

          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Schließen"
            style={{
              width: 34,
              height: 34,
              minWidth: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              cursor: "pointer",
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
            className="app-modal-footer"
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
              flex: "0 0 auto",
              background: "rgba(12,12,12,0.92)",
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