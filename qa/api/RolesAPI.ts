import { APIRequestContext } from "@playwright/test";

export class RolesAPI {
  constructor(private request: APIRequestContext) {}

  async listRoles() {
    return await this.request.get("/roles");
  }
}
