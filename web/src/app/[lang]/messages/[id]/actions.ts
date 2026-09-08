'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkTextModeration } from '@/utils/moderation'

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !content.trim()) return { error: 'Unauthorized' }

  const modResult = checkTextModeration(content.trim())
  if (!modResult.isClean) return { error: modResult.reason }

  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
    })

  if (error) return { error: error.message }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath(`/messages/${conversationId}`)
  return { success: true }
}

export async function blockUser(blockedId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Giriş yapmalısınız' }

  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId })

  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
}

export async function reportUser(reportedUserId: string, reason: string, contentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Giriş yapmalısınız' }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    content_type: 'message',
    content_id: contentId || null,
    reason,
  })

  if (error) return { error: error.message }
  return { success: true }
}
