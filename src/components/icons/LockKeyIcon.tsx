import * as React from "react";

type LockKeyIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function LockKeyIcon({
  size = 24,
  strokeWidth = 1.9,
  className,
  style,
}: LockKeyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Schloss (Hintergrund) */}
      <rect x="5" y="10" width="10.5" height="9" rx="2.2" />

      {/* Bügel */}
      <path d="M7.5 10V7.5C7.5 5.6 9 4.2 11 4.2C13 4.2 14.5 5.6 14.5 7.5V10" />

      {/* Schlüsselloch */}
      <circle cx="10.25" cy="13.8" r="0.9" />
      <path d="M10.25 14.7V16.5" />

      {/* Schlüssel (Vordergrund) */}
      {/* Kopf */}
      <circle cx="17.8" cy="16.8" r="2.4" />

      {/* Schaft */}
      <path d="M15.6 15.2L12.8 12.4" />

      {/* Zacken */}
      <path d="M12.8 12.4V10.9" />
      <path d="M11.6 11.2H12.8" />
    </svg>
  );
}