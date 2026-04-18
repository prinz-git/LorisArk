from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
import math

from fastapi import HTTPException

from app.models import Bundle, BundleItem, RootListing, RoostListing, ServiceTicket
from app.repositories.bundling_repo import (
    BundleItemRepository,
    BundleRepository,
    RootDailyCapacityRepository,
    ServiceTicketRepository,
)
from app.repositories.root_repo import RootRepository
from app.repositories.roost_repo import RoostRepository
from app.repositories.user_repo import UserRepository
from app.schemas.bundling import BundleItemRequest, BundlePreviewRequest


WALKING_SPEED_KM_PER_MIN = 5 / 60


def _date_range(start: date, end: date) -> list[date]:
    days = []
    cursor = start
    while cursor <= end:
        days.append(cursor)
        cursor += timedelta(days=1)
    return days


def _parse_days(value: str | None) -> set[int] | None:
    if not value:
        return None
    cleaned = [part.strip().lower() for part in value.split(",") if part.strip()]
    mapping = {
        "mon": 0,
        "monday": 0,
        "tue": 1,
        "tues": 1,
        "tuesday": 1,
        "wed": 2,
        "wednesday": 2,
        "thu": 3,
        "thur": 3,
        "thurs": 3,
        "thursday": 3,
        "fri": 4,
        "friday": 4,
        "sat": 5,
        "saturday": 5,
        "sun": 6,
        "sunday": 6,
    }
    days = set()
    for part in cleaned:
        if part.isdigit():
            days.add(int(part) % 7)
        elif part in mapping:
            days.add(mapping[part])
    return days or None


def _category_group(category: str) -> str:
    value = category.lower()
    if value in {"food", "dining", "breakfast", "coffee", "nourishment"}:
        return "Nourishment"
    if value in {"workshop", "class", "learning", "craft", "knowledge"}:
        return "Knowledge"
    if value in {"guide", "tour", "navigation", "trek", "hike", "guiding"}:
        return "Navigation"
    return "Experience"


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@dataclass
class PreviewLine:
    root: RootListing
    scheduled_date: date
    quantity: int
    unit_price: float


