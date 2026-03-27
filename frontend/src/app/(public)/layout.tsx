import Image from "next/image";
import PublicHeader from "@/components/PublicHeader";
import styles from "./layout.module.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <PublicHeader />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <Image
            src="/LorisArklogoLetters.svg"
            alt="LorisArk logo"
            width={170}
            height={40}
          />
          <span>Village Hospitality Network</span>
        </div>
        <span>Privacy Policy</span>
        <span>Contact</span>
        <span>About</span>
      </footer>
    </div>
  );
}
