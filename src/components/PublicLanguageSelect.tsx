"use client";

import React from "react";
import {
  APP_UI_LANGUAGES,
  getLanguageLabel,
  normalizeAppUiLanguage,
  type AppUiLanguage,
} from "@/lib/i18n";

type PublicLanguageSelectProps = {
  value: AppUiLanguage;
  onChange: (language: AppUiLanguage) => void;
  label: string;
};

export default function PublicLanguageSelect({
  value,
  onChange,
  label,
}: PublicLanguageSelectProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <select
        className="input"
        value={value}
        onChange={(event) => onChange(normalizeAppUiLanguage(event.target.value))}
      >
        {APP_UI_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {getLanguageLabel(language)}
          </option>
        ))}
      </select>
    </div>
  );
}