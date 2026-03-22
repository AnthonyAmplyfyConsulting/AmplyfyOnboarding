'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} style={{
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-border)',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      textAlign: 'center'
    }}>
      Sign Out
    </button>
  )
}
