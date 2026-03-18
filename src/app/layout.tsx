import type { Metadata } from "next";
import "./globals.css";
import PushBootstrap from "@/components/PushBootstrap";

export const metadata: Metadata = {
  title: "Mitarbeiterportal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0f0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mitarbeiterportal" />
        <link rel="apple-touch-icon" href="/image_2.jpeg" />
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