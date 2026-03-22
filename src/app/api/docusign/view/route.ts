import { createClient } from '@/utils/supabase/server'
import { getRecipientViewUrl } from '@/utils/docusign'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('email, contact_name').eq('id', user.id).single()
  const { data: state } = await supabase.from('onboarding_state').select('docusign_envelope_id, agreement_status').eq('id', user.id).single()

  if (!state?.docusign_envelope_id) {
    return new NextResponse('No envelope found for this user', { status: 404 })
  }

  if (state.agreement_status === 'signed') {
    return NextResponse.redirect(new URL('/onboarding/payment', request.url))
  }

  try {
    const returnUrl = new URL('/api/docusign/callback', request.url).toString()
    const url = await getRecipientViewUrl(
      state.docusign_envelope_id,
      profile?.email || user.email!, // Use profile email or fallback
      profile?.contact_name || user.email!.split('@')[0], // Fallback name
      user.id,
      returnUrl
    )
    
    // Redirect user to the DocuSign signing session
    if (!url) throw new Error('DocuSign failed to generate a signing URL')
    return NextResponse.redirect(url)
  } catch (error: any) {
    console.error('Error generating Recipient View:', error)
    return new NextResponse('Error generating signing URL: ' + error.message, { status: 500 })
  }
}
