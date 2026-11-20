import type { Metadata } from "next";
import { Providers } from "./providers";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Polices hébergées avec le site (aucune requête vers Google depuis le navigateur des visiteurs)
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:43210";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "ScreenAPI — Website screenshot API from €9/month", template: "%s · ScreenAPI" },
  description:
    "Turn any URL into a PNG, JPEG, WebP or PDF with one API call. Full page, mobile devices, dark mode, cookie banners removed. 100 free screenshots every month, paid plans from €9.",
  openGraph: { type: "website", siteName: "ScreenAPI" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
