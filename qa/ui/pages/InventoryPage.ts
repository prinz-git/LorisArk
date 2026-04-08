import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { testIds } from "../testIds";

type RoostFormData = {
  title: string;
  bedroomType: string;
  bedroomCount: string;
  photos: string;
  wifiSpeed: string;
  placeName: string;
};

type RootFormData = {
  serviceCategory: string;
  serviceDescription: string;
  serviceCapacity: string;
  placeName: string;
};

export class InventoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto("/inventory");
  }

  async assertReady() {
    await this.page.getByTestId(testIds.inventory.page).waitFor({ state: "visible" });
  }

  roostForm(): Locator {
    return this.page.getByTestId(testIds.inventory.roostForm);
  }

  rootForm(): Locator {
    return this.page.getByTestId(testIds.inventory.rootsForm);
  }

  async fillRoostForm(data: RoostFormData) {
    const form = this.roostForm();
    await form.getByLabel("Listing Title").fill(data.title);
    await form.getByLabel("Bedroom Type").fill(data.bedroomType);
    await form.getByLabel("Bedroom Count").fill(data.bedroomCount);
    await form.getByLabel("Photo URLs (comma separated)").fill(data.photos);
    await form.getByLabel("Wi-Fi Speed (Mbps)").fill(data.wifiSpeed);
    await form.getByLabel("Place Name").fill(data.placeName);
  }

  async submitRoost() {
    await this.page.getByTestId(testIds.inventory.roostSubmit).click();
  }

  async fillRootForm(data: RootFormData) {
    const form = this.rootForm();
    await form.getByLabel("Service Category").selectOption(data.serviceCategory);
    await form.getByLabel("Service Description").fill(data.serviceDescription);
    await form.getByLabel("Service Capacity").fill(data.serviceCapacity);
    await form.getByLabel("Place Name").fill(data.placeName);
  }

  async submitRoot() {
    await this.page.getByTestId(testIds.inventory.rootsSubmit).click();
  }
}
