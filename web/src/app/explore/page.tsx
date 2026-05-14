import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ q: string; role: string }>
}

export default async function ExplorePage({ searchParams }: Props) {
  const { q, role } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('*')
    .order('current_streak', { ascending: false })
    .limit(48)

  if (q) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%,specialty.ilike.%${q}%,bio.ilike.%${q}%`)
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  const { data: users } = await query

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <div className="mb-12">
           <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">Keşfet</h1>
           <p className="text-zinc-500 dark:text-zinc-400 font-medium italic">Topluluğun en aktif üyelerini ve uzman diyetisyenleri bul.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
           <form className="relative group max-w-2xl">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
                 <span className="text-xl">🔍</span>
              </div>
              <input 
                name="q"
                type="text" 
                defaultValue={q}
                placeholder="İsim, uzmanlık veya @kullaniciadi ile ara..."
                className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] pl-16 pr-24 py-6 text-sm font-bold text-zinc-900 dark:text-zinc-50 border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl shadow-orange-500/5"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95 shadow-lg">
                 ARA
              </button>
           </form>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide">
           <Link 
             href="/explore" 
             className={`whitespace-nowrap px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${!role || role === 'all' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500'}`}
           >
              Hepsi
           </Link>
           <Link 
             href="/explore?role=dietitian" 
             className={`whitespace-nowrap px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${role === 'dietitian' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500'}`}
           >
              Diyetisyenler
           </Link>
           <Link 
             href="/explore?role=user" 
             className={`whitespace-nowrap px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${role === 'user' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500'}`}
           >
              Sporcular
           </Link>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {users && users.length > 0 ? (
              users.map((user: any) => (
                <Link 
                  key={user.id} 
                  href={`/u/${user.username}`}
                  className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 hover:shadow-2xl hover:scale-[1.02] transition-all group flex items-center gap-6"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl flex items-center justify-center text-zinc-400 font-black text-3xl group-hover:text-orange-500 transition-colors shadow-inner relative overflow-hidden">
                    {user.display_name?.[0] || user.username?.[0]}
                    <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                       <h3 className="font-black text-zinc-900 dark:text-zinc-50 leading-none tracking-tight text-xl truncate">{user.display_name || user.username}</h3>
                       {user.role === 'dietitian' && (
                          <span className="bg-orange-500 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest shadow-lg shadow-orange-500/20">Diyetisyen</span>
                       )}
                    </div>
                    {user.specialty && (
                      <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">{user.specialty}</p>
                    )}
                    <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest mb-4">@{user.username}</p>
                    <div className="flex items-center gap-3">
                       <div className="flex flex-col">
                          <span className="text-[18px] font-black text-zinc-900 dark:text-zinc-50 leading-none">{user.current_streak}</span>
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">GÜN STREAK</span>
                       </div>
                       <div className="w-px h-6 bg-zinc-100 dark:bg-zinc-800 mx-2"></div>
                       <div className="flex flex-col">
                          <span className="text-[18px] font-black text-zinc-900 dark:text-zinc-50 leading-none">{user.longest_streak}</span>
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">REKOR</span>
                       </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center text-orange-500 font-black group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                     ➔
                  </div>
                </Link>
              ))
           ) : (
              <div className="col-span-full text-center py-32 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[4rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                 <div className="text-6xl mb-6 opacity-20">🔎</div>
                 <p className="text-zinc-400 dark:text-zinc-600 font-black text-sm uppercase tracking-[0.3em]">Aradığın kahramanı bulamadık.</p>
                 <Link href="/explore" className="mt-8 inline-block text-orange-500 font-black text-xs uppercase tracking-widest hover:underline">
                    Tüm listeyi gör ➔
                 </Link>
              </div>
           )}
        </div>
      </main>
    </div>
  )
}
