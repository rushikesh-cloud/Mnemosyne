import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mnemosyne",
  description: "Enterprise knowledge operations workbench"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className="light" lang="en">
      <body>{children}</body>
    </html>
  );
}
