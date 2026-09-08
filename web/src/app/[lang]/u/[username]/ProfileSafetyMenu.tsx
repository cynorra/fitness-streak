'use client'

import { useState } from 'react'
import { blockUser, unblockUser, reportUser } from './actions'

interface Props {
  targetUserId: string
  targetDisplayName: string
  initialIsBlocked: boolean
}

export default function ProfileSafetyMenu({ targetUserId, targetDisplayName, initialIsBlocked }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)

  const handleBlock = async () => {
    if (!confirm(`${targetDisplayName} adlı kullanıcıyı engellemek istediğine emin misin?`)) return
    setMenuOpen(false)
    const result = await blockUser(targetUserId)
    if (result.error) {
      alert('Hata: ' + result.error)
    } else {
      setIsBlocked(true)
    }
  }

  const handleUnblock = async () => {
    setMenuOpen(false)
    const result = await unblockUser(targetUserId)
    if (result.error) {
      alert('Hata: ' + result.error)
    } else {
      setIsBlocked(false)
    }
  }

  const handleReport = async (reason: string) => {
    setMenuOpen(false)
    const result = await reportUser(targetUserId, reason)
    alert(result.error ? 'Hata: ' + result.error : 'Şikayetin ekibimize iletildi.')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Güvenlik seçenekleri"
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 hover:scale-105 active:scale-95 transition-all text-xl font-black shadow-xl"
      >
        ⋮
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-16 z-10 w-60 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <button onClick={() => handleReport('Taciz / Rahatsız edici')} className="w-full text-left px-5 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Şikayet Et: Taciz
          </button>
          <button onClick={() => handleReport('Spam')} className="w-full text-left px-5 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Şikayet Et: Spam
          </button>
          <button onClick={() => handleReport('Uygunsuz içerik / sahte profil')} className="w-full text-left px-5 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Şikayet Et: Uygunsuz İçerik
          </button>
          {isBlocked ? (
            <button onClick={handleUnblock} className="w-full text-left px-5 py-3 text-xs font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-t border-zinc-100 dark:border-zinc-800">
              Engeli Kaldır
            </button>
          ) : (
            <button onClick={handleBlock} className="w-full text-left px-5 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-zinc-100 dark:border-zinc-800">
              Kullanıcıyı Engelle
            </button>
          )}
        </div>
      )}
    </div>
  )
}
