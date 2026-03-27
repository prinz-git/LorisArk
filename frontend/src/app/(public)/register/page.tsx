"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { defaultRoleOptions, RoleOption } from "@/lib/roles";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("nomad");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(
    defaultRoleOptions
  );
  const [kycFileName, setKycFileName] = useState("");
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });

  const roleLabel = useMemo(() => {
    return roleOptions.find((option) => option.id === role)?.title ?? "Nomad";
  }, [role, roleOptions]);

  useEffect(() => {
    let mounted = true;
    const loadRoles = async () => {
      try {
        const data = await apiFetch<RoleOption[]>("/roles");
        if (!mounted || !Array.isArray(data) || data.length === 0) {
          return;
        }
        setRoleOptions(data);
        if (!data.find((option) => option.id === role)) {
          setRole(data[0].id);
        }
      } catch {
        // Fall back to defaults if roles cannot be loaded.
      }
    };
    loadRoles();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          full_name: fullName,
          password,
          role,
        }),
      });
      setToast({ message: "Account created. Please log in." });
      setTimeout(() => router.push("/login"), 800);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.register.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <p className={styles.kicker}>LorisArk • Universal Identity</p>
            <h1 data-testid={testIds.register.title}>Create Your Loris ID</h1>
          </div>
          <Link
            href="/login"
            className={styles.headerLink}
            data-testid={testIds.register.backLink}
          >
            Back to Login
          </Link>
        </header>

        <div className={styles.grid}>
          <section className={styles.story}>
            <div className={styles.heroCard}>
              <p className={styles.heroLabel}>Trusted everywhere in the Ark</p>
              <h2>One identity. Three roles. Global access.</h2>
              <p className={styles.heroCopy}>
                Loris ID connects nomads, hosts, and artisans with a shared trust
                graph. Build your reputation once and unlock the villages you
                love.
              </p>
              <div className={styles.trustPanel}>
                <div>
                  <p className={styles.trustTitle}>Trust Score</p>
                  <p className={styles.trustScore}>82</p>
                  <p className={styles.trustHint}>Up from 76 after last stay</p>
                </div>
                <div className={styles.ring}>
                  <span>82%</span>
                </div>
              </div>
              <div className={styles.trustTags}>
                <span>3 Stays</span>
                <span>2 Village Service Hours</span>
                <span>Verified ID</span>
              </div>
            </div>

            <div className={styles.arkCard}>
              <h3>Ark Access Preview</h3>
              <p className={styles.arkCopy}>
                Your profile is portable across villages, with clear verification
                signals for local leaders.
              </p>
              <div className={styles.arkGrid}>
                <div>
                  <p className={styles.arkLabel}>Active Regions</p>
                  <p className={styles.arkValue}>Bavaria • Galicia • Atlas Rim</p>
                </div>
                <div>
                  <p className={styles.arkLabel}>Community Standing</p>
                  <p className={styles.arkValue}>Consistently respectful</p>
                </div>
                <div>
                  <p className={styles.arkLabel}>Skill Signals</p>
                  <p className={styles.arkValue}>Organic farming, Loom repair</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.onboarding}>
            <div className={styles.card} data-testid={testIds.register.card}>
              <div className={styles.cardHeader}>
                <h3>Registration Progress</h3>
                <p>Complete each step to unlock the next.</p>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
              <div className={styles.progressMeta}>
                <span>Step {step} of 3</span>
                <span>{step === 1 ? "Sign Up" : step === 2 ? "Choose Role" : "KYC"}</span>
              </div>
            </div>

            <form
              className={styles.formStack}
              data-testid={testIds.register.form}
              onSubmit={submit}
            >
              {step === 1 && (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>Step 1: Sign Up</h3>
                    <p>Use your preferred method to start your Loris ID.</p>
                  </div>
                  <div className={styles.socialRow}>
                    <button type="button" className={styles.socialButton}>
                      Continue with Google
                    </button>
                    <button type="button" className={styles.socialButton}>
                      Continue with Apple
                    </button>
                  </div>
                  <div className={styles.divider}>
                    <span>or use email</span>
                  </div>
                  <div className={styles.form}>
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
                  </div>
                  <div className={styles.stepActions}>
                    <button
                      className={styles.primary}
                      type="button"
                      onClick={() => {
                        if (!fullName || !email || !password) {
                          setToast({
                            message: "Please complete all fields to continue.",
                            tone: "error",
                          });
                          return;
                        }
                        setStep(2);
                      }}
                    >
                      Continue to Role
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>Step 2: Choose Your Role</h3>
                    <p>Switch anytime later. We personalize your dashboard.</p>
                  </div>
                  <div className={styles.roleGrid}>
                    {roleOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${styles.roleCard} ${
                          role === option.id ? styles.roleActive : ""
                        }`}
                        onClick={() => setRole(option.id)}
                        aria-pressed={role === option.id}
                      >
                        <div className={styles.roleTop}>
                          <span className={styles.roleTitle}>
                            {option.title}
                          </span>
                          <span className={styles.roleTag}>{option.label}</span>
                        </div>
                        <p className={styles.roleCopy}>{option.copy}</p>
                      </button>
                    ))}
                  </div>
                  <div className={styles.roleFooter}>
                    <span className={styles.roleDot} />
                    <p>
                      Dashboard focus: <strong>{roleLabel}</strong>
                    </p>
                  </div>
                  <div className={styles.stepActions}>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </button>
                    <button
                      className={styles.primary}
                      type="button"
                      onClick={() => setStep(3)}
                    >
                      Continue to KYC
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>Step 3: Verification & KYC (Optional)</h3>
                    <p>
                      {role === "nomad"
                        ? "Upload a passport or national ID to build trust with village leaders. You can also do this later."
                        : "Verify your identity to unlock hosting and service tools. You can also do this later."}
                    </p>
                  </div>
                  <div className={styles.uploadBox}>
                    <input
                      id="kyc-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className={styles.uploadInput}
                      onChange={(event) =>
                        setKycFileName(event.target.files?.[0]?.name ?? "")
                      }
                    />
                    <label htmlFor="kyc-upload" className={styles.uploadLabel}>
                      <span>Drop file or browse</span>
                      <span className={styles.uploadHint}>
                        Accepted: JPG, PNG, PDF up to 10MB
                      </span>
                    </label>
                    <div className={styles.uploadMeta}>
                      <span>
                        {kycFileName || "No document uploaded yet."}
                      </span>
                      <span className={styles.uploadStatus}>
                        Encrypted storage
                      </span>
                    </div>
                  </div>
                  <div className={styles.kycFooter}>
                    <p>Verification typically completes within 24 hours.</p>
                    <button type="button" className={styles.secondaryButton}>
                      Learn about our Trust Score
                    </button>
                  </div>
                  <div className={styles.stepActions}>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </button>
                    <button className={styles.secondaryButton} type="submit">
                      Skip for now
                    </button>
                    <div className={styles.approvalBlock}>
                      <div className={styles.logoSeal}>
                        <Image
                          src="/LorisArklogoCircle.svg"
                          alt="LorisArk approved"
                          width={58}
                          height={58}
                          className={styles.logoImage}
                        />
                      </div>
                      <div className={styles.approvalMeta}>
                        <span className={styles.approvalBadge}>Approved</span>
                        <span className={styles.approvalHint}>
                          Only verified profiles can use services.
                        </span>
                      </div>
                      <button
                        className={styles.primary}
                        type="submit"
                        data-testid={testIds.register.submitButton}
                      >
                        Create Loris ID
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </section>
        </div>
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
