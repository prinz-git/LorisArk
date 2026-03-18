import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/profile");
  }

  async assertReady() {
    await this.expectHeading("Edit Profile");
  }

  async updateName(fullName: string) {
    await this.page.getByLabel("Full Name").fill(fullName);
    await this.page.getByRole("button", { name: "Save Changes" }).click();
  }

  async deleteAccount() {
    this.acceptNextDialog();
    await this.page.getByRole("button", { name: "Delete Account" }).click();
  }
}
