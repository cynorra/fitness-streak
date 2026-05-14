'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClientStatus(requestId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('dietitian_clients')
    .update({ status })
    .eq('id', requestId)
    .eq('dietitian_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}
