import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async assertWelcome() {
    await this.expectHeading(/Hello,/);
  }
}
