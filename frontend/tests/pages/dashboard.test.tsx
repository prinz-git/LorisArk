import { fireEvent, render, screen, waitFor } from "../utils/render";
import DashboardPage from "../../src/app/(dashboard)/dashboard/page";
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

function installArtisanApiMock() {
  const mock = apiFetch as jest.Mock;
  let services: Root[] = [
    {
      id: 21,
      service_category: "Food",
      service_description: "Organic Breakfast",
      service_capacity: 4,
      service_window_start: "08:00",
      base_price: 22,
      place_name: "Kyoto",
    },
  ];

  const today = new Date().toISOString().split("T")[0];
  let tickets = [
    {
      id: 98,
      status: "new",
      service_name: "Organic Breakfast",
      service_category: "Food",
      roost_name: "The Bamboo Loft",
      scheduled_date: today,
      service_time: "08:00",
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
    if (path === "/artisan/tickets") {
      return tickets;
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
      tickets = [];
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

  it("shows Wi-Fi field for add roost and prefills it in edit mode", async () => {
    installHostApiMock();
    render(<DashboardPage />);

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
    render(<DashboardPage />);
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

  it("updates and deletes artisan services", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const mock = apiFetch as jest.Mock;

    installArtisanApiMock();
    render(<DashboardPage />);
    await screen.findByText(/my services/i);

    fireEvent.click(screen.getByTitle(/edit service/i));
    fireEvent.change(screen.getByLabelText(/what \(service name\)/i), {
      target: { value: "Organic Brunch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update service/i }));

    await waitFor(() => {
      expect(mock).toHaveBeenCalledWith(
        "/roots/21",
        expect.objectContaining({ method: "PUT", token: "token" })
      );
    });

    fireEvent.click(screen.getByTitle(/delete service/i));

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
