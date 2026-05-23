'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addWorkout(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const workoutType = formData.get('workoutType') as string
  const durationMinutes = parseInt(formData.get('durationMinutes') as string)
  const note = formData.get('note') as string
  const isPublic = formData.get('isPublic') === 'on'

  if (!workoutType || isNaN(durationMinutes)) {
    return redirect('/dashboard?error=Lütfen tüm zorunlu alanları doldurun')
  }

  const { error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      note: note,
      is_public: isPublic,
    })

  if (error) {
    return redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  return redirect('/dashboard?message=Antrenman başarıyla kaydedildi! 🔥')
}
