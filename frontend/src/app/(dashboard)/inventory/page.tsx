"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { defaultRoleOptions } from "@/lib/roles";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

const serviceCategories = ["Food", "Craft", "Guiding"];

type Profile = {
  email: string;
  full_name: string;
  role: string;
};

type Roost = {
  id: number;
  title: string;
  bedroom_type: string;
  bedroom_count: number | null;
  photos: string[];
  wifi_speed_mbps: number;
  wifi_active: boolean;
  nightly_rate: number | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Root = {
  id: number;
  service_category: string;
  service_description: string;
  service_capacity: number;
  remaining_capacity: number | null;
  available_days: string | null;
  service_window_start: string | null;
  service_window_end: string | null;
  is_active: boolean;
  base_price: number | null;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PersonalizedRoot = Root & {
  distance_km: number | null;
  walk_minutes: number | null;
  category_group: string;
};

type BundlePreview = {
  nights: number;
  roost_price: number;
  services_price: number;
  total_price: number;
  timeline: {
    root_id: number;
    scheduled_date: string;
    service_category: string;
    service_description: string;
    place_name: string | null;
  }[];
};

type HostPartnership = {
  artisan_id: number;
  artisan_name: string | null;
  services: string[];
};

type HostStaySummary = {
  bundle_id: number;
  nomad_name: string | null;
  roost_id: number;
  start_date: string;
  end_date: string;
  services: string[];
};

type ServiceTicket = {
  id: number;
  bundle_id: number;
  root_id: number;
  nomad_id: number;
  host_id: number;
  status: string;
  note: string | null;
  created_at: string | null;
};

export default function InventoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roosts, setRoosts] = useState<Roost[]>([]);
  const [roots, setRoots] = useState<Root[]>([]);
  const [roostTotal, setRoostTotal] = useState(0);
  const [rootTotal, setRootTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [roostPage, setRoostPage] = useState(1);
  const [rootPage, setRootPage] = useState(1);
  const itemsPerPage = 4;

  const [roostForm, setRoostForm] = useState({
    title: "",
    bedroom_type: "Private room",
    bedroom_count: "1",
    photos: "",
    wifi_speed_mbps: "100",
    wifi_active: true,
    nightly_rate: "120",
    place_name: "",
  });

  const [rootForm, setRootForm] = useState({
    service_category: serviceCategories[0],
    service_description: "",
    service_capacity: "4",
    available_days: "mon,tue,wed,thu,fri",
    service_window_start: "08:00",
    service_window_end: "12:00",
    base_price: "25",
    is_active: true,
    place_name: "",
  });

  const [selectedRoostId, setSelectedRoostId] = useState<number | null>(null);
  const [personalizedRoots, setPersonalizedRoots] = useState<PersonalizedRoot[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    { root_id: number; scheduled_date: string; quantity: number }[]
  >([]);
  const [bundlePreview, setBundlePreview] = useState<BundlePreview | null>(null);
  const [hostPartnerships, setHostPartnerships] = useState<
    Record<number, HostPartnership[]>
  >({});
  const [hostSummaries, setHostSummaries] = useState<HostStaySummary[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [capacityEdits, setCapacityEdits] = useState<
    Record<number, { daily_limit: string; date: string }>
  >({});
  const [availabilityEdits, setAvailabilityEdits] = useState<
    Record<number, { days: string; start: string; end: string }>
  >({});

  const roleMeta = useMemo(() => {
    if (!profile?.role) return null;
    return (
      defaultRoleOptions.find((option) => option.id === profile.role) || {
        title: profile.role,
        label: "Role",
      }
    );
  }, [profile?.role]);

  const isHost = profile?.role === "host";
  const isArtisan = profile?.role === "artisan";
  const isNomad = profile?.role === "nomad";

  const roostPageCount = Math.max(1, Math.ceil(roostTotal / itemsPerPage));
  const rootPageCount = Math.max(1, Math.ceil(rootTotal / itemsPerPage));

  useEffect(() => {
    setRoostPage(1);
    setRootPage(1);
  }, [searchTerm]);

  const loadData = async (token: string) => {
    try {
      const profileData = await apiFetch<Profile>("/profile", { token });
      setProfile(profileData);

      if (profileData.role === "nomad") {
        return;
      } else {
        const [roostData, rootData] = await Promise.all([
          apiFetch<Roost[]>("/roosts/mine", { token }),
          apiFetch<Root[]>("/roots/mine", { token }),
        ]);
        setRoosts(roostData);
        setRoots(rootData);
        if (profileData.role === "host") {
          const summaryData = await apiFetch<HostStaySummary[]>(
            "/host/stays/summary",
            { token }
          );
          setHostSummaries(summaryData);
        }
        if (profileData.role === "artisan") {
          const ticketData = await apiFetch<ServiceTicket[]>("/artisan/tickets", {
            token,
          });
          setTickets(ticketData);
        }
      }
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    loadData(token);
  }, [router]);

  useEffect(() => {
    if (!isNomad) {
      return;
    }
    const token = getToken();
    if (!token) {
      return;
    }
    const fetchNomadPage = async () => {
      try {
        const roostParams = new URLSearchParams();
        roostParams.set("page", String(roostPage));
        roostParams.set("limit", String(itemsPerPage));
        if (searchTerm.trim()) {
          roostParams.set("search", searchTerm.trim());
        }
        const rootParams = new URLSearchParams();
        rootParams.set("page", String(rootPage));
        rootParams.set("limit", String(itemsPerPage));
        if (searchTerm.trim()) {
          rootParams.set("search", searchTerm.trim());
        }
        const [roostData, rootData] = await Promise.all([
          apiFetch<{ items: Roost[]; total: number }>(
            `/roosts?${roostParams}`,
            { token }
          ),
          apiFetch<{ items: Root[]; total: number }>(`/roots?${rootParams}`, {
            token,
          }),
        ]);
        setRoosts(roostData.items);
        setRoostTotal(roostData.total);
        setRoots(rootData.items);
        setRootTotal(rootData.total);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };
    fetchNomadPage();
  }, [isNomad, itemsPerPage, roostPage, rootPage, searchTerm]);

  useEffect(() => {
    if (!roots.length) {
      return;
    }
    setCapacityEdits((prev) => {
      const next = { ...prev };
      roots.forEach((root) => {
        if (!next[root.id]) {
          next[root.id] = {
            daily_limit: String(root.service_capacity),
            date: "",
          };
        }
      });
      return next;
    });
    setAvailabilityEdits((prev) => {
      const next = { ...prev };
      roots.forEach((root) => {
        if (!next[root.id]) {
          next[root.id] = {
            days: root.available_days || "",
            start: root.service_window_start || "",
            end: root.service_window_end || "",
          };
        }
      });
      return next;
    });
  }, [roots]);

  const submitRoost = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!roostForm.title.trim()) {
      setToast({
        message: "Add a title before publishing a roost.",
        tone: "error",
      });
      return;
    }

    if (!roostForm.place_name.trim()) {
      setToast({
        message: "Add a place name before publishing a roost.",
        tone: "error",
      });
      return;
    }

    const photos = roostForm.photos
      .split(",")
      .map((photo) => photo.trim())
      .filter(Boolean);

    try {
      await apiFetch<Roost>("/roosts", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: roostForm.title,
          bedroom_type: roostForm.bedroom_type,
          bedroom_count: roostForm.bedroom_count
            ? Number(roostForm.bedroom_count)
            : null,
          photos,
          wifi_speed_mbps: Number(roostForm.wifi_speed_mbps),
          wifi_active: roostForm.wifi_active,
          nightly_rate: roostForm.nightly_rate
            ? Number(roostForm.nightly_rate)
            : null,
          place_name: roostForm.place_name.trim(),
          latitude: null,
          longitude: null,
        }),
      });
      setRoostForm((prev) => ({
        ...prev,
        title: "",
        photos: "",
        place_name: "",
      }));
      await loadData(token);
      setToast({ message: "Roost listed successfully." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const submitRoot = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    if (!rootForm.service_description.trim()) {
      setToast({
        message: "Add a description before publishing a root.",
        tone: "error",
      });
      return;
    }

    if (!rootForm.place_name.trim()) {
      setToast({
        message: "Add a place name before publishing a root.",
        tone: "error",
      });
      return;
    }

    try {
      await apiFetch<Root>("/roots", {
        method: "POST",
        token,
        body: JSON.stringify({
          service_category: rootForm.service_category,
          service_description: rootForm.service_description,
          service_capacity: Number(rootForm.service_capacity),
          available_days: rootForm.available_days.trim(),
          service_window_start: rootForm.service_window_start || null,
          service_window_end: rootForm.service_window_end || null,
          base_price: rootForm.base_price ? Number(rootForm.base_price) : null,
          is_active: rootForm.is_active,
          place_name: rootForm.place_name.trim(),
          latitude: null,
          longitude: null,
        }),
      });
      setRootForm((prev) => ({
        ...prev,
        service_description: "",
        place_name: "",
      }));
      await loadData(token);
      setToast({ message: "Root service listed successfully." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const fetchPersonalizedRoots = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!selectedRoostId || !dateRange.start || !dateRange.end) {
      setToast({
        message: "Select a roost and stay dates before building your stay.",
        tone: "error",
      });
      return;
    }
    try {
      const params = new URLSearchParams();
      params.set("max_walk_minutes", "15");
      params.set("stay_start", dateRange.start);
      params.set("stay_end", dateRange.end);
      const data = await apiFetch<PersonalizedRoot[]>(
        `/nomad/roosts/${selectedRoostId}/roots?${params.toString()}`,
        { token }
      );
      setPersonalizedRoots(data);
      setSelectedItems([]);
      setBundlePreview(null);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const addRootToBundle = (rootId: number) => {
    if (!dateRange.start) {
      setToast({ message: "Pick a stay date first.", tone: "error" });
      return;
    }
    setSelectedItems((prev) => [
      ...prev,
      { root_id: rootId, scheduled_date: dateRange.start, quantity: 1 },
    ]);
  };

  const updateSelectedItem = (
    index: number,
    patch: Partial<{ scheduled_date: string; quantity: number }>
  ) => {
    setSelectedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const removeSelectedItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const requestPreview = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!selectedRoostId || !dateRange.start || !dateRange.end) {
      setToast({
        message: "Select a roost and stay dates before previewing.",
        tone: "error",
      });
      return;
    }
    try {
      const preview = await apiFetch<BundlePreview>("/nomad/bundles/preview", {
        method: "POST",
        token,
        body: JSON.stringify({
          roost_id: selectedRoostId,
          start_date: dateRange.start,
          end_date: dateRange.end,
          items: selectedItems,
        }),
      });
      setBundlePreview(preview);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const checkoutBundle = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!selectedRoostId || !dateRange.start || !dateRange.end) {
      setToast({
        message: "Select a roost and stay dates before checking out.",
        tone: "error",
      });
      return;
    }
    try {
      const result = await apiFetch<{ bundle_id: number; total_price: number }>(
        "/nomad/bundles/checkout",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            roost_id: selectedRoostId,
            start_date: dateRange.start,
            end_date: dateRange.end,
            items: selectedItems,
          }),
        }
      );
      setToast({
        message: `Bundle #${result.bundle_id} confirmed. Total ${result.total_price}.`,
      });
      setSelectedItems([]);
      setBundlePreview(null);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const toggleWifiStatus = async (roostId: number, value: boolean) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      await apiFetch<{ roost_id: number; wifi_active: boolean }>(
        `/host/roosts/${roostId}/wifi-status`,
        {
          method: "PUT",
          token,
          body: JSON.stringify({ wifi_active: value }),
        }
      );
      await loadData(token);
      setToast({ message: "Wi-Fi status updated." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const loadPartnerships = async (roostId: number) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const data = await apiFetch<HostPartnership[]>(
        `/host/roosts/${roostId}/partnerships`,
        { token }
      );
      setHostPartnerships((prev) => ({ ...prev, [roostId]: data }));
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const updateCapacity = async (rootId: number) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const edit = capacityEdits[rootId];
    if (!edit?.daily_limit) {
      setToast({ message: "Set a daily limit first.", tone: "error" });
      return;
    }
    try {
      await apiFetch(`/artisan/roots/${rootId}/capacity`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          daily_limit: Number(edit.daily_limit),
          date: edit.date || null,
        }),
      });
      await loadData(token);
      setToast({ message: "Capacity updated." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const updateAvailability = async (rootId: number) => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const edit = availabilityEdits[rootId];
    try {
      await apiFetch(`/artisan/roots/${rootId}/availability`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          available_days: edit?.days || null,
          service_window_start: edit?.start || null,
          service_window_end: edit?.end || null,
        }),
      });
      await loadData(token);
      setToast({ message: "Availability updated." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.inventory.page}>
      <header className={styles.header} data-testid={testIds.inventory.header}>
        <div>
          {!isNomad && <p className={styles.kicker}>Inventory Engine</p>}
          <h1>Roosts & Roots</h1>
          {!isNomad && (
            <p className={styles.subtitle}>
              Publish your space and services so nomads can find work-ready neighbors.
            </p>
          )}
        </div>
        {roleMeta && (
          <div
            className={styles.roleBadge}
            data-testid={testIds.inventory.profileBadge}
          >
            <span className={styles.roleTitle}>{roleMeta.title}</span>
            <span className={styles.roleLabel}>{roleMeta.label}</span>
          </div>
        )}
      </header>

      <div className={styles.grid}>
        {isNomad && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Find Your Next Roost</h2>
              <p className={styles.cardHint}>
                Explore the local Roots and align your work-stay horizon.
              </p>
            </div>
            <div className={styles.searchRow}>
              <label className={styles.inlineLabel}>
                Location Search
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Where are you roosting next?"
                />
              </label>
            </div>
            <div className={styles.mapPlaceholder}>
              <div className={styles.mapCanvas}>
                <div className={styles.mapOverlay}>
                  <p>Map preview disabled</p>
                  <span>Enable Google Maps to explore nearby listings.</span>
                </div>
              </div>
              <button type="button" className={styles.mapButton} disabled>
                Enable Google Maps (Coming Soon)
              </button>
            </div>
            <div className={styles.dateRow}>
              <label className={styles.inlineLabel}>
                Start Date
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, start: event.target.value }))
                  }
                />
              </label>
              <label className={styles.inlineLabel}>
                End Date
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, end: event.target.value }))
                  }
                />
              </label>
            </div>
            <button type="button" className={styles.searchButton}>
              Find & Explore
            </button>
          </section>
        )}

        {isNomad && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Build Your Stay</h2>
              <p className={styles.cardHint}>
                Curate nearby roots into a single stay timeline and checkout once.
              </p>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>
                Select Roost
                <select
                  value={selectedRoostId ?? ""}
                  onChange={(event) =>
                    setSelectedRoostId(
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                >
                  <option value="">Choose a roost</option>
                  {roosts.map((roost) => (
                    <option key={roost.id} value={roost.id}>
                      {roost.title} • {roost.place_name || "Location pending"}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Walk Limit
                <select disabled>
                  <option>15 minutes</option>
                </select>
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.label}>
                Stay Start
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, start: event.target.value }))
                  }
                />
              </label>
              <label className={styles.label}>
                Stay End
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, end: event.target.value }))
                  }
                />
              </label>
            </div>
            <button
              type="button"
              className={styles.primary}
              onClick={fetchPersonalizedRoots}
            >
              Load Nearby Roots
            </button>
            <div className={styles.subCard}>
              <h3>Nearby Roots</h3>
              {personalizedRoots.length === 0 ? (
                <p className={styles.empty}>
                  Select a roost and dates to see what’s within walking distance.
                </p>
              ) : (
                personalizedRoots.map((root) => (
                  <div key={root.id} className={styles.listItem}>
                    <div>
                      <strong>{root.service_category}</strong>
                      <span>{root.service_description}</span>
                      <span>
                        {root.category_group} • {root.walk_minutes ?? "--"} min walk
                      </span>
                    </div>
                    <div className={styles.actionCol}>
                      <span className={styles.coords}>
                        {root.place_name || "Location pending"}
                      </span>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => addRootToBundle(root.id)}
                      >
                        Add to Timeline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className={styles.subCard}>
              <h3>Stay Timeline</h3>
              {selectedItems.length === 0 ? (
                <p className={styles.empty}>No services selected yet.</p>
              ) : (
                selectedItems.map((item, index) => {
                  const root = personalizedRoots.find(
                    (candidate) => candidate.id === item.root_id
                  );
                  return (
                    <div key={`${item.root_id}-${index}`} className={styles.listItem}>
                      <div>
                        <strong>{root?.service_category || "Root Service"}</strong>
                        <span>{root?.service_description || "Service"}</span>
                      </div>
                      <div className={styles.inlineControls}>
                        <label className={styles.inlineField}>
                          Date
                          <input
                            type="date"
                            value={item.scheduled_date}
                            onChange={(event) =>
                              updateSelectedItem(index, {
                                scheduled_date: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label className={styles.inlineField}>
                          Qty
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              updateSelectedItem(index, {
                                quantity: Number(event.target.value),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className={styles.ghost}
                          onClick={() => removeSelectedItem(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className={styles.subCard}>
              <h3>Bundle Preview</h3>
              {bundlePreview ? (
                <div className={styles.previewGrid}>
                  <div>
                    <strong>Total Price</strong>
                    <p className={styles.priceTag}>{bundlePreview.total_price}</p>
                    <span>
                      Roost {bundlePreview.roost_price} • Services{" "}
                      {bundlePreview.services_price}
                    </span>
                  </div>
                  <div className={styles.timeline}>
                    {bundlePreview.timeline.length === 0 ? (
                      <p className={styles.empty}>No services scheduled yet.</p>
                    ) : (
                      bundlePreview.timeline.map((entry, idx) => (
                        <div key={`${entry.root_id}-${idx}`} className={styles.timelineItem}>
                          <strong>{entry.service_category}</strong>
                          <span>
                            {entry.scheduled_date} • {entry.service_description}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>Preview your stay timeline and total.</p>
              )}
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={requestPreview}
                >
                  Preview Bundle
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={checkoutBundle}
                >
                  One-Click Checkout
                </button>
              </div>
            </div>
          </section>
        )}

        {isHost && (
        <section className={styles.card} data-testid={testIds.inventory.roostCard}>
          <div className={styles.cardHeader}>
            <h2>Host Listing (Roost)</h2>
            <p className={styles.cardHint}>
              List your bedroom, photos, Wi-Fi speed, and map pin.
            </p>
          </div>
          <form
            className={styles.form}
            data-testid={testIds.inventory.roostForm}
            onSubmit={(event) => event.preventDefault()}
          >
            <label className={styles.label}>
              Listing Title
              <input
                type="text"
                value={roostForm.title}
                onChange={(event) =>
                  setRoostForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Garden Suite"
              />
            </label>
            <div className={styles.row}>
              <label className={styles.label}>
                Bedroom Type
                <input
                  type="text"
                  value={roostForm.bedroom_type}
                  onChange={(event) =>
                    setRoostForm((prev) => ({
                      ...prev,
                      bedroom_type: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                Bedroom Count
                <input
                  type="number"
                  min={1}
                  value={roostForm.bedroom_count}
                  onChange={(event) =>
                    setRoostForm((prev) => ({
                      ...prev,
                      bedroom_count: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className={styles.label}>
              Photo URLs (comma separated)
              <input
                type="text"
                value={roostForm.photos}
                onChange={(event) =>
                  setRoostForm((prev) => ({
                    ...prev,
                    photos: event.target.value,
                  }))
                }
                placeholder="https://... , https://..."
              />
            </label>
            <label className={styles.label}>
              Wi-Fi Speed (Mbps)
              <input
                type="number"
                min={1}
                value={roostForm.wifi_speed_mbps}
                onChange={(event) =>
                  setRoostForm((prev) => ({
                    ...prev,
                    wifi_speed_mbps: event.target.value,
                  }))
                }
              />
            </label>
            <div className={styles.row}>
              <label className={styles.label}>
                Nightly Rate
                <input
                  type="number"
                  min={0}
                  value={roostForm.nightly_rate}
                  onChange={(event) =>
                    setRoostForm((prev) => ({
                      ...prev,
                      nightly_rate: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.checkboxLabel}>
                Wi-Fi Active
                <input
                  type="checkbox"
                  checked={roostForm.wifi_active}
                  onChange={(event) =>
                    setRoostForm((prev) => ({
                      ...prev,
                      wifi_active: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>
            <label className={styles.label}>
              Place Name
              <input
                type="text"
                value={roostForm.place_name}
                onChange={(event) =>
                  setRoostForm((prev) => ({
                    ...prev,
                    place_name: event.target.value,
                  }))
                }
                placeholder="Downtown Kyoto"
              />
            </label>
            <div className={styles.mapPlaceholder}>
              <div className={styles.mapCanvas}>
                <div className={styles.mapOverlay}>
                  <p>Map preview disabled</p>
                  <span>Enable Google Maps to drop a pin.</span>
                </div>
              </div>
              <button type="button" className={styles.mapButton} disabled>
                Enable Google Maps (Coming Soon)
              </button>
            </div>
            <button
              type="button"
              className={styles.primary}
              data-testid={testIds.inventory.roostSubmit}
              onClick={submitRoost}
              disabled={!isHost}
            >
              Publish Roost
            </button>
            {!isHost && (
              <p className={styles.notice}>
                Switch to the Host role to publish a roost.
              </p>
            )}
          </form>

          <div className={styles.list} data-testid={testIds.inventory.roostList}>
            <h3>Your Roosts</h3>
            {roosts.length === 0 ? (
              <p className={styles.empty}>No roosts yet.</p>
            ) : (
              roosts.map((roost) => (
                <div key={roost.id} className={styles.listItem}>
                  <div>
                    <strong>{roost.title}</strong>
                    <span>
                      {roost.bedroom_type} • Wi-Fi {roost.wifi_speed_mbps} Mbps
                    </span>
                    <span>
                      Rate {roost.nightly_rate ?? 0} •{" "}
                      {roost.wifi_active ? "Wi-Fi active" : "Wi-Fi paused"}
                    </span>
                  </div>
                  <div className={styles.actionCol}>
                    <span className={styles.coords}>
                      {roost.place_name || "Location pending"}
                    </span>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => toggleWifiStatus(roost.id, !roost.wifi_active)}
                    >
                      {roost.wifi_active ? "Pause Wi-Fi" : "Activate Wi-Fi"}
                    </button>
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={() => loadPartnerships(roost.id)}
                    >
                      View Partnerships
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={styles.subCard}>
            <h3>Bundled Artisans</h3>
            {roosts.length === 0 ? (
              <p className={styles.empty}>Publish a roost to see partnerships.</p>
            ) : (
              roosts.map((roost) => (
                <div key={`partners-${roost.id}`} className={styles.listItem}>
                  <div>
                    <strong>{roost.title}</strong>
                    <span>
                      {hostPartnerships[roost.id]?.length
                        ? `${hostPartnerships[roost.id].length} artisans`
                        : "No partnerships loaded"}
                    </span>
                  </div>
                  <div className={styles.actionCol}>
                    <span className={styles.coords}>
                      {roost.place_name || "Location pending"}
                    </span>
                    {hostPartnerships[roost.id]?.length ? (
                      <div className={styles.chipRow}>
                        {hostPartnerships[roost.id].map((partner) => (
                          <span key={partner.artisan_id} className={styles.chip}>
                            {partner.artisan_name || `Artisan ${partner.artisan_id}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.muted}>Tap “View Partnerships”.</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={styles.subCard}>
            <h3>Stay Summaries</h3>
            {hostSummaries.length === 0 ? (
              <p className={styles.empty}>No stays bundled yet.</p>
            ) : (
              hostSummaries.map((stay) => (
                <div key={stay.bundle_id} className={styles.listItem}>
                  <div>
                    <strong>{stay.nomad_name || "Nomad"}</strong>
                    <span>
                      {stay.start_date} → {stay.end_date}
                    </span>
                    <span>{stay.services.join(", ") || "No services"}</span>
                  </div>
                  <span className={styles.coords}>Roost #{stay.roost_id}</span>
                </div>
              ))
            )}
          </div>
        </section>

        )}

        {isArtisan && (
        <section className={styles.card} data-testid={testIds.inventory.rootsCard}>
          <div className={styles.cardHeader}>
            <h2>Artisan Service (Root)</h2>
            <p className={styles.cardHint}>
              Detail your craft and set your service capacity.
            </p>
          </div>
          <form
            className={styles.form}
            data-testid={testIds.inventory.rootsForm}
            onSubmit={(event) => event.preventDefault()}
          >
            <label className={styles.label}>
              Service Category
              <select
                value={rootForm.service_category}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    service_category: event.target.value,
                  }))
                }
              >
                {serviceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Service Description
              <textarea
                rows={3}
                value={rootForm.service_description}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    service_description: event.target.value,
                  }))
                }
                placeholder="Tell guests what you offer."
              />
            </label>
            <label className={styles.label}>
              Service Capacity
              <input
                type="number"
                min={1}
                value={rootForm.service_capacity}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    service_capacity: event.target.value,
                  }))
                }
              />
            </label>
            <label className={styles.label}>
              Base Price
              <input
                type="number"
                min={0}
                value={rootForm.base_price}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    base_price: event.target.value,
                  }))
                }
              />
            </label>
            <label className={styles.label}>
              Available Days (comma-separated)
              <input
                type="text"
                value={rootForm.available_days}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    available_days: event.target.value,
                  }))
                }
                placeholder="mon,tue,wed"
              />
            </label>
            <div className={styles.row}>
              <label className={styles.label}>
                Service Window Start
                <input
                  type="time"
                  value={rootForm.service_window_start}
                  onChange={(event) =>
                    setRootForm((prev) => ({
                      ...prev,
                      service_window_start: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.label}>
                Service Window End
                <input
                  type="time"
                  value={rootForm.service_window_end}
                  onChange={(event) =>
                    setRootForm((prev) => ({
                      ...prev,
                      service_window_end: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className={styles.checkboxLabel}>
              Service Active
              <input
                type="checkbox"
                checked={rootForm.is_active}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
              />
            </label>
            <label className={styles.label}>
              Place Name
              <input
                type="text"
                value={rootForm.place_name}
                onChange={(event) =>
                  setRootForm((prev) => ({
                    ...prev,
                    place_name: event.target.value,
                  }))
                }
                placeholder="Old Market Square"
              />
            </label>
            <div className={styles.mapPlaceholder}>
              <div className={styles.mapCanvas}>
                <div className={styles.mapOverlay}>
                  <p>Map preview disabled</p>
                  <span>Enable Google Maps to drop a pin.</span>
                </div>
              </div>
              <button type="button" className={styles.mapButton} disabled>
                Enable Google Maps (Coming Soon)
              </button>
            </div>
            <button
              type="button"
              className={styles.primary}
              data-testid={testIds.inventory.rootsSubmit}
              onClick={submitRoot}
              disabled={!isArtisan}
            >
              Publish Root Service
            </button>
            {!isArtisan && (
              <p className={styles.notice}>
                Switch to the Artisan role to publish a root.
              </p>
            )}
          </form>

          <div className={styles.list} data-testid={testIds.inventory.rootList}>
            <h3>Your Roots</h3>
            {roots.length === 0 ? (
              <p className={styles.empty}>No roots yet.</p>
            ) : (
              roots.map((root) => (
                <div key={root.id} className={styles.listItem}>
                  <div>
                    <strong>{root.service_category}</strong>
                    <span>
                      {root.service_description} • Capacity {root.service_capacity}
                    </span>
                    <span>
                      {root.available_days || "Any day"} •{" "}
                      {root.service_window_start || "--"} -{" "}
                      {root.service_window_end || "--"}
                    </span>
                  </div>
                  <div className={styles.actionCol}>
                    <span className={styles.coords}>
                      {root.place_name || "Location pending"}
                    </span>
                    <div className={styles.inlineControls}>
                      <label className={styles.inlineField}>
                        Daily Limit
                        <input
                          type="number"
                          min={1}
                          value={capacityEdits[root.id]?.daily_limit || ""}
                          onChange={(event) =>
                            setCapacityEdits((prev) => ({
                              ...prev,
                              [root.id]: {
                                ...prev[root.id],
                                daily_limit: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.inlineField}>
                        Date Override
                        <input
                          type="date"
                          value={capacityEdits[root.id]?.date || ""}
                          onChange={(event) =>
                            setCapacityEdits((prev) => ({
                              ...prev,
                              [root.id]: {
                                ...prev[root.id],
                                date: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => updateCapacity(root.id)}
                      >
                        Update Capacity
                      </button>
                    </div>
                    <div className={styles.inlineControls}>
                      <label className={styles.inlineField}>
                        Days
                        <input
                          type="text"
                          value={availabilityEdits[root.id]?.days || ""}
                          onChange={(event) =>
                            setAvailabilityEdits((prev) => ({
                              ...prev,
                              [root.id]: {
                                ...prev[root.id],
                                days: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.inlineField}>
                        Start
                        <input
                          type="time"
                          value={availabilityEdits[root.id]?.start || ""}
                          onChange={(event) =>
                            setAvailabilityEdits((prev) => ({
                              ...prev,
                              [root.id]: {
                                ...prev[root.id],
                                start: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className={styles.inlineField}>
                        End
                        <input
                          type="time"
                          value={availabilityEdits[root.id]?.end || ""}
                          onChange={(event) =>
                            setAvailabilityEdits((prev) => ({
                              ...prev,
                              [root.id]: {
                                ...prev[root.id],
                                end: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => updateAvailability(root.id)}
                      >
                        Update Availability
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={styles.subCard}>
            <h3>Service Tickets</h3>
            {tickets.length === 0 ? (
              <p className={styles.empty}>No tickets yet.</p>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className={styles.listItem}>
                  <div>
                    <strong>Bundle #{ticket.bundle_id}</strong>
                    <span>{ticket.note || "New service request"}</span>
                    <span>Status: {ticket.status}</span>
                  </div>
                  <span className={styles.coords}>Root #{ticket.root_id}</span>
                </div>
              ))
            )}
          </div>
        </section>
        )}
      </div>

      {isNomad && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Roosts & Roots</h2>
            <p className={styles.cardHint}>
              Browse host spaces and artisan services in one sweep.
            </p>
          </div>
          <div className={styles.split}>
            <div className={styles.list}>
              <h3>Roost Listings</h3>
              {roosts.length === 0 ? (
                <p className={styles.empty}>
                  The trail is quiet — no roosts answered your call.
                </p>
              ) : (
                roosts.map((roost) => (
                  <div key={roost.id} className={styles.listItem}>
                    <div>
                      <strong>{roost.title}</strong>
                      <span>
                        {roost.bedroom_type} • Wi-Fi {roost.wifi_speed_mbps} Mbps
                      </span>
                    </div>
                    <span className={styles.coords}>
                      {roost.place_name || "Location pending"}
                    </span>
                  </div>
                ))
              )}
              {roostTotal > itemsPerPage && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    onClick={() => setRoostPage((prev) => Math.max(1, prev - 1))}
                    disabled={roostPage === 1}
                  >
                    Prev
                  </button>
                  <span>
                    Page {roostPage} of {roostPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRoostPage((prev) => Math.min(roostPageCount, prev + 1))
                    }
                    disabled={roostPage === roostPageCount}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            <div className={styles.list}>
              <h3>Root Services</h3>
              {roots.length === 0 ? (
                <p className={styles.empty}>
                  No roots surfaced — the village is still gathering.
                </p>
              ) : (
                roots.map((root) => (
                  <div key={root.id} className={styles.listItem}>
                    <div>
                      <strong>{root.service_category}</strong>
                      <span>
                        {root.service_description} • Capacity {root.service_capacity}
                      </span>
                    </div>
                    <span className={styles.coords}>
                      {root.place_name || "Location pending"}
                    </span>
                  </div>
                ))
              )}
              {rootTotal > itemsPerPage && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    onClick={() => setRootPage((prev) => Math.max(1, prev - 1))}
                    disabled={rootPage === 1}
                  >
                    Prev
                  </button>
                  <span>
                    Page {rootPage} of {rootPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRootPage((prev) => Math.min(rootPageCount, prev + 1))
                    }
                    disabled={rootPage === rootPageCount}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
        data-testid={testIds.inventory.toast}
      />
    </div>
  );
}
