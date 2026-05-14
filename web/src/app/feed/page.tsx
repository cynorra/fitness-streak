import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { addPost } from './actions'
import PostInteractions from './PostInteractions'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch approved posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(display_name, username),
      post_likes(count),
      reposts(count),
      post_comments(*, profiles(display_name))
    `)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })

  // Fetch reposts
  const { data: reposts } = await supabase
    .from('reposts')
    .select(`
      *,
      profiles(display_name, username),
      post:post_id(
        *,
        profiles(display_name, username),
        post_likes(count),
        reposts(count),
        post_comments(*, profiles(display_name))
      )
    `)
    .order('created_at', { ascending: false })

  // Merge and sort
  const allFeedItems = [
    ...(posts || []).map(p => ({ ...p, type: 'original' })),
    ...(reposts || []).map(r => ({ ...r, type: 'repost' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Check user likes/reposts for initial state
  const { data: userLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
  const { data: userReposts } = await supabase.from('reposts').select('post_id').eq('user_id', user.id)
  
  const likedPostIds = new Set(userLikes?.map(l => l.post_id))
  const repostedPostIds = new Set(userReposts?.map(r => r.post_id))

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
        
        {/* Create Post Card */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 mb-12 group transition-all hover:border-orange-500/20">
           <h2 className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
              Yeni Paylaşım Yap
              <span className="h-px flex-1 bg-zinc-50 dark:bg-zinc-800"></span>
           </h2>
           <form action={async (formData) => {
              'use server'
              await addPost(formData)
           }} className="space-y-6">
              <textarea 
                name="content"
                placeholder="Bugün antrenman nasıl geçti? 🏋️‍♂️"
                rows={3}
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border-none rounded-[2rem] p-8 text-lg font-medium text-zinc-900 dark:text-zinc-50 shadow-inner outline-none ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all resize-none italic"
              />
              <div className="flex justify-end">
                 <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all">
                    Paylaş ✨
                 </button>
              </div>
           </form>
        </div>

        {/* Feed List */}
        <div className="space-y-12">
          {allFeedItems.map((item: any) => {
            const isRepost = item.type === 'repost'
            const post = isRepost ? item.post : item
            if (!post || (isRepost && post.moderation_status !== 'approved')) return null

            return (
              <div key={item.id} className="relative">
                {isRepost && (
                  <div className="flex items-center gap-2 mb-4 ml-8">
                     <span className="text-xl">🔄</span>
                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {item.profiles?.display_name} Repostladı
                     </span>
                  </div>
                )}
                
                <div className="bg-white dark:bg-zinc-900 p-10 rounded-[4rem] shadow-xl border border-zinc-100 dark:border-zinc-800 group hover:shadow-2xl transition-all">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 font-black text-xl shadow-inner">
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

                   <p className="text-xl text-zinc-800 dark:text-zinc-100 font-bold leading-relaxed mb-10 italic">
                      "{post.content}"
                   </p>

                   <PostInteractions 
                     postId={post.id}
                     initialLikes={post.post_likes?.[0]?.count || 0}
                     initialReposts={post.reposts?.[0]?.count || 0}
                     isLiked={likedPostIds.has(post.id)}
                     isReposted={repostedPostIds.has(post.id)}
                     comments={post.post_comments || []}
                   />
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
