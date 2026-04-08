import { test, expect } from "@playwright/test";
import { seedLoggedInUser } from "../../data/testData";
import { ENV } from "../../core/env";
import { expectToast } from "../../ui/components/toast";
import { InventoryPage } from "../../ui/pages/InventoryPage";
import { testIds } from "../../ui/testIds";

const TOKEN_KEY = "lorisark_token";

test.use({ baseURL: ENV.UI_BASE_URL });

test.describe("Inventory", () => {
  test("Host can publish a roost from the inventory page", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "host" });
    const inventory = new InventoryPage(page);
    const title = `Harbor Loft ${Date.now()}`;
    const placeName = `Lisbon ${Date.now()}`;

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await inventory.goto();
      await inventory.assertReady();

      await inventory.fillRoostForm({
        title,
        bedroomType: "Private room",
        bedroomCount: "1",
        photos: "https://example.com/room.jpg",
        wifiSpeed: "150",
        placeName,
      });
      await inventory.submitRoost();

      await expectToast(page, "Roost listed successfully.", testIds.inventory.toast);
      await expect(page.getByTestId(testIds.inventory.roostList)).toContainText(title);
      await expect(page.getByTestId(testIds.inventory.roostList)).toContainText(placeName);
    } finally {
      await seeded.cleanup();
    }
  });

  test("Artisan can publish a root from the inventory page", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "artisan" });
    const inventory = new InventoryPage(page);
    const description = `Seasonal supper ${Date.now()}`;
    const placeName = `Osaka ${Date.now()}`;

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await inventory.goto();
      await inventory.assertReady();

      await inventory.fillRootForm({
        serviceCategory: "Food",
        serviceDescription: description,
        serviceCapacity: "4",
        placeName,
      });
      await inventory.submitRoot();

      await expectToast(page, "Root service listed successfully.", testIds.inventory.toast);
      await expect(page.getByTestId(testIds.inventory.rootList)).toContainText(description);
      await expect(page.getByTestId(testIds.inventory.rootList)).toContainText(placeName);
    } finally {
      await seeded.cleanup();
    }
  });
});
