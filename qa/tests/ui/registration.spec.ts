import { test, expect } from "@playwright/test";
import { ENV } from "../../core/env";
import { RegisterPage } from "../../ui/pages/RegisterPage";
import { expectToast } from "../../ui/components/toast";
import { testIds } from "../../ui/testIds";
import { createUser, User } from "../../data/userFactory";
import { seedUser } from "../../data/testData";
import { APIClient } from "../../core/APIClient";
import { AuthAPI } from "../../api/AuthAPI";
import { UsersAPI } from "../../api/UsersAPI";

async function cleanupUser(user: User) {
  const request = await APIClient.create();
  const auth = new AuthAPI(request);

  try {
    const login = await auth.login(user.email, user.password);
    if (login.status() !== 200) {
      return;
    }

    const token = (await login.json()).access_token;
    const authed = await APIClient.create(token);
    const users = new UsersAPI(authed);
    await users.deleteProfile();
    await authed.dispose();
  } finally {
    await request.dispose();
  }
}

test.describe("Registration", () => {
  test.use({ baseURL: ENV.UI_BASE_URL });

  test("Registers a new user", async ({ page }) => {
    const register = new RegisterPage(page);
    const user = createUser();

    try {
      await register.goto();
      await register.assertReady();
      await register.register(user.full_name, user.email, user.password);

      await expectToast(
        page,
        "Account created. Please log in.",
        testIds.register.toast
      );
      await page.waitForURL("**/login");
    } finally {
      await cleanupUser(user);
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
        seeded.user.password
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
  });
});
