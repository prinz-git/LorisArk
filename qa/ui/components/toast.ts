import { expect, Page } from "@playwright/test";

export async function expectToast(
  page: Page,
  message: string,
  testId = "toast"
) {
  await expect(page.getByTestId(testId)).toHaveText(message);
}
