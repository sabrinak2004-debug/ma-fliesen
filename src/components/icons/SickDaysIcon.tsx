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
      {/* Bettpfosten links */}
      <rect x="6" y="18" width="6" height="32" rx="3" fill={color} />

      {/* Kopf */}
      <circle cx="20" cy="30" r="6" fill={color} />

      {/* Bettfläche (unter Kopf) */}
      <rect x="12" y="36" width="18" height="6" fill={color} />

      {/* Bett (große Fläche mit Rundung rechts) */}
      <path
        d="M30 36 H48 A10 10 0 0 1 58 46 V48 A4 4 0 0 1 54 52 H30 Z"
        fill={color}
      />

      {/* Bettbein rechts */}
      <rect x="52" y="48" width="6" height="8" rx="3" fill={color} />

      {/* Kreuz oben */}
      <rect x="36" y="8" width="8" height="20" rx="4" fill={color} />
      <rect x="30" y="14" width="20" height="8" rx="4" fill={color} />
    </svg>
  );
}