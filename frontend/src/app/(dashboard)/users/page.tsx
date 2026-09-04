"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { testIdBuilders, testIds } from "@/lib/testids";
import styles from "./page.module.css";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: "nomad" | "host" | "artisan" | "superadmin";
};

type Profile = {
  role: "nomad" | "host" | "artisan" | "superadmin";
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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
        const profile = await apiFetch<Profile>("/profile", { token });
        if (profile.role !== "superadmin") {
          router.replace("/dashboard");
          return;
        }
        const data = await apiFetch<User[]>("/users", { token });
        setUsers(data);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(
      (user) => {
        const matchesSearch =
          !query ||
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
      }
    );
  }, [roleFilter, search, users]);

  const roleOptions = useMemo(
    () => Array.from(new Set(users.map((user) => user.role))).sort(),
    [users]
  );

  const formatRole = (value: string) =>
    value === "superadmin" ? "Super Admin" : value.charAt(0).toUpperCase() + value.slice(1);

  const deleteUser = async (id: number) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!confirm("Delete this member?")) {
      return;
    }
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE", token });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setToast({ message: "Member deleted." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.users.page}>
      <header className={styles.header} data-testid={testIds.users.header}>
        <div>
          <p className={styles.eyebrow} data-testid={testIds.users.eyebrow}>
            Community
          </p>
          <h1 data-testid={testIds.users.title}>Member Directory</h1>
        </div>
        <div className={styles.controls}>
          <input
            className={styles.search}
            type="search"
            placeholder="Search name, email, or role"
            data-testid={testIds.users.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={styles.filter}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter members by role"
          >
            <option value="all">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {formatRole(role)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.table} data-testid={testIds.users.table}>
        <div className={styles.rowHeader} data-testid={testIds.users.rowHeader}>
          <span>ID</span>
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Actions</span>
        </div>
        {filtered.map((user, index) => (
          <div
            key={user.id}
            className={`${styles.row} ${index % 2 === 0 ? styles.rowAlt : ""}`}
            data-testid={testIdBuilders.usersRow(user.id)}
          >
            <span data-testid={testIdBuilders.usersRowId(user.id)}>{user.id}</span>
            <span data-testid={testIdBuilders.usersRowName(user.id)}>
              {user.full_name}
            </span>
            <span data-testid={testIdBuilders.usersRowEmail(user.id)}>
              {user.email}
            </span>
            <span>
              <span className={styles.roleBadge}>{formatRole(user.role)}</span>
            </span>
            <span
              className={styles.actions}
              data-testid={testIdBuilders.usersRowActions(user.id)}
            >
              <Link
                href={`/users/${user.id}`}
                className={styles.edit}
                data-testid={testIdBuilders.usersEditLink(user.id)}
              >
                Edit
              </Link>
              {user.role !== "superadmin" && (
                <button
                  className={styles.delete}
                  type="button"
                  data-testid={testIdBuilders.usersDeleteButton(user.id)}
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </button>
              )}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>No members match your search.</div>
        )}
      </div>
      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.users.toast}
      />
    </div>
  );
}
