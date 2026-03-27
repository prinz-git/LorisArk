import { expect, APIResponse } from "@playwright/test";

export function expectStatus(response: APIResponse, status: number) {
  expect(response.status()).toBe(status);
}
