from fastapi import HTTPException

from app.models import RoostListing
from app.repositories.roost_repo import RoostRepository
from app.repositories.user_repo import UserRepository
from app.schemas.inventory import RoostCreate, RoostUpdate


class RoostService:
    def __init__(self, roost_repo: RoostRepository, user_repo: UserRepository):
        self.roost_repo = roost_repo
        self.user_repo = user_repo

    def _get_user(self, email: str):
        user = self.user_repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def _require_host(self, email: str):
        user = self._get_user(email)
        if user.role != "host":
            raise HTTPException(
                status_code=403,
                detail="Only hosts can create or manage roost listings",
            )
        return user

    def list_all(self, search: str | None = None) -> list[RoostListing]:
        return self.roost_repo.list_all(search)

    def list_page(
        self, page: int, limit: int, search: str | None = None
    ) -> tuple[list[RoostListing], int]:
        return self.roost_repo.list_page(page, limit, search)

    def list_mine(self, email: str) -> list[RoostListing]:
        user = self._get_user(email)
        return self.roost_repo.list_by_provider(user.id)

    def create(self, email: str, payload: RoostCreate) -> RoostListing:
        user = self._require_host(email)
        roost = RoostListing(provider_id=user.id, **payload.dict())
        return self.roost_repo.create(roost)

    def update(self, email: str, roost_id: int, payload: RoostUpdate) -> RoostListing:
        user = self._require_host(email)
        roost = self.roost_repo.get_by_id(roost_id)
        if not roost:
            raise HTTPException(status_code=404, detail="Roost not found")
        if roost.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to edit")
        updates = payload.dict(exclude_unset=True)
        for key, value in updates.items():
            setattr(roost, key, value)
        return self.roost_repo.update(roost)

    def delete(self, email: str, roost_id: int) -> None:
        user = self._require_host(email)
        roost = self.roost_repo.get_by_id(roost_id)
        if not roost:
            raise HTTPException(status_code=404, detail="Roost not found")
        if roost.provider_id != user.id:
            raise HTTPException(status_code=403, detail="Not allowed to delete")
        self.roost_repo.delete(roost)
