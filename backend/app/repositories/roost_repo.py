from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import RoostListing


class RoostRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, roost_id: int) -> RoostListing | None:
        return self.db.query(RoostListing).filter(RoostListing.id == roost_id).first()

    def list_all(self, search: str | None = None) -> list[RoostListing]:
        query = self.db.query(RoostListing)
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    RoostListing.title.ilike(like),
                    RoostListing.bedroom_type.ilike(like),
                    RoostListing.place_name.ilike(like),
                )
            )
        return query.order_by(RoostListing.id.desc()).all()

    def list_page(
        self, page: int, limit: int, search: str | None = None
    ) -> tuple[list[RoostListing], int]:
        query = self.db.query(RoostListing)
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    RoostListing.title.ilike(like),
                    RoostListing.bedroom_type.ilike(like),
                    RoostListing.place_name.ilike(like),
                )
            )
        total = query.with_entities(func.count()).scalar() or 0
        items = (
            query.order_by(RoostListing.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return items, total

    def list_by_provider(self, provider_id: int) -> list[RoostListing]:
        return (
            self.db.query(RoostListing)
            .filter(RoostListing.provider_id == provider_id)
            .all()
        )

    def create(self, roost: RoostListing) -> RoostListing:
        self.db.add(roost)
        self.db.commit()
        self.db.refresh(roost)
        return roost

    def update(self, roost: RoostListing) -> RoostListing:
        self.db.add(roost)
        self.db.commit()
        self.db.refresh(roost)
        return roost

    def delete(self, roost: RoostListing) -> None:
        self.db.delete(roost)
        self.db.commit()
