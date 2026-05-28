"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { testIds } from "@/lib/testids";
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
      setToast({ message: "Member updated." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.editUser.page}>
      <div className={styles.card} data-testid={testIds.editUser.card}>
        <h1 data-testid={testIds.editUser.title}>Edit Member</h1>
        <p className={styles.subtitle}>Update member details with community access.</p>
        <form
          className={styles.form}
          data-testid={testIds.editUser.form}
          onSubmit={(event) => event.preventDefault()}
        >
          <label className={styles.label}>
            Full Name
            <input
              type="text"
              data-testid={testIds.editUser.fullnameInput}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              data-testid={testIds.editUser.emailInput}
              value={user?.email || ""}
              readOnly
            />
          </label>
          <div className={styles.actions} data-testid={testIds.editUser.actions}>
            <button
              className={styles.primary}
              type="button"
              data-testid={testIds.editUser.saveButton}
              onClick={save}
            >
              Save Changes
            </button>
            <Link
              href="/users"
              className={styles.textButton}
              data-testid={testIds.editUser.backLink}
            >
              Back
            </Link>
          </div>
        </form>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.editUser.toast}
      />
    </div>
  );
}
