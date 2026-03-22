'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptAgreement() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('onboarding_state')
    .update({ agreement_status: 'signed' })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update agreement status', error)
    throw new Error('Could not update agreement')
  }

  revalidatePath('/dashboard', 'layout')
}

export async function submitIntakeForm(formDataJSON: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Insert or update form data
  const { error: insertError } = await supabase
    .from('intake_forms')
    .insert({ user_id: user.id, data: formDataJSON })

  if (insertError) {
    throw new Error('Could not save intake form')
  }

  // Update onboarding state
  await supabase
    .from('onboarding_state')
    .update({ intake_completed: true })
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
}

export async function markPaymentPaid() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('onboarding_state')
    .update({ payment_status: 'paid' })
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
}
