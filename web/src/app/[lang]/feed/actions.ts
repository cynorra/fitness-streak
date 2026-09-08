'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const content = formData.get('content') as string
  if (!content) return { error: 'Content is required' }

  const { error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      moderation_status: 'pending' // Trigger will handle this
    })

  if (error) return { error: error.message }
  
  revalidatePath('/feed')
  return { success: true }
}

export async function toggleLike(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    await supabase.from('post_likes').delete().eq('id', existingLike.id)
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function addComment(postId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: user.id, content })

  if (error) return { error: error.message }
  
  revalidatePath('/feed')
  return { success: true }
}

export async function reportPost(postId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single()
  if (!post) return { error: 'Gönderi bulunamadı' }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: post.user_id,
    content_type: 'post',
    content_id: postId,
    reason,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleRepost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: existingRepost } = await supabase
    .from('reposts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingRepost) {
    await supabase.from('reposts').delete().eq('id', existingRepost.id)
  } else {
    await supabase.from('reposts').insert({ post_id: postId, user_id: user.id })
  }

  revalidatePath('/feed')
  return { success: true }
}
