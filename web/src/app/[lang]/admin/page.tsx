import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { approvePost, deletePost } from './actions'
import { Locale } from '@/i18n'

interface Props {
  params: Promise<{ lang: Locale }>
}

interface FlaggedPost {
  id: string
  content: string
  created_at: string
  profiles: { display_name: string; username: string } | null
}

export default async function AdminPage({ params }: Props) {
  const { lang } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch flagged posts
  const { data: flaggedPostsData } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      profiles(display_name, username)
    `)
    .eq('moderation_status', 'flagged')
    .order('created_at', { ascending: false })

  const flaggedPosts = flaggedPostsData as unknown as FlaggedPost[] | null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar lang={lang} />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Admin Paneli</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium italic">Topluluk güvenliğini sağlamak için işaretlenmiş içerikleri yönet.</p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-4">
                Moderasyon Kuyruğu
                <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full">{flaggedPosts?.length || 0}</span>
             </h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {flaggedPosts && flaggedPosts.length > 0 ? (
              flaggedPosts.map((post: FlaggedPost) => (
                <div key={post.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-rose-100 dark:border-rose-500/20 group">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 font-black text-xl shadow-inner">
                         {post.profiles?.display_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                            <h3 className="font-black text-zinc-900 dark:text-zinc-50 leading-none">{post.profiles?.display_name}</h3>
                            <span className="text-[10px] text-zinc-400 font-black">@{post.profiles?.username}</span>
                         </div>
                         <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 inline-block">
                            {new Date(post.created_at).toLocaleString('tr-TR')}
                         </span>
                      </div>
                   </div>

                   <div className="bg-zinc-50 dark:bg-zinc-950/50 p-6 rounded-2xl mb-8 border border-zinc-100 dark:border-zinc-800 shadow-inner">
                      <p className="text-zinc-800 dark:text-zinc-100 font-medium leading-relaxed italic">&quot;{post.content}&quot;</p>
                   </div>

                   <div className="flex gap-4">
                      <form action={async () => {
                         'use server'
                         await approvePost(post.id)
                      }} className="flex-1">
                         <button className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/10">
                            Yayınla ✅
                         </button>
                      </form>
                      <form action={async () => {
                         'use server'
                         await deletePost(post.id)
                      }} className="flex-1">
                         <button className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-rose-500/10">
                            Kaldır 🗑️
                         </button>
                      </form>
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white dark:bg-zinc-900/50 rounded-[4rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800 shadow-xl">
                 <div className="text-6xl mb-6">🛡️</div>
                 <p className="text-zinc-400 dark:text-zinc-600 font-black text-sm uppercase tracking-[0.2em]">Şu an için her şey temiz görünüyor.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
