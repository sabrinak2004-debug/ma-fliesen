"use client";

import { useEffect, useRef, useState } from "react";
import PublicLanguageSelect from "@/components/PublicLanguageSelect";
import {
  translate,
  type AppUiLanguage,
} from "@/lib/i18n";
import {
  applyDocumentLanguage,
  readPublicLanguage,
  writePublicLanguage,
} from "@/lib/publicLanguage";

type ApiResponse = { ok: true } | { ok: false; error: string };

type ResetPasswordClientProps = {
  token: string;
  companySubdomain: string;
};

type ResetPasswordTextKey =
  | "language"
  | "title"
  | "companyAccess"
  | "missingToken"
  | "requestLinkAgain"
  | "newPassword"
  | "confirmPassword"
  | "save"
  | "saving"
  | "tokenMissingInvalid"
  | "passwordTooShort"
  | "passwordMismatch"
  | "resetFailed"
  | "resetSuccess"
  | "tokenInvalid"
  | "tokenAlreadyUsed"
  | "tokenExpired"
  | "userInactive"
  | "wrongCompany";

const RESET_PASSWORD_TEXTS: Record<
  ResetPasswordTextKey,
  Record<AppUiLanguage, string>
> = {
  language: {
    DE: "Sprache",
    EN: "Language",
    IT: "Lingua",
    TR: "Dil",
    SQ: "Gjuha",
    KU: "Ziman",
    RO: "Limba",
  },
  title: {
    DE: "Neues Passwort setzen",
    EN: "Set new password",
    IT: "Imposta una nuova password",
    TR: "Yeni şifre belirle",
    SQ: "Vendos fjalëkalim të ri",
    KU: "Şîfreya nû diyar bike",
    RO: "Setați o parolă nouă",
  },
  companyAccess: {
    DE: "Firmenzugang",
    EN: "Company access",
    IT: "Accesso aziendale",
    TR: "Şirket erişimi",
    SQ: "Qasja e kompanisë",
    KU: "Gihîştina şirketê",
    RO: "Acces companie",
  },
  missingToken: {
    DE: "Token fehlt. Bitte den Link vom Admin erneut anfordern.",
    EN: "Token is missing. Please request the link from the admin again.",
    IT: "Token mancante. Richiedi di nuovo il link all'admin.",
    TR: "Token eksik. Lütfen bağlantıyı yöneticiden tekrar isteyin.",
    SQ: "Token mungon. Ju lutem kërkojeni sërish linkun nga administratori.",
    KU: "Token tune. Ji kerema xwe lînkê dîsa ji rêvebir bixwaze.",
    RO: "Token este lipsă. Vă rugăm să solicitați din nou linkul de la administrator.",
  },
  requestLinkAgain: {
    DE: "Token fehlt. Bitte den Link vom Admin erneut anfordern.",
    EN: "Token is missing. Please request the link from the admin again.",
    IT: "Token mancante. Richiedi di nuovo il link all'admin.",
    TR: "Token eksik. Lütfen bağlantıyı yöneticiden tekrar isteyin.",
    SQ: "Token mungon. Ju lutem kërkojeni sërish linkun nga administratori.",
    KU: "Token tune. Ji kerema xwe lînkê dîsa ji rêvebir bixwaze.",
    RO: "Token este lipsă. Vă rugăm să solicitați din nou linkul de la administrator.",
  },
  newPassword: {
    DE: "Neues Passwort",
    EN: "New password",
    IT: "Nuova password",
    TR: "Yeni şifre",
    SQ: "Fjalëkalim i ri",
    KU: "Şîfreya nû",
    RO: "Parolă nouă",
  },
  confirmPassword: {
    DE: "Passwort bestätigen",
    EN: "Confirm password",
    IT: "Conferma password",
    TR: "Şifreyi onayla",
    SQ: "Konfirmo fjalëkalimin",
    KU: "Şîfreyê piştrast bike",
    RO: "Confirmare parolă",
  },
  save: {
    DE: "Passwort speichern",
    EN: "Save password",
    IT: "Salva password",
    TR: "Şifreyi kaydet",
    SQ: "Ruaj fjalëkalimin",
    KU: "Şîfreyê tomar bike",
    RO: "Salvează parola",
  },
  saving: {
    DE: "Speichern...",
    EN: "Saving...",
    IT: "Salvataggio...",
    TR: "Kaydediliyor...",
    SQ: "Po ruhet...",
    KU: "Tê tomarkirin...",
    RO: "Se salvează...",
  },
  tokenMissingInvalid: {
    DE: "Token fehlt (Link ist ungültig).",
    EN: "Token missing (link is invalid).",
    IT: "Token mancante (link non valido).",
    TR: "Token eksik (bağlantı geçersiz).",
    SQ: "Token mungon (linku është i pavlefshëm).",
    KU: "Token tune (lînk nederbasdar e).",
    RO: "Token lipsește (linkul este invalid).",
  },
  tokenInvalid: {
    DE: "Der Link ist ungültig.",
    EN: "The link is invalid.",
    IT: "Il link non è valido.",
    TR: "Bağlantı geçersiz.",
    SQ: "Linku është i pavlefshëm.",
    KU: "Lînk nederbasdar e.",
    RO: "Linkul este invalid.",
  },
  tokenAlreadyUsed: {
    DE: "Der Link wurde bereits verwendet.",
    EN: "The link has already been used.",
    IT: "Il link è già stato utilizzato.",
    TR: "Bağlantı zaten kullanıldı.",
    SQ: "Linku është përdorur tashmë.",
    KU: "Lînk berê hatî bikaranîn.",
    RO: "Linkul a fost deja folosit.",
  },
  tokenExpired: {
    DE: "Der Link ist abgelaufen.",
    EN: "The link has expired.",
    IT: "Il link è scaduto.",
    TR: "Bağlantının süresi doldu.",
    SQ: "Linku ka skaduar.",
    KU: "Demê lînkê derbas bûye.",
    RO: "Linkul a expirat.",
  },
  userInactive: {
    DE: "Dieser Benutzer ist nicht aktiv.",
    EN: "This user is not active.",
    IT: "Questo utente non è attivo.",
    TR: "Bu kullanıcı aktif değil.",
    SQ: "Ky përdorues nuk është aktiv.",
    KU: "Ev bikarhêner çalak nîne.",
    RO: "Acest utilizator nu este activ.",
  },
  wrongCompany: {
    DE: "Der Link gehört nicht zu diesem Firmenzugang.",
    EN: "The link does not belong to this company access.",
    IT: "Il link non appartiene a questo accesso aziendale.",
    TR: "Bağlantı bu şirket erişimine ait değil.",
    SQ: "Linku nuk i përket kësaj qasjeje të kompanisë.",
    KU: "Lînk ne a vê gihîştina şirketê ye.",
    RO: "Linkul nu aparține acestui acces companie.",
  },
  passwordTooShort: {
    DE: "Passwort muss mindestens 8 Zeichen haben.",
    EN: "Password must be at least 8 characters.",
    IT: "La password deve contenere almeno 8 caratteri.",
    TR: "Şifre en az 8 karakter olmalıdır.",
    SQ: "Fjalëkalimi duhet të ketë të paktën 8 karaktere.",
    KU: "Şîfre divê herî kêm 8 tîpan hebe.",
    RO: "Parola trebuie să aibă cel puțin 8 caractere.",
  },
  passwordMismatch: {
    DE: "Passwörter stimmen nicht überein.",
    EN: "Passwords do not match.",
    IT: "Le password non coincidono.",
    TR: "Şifreler eşleşmiyor.",
    SQ: "Fjalëkalimet nuk përputhen.",
    KU: "Şîfre hev nagirin.",
    RO: "Parolele nu se potrivesc.",
  },
  resetFailed: {
    DE: "Reset fehlgeschlagen.",
    EN: "Reset failed.",
    IT: "Reimpostazione non riuscita.",
    TR: "Sıfırlama başarısız.",
    SQ: "Rivendosja dështoi.",
    KU: "Nûkirin têk çû.",
    RO: "Resetul a eșuat.",
  },
  resetSuccess: {
    DE: "Passwort wurde gesetzt. Du kannst dich jetzt einloggen.",
    EN: "Password has been set. You can now log in.",
    IT: "La password è stata impostata. Ora puoi accedere.",
    TR: "Şifre ayarlandı. Artık giriş yapabilirsiniz.",
    SQ: "Fjalëkalimi u vendos. Tani mund të hyni.",
    KU: "Şîfre hate danîn. Niha dikarî têkevî.",
    RO: "Parola a fost setată. Acum te poți autentifica.",
  },
};

