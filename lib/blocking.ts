import { supabase } from './supabase';

export type ReportContentType = 'profile' | 'post' | 'comment' | 'message';

export async function blockUser(currentUserId: string, blockedId: string) {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: currentUserId, blocked_id: blockedId });

  if (error && error.code !== '23505') return { error: error.message };
  return { success: true };
}

export async function unblockUser(currentUserId: string, blockedId: string) {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .match({ blocker_id: currentUserId, blocked_id: blockedId });

  if (error) return { error: error.message };
  return { success: true };
}

export async function reportUser(
  currentUserId: string,
  reportedUserId: string,
  reason: string,
  contentType: ReportContentType = 'profile',
  contentId?: string
) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: currentUserId,
    reported_user_id: reportedUserId,
    content_type: contentType,
    content_id: contentId ?? null,
    reason,
  });

  if (error) return { error: error.message };
  return { success: true };
}
