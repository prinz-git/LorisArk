import { fireEvent, render, screen, waitFor } from "../utils/render";
import BookingsPage from "../../src/app/(dashboard)/bookings/page";
import { apiFetch } from "../../src/lib/api";
import { getToken } from "../../src/lib/auth";

const replace = jest.fn();
const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

jest.mock("../../src/lib/api", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("../../src/lib/auth", () => ({
  getToken: jest.fn(),
}));

describe("BookingsPage", () => {
  beforeEach(() => {
    (getToken as jest.Mock).mockReturnValue("token");
    replace.mockReset();
    push.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the host Roost status board and confirmation workflow", async () => {
    (apiFetch as jest.Mock).mockImplementation(async (path: string) => {
      if (path === "/profile") {
        return { role: "host" };
      }
      if (path === "/host/stays/summary") {
        return [
          {
            bundle_id: 42,
            nomad_name: "Ari Nomad",
            roost_id: 11,
            roost_title: "Bamboo Loft",
            start_date: "2099-01-01",
            end_date: "2099-01-03",
            services: ["Organic Breakfast"],
            nomad_trust_score: 91,
          },
        ];
      }
      throw new Error(`Unhandled apiFetch call: ${path}`);
    });

    render(<BookingsPage />);

    expect(await screen.findByRole("heading", { name: /host bookings dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /roost status board/i })).toBeInTheDocument();
    expect(screen.getByText(/ari nomad arrives jan 1, 2099/i)).toBeInTheDocument();
    expect(screen.getByText(/mutual trust score 91/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmation workflow/i }));
    expect(await screen.findByRole("heading", { name: /booking confirmation workflow/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm readiness/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirmation workflow marked ready/i)).toBeInTheDocument();
    });
    expect(replace).not.toHaveBeenCalledWith("/dashboard");
  });

  it("renders the artisan Workshop ledger with roster readiness details", async () => {
    (apiFetch as jest.Mock).mockImplementation(async (path: string) => {
      if (path === "/profile") {
        return { role: "artisan" };
      }
      if (path === "/artisan/tickets") {
        return [
          {
            id: 98,
            bundle_id: 7,
            root_id: 21,
            nomad_id: 5,
            host_id: 3,
            status: "new",
            note: null,
            service_name: "Pottery Making",
            service_category: "Craft",
            roost_name: "Bamboo Loft",
            scheduled_date: "2099-02-04",
            service_time: "14:00",
            created_at: null,
            headcount: 3,
            guest_dietary_requirements: "Vegetarian snacks",
            skill_level: "Beginner",
            nomad_trust_score: 88,
          },
        ];
      }
      throw new Error(`Unhandled apiFetch call: ${path}`);
    });

    render(<BookingsPage />);

    expect(await screen.findByRole("heading", { name: /artisan bookings dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /workshop ledger/i })).toBeInTheDocument();
    expect(screen.getByText(/pottery making/i)).toBeInTheDocument();
    expect(screen.getByText(/headcount: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/dietary: vegetarian snacks/i)).toBeInTheDocument();
    expect(screen.getByText(/skill level: beginner/i)).toBeInTheDocument();
    expect(screen.getByText(/mutual trust score 88/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view roster/i }));
    expect(await screen.findByRole("heading", { name: /mutual trust score/i })).toBeInTheDocument();
    expect(screen.getByText(/bamboo loft/i)).toBeInTheDocument();
  });
});
