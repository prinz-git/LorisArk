import { render, screen, within } from "../utils/render";
import PublicHeader from "../../src/components/PublicHeader";

describe("PublicHeader", () => {
  it("renders primary navigation links", () => {
    render(<PublicHeader />);

    const nav = screen.getByRole("navigation");
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(within(nav).getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
