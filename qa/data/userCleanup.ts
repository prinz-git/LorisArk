import { AuthAPI } from "../api/AuthAPI";
import { UsersAPI } from "../api/UsersAPI";
import { APIClient } from "../core/APIClient";
import { User } from "./userFactory";

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
