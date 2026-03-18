import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class UsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/users");
  }

  async assertReady() {
    await this.expectHeading("User Listing");
  }

  private rowFor(email: string): Locator {
    return this.page.getByText(email).locator("..");
  }

  async editUser(email: string, updatedName: string) {
    const row = this.rowFor(email);
    await row.getByRole("link", { name: "Edit" }).click();
    await this.expectHeading("Edit User");
    await this.page.getByLabel("Full Name").fill(updatedName);
    await this.page.getByRole("button", { name: "Save Changes" }).click();
    await this.page.getByRole("link", { name: "Back" }).click();
    await this.assertReady();
  }

  async deleteUser(email: string) {
    const row = this.rowFor(email);
    this.acceptNextDialog();
    await row.getByRole("button", { name: "Delete" }).click();
  }

  async assertUserAbsent(email: string) {
    await this.page.getByText(email).waitFor({ state: "detached" });
  }
}
