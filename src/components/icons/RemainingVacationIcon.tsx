import * as React from "react";

type RemainingVacationIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

export default function RemainingVacationIcon({
  size = 30,
  style,
  className,
  strokeWidth = 1.9,
}: RemainingVacationIconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        opacity: 1,
        color: "inherit",
        ...style,
      }}
    >
      {/* Kalender außen */}
      <path
        d="M4.4 4.1H19.6C20.65 4.1 21.5 4.95 21.5 6V18.7C21.5 19.75 20.65 20.6 19.6 20.6H17.55"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        strokeOpacity={1}
      />
      <path
        d="M6.45 20.6H4.4C3.35 20.6 2.5 19.75 2.5 18.7V6C2.5 4.95 3.35 4.1 4.4 4.1"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        strokeOpacity={1}
      />

      {/* Kalender-Ringe */}
      <rect
        x="5.35"
        y="2.2"
        width="1.55"
        height="3.05"
        rx="0.775"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={1}
        strokeOpacity={1}
      />
      <rect
        x="17.1"
        y="2.2"
        width="1.55"
        height="3.05"
        rx="0.775"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={1}
        strokeOpacity={1}
      />


      {/* Schirmdach außen */}
      <path
        d="M8.1 14.25C8.25 11.7 10.35 9.9 13 9.9C15.75 9.9 17.95 11.95 18.05 14.65L8.1 14.25Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />

      {/* Schirm-Segmente */}
      <path
        d="M10.95 13.95C11.2 12.15 12.05 10.8 13.35 9.95"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />
      <path
        d="M14.65 14.45C14.85 12.55 14.35 11.05 13.35 9.95"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />
      <path
        d="M13.55 9.4L13.35 9.95"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />

      {/* Schirmmast */}
      <path
        d="M12.55 14.2L11.75 18.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />

      {/* Liege Sitzfläche */}
      <path
        d="M9.6 20.05H13.65L16.9 16.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        strokeOpacity={1}
      />
      <rect
        x="8.95"
        y="18.95"
        width="5.95"
        height="1.35"
        rx="0.675"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={1}
        strokeOpacity={1}
      />

      {/* Liege Rückenlehne */}
      <path
        d="M14.75 19.15L17.55 16.35C17.85 16.05 18.32 16.02 18.62 16.32C18.92 16.62 18.9 17.1 18.6 17.4L15.95 20.05"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={1}
        strokeOpacity={1}
      />

      {/* Liegenbeine */}
      <path
        d="M10.05 20.3L9.7 21.65"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />
      <path
        d="M15.05 20.15L15.45 21.65"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={1}
        strokeOpacity={1}
      />
    </svg>
  );
}