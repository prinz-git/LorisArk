"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { defaultRoleOptions } from "@/lib/roles";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

type Profile = {
  email: string;
  full_name: string;
  role: "nomad" | "host" | "artisan";
};

type Root = {
  id: number;
  service_category: string;
  service_description: string;
  service_capacity: number;
  service_window_start?: string | null;
  base_price: number | null;
  place_name: string | null;
};

type ServiceFormState = {
  name: string;
  category: string;
  price: string;
  dailyLimit: string;
  location: string;
  time: string;
};

const defaultServiceForm: ServiceFormState = {
  name: "",
  category: "Food",
  price: "",
  dailyLimit: "",
  location: "",
  time: "08:00",
};

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 17.2V20h2.8l8.4-8.4-2.8-2.8L4 17.2zm13.7-8.3a.8.8 0 0 0 0-1.1l-1.5-1.5a.8.8 0 0 0-1.1 0l-1.2 1.2 2.8 2.8 1-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 6V4h8v2h4v2H4V6h4zm1 4h2v8H9v-8zm4 0h2v8h-2v-8zM6 8h12l-1 12H7L6 8z"
        fill="currentColor"
      />
    </svg>
  );
}

function toPrettyTime(value: string | null | undefined): string {
  if (!value) return "Anytime";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function RootsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Root[]>([]);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({ message: "" });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(defaultServiceForm);

  const roleOption = defaultRoleOptions.find((option) => option.id === profile?.role);
  const roleTitle = roleOption?.title || profile?.role || "";
  const roleLabel = roleOption?.label || "Role";

  const refreshServices = async (token: string) => {
    const data = await apiFetch<Root[]>("/roots/mine", { token });
    setServices(data);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const profileData = await apiFetch<Profile>("/profile", { token });
        setProfile(profileData);

        if (profileData.role !== "artisan") {
          router.replace(profileData.role === "nomad" ? "/inventory" : "/dashboard");
          return;
        }

        await refreshServices(token);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleEditService = (service: Root) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.service_description,
      category: service.service_category,
      price: String(service.base_price ?? ""),
      dailyLimit: String(service.service_capacity ?? ""),
      location: service.place_name || "",
      time: service.service_window_start || "08:00",
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!window.confirm("Delete this service? It will be marked deleted and hidden.")) {
      return;
    }
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setBusyId(serviceId);
      await apiFetch<{ message: string }>(`/roots/${serviceId}`, {
        method: "DELETE",
        token,
      });
      await refreshServices(token);
      setToast({ message: "Service deleted." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const submitService = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const endpoint = editingServiceId ? `/roots/${editingServiceId}` : "/roots";
      const method = editingServiceId ? "PUT" : "POST";
      await apiFetch<Root>(endpoint, {
        method,
        token,
        body: JSON.stringify({
          service_description: serviceForm.name,
          service_category: serviceForm.category,
          service_capacity: Number(serviceForm.dailyLimit),
          base_price: Number(serviceForm.price),
          place_name: serviceForm.location,
          service_window_start: serviceForm.time,
          service_window_end: null,
          is_active: true,
        }),
      });
      await refreshServices(token);
      setServiceForm(defaultServiceForm);
      setEditingServiceId(null);
      setShowServiceModal(false);
      setToast({ message: editingServiceId ? "Service updated." : "Service created." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.dashboard.page}>
      <header className={styles.header} data-testid={testIds.dashboard.header}>
        <div>
          <p className={styles.eyebrow} data-testid={testIds.dashboard.eyebrow}>
            My Roots
          </p>
          <h1 data-testid={testIds.dashboard.greeting}>
            {loading ? "Loading..." : "Manage Your Roots"}
          </h1>
          {profile?.role && (
            <p className={styles.roleBadge} data-testid={testIds.dashboard.roleBadge}>
              {roleTitle} · {roleLabel}
            </p>
          )}
        </div>
        <span className={styles.status} data-testid={testIds.dashboard.status}>
          Active session
        </span>
      </header>

      {profile?.role === "artisan" && (
        <section className={styles.surface} data-testid={testIds.dashboard.cards}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>My Roots</h2>
              <p className={styles.muted}>Manage local experiences, service capacity, pricing, and timing.</p>
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                setEditingServiceId(null);
                setServiceForm(defaultServiceForm);
                setShowServiceModal(true);
              }}
            >
              + Add Root
            </button>
          </div>

          {services.length === 0 ? (
            <p className={styles.empty}>No roots yet. Add your first experience.</p>
          ) : (
            <div className={styles.stack}>
              {services.map((service) => (
                <article key={service.id} className={styles.card}>
                  <div>
                    <h3>{service.service_description}</h3>
                    <p className={styles.muted}>{service.service_category}</p>
                    <p className={styles.muted}>
                      ${service.base_price ?? 0} · Daily limit {service.service_capacity}
                    </p>
                    <p className={styles.muted}>
                      {service.place_name || "Location pending"} · {toPrettyTime(service.service_window_start)}
                    </p>
                  </div>
                  <div className={styles.iconActions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Edit root"
                      disabled={busyId === service.id}
                      onClick={() => handleEditService(service)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Delete root"
                      disabled={busyId === service.id}
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {showServiceModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{editingServiceId ? "Edit Root" : "Add Root"}</h3>

            <label className={styles.field}>
              What (Service Name)
              <input
                type="text"
                required
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Category
              <input
                type="text"
                required
                value={serviceForm.category}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, category: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              How Much (Price)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, price: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Daily Limit
              <input
                type="number"
                min="1"
                required
                value={serviceForm.dailyLimit}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, dailyLimit: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Where (Place Name)
              <input
                type="text"
                required
                value={serviceForm.location}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, location: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Preferred Time
              <input
                type="time"
                value={serviceForm.time}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, time: event.target.value }))
                }
              />
            </label>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => setShowServiceModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={submitService}
                disabled={
                  !serviceForm.name ||
                  !serviceForm.category ||
                  !serviceForm.price ||
                  !serviceForm.dailyLimit ||
                  !serviceForm.location
                }
              >
                {editingServiceId ? "Update Root" : "Save Root"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.dashboard.toast}
      />
    </div>
  );
}
