import { APIRequestContext } from "@playwright/test";

type RoostCreate = {
  title: string;
  bedroom_type: string;
  bedroom_count?: number;
  photos?: string[];
  wifi_speed_mbps: number;
  place_name: string;
  latitude?: number;
  longitude?: number;
};

type RoostUpdate = Partial<RoostCreate>;

type RootCreate = {
  service_category: string;
  service_description: string;
  service_capacity: number;
  place_name: string;
  latitude?: number;
  longitude?: number;
};

type RootUpdate = Partial<RootCreate>;

export class InventoryAPI {
  constructor(private request: APIRequestContext) {}

  async listRoosts(params?: { page?: number; limit?: number; search?: string }) {
    return await this.request.get("/roosts", { params });
  }

  async listMyRoosts() {
    return await this.request.get("/roosts/mine");
  }

  async createRoost(payload: RoostCreate) {
    return await this.request.post("/roosts", { data: payload });
  }

  async updateRoost(id: number, payload: RoostUpdate) {
    return await this.request.put(`/roosts/${id}`, { data: payload });
  }

  async deleteRoost(id: number) {
    return await this.request.delete(`/roosts/${id}`);
  }

  async listRoots(params?: { page?: number; limit?: number; search?: string }) {
    return await this.request.get("/roots", { params });
  }

  async listMyRoots() {
    return await this.request.get("/roots/mine");
  }

  async createRoot(payload: RootCreate) {
    return await this.request.post("/roots", { data: payload });
  }

  async updateRoot(id: number, payload: RootUpdate) {
    return await this.request.put(`/roots/${id}`, { data: payload });
  }

  async deleteRoot(id: number) {
    return await this.request.delete(`/roots/${id}`);
  }
}
