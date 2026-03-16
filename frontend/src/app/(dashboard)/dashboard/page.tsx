"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import styles from "./page.module.css";

type Profile = {
  email: string;
  full_name: string;
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
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1>Hello, {profile?.full_name || ""}</h1>
        </div>
        <span className={styles.status}>Active session</span>
      </header>

      <section className={styles.cards}>
        <div className={styles.card}>
          <h3>Total Users</h3>
          <p className={styles.metric}>{users.length}</p>
          <p className={styles.muted}>Tracked in real time</p>
        </div>
        <div className={styles.card}>
          <h3>Recent Activity</h3>
          <p className={styles.muted}>Live data pulled from the API.</p>
          <Link href="/users" className={styles.linkButton}>
            View Users
          </Link>
        </div>
        <div className={styles.card}>
          <h3>Profile Health</h3>
          <p className={styles.muted}>Keep your details up to date.</p>
          <Link href="/profile" className={styles.linkButton}>
            Update Profile
          </Link>
        </div>
      </section>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
      />
    </div>
  );
}
