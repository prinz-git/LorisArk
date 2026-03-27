import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIdBuilders, testIds } from "../testIds";

export class UsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/users");
  }

  async assertReady() {
    await this.page.getByTestId(testIds.users.title).waitFor({ state: "visible" });
  }

  private rowFor(userId: number): Locator {
    return this.page.getByTestId(testIdBuilders.usersRow(userId));
  }

  async editUser(userId: number, updatedName: string) {
    const row = this.rowFor(userId);
    await row.getByTestId(testIdBuilders.usersEditLink(userId)).click();
    await this.page.getByTestId(testIds.editUser.title).waitFor({ state: "visible" });
    await this.page.getByTestId(testIds.editUser.fullnameInput).fill(updatedName);
    await this.page.getByTestId(testIds.editUser.saveButton).click();
  }

  async backToListFromEdit() {
    await this.page.getByTestId(testIds.editUser.backLink).click();
    await this.assertReady();
  }

  async deleteUser(userId: number) {
    const row = this.rowFor(userId);
    this.acceptNextDialog();
    await row.getByTestId(testIdBuilders.usersDeleteButton(userId)).click();
  }

  async assertUserAbsent(userId: number) {
    await this.page
      .getByTestId(testIdBuilders.usersRow(userId))
      .waitFor({ state: "detached" });
  }
}
