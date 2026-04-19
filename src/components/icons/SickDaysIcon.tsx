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
      {/* Linkes Bettbein / Bettpfosten */}
      <rect x="6" y="18" width="6" height="32" rx="3" fill={color} />

      {/* Kopf */}
      <circle cx="20" cy="30" r="6" fill={color} />

      {/* Linke Liegefläche (dünner, unten bündig mit rechts) */}
      <rect x="12" y="37" width="11" height="5" fill={color} />

      {/* Rechte Liegefläche (mit kleiner Lücke zur linken Fläche, insgesamt dünner) */}
      <path
        d="M26 33 H42 C48 33 52 37 52 43 V50 H49 V43 C49 39.7 46.3 37 43 37 H26 Z"
        fill={color}
      />

      {/* Rechtes Bettbein, unten bündig mit links */}
      <rect x="49" y="42" width="3" height="8" rx="1.5" fill={color} />

      {/* Kreuz */}
      <rect x="28" y="8" width="8" height="16" rx="2" fill={color} />
      <rect x="24" y="12" width="16" height="8" rx="2" fill={color} />
    </svg>
  );
}