import { test, expect } from "@playwright/test";
import { ENV } from "../../core/env";
import { LoginPage } from "../../ui/pages/LoginPage";
import { expectToast } from "../../ui/components/toast";
import { testIds } from "../../ui/testIds";

test.describe("Login", () => {
  test.use({ baseURL: ENV.UI_BASE_URL });

  test("Login page shows form fields", async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.assertReady();

    await expect(page.getByTestId(testIds.login.emailInput)).toBeVisible();
    await expect(page.getByTestId(testIds.login.passwordInput)).toBeVisible();
    await expect(page.getByTestId(testIds.login.submitButton)).toBeVisible();
  });

  test("Rejects invalid credentials", async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.assertReady();
    await login.login("nope@example.com", "wrong-password");

    await expectToast(page, "Invalid credentials", testIds.login.toast);
  });

  test("Protected routes redirect to login without a token", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL("**/login");
    await expect(page.getByTestId(testIds.login.title)).toBeVisible();

    await page.goto("/users");
    await page.waitForURL("**/login");
    await expect(page.getByTestId(testIds.login.title)).toBeVisible();

    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    await expect(page.getByTestId(testIds.login.title)).toBeVisible();
  });
});
