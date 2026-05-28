import { fireEvent, render, screen, waitFor } from "../utils/render";
import DashboardPage from "../../src/app/(dashboard)/dashboard/page";
import RoostsPage from "../../src/app/(dashboard)/roosts/page";
import RootsPage from "../../src/app/(dashboard)/roots/page";
import { apiFetch } from "../../src/lib/api";
import { getToken } from "../../src/lib/auth";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("../../src/lib/api", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("../../src/lib/auth", () => ({
  getToken: jest.fn(),
}));

type Roost = {
  id: number;
  title: string;
  place_name: string | null;
  nightly_rate: number | null;
  wifi_speed_mbps: number;
  wifi_active: boolean;
  availability_ranges: { start_date: string; end_date: string }[] | null;
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

function installHostApiMock() {
  const mock = apiFetch as jest.Mock;
  let roosts: Roost[] = [
    {
      id: 11,
      title: "Bamboo Loft",
      place_name: "Kyoto",
      nightly_rate: 140,
      wifi_speed_mbps: 220,
      wifi_active: true,
      availability_ranges: [{ start_date: "2026-04-18", end_date: "2026-04-20" }],
    },
  ];

  const summaries = [
    {
      bundle_id: 1,
      nomad_name: "Ari",
      roost_id: 11,
      roost_title: "Bamboo Loft",
      start_date: "2099-01-01",
      end_date: "2099-01-03",
      services: ["Organic Breakfast"],
    },
  ];

  mock.mockImplementation(async (path: string, options?: { method?: string; body?: string }) => {
    const method = options?.method || "GET";
    if (path === "/profile") {
      return { email: "host@test.com", full_name: "Host", role: "host" };
    }
    if (path === "/roosts/mine") {
      return roosts;
    }
    if (path === "/host/stays/summary") {
      return summaries;
    }
    if (path === "/roosts/11" && method === "PUT") {
      const body = JSON.parse(options?.body || "{}");
      roosts = roosts.map((roost) =>
        roost.id === 11
          ? {
              ...roost,
              wifi_active:
                body.status !== undefined ? body.status === "live" : roost.wifi_active,
              title: body.title ?? roost.title,
              place_name: body.place_name ?? roost.place_name,
              nightly_rate:
                body.nightly_rate !== undefined ? body.nightly_rate : roost.nightly_rate,
              wifi_speed_mbps:
                body.wifi_speed_mbps !== undefined
                  ? body.wifi_speed_mbps
                  : roost.wifi_speed_mbps,
            }
          : roost
      );
      return roosts[0];
    }
    if (path === "/roosts/11" && method === "DELETE") {
      roosts = [];
      return { message: "Roost deleted" };
    }
    throw new Error(`Unhandled apiFetch call: ${method} ${path}`);
  });
}

function installArtisanRootsApiMock() {
  const mock = apiFetch as jest.Mock;
  let services: Root[] = [
    {
      id: 21,
      service_category: "Craft",
      service_description: "Pottery Making",
      service_capacity: 4,
      service_window_start: "14:00",
      base_price: 45,
      place_name: "Kyoto",
    },
  ];

  mock.mockImplementation(async (path: string, options?: { method?: string; body?: string }) => {
    const method = options?.method || "GET";
    if (path === "/profile") {
      return { email: "artisan@test.com", full_name: "Art", role: "artisan" };
    }
    if (path === "/roots/mine") {
      return services;
    }
    if (path === "/roots/21" && method === "PUT") {
      const body = JSON.parse(options?.body || "{}");
      services = services.map((service) =>
        service.id === 21
          ? {
              ...service,
              service_description: body.service_description ?? service.service_description,
              service_category: body.service_category ?? service.service_category,
              service_capacity:
                body.service_capacity !== undefined
                  ? body.service_capacity
                  : service.service_capacity,
              base_price: body.base_price !== undefined ? body.base_price : service.base_price,
              place_name: body.place_name ?? service.place_name,
              service_window_start:
                body.service_window_start !== undefined
                  ? body.service_window_start
                  : service.service_window_start,
            }
          : service
      );
      return services[0];
    }
    if (path === "/roots/21" && method === "DELETE") {
      services = [];
      return { message: "Root deleted" };
    }
    throw new Error(`Unhandled apiFetch call: ${method} ${path}`);
  });
}

describe("DashboardPage", () => {
  beforeEach(() => {
    (getToken as jest.Mock).mockReturnValue("token");
    replace.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows pending requests with accept, decline reasons, agenda, and profile drawer", async () => {
    const mock = apiFetch as jest.Mock;
    let hostDeclined = false;
    mock.mockImplementation(async (path: string, options?: { method?: string; body?: string }) => {
      const method = options?.method || "GET";
      if (path === "/profile") {
        return { email: "host@test.com", full_name: "Host", role: "host" };
      }
      if (path === "/host/stays/summary") {
        return hostDeclined
          ? [
              {
                bundle_id: 45,
                nomad_name: "Mika",
                roost_id: 12,
                roost_title: "Cedar Room",
                start_date: "2099-02-01",
                end_date: "2099-02-04",
                services: [],
                status: "host_accepted",
              },
            ]
          : [
          {
            bundle_id: 44,
            nomad_name: "Ari Nomad",
            roost_id: 11,
            roost_title: "Bamboo Loft",
            start_date: "2099-01-01",
            end_date: "2099-01-03",
            services: ["Organic Breakfast"],
            status: "pending",
            nomad_bio: "Digital nomad looking to experience local pottery techniques.",
            community_reviews: ["Warm, curious, and left the room spotless."],
          },
          {
            bundle_id: 45,
            nomad_name: "Mika",
            roost_id: 12,
            roost_title: "Cedar Room",
            start_date: "2099-02-01",
            end_date: "2099-02-04",
            services: [],
            status: "host_accepted",
          },
        ];
      }
      if (path === "/host/bookings/44/decline" && method === "PUT") {
        hostDeclined = true;
        return { id: 44, status: "host_declined", reason: "Maintenance" };
      }
      throw new Error(`Unhandled apiFetch call: ${method} ${path}`);
    });

    render(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: /pending requests/i })).toBeInTheDocument();
    expect(await screen.findByText(/bamboo loft/i)).toBeInTheDocument();
    expect(await screen.findByText(/cedar room/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ari nomad/i }));
    expect(await screen.findByLabelText(/nomad profile drawer/i)).toBeInTheDocument();
    expect(screen.getAllByText(/digital nomad looking to experience local pottery/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/verified id/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    fireEvent.click(screen.getByRole("button", { name: /decline/i }));
    fireEvent.click(screen.getByRole("button", { name: /maintenance/i }));
    expect(await screen.findByText(/request declined: maintenance/i)).toBeInTheDocument();
    expect(mock).toHaveBeenCalledWith(
      "/host/bookings/44/decline",
      expect.objectContaining({
        method: "PUT",
        token: "token",
        body: JSON.stringify({ reason: "Maintenance" }),
      })
    );
  });

  it("shows artisan tickets blocked by host confirmation and accepts after host approval", async () => {
    const mock = apiFetch as jest.Mock;
    let ticketStatus = "pending_host";

    mock.mockImplementation(async (path: string, options?: { method?: string }) => {
      const method = options?.method || "GET";
      if (path === "/profile") {
        return { email: "artisan@test.com", full_name: "Art", role: "artisan" };
      }
      if (path === "/artisan/tickets") {
        return [
          {
            id: 98,
            bundle_id: 7,
            status: ticketStatus,
            host_status: ticketStatus === "pending_host" ? "pending_host" : "host_accepted",
            host_name: "Host User",
            host_confirmation_message:
              ticketStatus === "pending_host"
                ? "Pending confirmation from host Host User"
                : null,
            service_name: "Pottery Making",
            service_category: "Craft",
            roost_name: "Bamboo Loft",
            scheduled_date: "2099-02-04",
            service_time: "14:00",
            nomad_name: "Ari Nomad",
          },
        ];
      }
      if (path === "/artisan/tickets/98/accept" && method === "PUT") {
        ticketStatus = "artisan_accepted";
        return { id: 98, status: "artisan_accepted" };
      }
      throw new Error(`Unhandled apiFetch call: ${method} ${path}`);
    });

    const view = render(<DashboardPage />);

    expect(await screen.findByText(/pending confirmation from host host user/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();

    ticketStatus = "pending_artisan";
    view.unmount();
    render(<DashboardPage />);

    expect(await screen.findByRole("button", { name: /accept/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(mock).toHaveBeenCalledWith(
        "/artisan/tickets/98/accept",
        expect.objectContaining({ method: "PUT", token: "token" })
      );
    });
  });

  it("shows Wi-Fi field for add roost and prefills it in edit mode", async () => {
    installHostApiMock();
    render(<RoostsPage />);

    expect(await screen.findByText(/my roosts/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ add roost/i }));
    expect(screen.getByLabelText(/wi-fi speed \(mbps\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    fireEvent.click(screen.getByTitle(/edit roost/i));

    expect(await screen.findByRole("heading", { name: /edit roost/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/wi-fi speed \(mbps\)/i)).toHaveValue(220);
  });

  it("sends toggle status payload and respects delete confirmation cancel", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);
    const mock = apiFetch as jest.Mock;

    installHostApiMock();
    render(<RoostsPage />);
    await screen.findByText(/my roosts/i);

    fireEvent.click(screen.getByRole("button", { name: /live/i }));

    await waitFor(() => {
      expect(mock).toHaveBeenCalledWith(
        "/roosts/11",
        expect.objectContaining({
          method: "PUT",
          token: "token",
          body: JSON.stringify({ status: "hidden" }),
        })
      );
    });

    fireEvent.click(screen.getByTitle(/delete roost/i));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mock).not.toHaveBeenCalledWith(
      "/roosts/11",
      expect.objectContaining({ method: "DELETE" })
    );

    confirmSpy.mockRestore();
  });

  it("updates and deletes artisan roots from the My Roots page", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const mock = apiFetch as jest.Mock;

    installArtisanRootsApiMock();
    render(<RootsPage />);
    await screen.findByText(/my roots/i);

    expect(screen.getByText(/pottery making/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(/edit root/i));
    fireEvent.change(screen.getByLabelText(/what \(service name\)/i), {
      target: { value: "Pottery Studio" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update root/i }));

    await waitFor(() => {
      expect(mock).toHaveBeenCalledWith(
        "/roots/21",
        expect.objectContaining({ method: "PUT", token: "token" })
      );
    });

    fireEvent.click(screen.getByTitle(/delete root/i));

    await waitFor(() => {
      expect(mock).toHaveBeenCalledWith(
        "/roots/21",
        expect.objectContaining({ method: "DELETE", token: "token" })
      );
    });

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

});
