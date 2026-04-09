"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventory", href: "/inventory" },
  { label: "Profile", href: "/profile" },
  { label: "Users", href: "/users" },
  { label: "Logout", href: "/logout" },
];

type SidebarProps = {
  isOpen?: boolean;
};

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname();

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
