import * as React from "react";

type UnpaidIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

export default function UnpaidIcon({
  size = 24,
  className,
  style,
  strokeWidth = 2,
}: UnpaidIconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{color:"var(--tenant-icon-muted)"}}
    >
      {/* Großes € */}
      <text
        x="12"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="800"
        fill="currentcolor"
      >
        €
      </text>

      {/* Durchgestrichen */}
      <path
        d="M4 20L20 4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}