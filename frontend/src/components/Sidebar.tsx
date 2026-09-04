"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import styles from "./Sidebar.module.css";

const baseNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/profile" },
  { label: "Users", href: "/users" },
  { label: "Logout", href: "/logout" },
];

type Profile = {
  role: "nomad" | "host" | "artisan" | "superadmin";
};

type SidebarProps = {
  isOpen?: boolean;
};

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<Profile["role"] | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }

    const load = async () => {
      try {
        const profile = await apiFetch<Profile>("/profile", { token });
        setRole(profile.role);
      } catch {
        setRole(null);
      }
    };

    load();
  }, []);

  const navItems = useMemo(() => {
    if (role === "nomad") {
      return [
        { label: "Home", href: "/inventory" },
        { label: "My Bookings", href: "/bookings" },
        { label: "Profile", href: "/profile" },
        { label: "Logout", href: "/logout" },
      ];
    }
    if (role === "host") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Roosts", href: "/roosts" },
        { label: "Profile", href: "/profile" },
        { label: "Logout", href: "/logout" },
      ];
    }
    if (role === "artisan") {
      return [
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Roots", href: "/roots" },
        { label: "Profile", href: "/profile" },
        { label: "Logout", href: "/logout" },
      ];
    }
    if (role === "superadmin") {
      return [
        { label: "Users", href: "/users" },
        { label: "Roosts", href: "/roosts" },
        { label: "Roots", href: "/roots" },
        { label: "Bookings", href: "/bookings" },
        { label: "Profile", href: "/profile" },
        { label: "Logout", href: "/logout" },
      ];
    }
    return baseNavItems;
  }, [role]);

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.brand}>
        <div className={styles.logoWrap}>
          <Image
            src="/LorisArklogoCircle.svg"
            alt="LorisArk logo"
            width={64}
            height={64}
            priority
            className={styles.logo}
          />
        </div>
        <div className={styles.brandText}>
          <span>LorisArk</span>
          <span className={styles.brandTag}>Village Ops</span>
        </div>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