function tResetPassword(
  language: AppUiLanguage,
  key: ResetPasswordTextKey
): string {
  return translate(language, key, RESET_PASSWORD_TEXTS);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiResponse(value: unknown): ApiResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value["ok"] === true) {
    return { ok: true };
  }

  if (value["ok"] === false && typeof value["error"] === "string") {
    return { ok: false, error: value["error"] };
  }

  return null;
}

function getResetPasswordApiErrorMessage(
  language: AppUiLanguage,
  error?: string
): string {
  switch (error) {
    case "RESET_TOKEN_MISSING":
      return tResetPassword(language, "tokenMissingInvalid");
    case "RESET_PASSWORD_TOO_SHORT":
      return tResetPassword(language, "passwordTooShort");
    case "RESET_TOKEN_INVALID":
      return tResetPassword(language, "tokenInvalid");
    case "RESET_TOKEN_ALREADY_USED":
      return tResetPassword(language, "tokenAlreadyUsed");
    case "RESET_TOKEN_EXPIRED":
      return tResetPassword(language, "tokenExpired");
    case "RESET_USER_INACTIVE":
      return tResetPassword(language, "userInactive");
    case "RESET_TOKEN_WRONG_COMPANY":
      return tResetPassword(language, "wrongCompany");
    default:
      return tResetPassword(language, "resetFailed");
  }
}

