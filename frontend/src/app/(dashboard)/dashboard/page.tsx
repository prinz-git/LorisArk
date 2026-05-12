"use client";

import { useEffect, useMemo, useState } from "react";
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

type AvailabilityRange = {
  start_date: string;
  end_date: string;
};

type Roost = {
  id: number;
  title: string;
  place_name: string | null;
  nightly_rate: number | null;
  wifi_speed_mbps: number;
  wifi_active: boolean;
  availability_ranges: AvailabilityRange[] | null;
};

type HostStaySummary = {
  bundle_id: number;
  nomad_name: string | null;
  roost_id: number;
  roost_title: string | null;
  start_date: string;
  end_date: string;
  services: string[];
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

type ArtisanTicket = {
  id: number;
  status: string;
  service_name: string | null;
  service_category: string | null;
  roost_name: string | null;
  scheduled_date: string | null;
  service_time: string | null;
};

type ToastState = { message: string; tone?: "error" };

type RoostFormState = {
  name: string;
  location: string;
  price: string;
  wifiSpeed: string;
  status: "live" | "hidden";
  ranges: AvailabilityRange[];
};

type ServiceFormState = {
  name: string;
  category: string;
  price: string;
  dailyLimit: string;
  location: string;
  time: string;
};

const defaultRoostForm: RoostFormState = {
  name: "",
  location: "",
  price: "",
  wifiSpeed: "",
  status: "live",
  ranges: [{ start_date: "", end_date: "" }],
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

function toPrettyDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toPrettyTime(value: string | null): string {
  if (!value) {
    return "Anytime";
  }
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: "" });

  const [hostRoosts, setHostRoosts] = useState<Roost[]>([]);
  const [hostSummaries, setHostSummaries] = useState<HostStaySummary[]>([]);
  const [artisanServices, setArtisanServices] = useState<Root[]>([]);
  const [artisanTickets, setArtisanTickets] = useState<ArtisanTicket[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [showRoostModal, setShowRoostModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingRoostId, setEditingRoostId] = useState<number | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [roostForm, setRoostForm] = useState<RoostFormState>(defaultRoostForm);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(defaultServiceForm);

  const roleOption = defaultRoleOptions.find((option) => option.id === profile?.role);
  const roleTitle = roleOption?.title || profile?.role || "";
  const roleLabel = roleOption?.label || "Role";

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todaysTasks = useMemo(
    () => artisanTickets.filter((ticket) => ticket.scheduled_date === todayIso),
    [artisanTickets, todayIso]
  );

  const refreshHostData = async (token: string) => {
    const [roosts, summaries] = await Promise.all([
      apiFetch<Roost[]>("/roosts/mine", { token }),
      apiFetch<HostStaySummary[]>("/host/stays/summary", { token }),
    ]);
    setHostRoosts(roosts);
    setHostSummaries(summaries);
  };

  const refreshArtisanData = async (token: string) => {
    const [services, tickets] = await Promise.all([
      apiFetch<Root[]>("/roots/mine", { token }),
      apiFetch<ArtisanTicket[]>("/artisan/tickets", { token }),
    ]);
    setArtisanServices(services);
    setArtisanTickets(tickets);
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

        if (profileData.role === "nomad") {
          router.replace("/inventory");
          return;
        }

        if (profileData.role === "host") {
          await refreshHostData(token);
        } else if (profileData.role === "artisan") {
          await refreshArtisanData(token);
        }
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const nextGuestForRoost = (roostId: number): HostStaySummary | null => {
    const upcoming = hostSummaries
      .filter((stay) => stay.roost_id === roostId && stay.start_date >= todayIso)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return upcoming[0] ?? null;
  };

  const handleToggleRoostStatus = async (roost: Roost) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setBusyId(roost.id);
      await apiFetch<Roost>(`/roosts/${roost.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          status: roost.wifi_active ? "hidden" : "live",
        }),
      });
      await refreshHostData(token);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteRoost = async (roostId: number) => {
    if (!window.confirm("Delete this roost? It will be marked deleted and hidden.")) {
      return;
    }
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setBusyId(roostId);
      await apiFetch<{ message: string }>(`/roosts/${roostId}`, {
        method: "DELETE",
        token,
      });
      await refreshHostData(token);
      setToast({ message: "Roost deleted." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const handleEditRoost = (roost: Roost) => {
    setEditingRoostId(roost.id);
    setRoostForm({
      name: roost.title,
      location: roost.place_name || "",
      price: String(roost.nightly_rate ?? ""),
      wifiSpeed: String(roost.wifi_speed_mbps ?? ""),
      status: roost.wifi_active ? "live" : "hidden",
      ranges:
        roost.availability_ranges && roost.availability_ranges.length > 0
          ? roost.availability_ranges
          : [{ start_date: "", end_date: "" }],
    });
    setShowRoostModal(true);
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
      await refreshArtisanData(token);
      setToast({ message: "Service deleted." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    } finally {
      setBusyId(null);
    }
  };

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

  const updateRange = (
    index: number,
    field: "start_date" | "end_date",
    value: string
  ) => {
    setRoostForm((prev) => {
      const next = [...prev.ranges];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, ranges: next };
    });
  };

  const addRangeRow = () => {
    setRoostForm((prev) => ({
      ...prev,
      ranges: [...prev.ranges, { start_date: "", end_date: "" }],
    }));
  };

  const removeRangeRow = (index: number) => {
    setRoostForm((prev) => {
      if (prev.ranges.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        ranges: prev.ranges.filter((_, current) => current !== index),
      };
    });
  };

  const submitRoost = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const availabilityRanges = roostForm.ranges.filter(
        (range) => range.start_date && range.end_date
      );
      const endpoint = editingRoostId ? `/roosts/${editingRoostId}` : "/roosts";
      const method = editingRoostId ? "PUT" : "POST";
      await apiFetch<Roost>(endpoint, {
        method,
        token,
        body: JSON.stringify({
          title: roostForm.name,
          place_name: roostForm.location,
          nightly_rate: Number(roostForm.price),
          wifi_speed_mbps: Number(roostForm.wifiSpeed),
          status: roostForm.status,
          availability_ranges: availabilityRanges,
          bedroom_type: "Private room",
          bedroom_count: 1,
          photos: [],
        }),
      });
      await refreshHostData(token);
      setRoostForm(defaultRoostForm);
      setEditingRoostId(null);
      setShowRoostModal(false);
      setToast({ message: editingRoostId ? "Roost updated." : "Roost created." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
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
      await refreshArtisanData(token);
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
            Dashboard
          </p>
          <h1 data-testid={testIds.dashboard.greeting}>
            {loading ? "Loading..." : `Hello, ${profile?.full_name || ""}`}
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

      {profile?.role === "host" && (
        <section className={styles.surface} data-testid={testIds.dashboard.cards}>
          <div className={styles.sectionHeader}>
            <h2>My Roosts</h2>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                setEditingRoostId(null);
                setRoostForm(defaultRoostForm);
                setShowRoostModal(true);
              }}
            >
              + Add Roost
            </button>
          </div>

          {hostRoosts.length === 0 ? (
            <p className={styles.empty}>No roosts yet. Add your first one to go live in the cluster.</p>
          ) : (
            <div className={styles.stack}>
              {hostRoosts.map((roost) => {
                const nextGuest = nextGuestForRoost(roost.id);
                return (
                  <article key={roost.id} className={styles.card}>
                    <div>
                      <h3>{roost.title}</h3>
                      <p className={styles.muted}>{roost.place_name || "Location pending"}</p>
                      <p className={styles.muted}>${roost.nightly_rate ?? 0} / night</p>
                    </div>

                    <button
                      type="button"
                      className={`${styles.statusToggle} ${roost.wifi_active ? styles.live : styles.hidden}`}
                      aria-pressed={roost.wifi_active}
                      title="Toggle status"
                      disabled={busyId === roost.id}
                      onClick={() => handleToggleRoostStatus(roost)}
                    >
                      <span className={styles.toggleKnob} />
                      <span>{roost.wifi_active ? "Live" : "Hidden"}</span>
                    </button>

                    <div className={styles.iconActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        title="Edit roost"
                        disabled={busyId === roost.id}
                        onClick={() => handleEditRoost(roost)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        title="Delete roost"
                        disabled={busyId === roost.id}
                        onClick={() => handleDeleteRoost(roost.id)}
                      >
                        <DeleteIcon />
                      </button>
                    </div>

                    <div className={styles.nextGuest}>
                      <strong>Next Guest</strong>
                      {nextGuest ? (
                        <p>
                          {nextGuest.nomad_name || "Nomad"} · Check-in {toPrettyDate(nextGuest.start_date)}
                        </p>
                      ) : (
                        <p>No upcoming guests yet.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {profile?.role === "artisan" && (
        <section className={styles.surface} data-testid={testIds.dashboard.cards}>
          <div className={styles.sectionHeader}>
            <h2>My Services</h2>
            <button
              type="button"
              className={styles.primary}
              onClick={() => {
                setEditingServiceId(null);
                setServiceForm(defaultServiceForm);
                setShowServiceModal(true);
              }}
            >
              + Add Service
            </button>
          </div>

          <h3 className={styles.subheading}>Today&apos;s Tasks</h3>
          {todaysTasks.length === 0 ? (
            <p className={styles.empty}>No confirmed tasks for today.</p>
          ) : (
            <div className={styles.stack}>
              {todaysTasks.map((task) => (
                <article key={task.id} className={styles.taskItem}>
                  {toPrettyTime(task.service_time)} |{" "}
                  {task.service_name || task.service_category || "Service"} | Delivery to{" "}
                  &quot;{task.roost_name || "Assigned Roost"}&quot;
                </article>
              ))}
            </div>
          )}

          <h3 className={styles.subheading}>Service Catalog</h3>
          {artisanServices.length === 0 ? (
            <p className={styles.empty}>No services yet. Add your first service.</p>
          ) : (
            <div className={styles.stack}>
              {artisanServices.map((service) => (
                <article key={service.id} className={styles.card}>
                  <div>
                    <h3>{service.service_description}</h3>
                    <p className={styles.muted}>{service.service_category}</p>
                    <p className={styles.muted}>
                      ${service.base_price ?? 0} · Daily limit {service.service_capacity}
                    </p>
                    <p className={styles.muted}>{service.place_name || "Location pending"}</p>
                  </div>
                  <div className={styles.iconActions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Edit service"
                      disabled={busyId === service.id}
                      onClick={() => handleEditService(service)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Delete service"
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

      {profile?.role === "nomad" && (
        <section className={styles.surface} data-testid={testIds.dashboard.cards}>
          <h2>Nomad Control Deck</h2>
          <p className={styles.muted}>
            Use Inventory to discover roosts, select services, and check out your stay bundle.
          </p>
        </section>
      )}

      {showRoostModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{editingRoostId ? "Edit Roost" : "Add Roost"}</h3>

            <label className={styles.field}>
              Name
              <input
                type="text"
                required
                value={roostForm.name}
                onChange={(event) =>
                  setRoostForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Location
              <input
                type="text"
                required
                value={roostForm.location}
                onChange={(event) =>
                  setRoostForm((prev) => ({ ...prev, location: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Price (per night)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={roostForm.price}
                onChange={(event) =>
                  setRoostForm((prev) => ({ ...prev, price: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Wi-Fi Speed (Mbps)
              <input
                type="number"
                min="1"
                step="1"
                required
                value={roostForm.wifiSpeed}
                onChange={(event) =>
                  setRoostForm((prev) => ({ ...prev, wifiSpeed: event.target.value }))
                }
              />
            </label>

            <div className={styles.fieldGroup}>
              <span>Availability (optional)</span>
              {roostForm.ranges.map((range, index) => (
                <div key={index} className={styles.rangeRow}>
                  <input
                    type="date"
                    value={range.start_date}
                    onChange={(event) => updateRange(index, "start_date", event.target.value)}
                  />
                  <input
                    type="date"
                    value={range.end_date}
                    onChange={(event) => updateRange(index, "end_date", event.target.value)}
                  />
                  <button type="button" className={styles.ghost} onClick={() => removeRangeRow(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className={styles.ghost} onClick={addRangeRow}>
                + Add Date Range
              </button>
            </div>

            <label className={styles.field}>
              Status
              <select
                value={roostForm.status}
                onChange={(event) =>
                  setRoostForm((prev) => ({
                    ...prev,
                    status: event.target.value as "live" | "hidden",
                  }))
                }
              >
                <option value="live">Live</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghost} onClick={() => setShowRoostModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={submitRoost}
                disabled={
                  !roostForm.name ||
                  !roostForm.location ||
                  !roostForm.price ||
                  !roostForm.wifiSpeed
                }
              >
                {editingRoostId ? "Update Roost" : "Save Roost"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{editingServiceId ? "Edit Service" : "Add Service"}</h3>

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
                {editingServiceId ? "Update Service" : "Save Service"}
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
