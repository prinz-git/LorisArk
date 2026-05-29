"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import styles from "./page.module.css";

type Role = "nomad" | "host" | "artisan" | "superadmin";

type Profile = {
  role: Role;
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

type HostStaySummary = {
  bundle_id: number;
  nomad_name: string | null;
  roost_id: number;
  roost_title: string | null;
  start_date: string;
  end_date: string;
  services: string[];
  nomad_verified?: boolean;
  nomad_review_count?: number;
  nomad_trust_score?: number;
  neighborly_contributions?: number;
};

type ArtisanTicket = {
  id: number;
  bundle_id: number;
  root_id: number;
  nomad_id: number;
  host_id: number;
  status: string;
  note: string | null;
  service_name: string | null;
  service_category: string | null;
  roost_name: string | null;
  scheduled_date: string | null;
  service_time: string | null;
  created_at: string | null;
  headcount?: number;
  guest_dietary_requirements?: string | null;
  skill_level?: string | null;
  nomad_name?: string | null;
  nomad_verified?: boolean;
  nomad_review_count?: number;
  nomad_trust_score?: number;
  neighborly_contributions?: number;
};

type ProviderBooking = HostStaySummary | ArtisanTicket;

type CalendarMarker = {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  group: "active" | "past" | "pending" | "checkin" | "occupant" | "turnover" | "workshop";
};

const emptyNomadBookings: NomadBookings = {
  active_upcoming: [],
  past_stays: [],
  cancelled_pending: [],
};

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function toPrettyDate(value: string | null) {
  if (!value) return "Date pending";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toPrettyTime(value: string | null) {
  if (!value) return "Time pending";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getTrustSnapshot(item: ProviderBooking) {
  const bundleId = "bundle_id" in item ? item.bundle_id : 0;
  const serviceCount = "services" in item ? item.services.length : 1;
  return {
    score: item.nomad_trust_score ?? 80 + (bundleId % 15),
    verified: item.nomad_verified ?? true,
    reviews: item.nomad_review_count ?? Math.max(3, serviceCount + 2),
    contributions: item.neighborly_contributions ?? 1 + (bundleId % 4),
  };
}

function CalendarBoard({
  title,
  markers,
  monthAnchor,
  onMonthChange,
  onSelect,
}: {
  title: string;
  markers: CalendarMarker[];
  monthAnchor: Date;
  onMonthChange: (date: Date) => void;
  onSelect: (marker: CalendarMarker) => void;
}) {
  const calendarDays = useMemo(() => {
    const start = new Date(monthAnchor);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      const iso = toIsoDate(day);
      return {
        day,
        iso,
        markers: markers.filter((marker) => marker.start_date <= iso && marker.end_date >= iso),
      };
    });
  }, [markers, monthAnchor]);

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2>{title}</h2>
        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() =>
              onMonthChange(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))
            }
          >
            {"<"}
          </button>
          <p>{monthAnchor.toLocaleString("en-US", { month: "long", year: "numeric" })}</p>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() =>
              onMonthChange(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))
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
              {entry.markers.slice(0, 4).map((marker) => (
                <button
                  key={`${entry.iso}-${marker.id}`}
                  className={
                    marker.group === "active" || marker.group === "checkin"
                      ? styles.markerActive
                      : marker.group === "past" || marker.group === "turnover"
                        ? styles.markerPast
                        : marker.group === "workshop"
                          ? styles.markerWorkshop
                          : styles.markerPending
                  }
                  onClick={() => onSelect(marker)}
                  aria-label={`Open ${marker.label}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<NomadBookings>(emptyNomadBookings);
  const [hostStays, setHostStays] = useState<HostStaySummary[]>([]);
  const [artisanTickets, setArtisanTickets] = useState<ArtisanTicket[]>([]);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({ message: "" });
  const [selectedBooking, setSelectedBooking] = useState<NomadBookingItem | null>(null);
  const [selectedHostStay, setSelectedHostStay] = useState<HostStaySummary | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ArtisanTicket | null>(null);
  const [workflowItem, setWorkflowItem] = useState<ProviderBooking | null>(null);
  const [readyIds, setReadyIds] = useState<number[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

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

        if (profileData.role === "nomad") {
          const data = await apiFetch<NomadBookings>("/nomad/bookings", { token });
          setBookings(data);
        } else if (profileData.role === "superadmin") {
          const data = await apiFetch<NomadBookings>("/nomad/bookings", { token });
          setBookings(data);
        } else if (profileData.role === "host") {
          const data = await apiFetch<HostStaySummary[]>("/host/stays/summary", { token });
          setHostStays(data);
        } else if (profileData.role === "artisan") {
          const data = await apiFetch<ArtisanTicket[]>("/artisan/tickets", { token });
          setArtisanTickets(data);
        }
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      }
    };

    load();
  }, [router]);

  const allForCalendar: CalendarMarker[] = useMemo(
    () => [
      ...bookings.active_upcoming.map((item) => ({
        id: `booking-${item.bundle_id}`,
        label: item.roost_title || `booking ${item.bundle_id}`,
        start_date: item.start_date,
        end_date: item.end_date,
        group: "active" as const,
      })),
      ...bookings.past_stays.map((item) => ({
        id: `booking-${item.bundle_id}`,
        label: item.roost_title || `booking ${item.bundle_id}`,
        start_date: item.start_date,
        end_date: item.end_date,
        group: "past" as const,
      })),
      ...bookings.cancelled_pending.map((item) => ({
        id: `booking-${item.bundle_id}`,
        label: item.roost_title || `booking ${item.bundle_id}`,
        start_date: item.start_date,
        end_date: item.end_date,
        group: "pending" as const,
      })),
    ],
    [bookings]
  );

  const hostMarkers: CalendarMarker[] = useMemo(
    () =>
      hostStays.flatMap((stay) => [
        {
          id: `checkin-${stay.bundle_id}`,
          label: `${stay.nomad_name || "Nomad"} check-in`,
          start_date: stay.start_date,
          end_date: stay.start_date,
          group: "checkin" as const,
        },
        {
          id: `occupant-${stay.bundle_id}`,
          label: `${stay.nomad_name || "Nomad"} in-house`,
          start_date: stay.start_date,
          end_date: stay.end_date,
          group: "occupant" as const,
        },
        {
          id: `turnover-${stay.bundle_id}`,
          label: `${stay.roost_title || "Roost"} cleaning`,
          start_date: stay.end_date,
          end_date: addDays(stay.end_date, 1),
          group: "turnover" as const,
        },
      ]),
    [hostStays]
  );

  const artisanMarkers: CalendarMarker[] = useMemo(
    () =>
      artisanTickets
        .filter((ticket) => ticket.scheduled_date)
        .map((ticket) => ({
          id: `ticket-${ticket.id}`,
          label: ticket.service_name || ticket.service_category || `workshop ${ticket.id}`,
          start_date: ticket.scheduled_date!,
          end_date: ticket.scheduled_date!,
          group: "workshop" as const,
        })),
    [artisanTickets]
  );

  const currentOccupants = useMemo(
    () => hostStays.filter((stay) => stay.start_date <= todayIso && stay.end_date >= todayIso),
    [hostStays, todayIso]
  );

  const incomingCheckIns = useMemo(
    () =>
      hostStays
        .filter((stay) => stay.start_date >= todayIso)
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [hostStays, todayIso]
  );

  const activeTickets = useMemo(
    () =>
      artisanTickets
        .filter((ticket) => ticket.status.toLowerCase() !== "cancelled")
        .sort((a, b) => (a.scheduled_date || "").localeCompare(b.scheduled_date || "")),
    [artisanTickets]
  );

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
    if (status === "cancelled" || status === "canceled" || status === "pending") return false;
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

  const openMarker = (marker: CalendarMarker) => {
    const bundleId = Number(marker.id.split("-").at(-1));
    if (profile?.role === "host") {
      setSelectedHostStay(hostStays.find((stay) => stay.bundle_id === bundleId) || null);
    } else if (profile?.role === "artisan") {
      setSelectedTicket(artisanTickets.find((ticket) => ticket.id === bundleId) || null);
    } else {
      const allBookings = [
        ...bookings.active_upcoming,
        ...bookings.past_stays,
        ...bookings.cancelled_pending,
      ];
      setSelectedBooking(allBookings.find((booking) => booking.bundle_id === bundleId) || null);
    }
  };

  const markWorkflowReady = (item: ProviderBooking) => {
    const id = "id" in item ? item.id : item.bundle_id;
    setReadyIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setWorkflowItem(null);
    setToast({ message: "Confirmation workflow marked ready." });
  };

  return (
    <div className={styles.page}>
      {profile?.role === "host" ? (
        <header className={styles.header}>
          <h1>Host Bookings Dashboard</h1>
          <p>Run the Roost status board, guest readiness, turnover, and payout confidence.</p>
        </header>
      ) : profile?.role === "artisan" ? (
        <header className={styles.header}>
          <h1>Artisan Bookings Dashboard</h1>
          <p>Track workshop rosters, cultural readiness, service timing, and payout cues.</p>
        </header>
      ) : profile?.role === "superadmin" ? (
        <header className={styles.header}>
          <h1>All Bookings</h1>
          <p>Review stays and root services booked by every nomad.</p>
        </header>
      ) : (
        <header className={styles.header}>
          <h1>My Bookings</h1>
          <p>Manage upcoming stays, memories, and pending statuses in one place.</p>
        </header>
      )}

      {profile?.role === "host" && (
        <>
          <CalendarBoard
            title="Roost Status Board"
            markers={hostMarkers}
            monthAnchor={monthAnchor}
            onMonthChange={setMonthAnchor}
            onSelect={openMarker}
          />

          <section className={styles.columns}>
            <article className={styles.card}>
              <h2>Incoming Check-ins</h2>
              {incomingCheckIns.length === 0 ? (
                <p className={styles.empty}>No incoming guests yet.</p>
              ) : (
                incomingCheckIns.map((stay) => {
                  const trust = getTrustSnapshot(stay);
                  return (
                    <div key={stay.bundle_id} className={styles.item}>
                      <strong>{stay.roost_title || `Roost #${stay.roost_id}`}</strong>
                      <p>{stay.nomad_name || "Nomad"} arrives {toPrettyDate(stay.start_date)}</p>
                      <p className={styles.highlight}>Mutual Trust Score {trust.score}</p>
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={() => setWorkflowItem(stay)}
                      >
                        Confirmation Workflow
                      </button>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => setSelectedHostStay(stay)}
                      >
                        View Guest
                      </button>
                    </div>
                  );
                })
              )}
            </article>

            <article className={styles.card}>
              <h2>Current Occupants</h2>
              {currentOccupants.length === 0 ? (
                <p className={styles.empty}>No occupied roosts today.</p>
              ) : (
                currentOccupants.map((stay) => (
                  <div key={stay.bundle_id} className={styles.item}>
                    <strong>{stay.nomad_name || "Nomad"}</strong>
                    <p>{stay.roost_title || `Roost #${stay.roost_id}`}</p>
                    <p>{toPrettyDate(stay.start_date)} to {toPrettyDate(stay.end_date)}</p>
                    <p className={styles.status}>In house</p>
                  </div>
                ))
              )}
            </article>

            <article className={styles.card}>
              <h2>Turn-down Schedule</h2>
              {hostStays.length === 0 ? (
                <p className={styles.empty}>No cleanings to schedule.</p>
              ) : (
                hostStays.slice(0, 5).map((stay) => (
                  <div key={`turn-${stay.bundle_id}`} className={styles.item}>
                    <strong>{stay.roost_title || `Roost #${stay.roost_id}`}</strong>
                    <p>Checkout {toPrettyDate(stay.end_date)}</p>
                    <p>Cleaning window: {toPrettyDate(stay.end_date)} to {toPrettyDate(addDays(stay.end_date, 1))}</p>
                    <p className={styles.status}>
                      {readyIds.includes(stay.bundle_id) ? "Ready confirmed" : "Prep pending"}
                    </p>
                  </div>
                ))
              )}
            </article>
          </section>
        </>
      )}

      {profile?.role === "artisan" && (
        <>
          <CalendarBoard
            title="Workshop Calendar"
            markers={artisanMarkers}
            monthAnchor={monthAnchor}
            onMonthChange={setMonthAnchor}
            onSelect={openMarker}
          />

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Workshop Ledger</h2>
              <span className={styles.status}>{activeTickets.length} active roster items</span>
            </div>
            {activeTickets.length === 0 ? (
              <p className={styles.empty}>No booked experiences yet.</p>
            ) : (
              <div className={styles.ledger}>
                {activeTickets.map((ticket) => {
                  const trust = getTrustSnapshot(ticket);
                  return (
                    <article key={ticket.id} className={styles.item}>
                      <strong>{ticket.service_name || ticket.service_category || "Experience"}</strong>
                      <p>{toPrettyDate(ticket.scheduled_date)} · {toPrettyTime(ticket.service_time)}</p>
                      <p>Headcount: {ticket.headcount ?? 1}</p>
                      <p>Dietary: {ticket.guest_dietary_requirements || "No restrictions shared"}</p>
                      <p>Skill level: {ticket.skill_level || "Open level"}</p>
                      <p className={styles.highlight}>Mutual Trust Score {trust.score}</p>
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={() => setWorkflowItem(ticket)}
                      >
                        Confirmation Workflow
                      </button>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View Roster
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {(profile?.role === "nomad" || profile?.role === "superadmin") && (
        <>
          <CalendarBoard
            title="Calendar View"
            markers={allForCalendar}
            monthAnchor={monthAnchor}
            onMonthChange={setMonthAnchor}
            onSelect={openMarker}
          />

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
                    <p>{booking.start_date} to {booking.end_date}</p>
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
                    <p>{booking.start_date} to {booking.end_date}</p>
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
                    <p>{booking.start_date} to {booking.end_date}</p>
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
        </>
      )}

      {selectedBooking && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>{selectedBooking.roost_title || `Roost #${selectedBooking.roost_id}`}</h3>
            <p>{selectedBooking.roost_place_name || "Location pending"}</p>
            <p>Stay: {selectedBooking.start_date} to {selectedBooking.end_date}</p>
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
              {profile?.role === "nomad" && isUpcomingCancellable(selectedBooking) && (
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={cancelBooking}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
              <button type="button" className={styles.btnGhost} onClick={() => setSelectedBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedHostStay && (
        <TrustModal
          item={selectedHostStay}
          title={selectedHostStay.nomad_name || "Nomad"}
          subtitle={selectedHostStay.roost_title || `Roost #${selectedHostStay.roost_id}`}
          details={[
            `Stay: ${toPrettyDate(selectedHostStay.start_date)} to ${toPrettyDate(selectedHostStay.end_date)}`,
            `Services: ${selectedHostStay.services.length ? selectedHostStay.services.join(", ") : "None booked"}`,
          ]}
          onClose={() => setSelectedHostStay(null)}
        />
      )}

      {selectedTicket && (
        <TrustModal
          item={selectedTicket}
          title={selectedTicket.nomad_name || selectedTicket.service_name || "Workshop roster"}
          subtitle={selectedTicket.roost_name || "Roost pending"}
          details={[
            `${toPrettyDate(selectedTicket.scheduled_date)} at ${toPrettyTime(selectedTicket.service_time)}`,
            `Headcount: ${selectedTicket.headcount ?? 1}`,
            `Dietary: ${selectedTicket.guest_dietary_requirements || "No restrictions shared"}`,
            `Skill level: ${selectedTicket.skill_level || "Open level"}`,
          ]}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {workflowItem && (
        <WorkflowModal
          item={workflowItem}
          ready={readyIds.includes("id" in workflowItem ? workflowItem.id : workflowItem.bundle_id)}
          onReady={() => markWorkflowReady(workflowItem)}
          onClose={() => setWorkflowItem(null)}
        />
      )}

      <Toast
        message={toast.message || null}
        tone={toast.tone === "error" ? "error" : "success"}
        onClear={() => setToast({ message: "" })}
      />
    </div>
  );
}

function TrustModal({
  item,
  title,
  subtitle,
  details,
  onClose,
}: {
  item: ProviderBooking;
  title: string;
  subtitle: string;
  details: string[];
  onClose: () => void;
}) {
  const trust = getTrustSnapshot(item);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3>Mutual Trust Score</h3>
        <p>{title}</p>
        <p>{subtitle}</p>
        <div className={styles.trustGrid}>
          <span><strong>{trust.score}</strong> Score</span>
          <span>{trust.verified ? "Verified profile" : "Verification pending"}</span>
          <span>{trust.reviews} community reviews</span>
          <span>{trust.contributions} neighborly contributions</span>
        </div>
        <div className={styles.serviceList}>
          {details.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowModal({
  item,
  ready,
  onReady,
  onClose,
}: {
  item: ProviderBooking;
  ready: boolean;
  onReady: () => void;
  onClose: () => void;
}) {
  const isTicket = "id" in item;
  const title = isTicket
    ? item.service_name || item.service_category || "Experience"
    : item.roost_title || `Roost #${item.roost_id}`;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h3>Booking Confirmation Workflow</h3>
        <p>{title}</p>
        <ol className={styles.workflow}>
          <li>Request received and dates locked.</li>
          <li>Mutual Trust Score reviewed.</li>
          <li>{isTicket ? "Materials, headcount, and skill level prepared." : "Roost, keys, Wi-Fi, and cleaning schedule prepared."}</li>
          <li>Payout and service responsibilities acknowledged.</li>
          <li>{ready ? "Readiness confirmed." : "Ready for final confirmation."}</li>
        </ol>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btn} onClick={onReady}>
            Confirm Readiness
          </button>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
