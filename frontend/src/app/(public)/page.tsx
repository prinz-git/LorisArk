import Image from "next/image";
import Link from "next/link";
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
          Turn villages into distributed boutique resorts.
        </h1>
        <p className={styles.subtitle}>
          We provide the technology that lets independent rural families
          collaborate, host global travelers, and keep 100% of the tourism
          profits within their own community.
        </p>
        <p className={styles.description}>
          On LorisArk, you are joining a supported community. It&apos;s the
          difference between staying in a house and becoming part of the
          village for a few weeks, with the infrastructure of a 5-star hotel
          behind you.
        </p>
        <div className={styles.tagRow}>
          <span className={styles.tag}>Community-owned revenue</span>
          <span className={styles.tag}>Shared hospitality playbooks</span>
          <span className={styles.tag}>Trust-ready identity</span>
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
      <div className={styles.card} data-testid={testIds.landing.featureCard}>
        <Image
          src="/LorisArklogoCircle.svg"
          alt="LorisArk mark"
          width={180}
          height={180}
          className={styles.cardMark}
        />
        <h2 data-testid={testIds.landing.featureTitle}>
          The Village Hospitality Stack
        </h2>
        <p className={styles.cardCopy}>
          LorisArk turns households into boutique suites, powered by shared
          operations, concierge-grade services, and a cooperative calendar that
          works for every family.
        </p>
        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <span className={styles.featureTitle}>Guest Experience</span>
            <span>Unified service standards, local storytelling, premium touchpoints.</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureTitle}>Host Enablement</span>
            <span>Dynamic pricing, shared logistics, and village-wide staffing.</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureTitle}>Community Equity</span>
            <span>100% local revenue, transparent payouts, shared growth funds.</span>
          </div>
        </div>
        <div className={styles.cardMeta} data-testid={testIds.landing.featureMeta}>
          <div data-testid={testIds.landing.metaSecurity}>
            <span className={styles.metaLabel}>Hospitality</span>
            <span className={styles.metaValue}>5-star infrastructure</span>
          </div>
          <div data-testid={testIds.landing.metaSpeed}>
            <span className={styles.metaLabel}>Community</span>
            <span className={styles.metaValue}>100% local profit</span>
          </div>
          <div data-testid={testIds.landing.metaData}>
            <span className={styles.metaLabel}>Experience</span>
            <span className={styles.metaValue}>Stay like a villager</span>
          </div>
        </div>
      </div>
    </section>
  );
}
