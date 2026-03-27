import { render, screen } from "../utils/render";
import LandingPage from "../../src/app/(public)/page";

describe("LandingPage", () => {
  it("renders the core story and actions", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: /turn villages into distributed boutique resorts/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /enter the ark/i })).toHaveAttribute(
      "href",
      "/login",
    );

    expect(
      screen.getByRole("link", { name: /join the community/i }),
    ).toHaveAttribute("href", "/register");
  });
});
