"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { setToken } from "@/lib/auth";
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
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Login</h1>
        <p className={styles.subtitle}>Access your management workspace.</p>
        <form className={styles.form} onSubmit={submit}>
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
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className={styles.primary} type="submit">
            Login
          </button>
        </form>
        <div className={styles.meta}>
          <Link href="/register" className={styles.secondary}>
            Register
          </Link>
          <button className={styles.textButton} type="button">
            Forgot password
          </button>
        </div>
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
      />
    </div>
  );
}
