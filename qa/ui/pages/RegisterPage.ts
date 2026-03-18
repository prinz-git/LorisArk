import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/register");
  }

  async assertReady() {
    await this.expectHeading("Create Account");
  }

  async register(fullName: string, email: string, password: string) {
    await this.page.getByLabel("Full Name").fill(fullName);
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Register" }).click();
  }
}
