'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Props {
  userId: string
  initialCount: number
}

export default function NotificationBadge({ userId, initialCount }: Props) {
  const [count, setCount] = useState(initialCount)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          setCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 animate-pulse">
      {count}
    </span>
  )
}
