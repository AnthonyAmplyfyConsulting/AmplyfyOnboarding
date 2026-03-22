import styles from './page.module.css'
import { login } from './actions'
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const awaitedParams = await searchParams
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>AMPLYFY <span className="text-gradient">Consulting</span></h1>
        <p className={styles.trustCopy}>Secure Client Portal</p>
        
        <p className={styles.description}>
          Sign in or create an account to begin your onboarding experience and access your private documents.
        </p>

        {awaitedParams?.message && (
          <div className={styles.errorTarget}>
            {awaitedParams.message}
          </div>
        )}

        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button formAction={login} className={styles.button}>
            Sign In
          </button>
        </form>

        <div className={styles.links}>
          <a href="#">Forgot your password?</a>
        </div>
      </div>
    </div>
  )
}
