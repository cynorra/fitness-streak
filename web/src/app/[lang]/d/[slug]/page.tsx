import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import { Locale } from '@/i18n'

interface Props {
  params: Promise<{ lang: Locale; slug: string }>
}

interface PublicDietitian {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  title: string | null
  specialties: string[] | null
  languages: string[] | null
  country: string | null
  years_experience: number | null
  session_price: number | null
  price_currency: string | null
  slug: string | null
  verified: boolean
  avg_rating: number
  review_count: number
}

// Only VERIFIED dietitians are returned by the get_dietitian_public RPC (no license number / diploma is ever exposed).
async function load(slug: string): Promise<PublicDietitian | null> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_dietitian_public', { p_key: slug })
  return ((data as PublicDietitian[] | null) || [])[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await load(slug)
  if (!d) return { title: 'DietitianFit', robots: { index: false } }
  const name = `${d.title ? d.title + ' ' : ''}${d.display_name ?? 'Dietitian'}`
  return {
    title: `${name} | DietitianFit`,
    description: (d.bio || `${name} on DietitianFit`).slice(0, 160),
    openGraph: { title: name, description: (d.bio || '').slice(0, 160), type: 'profile' },
  }
}

const T = {
  tr: { verified: 'Doğrulanmış diyetisyen', exp: 'yıl deneyim', reviews: 'değerlendirme', price: 'Seans ücreti', open: 'Uygulamada aç', disclaimer: 'Bu sayfa tıbbi tavsiye değildir. Beslenme kararlarınızdan önce bir sağlık uzmanına danışın.' },
  en: { verified: 'Verified dietitian', exp: 'years experience', reviews: 'reviews', price: 'Session price', open: 'Open in the app', disclaimer: 'This page is not medical advice. Consult a qualified health professional before changing your diet.' },
}

export default async function DietitianPublicPage({ params }: Props) {
  const { lang, slug } = await params
  const d = await load(slug)
  if (!d) notFound()
  const tx = lang === 'tr' ? T.tr : T.en

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar lang={lang} />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-black">
          {d.title ? `${d.title} ` : ''}
          {d.display_name}
        </h1>
        <p className="mt-2 text-emerald-400 font-bold">{tx.verified} ✓</p>
        <p className="mt-2 text-sm text-zinc-400">
          {d.country ? `${d.country} · ` : ''}
          {d.years_experience != null ? `${d.years_experience} ${tx.exp} · ` : ''}
          {d.review_count > 0 ? `${Number(d.avg_rating).toFixed(1)} ★ (${d.review_count} ${tx.reviews})` : ''}
        </p>
        {d.bio && <p className="mt-6 whitespace-pre-line text-zinc-200">{d.bio}</p>}
        {!!d.specialties?.length && (
          <div className="mt-6 flex flex-wrap gap-2">
            {d.specialties.map((s) => (
              <span key={s} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{s}</span>
            ))}
          </div>
        )}
        {!!d.languages?.length && <p className="mt-4 text-sm text-zinc-400">{d.languages.join(' · ').toUpperCase()}</p>}
        {d.session_price != null && (
          <p className="mt-4 text-sm text-zinc-300">
            {tx.price}: {d.session_price} {d.price_currency ?? ''}
          </p>
        )}
        <a
          href={`vitatribe://user/${d.id}`}
          className="mt-8 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-black text-white"
        >
          {tx.open}
        </a>
        <p className="mt-10 text-xs text-zinc-500">{tx.disclaimer}</p>
      </main>
    </div>
  )
}
