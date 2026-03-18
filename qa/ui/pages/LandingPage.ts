import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LandingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/");
  }

  async assertReady() {
    await this.expectHeading("User Management App");
  }

  async assertPrimaryActions() {
    const headerNav = this.page.getByRole("navigation");
    await expect(headerNav.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login"
    );
    await expect(
      headerNav.getByRole("link", { name: "Register" })
    ).toHaveAttribute("href", "/register");

    const hero = this.page.getByRole("main");
    await expect(hero.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login"
    );
    await expect(hero.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register"
    );
  }
}
