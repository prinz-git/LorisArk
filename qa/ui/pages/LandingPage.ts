import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

export class LandingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/");
  }

  async assertReady() {
    await this.page.getByTestId(testIds.landing.title).waitFor({ state: "visible" });
  }

  async assertPrimaryActions() {
    await expect(this.page.getByTestId(testIds.landing.loginLink)).toHaveAttribute(
      "href",
      "/login"
    );
    await expect(this.page.getByTestId(testIds.landing.registerLink)).toHaveAttribute(
      "href",
      "/register"
    );
  }
}
