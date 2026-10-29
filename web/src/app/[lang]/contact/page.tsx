import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Locale } from "@/i18n";

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar lang={lang} />
      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">İletişim</h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium mb-16 italic">
          Soruların, önerilerin veya sadece merhaba demek için buradayız.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 group hover:scale-105 transition-all">
            <div className="text-4xl mb-6">📧</div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-widest">E-Posta</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold">destek@vitatribe.com</p>
         </div>
         <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 hover:scale-105 transition-transform flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-2xl shadow-sm mb-4">📱</div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2">Sosyal Medya</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold">@vitatribe</p>
         </div>
      </div>
      
      <div className="max-w-3xl mx-auto bg-emerald-500 text-white rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <h2 className="text-3xl md:text-5xl font-black mb-4 relative z-10">Bize Katıl!</h2>
         <p className="text-zinc-400 dark:text-zinc-500 font-bold mb-0 relative z-10 text-white/80">DietitianFit topluluğunu beraber büyütelim.</p>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
