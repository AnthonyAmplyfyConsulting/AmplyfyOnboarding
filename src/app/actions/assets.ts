'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function finishAssetsOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('onboarding_state')
    .update({ assets_uploaded: true, access_granted: true })
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
}

export async function togglePlatformAccess(platformName: string, granted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // check if exists
  const { data: existing } = await supabase
    .from('platform_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform_name', platformName)
    .single()

  const status = granted ? 'granted' : 'pending'

  if (existing) {
    await supabase.from('platform_access').update({ status }).eq('id', existing.id)
  } else {
    await supabase.from('platform_access').insert({
      user_id: user.id,
      platform_name: platformName,
      status
    })
  }
}
