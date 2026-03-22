'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { createClient } from '@/utils/supabase/client'

export default function AgreementPage() {
  const [isSigned, setIsSigned] = useState(false)
  const [envelopeExists, setEnvelopeExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchState() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('onboarding_state')
          .select('agreement_status, docusign_envelope_id')
          .eq('id', user.id)
          .single()
        
        if (data) {
          if (data.agreement_status === 'signed') {
            setIsSigned(true)
          }
          if (data.docusign_envelope_id) {
            setEnvelopeExists(true)
          }
        }
      }
      setLoading(false)
    }
    fetchState()
  }, [supabase])

  const handleSignDocument = () => {
    // Redirects the user to the DocuSign View API endpoint we created
    window.location.href = '/api/docusign/view'
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading Agreement...</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Client Agreement</h1>
        <p className={styles.subtitle}>
          Please review the terms of our engagement. Signing this document finalizes your commitment so we can move forward.
        </p>
        {isSigned && <div className={styles.statusBadge}>✓ Signed & Submitted</div>}
      </header>

      <section className={styles.card} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div className={styles.trustCopy} style={{ marginBottom: '2rem', justifyContent: 'center' }}>
          🔒 Secure document handling. Your agreement is processed via DocuSign and stored securely in your client portal.
        </div>

        {!isSigned ? (
          <>
            {envelopeExists ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <p style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: '1.6' }}>
                  Your Master Services Agreement is ready for your signature. Click below to review and sign the document securely via DocuSign.
                </p>
                <button 
                  onClick={handleSignDocument} 
                  className={styles.primaryButton}
                  style={{ width: '100%', maxWidth: '300px', padding: '1rem', fontSize: '1.1rem' }}
                >
                  Sign Document in DocuSign →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '3rem', opacity: 0.2 }}>📄</div>
                <p style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', opacity: 0.8, maxWidth: '400px' }}>
                  Your contract is currently being prepared by your account manager. Please check back shortly.
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <p style={{ color: 'var(--color-text-main)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: '1.6' }}>
              Thank you for signing the agreement! A copy of this document has been emailed to you.
            </p>
            <button 
              onClick={() => router.push('/onboarding/payment')} 
              className={styles.primaryButton}
            >
              Continue to Payment →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
