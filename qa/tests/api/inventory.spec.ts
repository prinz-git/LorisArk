import { test, expect } from "../../fixtures/api.fixture";
import { expectStatus } from "../../core/assertions";
import { AuthAPI } from "../../api/AuthAPI";
import { APIClient } from "../../core/APIClient";
import { createUser, User } from "../../data/userFactory";
import { cleanupUser } from "../../data/userCleanup";
import { InventoryAPI } from "../../api/InventoryAPI";
import { APIRequestContext } from "@playwright/test";

type AuthedContext = {
  user: User;
  api: APIRequestContext;
  inventory: InventoryAPI;
};

async function createAuthedContext(auth: AuthAPI, role: User["role"]): Promise<AuthedContext> {
  const user = createUser({ role });
  const register = await auth.register(user);
  expectStatus(register, 200);

  const login = await auth.login(user.email, user.password);
  expectStatus(login, 200);
  const token = (await login.json()).access_token;

  const api = await APIClient.create(token);
  return { user, api, inventory: new InventoryAPI(api) };
}

async function cleanupAuthedContext(context?: AuthedContext) {
  if (!context) {
    return;
  }
  await cleanupUser(context.user);
  try {
    await context.api.dispose();
  } catch {}
}

test("Host can manage roosts", async ({ auth }) => {
  let ctx: AuthedContext | undefined;
  let nomadCtx: AuthedContext | undefined;
  try {
    ctx = await createAuthedContext(auth, "host");
    nomadCtx = await createAuthedContext(auth, "nomad");

    const create = await ctx.inventory.createRoost({
      title: "Garden Suite",
      bedroom_type: "Private room",
      bedroom_count: 1,
      photos: ["https://example.com/room.jpg"],
      wifi_speed_mbps: 180,
      place_name: "Berlin, Germany",
    });
    expectStatus(create, 200);
    const created = await create.json();
    expect(created.id).toBeTruthy();

    const mine = await ctx.inventory.listMyRoosts();
    expectStatus(mine, 200);
    const mineBody = await mine.json();
    expect(mineBody.length).toBe(1);
    expect(mineBody[0].title).toBe("Garden Suite");

    const update = await ctx.inventory.updateRoost(created.id, {
      title: "Garden Suite Updated",
      place_name: "Munich, Germany",
    });
    expectStatus(update, 200);
    const updated = await update.json();
    expect(updated.title).toBe("Garden Suite Updated");

    const del = await ctx.inventory.deleteRoost(created.id);
    expectStatus(del, 200);

    const mineAfter = await ctx.inventory.listMyRoosts();
    expectStatus(mineAfter, 200);
    const mineAfterBody = await mineAfter.json();
    expect(mineAfterBody.length).toBe(0);

    const updateAfterDelete = await ctx.inventory.updateRoost(created.id, {
      title: "Should fail",
    });
    expectStatus(updateAfterDelete, 404);

    const publicList = await nomadCtx.inventory.listRoosts({ page: 1, limit: 20 });
    expectStatus(publicList, 200);
    const publicBody = await publicList.json();
    expect(publicBody.items.some((item: { id: number }) => item.id === created.id)).toBe(
      false
    );
  } finally {
    await cleanupAuthedContext(nomadCtx);
    await cleanupAuthedContext(ctx);
  }
});

test("Artisan can manage roots", async ({ auth }) => {
  let ctx: AuthedContext | undefined;
  let nomadCtx: AuthedContext | undefined;
  try {
    ctx = await createAuthedContext(auth, "artisan");
    nomadCtx = await createAuthedContext(auth, "nomad");

    const create = await ctx.inventory.createRoot({
      service_category: "Food",
      service_description: "Seasonal village supper",
      service_capacity: 4,
      place_name: "Tokyo, Japan",
    });
    expectStatus(create, 200);
    const created = await create.json();
    expect(created.id).toBeTruthy();

    const mine = await ctx.inventory.listMyRoots();
    expectStatus(mine, 200);
    const mineBody = await mine.json();
    expect(mineBody.length).toBe(1);
    expect(mineBody[0].service_category).toBe("Food");

    const update = await ctx.inventory.updateRoot(created.id, {
      service_description: "Chef-led village supper",
      place_name: "Osaka, Japan",
    });
    expectStatus(update, 200);
    const updated = await update.json();
    expect(updated.service_description).toBe("Chef-led village supper");

    const del = await ctx.inventory.deleteRoot(created.id);
    expectStatus(del, 200);

    const mineAfter = await ctx.inventory.listMyRoots();
    expectStatus(mineAfter, 200);
    const mineAfterBody = await mineAfter.json();
    expect(mineAfterBody.length).toBe(0);

    const updateAfterDelete = await ctx.inventory.updateRoot(created.id, {
      service_description: "Should fail",
    });
    expectStatus(updateAfterDelete, 404);

    const publicList = await nomadCtx.inventory.listRoots({ page: 1, limit: 20 });
    expectStatus(publicList, 200);
    const publicBody = await publicList.json();
    expect(publicBody.items.some((item: { id: number }) => item.id === created.id)).toBe(
      false
    );
  } finally {
    await cleanupAuthedContext(nomadCtx);
    await cleanupAuthedContext(ctx);
  }
});

test("Role guard blocks inventory creation", async ({ auth }) => {
  let ctx: AuthedContext | undefined;
  try {
    ctx = await createAuthedContext(auth, "nomad");

    const roost = await ctx.inventory.createRoost({
      title: "Riverside Nook",
      bedroom_type: "Shared",
      wifi_speed_mbps: 90,
      place_name: "New York, USA",
    });
    expectStatus(roost, 403);

    const root = await ctx.inventory.createRoot({
      service_category: "Craft",
      service_description: "Wood carving",
      service_capacity: 3,
      place_name: "Kyoto, Japan",
    });
    expectStatus(root, 403);
  } finally {
    await cleanupAuthedContext(ctx);
  }
});

test("Roost list supports pagination and search", async ({ auth }) => {
  let hostCtx: AuthedContext | undefined;
  let nomadCtx: AuthedContext | undefined;
  const marker = `pw-${Date.now()}`;
  try {
    hostCtx = await createAuthedContext(auth, "host");
    for (let idx = 0; idx < 4; idx += 1) {
      const create = await hostCtx.inventory.createRoost({
        title: `Roost ${idx}`,
        bedroom_type: "Private room",
        bedroom_count: 1,
        photos: [],
        wifi_speed_mbps: 120,
        place_name: idx % 2 === 0 ? `${marker}-Lisbon` : `${marker}-Porto`,
      });
      expectStatus(create, 200);
    }

    nomadCtx = await createAuthedContext(auth, "nomad");
    const page = await nomadCtx.inventory.listRoosts({ page: 1, limit: 2, search: marker });
    expectStatus(page, 200);
    const pageBody = await page.json();
    expect(pageBody.total).toBe(4);
    expect(pageBody.items.length).toBe(2);

    const search = await nomadCtx.inventory.listRoosts({
      page: 1,
      limit: 10,
      search: `${marker}-Porto`,
    });
    expectStatus(search, 200);
    const searchBody = await search.json();
    expect(searchBody.total).toBe(2);
    expect(
      searchBody.items.every(
        (item: { place_name: string }) => item.place_name === `${marker}-Porto`
      )
    ).toBe(true);
  } finally {
    await cleanupAuthedContext(nomadCtx);
    await cleanupAuthedContext(hostCtx);
  }
});
