"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

type Profile = {
  email: string;
  full_name: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
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
        const data = await apiFetch<Profile>("/profile", { token });
        setProfile(data);
        setFullName(data.full_name);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router]);

  const save = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const params = new URLSearchParams();
    params.set("full_name", fullName);
    if (password) {
      params.set("password", password);
    }

    try {
      await apiFetch(`/profile?${params.toString()}`, {
        method: "PUT",
        token,
        headers: {},
      });
      setPassword("");
      setToast({ message: "Profile updated." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const deleteAccount = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!confirm("Delete your account permanently?")) {
      return;
    }
    try {
      await apiFetch("/profile", { method: "DELETE", token });
      clearToken();
      router.push("/");
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.profile.page}>
      <div className={styles.card} data-testid={testIds.profile.card}>
        <h1 data-testid={testIds.profile.title}>Edit Profile</h1>
        <p className={styles.subtitle}>Keep your profile details current.</p>
        <form
          className={styles.form}
          data-testid={testIds.profile.form}
          onSubmit={(event) => event.preventDefault()}
        >
          <label className={styles.label}>
            Full Name
            <input
              type="text"
              data-testid={testIds.profile.fullnameInput}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              data-testid={testIds.profile.emailInput}
              value={profile?.email || ""}
              readOnly
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              type="password"
              placeholder="Optional update"
              data-testid={testIds.profile.passwordInput}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div className={styles.actions} data-testid={testIds.profile.actions}>
            <button
              className={styles.primary}
              type="button"
              data-testid={testIds.profile.saveButton}
              onClick={save}
            >
              Save Changes
            </button>
            <button
              className={styles.danger}
              type="button"
              data-testid={testIds.profile.deleteButton}
              onClick={deleteAccount}
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.profile.toast}
      />
    </div>
  );
}
