import { test, expect } from "@playwright/test";
import { APIClient } from "../../core/APIClient";
import { AuthAPI } from "../../api/AuthAPI";
import { createUser } from "../../data/userFactory";

const UI_BASE_URL = process.env.UI_BASE_URL || "http://localhost:3000";

const expectToast = async (page: { getByRole: any }, message: string) => {
  await expect(page.getByRole("status")).toHaveText(message);
};

test.describe("User E2E journey", () => {
  test.use({ baseURL: UI_BASE_URL });

  test("registers, logs in, manages users, updates profile, and deletes account", async ({
    page,
  }) => {
    const primaryUser = createUser();
    const secondaryUser = createUser();

    await test.step("Seed a secondary user via API", async () => {
      const request = await APIClient.create();
      const auth = new AuthAPI(request);
      const response = await auth.register(secondaryUser);
      expect(response.status()).toBe(200);
    });

    await test.step("Register a new user via UI", async () => {
      await page.goto("/register");
      await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();

      await page.getByLabel("Full Name").fill(primaryUser.full_name);
      await page.getByLabel("Email").fill(primaryUser.email);
      await page.getByLabel("Password").fill(primaryUser.password);
      await page.getByRole("button", { name: "Register" }).click();

      await expectToast(page, "Account created. Please log in.");
      await page.waitForURL("**/login");
    });

    await test.step("Login as the registered user", async () => {
      await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
      await page.getByLabel("Email").fill(primaryUser.email);
      await page.getByLabel("Password").fill(primaryUser.password);
      await page.getByRole("button", { name: "Login" }).click();

      await page.waitForURL("**/dashboard");
      await expect(page.getByRole("heading", { name: /Hello,/ })).toBeVisible();
    });

    await test.step("Edit another user from the list", async () => {
      await page.goto("/users");
      await expect(page.getByRole("heading", { name: "User Listing" })).toBeVisible();

      const row = page.getByText(secondaryUser.email).locator("..");
      await row.getByRole("link", { name: "Edit" }).click();

      await expect(page.getByRole("heading", { name: "Edit User" })).toBeVisible();
      const updatedName = `${secondaryUser.full_name} Updated`;
      await page.getByLabel("Full Name").fill(updatedName);
      await page.getByRole("button", { name: "Save Changes" }).click();

      await expectToast(page, "User updated.");
      await page.getByRole("link", { name: "Back" }).click();
      await expect(page.getByRole("heading", { name: "User Listing" })).toBeVisible();
    });

    await test.step("Delete the edited user from the list", async () => {
      const row = page.getByText(secondaryUser.email).locator("..");
      page.once("dialog", (dialog) => dialog.accept());
      await row.getByRole("button", { name: "Delete" }).click();

      await expectToast(page, "User deleted.");
      await expect(page.getByText(secondaryUser.email)).toHaveCount(0);
    });

    await test.step("Update profile details", async () => {
      await page.goto("/profile");
      await expect(page.getByRole("heading", { name: "Edit Profile" })).toBeVisible();

      const updatedProfileName = `${primaryUser.full_name} Edited`;
      await page.getByLabel("Full Name").fill(updatedProfileName);
      await page.getByRole("button", { name: "Save Changes" }).click();

      await expectToast(page, "Profile updated.");
    });

    await test.step("Delete the logged-in user from profile", async () => {
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Delete Account" }).click();

      await page.waitForURL("**/");
      await expect(page.getByRole("heading", { name: "User Management App" })).toBeVisible();
    });
  });
});
