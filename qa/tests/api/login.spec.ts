import { test, expect } from "@playwright/test";
import { APIClient } from "../../core/APIClient";
import { AuthAPI } from "../../api/AuthAPI";
import { createUser } from "../../data/userFactory";

test("User can register and login", async () => {

  const request = await APIClient.create();
  const auth = new AuthAPI(request);

  const user = createUser();

  const register = await auth.register(user);
  expect(register.status()).toBe(200);

  const login = await auth.login(user.email, user.password);
  expect(login.status()).toBe(200);

  const body = await login.json();
  expect(body.access_token).toBeTruthy();

});