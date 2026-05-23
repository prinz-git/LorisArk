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

type HostStaySummary = {
  bundle_id: number;
  nomad_name: string | null;
  roost_id: number;
  roost_title: string | null;
  start_date: string;
  end_date: string;
  services: string[];
  status?: string;
  nomad_bio?: string | null;
  nomad_avatar?: string | null;
  verified_id?: boolean;
  verified_payment?: boolean;
  community_reviews?: string[];
};

type ArtisanTicket = {
  id: number;
  bundle_id?: number;
  status: string;
  host_status?: string | null;
  host_name?: string | null;
  host_confirmation_message?: string | null;
  service_name: string | null;
  service_category: string | null;
  roost_name: string | null;
  scheduled_date: string | null;
  service_time: string | null;
  nomad_name?: string | null;
  nomad_bio?: string | null;
  nomad_avatar?: string | null;
  verified_id?: boolean;
  verified_payment?: boolean;
  community_reviews?: string[];
};

type RequestItem =
  | ({ source: "host" } & HostStaySummary)
  | ({ source: "artisan" } & ArtisanTicket);

const declineReasons = ["Dates Unavailable", "Maintenance", "Capacity Reached", "Not a Fit"];

function toPrettyDate(value: string | null): string {
  if (!value) return "Date pending";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toPrettyTime(value: string | null): string {
  if (!value) return "Anytime";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function requestId(item: RequestItem) {
  return item.source === "host" ? `host-${item.bundle_id}` : `artisan-${item.id}`;
}

function requestStatus(item: RequestItem) {
  return (item.status || "confirmed").toLowerCase();
}

function isPending(item: RequestItem) {
  return [
    "new",
    "pending",
    "requested",
    "request",
    "pending_host",
    "pending_artisan",
  ].includes(requestStatus(item));
}

function isActionable(item: RequestItem) {
  if (item.source === "host") {
    return ["pending_host", "pending", "requested", "request", "new"].includes(
      requestStatus(item)
    );
  }
  return requestStatus(item) === "pending_artisan";
}

function guestName(item: RequestItem) {
  return item.nomad_name || "Nomad Guest";
}

function itemTitle(item: RequestItem) {
  if (item.source === "host") return item.roost_title || `Roost #${item.roost_id}`;
  return item.service_name || item.service_category || "Workshop";
}

function itemWhen(item: RequestItem) {
  if (item.source === "host") {
    return `${toPrettyDate(item.start_date)} to ${toPrettyDate(item.end_date)}`;
  }
  return `${toPrettyDate(item.scheduled_date)} at ${toPrettyTime(item.service_time)}`;
}

function profileReviews(item: RequestItem) {
  return item.community_reviews?.length
    ? item.community_reviews
    : [
        "Thoughtful guest, clear communicator, and respectful of shared spaces.",
        "Arrived prepared and contributed kindly to the local rhythm.",
      ];
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hostSummaries, setHostSummaries] = useState<HostStaySummary[]>([]);
  const [artisanTickets, setArtisanTickets] = useState<ArtisanTicket[]>([]);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<RequestItem | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: "error" }>({ message: "" });
  const [loading, setLoading] = useState(true);

  const roleOption = defaultRoleOptions.find((option) => option.id === profile?.role);
  const roleTitle = roleOption?.title || profile?.role || "";
  const roleLabel = roleOption?.label || "Role";

  const loadProviderData = async (role: Profile["role"], token: string) => {
    if (role === "host") {
      const summaries = await apiFetch<HostStaySummary[]>("/host/stays/summary", { token });
      setHostSummaries(summaries);
    } else if (role === "artisan") {
      const tickets = await apiFetch<ArtisanTicket[]>("/artisan/tickets", { token });
      setArtisanTickets(tickets);
    }
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

        await loadProviderData(profileData.role, token);
      } catch (error) {
        setToast({ message: (error as Error).message, tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const allItems = useMemo<RequestItem[]>(() => {
    if (profile?.role === "host") {
      return hostSummaries.map((stay) => ({ ...stay, source: "host" as const }));
    }
    if (profile?.role === "artisan") {
      return artisanTickets.map((ticket) => ({ ...ticket, source: "artisan" as const }));
    }
    return [];
  }, [artisanTickets, hostSummaries, profile?.role]);

  const pendingRequests = useMemo(
    () => allItems.filter((item) => isPending(item)),
    [allItems]
  );

  const upcomingBookings = useMemo(
    () =>
      allItems
        .filter((item) =>
          ["host_accepted", "artisan_accepted", "confirmed", "paid"].includes(
            requestStatus(item)
          )
        )
        .sort((a, b) => itemWhen(a).localeCompare(itemWhen(b))),
    [allItems]
  );

  const reloadCurrentRole = async () => {
    const token = getToken();
    if (!token || !profile) return;
    await loadProviderData(profile.role, token);
  };

  const acceptRequest = async (item: RequestItem) => {
    if (!isActionable(item)) return;
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      if (item.source === "host") {
        await apiFetch(`/host/bookings/${item.bundle_id}/accept`, { method: "PUT", token });
      } else {
        await apiFetch(`/artisan/tickets/${item.id}/accept`, { method: "PUT", token });
      }
      setDecliningId(null);
      await reloadCurrentRole();
      setToast({ message: "Booking accepted and guest confirmation triggered." });
    } catch (error) {
      setToast({ message: (error as Error).message, tone: "error" });
    }
  };

  const declineRequest = async (item: RequestItem, reason: string) => {
    if (!isActionable(item)) return;
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      if (item.source === "host") {
        await apiFetch(`/host/bookings/${item.bundle_id}/decline`, {
          method: "PUT",
          token,
          body: JSON.stringify({ reason }),
        });
      } else {
        await apiFetch(`/artisan/tickets/${item.id}/decline`, {
          method: "PUT",
          token,
          body: JSON.stringify({ reason }),
        });
      }
      setDecliningId(null);
      await reloadCurrentRole();
      setToast({ message: `Request declined: ${reason}.` });
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

      <section className={styles.surface} data-testid={testIds.dashboard.cards}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Pending Requests</h2>
            <p className={styles.muted}>Accept, decline, and keep the queue moving from one place.</p>
          </div>
          <span className={styles.countBadge}>{pendingRequests.length} waiting</span>
        </div>

        {pendingRequests.length === 0 ? (
          <p className={styles.empty}>No pending requests right now.</p>
        ) : (
          <div className={styles.requestGrid}>
            {pendingRequests.map((item) => {
              const id = requestId(item);
              return (
                <article key={id} className={styles.requestCard}>
                  <div>
                    <p className={styles.cardKicker}>{item.source === "host" ? "Accommodation" : "Workshop"}</p>
                    <h3>{itemTitle(item)}</h3>
                    <p className={styles.muted}>{itemWhen(item)}</p>
                    <button
                      type="button"
                      className={styles.guestLink}
                      onClick={() => setSelectedGuest(item)}
                    >
                      {guestName(item)}
                    </button>
                    <p className={styles.snippet}>
                      {item.nomad_bio || "Looking for a grounded local stay with thoughtful community connection."}
                    </p>
                  </div>

                  <div className={styles.cardActions}>
                    {isActionable(item) ? (
                      <>
                        <button type="button" className={styles.accept} onClick={() => acceptRequest(item)}>
                          Accept
                        </button>
                        <button
                          type="button"
                          className={styles.decline}
                          onClick={() => setDecliningId(decliningId === id ? null : id)}
                        >
                          Decline
                        </button>
                        {decliningId === id && (
                          <div className={styles.reasonMenu}>
                            {declineReasons.map((reason) => (
                              <button
                                key={reason}
                                type="button"
                                onClick={() => declineRequest(item, reason)}
                              >
                                {reason}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className={styles.waitingNote}>
                        {item.source === "artisan" && item.host_confirmation_message
                          ? item.host_confirmation_message
                          : "Pending confirmation"}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.surface}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Upcoming Bookings</h2>
            <p className={styles.muted}>Confirmed stays and experiences in chronological order.</p>
          </div>
          <span className={styles.countBadge}>{upcomingBookings.length} confirmed</span>
        </div>

        {upcomingBookings.length === 0 ? (
          <p className={styles.empty}>No confirmed bookings yet.</p>
        ) : (
          <div className={styles.agenda}>
            {upcomingBookings.map((item) => (
              <article key={requestId(item)} className={styles.agendaRow}>
                <div>
                  <strong>{itemTitle(item)}</strong>
                  <p>{itemWhen(item)}</p>
                </div>
                <button type="button" className={styles.guestLink} onClick={() => setSelectedGuest(item)}>
                  {guestName(item)}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedGuest && (
        <aside className={styles.drawerOverlay} aria-label="Nomad profile drawer">
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.avatar}>
                {selectedGuest.nomad_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedGuest.nomad_avatar} alt="" />
                ) : (
                  guestName(selectedGuest).slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <h2>{guestName(selectedGuest)}</h2>
                <p>{selectedGuest.nomad_bio || "Digital nomad looking to experience local craft, food, and everyday village life."}</p>
              </div>
            </div>

            <div className={styles.badges}>
              <span>{selectedGuest.verified_id ?? true ? "Verified ID" : "ID pending"}</span>
              <span>{selectedGuest.verified_payment ?? true ? "Verified payment" : "Payment pending"}</span>
            </div>

            <div className={styles.reviews}>
              <h3>Community Reviews</h3>
              {profileReviews(selectedGuest).map((review) => (
                <p key={review}>{review}</p>
              ))}
            </div>

            <button type="button" className={styles.ghost} onClick={() => setSelectedGuest(null)}>
              Close
            </button>
          </div>
        </aside>
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
