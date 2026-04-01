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
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Root = {
  id: number;
  service_category: string;
  service_description: string;
  service_capacity: number;
  place_name: string | null;
  latitude: number | null;
  longitude: number | null;
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
    place_name: "",
  });

  const [rootForm, setRootForm] = useState({
    service_category: serviceCategories[0],
    service_description: "",
    service_capacity: "4",
    place_name: "",
  });

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
                  </div>
                  <span className={styles.coords}>
                    {roost.place_name || "Location pending"}
                  </span>
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
                  </div>
                  <span className={styles.coords}>
                    {root.place_name || "Location pending"}
                  </span>
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
