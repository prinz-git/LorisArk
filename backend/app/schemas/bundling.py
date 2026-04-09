from datetime import date, datetime

from pydantic import BaseModel, Field


class RootPersonalizedResponse(BaseModel):
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
    distance_km: float | None
    walk_minutes: int | None
    category_group: str


class BundleItemRequest(BaseModel):
    root_id: int
    scheduled_date: date
    quantity: int = Field(default=1, ge=1)


class BundlePreviewRequest(BaseModel):
    roost_id: int
    start_date: date
    end_date: date
    items: list[BundleItemRequest] = Field(default_factory=list)


class BundleTimelineItem(BaseModel):
    root_id: int
    scheduled_date: date
    service_category: str
    service_description: str
    place_name: str | None


class BundlePreviewResponse(BaseModel):
    nights: int
    roost_price: float
    services_price: float
    total_price: float
    timeline: list[BundleTimelineItem]


class BundleCheckoutResponse(BaseModel):
    bundle_id: int
    status: str
    total_price: float
    tickets_created: int


class HostPartnership(BaseModel):
    artisan_id: int
    artisan_name: str | None
    services: list[str]


class HostStaySummaryItem(BaseModel):
    bundle_id: int
    nomad_name: str | None
    roost_id: int
    start_date: date
    end_date: date
    services: list[str]


class WifiStatusUpdate(BaseModel):
    wifi_active: bool


class CapacityUpdate(BaseModel):
    daily_limit: int = Field(ge=1)
    date: date | None = None


class AvailabilityUpdate(BaseModel):
    available_days: str | None = None
    service_window_start: str | None = None
    service_window_end: str | None = None


class ServiceTicketResponse(BaseModel):
    id: int
    bundle_id: int
    root_id: int
    nomad_id: int
    host_id: int
    status: str
    note: str | None
    created_at: datetime | None

    class Config:
        orm_mode = True
