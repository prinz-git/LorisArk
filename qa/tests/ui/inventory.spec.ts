import { test, expect } from "@playwright/test";
import { seedLoggedInUser } from "../../data/testData";
import { ENV } from "../../core/env";
import { expectToast } from "../../ui/components/toast";
import { DashboardPage } from "../../ui/pages/DashboardPage";
import { InventoryPage } from "../../ui/pages/InventoryPage";
import { testIds } from "../../ui/testIds";

const TOKEN_KEY = "lorisark_token";

test.use({ baseURL: ENV.UI_BASE_URL });

test.describe("Inventory routing and validation", () => {
  test("Nomad can access inventory page", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "nomad" });
    const inventory = new InventoryPage(page);

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await inventory.goto();
      await inventory.assertReady();
      await expect(page.getByRole("heading", { name: "Find - Select - Bundle - Book" })).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test("Host is redirected from inventory to dashboard", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "host" });
    const dashboard = new DashboardPage(page);

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await page.goto("/inventory");
      await page.waitForURL("**/dashboard");
      await dashboard.assertWelcome();
    } finally {
      await seeded.cleanup();
    }
  });

  test("Artisan is redirected from inventory to dashboard", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "artisan" });
    const dashboard = new DashboardPage(page);

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await page.goto("/inventory");
      await page.waitForURL("**/dashboard");
      await dashboard.assertWelcome();
    } finally {
      await seeded.cleanup();
    }
  });

  test("Find & Explore requires start and end dates", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "nomad" });
    const inventory = new InventoryPage(page);

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await inventory.goto();
      await inventory.assertReady();

      await page.getByRole("button", { name: "Find & Explore" }).click();
      await expectToast(page, "Choose start and end dates first.", testIds.inventory.toast);
    } finally {
      await seeded.cleanup();
    }
  });
});
