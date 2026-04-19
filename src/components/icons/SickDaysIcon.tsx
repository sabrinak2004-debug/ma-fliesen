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
      <rect x="39" y="11" width="8" height="18" rx="2.2" />
      <rect x="34" y="16" width="18" height="8" rx="2.2" />

      {/* Bettpfosten links */}
      <rect x="15" y="21" width="3.6" height="24" rx="1.8" />

      {/* Kopf */}
      <circle cx="24.2" cy="29.6" r="4.9" />

      {/* Kissen / Verbindung unter Kopf */}
      <rect x="20.2" y="34.1" width="8.4" height="3.8" rx="1.4" />

      {/* Verbindung vom Kopfbereich zum Bett */}
      <rect x="27.8" y="33.1" width="3.2" height="4.8" rx="1.2" />

      {/* Bettkörper */}
      <path d="M31 31.8H40.8C46.1 31.8 49.8 35.1 49.8 39.7V40.9H31V31.8Z" />

      {/* Unterkante Bett */}
      <rect x="31" y="37.2" width="18.8" height="3.7" rx="1.3" />

      {/* Rechter Bettfuß */}
      <rect x="48.2" y="40.7" width="3.2" height="8.2" rx="1.6" />
    </svg>
  );
}