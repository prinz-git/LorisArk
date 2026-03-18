"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const data = await apiFetch<{ access_token: string }>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      router.push("/dashboard");
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.wrap} data-testid={testIds.login.page}>
      <div className={styles.card} data-testid={testIds.login.card}>
        <h1 data-testid={testIds.login.title}>Login</h1>
        <p className={styles.subtitle}>Access your management workspace.</p>
        <form
          className={styles.form}
          data-testid={testIds.login.form}
          onSubmit={submit}
        >
          <label className={styles.label}>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              data-testid={testIds.login.emailInput}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              type="password"
              placeholder="••••••••"
              data-testid={testIds.login.passwordInput}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            className={styles.primary}
            type="submit"
            data-testid={testIds.login.submitButton}
          >
            Login
          </button>
        </form>
        <div className={styles.meta} data-testid={testIds.login.meta}>
          <Link
            href="/register"
            className={styles.secondary}
            data-testid={testIds.login.registerLink}
          >
            Register
          </Link>
          <button
            className={styles.textButton}
            type="button"
            data-testid={testIds.login.forgotButton}
          >
            Forgot password
          </button>
        </div>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.login.toast}
      />
    </div>
  );
}
