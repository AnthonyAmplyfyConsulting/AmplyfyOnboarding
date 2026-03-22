'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=Email and Password are required')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?message=${error.message}`)
  }

  if (data.user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    revalidatePath('/', 'layout')
    if (profile?.role === 'admin') {
      redirect('/admin/dashboard')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
