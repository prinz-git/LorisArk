import { test, expect } from "../../fixtures/api.fixture";
import { expectStatus } from "../../core/assertions";
import { RolesAPI } from "../../api/RolesAPI";

test("User profile flow", async ({ users }) => {
  const profile = await users.profile();
  expectStatus(profile, 200);
  const profileBody = await profile.json();
  expect(profileBody.role).toBeTruthy();

  const list = await users.listUsers();
  expectStatus(list, 200);

  const usersList = await list.json();
  expect(usersList.length).toBeGreaterThan(0);
  expect(usersList[0].role).toBeTruthy();

  const id = usersList[0].id;
  const edit = await users.editUser(id, "Updated Name", "artisan");
  expectStatus(edit, 200);
});

test("Profile role updates", async ({ users }) => {
  const update = await users.editProfile("Updated Profile", "host");
  expectStatus(update, 200);

  const profile = await users.profile();
  expectStatus(profile, 200);
  const body = await profile.json();
  expect(body.role).toBe("host");
});

test("Roles list is available", async ({ api }) => {
  const roles = new RolesAPI(api);
  const resp = await roles.listRoles();
  expectStatus(resp, 200);

  const body = await resp.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThan(0);
  expect(["nomad", "host", "artisan"]).toContain(body[0].id);
});
