import * as React from "react";

type UnpaidIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function UnpaidIcon({
  size = 24,
  className,
  strokeWidth = 2,
}: UnpaidIconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Geldschein */}
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />

      {/* GROSSES € */}
      <text
        x="12"
        y="13.8"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"          // 👈 groß gemacht
        fontWeight="900"      // 👈 fett
        fill="currentColor"
      >
        €
      </text>

      {/* Durchgestrichen */}
      <path
        d="M4 20L20 4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}