import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">İletişim</h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 font-medium mb-16 italic">
          Soruların, önerilerin veya sadece merhaba demek için buradayız.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 group hover:scale-105 transition-all">
            <div className="text-4xl mb-6">📧</div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-widest">E-Posta</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold">destek@streak-fit.com</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 group hover:scale-105 transition-all">
            <div className="text-4xl mb-6">💬</div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-widest">Sosyal Medya</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold">@streakfit</p>
          </div>
        </div>

        <div className="mt-20 p-12 bg-zinc-900 dark:bg-zinc-100 rounded-[4rem] text-white dark:text-zinc-900 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
           <h2 className="text-3xl font-black mb-4 relative z-10">Bize Katılın</h2>
           <p className="text-zinc-400 dark:text-zinc-500 font-bold mb-0 relative z-10">Streak-Fit topluluğunu beraber büyütelim.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
