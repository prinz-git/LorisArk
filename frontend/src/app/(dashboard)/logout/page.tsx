"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearToken } from "@/lib/auth";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

export default function LogoutPage() {
  useEffect(() => {
    clearToken();
  }, []);

  return (
    <div className={styles.page} data-testid={testIds.logout.page}>
      <div className={styles.card} data-testid={testIds.logout.card}>
        <h1 data-testid={testIds.logout.title}>Session Expired</h1>
        <p className={styles.subtitle}>
          You have been logged out. Please sign in again.
        </p>
        <div className={styles.actions} data-testid={testIds.logout.actions}>
          <Link
            href="/login"
            className={styles.primary}
            data-testid={testIds.logout.loginLink}
          >
            Login
          </Link>
          <Link
            href="/"
            className={styles.secondary}
            data-testid={testIds.logout.homeLink}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
