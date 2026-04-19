import * as React from "react";

type RemainingVacationIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function RemainingVacationIcon({
  size = 24,
  className,
  strokeWidth = 2,
}: RemainingVacationIconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Kalender */}
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M8 2.75V6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M16 2.75V6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M3 8H21"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Palme – geschwungen wie dein Bild */}
      <path
        d="M12 18C12 15 12.5 13 13 11"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      <path
        d="M13 11C11.5 10 10 10 9 11"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M13 11C14.5 10 16 10 17 11"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M13 11C12 9.8 11 9.5 10 9.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M13 11C14 9.8 15 9.5 16 9.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}