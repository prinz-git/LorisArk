import { render, screen } from "../utils/render";
import LoginPage from "../../src/app/(public)/login/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("LoginPage", () => {
  it("shows verification notice and login actions", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(/verification required for services/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /enter the ark/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /join the community/i }),
    ).toHaveAttribute("href", "/register");
  });
});
