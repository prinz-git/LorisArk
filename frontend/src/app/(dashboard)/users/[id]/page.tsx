"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import styles from "./page.module.css";

type User = {
  id: number;
  email: string;
  full_name: string;
};

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
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
        const users = await apiFetch<User[]>("/users", { token });
        const match = users.find((item) => item.id === userId) || null;
        setUser(match);
        setFullName(match?.full_name || "");
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router, userId]);

  const save = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      await apiFetch(`/users/${userId}?full_name=${encodeURIComponent(fullName)}`, {
        method: "PUT",
        token,
        headers: {},
      });
      setToast({ message: "User updated." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Edit User</h1>
        <p className={styles.subtitle}>Update user details with admin access.</p>
        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          <label className={styles.label}>
            Full Name
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label className={styles.label}>
            Email
            <input type="email" value={user?.email || ""} readOnly />
          </label>
          <div className={styles.actions}>
            <button className={styles.primary} type="button" onClick={save}>
              Save Changes
            </button>
            <Link href="/users" className={styles.textButton}>
              Back
            </Link>
          </div>
        </form>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
      />
    </div>
  );
}
