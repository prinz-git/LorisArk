from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email, get_db_session
from app.repositories.bundling_repo import (
    BundleItemRepository,
    BundleRepository,
    RootDailyCapacityRepository,
    ServiceTicketRepository,
)
from app.repositories.roost_repo import RoostRepository
from app.repositories.root_repo import RootRepository
from app.repositories.user_repo import UserRepository
from app.schemas.bundling import (
    AvailabilityUpdate,
    BookingDecisionRequest,
    BookingDecisionResponse,
    BundleCheckoutResponse,
    NomadBookingsResponse,
    BundlePreviewRequest,
    BundlePreviewResponse,
    CapacityUpdate,
    HostPartnership,
    HostStaySummaryItem,
    RootPersonalizedResponse,
    ServiceTicketResponse,
    WifiStatusUpdate,
)
from app.services.bundling_service import BundlingService


router = APIRouter()


def _service(db: Session) -> BundlingService:
    return BundlingService(
        RoostRepository(db),
        RootRepository(db),
        UserRepository(db),
        BundleRepository(db),
        BundleItemRepository(db),
        ServiceTicketRepository(db),
        RootDailyCapacityRepository(db),
    )


@router.get("/nomad/roosts/{roost_id}/roots", response_model=list[RootPersonalizedResponse])
def personalized_roots(
    roost_id: int,
    max_walk_minutes: int = Query(15, ge=1, le=60),
    stay_start: date | None = Query(default=None),
    stay_end: date | None = Query(default=None),
    _: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.list_personalized_roots(roost_id, max_walk_minutes, stay_start, stay_end)


@router.post("/nomad/bundles/preview", response_model=BundlePreviewResponse)
def preview_bundle(
    payload: BundlePreviewRequest,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.preview_bundle(email, payload)


@router.post("/nomad/bundles/checkout", response_model=BundleCheckoutResponse)
def checkout_bundle(
    payload: BundlePreviewRequest,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.checkout_bundle(email, payload)


@router.get("/nomad/bookings", response_model=NomadBookingsResponse)
def list_nomad_bookings(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.list_nomad_bookings(email)


@router.put("/nomad/bookings/{bundle_id}/cancel")
def cancel_nomad_booking(
    bundle_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.cancel_nomad_booking(email, bundle_id)


@router.get("/host/roosts/{roost_id}/partnerships", response_model=list[HostPartnership])
def host_partnerships(
    roost_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.host_partnerships(email, roost_id)


@router.get("/host/stays/summary", response_model=list[HostStaySummaryItem])
def host_stay_summaries(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.host_stay_summaries(email)


@router.put("/host/bookings/{bundle_id}/accept", response_model=BookingDecisionResponse)
def accept_host_booking(
    bundle_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.accept_host_booking(email, bundle_id)


@router.put("/host/bookings/{bundle_id}/decline", response_model=BookingDecisionResponse)
def decline_host_booking(
    bundle_id: int,
    payload: BookingDecisionRequest | None = None,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.decline_host_booking(email, bundle_id, payload.reason if payload else None)


@router.put("/host/roosts/{roost_id}/wifi-status")
def update_wifi_status(
    roost_id: int,
    payload: WifiStatusUpdate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.update_wifi_status(email, roost_id, payload.wifi_active)


@router.put("/artisan/roots/{root_id}/capacity")
def update_capacity(
    root_id: int,
    payload: CapacityUpdate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.update_capacity(email, root_id, payload.daily_limit, payload.date)


@router.put("/artisan/roots/{root_id}/availability")
def update_availability(
    root_id: int,
    payload: AvailabilityUpdate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.update_availability(
        email,
        root_id,
        payload.available_days,
        payload.service_window_start,
        payload.service_window_end,
    )


@router.get("/artisan/tickets", response_model=list[ServiceTicketResponse])
def list_tickets(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.list_tickets(email)


@router.put("/artisan/tickets/{ticket_id}/accept", response_model=BookingDecisionResponse)
def accept_artisan_ticket(
    ticket_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.accept_artisan_ticket(email, ticket_id)


@router.put("/artisan/tickets/{ticket_id}/decline", response_model=BookingDecisionResponse)
def decline_artisan_ticket(
    ticket_id: int,
    payload: BookingDecisionRequest | None = None,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = _service(db)
    return service.decline_artisan_ticket(email, ticket_id, payload.reason if payload else None)
