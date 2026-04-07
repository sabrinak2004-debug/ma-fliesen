import type { Metadata } from "next";
import PushBootstrap from "@/components/PushBootstrap";
import { getSession } from "@/lib/auth";
import { normalizeAppUiLanguage, toHtmlLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Mitarbeiterportal",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const language = normalizeAppUiLanguage(session?.language);
  const htmlLang = toHtmlLang(language);

  return (
    <html lang={htmlLang}>
      <head>
        <meta name="theme-color" content="#f4f2ee" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mitarbeiterportal" />
      </head>
      <body>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
          }}
        >
          <PushBootstrap />
          {children}
        </div>
      </body>
    </html>
  );
}
