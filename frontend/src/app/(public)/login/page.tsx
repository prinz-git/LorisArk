"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
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
      const profile = await apiFetch<{ role: "nomad" | "host" | "artisan" }>(
        "/profile",
        {
          token: data.access_token,
        }
      );
      if (profile.role === "nomad") {
        router.push("/inventory");
        return;
      }
      router.push("/dashboard");
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.login.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.story}>
          <p className={styles.kicker}>Welcome Back to LorisArk</p>
          <h1 data-testid={testIds.login.title}>
            Return to your village community.
          </h1>
          <p className={styles.subtitle}>
            Manage hospitality operations, align with your hosts, and keep every
            stay rooted in local culture and community-led profits.
          </p>
          <div className={styles.storyCard}>
            <div>
              <p className={styles.storyLabel}>Today&apos;s Snapshot</p>
              <p className={styles.storyValue}>12 families hosting this week</p>
            </div>
            <div>
              <p className={styles.storyLabel}>Guest Satisfaction</p>
              <p className={styles.storyValue}>4.9 ★ average</p>
            </div>
          </div>
        </div>

        <div className={styles.card} data-testid={testIds.login.card}>
          <div className={styles.alert}>
            <strong>Verification required for services.</strong>
            <span>
              You can log in now, but only approved profiles can host or book
              stays. Complete KYC after login to unlock access.
            </span>
          </div>
          <div className={styles.logoRow}>
            <Image
              src="/LorisArklogoLetters.svg"
              alt="LorisArk logo"
              width={180}
              height={44}
              className={styles.logoImage}
            />
            <div>
              <p className={styles.logoTitle}>LorisArk</p>
              <p className={styles.logoSubtitle}>Village Hospitality Network</p>
            </div>
          </div>
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
              Enter the Ark
            </button>
          </form>
          <div className={styles.meta} data-testid={testIds.login.meta}>
            <Link
              href="/register"
              className={styles.secondary}
              data-testid={testIds.login.registerLink}
            >
              Join the Community
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
