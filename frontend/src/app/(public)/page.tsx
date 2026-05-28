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

      <div className={styles.flow} data-testid={testIds.landing.featureCard}>
        <div className={styles.flowHeader}>
          <div className={styles.flowIndex}>01</div>
          <div>
            <h2 data-testid={testIds.landing.featureTitle}>Find Your Next Roost</h2>
            <p className={styles.flowCopy}>
              Dynamic listings appear based on location, dates, and work-ready needs.
              Selecting a roost triggers a background search for all services tied to
              that place name.
            </p>
          </div>
        </div>
        <div className={styles.roostGrid}>
          <button className={styles.roostCard} type="button">
            <div>
              <p className={styles.roostName}>Cedar Hearth House</p>
              <p className={styles.roostMeta}>2 beds · Fibre · Garden studio</p>
            </div>
            <span className={styles.roostStatus}>Selected</span>
          </button>
          <button className={styles.roostCard} type="button">
            <div>
              <p className={styles.roostName}>Riverstone Loft</p>
              <p className={styles.roostMeta}>1 bed · Solar · River walk</p>
            </div>
            <span className={styles.roostPrice}>$152 / night</span>
          </button>
          <button className={styles.roostCard} type="button">
            <div>
              <p className={styles.roostName}>Juniper Courtyard</p>
              <p className={styles.roostMeta}>3 beds · Cowork · Breakfasts</p>
            </div>
            <span className={styles.roostPrice}>$189 / night</span>
          </button>
        </div>

        <div className={styles.flowSplit}>
          <div className={styles.buildCard}>
            <div className={styles.flowIndex}>02</div>
            <h3 className={styles.buildTitle}>Build Your Stay</h3>
            <p className={styles.flowCopy}>
              Once a roost is selected, the bundle builder activates with a walkable
              neighborhood view and live service menus.
            </p>
            <div className={styles.mapShell}>
              <div className={styles.mapCenter}>
                <span className={styles.mapDot} />
              </div>
              <div className={styles.mapRing} />
              <div className={styles.mapPin} data-pin="Cafe" />
              <div className={styles.mapPin} data-pin="Studio" />
              <div className={styles.mapPin} data-pin="Hike" />
            </div>
          </div>

          <div className={styles.menuCard}>
            <h3 className={styles.menuTitle}>Neighborhood Service Menu</h3>
            <p className={styles.flowCopy}>
              Generated in real-time for the selected place name.
            </p>
            <div className={styles.menuSection}>
              <span className={styles.menuLabel}>Localized Dining</span>
              <div className={styles.menuRow}>
                <span>Sunrise Bakery</span>
                <span>Breakfast delivery</span>
              </div>
              <div className={styles.menuRow}>
                <span>Hearth &amp; Clay</span>
                <span>Village supper club</span>
              </div>
            </div>
            <div className={styles.menuSection}>
              <span className={styles.menuLabel}>Local Experiences</span>
              <div className={styles.menuRow}>
                <span>Willow Kayak</span>
                <span>Sunset paddle</span>
              </div>
              <div className={styles.menuRow}>
                <span>Stonecraft Studio</span>
                <span>Clay workshop</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bundle} data-testid={testIds.landing.featureMeta}>
          <div className={styles.bundleHeader}>
            <div className={styles.flowIndex}>03</div>
            <div>
              <h3 className={styles.bundleTitle}>The Stay Bundle</h3>
              <p className={styles.flowCopy}>
                A single checkout that consolidates independent providers into one
                timeline and one payment.
              </p>
            </div>
          </div>
          <div className={styles.bundleGrid}>
            <div data-testid={testIds.landing.metaSecurity}>
              <span className={styles.metaLabel}>Roost</span>
              <span className={styles.metaValue}>Cedar Hearth · 6 nights</span>
            </div>
            <div data-testid={testIds.landing.metaSpeed}>
              <span className={styles.metaLabel}>Services</span>
              <span className={styles.metaValue}>4 artisan sessions</span>
            </div>
            <div data-testid={testIds.landing.metaData}>
              <span className={styles.metaLabel}>Total</span>
              <span className={styles.metaValue}>$1,148 · paid once</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
