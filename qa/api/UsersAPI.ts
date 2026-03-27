import { APIRequestContext } from "@playwright/test";

export class UsersAPI {

  constructor(private request: APIRequestContext) {}

  async profile() {

    return await this.request.get("/profile");

  }

  async listUsers() {

    return await this.request.get("/users");

  }

  async editProfile(fullName: string, role?: string) {
    const params: Record<string, string> = {
      full_name: fullName,
    };
    if (role) {
      params.role = role;
    }

    return await this.request.put("/profile", { params });
  }

  async deleteProfile() {

    return await this.request.delete("/profile");

  }

  async editUser(id: number, fullName: string, role?: string) {
    const params: Record<string, string> = {
      full_name: fullName,
    };
    if (role) {
      params.role = role;
    }

    return await this.request.put(`/users/${id}`, { params });
  }

  async deleteUser(id: number) {

    return await this.request.delete(`/users/${id}`);

  }

}
