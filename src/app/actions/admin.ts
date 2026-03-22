'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient as createRawClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createEnvelopeFromDocument } from '@/utils/docusign'

export async function createClientAccount(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const contactName = formData.get('contactName') as string
  const businessName = formData.get('businessName') as string
  const depositAmount = Number(formData.get('depositAmount'))
  const requiredPlatforms = formData.getAll('platforms') as string[]
  const stripeUrl = formData.get('stripeUrl') as string | null
  const contractFile = formData.get('contractFile') as File | null

  if (!email || !password || !contactName) {
    redirect('/admin/dashboard?error=Email, password, and contact name are required.')
  }

  // Bypassing GoTrue email rate limits and enumerations by using a direct Postgres RPC
  const { data: newUserId, error: rpcError } = await supabase.rpc('provision_client_account', {
    new_email: email,
    new_password: password,
    new_contact_name: contactName,
    new_business_name: businessName,
    new_deposit_amount: depositAmount || 0,
    new_platforms: requiredPlatforms.length > 0 ? requiredPlatforms : ['google_workspace', 'crm', 'website', 'meta_ads', 'analytics'],
    new_stripe_url: stripeUrl
  })

  if (rpcError) {
    console.error("RPC Error:", rpcError)
    redirect(`/admin/dashboard?error=${encodeURIComponent(rpcError.message)}`)
  }

  if (!newUserId) {
    redirect('/admin/dashboard?error=Failed to provision client account via RPC.')
  }

  if (contractFile && contractFile.size > 0) {
    const filePath = `${newUserId}/${Date.now()}_${contractFile.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, contractFile)
    if (uploadError) redirect(`/admin/dashboard?error=${encodeURIComponent('Upload Error: ' + uploadError.message)}`)
      
    try {
      const buffer = Buffer.from(await contractFile.arrayBuffer())
      const envelopeId = await createEnvelopeFromDocument(
        email,
        contactName,
        newUserId,
        buffer,
        contractFile.name
      )
      await supabase.from('onboarding_state').update({ docusign_envelope_id: envelopeId }).eq('id', newUserId)
    } catch (dsError: unknown) {
      console.error('DocuSign Envelope Error:', dsError)
      const err = dsError as Error
      redirect(`/admin/dashboard?error=${encodeURIComponent('Client provisioned but DocuSign failed: ' + (err.message || 'Unknown error'))}`)
    }
  }

  revalidatePath('/admin/dashboard')
  redirect('/admin/dashboard?success=1')
}

export async function uploadClientContract(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const clientId = formData.get('clientId') as string
  const file = formData.get('contractFile') as File

  if (!clientId || !file) throw new Error('Client ID and file are required')

  // Upload to the documents bucket inside the client's dedicated folder
  // Admins need a way to bypass RLS for documents. Let's see if we can do this without service key:
  // If the bucket RLS blocks the admin, we might need a SQL policy allowing admins to insert into the `documents` bucket.
  // Wait! The user asked for "where I upload the un signed document". Let's attempt it.
  
  const filePath = `${clientId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('documents').upload(filePath, file)
  
  if (error) {
    // If it fails due to RLS, it means the bucket doesn't let Admins upload.
    // The bucket policies were configured before we had "Admin" roles.
    // We should probably rely on a SQL execution block to fix the policies.
    throw new Error('Upload failed. RLS might be preventing upload. Error: ' + error.message)
  }

  const { data: clientProfile } = await supabase.from('profiles').select('email, contact_name').eq('id', clientId).single()
  if (clientProfile) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const envelopeId = await createEnvelopeFromDocument(
        clientProfile.email, 
        clientProfile.contact_name, 
        clientId, 
        buffer, 
        file.name
      )
      await supabase.from('onboarding_state').update({ docusign_envelope_id: envelopeId }).eq('id', clientId)
    } catch (dsError: unknown) {
      console.error('DocuSign API Error:', dsError)
      const err = dsError as Error
      throw new Error('Contract uploaded, but DocuSign envelope creation failed: ' + err.message)
    }
  }

  revalidatePath('/admin/dashboard')
}

export async function setClientStripeLink(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  const clientId = formData.get('clientId') as string
  const stripeUrl = formData.get('stripeUrl') as string

  if (!clientId || !stripeUrl) throw new Error('Client ID and Stripe URL are required')

  await supabase.from('onboarding_state').update({ stripe_invoice_url: stripeUrl }).eq('id', clientId)

  revalidatePath('/admin/dashboard')
}
