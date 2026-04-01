import { render, screen, waitFor } from "../utils/render";
import InventoryPage from "../../src/app/(dashboard)/inventory/page";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  getToken: jest.fn(),
}));

type Role = "nomad" | "host" | "artisan";

const createRoost = (overrides?: Partial<any>) => ({
  id: 1,
  title: "Garden Suite",
  bedroom_type: "Private room",
  bedroom_count: 1,
  photos: [],
  wifi_speed_mbps: 120,
  place_name: "Lisbon",
  latitude: null,
  longitude: null,
  ...overrides,
});

const createRoot = (overrides?: Partial<any>) => ({
  id: 2,
  service_category: "Food",
  service_description: "Village supper",
  service_capacity: 4,
  place_name: "Lisbon",
  latitude: null,
  longitude: null,
  ...overrides,
});

const setupInventory = async ({
  role,
  roosts = [],
  roots = [],
}: {
  role: Role;
  roosts?: any[];
  roots?: any[];
}) => {
  (apiFetch as jest.Mock)
    .mockResolvedValueOnce({
      email: `${role}@test.com`,
      full_name: `${role} user`,
      role,
    })
    .mockResolvedValueOnce(roosts)
    .mockResolvedValueOnce(roots);

  render(<InventoryPage />);
};

describe("InventoryPage", () => {
  beforeEach(() => {
    (getToken as jest.Mock).mockReturnValue("token");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nomad search context and combined listings", async () => {
    await setupInventory({
      role: "nomad",
      roosts: [createRoost()],
      roots: [createRoot()],
    });

    expect(await screen.findByText(/find your next roost/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/where are you roosting next/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/map preview disabled/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find & explore/i })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/roosts & roots/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/roost listings/i)).toBeInTheDocument();
    expect(screen.getByText(/root services/i)).toBeInTheDocument();
    expect(screen.getByText(/garden suite/i)).toBeInTheDocument();
    expect(screen.getByText(/village supper/i)).toBeInTheDocument();
  });

  it.each([
    ["host", /host listing \(roost\)/i, /artisan service \(root\)/i],
    ["artisan", /artisan service \(root\)/i, /host listing \(roost\)/i],
  ] as const)("shows role-specific tools for %s", async (role, visible, hidden) => {
    await setupInventory({ role, roosts: [], roots: [] });

    expect(await screen.findByText(visible)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
    expect(screen.queryByText(/find your next roost/i)).not.toBeInTheDocument();
  });

  it("keeps host view focused on roost management", async () => {
    await setupInventory({ role: "host", roosts: [], roots: [] });

    expect(await screen.findByText(/your roosts/i)).toBeInTheDocument();
    expect(screen.queryByText(/root services/i)).not.toBeInTheDocument();
  });

  it("shows creative empty-state messaging for nomads", async () => {
    await setupInventory({ role: "nomad", roosts: [], roots: [] });

    expect(
      await screen.findByText(/the trail is quiet/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the village is still gathering/i)
    ).toBeInTheDocument();
  });
});
