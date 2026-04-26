import { render, screen, fireEvent } from "../utils/render";
import InventoryPage from "../../src/app/(dashboard)/inventory/page";
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

describe("InventoryPage", () => {
  beforeEach(() => {
    (getToken as jest.Mock).mockReturnValue("token");
    replace.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nomad booking flow", async () => {
    (apiFetch as jest.Mock).mockResolvedValueOnce({
      email: "nomad@test.com",
      full_name: "Nomad User",
      role: "nomad",
    });

    render(<InventoryPage />);

    expect(await screen.findByText(/find your next roost/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find & explore/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /find & explore/i }));
    expect(await screen.findByText(/choose start and end dates first/i)).toBeInTheDocument();
  });

  it.each(["host", "artisan"] as const)("redirects %s away from inventory", async (role) => {
    (apiFetch as jest.Mock).mockResolvedValueOnce({
      email: `${role}@test.com`,
      full_name: `${role} user`,
      role,
    });

    render(<InventoryPage />);

    await screen.findByText(/intelligent booking/i);
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});
