"use client";

import { useRouter } from "next/navigation";

type LegalBackButtonProps = {
  fallbackHref: string;
  label?: string;
};

export default function LegalBackButton({
  fallbackHref,
  label = "Zurück",
}: LegalBackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      className="btn link-button-inline"
      onClick={handleClick}
    >
      {label}
    </button>
  );
}