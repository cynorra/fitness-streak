import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { updateClientStatus } from './actions'
import { Locale } from '@/i18n'

interface ClientRequest {
  id: string
  status: string
  created_at: string
  client: { id: string; display_name: string; username: string; current_streak: number } | null
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function ClientsPage({ params }: Props) {
  const { lang } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user is dietitian
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'dietitian') redirect('/dashboard')

  // Fetch clients
  const { data: requests } = await supabase
    .from('dietitian_clients')
    .select(`
      id,
      status,
      created_at,
      client:client_id(id, display_name, username, current_streak)
    `)
    .eq('dietitian_id', user.id)
    .order('created_at', { ascending: false })

  const typedRequests = (requests || []) as unknown as ClientRequest[]
  const pendingRequests = typedRequests.filter(r => r.status === 'pending')
  const activeClients = typedRequests.filter(r => r.status === 'approved')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar lang={lang} />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Danışan Yönetimi</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic">Profesyonel koçluk verdiğin sporcuları buradan yönetebilirsin.</p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="mb-16">
            <h2 className="text-xs font-black text-orange-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
               Bekleyen İstekler
               <span className="h-px flex-1 bg-orange-100 dark:bg-orange-500/20"></span>
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-orange-200/50 dark:border-orange-500/20 flex flex-col md:flex-row items-center gap-6 group">
                   <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
                      {req.client?.display_name?.[0] || 'U'}
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h3 className="font-black text-zinc-900 dark:text-zinc-50 text-xl tracking-tight leading-none mb-1">{req.client?.display_name}</h3>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">@{req.client?.username}</p>
                      <div className="flex justify-center md:justify-start gap-4">
                         <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">🔥 {req.client?.current_streak} Gün Streak</span>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <form action={async () => {
                         'use server'
                         await updateClientStatus(req.id, 'approved')
                      }}>
                         <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                            Onayla
                         </button>
                      </form>
                      <form action={async () => {
                         'use server'
                         await updateClientStatus(req.id, 'rejected')
                      }}>
                         <button className="border-2 border-rose-100 dark:border-rose-500/20 text-rose-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                            Reddet
                         </button>
                      </form>
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Clients */}
        <section>
          <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
             Aktif Danışanlar
             <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></span>
          </h2>
          {activeClients.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {activeClients.map((item) => (
                <Link
                  key={item.id}
                  href={`/u/${item.client?.username}`}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-6 hover:scale-[1.02] transition-all group"
                >
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-400 font-black text-xl group-hover:text-orange-500 transition-colors">
                    {item.client?.display_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-50 text-lg tracking-tight leading-none mb-1">{item.client?.display_name}</h3>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">@{item.client?.username}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-orange-500 drop-shadow-sm">{item.client?.current_streak}</div>
                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">GÜN STREAK</div>
                  </div>
                  <div className="text-orange-500 font-black text-xs">➔</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
               <div className="text-5xl mb-6">🤝</div>
               <p className="text-zinc-400 dark:text-zinc-600 font-black text-sm uppercase tracking-[0.2em] mb-4">Henüz aktif bir danışanın bulunmuyor.</p>
               <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Toplulukta paylaşım yaparak dikkat çekebilirsin!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
