from fastapi import HTTPException

from app.models import RootListing
from app.repositories.root_repo import RootRepository
from app.repositories.user_repo import UserRepository
from app.schemas.inventory import RootCreate, RootUpdate


class RootServiceManager:
    def __init__(self, root_repo: RootRepository, user_repo: UserRepository):
        self.root_repo = root_repo
        self.user_repo = user_repo

    def _get_user(self, email: str):
        user = self.user_repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def _require_artisan(self, email: str):
        user = self._get_user(email)
        if user.role != "artisan":
            raise HTTPException(
                status_code=403,
                detail="Only artisans can create or manage root listings",
            )
        return user

    def list_all(self) -> list[RootListing]:
        return self.root_repo.list_all()

    def list_mine(self, email: str) -> list[RootListing]:
        user = self._get_user(email)
        return self.root_repo.list_by_provider(user.id)

    def create(self, email: str, payload: RootCreate) -> RootListing:
        user = self._require_artisan(email)
        root = RootListing(provider_id=user.id, **payload.dict())
        return self.root_repo.create(root)

    def update(self, email: str, root_id: int, payload: RootUpdate) -> RootListing:
        user = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root:
            raise HTTPException(status_code=404, detail="Root not found")
        if root.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to edit")
        updates = payload.dict(exclude_unset=True)
        for key, value in updates.items():
            setattr(root, key, value)
        return self.root_repo.update(root)

    def delete(self, email: str, root_id: int) -> None:
        user = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root:
            raise HTTPException(status_code=404, detail="Root not found")
        if root.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to delete")
        self.root_repo.delete(root)
