import { createClient } from '@/utils/supabase/server'
import styles from './page.module.css'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  const { data: state } = await supabase.from('onboarding_state').select('*').eq('id', user.id).single()

  const checklist = [
    { id: 'agreement', name: 'Sign Agreement', isComplete: state?.agreement_status === 'signed', link: '/onboarding/agreement' },
    { id: 'payment', name: 'Pay Deposit', isComplete: state?.payment_status === 'paid', link: '/onboarding/payment' },
    { id: 'intake', name: 'Client Intake', isComplete: state?.intake_completed, link: '/onboarding/intake' },
    { id: 'assets', name: 'Upload Assets & Access', isComplete: state?.assets_uploaded && state?.access_granted, link: '/onboarding/assets' },
  ]

  const completedCount = checklist.filter(c => c.isComplete).length
  const totalCount = checklist.length
  const progressPercentage = Math.round((completedCount / totalCount) * 100)

  const nextAction = checklist.find(c => !c.isComplete)

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Welcome back, {profile?.contact_name?.split(' ')[0] || user.email?.split('@')[0]}
        </h1>
        <p className={styles.subtitle}>Here is your project overview and onboarding status.</p>
      </header>

      <div className={styles.grid}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {nextAction && (
            <div className={styles.nextActionCard}>
              <div className={styles.nextActionLabel}>Next Recommended Action</div>
              <div className={styles.nextActionTitle}>{nextAction.name}</div>
              <Link href={nextAction.link} className={styles.primaryButtonInverse}>
                Complete Step →
              </Link>
            </div>
          )}

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Onboarding Progress</h2>
            
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Status</span>
              <span className={styles.progressValue}>{progressPercentage}%</span>
            </div>
            
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }}></div>
            </div>

            <div className={styles.checklist}>
              {checklist.map(item => (
                <div key={item.id} className={styles.checklistItem}>
                  <div className={styles.checklistItemLeft}>
                    <div className={`${styles.checkIcon} ${item.isComplete ? styles.iconDone : styles.iconPending}`}>
                      {item.isComplete ? '✓' : '!'}
                    </div>
                    <span className={styles.itemName} style={{ color: item.isComplete ? 'var(--color-text-light)' : 'var(--color-text-main)' }}>
                      {item.name}
                    </span>
                  </div>
                  {!item.isComplete && (
                    <Link href={item.link} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Resume
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Quick Links</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/documents" style={{ color: 'var(--color-text-main)', fontWeight: 500, padding: '0.5rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                View Project Documents
              </Link>
              <Link href="/onboarding/assets" style={{ color: 'var(--color-text-main)', fontWeight: 500, padding: '0.5rem', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                Manage Asset Uploads
              </Link>
            </div>
          </div>

          <div className={styles.contactCard}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Need Assistance?</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
              Your dedicated strategy team is ready to help.
            </p>
            <a href="mailto:support@amplyfy.consulting" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
