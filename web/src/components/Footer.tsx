import Link from "next/link";

export default function Footer() {
  return (
    <footer className="px-10 py-16 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg">F</div>
          <span className="font-black text-2xl tracking-tighter text-zinc-900 dark:text-zinc-50">FIT<span className="inline-block bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">BRIDGE</span></span>
        </div>
        <div className="flex gap-12 text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">
          <Link href="/privacy" className="hover:text-orange-500 transition-colors">Gizlilik</Link>
          <Link href="/terms" className="hover:text-orange-500 transition-colors">Şartlar</Link>
          <Link href="/contact" className="hover:text-orange-500 transition-colors">İletişim</Link>
        </div>
        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest opacity-50">
          &copy; {new Date().getFullYear()} FitBridge. Topluluk odaklı fitness platformu.
        </div>
      </div>
    </footer>
  );
}
