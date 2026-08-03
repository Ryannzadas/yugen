import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yugen — Animes selecionados",
  description:
    "Um catálogo colaborativo de animes, wiki social e espaço para novas descobertas.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
