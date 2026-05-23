import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitaTribe | Yapay Zeka Destekli Sosyal Fitness Ağı ve Motivasyon Uygulaması",
  description: "VitaTribe ile her gün antrenman yap, spor topluluğuna katıl, diyetisyenlerle birebir çalış ve streak serini koru. Sağlıklı yaşam ve fitness motivasyonunu keşfet.",
  keywords: ["fitness uygulaması", "diyetisyen", "streak takibi", "spor motivasyonu", "fitness ağı", "sağlıklı beslenme", "yapay zeka fitness", "antrenman programı", "VitaTribe"],
  authors: [{ name: "VitaTribe Team" }],
  openGraph: {
    title: "VitaTribe | Türkiye'nin Yeni Nesil Sosyal Fitness Ağı",
    description: "Antrenman serini koru, uzman diyetisyenlerden destek al ve arkadaşlarınla beraber geliş. VitaTribe'e bugün katıl.",
    url: "https://vitatribe.com",
    siteName: "VitaTribe",
    locale: "tr_TR",
    type: "website",
  },
};

import MobileNav from "@/components/MobileNav";

export default function RootLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    <html lang={lang}>
      <body className="min-h-full flex flex-col">
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
