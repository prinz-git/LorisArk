"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearToken } from "@/lib/auth";
import styles from "./page.module.css";

export default function LogoutPage() {
  useEffect(() => {
    clearToken();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Session Expired</h1>
        <p className={styles.subtitle}>
          You have been logged out. Please sign in again.
        </p>
        <div className={styles.actions}>
          <Link href="/login" className={styles.primary}>
            Login
          </Link>
          <Link href="/" className={styles.secondary}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
