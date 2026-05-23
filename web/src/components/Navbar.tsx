import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/[lang]/login/actions";
import NotificationBadge from "./NotificationBadge";
import { getDictionary } from "@/get-dictionary";
import { Locale } from "@/i18n";

export default async function Navbar({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let unreadNotificationsCount = 0;
  
  if (user) {
    const [{ data: profileData }, { count }] = await Promise.all([
      supabase.from('profiles').select('role, display_name, username').eq('id', user.id).single(),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
    ]);
    profile = profileData;
    unreadNotificationsCount = count || 0;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-6 transition-transform shadow-sm">
            V
          </div>
          <span className="text-xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
            VITA<span className="inline-block bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">TRIBE</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <Link href={`/${lang}/dashboard`} className="text-[10px] font-black text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">
            {dict.navbar.dashboard}
          </Link>
          <Link href={`/${lang}/feed`} className="text-[10px] font-black text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">
            {dict.navbar.feed}
          </Link>
          <Link href={`/${lang}/messages`} className="text-[10px] font-black text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">
            {dict.navbar.messages}
          </Link>
          {profile?.role === 'dietitian' && (
            <Link href={`/${lang}/clients`} className="text-[10px] font-black text-emerald-500 hover:text-emerald-600 transition-colors uppercase tracking-[0.2em]">
              {dict.navbar.clients}
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link href={`/${lang}/admin`} className="text-[10px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-[0.2em]">
              {dict.navbar.admin}
            </Link>
          )}
          <Link href={`/${lang}/explore`} className="text-[10px] font-black text-zinc-500 hover:text-emerald-500 transition-colors uppercase tracking-[0.2em]">
            {dict.navbar.explore}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                href={`/${lang}/notifications`}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 transition-colors"
              >
                <span className="text-xl">🔔</span>
                <NotificationBadge userId={user.id} initialCount={unreadNotificationsCount} />
              </Link>
              <Link 
                href={`/${lang}/settings`}
                className="hidden sm:block text-[10px] font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors uppercase tracking-widest"
              >
                {profile?.display_name || user.email?.split('@')[0]}
              </Link>
              <form action={logout}>
                <button className="text-[10px] font-black text-rose-500 px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors uppercase tracking-[0.2em]">
                  {dict.navbar.logout}
                </button>
              </form>
            </div>
          ) : (
            <>
              <Link 
                href={`/${lang}/login`} 
                className="hidden sm:block text-[10px] font-black text-zinc-900 dark:text-zinc-50 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors uppercase tracking-[0.2em]"
              >
                {dict.navbar.login}
              </Link>
              <Link 
                href={`/${lang}/login`} 
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-emerald-500/10"
              >
                {dict.navbar.start}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
