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
      <rect x="40" y="10" width="8" height="20" rx="2.5" />
      <rect x="34" y="16" width="20" height="8" rx="2.5" />

      {/* Kopf (kleiner + Abstand) */}
      <circle cx="24" cy="30" r="5" />

      {/* Bettpfosten links (etwas länger) */}
      <rect x="14" y="20" width="4" height="28" rx="2" />

      {/* Verbindung Kopf -> Bett (dicker + gleiche Höhe) */}
      <rect x="18" y="34" width="14" height="5" rx="1.5" />

      {/* Bettkörper (etwas kompakter) */}
      <path d="M32 32H46C52 32 56 36 56 41V42H32V32Z" />

      {/* rechter Fuß (näher dran) */}
      <rect x="54" y="42" width="4" height="10" rx="2" />

      {/* untere Linie (gleiche Höhe wie Kopf-Linie) */}
      <rect x="32" y="37" width="24" height="5" rx="1.5" />
    </svg>
  );
}