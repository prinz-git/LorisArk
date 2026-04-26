import { test, expect } from "@playwright/test";
import { createUser, User } from "../../data/userFactory";
import { seedLoggedInUser, seedUser } from "../../data/testData";
import { cleanupUser } from "../../data/userCleanup";
import { ENV } from "../../core/env";
import { expectToast } from "../../ui/components/toast";
import { RegisterPage } from "../../ui/pages/RegisterPage";
import { LoginPage } from "../../ui/pages/LoginPage";
import { DashboardPage } from "../../ui/pages/DashboardPage";
import { UsersPage } from "../../ui/pages/UsersPage";
import { ProfilePage } from "../../ui/pages/ProfilePage";
import { LandingPage } from "../../ui/pages/LandingPage";
import { testIdBuilders, testIds } from "../../ui/testIds";
import { APIClient } from "../../core/APIClient";
import { UsersAPI } from "../../api/UsersAPI";

const TOKEN_KEY = "lorisark_token";

test.use({ baseURL: ENV.UI_BASE_URL });

const cleanupTaskFor = (user: User) => async () => {
  await cleanupUser(user);
};

test.describe("Registration", () => {
  test("Registers a new user", async ({ page }) => {
    const register = new RegisterPage(page);
    const user = createUser();

    try {
      await register.goto();
      await register.assertReady();
      await register.register(user.full_name, user.email, user.password, "host");

      await expectToast(
        page,
        "Account created. Please log in.",
        testIds.register.toast
      );
      await page.waitForURL("**/login");
    } finally {
      await cleanupTaskFor(user)();
    }
  });

  test("Rejects duplicate email", async ({ page }) => {
    const register = new RegisterPage(page);
    const seeded = await seedUser();

    try {
      await register.goto();
      await register.assertReady();
      await register.register(
        seeded.user.full_name,
        seeded.user.email,
        seeded.user.password,
        "nomad"
      );

      await expectToast(page, "User already exists", testIds.register.toast);
    } finally {
      await seeded.cleanup();
    }
  });

  test("Validates required fields and email format", async ({ page }) => {
    const register = new RegisterPage(page);

    await register.goto();
    await register.assertReady();

    await expect(page.getByTestId(testIds.register.fullnameInput)).toHaveAttribute(
      "required",
      ""
    );
    await expect(page.getByTestId(testIds.register.emailInput)).toHaveAttribute(
      "required",
      ""
    );
    await expect(page.getByTestId(testIds.register.passwordInput)).toHaveAttribute(
      "required",
      ""
    );

    const emailInput = page.getByTestId(testIds.register.emailInput);
    await emailInput.fill("not-an-email");
    const isValid = await emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(isValid).toBe(false);

    await register.continueToRole();
    await expectToast(
      page,
      "Please complete all fields to continue.",
      testIds.register.toast
    );
  });
});

test.describe("Login", () => {
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

test.describe("Users", () => {
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

test.describe("User E2E journey", () => {
  const cleanupTasks: Array<() => Promise<void>> = [];

  test.afterEach(async () => {
    while (cleanupTasks.length > 0) {
      const cleanup = cleanupTasks.pop();
      if (cleanup) {
        await cleanup();
      }
    }
  });

  test("registers two users, logs in, manages users, and deletes the primary account", async ({
    page,
  }) => {
    const primaryUser = createUser();
    const secondaryUser = createUser();
    let secondaryUserId: number | null = null;

    cleanupTasks.push(cleanupTaskFor(primaryUser));
    cleanupTasks.push(cleanupTaskFor(secondaryUser));

    const register = new RegisterPage(page);
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const users = new UsersPage(page);
    const profile = new ProfilePage(page);
    const landing = new LandingPage(page);

    await test.step("Register the secondary user via UI", async () => {
      await register.goto();
      await register.assertReady();
      await register.register(
        secondaryUser.full_name,
        secondaryUser.email,
        secondaryUser.password,
        "artisan"
      );

      await expectToast(
        page,
        "Account created. Please log in.",
        testIds.register.toast
      );
      await page.waitForURL("**/login");
    });

    await test.step("Register the primary user via UI", async () => {
      await register.goto();
      await register.assertReady();
      await register.register(
        primaryUser.full_name,
        primaryUser.email,
        primaryUser.password,
        "host"
      );

      await expectToast(
        page,
        "Account created. Please log in.",
        testIds.register.toast
      );
      await page.waitForURL("**/login");
    });

    await test.step("Login as the registered user", async () => {
      await login.assertReady();
      await login.login(primaryUser.email, primaryUser.password);

      await page.waitForURL("**/dashboard");
      await dashboard.assertWelcome();
    });

    await test.step("Resolve the secondary user id via API", async () => {
      const token = await page.evaluate(() =>
        localStorage.getItem("lorisark_token")
      );
      if (!token) {
        throw new Error("Missing auth token after login.");
      }

      const request = await APIClient.create(token);
      const usersApi = new UsersAPI(request);

      try {
        const list = await usersApi.listUsers();
        const usersList = await list.json();
        const match = usersList.find(
          (item: { id: number; email: string }) =>
            item.email === secondaryUser.email
        );
        if (!match) {
          throw new Error("Secondary user not found in listing.");
        }
        secondaryUserId = match.id;
      } finally {
        await request.dispose();
      }
    });

    await test.step("Edit the secondary user from the list", async () => {
      await users.goto();
      await users.assertReady();

      const updatedName = `${secondaryUser.full_name} Updated`;
      await users.editUser(secondaryUserId as number, updatedName);
      await expectToast(page, "User updated.", testIds.editUser.toast);
      await users.backToListFromEdit();
    });

    await test.step("Delete the secondary user from the list", async () => {
      await users.deleteUser(secondaryUserId as number);
      await expectToast(page, "User deleted.", testIds.users.toast);
      await users.assertUserAbsent(secondaryUserId as number);
    });

    await test.step("Delete the primary user from profile", async () => {
      await profile.goto();
      await profile.assertReady();
      await profile.deleteAccount();
      await page.waitForURL("**/");
      await landing.assertReady();
    });
  });
});
