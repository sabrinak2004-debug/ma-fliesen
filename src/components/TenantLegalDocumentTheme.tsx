"use client";

import { useEffect } from "react";
import {
  applyTenantThemeToDocument,
  type TenantTheme,
} from "@/lib/tenantBranding";

type TenantLegalDocumentThemeProps = {
  theme: TenantTheme;
};

function ensureThemeColorMeta(): HTMLMetaElement {
  const existing = document.head.querySelector('meta[name="theme-color"]');

  if (existing instanceof HTMLMetaElement) {
    return existing;
  }

  const element = document.createElement("meta");
  element.name = "theme-color";
  document.head.appendChild(element);
  return element;
}

export default function TenantLegalDocumentTheme({
  theme,
}: TenantLegalDocumentThemeProps): null {
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const themeColorMeta = ensureThemeColorMeta();

    applyTenantThemeToDocument(theme);

    htmlElement.classList.add("tenant-legal-active");
    bodyElement.classList.add("tenant-legal-active");

    themeColorMeta.content = theme.bg;

    return () => {
      htmlElement.classList.remove("tenant-legal-active");
      bodyElement.classList.remove("tenant-legal-active");
    };
  }, [theme]);

  return null;
}