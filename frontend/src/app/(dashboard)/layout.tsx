"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeUpcomingCount, setActiveUpcomingCount] = useState(0);
  const [isNomad, setIsNomad] = useState(false);

  const pageTitle = (() => {
    if (pathname.startsWith("/inventory")) return "Home";
    if (pathname.startsWith("/bookings")) return "My Bookings";
    if (pathname.startsWith("/profile")) return "Profile";
    if (pathname.startsWith("/users")) return "Users";
    if (pathname.startsWith("/logout")) return "Logout";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    return "Dashboard";
  })();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const load = async () => {
      try {
        const profile = await apiFetch<{ role: string }>("/profile", { token });
        const nomad = profile.role === "nomad";
        setIsNomad(nomad);
        if (!nomad) return;
        const bookings = await apiFetch<{ active_upcoming: unknown[] }>("/nomad/bookings", {
          token,
        });
        setActiveUpcomingCount(bookings.active_upcoming.length);
      } catch {
        setIsNomad(false);
        setActiveUpcomingCount(0);
      }
    };

    load();
  }, []);

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
            <span className={styles.topbarText}>{pageTitle}</span>
          </div>
          {isNomad && (
            <Link href="/bookings" className={styles.calendarLink} aria-label="My bookings">
              <span className={styles.calendarIcon} aria-hidden="true">
                📅
              </span>
              <span className={styles.calendarLabel}>Bookings</span>
              <span className={styles.calendarBadge}>{activeUpcomingCount}</span>
            </Link>
          )}
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
