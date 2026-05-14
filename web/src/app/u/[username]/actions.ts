'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function requestDietitian(formData: FormData) {
  const dietitianId = formData.get('dietitianId') as string
  if (!dietitianId) return { error: 'Geçersiz diyetisyen ID' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Giriş yapmalısınız' }

  const { error } = await supabase
    .from('dietitian_clients')
    .insert({
      dietitian_id: dietitianId,
      client_id: user.id,
      status: 'pending'
    })

  if (error) {
    if (error.code === '23505') return { error: 'Zaten bir isteğiniz bulunuyor.' }
    return { error: error.message }
  }

  // Get username for revalidation if needed
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', dietitianId).single()
  
  if (profile) {
    revalidatePath(`/u/${profile.username}`)
  }
  
  return { success: true }
}

export async function startConversation(formData: FormData) {
  const targetUserId = formData.get('targetUserId') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [p1, p2] = [user.id, targetUserId].sort()

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .single()

  if (existing) {
    redirect(`/messages/${existing.id}`)
  }

  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2 })
    .select('id')
    .single()

  if (error) return { error: error.message }
  
  redirect(`/messages/${newConv.id}`)
}
