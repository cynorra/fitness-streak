import Navbar from "@/components/Navbar";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n";
import Script from "next/script";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vitatribe.com';

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "VitaTribe",
  url: BASE_URL,
  description: "Yapay zeka destekli sosyal fitness ağı. Streak takibi, diyetisyen desteği ve topluluk.",
  inLanguage: ["tr", "en", "es", "pt", "ru", "zh", "ja", "ko"],
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/tr/explore?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VitaTribe",
  applicationCategory: "HealthApplication",
  operatingSystem: ["Android", "iOS", "Web"],
  description: "VitaTribe ile günlük antrenman yap, streak serini koru, diyetisyenlerle birebir çalış ve fitness topluluğuna katıl.",
  url: BASE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1200",
    bestRating: "5",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VitaTribe",
  url: BASE_URL,
  logo: `${BASE_URL}/og-image.png`,
  sameAs: [
    "https://twitter.com/vitatribeapp",
    "https://instagram.com/vitatribeapp",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["Turkish", "English"],
  },
};

export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-700">
      {/* JSON-LD Structured Data for SEO & AEO */}
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="schema-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      <Navbar lang={lang} />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative px-6 py-24 md:py-48 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl animate-fade-in border border-white/10">
               {dict.home.heroBadge}
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter leading-[0.85] mb-10 max-w-5xl">
              {dict.home.heroTitle1} <br />
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent italic">
                {dict.home.heroTitle2}
              </span>
            </h1>
            <p className="text-xl md:text-3xl text-zinc-500 dark:text-zinc-400 max-w-3xl font-medium mb-16 leading-tight">
              {dict.home.heroDesc}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
              <Link
                href={`/${lang}/login`}
                className="px-12 py-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[2rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-110 transition-all active:scale-95 text-center group"
              >
                {dict.home.heroStartBtn}
              </Link>
              <Link
                href={`/${lang}/explore`}
                className="px-12 py-6 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] font-black text-xl uppercase tracking-[0.2em] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-center"
              >
                {dict.home.heroExploreBtn}
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Social Preview Section */}
        <section className="px-6 py-24 bg-zinc-50 dark:bg-zinc-900/50 relative overflow-hidden">
           <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                 <div>
                    <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mb-8">
                       Toplulukla Beraber <br /> Hedefine Ulaş.
                    </h2>
                    <div className="space-y-8">
                       {[
                          { title: "Sosyal Akış", desc: "Günlük antrenmanlarını paylaş, Kudos (beğeni) topla ve diğer sporcuları tebrik et.", icon: "🔥" },
                          { title: "Uzman Diyetisyenler", desc: "Profesyonel diyetisyenlerle birebir çalış, beslenme düzenini uzman ellerle yönet.", icon: "🤝" },
                          { title: "Gerçek Zamanlı Mesajlaşma", desc: "Koçunla veya arkadaşlarınla anlık iletişim kur, motivasyonunu asla kaybetme.", icon: "💬" }
                       ].map((item, i) => (
                          <div key={i} className="flex gap-6 group">
                             <div className="w-14 h-14 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                                {item.icon}
                             </div>
                             <div>
                                <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2">{item.title}</h4>
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{item.desc}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="relative">
                     <div className="aspect-square bg-gradient-to-br from-emerald-500 to-teal-500 rounded-[4rem] rotate-3 shadow-2xl flex items-center justify-center p-12 overflow-hidden group">
                       <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="bg-white dark:bg-zinc-900 w-full h-full rounded-[3rem] shadow-2xl p-8 flex flex-col gap-6 -rotate-3 group-hover:rotate-0 transition-all duration-700">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 font-black">V</div>
                             <div>
                                <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-2"></div>
                                <div className="h-2 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                             </div>
                          </div>
                          <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                          <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>

                          {/* Skeleton Image/Content Placeholder */}
                          <div className="w-full flex-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl mt-2 mb-2 flex items-center justify-center">
                             {/* Optional decorative inner element for the skeleton image */}
                             <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700/50 rounded-full flex items-center justify-center opacity-50">
                                <span className="text-3xl">🏃‍♂️</span>
                             </div>
                          </div>

                          <div className="mt-auto flex gap-4">
                             <div className="h-10 w-24 bg-emerald-500 rounded-xl"></div>
                             <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-xl"></div>
                          </div>
                       </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                 </div>
              </div>
           </div>
        </section>

        {/* Roles Section */}
        <section className="px-6 py-32">
           <div className="max-w-7xl mx-auto text-center mb-20">
              <h2 className="text-4xl md:text-7xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none mb-6">Herkes İçin Bir Yer.</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium">İster sporcu ol, ister uzman. VitaTribe seni bekliyor.</p>
           </div>
           <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="p-12 bg-zinc-900 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                 <h3 className="text-4xl font-black mb-6">Sporcular 🏋️‍♂️</h3>
                 <p className="text-zinc-400 font-medium text-lg leading-relaxed mb-10">Antrenman serini başlat, toplulukla paylaş ve arkadaşlarınla rekabet ederek her gün daha iyiye git.</p>
                 <Link href="/login" className="inline-block px-8 py-4 bg-emerald-500 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-emerald-500/20">Kayıt Ol</Link>
              </div>
              <div className="p-12 bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                 <h3 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 mb-6">Diyetisyenler 🥗</h3>
                 <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-relaxed mb-10">Profesyonel hizmetlerini binlerce kişiye ulaştır, danışanlarını takip et ve onlara rehberlik et.</p>
                 <Link href="/login" className="inline-block px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">Uzman Olarak Katıl</Link>
              </div>
           </div>
        </section>

        {/* Call to Action */}
        <section className="px-6 py-24 pb-40">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-100 dark:to-white rounded-[4rem] p-16 md:p-24 text-center text-white dark:text-zinc-900 relative overflow-hidden shadow-2xl group border border-white/5 dark:border-black/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-1000"></div>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 relative z-10 leading-[0.9]">
              Geleceğini <br /> Bugün Şekillendir.
            </h2>
            <p className="text-xl md:text-2xl text-zinc-400 dark:text-zinc-500 font-bold mb-16 max-w-xl mx-auto relative z-10">
              VitaTribe ile gelişimini bir üst seviyeye taşıma zamanı geldi.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
               <Link href="/login" className="px-12 py-6 bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest hover:scale-110 transition-all shadow-2xl shadow-emerald-500/20">
                  Hemen Başla 🚀
               </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
