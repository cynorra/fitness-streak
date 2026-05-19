import Link from 'next/link'
import { login, signup } from './actions'

interface Props {
  searchParams: Promise<{ message: string; error: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { message, error } = await searchParams

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-8 group">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl group-hover:rotate-6 transition-transform shadow-lg shadow-orange-500/20">
            F
          </div>
          <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
            FIT<span className="inline-block bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">BRIDGE</span>
          </span>
        </Link>
        <h2 className="text-center text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
          Gelişimine Kaldığın Yerden Devam Et
        </h2>
        <p className="text-center text-zinc-500 dark:text-zinc-400 font-medium">
          Hesabına giriş yap veya yeni bir serüvene başla.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-zinc-900 py-12 px-8 shadow-2xl rounded-[3rem] border border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <form className="space-y-6 relative z-10">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                placeholder="ornek@email.com"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-1 ml-1">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-2xl border-none bg-zinc-50 dark:bg-zinc-800/50 px-5 py-4 text-zinc-900 dark:text-zinc-50 shadow-inner ring-1 ring-zinc-200 dark:ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                placeholder="••••••••"
              />
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

            <div className="flex flex-col gap-4 pt-2">
              <button
                formAction={login}
                className="w-full flex justify-center py-4.5 px-4 rounded-2xl shadow-xl shadow-orange-500/10 text-sm font-black uppercase tracking-[0.15em] text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                Giriş Yap
              </button>
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-100 dark:border-zinc-800"></div>
                </div>
                <span className="relative px-4 bg-white dark:bg-zinc-900 text-[10px] font-black text-zinc-400 uppercase tracking-widest">veya</span>
              </div>
              <button
                formAction={signup}
                className="w-full flex justify-center py-4.5 px-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm font-black uppercase tracking-[0.15em] text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all duration-200"
              >
                Kayıt Ol
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
             <button className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hover:text-orange-500 transition-colors">
                Şifremi Unuttum
             </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600 font-medium px-8">
          Devam ederek Kullanım Şartları ve Gizlilik Politikası'nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  )
}
