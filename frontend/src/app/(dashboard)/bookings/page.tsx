"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import styles from "./page.module.css";

type Profile = {
  role: string;
};

type NomadBookingItem = {
  bundle_id: number;
  roost_id: number;
  roost_title: string | null;
  roost_place_name: string | null;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  services: string[];
};

type NomadBookings = {
  active_upcoming: NomadBookingItem[];
  past_stays: NomadBookingItem[];
  cancelled_pending: NomadBookingItem[];
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<NomadBookings>({
    active_upcoming: [],
    past_stays: [],
    cancelled_pending: [],
  });
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({
    message: "",
  });
  const [selectedBooking, setSelectedBooking] = useState<NomadBookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
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
        if (profile.role !== "nomad") {
          router.replace("/dashboard");
          return;
        }
        const data = await apiFetch<NomadBookings>("/nomad/bookings", { token });
        setBookings(data);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router]);

  const allForCalendar = useMemo(
    () => [
      ...bookings.active_upcoming.map((item) => ({ ...item, group: "active" as const })),
      ...bookings.past_stays.map((item) => ({ ...item, group: "past" as const })),
      ...bookings.cancelled_pending.map((item) => ({ ...item, group: "pending" as const })),
    ],
    [bookings]
  );

  const calendarDays = useMemo(() => {
    const start = new Date(monthAnchor);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      const iso = day.toISOString().split("T")[0];
      const markers = allForCalendar.filter(
        (booking) => booking.start_date <= iso && booking.end_date >= iso
      );
      return { day, iso, markers };
    });
  }, [allForCalendar, monthAnchor]);

  const getCountdownLabel = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(startDate);
    checkIn.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((checkIn.getTime() - today.getTime()) / 86400000);
    if (diffDays <= 0) return "Check-in today";
    if (diffDays === 1) return "1 day until check-in";
    return `${diffDays} days until check-in`;
  };

  const isUpcomingCancellable = (booking: NomadBookingItem) => {
    const status = booking.status.toLowerCase();
    if (status === "cancelled" || status === "canceled" || status === "pending") {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(booking.start_date);
    start.setHours(0, 0, 0, 0);
    return start >= today;
  };

  const reloadBookings = async () => {
    const token = getToken();
    if (!token) return;
    const data = await apiFetch<NomadBookings>("/nomad/bookings", { token });
    setBookings(data);
  };

  const cancelBooking = async () => {
    if (!selectedBooking) return;
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      setCancelling(true);
      await apiFetch(`/nomad/bookings/${selectedBooking.bundle_id}/cancel`, {
        method: "PUT",
        token,
      });
      await reloadBookings();
      setSelectedBooking((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      setToast({ message: "Booking cancelled successfully." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Bookings</h1>
        <p>Manage upcoming stays, memories, and pending statuses in one place.</p>
      </header>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Calendar View</h2>
          <div className={styles.monthNav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() =>
                setMonthAnchor(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                )
              }
            >
              {"<"}
            </button>
            <p>{monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" })}</p>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() =>
                setMonthAnchor(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                )
              }
            >
              {">"}
            </button>
          </div>
        </div>
        <div className={styles.weekdays}>
          {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className={styles.calendarGrid}>
          {calendarDays.map((entry) => (
            <div key={entry.iso} className={styles.calendarCell}>
              <span className={styles.dayNum}>{entry.day.getDate()}</span>
              <div className={styles.markers}>
                {entry.markers.slice(0, 3).map((marker) => (
                  <button
                    key={`${entry.iso}-${marker.bundle_id}-${marker.group}`}
                    className={
                      marker.group === "active"
                        ? styles.markerActive
                        : marker.group === "past"
                          ? styles.markerPast
                          : styles.markerPending
                    }
                    onClick={() => setSelectedBooking(marker)}
                    aria-label={`Open booking ${marker.bundle_id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.columns}>
        <article className={styles.card}>
          <h2>Active/Upcoming Bookings</h2>
          {bookings.active_upcoming.length === 0 ? (
            <p className={styles.empty}>No upcoming stays yet.</p>
          ) : (
            bookings.active_upcoming.map((booking) => (
              <div key={booking.bundle_id} className={styles.item}>
                <strong>{booking.roost_title || `Roost #${booking.roost_id}`}</strong>
                <p>{booking.roost_place_name || "Location pending"}</p>
                <p>
                  {booking.start_date} to {booking.end_date}
                </p>
                <p className={styles.highlight}>{getCountdownLabel(booking.start_date)}</p>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => setSelectedBooking(booking)}
                >
                  View Booking
                </button>
              </div>
            ))
          )}
        </article>

        <article className={styles.card}>
          <h2>Past Stays</h2>
          {bookings.past_stays.length === 0 ? (
            <p className={styles.empty}>No past stays yet.</p>
          ) : (
            bookings.past_stays.map((booking) => (
              <div key={booking.bundle_id} className={styles.item}>
                <strong>{booking.roost_title || `Roost #${booking.roost_id}`}</strong>
                <p>{booking.roost_place_name || "Location pending"}</p>
                <p>
                  {booking.start_date} to {booking.end_date}
                </p>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => router.push("/inventory")}
                >
                  Rebook
                </button>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setSelectedBooking(booking)}
                >
                  View Booking
                </button>
              </div>
            ))
          )}
        </article>

        <article className={styles.card}>
          <h2>Cancelled/Pending</h2>
          {bookings.cancelled_pending.length === 0 ? (
            <p className={styles.empty}>No cancelled or pending bookings.</p>
          ) : (
            bookings.cancelled_pending.map((booking) => (
              <div key={booking.bundle_id} className={styles.item}>
                <strong>{booking.roost_title || `Roost #${booking.roost_id}`}</strong>
                <p>{booking.roost_place_name || "Location pending"}</p>
                <p>
                  {booking.start_date} to {booking.end_date}
                </p>
                <p className={styles.status}>Status: {booking.status.toUpperCase()}</p>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setSelectedBooking(booking)}
                >
                  View Booking
                </button>
              </div>
            ))
          )}
        </article>
      </section>

      {selectedBooking && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{selectedBooking.roost_title || `Roost #${selectedBooking.roost_id}`}</h3>
            <p>{selectedBooking.roost_place_name || "Location pending"}</p>
            <p>
              Stay: {selectedBooking.start_date} to {selectedBooking.end_date}
            </p>
            <p>Total: {selectedBooking.total_price}</p>
            <p>Status: {selectedBooking.status.toUpperCase()}</p>
            <div className={styles.serviceList}>
              <strong>Booked Root Services</strong>
              {selectedBooking.services.length === 0 ? (
                <p>No root services booked.</p>
              ) : (
                selectedBooking.services.map((service, idx) => (
                  <p key={`${selectedBooking.bundle_id}-${idx}`}>{service}</p>
                ))
              )}
            </div>
            <div className={styles.modalActions}>
              {isUpcomingCancellable(selectedBooking) && (
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={cancelBooking}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
      />
    </div>
  );
}
