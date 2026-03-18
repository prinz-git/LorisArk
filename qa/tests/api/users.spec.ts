import { test, expect } from "../../fixtures/api.fixture";
import { expectStatus } from "../../core/assertions";

test("User profile flow", async ({ users }) => {
  const profile = await users.profile();
  expectStatus(profile, 200);

  const list = await users.listUsers();
  expectStatus(list, 200);

  const usersList = await list.json();
  expect(usersList.length).toBeGreaterThan(0);

  const id = usersList[0].id;
  const edit = await users.editUser(id, "Updated Name");
  expectStatus(edit, 200);
});
