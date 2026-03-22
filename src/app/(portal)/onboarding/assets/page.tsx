'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { finishAssetsOnboarding, togglePlatformAccess } from '@/app/actions/assets'
import { createClient } from '@/utils/supabase/client'

const ACCESS_PLATFORMS = [
  { id: 'google_workspace', name: 'Google Workspace', instruction: 'Invite admin@amplyfy.consulting with Admin privileges.' },
  { id: 'crm', name: 'CRM (HubSpot/Salesforce)', instruction: 'Provision a seat for our team alias or grant API access via OAuth.' },
  { id: 'website', name: 'Website / CMS', instruction: 'Add team@amplyfy.consulting as Administrator.' },
  { id: 'meta_ads', name: 'Meta / Ad Accounts', instruction: 'Send a partnership request via Business Manager.' },
  { id: 'analytics', name: 'Analytics', instruction: 'Share edit access to the main property.' },
]

export default function AssetsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessStatuses, setAccessStatuses] = useState<Record<string, boolean>>({})
  const [requiredPlatforms, setRequiredPlatforms] = useState<string[]>(['google_workspace', 'crm', 'website', 'meta_ads', 'analytics'])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchFiles(user.id)
        
        const { data: platforms } = await supabase
          .from('platform_access')
          .select('platform_name, status')
          .eq('user_id', user.id)
          
        const { data: state } = await supabase
          .from('onboarding_state')
          .select('required_platforms')
          .eq('id', user.id)
          .single()
          
        if (state?.required_platforms) {
          setRequiredPlatforms(state.required_platforms)
        }
          
        if (platforms) {
          const statuses: Record<string, boolean> = {}
          platforms.forEach((p: any) => {
            statuses[p.platform_name] = p.status === 'granted'
          })
          setAccessStatuses(statuses)
        }
      }
    }
    init()
  }, [])

  const fetchFiles = async (uid: string) => {
    const { data } = await supabase.storage.from('client-assets').list(uid)
    if (data) setFiles(data)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return
    const file = e.target.files[0]
    setUploading(true)

    const filePath = `${userId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('client-assets').upload(filePath, file)
    
    if (!error) {
      await fetchFiles(userId)
    } else {
      console.error(error)
      alert("Failed to upload file")
    }
    setUploading(false)
  }

  const handleToggleAccess = async (platformId: string) => {
    const isGranted = accessStatuses[platformId] || false
    const newStatus = !isGranted
    
    // Optimistic UI update
    setAccessStatuses(prev => ({ ...prev, [platformId]: newStatus }))
    
    try {
      await togglePlatformAccess(platformId, newStatus)
    } catch (e) {
      // Rollback on failure
      setAccessStatuses(prev => ({ ...prev, [platformId]: isGranted }))
    }
  }

  const handleComplete = async () => {
    await finishAssetsOnboarding()
    router.push('/dashboard')
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Assets & Access</h1>
        <p className={styles.subtitle}>
          Securely transfer your files and configure system access so we can begin execution.
        </p>
      </header>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Asset Uploads</h2>
        <div className={styles.card}>
          <div className={styles.uploadArea}>
            <input 
              type="file" 
              className={styles.fileInput} 
              onChange={handleFileUpload}
              disabled={uploading}
              multiple
            />
            <svg className={styles.uploadIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <div className={styles.uploadText}>
              {uploading ? 'Uploading...' : 'Click or drag files to this area to upload'}
            </div>
            <div className={styles.uploadSubtext}>
              Supports logos, brand files, media, and marketing assets.
            </div>
          </div>

          {files.length > 0 && (
            <div className={styles.fileList}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Uploaded Assets</h3>
              {files.map(f => (
                <div key={f.id} className={styles.fileItem}>
                  <span>{f.name.replace(/^\d+_/, '')}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    {(f.metadata?.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Platform Access</h2>
        
        <div className={styles.importantNote}>
          <strong>Important:</strong> For security, we do not collect passwords. Please grant access directly through each platform to our designated team email or by following the specific instructions.
        </div>

        <div className={styles.grid}>
          {ACCESS_PLATFORMS.filter(p => requiredPlatforms.includes(p.id)).map(platform => {
            const granted = accessStatuses[platform.id] || false
            return (
              <div key={platform.id} className={styles.accessCard}>
                <div className={styles.accessHeader}>
                  <div className={styles.platformName}>{platform.name}</div>
                  <div className={`${styles.accessStatus} ${granted ? styles.statusGranted : styles.statusPending}`}>
                    {granted ? 'GRANTED' : 'PENDING'}
                  </div>
                </div>
                <div className={styles.accessInstruction}>{platform.instruction}</div>
                <button 
                  onClick={() => handleToggleAccess(platform.id)}
                  style={{
                    background: granted ? 'transparent' : 'var(--color-bg)',
                    border: granted ? '1px solid var(--color-border)' : '1px solid var(--color-border-subtle)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginTop: 'auto',
                    color: granted ? 'var(--color-text-light)' : 'var(--color-text-main)'
                  }}
                >
                  {granted ? 'Mark as Pending' : 'Mark as Granted'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={handleComplete} className={styles.primaryButton}>
          Finish Initialization →
        </button>
      </div>
    </div>
  )
}
