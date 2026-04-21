import * as React from "react";

type WeeklyStaffPlanIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function WeeklyStaffPlanIcon({
  size = 24,
  strokeWidth = 1.9,
  className,
  style,
}: WeeklyStaffPlanIconProps) {
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
      {/* Wochenplan / Raster im Hintergrund */}
      <path d="M4.2 4.6H19.8C20.46 4.6 21 5.14 21 5.8V13.6C21 14.26 20.46 14.8 19.8 14.8H18" />
      <path d="M6 14.8H4.2C3.54 14.8 3 14.26 3 13.6V5.8C3 5.14 3.54 4.6 4.2 4.6Z" />

      {/* Horizontale Rasterlinien */}
      <path d="M3 7.3H21" />
      <path d="M3 9.9H21" />
      <path d="M3 12.5H21" />

      {/* Vertikale Rasterlinien */}
      <path d="M7.5 4.6V11.9" />
      <path d="M12 4.6V11" />
      <path d="M16.5 4.6V11.9" />

      {/* Kleine Tages-Markierungen oben */}
      <path d="M4.8 6H6" />
      <path d="M9.3 6H10.5" />
      <path d="M13.8 6H15" />
      <path d="M18.3 6H19.5" />

      {/* Personen im Vordergrund */}
      {/* Köpfe */}
      <circle cx="7.4" cy="14.2" r="1.55" />
      <circle cx="12" cy="13.6" r="2.05" />
      <circle cx="16.6" cy="14.2" r="1.55" />

      {/* Schultern / Körper links */}
      <path d="M5.5 18.7V17.6C5.5 16.45 6.43 15.5 7.58 15.5H8.95C9.45 15.5 9.91 15.68 10.28 15.98" />

      {/* Schultern / Körper Mitte */}
      <path d="M8.45 19.25V17.95C8.45 16.33 9.76 15 11.38 15H12.62C14.24 15 15.55 16.33 15.55 17.95V19.25C15.55 19.74 15.16 20.12 14.68 20.15C13.86 20.21 12.96 20.25 12 20.25C11.04 20.25 10.14 20.21 9.32 20.15C8.84 20.12 8.45 19.74 8.45 19.25Z" />

      {/* Schultern / Körper rechts */}
      <path d="M18.5 18.7V17.6C18.5 16.45 17.57 15.5 16.42 15.5H15.05C14.55 15.5 14.09 15.68 13.72 15.98" />
    </svg>
  );
}