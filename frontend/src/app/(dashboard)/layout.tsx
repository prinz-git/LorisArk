"use client";

import { useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div
      className={`${styles.shell} ${
        isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
      }`}
    >
      <Sidebar isOpen={isSidebarOpen} />
      {!isSidebarOpen && (
        <button
          type="button"
          className={styles.sidebarLauncher}
          aria-label="Open sidebar"
          onClick={() => setIsSidebarOpen(true)}
        >
          <span className={styles.launcherIcon} aria-hidden="true">
            ▸
          </span>
          <span className={styles.launcherText}>Menu</span>
        </button>
      )}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <Image
              src="/LorisArklogoLong.svg"
              alt="LorisArk"
              width={180}
              height={48}
              className={styles.topbarLogo}
              priority
            />
            <span className={styles.topbarText}>Dashboard</span>
          </div>
        </div>
        {children}
      </main>
      <button
        type="button"
        className={`${styles.scrim} ${isSidebarOpen ? styles.scrimVisible : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Close sidebar"
      />
    </div>
  );
}
