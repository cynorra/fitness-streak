import type { Metadata } from "next";
import "../globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vitatribe.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "DietitianFit | Diyetisyen, Kilo Verme ve Spor Takip Uygulaması",
    template: "%s | DietitianFit",
  },
  description: "DietitianFit ile gerçek diyetisyenlerle birebir çalış, kilo verme ve beslenme planı al, antrenmanını ve spor salonu serini arkadaşlarınla takip et. Sağlıklı yaşam ve fitness motivasyonunu keşfet.",
  keywords: ["diyetisyen", "diyetisyen bul", "kilo verme", "fitness uygulaması", "spor salonu", "antrenman takibi", "streak takibi", "spor motivasyonu", "fitness ağı", "sağlıklı beslenme", "yapay zeka fitness", "antrenman programı", "DietitianFit"],
  authors: [{ name: "DietitianFit Team" }],
  alternates: {
    canonical: BASE_URL,
    languages: {
      'tr': `${BASE_URL}/tr`,
      'en': `${BASE_URL}/en`,
      'es': `${BASE_URL}/es`,
      'pt': `${BASE_URL}/pt`,
      'ru': `${BASE_URL}/ru`,
      'zh': `${BASE_URL}/zh`,
      'ja': `${BASE_URL}/ja`,
      'ko': `${BASE_URL}/ko`,
      'x-default': `${BASE_URL}/tr`,
    },
  },
  openGraph: {
    title: "DietitianFit | Diyetisyen + Spor Tek Uygulamada",
    description: "Antrenman serini koru, uzman diyetisyenlerden destek al ve arkadaşlarınla beraber geliş. DietitianFit'e bugün katıl.",
    url: BASE_URL,
    siteName: "DietitianFit",
    locale: "tr_TR",
    alternateLocale: ["en_US", "es_ES", "pt_BR", "ru_RU", "zh_CN", "ja_JP", "ko_KR"],
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DietitianFit — Diyetisyen ve Spor Uygulaması",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DietitianFit | Sosyal Fitness Ağı",
    description: "Antrenman serini koru, diyetisyenlerden destek al. DietitianFit'e katıl!",
    images: ["/og-image.png"],
    creator: "@vitatribeapp",
    site: "@vitatribeapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import MobileNav from "@/components/MobileNav";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  return (
    <html lang={lang}>
      <body className="min-h-full flex flex-col">
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
