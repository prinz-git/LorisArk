import { test } from "@playwright/test";
import { createUser } from "../../data/userFactory";
import { seedUser } from "../../data/testData";
import { ENV } from "../../core/env";
import { expectToast } from "../../ui/components/toast";
import { RegisterPage } from "../../ui/pages/RegisterPage";
import { LoginPage } from "../../ui/pages/LoginPage";
import { DashboardPage } from "../../ui/pages/DashboardPage";
import { UsersPage } from "../../ui/pages/UsersPage";
import { ProfilePage } from "../../ui/pages/ProfilePage";
import { LandingPage } from "../../ui/pages/LandingPage";

test.describe("User E2E journey", () => {
  test.use({ baseURL: ENV.UI_BASE_URL });

  const cleanupTasks: Array<() => Promise<void>> = [];

  test.afterEach(async () => {
    while (cleanupTasks.length > 0) {
      const cleanup = cleanupTasks.pop();
      if (cleanup) {
        await cleanup();
      }
    }
  });

  test("registers, logs in, manages users, updates profile, and deletes account", async ({
    page,
  }) => {
    const primaryUser = createUser();

    const seeded = await seedUser();
    const secondaryUser = seeded.user;
    cleanupTasks.push(seeded.cleanup);

    const register = new RegisterPage(page);
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const users = new UsersPage(page);
    const profile = new ProfilePage(page);
    const landing = new LandingPage(page);

    await test.step("Register a new user via UI", async () => {
      await register.goto();
      await register.assertReady();
      await register.register(
        primaryUser.full_name,
        primaryUser.email,
        primaryUser.password
      );

      await expectToast(page, "Account created. Please log in.");
      await page.waitForURL("**/login");
    });

    await test.step("Login as the registered user", async () => {
      await login.assertReady();
      await login.login(primaryUser.email, primaryUser.password);

      await page.waitForURL("**/dashboard");
      await dashboard.assertWelcome();
    });

    await test.step("Edit another user from the list", async () => {
      await users.goto();
      await users.assertReady();

      const updatedName = `${secondaryUser.full_name} Updated`;
      await users.editUser(secondaryUser.email, updatedName);
      await expectToast(page, "User updated.");
    });

    await test.step("Delete the edited user from the list", async () => {
      await users.deleteUser(secondaryUser.email);
      await expectToast(page, "User deleted.");
      await users.assertUserAbsent(secondaryUser.email);
    });

    await test.step("Update profile details", async () => {
      await profile.goto();
      await profile.assertReady();

      const updatedProfileName = `${primaryUser.full_name} Edited`;
      await profile.updateName(updatedProfileName);
      await expectToast(page, "Profile updated.");
    });

    await test.step("Delete the logged-in user from profile", async () => {
      await profile.deleteAccount();
      await page.waitForURL("**/");
      await landing.assertReady();
    });
  });
});
