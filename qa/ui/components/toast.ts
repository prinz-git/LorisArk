import { expect, Page } from "@playwright/test";

export async function expectToast(
  page: Page,
  message: string | RegExp,
  testId = "toast"
) {
  await expect(page.getByTestId(testId)).toHaveText(message);
}
