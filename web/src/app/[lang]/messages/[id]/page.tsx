import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChatInterface, { type Message, type OtherUser } from './ChatInterface'
import { Locale } from '@/i18n'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string; lang: Locale }>
}

export default async function ConversationPage({ params }: Props) {
  const { id, lang } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch conversation and participants
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_1,
      participant_2,
      p1:participant_1(id, display_name, username),
      p2:participant_2(id, display_name, username)
    `)
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  // Verify participant
  if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
    redirect('/messages')
  }

  const otherUser = (conversation.participant_1 === user.id ? conversation.p2 : conversation.p1) as unknown as OtherUser | null

  // Fetch initial messages
  const { data: messagesData } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const messages = messagesData as Message[] | null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-500">
      <Navbar lang={lang} />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
         <div className="mb-8">
            <Link href="/messages" className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest flex items-center gap-2 group transition-colors">
               <span className="group-hover:-translate-x-1 transition-transform">←</span> Geri Dön
            </Link>
         </div>
         <ChatInterface 
           conversationId={id}
           initialMessages={messages || []}
           currentUserId={user.id}
           otherUser={otherUser}
         />
      </main>
    </div>
  )
}
