import * as React from "react";

type SickBedIconProps = {
  size?: number;
  color?: string;
};

export default function SickBedIcon({
  size = 24,
  color = "currentColor",
}: SickBedIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Linkes Bettbein / Pfosten */}
      <rect x="6" y="18" width="6" height="32" rx="3" fill={color} />

      {/* Kopf */}
      <circle cx="20" cy="30" r="6" fill={color} />

      {/* Linke Liegefläche */}
      <rect x="12" y="35" width="11" height="7" fill={color} />

      {/* Rechte Liegefläche (JETZT DICKER) */}
      <path
        d="M26 30 H42 C48 30 52 35 52 42 V50 H49 V42 C49 37.5 45.5 34 41.5 34 H26 Z"
        fill={color}
      />

      {/* Rechtes Bettbein */}
      <rect x="49" y="42" width="3" height="8" rx="1.5" fill={color} />

      {/* Kreuz */}
      <rect x="28" y="8" width="8" height="16" rx="2" fill={color} />
      <rect x="24" y="12" width="16" height="8" rx="2" fill={color} />
    </svg>
  );
}