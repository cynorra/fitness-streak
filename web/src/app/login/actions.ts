'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=Email ve şifre gereklidir')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let errorMessage = error.message;
    if (error.message === "Invalid login credentials") {
      errorMessage = "E-posta veya şifre hatalı";
    }
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/', 'layout')
  return redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=Email ve şifre gereklidir')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    let errorMessage = error.message;
    if (error.message === "User already registered") {
      errorMessage = "Bu e-posta adresi zaten kayıtlı";
    }
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/', 'layout')
  return redirect('/login?message=Kayıt başarılı! Lütfen e-postanızı kontrol edin.')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return redirect('/')
}
