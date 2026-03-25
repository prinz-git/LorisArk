"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { testIds } from "@/lib/testids";
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
    <div className={styles.wrap} data-testid={testIds.register.page}>
      <div className={styles.card} data-testid={testIds.register.card}>
        <h1 data-testid={testIds.register.title}>Create Account</h1>
        <p className={styles.subtitle}>Start managing users in minutes.</p>
        <form
          className={styles.form}
          data-testid={testIds.register.form}
          onSubmit={submit}
        >
          <label className={styles.label}>
            Full Name
            <input
              type="text"
              placeholder="Alex Morgan"
              data-testid={testIds.register.fullnameInput}
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
              data-testid={testIds.register.emailInput}
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
              data-testid={testIds.register.passwordInput}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            className={styles.primary}
            type="submit"
            data-testid={testIds.register.submitButton}
          >
            Register
          </button>
        </form>
        <Link
          href="/login"
          className={styles.textButton}
          data-testid={testIds.register.backLink}
        >
          Back to Login
        </Link>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.register.toast}
      />
    </div>
  );
}
