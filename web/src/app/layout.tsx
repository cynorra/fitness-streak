import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Streak-Fit | Antrenman Serini Koru, Arkadaşlarınla Yarış",
  description: "Her gün antrenman yap, streak serini koru ve arkadaşlarınla rekabet et. En iyi fitness takip ve motivasyon uygulaması.",
  keywords: ["fitness", "streak", "antrenman", "takip", "motivasyon", "spor", "arkadaş"],
  authors: [{ name: "Streak-Fit Team" }],
  openGraph: {
    title: "Streak-Fit | Antrenman Serini Koru",
    description: "Her gün antrenman yap, streak serini koru ve arkadaşlarınla rekabet et.",
    url: "https://streak-fit.com",
    siteName: "Streak-Fit",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
