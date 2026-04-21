import * as React from "react";

type NotesClockIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export default function NotesClockIcon({
  size = 24,
  strokeWidth = 1.9,
  className,
}: NotesClockIconProps) {
  const pad = 3;
  const notebookX = 5;
  const notebookY = 4;
  const notebookW = 12.5;
  const notebookH = 15.5;

  const clockCx = 17.5;
  const clockCy = 17.5;
  const clockR = 5.25;

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
      {/* Notizblock */}
      <rect
        x={notebookX}
        y={notebookY}
        width={notebookW}
        height={notebookH}
        rx={2.2}
      />

      {/* Spiral-/Ringbindung oben */}
      <path d="M8 4V2.9" />
      <path d="M11.25 4V2.9" />
      <path d="M14.5 4V2.9" />

      {/* Linien auf dem Block */}
      <path d="M8 9H14.2" opacity="0.9" />
      <path d="M8 12H12.8" opacity="0.9" />
      <path d="M8 15H11.4" opacity="0.9" />

      {/* Stift diagonal, als würde er gerade schreiben */}
      <path d="M12.9 8.2L17.9 13.2" />
      <path d="M17.9 13.2L18.9 12.2" />
      <path d="M12.2 8.9L13.4 7.7" />
      <path d="M12.65 8.45L11.95 10.15L13.7 9.55" />

      {/* kleine Schreibspur */}
      <path d="M10.2 10.9C10.7 10.7 11.15 10.65 11.55 10.75" opacity="0.75" />

      {/* Uhr im Vordergrund */}
      <circle cx={clockCx} cy={clockCy} r={clockR} />

      {/* Uhrzeiger */}
      <path d="M17.5 17.5V14.9" />
      <path d="M17.5 17.5L19.35 18.65" />

      {/* kleines Zentrum für bessere Wirkung */}
      <circle cx={clockCx} cy={clockCy} r={0.45} fill="currentColor" stroke="none" />
    </svg>
  );
}