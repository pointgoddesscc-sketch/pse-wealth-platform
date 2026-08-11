import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PS&E Bank | Private Banking & Wealth",
  description:
    "PS&E Bank wealth platform — accounts, transfers, cards, crypto, and gift card tools. Support: psebank@pm.me",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#070b14" />
      </head>
      <body
        style={{
          margin: 0,
          background: "#070b14",
          color: "#e2e8f0",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
