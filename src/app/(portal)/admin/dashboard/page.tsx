import { createClient } from '@/utils/supabase/server'
import styles from './page.module.css'
import { createClientAccount, uploadClientContract, setClientStripeLink } from '@/app/actions/admin'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const error = resolvedParams?.error as string
  const success = resolvedParams?.success as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') redirect('/dashboard')

  // Fetch all clients
  const { data: clients, error: clientsError } = await supabase
    .from('profiles')
    .select(`
      id, email, contact_name, business_name, created_at,
      onboarding_state (
        agreement_status, payment_status, intake_completed, assets_uploaded, deposit_amount, stripe_invoice_url
      )
    `)
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  let dbError = null
  if (clientsError) {
    console.error('Pipeline Fetch Error:', clientsError)
    dbError = clientsError.message || JSON.stringify(clientsError)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin Control Center</h1>
        <p className={styles.subtitle}>Manage onboarding pipelines, create new clients, and dispatch contracts.</p>
      </header>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #FCA5A5' }}>
          <strong>Provisioning Error:</strong> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #6EE7B7' }}>
          <strong>Success:</strong> Client portal generated securely!
        </div>
      )}
      {dbError && (
        <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #FCA5A5' }}>
          <strong>Database Pipeline Error:</strong> {dbError}
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.title} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Provision New Client</h2>
        <form action={createClientAccount}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contact Name</label>
              <input name="contactName" type="text" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Business Name</label>
              <input name="businessName" type="text" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input name="email" type="email" className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Temporary Password</label>
              <input name="password" type="text" className={styles.input} required minLength={6} placeholder="Secure123!" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Deposit Invoice Amount ($)</label>
              <input name="depositAmount" type="number" className={styles.input} defaultValue={2500} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Stripe Invoice Link (Optional)</label>
              <input name="stripeUrl" type="url" className={styles.input} placeholder="https://buy.stripe.com/..." />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Master Contract Document (Optional)</label>
              <input name="contractFile" type="file" className={styles.input} style={{ padding: '0.65rem' }} />
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
            <label className={styles.label}>Required Platform Access</label>
            <div className={styles.checkboxGrid}>
              {['google_workspace', 'crm', 'website', 'meta_ads', 'analytics'].map(plat => (
                <label key={plat} className={styles.checkboxLabel}>
                  <input type="checkbox" name="platforms" value={plat} defaultChecked />
                  {plat.replace('_', ' ').toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.button}>Generate Client Portal</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.title} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Client Pipeline</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Deposit</th>
                <th>Progress Status</th>
                <th>Contract Upload</th>
              </tr>
            </thead>
            <tbody>
              {clients?.map((client: any) => {
                const state = client.onboarding_state
                const isSigned = state.agreement_status === 'signed'
                const isPaid = state.payment_status === 'paid'
                
                return (
                  <tr key={client.id}>
                    <td>
                      <div className={styles.clientName}>{client.contact_name || 'Unknown'} - {client.business_name}</div>
                      <div className={styles.clientEmail}>{client.email}</div>
                    </td>
                    <td>
                      ${state.deposit_amount?.toLocaleString() || '0'} <br/>
                      {isPaid ? <span style={{ color: 'green', fontSize: '0.8rem', fontWeight: 600 }}>PAID</span> : <span style={{ color: 'red', fontSize: '0.8rem', fontWeight: 600 }}>PENDING</span>}
                    </td>
                    <td>
                      <div><span className={`${styles.statusBadge} ${isSigned ? styles.statusComplete : styles.statusPending}`}>Contract: {isSigned ? 'Signed' : 'Pending'}</span></div>
                      <div><span className={`${styles.statusBadge} ${state.intake_completed ? styles.statusComplete : styles.statusPending}`}>Intake: {state.intake_completed ? 'Done' : 'Pending'}</span></div>
                      <div><span className={`${styles.statusBadge} ${state.assets_uploaded ? styles.statusComplete : styles.statusPending}`}>Assets: {state.assets_uploaded ? 'Done' : 'Pending'}</span></div>
                    </td>
                    <td className={styles.actionCell}>
                      <form action={uploadClientContract} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input type="hidden" name="clientId" value={client.id} />
                        <input type="file" name="contractFile" required style={{ fontSize: '0.8rem' }} />
                        <button type="submit" className={styles.buttonOutline}>Upload Master Document</button>
                      </form>
                      <form action={setClientStripeLink} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="hidden" name="clientId" value={client.id} />
                        <input type="url" name="stripeUrl" placeholder={state.stripe_invoice_url || "https://buy.stripe.com/..."} required className={styles.input} style={{ fontSize: '0.8rem', padding: '0.5rem' }} />
                        <button type="submit" className={styles.buttonOutline}>Set Stripe Link</button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {(!clients || clients.length === 0) && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No clients found. Provision one above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
