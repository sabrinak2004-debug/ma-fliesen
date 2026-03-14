import type { Metadata } from "next";
import "./globals.css";
import PushBootstrap from "@/components/PushBootstrap";

export const metadata: Metadata = {
  title: "ma-fliesen – Mitarbeiterportal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f4f6ef" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0f0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MA Fliesen" />
        <link rel="apple-touch-icon" href="/icon_2.jpeg" />
      </head>
      <body>
        <div style={{ position: "relative", zIndex: 1 }}>
          <PushBootstrap />
          {children}
        </div>
      </body>
    </html>
  );
}


