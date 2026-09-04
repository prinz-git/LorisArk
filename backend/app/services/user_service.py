from __future__ import annotations

from fastapi import HTTPException

from app.core.roles import RoleEnum
from app.core.security import hash_password
from app.repositories.user_repo import UserRepository


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def get_profile(self, email: str) -> dict:
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"email": user.email, "full_name": user.full_name, "role": user.role}

    def require_superadmin(self, email: str):
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role != RoleEnum.superadmin.value:
            raise HTTPException(status_code=403, detail="Only super admins can access this")
        return user

    def update_profile(
        self, email: str, full_name: str, password: str | None, role: str | None
    ) -> None:
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.full_name = full_name
        if password:
            user.password = hash_password(password)
        if role:
            if role == RoleEnum.superadmin.value:
                raise HTTPException(status_code=403, detail="Cannot self-assign super admin")
            user.role = role
        self.repo.update(user)

    def delete_profile(self, email: str) -> None:
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role == RoleEnum.superadmin.value:
            raise HTTPException(status_code=403, detail="Super admin cannot be deleted")
        self.repo.delete(user)

    def list_users(self) -> list[dict]:
        users = self.repo.list_all()
        return [
            {"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role}
            for u in users
        ]

    def edit_user(self, user_id: int, full_name: str, role: str | None) -> None:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.full_name = full_name
        if role:
            user.role = role
        self.repo.update(user)

    def delete_user(self, user_id: int) -> None:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role == RoleEnum.superadmin.value:
            raise HTTPException(status_code=403, detail="Super admin cannot be deleted")
        self.repo.delete(user)
