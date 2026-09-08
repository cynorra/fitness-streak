'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approvePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('posts')
    .update({ moderation_status: 'approved' })
    .eq('id', postId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  revalidatePath('/feed')
  return { success: true }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/feed')
  return { success: true }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' as const }

  return { supabase, userId: user.id }
}

export async function dismissReport(reportId: string) {
  const admin = await requireAdmin()
  if ('error' in admin) return { error: admin.error }

  const { error } = await admin.supabase
    .from('reports')
    .update({ status: 'dismissed' })
    .eq('id', reportId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function resolveReport(reportId: string) {
  const admin = await requireAdmin()
  if ('error' in admin) return { error: admin.error }

  const { error } = await admin.supabase
    .from('reports')
    .update({ status: 'reviewed' })
    .eq('id', reportId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
