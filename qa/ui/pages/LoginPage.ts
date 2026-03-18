import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/login");
  }

  async assertReady() {
    await this.page.getByTestId(testIds.login.title).waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    await this.page.getByTestId(testIds.login.emailInput).fill(email);
    await this.page.getByTestId(testIds.login.passwordInput).fill(password);
    await this.page.getByTestId(testIds.login.submitButton).click();
  }
}
