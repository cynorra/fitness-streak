import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { addWorkout } from './actions'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ message: string; error: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(10)

  const { message, error } = await searchParams

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-32 pb-20 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Streak & Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
               <h2 className="text-sm font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em] mb-6">Mevcut Streak</h2>
               <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black bg-gradient-to-br from-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
                     {profile?.current_streak || 0}
                  </span>
                  <span className="text-2xl font-black text-zinc-300 dark:text-zinc-700">GÜN</span>
               </div>
               <p className="mt-4 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                  Rekorun: <span className="text-zinc-900 dark:text-zinc-100">{profile?.longest_streak} gün</span>
               </p>
               <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  <Link 
                     href={`/u/${profile?.username}`}
                     className="inline-flex items-center text-xs font-black text-orange-500 uppercase tracking-widest hover:translate-x-1 transition-transform"
                  >
                     Kamu Profilini Gör →
                  </Link>
               </div>
            </div>

            <div className="bg-zinc-900 dark:bg-white p-8 rounded-[2.5rem] shadow-xl text-white dark:text-zinc-900 transition-colors duration-500">
               <h3 className="text-lg font-black mb-2 tracking-tight">Motivasyon</h3>
               <p className="text-sm text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed italic">
                  "Bugün yaptığın her antrenman, yarınki seni inşa ediyor. Serini bozma, hedefine odaklan."
               </p>
            </div>
          </div>

          {/* Middle Column: Add Workout */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-8">Antrenman Ekle</h2>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">Antrenman Türü</label>
                      <select name="workoutType" className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none px-5 py-4 font-bold text-zinc-900 dark:text-zinc-50 ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none">
                         <option value="run">🏃 Koşu</option>
                         <option value="gym">🏋️ Fitness / Gym</option>
                         <option value="cycle">🚴 Bisiklet</option>
                         <option value="swim">🏊 Yüzme</option>
                         <option value="yoga">🧘 Yoga</option>
                         <option value="other">💪 Diğer</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">Süre (Dakika)</label>
                      <input name="durationMinutes" type="number" placeholder="45" className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none px-5 py-4 font-bold text-zinc-900 dark:text-zinc-50 ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-inner" />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 ml-1">Not (İsteğe Bağlı)</label>
                   <textarea name="note" placeholder="Harika bir antrenmandı!" rows={2} className="w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border-none px-5 py-4 font-bold text-zinc-900 dark:text-zinc-50 ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-inner resize-none"></textarea>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                         <input name="isPublic" type="checkbox" defaultChecked className="sr-only peer" />
                         <div className="w-12 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-orange-500 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 shadow-inner"></div>
                      </div>
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition-colors">Halka Açık</span>
                   </label>

                   <button formAction={addWorkout} className="w-full md:w-auto px-12 py-4.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-orange-500/10 hover:scale-105 active:scale-95 transition-all">
                      Kaydet 🔥
                   </button>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold animate-shake">
                    ⚠️ {error}
                  </div>
                )}

                {message && (
                  <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold">
                    ✨ {message}
                  </div>
                )}
              </form>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800">
               <div className="flex justify-between items-center mb-8 px-2">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Son Antrenmanların</h2>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Son 10 Kayıt</span>
               </div>

               <div className="space-y-4">
                  {recentWorkouts && recentWorkouts.length > 0 ? (
                    recentWorkouts.map((workout) => (
                      <div key={workout.id} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/30 hover:bg-white dark:hover:bg-zinc-800 transition-all group relative overflow-hidden">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500/5 to-rose-500/5 dark:from-orange-500/10 dark:to-rose-500/10 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform relative z-10">
                           {workout.workout_type === 'run' ? '🏃' : 
                            workout.workout_type === 'gym' ? '🏋️' : 
                            workout.workout_type === 'cycle' ? '🚴' : 
                            workout.workout_type === 'swim' ? '🏊' :
                            workout.workout_type === 'yoga' ? '🧘' : '💪'}
                        </div>
                        <div className="flex-1 relative z-10">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                            {workout.workout_type}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-tight">
                            {new Date(workout.logged_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right relative z-10">
                           <div className="font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">{workout.duration_minutes}DK</div>
                           {workout.is_public && <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.2em]">Public</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-800/20 rounded-[2rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 font-bold text-sm">
                       Henüz bir antrenman kaydetmedin. <br /> Hadi başlayalım! 🚀
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
