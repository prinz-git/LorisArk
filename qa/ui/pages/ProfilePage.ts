import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/profile");
  }

  async assertReady() {
    await this.page.getByTestId(testIds.profile.title).waitFor({ state: "visible" });
  }

  async updateName(fullName: string) {
    await this.page.getByTestId(testIds.profile.fullnameInput).fill(fullName);
    await this.page.getByTestId(testIds.profile.saveButton).click();
  }

  async deleteAccount() {
    this.acceptNextDialog();
    await this.page.getByTestId(testIds.profile.deleteButton).click();
  }
}
