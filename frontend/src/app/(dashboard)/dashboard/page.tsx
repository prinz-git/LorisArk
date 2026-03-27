"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { defaultRoleOptions } from "@/lib/roles";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

type Profile = {
  email: string;
  full_name: string;
  role: string;
};

type User = {
  id: number;
  email: string;
  full_name: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });

  const roleOption = defaultRoleOptions.find((option) => option.id === profile?.role);
  const roleTitle = roleOption?.title || profile?.role || "";
  const roleLabel = roleOption?.label || "Role";
  const roleIcon = roleTitle ? roleTitle.slice(0, 1).toUpperCase() : "";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        const [profileData, usersData] = await Promise.all([
          apiFetch<Profile>("/profile", { token }),
          apiFetch<User[]>("/users", { token }),
        ]);
        setProfile(profileData);
        setUsers(usersData);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router]);

  return (
    <div className={styles.page} data-testid={testIds.dashboard.page}>
      <header className={styles.header} data-testid={testIds.dashboard.header}>
        <div>
          <p className={styles.eyebrow} data-testid={testIds.dashboard.eyebrow}>
            Dashboard
          </p>
          <div className={styles.greetingRow}>
            <h1 data-testid={testIds.dashboard.greeting}>
              Hello, {profile?.full_name || ""}
            </h1>
            {profile?.role && (
              <span
                className={styles.roleBadge}
                data-testid={testIds.dashboard.roleBadge}
              >
                <span className={styles.roleIcon} aria-hidden="true">
                  {roleIcon}
                </span>
                <span className={styles.roleText}>
                  <span className={styles.roleTitle}>
                    {roleTitle.charAt(0).toUpperCase() + roleTitle.slice(1)}
                  </span>
                  <span className={styles.roleTag}>{roleLabel}</span>
                </span>
              </span>
            )}
          </div>
        </div>
        <span className={styles.status} data-testid={testIds.dashboard.status}>
          Active session
        </span>
      </header>

      <section className={styles.cards} data-testid={testIds.dashboard.cards}>
        <div className={styles.card} data-testid={testIds.dashboard.cardUsers}>
          <div className={styles.cardHeader}>
            <h3>Total Users</h3>
            <Image
              src="/LorisArklogoCircle.svg"
              alt="LorisArk mark"
              width={36}
              height={36}
              className={styles.cardLogo}
            />
          </div>
          <p className={styles.metric} data-testid={testIds.dashboard.usersCount}>
            {users.length}
          </p>
          <p className={styles.muted}>Tracked in real time</p>
        </div>
        <div className={styles.card} data-testid={testIds.dashboard.cardActivity}>
          <div className={styles.cardHeader}>
            <h3>Recent Activity</h3>
            <Image
              src="/LorisArklogoLetters.svg"
              alt="LorisArk letters"
              width={36}
              height={36}
              className={styles.cardLogo}
            />
          </div>
          <p className={styles.muted}>Live data pulled from the API.</p>
          <Link
            href="/users"
            className={styles.linkButton}
            data-testid={testIds.dashboard.viewUsersLink}
          >
            View Users
          </Link>
        </div>
        <div className={styles.card} data-testid={testIds.dashboard.cardProfile}>
          <div className={styles.cardHeader}>
            <h3>Profile Health</h3>
            <Image
              src="/LorisArklogo.svg"
              alt="LorisArk logo"
              width={36}
              height={36}
              className={styles.cardLogo}
            />
          </div>
          <p className={styles.muted}>Keep your details up to date.</p>
          <Link
            href="/profile"
            className={styles.linkButton}
            data-testid={testIds.dashboard.updateProfileLink}
          >
            Update Profile
          </Link>
        </div>
      </section>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.dashboard.toast}
      />
    </div>
  );
}
