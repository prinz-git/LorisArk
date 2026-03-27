import { request, APIRequestContext } from "@playwright/test";
import { ENV } from "./env";

export class APIClient {
  static async create(token?: string): Promise<APIRequestContext> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return await request.newContext({
      baseURL: ENV.API_BASE_URL,
      extraHTTPHeaders: headers,
    });
  }
}
