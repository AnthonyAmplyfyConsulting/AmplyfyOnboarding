'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { submitIntakeForm } from '@/app/actions/onboarding'
import { createClient } from '@/utils/supabase/client'

const TOTAL_STEPS = 5

export default function IntakePage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchState() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('onboarding_state')
          .select('intake_completed')
          .eq('id', user.id)
          .single()
        
        if (data && data.intake_completed) {
          setIsCompleted(true)
        } else {
          // fetch saved draft
          const { data: formDataDb } = await supabase
            .from('intake_forms')
            .select('data')
            .eq('user_id', user.id)
            .single()

          if (formDataDb && formDataDb.data) {
            setFormData(formDataDb.data)
          }
        }
      }
      setLoading(false)
    }
    fetchState()
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS))
  const handleBack = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submitIntakeForm(formData)
      setIsCompleted(true)
      router.push('/onboarding/assets')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div>Loading...</div>

  if (isCompleted) {
    return (
      <div className={styles.container}>
         <section className={styles.card}>
            <div className={styles.successState}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Intake Form Completed</h2>
              <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>
                Thank you. Your responses have been securely saved to your client portfolio.
              </p>
              <button 
                className={styles.primaryButton}
                onClick={() => router.push('/onboarding/assets')}
                style={{ width: 'auto' }}
              >
                Continue to Asset Uploads →
              </button>
            </div>
         </section>
      </div>
    )
  }

  const progressPercentage = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Client Intake</h1>
        <p className={styles.subtitle}>
          Help us understand your business deeply so we can hit the ground running.
        </p>
      </header>

      <div className={styles.tracker}>
        <div className={styles.trackerLine}></div>
        <div className={styles.trackerProgress} style={{ width: `${progressPercentage}%` }}></div>
        {[1, 2, 3, 4, 5].map((num) => (
          <div 
            key={num} 
            className={`${styles.trackerStep} ${step === num ? styles.trackerStepActive : ''} ${step > num ? styles.trackerStepCompleted : ''}`}
          >
            {step > num ? '✓' : num}
          </div>
        ))}
      </div>

      <section className={styles.card}>
        {step === 1 && (
          <div>
            <h2 className={styles.stepTitle}>1. Business Information</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Business Name</label>
                <input name="business_name" value={formData.business_name || ''} onChange={handleInput} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Contact Name</label>
                <input name="contact_name" value={formData.contact_name || ''} onChange={handleInput} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleInput} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInput} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Website URL</label>
                <input type="url" name="website" value={formData.website || ''} onChange={handleInput} className={styles.input} placeholder="https://" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Industry</label>
                <input name="industry" value={formData.industry || ''} onChange={handleInput} className={styles.input} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Location / Headquarters</label>
                <input name="location" value={formData.location || ''} onChange={handleInput} className={styles.input} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className={styles.stepTitle}>2. Goals and Outcomes</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>What are your main goals for this engagement?</label>
                <textarea name="main_goals" value={formData.main_goals || ''} onChange={handleInput} className={styles.textarea} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>How do you measure success?</label>
                <textarea name="success_metrics" value={formData.success_metrics || ''} onChange={handleInput} className={styles.textarea} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>What are your current operational pain points?</label>
                <textarea name="pain_points" value={formData.pain_points || ''} onChange={handleInput} className={styles.textarea} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Which services are the highest priority right now?</label>
                <input name="priority_services" value={formData.priority_services || ''} onChange={handleInput} className={styles.input} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className={styles.stepTitle}>3. Current Systems</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>CRM Platform</label>
                <input name="crm" value={formData.crm || ''} onChange={handleInput} className={styles.input} placeholder="e.g. Salesforce, HubSpot" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Website Hosting / CMS</label>
                <input name="cms" value={formData.cms || ''} onChange={handleInput} className={styles.input} placeholder="e.g. WordPress, Webflow" />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Other Marketing / Automation Tools used</label>
                <textarea name="marketing_tools" value={formData.marketing_tools || ''} onChange={handleInput} className={styles.textarea} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className={styles.stepTitle}>4. Audience and Offer</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Who is your primary target audience?</label>
                <textarea name="target_audience" value={formData.target_audience || ''} onChange={handleInput} className={styles.textarea} />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Describe your core offer/service</label>
                <textarea name="core_offer" value={formData.core_offer || ''} onChange={handleInput} className={styles.textarea} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Average Customer Value (ACV)</label>
                <input name="acv" value={formData.acv || ''} onChange={handleInput} className={styles.input} placeholder="$" />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Describe your current sales process</label>
                <textarea name="sales_process" value={formData.sales_process || ''} onChange={handleInput} className={styles.textarea} />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className={styles.stepTitle}>5. Final Notes</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Any additional information or context?</label>
                <textarea name="additional_info" value={formData.additional_info || ''} onChange={handleInput} className={styles.textarea} style={{ height: '150px' }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
              Your responses will be actively saved to your secure dossier upon submission.
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {step > 1 ? (
            <button onClick={handleBack} className={styles.secondaryButton}>
              ← Back
            </button>
          ) : <div></div>}

          {step < TOTAL_STEPS ? (
            <button onClick={handleNext} className={styles.primaryButton}>
              Next Step →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting} className={styles.primaryButton}>
              {isSubmitting ? 'Saving...' : 'Submit Intake Form ✓'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
