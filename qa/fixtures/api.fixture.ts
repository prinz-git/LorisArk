import { test as base } from "@playwright/test";
import { APIRequestContext } from "@playwright/test";
import { APIClient } from "../core/APIClient";
import { AuthAPI } from "../api/AuthAPI";
import { UsersAPI } from "../api/UsersAPI";
import { createUser, User } from "../data/userFactory";
import { expectStatus } from "../core/assertions";

type ApiFixture = {
  api: APIRequestContext;
  auth: AuthAPI;
  user: User;
  token: string;
  authedApi: APIRequestContext;
  users: UsersAPI;
};

export const test = base.extend<ApiFixture>({
  api: async ({}, use) => {
    const api = await APIClient.create();
    try {
      await use(api);
    } finally {
      await api.dispose();
    }
  },
  auth: async ({ api }, use) => {
    await use(new AuthAPI(api));
  },
  user: async ({ auth }, use) => {
    const user = createUser();
    const register = await auth.register(user);
    expectStatus(register, 200);
    await use(user);
  },
  token: async ({ auth, user }, use) => {
    const login = await auth.login(user.email, user.password);
    expectStatus(login, 200);
    const token = (await login.json()).access_token;
    await use(token);
  },
  authedApi: async ({ token }, use) => {
    const authedApi = await APIClient.create(token);
    try {
      await use(authedApi);
    } finally {
      try {
        await authedApi.delete("/profile");
      } catch {
        // Best-effort cleanup; ignore failures.
      }
      await authedApi.dispose();
    }
  },
  users: async ({ authedApi }, use) => {
    await use(new UsersAPI(authedApi));
  },
});

export { expect } from "@playwright/test";
