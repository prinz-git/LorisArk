import { render, screen } from "../utils/render";
import PublicHeader from "../../src/components/PublicHeader";

describe("PublicHeader", () => {
  it("renders primary navigation links", () => {
    render(<PublicHeader />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
