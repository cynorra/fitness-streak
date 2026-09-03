'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from './actions'

export interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

export interface OtherUser {
  display_name: string | null
  username: string
}

interface Props {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
  otherUser: OtherUser | null
}

export default function ChatInterface({ conversationId, initialMessages, currentUserId, otherUser }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            if (prev.find(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    const tempContent = content
    setContent('')
    setIsSending(true)
    const result = await sendMessage(conversationId, tempContent)
    if (result.error) {
      setContent(tempContent)
      alert('Mesaj gönderilemedi: ' + result.error)
    }
    setIsSending(false)
  }

  return (
    <div className="flex flex-col h-[650px] bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/50 backdrop-blur-md">
         <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/10">
            {otherUser?.display_name?.[0] || 'U'}
         </div>
         <div>
            <h3 className="font-black text-zinc-900 dark:text-zinc-50 leading-none text-lg tracking-tight">{otherUser?.display_name}</h3>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">@{otherUser?.username}</span>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-[13px] shadow-sm relative group ${
                isMine 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-none' 
                  : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-50 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
              }`}>
                {msg.content}
                <div className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity ${isMine ? 'text-zinc-400' : 'text-zinc-500'}`}>
                   {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-4 backdrop-blur-md">
        <input 
          type="text" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mesajını yaz..."
          className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-50 border-none outline-none ring-1 ring-zinc-200 dark:ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
        />
        <button 
          disabled={isSending || !content.trim()}
          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-orange-500/10"
        >
          GÖNDER ➔
        </button>
      </form>
    </div>
  )
}
