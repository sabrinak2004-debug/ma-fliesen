"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LEGAL_UI_TEXTS,
  normalizeAppUiLanguage,
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";
import { readPublicLanguage } from "@/lib/publicLanguage";

type LegalBackButtonProps = {
  fallbackHref: string;
  label?: string;
  language?: AppUiLanguage;
};

export default function LegalBackButton({
  fallbackHref,
  label,
  language = "DE",
}: LegalBackButtonProps) {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<AppUiLanguage>(language);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  useEffect(() => {
    setCurrentLanguage(normalizeAppUiLanguage(readPublicLanguage()));
  }, []);

  function handleClick(): void {
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
      {label ?? translate(currentLanguage, "back", LEGAL_UI_TEXTS)}
    </button>
  );
}