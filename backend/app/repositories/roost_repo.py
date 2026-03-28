from sqlalchemy.orm import Session

from app.models import RoostListing


class RoostRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, roost_id: int) -> RoostListing | None:
        return self.db.query(RoostListing).filter(RoostListing.id == roost_id).first()

    def list_all(self) -> list[RoostListing]:
        return self.db.query(RoostListing).all()

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
