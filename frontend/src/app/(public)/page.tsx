import Link from "next/link";
import HeroLogoMotion from "@/components/HeroLogoMotion";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <section className={styles.hero} data-testid={testIds.landing.hero}>
      <div className={styles.heroContent} data-testid={testIds.landing.heroContent}>
        <p className={styles.eyebrow} data-testid={testIds.landing.eyebrow}>
          LorisArk
        </p>
        <h1 className={styles.title} data-testid={testIds.landing.title}>
          Roosts &amp; Roots
        </h1>
        <p className={styles.subtitle}>
          Build a stay that feels curated, local, and seamless from a single flow.
        </p>
        <p className={styles.description}>
          Select your primary roost, reveal walkable artisan services, and bundle the
          whole neighborhood into one unified checkout.
        </p>
        <div className={styles.tagRow}>
          <span className={styles.tag}>Dynamic roost discovery</span>
          <span className={styles.tag}>Walkable service clusters</span>
          <span className={styles.tag}>Unified stay bundle</span>
        </div>
        <div className={styles.actions} data-testid={testIds.landing.actions}>
          <Link
            href="/login"
            className={styles.primary}
            data-testid={testIds.landing.loginLink}
          >
            Enter the Ark
          </Link>
          <Link
            href="/register"
            className={styles.secondary}
            data-testid={testIds.landing.registerLink}
          >
            Join the Community
          </Link>
        </div>
      </div>

      <HeroLogoMotion />

      <div className={styles.flow} data-testid={testIds.landing.featureCard}>
        <article className={styles.stepCard}>
          <div className={styles.flowIndex}>01</div>
          <div>
            <h2 data-testid={testIds.landing.featureTitle}>Find Your Next Roost</h2>
            <p className={styles.flowCopy}>
              Dynamic listings appear based on location, dates, and work-ready needs.
              Selecting a roost triggers a background search for all services tied to
              that place name.
            </p>
          </div>
        </article>

        <article className={styles.stepCard}>
          <div className={styles.flowIndex}>02</div>
          <div>
            <h3 className={styles.buildTitle}>Build Your Stay</h3>
            <p className={styles.flowCopy}>
              Once a roost is selected, the bundle builder activates with a walkable
              neighborhood view and live service menus.
            </p>
          </div>
          <div className={styles.signalStack}>
            <span>Availability match</span>
            <span>Neighborhood radius</span>
            <span>Service compatibility</span>
          </div>
        </article>

        <article
          className={`${styles.stepCard} ${styles.bundle}`}
          data-testid={testIds.landing.featureMeta}
        >
          <div className={styles.flowIndex}>03</div>
          <div>
            <h3 className={styles.bundleTitle}>The Stay Bundle</h3>
            <p className={styles.flowCopy}>
              A single checkout that consolidates independent providers into one
              timeline and one payment.
            </p>
          </div>
          <div className={styles.bundleGrid}>
            <div data-testid={testIds.landing.metaSecurity}>
              <span className={styles.metaLabel}>Roost</span>
              <span className={styles.metaValue}>Selected stay</span>
            </div>
            <div data-testid={testIds.landing.metaSpeed}>
              <span className={styles.metaLabel}>Services</span>
              <span className={styles.metaValue}>Local add-ons</span>
            </div>
            <div data-testid={testIds.landing.metaData}>
              <span className={styles.metaLabel}>Total</span>
              <span className={styles.metaValue}>One checkout</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
