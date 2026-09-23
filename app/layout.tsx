import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redline: stress-test your trade before the market does",
  description: "An AI trading desk for Bitget tokenized US stocks. Historical analogs, stress tests, and a bull, bear and risk-officer debate before you place the order.",
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
