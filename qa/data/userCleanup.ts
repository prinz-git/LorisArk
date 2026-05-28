import { AuthAPI } from "../api/AuthAPI";
import { InventoryAPI } from "../api/InventoryAPI";
import { UsersAPI } from "../api/UsersAPI";
import { APIClient } from "../core/APIClient";
import { User } from "./userFactory";

async function cleanupInventory(token: string) {
  const authed = await APIClient.create(token);
  const inventory = new InventoryAPI(authed);

  try {
    const myRoosts = await inventory.listMyRoosts();
    if (myRoosts.status() === 200) {
      const roosts = await myRoosts.json();
      for (const roost of roosts) {
        await inventory.deleteRoost(roost.id);
      }
    }

    const myRoots = await inventory.listMyRoots();
    if (myRoots.status() === 200) {
      const roots = await myRoots.json();
      for (const root of roots) {
        await inventory.deleteRoot(root.id);
      }
    }
  } finally {
    await authed.dispose();
  }
}

export async function cleanupUser(user: User) {
  try {
    const request = await APIClient.create();
    const auth = new AuthAPI(request);
    try {
      const login = await auth.login(user.email, user.password);
      if (login.status() !== 200) {
        return;
      }

      const token = (await login.json()).access_token;
      await cleanupInventory(token);

      const authed = await APIClient.create(token);
      const users = new UsersAPI(authed);
      try {
        await users.deleteProfile();
      } finally {
        await authed.dispose();
      }
    } finally {
      await request.dispose();
    }
  } catch {
    // Best-effort cleanup for test data. Never fail a test because cleanup could not run.
  }
}
