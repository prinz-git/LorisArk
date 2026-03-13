import Image from "next/image";
import Link from "next/link";
import styles from "./PublicHeader.module.css";

export default function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/LorisArklogo.png?v=20260313"
          alt="LorisArk logo"
          width={44}
          height={44}
          priority
          unoptimized
        />
        <span>LorisArk</span>
      </Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.link}>
          Home
        </Link>
        <Link href="/login" className={styles.link}>
          Login
        </Link>
        <Link href="/register" className={styles.link}>
          Register
        </Link>
      </nav>
    </header>
  );
}
