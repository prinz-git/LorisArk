from __future__ import annotations

from datetime import date as dt_date
from datetime import datetime

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
    scheduled_date: dt_date
    quantity: int = Field(default=1, ge=1)


class BundlePreviewRequest(BaseModel):
    roost_id: int
    start_date: dt_date
    end_date: dt_date
    items: list[BundleItemRequest] = Field(default_factory=list)


class BundleTimelineItem(BaseModel):
    root_id: int
    scheduled_date: dt_date
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


class NomadBookingItem(BaseModel):
    bundle_id: int
    roost_id: int
    roost_title: str | None
    roost_place_name: str | None
    start_date: dt_date
    end_date: dt_date
    total_price: float
    status: str
    services: list[str]


class NomadBookingsResponse(BaseModel):
    active_upcoming: list[NomadBookingItem]
    past_stays: list[NomadBookingItem]
    cancelled_pending: list[NomadBookingItem]


class HostPartnership(BaseModel):
    artisan_id: int
    artisan_name: str | None
    services: list[str]


class HostStaySummaryItem(BaseModel):
    bundle_id: int
    nomad_name: str | None
    roost_id: int
    roost_title: str | None = None
    start_date: dt_date
    end_date: dt_date
    status: str
    services: list[str]


class WifiStatusUpdate(BaseModel):
    wifi_active: bool


class CapacityUpdate(BaseModel):
    daily_limit: int = Field(ge=1)
    # Avoid name collision with the field name "date" during annotation eval.
    date: dt_date | None = None


class AvailabilityUpdate(BaseModel):
    available_days: str | None = None
    service_window_start: str | None = None
    service_window_end: str | None = None


class BookingDecisionRequest(BaseModel):
    reason: str | None = None


class BookingDecisionResponse(BaseModel):
    id: int
    status: str
    reason: str | None = None


class ServiceTicketResponse(BaseModel):
    id: int
    bundle_id: int
    root_id: int
    nomad_id: int
    host_id: int
    status: str
    note: str | None
    host_status: str | None = None
    host_name: str | None = None
    host_confirmation_message: str | None = None
    service_name: str | None = None
    service_category: str | None = None
    roost_name: str | None = None
    scheduled_date: dt_date | None = None
    service_time: str | None = None
    created_at: datetime | None

    class Config:
        orm_mode = True
