import { createClient } from '@/utils/supabase/server'
import styles from './page.module.css'
import Link from 'next/link'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // fetch state to know agreement status
  const { data: state } = await supabase.from('onboarding_state').select('agreement_status').eq('id', user.id).single()

  // fetch uploaded assets
  const { data: uploadedAssets } = await supabase.storage.from('client-assets').list(user.id)
  
  // officially generated docs (like executed agreements) could be in another bucket called 'documents'
  const { data: officialDocs } = await supabase.storage.from('documents').list(user.id)

  const isSigned = state?.agreement_status === 'signed'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Project Documents</h1>
        <p className={styles.subtitle}>View and manage all agreements and assets affiliated with your account.</p>
      </header>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Official Agreements</h2>
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.fileName}>
                  <svg className={styles.fileIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  Master Services Agreement
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${isSigned ? styles.statusSigned : styles.statusPending}`}>
                    {isSigned ? 'Signed & Executed' : 'Pending Signature'}
                  </span>
                </td>
                <td>
                  {isSigned ? (
                    <a className={styles.actionLink} href="#">Download PDF</a>
                  ) : (
                    <Link href="/onboarding/agreement" className={styles.actionLink}>Review</Link>
                  )}
                </td>
              </tr>
              {officialDocs?.map(doc => (
                 <tr key={doc.id}>
                    <td className={styles.fileName}>{doc.name}</td>
                    <td><span className={`${styles.statusBadge} ${styles.statusSigned}`}>Executed</span></td>
                    <td><a className={styles.actionLink} href="#">Download</a></td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Uploaded Assets</h2>
        <div className={styles.card}>
          {uploadedAssets && uploadedAssets.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadedAssets.map(file => (
                  <tr key={file.id}>
                    <td className={styles.fileName}>
                      <svg className={styles.fileIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      </svg>
                      {file.name.replace(/^\d+_/, '')}
                    </td>
                    <td className={styles.fileMeta}>{formatBytes(file.metadata?.size || 0)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles.statusUploaded}`}>
                        Uploaded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              No assets uploaded yet. <Link href="/onboarding/assets" className={styles.actionLink}>Upload assets here.</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
