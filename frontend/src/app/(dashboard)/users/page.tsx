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
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
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
        const data = await apiFetch<User[]>("/users", { token });
        setUsers(data);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [search, users]);

  const deleteUser = async (id: number) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!confirm("Delete this user?")) {
      return;
    }
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE", token });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setToast({ message: "User deleted." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.users.page}>
      <header className={styles.header} data-testid={testIds.users.header}>
        <div>
          <p className={styles.eyebrow} data-testid={testIds.users.eyebrow}>
            Users
          </p>
          <h1 data-testid={testIds.users.title}>User Listing</h1>
        </div>
        <input
          className={styles.search}
          type="search"
          placeholder="Search users"
          data-testid={testIds.users.searchInput}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </header>

      <div className={styles.table} data-testid={testIds.users.table}>
        <div className={styles.rowHeader} data-testid={testIds.users.rowHeader}>
          <span>ID</span>
          <span>Name</span>
          <span>Email</span>
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
              <button
                className={styles.delete}
                type="button"
                data-testid={testIdBuilders.usersDeleteButton(user.id)}
                onClick={() => deleteUser(user.id)}
              >
                Delete
              </button>
            </span>
          </div>
        ))}
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
