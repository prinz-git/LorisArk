import { test } from "@playwright/test";
import { ENV } from "../../core/env";
import { LandingPage } from "../../ui/pages/LandingPage";

test.describe("Public site", () => {
  test.use({ baseURL: ENV.UI_BASE_URL });

  test("Landing page loads with primary actions", async ({ page }) => {
    const landing = new LandingPage(page);

    await landing.goto();
    await landing.assertReady();
    await landing.assertPrimaryActions();
  });
});
