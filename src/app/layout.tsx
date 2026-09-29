import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socialora — Understand Your Social",
  description: "Multi-brand social media analytics, content ops, and AI workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
