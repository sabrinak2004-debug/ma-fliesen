import * as React from "react";

type UnpaidIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function UnpaidIcon({
  size = 20,
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
      {/* Großes € */}
      <text
        x="12"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="900"
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