import { APIClient } from "../core/APIClient";
import { AuthAPI } from "../api/AuthAPI";
import { UsersAPI } from "../api/UsersAPI";
import { createUser, User } from "./userFactory";
import { cleanupUser } from "./userCleanup";
import { expectStatus } from "../core/assertions";

export type SeededUser = {
  user: User;
  id: number;
  cleanup: () => Promise<void>;
};

export type LoggedInUser = SeededUser & {
  token: string;
};

export async function seedUser(overrides: Partial<User> = {}): Promise<SeededUser> {
  const request = await APIClient.create();
  const auth = new AuthAPI(request);
  const user = createUser(overrides);
  let id = 0;

  try {
    const register = await auth.register(user);
    expectStatus(register, 200);

    const login = await auth.login(user.email, user.password);
    expectStatus(login, 200);
    const token = (await login.json()).access_token;
    const authed = await APIClient.create(token);
    const users = new UsersAPI(authed);
    const list = await users.listUsers();
    expectStatus(list, 200);
    const usersList = await list.json();
    const match = usersList.find((item: { id: number; email: string }) => item.email === user.email);
    if (!match) {
      throw new Error("Seeded user not found in user listing.");
    }
    id = match.id;
    await authed.dispose();
  } finally {
    await request.dispose();
  }

  const cleanup = async () => {
    await cleanupUser(user);
  };

  return { user, id, cleanup };
}

export async function seedLoggedInUser(
  overrides: Partial<User> = {}
): Promise<LoggedInUser> {
  const { user, id, cleanup } = await seedUser(overrides);
  const request = await APIClient.create();
  const auth = new AuthAPI(request);

  try {
    const login = await auth.login(user.email, user.password);
    expectStatus(login, 200);
    const token = (await login.json()).access_token;
    return { user, id, token, cleanup };
  } finally {
    await request.dispose();
  }
}
