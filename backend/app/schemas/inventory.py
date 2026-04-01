from pydantic import BaseModel, Field


class RoostCreate(BaseModel):
    title: str
    bedroom_type: str
    bedroom_count: int | None = None
    photos: list[str] = Field(default_factory=list)
    wifi_speed_mbps: float
    place_name: str
    latitude: float | None = None
    longitude: float | None = None


class RoostUpdate(BaseModel):
    title: str | None = None
    bedroom_type: str | None = None
    bedroom_count: int | None = None
    photos: list[str] | None = None
    wifi_speed_mbps: float | None = None
    place_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class RoostResponse(BaseModel):
    id: int
    provider_id: int
    title: str
    bedroom_type: str
    bedroom_count: int | None
    photos: list[str]
    wifi_speed_mbps: float
    place_name: str | None
    latitude: float | None
    longitude: float | None

    class Config:
        orm_mode = True


class RoostPage(BaseModel):
    items: list[RoostResponse]
    total: int
    page: int
    limit: int


class RootCreate(BaseModel):
    service_category: str
    service_description: str
    service_capacity: int
    place_name: str
    latitude: float | None = None
    longitude: float | None = None


class RootUpdate(BaseModel):
    service_category: str | None = None
    service_description: str | None = None
    service_capacity: int | None = None
    place_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class RootResponse(BaseModel):
    id: int
    provider_id: int
    service_category: str
    service_description: str
    service_capacity: int
    place_name: str | None
    latitude: float | None
    longitude: float | None

    class Config:
        orm_mode = True


class RootPage(BaseModel):
    items: list[RootResponse]
    total: int
    page: int
    limit: int
