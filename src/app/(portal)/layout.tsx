import styles from './layout.module.css'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          AMPLYFY <span className="text-gradient">Consulting</span>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>
            Dashboard
          </Link>
          <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', paddingLeft: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Onboarding
          </div>
          <Link href="/onboarding/welcome" className={styles.navLink}>
            1. Overview
          </Link>
          <Link href="/onboarding/agreement" className={styles.navLink}>
            2. Agreement
          </Link>
          <Link href="/onboarding/payment" className={styles.navLink}>
            3. Deposit Payment
          </Link>
          <Link href="/onboarding/intake" className={styles.navLink}>
            4. Client Intake
          </Link>
          <Link href="/onboarding/assets" className={styles.navLink}>
            5. Assets & Access
          </Link>
          <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', paddingLeft: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Resources
          </div>
          <Link href="/documents" className={styles.navLink}>
            Documents
          </Link>
        </nav>

        <div className={styles.userProfile}>
          <div className={styles.userEmail}>{user.email}</div>
          <LogoutButton />
        </div>
      </aside>
      
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
