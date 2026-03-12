import { test as base } from "@playwright/test";
import { APIClient } from "../core/APIClient";
import { AuthAPI } from "../api/AuthAPI";
import { createUser } from "../data/userFactory";

type AuthFixture = {
  token: string;
};

export const test = base.extend<AuthFixture>({
  
  token: async ({}, use) => {

    const request = await APIClient.create();
    const auth = new AuthAPI(request);

    const user = createUser();

    await auth.register(user);

    const login = await auth.login(user.email, user.password);

    const token = (await login.json()).access_token;

    await use(token);

  }

});

export { expect } from "@playwright/test";