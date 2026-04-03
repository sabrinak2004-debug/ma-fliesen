"use client";

import React, { useEffect, useState } from "react";

type Props = {
  message: string;
  duration?: number;
};

export default function Toast({ message, duration = 4000 }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className="app-toast-surface"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 14,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        zIndex: 9999,
        maxWidth: "90%",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}