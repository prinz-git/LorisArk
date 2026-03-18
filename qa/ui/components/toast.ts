import { expect, Page } from "@playwright/test";

export async function expectToast(page: Page, message: string) {
  await expect(page.getByRole("status")).toHaveText(message);
}
