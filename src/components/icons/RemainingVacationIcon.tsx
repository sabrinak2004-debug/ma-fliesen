export function RemainingVacationIcon({
  size = 24,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Kalender Rahmen */}
      <rect x="8" y="14" width="48" height="40" rx="8" />

      {/* Kalender obere Linie */}
      <line x1="8" y1="24" x2="56" y2="24" />

      {/* Kalender Ringe */}
      <line x1="20" y1="10" x2="20" y2="18" />
      <line x1="44" y1="10" x2="44" y2="18" />

      {/* Palme */}
      <path d="M32 42 L32 32" />
      <path d="M32 32 C28 28, 24 28, 22 30" />
      <path d="M32 32 C36 28, 40 28, 42 30" />
      <path d="M32 32 C30 26, 34 26, 36 28" />
    </svg>
  );
}