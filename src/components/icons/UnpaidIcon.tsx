import * as React from "react";

type UnpaidIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function UnpaidIcon({
  size = 100,
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
      xmlns="http://www.w3.org/2000/svg"
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

      {/* Kreis / Wertsymbol */}
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />

      {/* kleine Markierungen links/rechts */}
      <path
        d="M6 9H6.01M18 9H18.01M6 15H6.01M18 15H18.01"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

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