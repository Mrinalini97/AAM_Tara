import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ variable: "--font-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tara — Know yourself before choosing someone else",
  description:
    "A calm space to explore your values, expectations, and the conversations that matter before a life-partner decision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
