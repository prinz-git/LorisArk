import { expect, Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async expectHeading(name: string | RegExp) {
    await expect(this.page.getByRole("heading", { name })).toBeVisible();
  }

  acceptNextDialog() {
    this.page.once("dialog", (dialog) => dialog.accept());
  }
}
