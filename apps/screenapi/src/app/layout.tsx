import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScreenAPI - Professional Screenshot API",
  description: "Capture high-quality screenshots of any website with our powerful API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
