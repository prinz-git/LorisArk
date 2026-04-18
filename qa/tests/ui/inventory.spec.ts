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
      await dashboard.addRoost({ name, location, price: "140", wifiSpeed: "220" });

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

  test("Host can edit and soft-delete a roost from dashboard", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "host" });
    const dashboard = new DashboardPage(page);
    const name = `River Loft ${Date.now()}`;
    const updatedName = `${name} Updated`;
    const location = `Porto ${Date.now()}`;

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await dashboard.goto();
      await dashboard.assertWelcome();
      await dashboard.addRoost({ name, location, price: "175", wifiSpeed: "300" });
      await expectToast(page, "Roost created.", testIds.dashboard.toast);

      await dashboard.editRoost({ name: updatedName, wifiSpeed: "320" });
      await expectToast(page, "Roost updated.", testIds.dashboard.toast);
      await expect(page.getByText(updatedName)).toBeVisible();

      await dashboard.deleteRoost(true);
      await expectToast(page, "Roost deleted.", testIds.dashboard.toast);
      await expect(page.getByText(updatedName)).toHaveCount(0);
    } finally {
      await seeded.cleanup();
    }
  });

  test("Host cancel delete keeps roost visible", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "host" });
    const dashboard = new DashboardPage(page);
    const name = `Cedar Loft ${Date.now()}`;
    const location = `Kyoto ${Date.now()}`;

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: seeded.token, key: TOKEN_KEY }
      );

      await dashboard.goto();
      await dashboard.assertWelcome();
      await dashboard.addRoost({ name, location, price: "160", wifiSpeed: "250" });
      await expectToast(page, "Roost created.", testIds.dashboard.toast);
      await expect(page.getByText(name)).toBeVisible();

      await dashboard.deleteRoost(false);
      await expect(page.getByText(name)).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test("Artisan can edit and soft-delete a service from dashboard", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "artisan" });
    const dashboard = new DashboardPage(page);
    const service = `Organic Breakfast ${Date.now()}`;
    const updatedService = `${service} Plus`;
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

      await dashboard.editService({ name: updatedService, price: "24" });
      await expectToast(page, "Service updated.", testIds.dashboard.toast);
      await expect(page.getByText(updatedService)).toBeVisible();

      await dashboard.deleteService(true);
      await expectToast(page, "Service deleted.", testIds.dashboard.toast);
      await expect(page.getByText(updatedService)).toHaveCount(0);
    } finally {
      await seeded.cleanup();
    }
  });

  test("Artisan cancel delete keeps service visible", async ({ page }) => {
    const seeded = await seedLoggedInUser({ role: "artisan" });
    const dashboard = new DashboardPage(page);
    const service = `Village Tea ${Date.now()}`;
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
        price: "18",
        dailyLimit: "3",
        location,
      });
      await expectToast(page, "Service created.", testIds.dashboard.toast);
      await expect(page.getByText(service)).toBeVisible();

      await dashboard.deleteService(false);
      await expect(page.getByText(service)).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });
});
