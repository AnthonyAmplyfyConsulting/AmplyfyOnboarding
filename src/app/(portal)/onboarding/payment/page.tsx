'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { markPaymentPaid } from '@/app/actions/onboarding'
import { createClient } from '@/utils/supabase/client'

export default function PaymentPage() {
  const [status, setStatus] = useState<'unpaid' | 'pending' | 'paid'>('unpaid')
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [depositAmount, setDepositAmount] = useState(0)
  const [stripeUrl, setStripeUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: state } = await supabase.from('onboarding_state').select('payment_status, deposit_amount, stripe_invoice_url').eq('id', user.id).single()
        if (state?.payment_status === 'paid') {
          setSuccess(true)
        }
        if (state?.deposit_amount) {
          setDepositAmount(state.deposit_amount)
        }
        if (state?.stripe_invoice_url) {
          setStripeUrl(state.stripe_invoice_url)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSimulatePayment = async () => {
    setProcessing(true)
    // Simulate network delay for Stripe checkout
    await new Promise(r => setTimeout(r, 1500))
    await markPaymentPaid()
    setSuccess(true)
    setProcessing(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={`${styles.statusBadge} ${success ? styles.statusPaid : styles.statusUnpaid}`}>
          {success ? 'Payment Complete' : 'Payment Required'}
        </div>
        <h1 className={styles.title}>Project Deposit</h1>
        <p className={styles.subtitle}>
          Secure your kickoff timeline by securely placing your initial deposit.
        </p>
      </header>

      <section className={styles.card}>
        {!success ? (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryLeft}>
                <span className={styles.summaryLabel}>Amount Due</span>
                <span className={styles.summaryAmount}>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.summaryDetails}>
                <div className={styles.summaryRow}>
                    <span className={styles.rowLabel}>Phase 1 Deposit</span>
                    <span className={styles.rowValue}>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.rowLabel}>Estimated Tax</span>
                    <span className={styles.rowValue}>$0.00</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total Due Today</span>
                    <span>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
              </div>
              <div style={{ textAlign: 'right', color: 'var(--color-text-light)', fontSize: '0.9rem', maxWidth: '150px' }}>
                Covers initial consulting, strategy mapping, and setup.
              </div>
            </div>

            {stripeUrl ? (
              <div className={styles.stripePlaceholder} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>Your Invoice is Ready</h3>
                <a 
                  href={stripeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.payButton}
                  style={{ display: 'inline-block', textDecoration: 'none', marginBottom: '1rem' }}
                >
                  Pay Invoice via Stripe ↗
                </a>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                  Click the button above to securely pay your deposit invoice through Stripe. Return here once completed.
                </p>
              </div>
            ) : (
              <div className={styles.stripePlaceholder}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366F1' }}>
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                Invoice Generating...
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Your dedicated Stripe invoice link will appear here shortly)</div>
              </div>
            )}

            <div className={styles.buttonContainer}>
                  <button 
                    onClick={handleSimulatePayment}
                    className={styles.payButton}
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border)' }}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : `Mark Invoice as Paid`}
                  </button>
            </div>
          </>
        ) : (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Payment Successful</h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>
              Your deposit has been processed. We've sent a receipt to your email.
            </p>
            <button 
              className={styles.primaryButton}
              onClick={() => router.push('/onboarding/intake')}
              style={{ width: 'auto' }}
            >
              Continue to Intake Form →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
