import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Locale } from '@/i18n'

interface Props {
  params: Promise<{ lang: Locale }>
}

interface NotificationRow {
  id: string
  type: string
  is_read: boolean
  created_at: string
  post_id: string | null
  actor: { display_name: string | null; username: string } | null
}

export default async function NotificationsPage({ params }: Props) {
  const { lang } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch notifications with actor profiles
  const { data } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      is_read,
      created_at,
      post_id,
      actor:actor_id(display_name, username)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = data as NotificationRow[] | null

  // Mark all as read when page is opened
  if (notifications && notifications.some(n => !n.is_read)) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar lang={lang} />
      <main className="max-w-2xl mx-auto pt-32 pb-20 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Bildirimler</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic">Topluluk aktivitelerinden haberdar ol.</p>
        </div>

        <div className="space-y-4">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif.id} className={`p-6 rounded-[2.5rem] shadow-xl border flex items-center gap-4 group transition-all ${notif.is_read ? 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800' : 'bg-orange-50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/20'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                   notif.type === 'like' ? 'bg-rose-500/10 text-rose-500' : 
                   notif.type === 'comment' ? 'bg-orange-500/10 text-orange-500' : 
                   notif.type === 'dietitian_request' ? 'bg-purple-500/10 text-purple-500' :
                   'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {notif.type === 'like' ? '❤️' : notif.type === 'comment' ? '💬' : notif.type === 'dietitian_request' ? '🤝' : '🔔'}
                </div>
                <div className="flex-1">
                   <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      <span className="text-zinc-900 dark:text-zinc-50 font-black">{notif.actor?.display_name}</span>
                      {notif.type === 'like' ? ' paylaşımını beğendi.' : 
                       notif.type === 'comment' ? ' paylaşımına yorum yaptı.' : 
                       notif.type === 'dietitian_request' ? ' seninle çalışmak istiyor!' :
                       ' bir işlem yaptı.'}
                   </p>
                   <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                      {new Date(notif.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                {notif.post_id ? (
                   <Link href="/feed" className="text-orange-500 font-black text-xs uppercase tracking-widest hover:underline">
                      GÖR ➔
                   </Link>
                ) : notif.type === 'dietitian_request' ? (
                   <Link href="/clients" className="text-purple-500 font-black text-xs uppercase tracking-widest hover:underline">
                      YÖNET ➔
                   </Link>
                ) : null}
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
               <div className="text-5xl mb-6 opacity-20">📭</div>
               <p className="text-zinc-400 dark:text-zinc-600 font-black text-sm uppercase tracking-[0.2em]">Henüz bir bildirim yok.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
