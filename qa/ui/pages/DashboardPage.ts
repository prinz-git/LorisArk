import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async assertWelcome() {
    await this.page
      .getByTestId(testIds.dashboard.greeting)
      .waitFor({ state: "visible" });
  }
}
