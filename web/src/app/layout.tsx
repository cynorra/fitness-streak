import type { Metadata } from "next";
import "./globals.css";

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

import MobileNav from "@/components/MobileNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
