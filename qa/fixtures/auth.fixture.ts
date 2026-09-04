import { test as base } from "@playwright/test";
import { APIClient } from "../core/APIClient";
import { AuthAPI } from "../api/AuthAPI";
import { createUser } from "../data/userFactory";
import { cleanupUser } from "../data/userCleanup";
import { expectStatus } from "../core/assertions";

type AuthFixture = {
  token: string;
};

export const test = base.extend<AuthFixture>({
  token: async ({}, use) => {
    const request = await APIClient.create();
    const auth = new AuthAPI(request);
    const user = createUser();

    try {
      const register = await auth.register(user);
      expectStatus(register, 200);

      const login = await auth.login(user.email, user.password);
      expectStatus(login, 200);

      const token = (await login.json()).access_token;
      await use(token);
    } finally {
      await request.dispose();
      await cleanupUser(user);
    }
  },
});

export { expect } from "@playwright/test";
