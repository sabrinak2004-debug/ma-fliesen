import * as React from "react";

type SickBedIconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

export default function SickBedIcon({
  size = 24,
  color = "currentColor",
  style,
  strokeWidth = 4,
}: SickBedIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        opacity: 500,
        color: "inherit",
        ...style,
      }}
    >
      {/* Linkes Bettbein / Pfosten */}
      <path
        d="M8 22V50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={500}
        strokeOpacity={500}
      />

      {/* Kopf */}
      <circle
        cx="18"
        cy="30"
        r="5"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={500}
        strokeOpacity={500}
      />


{/* Linke obere Liegefläche */}
      <path
        d="M10 38H23"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        opacity={500}
        strokeOpacity={500}
      />

      {/* Rechte Liegefläche mit Rundung */}
      <path
        d="M25 32 H40 C45 32 48 35 48 40 V46 L25 46 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={500}
        strokeOpacity={500}
      />

      {/* Rechte Rundung runter */}
      <path
        d="M48 40V50"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={500}
        strokeOpacity={500}
      />

      {/* Untere Bettlinie */}
      <path
        d="M8 46H48"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        opacity={500}
        strokeOpacity={500}
      />

      {/* Medizinisches Kreuz */}
      <path
        d="M26 10H32V14H36V20H32V24H26V20H22V14H26V10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={500}
        strokeOpacity={500}
      />
    </svg>
  );
}