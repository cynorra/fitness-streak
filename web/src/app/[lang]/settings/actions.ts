'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const displayName = formData.get('displayName') as string
  const username = formData.get('username') as string
  const role = formData.get('role') as string
  const bio = formData.get('bio') as string
  const specialty = formData.get('specialty') as string
  const timezone = formData.get('timezone') as string
  const dayStartHour = parseInt(formData.get('dayStartHour') as string)

  if (!username || username.length < 3 || username.length > 20) {
    return redirect('/settings?error=Kullanıcı adı 3-20 karakter arasında olmalıdır')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      username: username,
      role: role,
      bio: bio,
      specialty: specialty,
      timezone: timezone,
      day_start_hour: dayStartHour,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return redirect('/settings?error=Bu kullanıcı adı zaten alınmış')
    }
    return redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  revalidatePath(`/u/${username}`)
  return redirect('/settings?message=Profil başarıyla güncellendi')
}
