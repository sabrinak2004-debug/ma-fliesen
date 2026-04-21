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
      {/* PLAN (um die Personen herum ausgespart) */}
      <path d="M4 5H20C20.6 5 21 5.4 21 6V14C21 14.6 20.6 15 20 15H18" />
      <path d="M6 15H4C3.4 15 3 14.6 3 14V6C3 5.4 3.4 5 4 5Z" />

      {/* Raster oben */}
      <path d="M3 7.5H21" />
      <path d="M3 10H21" />

      {/* Raster unten links/rechts (unterbrochen wegen Personen) */}
      <path d="M3 12.5H8" />
      <path d="M16 12.5H21" />

      {/* Vertikale Linien (oben) */}
      <path d="M8 5V10" />
      <path d="M12 5V9.5" />
      <path d="M16 5V10" />

      {/* Personen INTEGRIERT */}

      {/* Köpfe */}
      <circle cx="8" cy="14.5" r="1.4" />
      <circle cx="12" cy="14" r="1.9" />
      <circle cx="16" cy="14.5" r="1.4" />

      {/* Körper links */}
      <path d="M6.6 18V17.1C6.6 16.2 7.3 15.5 8.2 15.5H9.3" />

      {/* Körper Mitte */}
      <path d="M9.5 19V17.6C9.5 16.1 10.7 15 12.2 15H11.8C13.3 15 14.5 16.1 14.5 17.6V19" />

      {/* Körper rechts */}
      <path d="M17.4 18V17.1C17.4 16.2 16.7 15.5 15.8 15.5H14.7" />
    </svg>
  );
}