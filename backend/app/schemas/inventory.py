from __future__ import annotations

from pydantic import BaseModel, Field, root_validator, validator


class RoostAvailabilityRange(BaseModel):
    start_date: str
    end_date: str


def _coerce_live_hidden_status(values: dict) -> dict:
    status = values.get("status")
    if status is None:
        return values
    normalized = str(status).strip().lower()
    values["wifi_active"] = normalized == "live"
    return values


class RoostCreate(BaseModel):
    title: str
    bedroom_type: str
    bedroom_count: int | None = None
    photos: list[str] = Field(default_factory=list)
    wifi_speed_mbps: float
    wifi_active: bool = True
    status: str | None = None
    nightly_rate: float | None = None
    availability_ranges: list[RoostAvailabilityRange] = Field(default_factory=list)
    place_name: str
    latitude: float | None = None
    longitude: float | None = None

    @root_validator(pre=True)
    def _map_status_to_wifi(cls, values):
        return _coerce_live_hidden_status(values)

    @validator("status")
    def _validate_status(cls, value: str | None):
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in {"live", "hidden"}:
            raise ValueError("status must be 'live' or 'hidden'")
        return normalized


class RoostUpdate(BaseModel):
    title: str | None = None
    bedroom_type: str | None = None
    bedroom_count: int | None = None
    photos: list[str] | None = None
    wifi_speed_mbps: float | None = None
    wifi_active: bool | None = None
    status: str | None = None
    nightly_rate: float | None = None
    availability_ranges: list[RoostAvailabilityRange] | None = None
    place_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    @root_validator(pre=True)
    def _map_status_to_wifi(cls, values):
        return _coerce_live_hidden_status(values)

    @validator("status")
    def _validate_status(cls, value: str | None):
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in {"live", "hidden"}:
            raise ValueError("status must be 'live' or 'hidden'")
        return normalized


class RoostResponse(BaseModel):
    id: int
    provider_id: int
    title: str
    bedroom_type: str
    bedroom_count: int | None
    photos: list[str]
    wifi_speed_mbps: float
    wifi_active: bool
    nightly_rate: float | None
    availability_ranges: list[RoostAvailabilityRange] | None
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
    remaining_capacity: int | None = None
    available_days: str | None = None
    service_window_start: str | None = None
    service_window_end: str | None = None
    is_active: bool = True
    base_price: float | None = None
    place_name: str
    latitude: float | None = None
    longitude: float | None = None


class RootUpdate(BaseModel):
    service_category: str | None = None
    service_description: str | None = None
    service_capacity: int | None = None
    remaining_capacity: int | None = None
    available_days: str | None = None
    service_window_start: str | None = None
    service_window_end: str | None = None
    is_active: bool | None = None
    base_price: float | None = None
    place_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class RootResponse(BaseModel):
    id: int
    provider_id: int
    service_category: str
    service_description: str
    service_capacity: int
    remaining_capacity: int | None
    available_days: str | None
    service_window_start: str | None
    service_window_end: str | None
    is_active: bool
    base_price: float | None
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
