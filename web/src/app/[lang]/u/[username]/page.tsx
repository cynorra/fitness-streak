import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { requestDietitian, startConversation } from './actions'
import ProfileSafetyMenu from './ProfileSafetyMenu'
import PostInteractions from '@/app/[lang]/feed/PostInteractions'
import { Metadata } from 'next'
import Script from 'next/script'
import { Locale } from '@/i18n'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vitatribe.com'

interface UserBadge {
  id: string
  awarded_at: string
  badge: { name: string; description: string; icon: string } | null
}

interface Workout {
  id: string
  workout_type: string
  duration_minutes: number
}

export async function generateMetadata({ params }: { params: Promise<{ username: string; lang: Locale }> }): Promise<Metadata> {
  const { username, lang } = await params
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, current_streak, bio')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Kullanıcı Bulunamadı | DietitianFit' }

  const name = profile.display_name || profile.username
  const streak = profile.current_streak || 0
  const profileUrl = `${BASE_URL}/${lang}/u/${username}`

  return {
    metadataBase: new URL(BASE_URL),
    title: `${name} (@${profile.username}) | ${streak} Günlük Seri`,
    description: profile.bio || `${name} kullanıcısının fitness profilini ve antrenman serisini DietitianFit üzerinde takip et. ${streak} günlük aktif serisi var!`,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${name} | ${streak} Günlük Seri 🔥`,
      description: profile.bio || `${name} kullanıcısının gelişimini takip et. ${streak} günlük aktif serisi var!`,
      url: profileUrl,
      siteName: 'DietitianFit',
      type: 'profile',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${name} — DietitianFit Profili`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | ${streak} Günlük Seri 🔥`,
      description: profile.bio || `${name} kullanıcısının DietitianFit fitness profilini takip et.`,
      images: ['/og-image.png'],
    },
  }
}

export default async function UserProfile({ params }: { params: Promise<{ username: string; lang: Locale }> }) {
  const { username, lang } = await params
  const supabase = await createClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Fetch badges
  const { data: userBadgesData } = await supabase
    .from('user_badges')
    .select(`
      id,
      awarded_at,
      badge:badge_id(name, description, icon)
    `)
    .eq('user_id', profile.id)

  const userBadges = userBadgesData as UserBadge[] | null

  // Fetch posts and reposts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(display_name, username),
      post_likes(count),
      reposts(count),
      post_comments(*, profiles(display_name))
    `)
    .eq('user_id', profile.id)
    .eq('moderation_status', 'approved')

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
    .eq('user_id', profile.id)

  // Merge and sort
  const profileFeedItems = [
    ...(posts || []).map(p => ({ ...p, type: 'original' })),
    ...(reposts || []).map(r => ({ ...r, type: 'repost' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Check user interactions for initial state
  let likedPostIds = new Set<string>()
  let repostedPostIds = new Set<string>()
  
  if (currentUser) {
    const { data: userLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUser.id)
    const { data: userReposts } = await supabase.from('reposts').select('post_id').eq('user_id', currentUser.id)
    likedPostIds = new Set(userLikes?.map(l => l.post_id))
    repostedPostIds = new Set(userReposts?.map(r => r.post_id))
  }

  // Check relationship if viewer is dietitian
  let isDietitianClient = false
  if (currentUser) {
    const { data: rel } = await supabase
      .from('dietitian_clients')
      .select('status')
      .eq('dietitian_id', currentUser.id)
      .eq('client_id', profile.id)
      .single()
    isDietitianClient = rel?.status === 'approved'
  }

  // Check if current user has blocked this profile
  let isBlockedByMe = false
  if (currentUser && currentUser.id !== profile.id) {
    const { data: blockRow } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', currentUser.id)
      .eq('blocked_id', profile.id)
      .maybeSingle()
    isBlockedByMe = !!blockRow
  }

  // Fetch workouts if authorized
  let workouts: Workout[] = []
  if (currentUser?.id === profile.id || isDietitianClient) {
    const { data: workoutData } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false })
      .limit(10)
    workouts = (workoutData || []) as Workout[]
  }

  // Build Person JSON-LD schema
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': profile.role === 'dietitian' ? ['Person', 'MedicalBusiness'] : ['Person', 'Athlete'],
    name: profile.display_name || profile.username,
    alternateName: `@${profile.username}`,
    description: profile.bio || `${profile.display_name || profile.username} kullanıcısının fitness profili.`,
    url: `${BASE_URL}/tr/u/${profile.username}`,
    image: `${BASE_URL}/og-image.png`,
    sameAs: [`${BASE_URL}/tr/u/${profile.username}`],
    ...(profile.role === 'dietitian' && {
      jobTitle: 'Diyetisyen',
      worksFor: { '@type': 'Organization', name: 'DietitianFit' },
    }),
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      {/* JSON-LD Person Schema */}
      <Script
        id="schema-person"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <Navbar lang={lang} />
      <main className="max-w-6xl mx-auto pt-32 pb-20 px-6">
        
        {/* Header Section */}
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-[4rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 mb-12 relative overflow-hidden group">
           <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
           
           <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-rose-500 rounded-[2.5rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-orange-500/20 group-hover:rotate-6 transition-transform">
                 {profile.display_name?.[0] || profile.username?.[0]}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                 <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{profile.display_name || profile.username}</h1>
                    <div className="flex gap-2">
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-700">@{profile.username}</span>
                       {profile.role === 'dietitian' && (
                          <span className="text-[10px] font-black text-white uppercase tracking-widest bg-orange-500 px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20">Diyetisyen</span>
                       )}
                    </div>
                 </div>
                 
                 <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed mb-8 italic">
                    {profile.bio || "Henüz bir biyografi eklenmemiş."}
                 </p>

                 <div className="flex flex-wrap justify-center md:justify-start gap-8">
                    <div className="flex flex-col">
                       <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50 leading-none">{profile.current_streak}</span>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2">Gün Streak 🔥</span>
                    </div>
                    <div className="w-px h-12 bg-zinc-100 dark:bg-zinc-800 hidden md:block"></div>
                    <div className="flex flex-col">
                       <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50 leading-none">{profile.longest_streak}</span>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2">En İyi Rekor 🏆</span>
                    </div>
                 </div>
              </div>

              {currentUser && currentUser.id !== profile.id && (
                 <div className="md:self-center flex flex-col sm:flex-row gap-4">
                    {profile.role === 'dietitian' && (
                       <form action={async (formData) => {
                          'use server'
                          await requestDietitian(formData)
                       }}>
                          <input type="hidden" name="dietitianId" value={profile.id} />
                          <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl">
                             Çalışma İsteği Gönder 🤝
                          </button>
                       </form>
                    )}
                    
                    <form action={async (formData) => {
                       'use server'
                       await startConversation(formData)
                    }}>
                       <input type="hidden" name="targetUserId" value={profile.id} />
                       <button className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border-2 border-zinc-100 dark:border-zinc-700 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl">
                          Mesaj Gönder 💬
                       </button>
                    </form>

                    <ProfileSafetyMenu
                       targetUserId={profile.id}
                       targetDisplayName={profile.display_name || profile.username}
                       initialIsBlocked={isBlockedByMe}
                    />
                 </div>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Left Content: Badges & Stats */}
           <div className="lg:col-span-1 space-y-12">
              <section>
                 <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                    Başarımlar
                    <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></span>
                 </h2>
                 <div className="grid grid-cols-2 gap-4">
                    {userBadges && userBadges.length > 0 ? (
                       userBadges.map((ub) => (
                          <div key={ub.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center group hover:scale-105 transition-all shadow-sm">
                             <div className="text-4xl mb-3 group-hover:rotate-12 transition-transform">{ub.badge?.icon}</div>
                             <h4 className="text-[10px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter leading-tight mb-1">{ub.badge?.name}</h4>
                             <p className="text-[8px] text-zinc-400 font-bold uppercase">{ub.badge?.description}</p>
                          </div>
                       ))
                    ) : (
                       <div className="col-span-2 text-center py-10 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                          <p className="text-[10px] text-zinc-400 font-black uppercase">Henüz rozet kazanılmadı.</p>
                       </div>
                    )}
                 </div>
              </section>

              {workouts.length > 0 && (
                 <section>
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                       Antrenman Geçmişi
                       <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></span>
                    </h2>
                    <div className="space-y-3">
                       {workouts.map((w) => (
                          <div key={w.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between">
                             <span className="text-xl">{w.workout_type === 'run' ? '🏃' : '🏋️'}</span>
                             <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase">{w.workout_type}</span>
                             <span className="text-[10px] font-black text-orange-500">{w.duration_minutes}dk</span>
                          </div>
                       ))}
                    </div>
                 </section>
              )}
           </div>

           {/* Right Content: Posts & Reposts */}
           <div className="lg:col-span-2 space-y-12">
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-4">
                 Paylaşımlar ve Repostlar
                 <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></span>
              </h2>
              <div className="space-y-12">
                 {profileFeedItems.map((item) => {
                    const isRepost = item.type === 'repost'
                    const post = isRepost ? item.post : item
                    if (!post || (isRepost && post.moderation_status !== 'approved')) return null

                    return (
                       <div key={item.id} className="relative">
                          {isRepost && (
                             <div className="flex items-center gap-2 mb-4 ml-8">
                                <span className="text-xl">🔄</span>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                   Siz Repostladınız
                                </span>
                             </div>
                          )}
                          
                          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 group hover:shadow-2xl transition-all">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 font-black text-lg">
                                   {post.profiles?.display_name?.[0] || 'U'}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <h3 className="font-black text-zinc-900 dark:text-zinc-50 text-sm leading-none">{post.profiles?.display_name}</h3>
                                      <span className="text-[8px] text-zinc-400 font-black">@{post.profiles?.username}</span>
                                   </div>
                                   <span className="text-[8px] text-zinc-400 font-bold uppercase mt-1 inline-block">
                                      {new Date(post.created_at).toLocaleDateString('tr-TR')}
                                   </span>
                                </div>
                             </div>

                             <p className="text-lg text-zinc-800 dark:text-zinc-100 font-bold leading-relaxed mb-8 italic">
                                &quot;{post.content}&quot;
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

                 {profileFeedItems.length === 0 && (
                    <div className="text-center py-20 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-[4rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                       <p className="text-zinc-400 dark:text-zinc-600 font-black text-sm uppercase tracking-widest">Henüz bir paylaşım bulunmuyor.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}