export default function ResetPasswordClient({
  token,
  companySubdomain,
}: ResetPasswordClientProps) {
  const redirectTimerRef = useRef<number | null>(null);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState<AppUiLanguage>(() =>
    readPublicLanguage()
  );

  useEffect(() => {
    writePublicLanguage(language);
    applyDocumentLanguage(language);
  }, [language]);

  async function submit(): Promise<void> {
    setMsg("");

    if (!token) {
      setMsg(tResetPassword(language, "tokenMissingInvalid"));
      return;
    }

    if (pw1.length < 8) {
      setMsg(tResetPassword(language, "passwordTooShort"));
      return;
    }

    if (pw1 !== pw2) {
      setMsg(tResetPassword(language, "passwordMismatch"));
      return;
    }

    try {
      setBusy(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: pw1,
          companySubdomain,
        }),
      });

      const json: unknown = await response.json().catch(() => null);
      const data = parseApiResponse(json);

      if (!response.ok || !data || !data.ok) {
        setMsg(
          data && !data.ok
            ? getResetPasswordApiErrorMessage(language, data.error)
            : tResetPassword(language, "resetFailed")
        );
        return;
      }

      setMsg(tResetPassword(language, "resetSuccess"));

      redirectTimerRef.current = window.setTimeout(() => {
        if (companySubdomain) {
          window.location.replace(`/${companySubdomain}/login`);
          return;
        }

        window.location.replace("/login");
      }, 800);
    } catch {
      setMsg(tResetPassword(language, "resetFailed"));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="reset-password-shell">
      <div className="card card-olive reset-password-card">
        <h1 className="reset-password-title">
          {tResetPassword(language, "title")}
        </h1>
        <div style={{ marginTop: 12 }}>
          <PublicLanguageSelect
            value={language}
            onChange={setLanguage}
            label={tResetPassword(language, "language")}
          />
        </div>

        {companySubdomain ? (
          <div className="reset-password-company">
            {tResetPassword(language, "companyAccess")}: {companySubdomain}
          </div>
        ) : null}

        {!token ? (
          <div className="reset-password-empty">
            {tResetPassword(language, "requestLinkAgain")}
          </div>
        ) : (
          <div className="reset-password-form">
            <div className="reset-password-field">
              <div className="reset-password-label">
                {tResetPassword(language, "newPassword")}
              </div>
              <input
                value={pw1}
                onChange={(event) => setPw1(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="input"
              />
            </div>

            <div className="reset-password-field">
              <div className="reset-password-label">
                {tResetPassword(language, "confirmPassword")}
              </div>
              <input
                value={pw2}
                onChange={(event) => setPw2(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="input"
              />
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="btn btn-accent"
            >
              {busy
                ? tResetPassword(language, "saving")
                : tResetPassword(language, "save")}
            </button>

            {msg ? <div className="reset-password-message">{msg}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}