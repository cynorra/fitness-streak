import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch conversations where user is participant 1 or 2
  // We use a complex query to get the participants' details
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_1,
      participant_2,
      updated_at,
      p1:participant_1(id, display_name, username),
      p2:participant_2(id, display_name, username)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Mesajlar</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic">Özel görüşmelerin ve danışan mesajların.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv: any) => {
              const otherUser = conv.participant_1 === user.id ? conv.p2 : conv.p1
              
              return (
                <Link 
                  key={conv.id} 
                  href={`/messages/${conv.id}`}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:scale-[1.02] transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500/10 to-rose-500/10 rounded-2xl flex items-center justify-center text-orange-500 font-black text-2xl group-hover:rotate-3 transition-transform shadow-inner">
                    {otherUser?.display_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-50 text-lg leading-none mb-1">
                      {otherUser?.display_name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-2">@{otherUser?.username}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1 italic">
                      Sohbeti görmek için tıkla...
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
                       {new Date(conv.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="text-center py-24 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
               <div className="text-5xl mb-6">💬</div>
               <p className="text-zinc-400 dark:text-zinc-600 font-black text-sm uppercase tracking-[0.2em] mb-4">Henüz hiçbir mesajlaşman yok.</p>
               <Link href="/feed" className="inline-flex items-center gap-2 text-orange-500 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                  Topluluğa katıl ve sohbete başla ➔
               </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
