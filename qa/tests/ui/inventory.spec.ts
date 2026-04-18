import { test, expect } from "@playwright/test";
import { seedLoggedInUser } from "../../data/testData";
import { ENV } from "../../core/env";
import { expectToast } from "../../ui/components/toast";
import { DashboardPage } from "../../ui/pages/DashboardPage";
import { testIds } from "../../ui/testIds";

const TOKEN_KEY = "lorisark_token";

test.use({ baseURL: ENV.UI_BASE_URL });

test.describe("Role dashboards", () => {
  test("Host can publish a roost from dashboard", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "host" });
    const dashboard = new DashboardPage(page);
    const name = `Harbor Loft ${Date.now()}`;
    const location = `Lisbon ${Date.now()}`;

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await dashboard.goto();
      await dashboard.assertWelcome();
      await dashboard.addRoost({ name, location, price: "140" });

      await expectToast(page, "Roost created.", testIds.dashboard.toast);
      await expect(page.getByText(name)).toBeVisible();
      await expect(page.getByText(location)).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test("Artisan can publish a service from dashboard", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "artisan" });
    const dashboard = new DashboardPage(page);
    const service = `Organic Breakfast ${Date.now()}`;
    const location = `Bamboo Loft ${Date.now()}`;

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await dashboard.goto();
      await dashboard.assertWelcome();
      await dashboard.addService({
        name: service,
        category: "Food",
        price: "22",
        dailyLimit: "4",
        location,
      });

      await expectToast(page, "Service created.", testIds.dashboard.toast);
      await expect(page.getByText(service)).toBeVisible();
      await expect(page.getByText(location)).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });
});
