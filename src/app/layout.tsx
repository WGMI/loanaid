import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoanAid — Pathways Bank Field-to-Core Lending Platform",
  description:
    "Pitch demo: offline-first field origination + alternative-data credit scoring for Pathways Bank Nigeria.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=IBM+Plex+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-on-surface font-body">
        {children}
      </body>
    </html>
  );
}
