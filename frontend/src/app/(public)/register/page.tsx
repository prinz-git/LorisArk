"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
        }),
      });
      setToast({ message: "Account created. Please log in." });
      setTimeout(() => router.push("/login"), 800);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Create Account</h1>
        <p className={styles.subtitle}>Start managing users in minutes.</p>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label}>
            Full Name
            <input
              type="text"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className={styles.primary} type="submit">
            Register
          </button>
        </form>
        <Link href="/login" className={styles.textButton}>
          Back to Login
        </Link>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
      />
    </div>
  );
}
