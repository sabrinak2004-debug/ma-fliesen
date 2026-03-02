"use client";

import React, { useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;

  /** Optional footer (Buttons etc.) */
  footer?: React.ReactNode;

  /** Optional: max width of dialog */
  maxWidth?: number;

  /** Optional: zIndex for stacking multiple modals */
  zIndex?: number;

  /** Optional: disable closing by clicking the backdrop */
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

  // ✅ always keep latest onClose without re-running "open" effect
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

    // ✅ Focus only once when opening (NOT on every re-render)
    setTimeout(() => {
      panelRef.current?.focus();
    }, 0);

    // Prevent background scrolling
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]); // ✅ only depend on "open"

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
        padding: 16,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onMouseDown={(e) => {
        if (disableBackdropClose) return;
        // close only if clicking backdrop (not the panel)
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          width: `min(${maxWidth}px, calc(100vw - 32px))`,
          maxHeight: "85vh",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(12,12,12,0.92)",
          boxShadow: "0 18px 70px rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            gap: 12,
            flex: "0 0 auto",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
            {title ?? ""}
          </div>

          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Schließen"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.9)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div
          style={{
            padding: 16,
            overflowY: "auto",
            overscrollBehavior: "contain",
            flex: "1 1 auto",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <div
            style={{
              padding: 16,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flex: "0 0 auto",
              background: "rgba(12,12,12,0.92)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}