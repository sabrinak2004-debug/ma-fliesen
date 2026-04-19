import * as React from "react";

type SickDaysIconProps = {
  size?: number;
  className?: string;
};

export default function SickDaysIcon({
  size = 24,
  className,
}: SickDaysIconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Kreuz */}
      <rect x="40" y="8" width="8" height="22" rx="2.5" />
      <rect x="33" y="15" width="22" height="8" rx="2.5" />

      {/* Kopf */}
      <circle cx="24" cy="30" r="6" />

      {/* Bettpfosten links */}
      <rect x="14" y="22" width="4" height="24" rx="2" />

      {/* Bettauflage links */}
      <rect x="18" y="35" width="9" height="5" rx="1" />

      {/* Bettkörper / Decke */}
      <path d="M32 32H48C54 32 58 36 58 42V43H32V32Z" />

      {/* Fußteil rechts */}
      <rect x="56" y="42" width="4" height="11" rx="2" />

      {/* Übergang zwischen Kopfteil und Bett */}
      <rect x="18" y="34" width="14" height="4.5" rx="1.2" />

      {/* Unterer Bettbereich für kompakteren Look */}
      <rect x="32" y="39" width="26" height="4" rx="1" />
    </svg>
  );
}