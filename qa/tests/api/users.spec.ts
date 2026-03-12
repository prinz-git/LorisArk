import { test, expect } from "../../fixtures/auth.fixture";
import { APIClient } from "../../core/APIClient";
import { UsersAPI } from "../../api/UsersAPI";

test("User profile flow", async ({ token }) => {

  const request = await APIClient.create(token);
  const users = new UsersAPI(request);

  const profile = await users.profile();
  expect(profile.status()).toBe(200);

  const list = await users.listUsers();
  expect(list.status()).toBe(200);

  const usersList = await list.json();
  const id = usersList[0].id;

  const edit = await users.editUser(id, "Updated Name");
  expect(edit.status()).toBe(200);

});