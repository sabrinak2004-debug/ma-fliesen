import type { Metadata } from "next";
import "./globals.css";
import PushBootstrap from "@/components/PushBootstrap";
import OfflineBanner from "@/components/OfflineBanner";
import OfflineQueueBanner from "@/components/OfflineQueueBanner";

export const metadata: Metadata = {
  title: "Mitarbeiterportal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <meta name="theme-color" content="#0b0f0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mitarbeiterportal" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/image_2.jpeg" />
      </head>
      <body>
        <OfflineBanner />
        <OfflineQueueBanner />
        <div style={{ position: "relative", zIndex: 1 }}>
          <PushBootstrap />
          {children}
        </div>
      </body>
    </html>
  );
}