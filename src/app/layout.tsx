import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Affiliate Applications Expertise Demo | Tensor Garden",
  description: "AI affiliate management software demo for application review, partner scoring, fraud detection, payout controls, and program analytics.",
  keywords: [
    "affiliate management software",
    "affiliate applications",
    "AI application review",
    "partner program operations",
    "affiliate fraud detection",
    "commission payout rules",
    "Tensor Garden portfolio",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
