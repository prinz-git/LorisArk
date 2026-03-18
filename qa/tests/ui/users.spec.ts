import { test, expect } from "@playwright/test";
import { ENV } from "../../core/env";
import { seedLoggedInUser, seedUser } from "../../data/testData";
import { testIdBuilders, testIds } from "../../ui/testIds";

const TOKEN_KEY = "lorisark_token";

test.describe("Users", () => {
  test.use({ baseURL: ENV.UI_BASE_URL });

  test("Search filters results", async ({ page }) => {
    const primary = await seedLoggedInUser();
    const secondary = await seedUser({ full_name: "Search Target" });

    try {
      await page.addInitScript(
        ({ token, key }) => {
          localStorage.setItem(key, token);
        },
        { token: primary.token, key: TOKEN_KEY }
      );

      await page.goto("/users");
      await page.getByTestId(testIds.users.title).waitFor({ state: "visible" });

      await page
        .getByTestId(testIds.users.searchInput)
        .fill(secondary.user.email);

      await expect(
        page.getByTestId(testIdBuilders.usersRow(secondary.id))
      ).toBeVisible();
      await expect(
        page.getByTestId(testIdBuilders.usersRow(primary.id))
      ).toHaveCount(0);
    } finally {
      await secondary.cleanup();
      await primary.cleanup();
    }
  });
});
