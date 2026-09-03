'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function MobileNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
          setProfile(data)
        })
      }
    })
  }, [supabase])

  if (!user) return null

  const navItems = [
    { label: 'Panel', href: '/dashboard', icon: '🏠' },
    { label: 'Akış', href: '/feed', icon: '🔥' },
    ...(profile?.role === 'dietitian' ? [{ label: 'Danışanlar', href: '/clients', icon: '👨‍⚕️' }] : []),
    ...(profile?.role === 'admin' ? [{ label: 'Admin', href: '/admin', icon: '🛡️' }] : []),
    { label: 'Keşfet', href: '/explore', icon: '🌍' },
    { label: 'Mesajlar', href: '/messages', icon: '💬' },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 px-6 pb-safe-area-inset-bottom">
      <div className="flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-orange-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-orange-500 rounded-full mt-0.5"></div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
