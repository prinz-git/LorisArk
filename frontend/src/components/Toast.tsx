"use client";

import { useEffect } from "react";
import styles from "./Toast.module.css";

type ToastProps = {
  message: string | null;
  tone?: "success" | "error";
  onClear: () => void;
};

export default function Toast({ message, tone = "success", onClear }: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(() => onClear(), 2800);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={`${styles.toast} ${tone === "error" ? styles.error : ""}`}
      role="status"
    >
      {message}
    </div>
  );
}
