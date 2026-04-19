import * as React from "react";

type RemainingVacationIconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function RemainingVacationIcon({
  size = 20,
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
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
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

      <path
        d="M7.1 18.4C7.7 17.4 8.3 16.4 9 15.3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M6.6 13.8C7.2 13.1 8 12.7 9 12.7C10.1 12.7 10.9 13.1 11.5 13.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M8.9 11.6C8.6 12.4 8.3 13.4 8.2 14.3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M8.9 11.6C9.8 11.1 10.8 10.9 11.8 11.1"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M8.9 11.6C8 11 7.1 10.7 6.1 10.8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      <path
        d="M13.8 19H9.7C9.2 19 8.9 18.7 8.9 18.2C8.9 17.7 9.2 17.4 9.7 17.4H14.9L17 15.4C17.4 15 18 15 18.3 15.4C18.7 15.7 18.7 16.3 18.3 16.7L15.9 19"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 13.2L15.1 17.4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12.2 13.8C13.1 13 14.2 12.6 15.5 12.7C16.8 12.8 17.8 13.3 18.5 14.2"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M13.3 19L13.7 20.4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M16.1 19L16.5 20.4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}