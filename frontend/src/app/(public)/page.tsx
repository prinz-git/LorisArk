import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>User Management</p>
        <h1 className={styles.title}>User Management App</h1>
        <p className={styles.subtitle}>
          Secure and modern user management system
        </p>
        <div className={styles.actions}>
          <Link href="/login" className={styles.primary}>
            Login
          </Link>
          <Link href="/register" className={styles.secondary}>
            Register
          </Link>
        </div>
      </div>
      <div className={styles.card}>
        <h2>Built for clarity and control</h2>
        <p>
          Invite users, manage profiles, and track activity in one calm, focused
          dashboard. Designed to scale with your team.
        </p>
        <div className={styles.cardMeta}>
          <div>
            <span className={styles.metaLabel}>Security</span>
            <span className={styles.metaValue}>JWT + Role-ready</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Speed</span>
            <span className={styles.metaValue}>FastAPI core</span>
          </div>
          <div>
            <span className={styles.metaLabel}>Data</span>
            <span className={styles.metaValue}>SQLite ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
