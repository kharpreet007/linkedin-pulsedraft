import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading-family" });

export const metadata: Metadata = {
  title: "LinkedIn PostAi — Draft Desk",
  description: "Daily Scout → Remy → Val content pipeline for LinkedIn posts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
