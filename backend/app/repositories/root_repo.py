from sqlalchemy.orm import Session

from app.models import RootListing


class RootRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, root_id: int) -> RootListing | None:
        return self.db.query(RootListing).filter(RootListing.id == root_id).first()

    def list_all(self) -> list[RootListing]:
        return self.db.query(RootListing).all()

    def list_by_provider(self, provider_id: int) -> list[RootListing]:
        return (
            self.db.query(RootListing)
            .filter(RootListing.provider_id == provider_id)
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
        self.db.delete(root)
        self.db.commit()
