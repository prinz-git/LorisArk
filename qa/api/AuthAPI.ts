import { APIRequestContext } from "@playwright/test";

export class AuthAPI {

  constructor(private request: APIRequestContext) {}

  async register(user: any) {

    return await this.request.post("/register", {
      data: user
    });

  }

  async login(email: string, password: string) {

    return await this.request.post("/login", {
      data: {
        email,
        password
      }
    });

  }

  async logout() {

    return await this.request.post("/logout");

  }

}