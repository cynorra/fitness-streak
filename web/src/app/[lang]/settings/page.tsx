import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from './actions'
import Navbar from '@/components/Navbar'
import { Locale } from '@/i18n'

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ message: string; error: string }>
}

export default async function SettingsPage({ params, searchParams }: Props) {
  const { lang } = await params
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

  const { message, error } = await searchParams

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar lang={lang} />

      <main className="max-w-3xl mx-auto pt-32 pb-20 px-6">
        <div className="mb-12">
           <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
              Profil Ayarları
           </h1>
           <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Hesap bilgilerini ve uygulama tercihlerini buradan güncelleyebilirsin.
           </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 shadow-2xl rounded-[3rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <form className="p-8 md:p-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label htmlFor="displayName" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                   Görünen Ad
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  defaultValue={profile?.display_name || ''}
                  className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="role" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                  Üyelik Tipi
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={profile?.role || 'user'}
                  className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none"
                >
                  <option value="user">Standart Kullanıcı</option>
                  <option value="dietitian">Diyetisyen / Antrenör</option>
                </select>
              </div>
            </div>

            {profile?.role === 'dietitian' && (
              <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                <label htmlFor="specialty" className="block text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1 ml-1">
                   Uzmanlık Alanı (Sadece Diyetisyenler İçin)
                </label>
                <input
                  id="specialty"
                  name="specialty"
                  type="text"
                  defaultValue={profile?.specialty || ''}
                  placeholder="Örn: Ketojenik Beslenme, Sporcu Diyeti"
                  className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="bio" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                Hakkında / Biyografi
              </label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={profile?.bio || ''}
                rows={3}
                placeholder="Kendinden bahset..."
                className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-100 dark:border-zinc-800 pt-8">
              <div className="space-y-1">
                <label htmlFor="username" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                  Kullanıcı Adı (@)
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={profile?.username || ''}
                  className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="timezone" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                  Saat Dilimi
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={profile?.timezone || 'Europe/Istanbul'}
                  className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none"
                >
                  <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="America/New_York">New York (EST)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                <label htmlFor="dayStartHour" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                  Günün Başlangıcı (Saat)
                </label>
                <select
                  id="dayStartHour"
                  name="dayStartHour"
                  defaultValue={profile?.day_start_hour || 4}
                  className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none"
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>{i}:00</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-2 ml-1 italic font-medium">
                  * Streak serisinin sıfırlanacağı saati belirler.
                </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold">
                ✨ {message}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                formAction={updateProfile}
                className="px-10 py-4.5 rounded-2xl shadow-xl shadow-orange-500/20 text-sm font-black uppercase tracking-[0.15em] text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:scale-[1.05] active:scale-95 transition-all duration-200"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-12 p-8 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mb-1 tracking-tight">Hesabı Kapat</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Bu işlem geri alınamaz ve tüm verileriniz silinir.</p>
           </div>
           <button className="px-8 py-3.5 border-2 border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
              Hesabı Sil
           </button>
        </div>
      </main>
    </div>
  )
}
