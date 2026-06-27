import Image from "next/image";
import Link from "next/link";
import { footerLinkGroups } from "@/lib/footer-pages";
import styles from "./PublicFooter.module.css";

export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/LorisArklogoCircle.svg"
            alt="LorisArk emblem"
            width={64}
            height={64}
            className={styles.emblem}
          />
          <div>
            <p className={styles.brandName}>LorisArk</p>
            <p className={styles.tagline}>Secure the Roost. Sync with the Roots.</p>
          </div>
        </div>

        <div className={styles.linkGrid}>
          {footerLinkGroups.map((group) => (
            <nav key={group.title} className={styles.group} aria-label={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className={styles.disclaimer}>
          <p>
            Disclaimer: LorisArk operates exclusively as a peer-to-peer decentralized
            community marketplace. Accommodation listings, artisan workshops, and
            wilderness excursions are hosted, maintained, and operated directly by
            independent local creators. Booking agreements are finalized securely via
            LorisArk Pay Escrow logic to protect mutual local stakeholders.
          </p>
        </div>

        <div className={styles.bottomBar}>
          <span>© 2026 LorisArk. Forge your own path.</span>
          <span className={styles.status}>
            <span className={styles.dot} aria-hidden="true" />
            System Status: Operational
          </span>
        </div>
      </div>
    </footer>
  );
}
