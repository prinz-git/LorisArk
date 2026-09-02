from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.models import Bundle, BundleItem, RootDailyCapacity, ServiceTicket


class BundleRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, bundle: Bundle) -> Bundle:
        self.db.add(bundle)
        self.db.commit()
        self.db.refresh(bundle)
        return bundle

    def list_by_roost(self, roost_id: int) -> list[Bundle]:
        return self.db.query(Bundle).filter(Bundle.roost_id == roost_id).all()

    def list_by_roosts(self, roost_ids: list[int]) -> list[Bundle]:
        if not roost_ids:
            return []
        return self.db.query(Bundle).filter(Bundle.roost_id.in_(roost_ids)).all()

    def list_by_ids(self, bundle_ids: list[int]) -> list[Bundle]:
        if not bundle_ids:
            return []
        return self.db.query(Bundle).filter(Bundle.id.in_(bundle_ids)).all()

    def list_by_nomad(self, nomad_id: int) -> list[Bundle]:
        return (
            self.db.query(Bundle)
            .filter(Bundle.nomad_id == nomad_id)
            .order_by(Bundle.start_date.desc(), Bundle.id.desc())
            .all()
        )

    def list_all(self) -> list[Bundle]:
        return (
            self.db.query(Bundle)
            .order_by(Bundle.start_date.desc(), Bundle.id.desc())
            .all()
        )

    def get_by_id(self, bundle_id: int) -> Bundle | None:
        return self.db.query(Bundle).filter(Bundle.id == bundle_id).first()

    def update(self, bundle: Bundle) -> Bundle:
        self.db.add(bundle)
        self.db.commit()
        self.db.refresh(bundle)
        return bundle


class BundleItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_many(self, items: list[BundleItem]) -> None:
        self.db.add_all(items)
        self.db.commit()

    def list_by_bundle(self, bundle_id: int) -> list[BundleItem]:
        return self.db.query(BundleItem).filter(BundleItem.bundle_id == bundle_id).all()

    def list_by_bundles(self, bundle_ids: list[int]) -> list[BundleItem]:
        if not bundle_ids:
            return []
        return self.db.query(BundleItem).filter(BundleItem.bundle_id.in_(bundle_ids)).all()


class ServiceTicketRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_many(self, tickets: list[ServiceTicket]) -> None:
        self.db.add_all(tickets)
        self.db.commit()

    def list_by_provider(self, root_ids: list[int]) -> list[ServiceTicket]:
        if not root_ids:
            return []
        return (
            self.db.query(ServiceTicket)
            .filter(ServiceTicket.root_id.in_(root_ids))
            .order_by(ServiceTicket.created_at.desc())
            .all()
        )

    def get_by_id(self, ticket_id: int) -> ServiceTicket | None:
        return self.db.query(ServiceTicket).filter(ServiceTicket.id == ticket_id).first()

    def update(self, ticket: ServiceTicket) -> ServiceTicket:
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket


class RootDailyCapacityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, root_id: int, target_date: date) -> RootDailyCapacity | None:
        return (
            self.db.query(RootDailyCapacity)
            .filter(
                RootDailyCapacity.root_id == root_id,
                RootDailyCapacity.date == target_date,
            )
            .first()
        )

    def upsert(self, root_id: int, target_date: date, remaining: int) -> RootDailyCapacity:
        record = self.get(root_id, target_date)
        if record:
            record.remaining_capacity = remaining
        else:
            record = RootDailyCapacity(
                root_id=root_id, date=target_date, remaining_capacity=remaining
            )
            self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
