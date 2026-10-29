import Link from "next/link";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n";

export default async function Footer({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);
  return (
    <footer className="px-10 py-16 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">V</div>
          <span className="font-black text-2xl tracking-tighter text-zinc-900 dark:text-zinc-50">VITA<span className="inline-block bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">TRIBE</span></span>
        </div>
        <div className="flex gap-12 text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">
          <Link href={`/${lang}/privacy`} className="hover:text-emerald-500 transition-colors">{dict.footer.privacy}</Link>
          <Link href={`/${lang}/terms`} className="hover:text-emerald-500 transition-colors">{dict.footer.terms}</Link>
          <Link href={`/${lang}/contact`} className="hover:text-emerald-500 transition-colors">{dict.footer.contact}</Link>
        </div>
        <div className="border-t border-zinc-200 dark:border-zinc-800 mt-12 pt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} DietitianFit. {dict.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
