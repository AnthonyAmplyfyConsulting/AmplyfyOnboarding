import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const event = searchParams.get('event')
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (event === 'signing_complete') {
    // Update the local database to reflect the signed status
    await supabase.from('onboarding_state').update({ agreement_status: 'signed' }).eq('id', user.id)
    
    // Redirect to the next step
    return NextResponse.redirect(new URL('/onboarding/payment', request.url))
  }

  // If the user cancelled or declined
  if (event === 'cancel' || event === 'decline') {
    return NextResponse.redirect(new URL('/onboarding/agreement?error=signing_cancelled', request.url))
  }

  // Default redirect back to agreement page
  return NextResponse.redirect(new URL('/onboarding/agreement', request.url))
}
