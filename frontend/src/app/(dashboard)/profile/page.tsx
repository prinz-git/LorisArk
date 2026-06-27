"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { defaultRoleOptions, RoleOption } from "@/lib/roles";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

type Profile = {
  email: string;
  full_name: string;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("nomad");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(
    defaultRoleOptions
  );
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
        const profileData = await apiFetch<Profile>("/profile", { token });
        setProfile(profileData);
        setFullName(profileData.full_name);
        setRole(profileData.role || "nomad");

        try {
          const rolesData = await apiFetch<RoleOption[]>("/roles");
          if (rolesData && rolesData.length > 0) {
            setRoleOptions(rolesData);
            const nextRole =
              rolesData.find((option) => option.id === profileData.role)?.id ??
              rolesData[0].id;
            setRole(nextRole);
          }
        } catch {
          // Keep defaults when roles cannot be loaded.
        }
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
    if (role) {
      params.set("role", role);
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
        <div className={styles.hero}>
          <div className={styles.avatarWrap}>
            <Image
              src="/LorisArklogo.svg"
              alt="Default profile avatar"
              width={120}
              height={120}
              className={styles.avatar}
              priority
            />
            <span className={styles.avatarRing} aria-hidden="true" />
          </div>
          <div>
            <p className={styles.kicker}>Profile</p>
            <h1 data-testid={testIds.profile.title}>
              {profile?.full_name || "Your Profile"}
            </h1>
          </div>
        </div>
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
          <label className={styles.label}>
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              data-testid={testIds.profile.roleSelect}
            >
              {roleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title} • {option.label}
                </option>
              ))}
            </select>
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