class BundlingService:
    def __init__(
        self,
        roost_repo: RoostRepository,
        root_repo: RootRepository,
        user_repo: UserRepository,
        bundle_repo: BundleRepository,
        bundle_item_repo: BundleItemRepository,
        ticket_repo: ServiceTicketRepository,
        capacity_repo: RootDailyCapacityRepository,
    ):
        self.roost_repo = roost_repo
        self.root_repo = root_repo
        self.user_repo = user_repo
        self.bundle_repo = bundle_repo
        self.bundle_item_repo = bundle_item_repo
        self.ticket_repo = ticket_repo
        self.capacity_repo = capacity_repo

    def _get_user(self, email: str):
        user = self.user_repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def _require_nomad(self, email: str):
        user = self._get_user(email)
        if user.role != "nomad":
            raise HTTPException(status_code=403, detail="Only nomads can bundle stays")
        return user

    def _require_host(self, email: str):
        user = self._get_user(email)
        if user.role != "host":
            raise HTTPException(status_code=403, detail="Only hosts can access this")
        return user

    def _require_artisan(self, email: str):
        user = self._get_user(email)
        if user.role != "artisan":
            raise HTTPException(status_code=403, detail="Only artisans can access this")
        return user

    def list_personalized_roots(
        self,
        roost_id: int,
        max_walk_minutes: int,
        stay_start: date | None,
        stay_end: date | None,
    ) -> list[dict]:
        roost = self.roost_repo.get_by_id(roost_id)
        if not roost:
            raise HTTPException(status_code=404, detail="Roost not found")

        roots = self.root_repo.list_all()
        results = []
        max_distance = max_walk_minutes * WALKING_SPEED_KM_PER_MIN
        for root in roots:
            if not root.is_active:
                continue
            distance_km = None
            walk_minutes = None
            if (
                roost.latitude is not None
                and roost.longitude is not None
                and root.latitude is not None
                and root.longitude is not None
            ):
                distance_km = _haversine_km(
                    roost.latitude, roost.longitude, root.latitude, root.longitude
                )
                if distance_km > max_distance:
                    continue
                walk_minutes = int(round(distance_km / WALKING_SPEED_KM_PER_MIN))
            elif max_walk_minutes:
                continue

            if stay_start and stay_end:
                if not self._overlaps_service_window(root, stay_start, stay_end):
                    continue

            results.append(
                {
                    "id": root.id,
                    "provider_id": root.provider_id,
                    "service_category": root.service_category,
                    "service_description": root.service_description,
                    "service_capacity": root.service_capacity,
                    "remaining_capacity": root.remaining_capacity,
                    "available_days": root.available_days,
                    "service_window_start": root.service_window_start,
                    "service_window_end": root.service_window_end,
                    "is_active": root.is_active,
                    "base_price": root.base_price,
                    "place_name": root.place_name,
                    "latitude": root.latitude,
                    "longitude": root.longitude,
                    "distance_km": distance_km,
                    "walk_minutes": walk_minutes,
                    "category_group": _category_group(root.service_category),
                }
            )
        return results

    def preview_bundle(self, email: str, payload: BundlePreviewRequest) -> dict:
        user = self._require_nomad(email)
        roost = self.roost_repo.get_by_id(payload.roost_id)
        if not roost:
            raise HTTPException(status_code=404, detail="Roost not found")
        if not roost.wifi_active:
            raise HTTPException(status_code=400, detail="Roost wifi is inactive")

        nights = (payload.end_date - payload.start_date).days
        if nights <= 0:
            raise HTTPException(status_code=400, detail="End date must be after start date")

        lines = self._validate_items(payload.items, payload.start_date, payload.end_date)
        timeline = [
            {
                "root_id": line.root.id,
                "scheduled_date": line.scheduled_date,
                "service_category": line.root.service_category,
                "service_description": line.root.service_description,
                "place_name": line.root.place_name,
            }
            for line in lines
        ]

        roost_price = (roost.nightly_rate or 0) * nights
        services_price = sum(line.unit_price * line.quantity for line in lines)
        total = roost_price + services_price
        return {
            "nights": nights,
            "roost_price": round(roost_price, 2),
            "services_price": round(services_price, 2),
            "total_price": round(total, 2),
            "timeline": timeline,
        }

    def checkout_bundle(self, email: str, payload: BundlePreviewRequest) -> dict:
        user = self._require_nomad(email)
        roost = self.roost_repo.get_by_id(payload.roost_id)
        if not roost:
            raise HTTPException(status_code=404, detail="Roost not found")
        if not roost.wifi_active:
            raise HTTPException(status_code=400, detail="Roost wifi is inactive")

        nights = (payload.end_date - payload.start_date).days
        if nights <= 0:
            raise HTTPException(status_code=400, detail="End date must be after start date")

        lines = self._validate_items(payload.items, payload.start_date, payload.end_date)
        roost_price = (roost.nightly_rate or 0) * nights
        services_price = sum(line.unit_price * line.quantity for line in lines)
        total = round(roost_price + services_price, 2)

        bundle = Bundle(
            nomad_id=user.id,
            roost_id=roost.id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            total_price=total,
            status="paid",
        )
        bundle = self.bundle_repo.create(bundle)

        items = []
        tickets = []
        for line in lines:
            items.append(
                BundleItem(
                    bundle_id=bundle.id,
                    root_id=line.root.id,
                    scheduled_date=line.scheduled_date,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    total_price=round(line.unit_price * line.quantity, 2),
                )
            )
            tickets.append(
                ServiceTicket(
                    bundle_id=bundle.id,
                    root_id=line.root.id,
                    nomad_id=user.id,
                    host_id=roost.provider_id,
                    status="new",
                    note=(
                        f"Guest {user.full_name or user.email} booked "
                        f"{line.root.service_category} at {roost.place_name or 'host location'}"
                    ),
                )
            )
            self._consume_capacity(line.root, line.scheduled_date, line.quantity)

        if items:
            self.bundle_item_repo.create_many(items)
        if tickets:
            self.ticket_repo.create_many(tickets)

        return {
            "bundle_id": bundle.id,
            "status": bundle.status,
            "total_price": total,
            "tickets_created": len(tickets),
        }

    def host_partnerships(self, email: str, roost_id: int) -> list[dict]:
        host = self._require_host(email)
        roost = self.roost_repo.get_by_id(roost_id)
        if not roost or roost.provider_id != host.id:
            raise HTTPException(status_code=404, detail="Roost not found")

        bundles = self.bundle_repo.list_by_roost(roost_id)
        bundle_ids = [bundle.id for bundle in bundles]
        items = self.bundle_item_repo.list_by_bundles(bundle_ids)
        root_ids = list({item.root_id for item in items})
        roots = {root.id: root for root in self.root_repo.list_all() if root.id in root_ids}
        artisans = {}
        for item in items:
            root = roots.get(item.root_id)
            if not root:
                continue
            artisan_id = root.provider_id
            artisans.setdefault(artisan_id, set()).add(root.service_description)

        response = []
        for artisan_id, services in artisans.items():
            artisan = self.user_repo.get_by_id(artisan_id)
            response.append(
                {
                    "artisan_id": artisan_id,
                    "artisan_name": artisan.full_name if artisan else None,
                    "services": sorted(list(services)),
                }
            )
        return response

    def host_stay_summaries(self, email: str) -> list[dict]:
        host = self._require_host(email)
        roosts = self.roost_repo.list_by_provider(host.id)
        roosts_by_id = {roost.id: roost for roost in roosts}
        roost_ids = [roost.id for roost in roosts]
        bundles = self.bundle_repo.list_by_roosts(roost_ids)
        bundle_ids = [bundle.id for bundle in bundles]
        items = self.bundle_item_repo.list_by_bundles(bundle_ids)
        items_by_bundle = {}
        for item in items:
            items_by_bundle.setdefault(item.bundle_id, []).append(item)

        roots = {root.id: root for root in self.root_repo.list_all()}
        summaries = []
        for bundle in bundles:
            nomad = self.user_repo.get_by_id(bundle.nomad_id)
            services = []
            for item in items_by_bundle.get(bundle.id, []):
                root = roots.get(item.root_id)
                if root:
                    services.append(root.service_description)
            summaries.append(
                {
                    "bundle_id": bundle.id,
                    "nomad_name": nomad.full_name if nomad else None,
                    "roost_id": bundle.roost_id,
                    "roost_title": (
                        roosts_by_id.get(bundle.roost_id).title
                        if roosts_by_id.get(bundle.roost_id)
                        else None
                    ),
                    "start_date": bundle.start_date,
                    "end_date": bundle.end_date,
                    "services": services,
                }
            )
        return summaries

    def update_wifi_status(self, email: str, roost_id: int, wifi_active: bool) -> dict:
        host = self._require_host(email)
        roost = self.roost_repo.get_by_id(roost_id)
        if not roost or roost.provider_id != host.id:
            raise HTTPException(status_code=404, detail="Roost not found")
        roost.wifi_active = wifi_active
        self.roost_repo.update(roost)
        return {"roost_id": roost.id, "wifi_active": roost.wifi_active}

    def update_capacity(self, email: str, root_id: int, daily_limit: int, date_value: date | None) -> dict:
        artisan = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root or root.provider_id != artisan.id:
            raise HTTPException(status_code=404, detail="Root not found")
        root.service_capacity = daily_limit
        root.remaining_capacity = daily_limit
        self.root_repo.update(root)
        if date_value:
            self.capacity_repo.upsert(root.id, date_value, daily_limit)
        return {"root_id": root.id, "daily_limit": daily_limit, "date": date_value}

    def update_availability(
        self,
        email: str,
        root_id: int,
        available_days: str | None,
        service_window_start: str | None,
        service_window_end: str | None,
    ) -> dict:
        artisan = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root or root.provider_id != artisan.id:
            raise HTTPException(status_code=404, detail="Root not found")
        if available_days is not None:
            root.available_days = available_days
        if service_window_start is not None:
            root.service_window_start = service_window_start
        if service_window_end is not None:
            root.service_window_end = service_window_end
        self.root_repo.update(root)
        return {
            "root_id": root.id,
            "available_days": root.available_days,
            "service_window_start": root.service_window_start,
            "service_window_end": root.service_window_end,
        }

    def list_tickets(self, email: str) -> list[dict]:
        artisan = self._require_artisan(email)
        roots = self.root_repo.list_by_provider(artisan.id)
        root_ids = [root.id for root in roots]
        tickets = self.ticket_repo.list_by_provider(root_ids)
        if not tickets:
            return []

        roots_by_id = {root.id: root for root in roots}
        bundle_ids = list({ticket.bundle_id for ticket in tickets})
        bundles = self.bundle_repo.list_by_ids(bundle_ids)
        bundles_by_id = {bundle.id: bundle for bundle in bundles}
        roost_ids = list({bundle.roost_id for bundle in bundles})
        roosts_by_id = {
            roost.id: roost for roost in self.roost_repo.list_all() if roost.id in roost_ids
        }
        bundle_items = self.bundle_item_repo.list_by_bundles(bundle_ids)
        schedule_by_bundle_root: dict[tuple[int, int], date] = {}
        for item in bundle_items:
            key = (item.bundle_id, item.root_id)
            if key not in schedule_by_bundle_root:
                schedule_by_bundle_root[key] = item.scheduled_date

        enriched = []
        for ticket in tickets:
            root = roots_by_id.get(ticket.root_id)
            bundle = bundles_by_id.get(ticket.bundle_id)
            roost = roosts_by_id.get(bundle.roost_id) if bundle else None
            enriched.append(
                {
                    "id": ticket.id,
                    "bundle_id": ticket.bundle_id,
                    "root_id": ticket.root_id,
                    "nomad_id": ticket.nomad_id,
                    "host_id": ticket.host_id,
                    "status": ticket.status,
                    "note": ticket.note,
                    "service_name": root.service_description if root else None,
                    "service_category": root.service_category if root else None,
                    "roost_name": roost.title if roost else None,
                    "scheduled_date": schedule_by_bundle_root.get(
                        (ticket.bundle_id, ticket.root_id)
                    ),
                    "service_time": root.service_window_start if root else None,
                    "created_at": ticket.created_at,
                }
            )
        return enriched

    def _validate_items(
        self,
        items: list[BundleItemRequest],
        stay_start: date,
        stay_end: date,
    ) -> list[PreviewLine]:
        if not items:
            return []
        root_ids = list({item.root_id for item in items})
        roots = {root.id: root for root in self.root_repo.list_all() if root.id in root_ids}
        lines = []
        for item in items:
            root = roots.get(item.root_id)
            if not root:
                raise HTTPException(status_code=404, detail=f"Root {item.root_id} not found")
            if not root.is_active:
                raise HTTPException(status_code=400, detail="Service is inactive")
            if item.scheduled_date < stay_start or item.scheduled_date > stay_end:
                raise HTTPException(status_code=400, detail="Service date outside stay")
            if not self._overlaps_service_window(root, item.scheduled_date, item.scheduled_date):
                raise HTTPException(status_code=400, detail="Service not available on selected date")
            available = self._remaining_capacity(root, item.scheduled_date)
            if available < item.quantity:
                raise HTTPException(status_code=400, detail="Service capacity exceeded")
            unit_price = root.base_price or 0
            lines.append(
                PreviewLine(
                    root=root,
                    scheduled_date=item.scheduled_date,
                    quantity=item.quantity,
                    unit_price=unit_price,
                )
            )
        return lines

    def _remaining_capacity(self, root: RootListing, target_date: date) -> int:
        record = self.capacity_repo.get(root.id, target_date)
        if record:
            return record.remaining_capacity
        if root.remaining_capacity is not None:
            return root.remaining_capacity
        return root.service_capacity

    def _consume_capacity(self, root: RootListing, target_date: date, quantity: int) -> None:
        remaining = self._remaining_capacity(root, target_date) - quantity
        if remaining < 0:
            raise HTTPException(status_code=400, detail="Service capacity exceeded")
        self.capacity_repo.upsert(root.id, target_date, remaining)

    def _overlaps_service_window(self, root: RootListing, start: date, end: date) -> bool:
        days = _parse_days(root.available_days)
        if not days:
            return True
        for day in _date_range(start, end):
            if day.weekday() in days:
                return True
        return False
