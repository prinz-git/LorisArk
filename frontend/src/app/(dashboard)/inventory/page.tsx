"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { testIds } from "@/lib/testids";
import styles from "./page.module.css";

type Step = "find" | "build" | "bundle";

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

export default function InventoryPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });

  const [step, setStep] = useState<Step>("find");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [roostResults, setRoostResults] = useState<Roost[]>([]);
  const [showRoostResults, setShowRoostResults] = useState(false);
  const [selectedRoost, setSelectedRoost] = useState<Roost | null>(null);

  const [rootResults, setRootResults] = useState<Root[]>([]);
  const [selectedRootIds, setSelectedRootIds] = useState<number[]>([]);
  const [bundlePreview, setBundlePreview] = useState<BundlePreview | null>(null);

  const [roostDetail, setRoostDetail] = useState<Roost | null>(null);
  const [rootDetail, setRootDetail] = useState<Root | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const selectedRoots = useMemo(
    () => rootResults.filter((root) => selectedRootIds.includes(root.id)),
    [rootResults, selectedRootIds]
  );
  const todayIso = new Date().toISOString().split("T")[0];

  const parseAvailableDays = (availableDays: string | null) => {
    if (!availableDays) return null;
    const map: Record<string, number> = {
      mon: 1,
      monday: 1,
      tue: 2,
      tues: 2,
      tuesday: 2,
      wed: 3,
      wednesday: 3,
      thu: 4,
      thur: 4,
      thurs: 4,
      thursday: 4,
      fri: 5,
      friday: 5,
      sat: 6,
      saturday: 6,
      sun: 0,
      sunday: 0,
    };
    const days = availableDays
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .map((token) => map[token])
      .filter((day) => day !== undefined);
    return days.length ? new Set(days) : null;
  };

  const getStayWeekdays = (start: string, end: string) => {
    const days = new Set<number>();
    const cursor = new Date(start);
    const target = new Date(end);
    while (cursor < target) {
      days.add(cursor.getDay());
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const profileData = await apiFetch<Profile>("/profile", { token });
        if (profileData.role !== "nomad") {
          router.replace("/dashboard");
          return;
        }
        setProfile(profileData);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    loadProfile();
  }, [router]);

  const validateFindInputs = () => {
    if (!dateRange.start || !dateRange.end) {
      setToast({ message: "Choose start and end dates first.", tone: "error" });
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(0, 0, 0, 0);
    if (start < today || end < today) {
      setToast({ message: "Past dates are not allowed.", tone: "error" });
      return false;
    }
    if (new Date(dateRange.end) <= new Date(dateRange.start)) {
      setToast({ message: "End date must be after start date.", tone: "error" });
      return false;
    }
    return true;
  };

  const handleFindExplore = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!validateFindInputs()) {
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "25");
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }
      const data = await apiFetch<{ items: Roost[] }>(`/roosts?${params.toString()}`, {
        token,
      });
      setRoostResults(data.items || []);
      setShowRoostResults(true);
      setSelectedRoost(null);
      setRootResults([]);
      setSelectedRootIds([]);
      setBundlePreview(null);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const handleSelectRoost = (roost: Roost) => {
    if (!validateFindInputs()) {
      return;
    }
    setSelectedRoost(roost);
    setRootResults([]);
    setSelectedRootIds([]);
    setBundlePreview(null);
  };

  const handleContinueToBuild = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!validateFindInputs()) {
      return;
    }

    if (!selectedRoost) {
      setToast({ message: "Select one roost before continuing.", tone: "error" });
      return;
    }
    if (!selectedRoost.place_name) {
      setToast({ message: "Selected roost has no place name.", tone: "error" });
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "50");
      params.set("search", selectedRoost.place_name);
      const data = await apiFetch<{ items: Root[] }>(`/roots?${params.toString()}`, {
        token,
      });
      const stayWeekdays = getStayWeekdays(dateRange.start, dateRange.end);
      const roots = (data.items || []).filter((root) => {
        const rootPlace = (root.place_name || "").toLowerCase();
        const selectedPlace = selectedRoost.place_name!.toLowerCase();
        if (!rootPlace.includes(selectedPlace) && !selectedPlace.includes(rootPlace)) {
          return false;
        }
        const available = parseAvailableDays(root.available_days);
        if (!available) return true;
        return [...stayWeekdays].some((day) => available.has(day));
      });
      setRootResults(roots);
      setSelectedRootIds([]);
      setBundlePreview(null);
      setStep("build");
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const toggleRootSelection = (rootId: number) => {
    setSelectedRootIds((prev) =>
      prev.includes(rootId) ? prev.filter((id) => id !== rootId) : [...prev, rootId]
    );
  };

  const handleContinueToBundle = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!selectedRoost) {
      setToast({ message: "Select a roost first.", tone: "error" });
      return;
    }
    if (!selectedRootIds.length) {
      setToast({ message: "Select at least one root service.", tone: "error" });
      return;
    }

    try {
      const preview = await apiFetch<BundlePreview>("/nomad/bundles/preview", {
        method: "POST",
        token,
        body: JSON.stringify({
          roost_id: selectedRoost.id,
          start_date: dateRange.start,
          end_date: dateRange.end,
          items: selectedRootIds.map((rootId) => ({
            root_id: rootId,
            scheduled_date: dateRange.start,
            quantity: 1,
          })),
        }),
      });
      setBundlePreview(preview);
      setStep("bundle");
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const handleBookNow = async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!selectedRoost || !selectedRootIds.length) {
      setToast({ message: "Complete roost and root selections first.", tone: "error" });
      return;
    }

    try {
      setPaying(true);
      const result = await apiFetch<{ bundle_id: number; total_price: number }>(
        "/nomad/bundles/checkout",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            roost_id: selectedRoost.id,
            start_date: dateRange.start,
            end_date: dateRange.end,
            items: selectedRootIds.map((rootId) => ({
              root_id: rootId,
              scheduled_date: dateRange.start,
              quantity: 1,
            })),
          }),
        }
      );
      setPaymentOpen(false);
      setToast({ message: `Booking confirmed. Bundle #${result.bundle_id}` });
      setStep("find");
      setShowRoostResults(false);
      setRoostResults([]);
      setSelectedRoost(null);
      setRootResults([]);
      setSelectedRootIds([]);
      setBundlePreview(null);
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={styles.page} data-testid={testIds.inventory.page}>
      <header className={styles.header} data-testid={testIds.inventory.header}>
        <h1>Find - Select - Bundle - Book</h1>
      </header>

      {profile ? (
        <>
          {step === "find" && (
            <section className={styles.fullWidthCard}>
              <div className={styles.cardHeader}>
                <h2>Find Your Next Roost</h2>
                <p>Search by location and choose your stay dates first.</p>
              </div>

              <div className={styles.findFields}>
                <label className={styles.label}>
                  Location Search
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Where are you roosting next?"
                  />
                </label>
                <label className={styles.label}>
                  Start Date
                  <input
                    type="date"
                    min={todayIso}
                    value={dateRange.start}
                    onChange={(event) =>
                      setDateRange((prev) => ({ ...prev, start: event.target.value }))
                    }
                  />
                </label>
                <label className={styles.label}>
                  End Date
                  <input
                    type="date"
                    min={dateRange.start || todayIso}
                    value={dateRange.end}
                    onChange={(event) =>
                      setDateRange((prev) => ({ ...prev, end: event.target.value }))
                    }
                  />
                </label>
              </div>

              <button type="button" className={styles.primary} onClick={handleFindExplore}>
                Find & Explore
              </button>

              {showRoostResults && (
                <div className={styles.resultBlock}>
                  <h3>Roost Listings</h3>
                  {roostResults.length === 0 ? (
                    <p className={styles.empty}>No roosts found for this search.</p>
                  ) : (
                    roostResults.map((roost) => (
                      <article key={roost.id} className={styles.listItem}>
                        <div>
                          <strong>{roost.title}</strong>
                          <p>
                            {roost.bedroom_type} • Wi-Fi {roost.wifi_speed_mbps} Mbps
                          </p>
                          <p>{roost.place_name || "Location pending"}</p>
                        </div>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={
                              selectedRoost?.id === roost.id
                                ? styles.selected
                                : styles.secondary
                            }
                            onClick={() => handleSelectRoost(roost)}
                          >
                            {selectedRoost?.id === roost.id ? "Selected" : "Select"}
                          </button>
                          <button
                            type="button"
                            className={styles.ghost}
                            onClick={() => setRoostDetail(roost)}
                          >
                            View
                          </button>
                        </div>
                        {selectedRoost?.id === roost.id && (
                          <div className={styles.inlineExpand}>
                            <label className={styles.label}>
                              Start Date
                              <input
                                type="date"
                                min={todayIso}
                                value={dateRange.start}
                                onChange={(event) =>
                                  setDateRange((prev) => ({
                                    ...prev,
                                    start: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className={styles.label}>
                              End Date
                              <input
                                type="date"
                                min={dateRange.start || todayIso}
                                value={dateRange.end}
                                onChange={(event) =>
                                  setDateRange((prev) => ({
                                    ...prev,
                                    end: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className={styles.primary}
                              onClick={handleContinueToBuild}
                            >
                              Continue to Build Your Stay
                            </button>
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              )}
            </section>
          )}

          {step === "build" && selectedRoost && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Build Your Stay</h2>
                <p>
                  Roots for {selectedRoost.place_name || "your selected roost"} filtered
                  by your stay dates.
                </p>
              </div>

              <div className={styles.resultBlock}>
                <h3>Root Services</h3>
                {rootResults.length === 0 ? (
                  <p className={styles.empty}>No services available for this roost.</p>
                ) : (
                  rootResults.map((root) => {
                    const isSelected = selectedRootIds.includes(root.id);
                    return (
                      <article key={root.id} className={styles.listItem}>
                        <div>
                          <strong>{root.service_category}</strong>
                          <p>{root.service_description}</p>
                          <p>
                            {root.place_name || "Location pending"} • {root.available_days || "Any day"}
                          </p>
                        </div>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={isSelected ? styles.selected : styles.secondary}
                            onClick={() => toggleRootSelection(root.id)}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                          <button
                            type="button"
                            className={styles.ghost}
                            onClick={() => setRootDetail(root)}
                          >
                            View
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <div className={styles.footerActions}>
                <button type="button" className={styles.ghost} onClick={() => setStep("find")}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={handleContinueToBundle}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {step === "bundle" && selectedRoost && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>The Stay Bundle</h2>
                <p>Review your final selection before purchase.</p>
              </div>

              <div className={styles.summary}>
                <h3>Selected Roost</h3>
                <p>{selectedRoost.title}</p>
                <p>{selectedRoost.place_name || "Location pending"}</p>
              </div>

              <div className={styles.summary}>
                <h3>Selected Root Services</h3>
                {selectedRoots.length === 0 ? (
                  <p className={styles.empty}>No services selected.</p>
                ) : (
                  selectedRoots.map((root) => (
                    <p key={root.id}>
                      {root.service_category}: {root.service_description}
                    </p>
                  ))
                )}
              </div>

              {bundlePreview && (
                <div className={styles.summary}>
                  <h3>Final Total</h3>
                  <p>Room: {bundlePreview.roost_price}</p>
                  <p>Services: {bundlePreview.services_price}</p>
                  <p className={styles.total}>Total: {bundlePreview.total_price}</p>
                </div>
              )}

              <div className={styles.footerActions}>
                <button type="button" className={styles.ghost} onClick={() => setStep("build")}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => setPaymentOpen(true)}
                >
                  Purchase / Book
                </button>
              </div>
            </section>
          )}
        </>
      ) : null}

      {roostDetail && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{roostDetail.title}</h3>
            <p>Type: {roostDetail.bedroom_type}</p>
            <p>Bedrooms: {roostDetail.bedroom_count ?? "N/A"}</p>
            <p>Wi-Fi: {roostDetail.wifi_speed_mbps} Mbps</p>
            <p>Rate: {roostDetail.nightly_rate ?? 0}</p>
            <p>Place: {roostDetail.place_name || "Location pending"}</p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setRoostDetail(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {rootDetail && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{rootDetail.service_category}</h3>
            <p>{rootDetail.service_description}</p>
            <p>Capacity: {rootDetail.service_capacity}</p>
            <p>Price: {rootDetail.base_price ?? 0}</p>
            <p>Days: {rootDetail.available_days || "Any"}</p>
            <p>
              Window: {rootDetail.service_window_start || "--"} -{" "}
              {rootDetail.service_window_end || "--"}
            </p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setRootDetail(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {paymentOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>Payment</h3>
            <p>This confirms your booking in one checkout.</p>
            {bundlePreview && <p className={styles.total}>Amount: {bundlePreview.total_price}</p>}
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => setPaymentOpen(false)}
                disabled={paying}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={handleBookNow}
                disabled={paying}
              >
                {paying ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
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
