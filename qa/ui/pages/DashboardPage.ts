import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async assertWelcome() {
    await this.page.getByTestId(testIds.dashboard.greeting).waitFor({ state: "visible" });
  }

  async addRoost(data: {
    name: string;
    location: string;
    price: string;
    wifiSpeed: string;
  }) {
    await this.page.getByRole("button", { name: /\+ add roost/i }).click();
    await this.page.getByLabel("Name").fill(data.name);
    await this.page.getByLabel("Location").fill(data.location);
    await this.page.getByLabel(/Price \(per night\)/i).fill(data.price);
    await this.page.getByLabel(/Wi-Fi Speed \(Mbps\)/i).fill(data.wifiSpeed);
    await this.page.getByRole("button", { name: /save roost/i }).click();
  }

  async editRoost(data: { name?: string; location?: string; price?: string; wifiSpeed?: string }) {
    await this.page.getByTitle(/edit roost/i).first().click();
    if (data.name !== undefined) {
      await this.page.getByLabel("Name").fill(data.name);
    }
    if (data.location !== undefined) {
      await this.page.getByLabel("Location").fill(data.location);
    }
    if (data.price !== undefined) {
      await this.page.getByLabel(/Price \(per night\)/i).fill(data.price);
    }
    if (data.wifiSpeed !== undefined) {
      await this.page.getByLabel(/Wi-Fi Speed \(Mbps\)/i).fill(data.wifiSpeed);
    }
    await this.page.getByRole("button", { name: /update roost/i }).click();
  }

  async deleteRoost(confirm = true) {
    this.page.once("dialog", (dialog) =>
      confirm ? dialog.accept() : dialog.dismiss()
    );
    await this.page.getByTitle(/delete roost/i).first().click();
  }

  async addService(data: {
    name: string;
    category: string;
    price: string;
    dailyLimit: string;
    location: string;
  }) {
    await this.page.getByRole("button", { name: /\+ add service/i }).click();
    await this.page.getByLabel(/What \(Service Name\)/i).fill(data.name);
    await this.page.getByLabel("Category").fill(data.category);
    await this.page.getByLabel(/How Much \(Price\)/i).fill(data.price);
    await this.page.getByLabel("Daily Limit").fill(data.dailyLimit);
    await this.page.getByLabel(/Where \(Place Name\)/i).fill(data.location);
    await this.page.getByRole("button", { name: /save service/i }).click();
  }

  async editService(data: {
    name?: string;
    category?: string;
    price?: string;
    dailyLimit?: string;
    location?: string;
  }) {
    await this.page.getByTitle(/edit service/i).first().click();
    if (data.name !== undefined) {
      await this.page.getByLabel(/What \(Service Name\)/i).fill(data.name);
    }
    if (data.category !== undefined) {
      await this.page.getByLabel("Category").fill(data.category);
    }
    if (data.price !== undefined) {
      await this.page.getByLabel(/How Much \(Price\)/i).fill(data.price);
    }
    if (data.dailyLimit !== undefined) {
      await this.page.getByLabel("Daily Limit").fill(data.dailyLimit);
    }
    if (data.location !== undefined) {
      await this.page.getByLabel(/Where \(Place Name\)/i).fill(data.location);
    }
    await this.page.getByRole("button", { name: /update service/i }).click();
  }

  async deleteService(confirm = true) {
    this.page.once("dialog", (dialog) =>
      confirm ? dialog.accept() : dialog.dismiss()
    );
    await this.page.getByTitle(/delete service/i).first().click();
  }
}
