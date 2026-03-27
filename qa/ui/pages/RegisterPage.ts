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

  async fillIdentity(fullName: string, email: string, password: string) {
    await this.page.getByTestId(testIds.register.fullnameInput).fill(fullName);
    await this.page.getByTestId(testIds.register.emailInput).fill(email);
    await this.page.getByTestId(testIds.register.passwordInput).fill(password);
  }

  async continueToRole() {
    await this.page.getByRole("button", { name: "Continue to Role" }).click();
  }

  async chooseRole(role: "nomad" | "host" | "artisan") {
    const title = role === "nomad" ? "Nomad" : role === "host" ? "Host" : "Artisan";
    await this.page.getByRole("button", { name: new RegExp(title, "i") }).click();
  }

  async continueToKyc() {
    await this.page.getByRole("button", { name: "Continue to KYC" }).click();
  }

  async submit() {
    await this.page.getByTestId(testIds.register.submitButton).click();
  }

  async register(
    fullName: string,
    email: string,
    password: string,
    role: "nomad" | "host" | "artisan" = "nomad"
  ) {
    await this.fillIdentity(fullName, email, password);
    await this.continueToRole();
    await this.chooseRole(role);
    await this.continueToKyc();
    await this.submit();
  }
}
