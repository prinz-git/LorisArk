from __future__ import annotations

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import RootListing


class RootRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, root_id: int) -> RootListing | None:
        return (
            self.db.query(RootListing)
            .filter(RootListing.id == root_id, RootListing.is_deleted.is_(False))
            .first()
        )

    def list_all(self, search: str | None = None) -> list[RootListing]:
        query = self.db.query(RootListing).filter(RootListing.is_deleted.is_(False))
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    RootListing.service_category.ilike(like),
                    RootListing.service_description.ilike(like),
                    RootListing.place_name.ilike(like),
                )
            )
        return query.order_by(RootListing.id.desc()).all()

    def list_page(
        self, page: int, limit: int, search: str | None = None
    ) -> tuple[list[RootListing], int]:
        query = self.db.query(RootListing).filter(RootListing.is_deleted.is_(False))
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    RootListing.service_category.ilike(like),
                    RootListing.service_description.ilike(like),
                    RootListing.place_name.ilike(like),
                )
            )
        total = query.with_entities(func.count(RootListing.id)).scalar() or 0
        items = (
            query.order_by(RootListing.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return items, total

    def list_by_provider(self, provider_id: int) -> list[RootListing]:
        return (
            self.db.query(RootListing)
            .filter(
                RootListing.provider_id == provider_id,
                RootListing.is_deleted.is_(False),
            )
            .all()
        )

    def create(self, root: RootListing) -> RootListing:
        self.db.add(root)
        self.db.commit()
        self.db.refresh(root)
        return root

    def update(self, root: RootListing) -> RootListing:
        self.db.add(root)
        self.db.commit()
        self.db.refresh(root)
        return root

    def delete(self, root: RootListing) -> None:
        root.is_deleted = True
        self.db.add(root)
        self.db.commit()
