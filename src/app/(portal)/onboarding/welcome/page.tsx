import styles from './page.module.css'
import Link from 'next/link'

export default function WelcomePage() {
  const steps = [
    { num: 1, title: 'Review & Sign Agreement', desc: 'Read and sign your client agreement digitally to kickstart our partnership.' },
    { num: 2, title: 'Pay Deposit', desc: 'Complete your initial deposit payment securely via Stripe.' },
    { num: 3, title: 'Complete Client Intake', desc: 'Tell us more about your business, goals, and current systems so we can align our strategy.' },
    { num: 4, title: 'Upload Assets & Grant Access', desc: 'Securely upload your brand assets and provide access to necessary platforms.' },
    { num: 5, title: 'Access Your Dashboard', desc: 'Once complete, your personalized dashboard will track our progress and house your documents.' }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome to AMPLYFY</h1>
        <p className={styles.subtitle}>
          This onboarding portal is designed to get your project started smoothly and efficiently. Follow the guided steps to complete your initial setup.
        </p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Your Onboarding Roadmap</h2>
        
        <div className={styles.stepsList}>
          {steps.map((step) => (
            <div key={step.num} className={styles.stepItem}>
              <div className={styles.stepNumber}>{step.num}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDescription}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Link href="/onboarding/agreement" className={styles.primaryButton}>
            Begin Onboarding →
          </Link>
        </div>
      </section>
    </div>
  )
}
