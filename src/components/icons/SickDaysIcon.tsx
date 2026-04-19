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
      aria-hidden="true"
    >
      {/* Bettpfosten links */}
      <path
        d="M8 24V48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Kopf */}
      <circle
        cx="18"
        cy="29"
        r="4.5"
        stroke={color}
        strokeWidth={strokeWidth}
      />

      {/* Verbindung / Schulterbereich */}
      <path
        d="M22.5 29H23.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Linke obere Liegefläche */}
      <path
        d="M9 34H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />

      {/* Rechte obere Liegefläche */}
      <path
        d="M24 30H38C43.523 30 48 34.477 48 40V40"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rechte senkrechte Rundung / Bettbein */}
      <path
        d="M48 40V48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Untere durchgehende Bettfläche */}
      <path
        d="M8 40H48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />

      {/* Medizinisches Kreuz oben */}
      <path
        d="M25 9H31V14H36V20H31V25H25V20H20V14H25V9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}