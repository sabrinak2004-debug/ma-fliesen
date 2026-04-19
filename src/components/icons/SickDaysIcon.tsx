import * as React from "react";

type SickBedIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export default function SickBedIcon({
  size = 24,
  color = "currentColor",
  strokeWidth = 4,
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
      <path
        d="M8 22V50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Kopf */}
      <circle
        cx="18"
        cy="30"
        r="5"
        stroke={color}
        strokeWidth={strokeWidth}
      />


{/* Linke obere Liegefläche */}
      <path
        d="M10 38H30"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />

      {/* Rechte Liegefläche mit Rundung */}
      <path
        d="M25 32 H40 C45 32 48 35 48 V46 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rechte Rundung runter */}
      <path
        d="M48 40V50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Untere Bettlinie */}
      <path
        d="M8 44H48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />

      {/* Medizinisches Kreuz */}
      <path
        d="M26 10H32V14H36V20H32V24H26V20H22V14H26V10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}