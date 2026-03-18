import Link from "next/link";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <section className={styles.hero} data-testid={testIds.landing.hero}>
      <div className={styles.heroContent} data-testid={testIds.landing.heroContent}>
        <p className={styles.eyebrow} data-testid={testIds.landing.eyebrow}>
          User Management
        </p>
        <h1 className={styles.title} data-testid={testIds.landing.title}>
          User Management App
        </h1>
        <p className={styles.subtitle}>
          Secure and modern user management system
        </p>
        <div className={styles.actions} data-testid={testIds.landing.actions}>
          <Link
            href="/login"
            className={styles.primary}
            data-testid={testIds.landing.loginLink}
          >
            Login
          </Link>
          <Link
            href="/register"
            className={styles.secondary}
            data-testid={testIds.landing.registerLink}
          >
            Register
          </Link>
        </div>
      </div>
      <div className={styles.card} data-testid={testIds.landing.featureCard}>
        <h2 data-testid={testIds.landing.featureTitle}>Built for clarity and control</h2>
        <p>
          Invite users, manage profiles, and track activity in one calm, focused
          dashboard. Designed to scale with your team.
        </p>
        <div className={styles.cardMeta} data-testid={testIds.landing.featureMeta}>
          <div data-testid={testIds.landing.metaSecurity}>
            <span className={styles.metaLabel}>Security</span>
            <span className={styles.metaValue}>JWT + Role-ready</span>
          </div>
          <div data-testid={testIds.landing.metaSpeed}>
            <span className={styles.metaLabel}>Speed</span>
            <span className={styles.metaValue}>FastAPI core</span>
          </div>
          <div data-testid={testIds.landing.metaData}>
            <span className={styles.metaLabel}>Data</span>
            <span className={styles.metaValue}>SQLite ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
