import { APIRequestContext } from "@playwright/test";

export class UsersAPI {

  constructor(private request: APIRequestContext) {}

  async profile() {

    return await this.request.get("/profile");

  }

  async listUsers() {

    return await this.request.get("/users");

  }

  async editProfile(fullName: string) {

    return await this.request.put("/profile", {
      params: {
        full_name: fullName
      }
    });

  }

  async deleteProfile() {

    return await this.request.delete("/profile");

  }

  async editUser(id: number, fullName: string) {

    return await this.request.put(`/users/${id}`, {
      params: {
        full_name: fullName
      }
    });

  }

  async deleteUser(id: number) {

    return await this.request.delete(`/users/${id}`);

  }

}