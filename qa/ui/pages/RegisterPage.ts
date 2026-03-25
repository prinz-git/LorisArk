import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/register");
  }

  async assertReady() {
    await this.page
      .getByTestId(testIds.register.title)
      .waitFor({ state: "visible" });
  }

  async register(fullName: string, email: string, password: string) {
    await this.page.getByTestId(testIds.register.fullnameInput).fill(fullName);
    await this.page.getByTestId(testIds.register.emailInput).fill(email);
    await this.page.getByTestId(testIds.register.passwordInput).fill(password);
    await this.page.getByTestId(testIds.register.submitButton).click();
  }
}
