import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const site =
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Redline: stress-test your trade before the market does",
  description:
    "An AI trading desk for Bitget tokenized US stocks. Historical analogues, stress tests, and a Judge who writes the pre-mortem before you place the order.",
  openGraph: {
    title: "Redline your trade before the market does.",
    description: "Analogues, stress tests, and a Judge who writes the pre-mortem before you size the ticket.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const THEME_SCRIPT = `try{var t=JSON.parse(localStorage.getItem("redline.theme"));if(t==="night"||t==="day")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="day" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
