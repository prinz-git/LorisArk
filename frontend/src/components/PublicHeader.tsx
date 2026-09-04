"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./PublicHeader.module.css";

export default function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.compact : ""}`}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/LorisArklogoLong.svg"
          alt="LorisArk logo"
          width={200}
          height={44}
          priority
          className={styles.logoImage}
        />
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
