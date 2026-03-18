import { test, expect } from "@playwright/test";

const UI_BASE_URL = process.env.UI_BASE_URL || "http://localhost:3000";

test.describe("Public site", () => {
  test.use({ baseURL: UI_BASE_URL });

  test("Landing page loads with primary actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "User Management App" })).toBeVisible();

    const headerNav = page.getByRole("navigation");
    await expect(headerNav.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(headerNav.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );

    const hero = page.getByRole("main");
    await expect(hero.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(hero.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  test("Login page shows form fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });
});
