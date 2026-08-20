from __future__ import annotations

from fastapi import HTTPException

from app.core.roles import RoleEnum
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
        if user.role != RoleEnum.artisan.value:
            raise HTTPException(
                status_code=403,
                detail="Only artisans can create or manage root listings",
            )
        return user

    def list_all(self, search: str | None = None) -> list[RootListing]:
        return self.root_repo.list_all(search)

    def list_page(
        self, page: int, limit: int, search: str | None = None
    ) -> tuple[list[RootListing], int]:
        return self.root_repo.list_page(page, limit, search)

    def list_mine(self, email: str) -> list[RootListing]:
        user = self._get_user(email)
        if user.role == RoleEnum.superadmin.value:
            return self.root_repo.list_all()
        return self.root_repo.list_by_provider(user.id)

    def create(self, email: str, payload: RootCreate) -> RootListing:
        user = self._require_artisan(email)
        data = payload.dict()
        if data.get("remaining_capacity") is None:
            data["remaining_capacity"] = data["service_capacity"]
        root = RootListing(provider_id=user.id, **data)
        return self.root_repo.create(root)

    def update(self, email: str, root_id: int, payload: RootUpdate) -> RootListing:
        user = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root:
            raise HTTPException(status_code=404, detail="Root not found")
        if root.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to edit")
        updates = payload.dict(exclude_unset=True)
        if "service_capacity" in updates and "remaining_capacity" not in updates:
            updates["remaining_capacity"] = updates["service_capacity"]
        for key, value in updates.items():
            setattr(root, key, value)
        return self.root_repo.update(root)

    def require_photo_upload_allowed(self, email: str, root_id: int) -> RootListing:
        user = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root:
            raise HTTPException(status_code=404, detail="Root not found")
        if root.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to edit")
        return root

    def add_photo(self, email: str, root_id: int, photo_url: str) -> RootListing:
        root = self.require_photo_upload_allowed(email, root_id)
        photos = list(root.photos or [])
        photos.append(photo_url)
        root.photos = photos
        return self.root_repo.update(root)

    def delete(self, email: str, root_id: int) -> None:
        user = self._require_artisan(email)
        root = self.root_repo.get_by_id(root_id)
        if not root:
            raise HTTPException(status_code=404, detail="Root not found")
        if root.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to delete")
        self.root_repo.delete(root)
