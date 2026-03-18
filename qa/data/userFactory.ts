export type User = {
  email: string;
  password: string;
  full_name: string;
};

export function createUser(overrides: Partial<User> = {}): User {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

  return {
    email: `user${unique}@test.com`,
    password: "123456",
    full_name: "Playwright Test User",
    ...overrides,
  };
}
