export function createUser() {

  const random = Math.floor(Math.random() * 100000);

  return {
    email: `user${random}@test.com`,
    password: "123456",
    full_name: "Playwright Test User"
  };
}