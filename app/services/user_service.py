from fastapi import HTTPException

from app.core.security import hash_password
from app.repositories.user_repo import UserRepository


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def get_profile(self, email: str) -> dict:
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"email": user.email, "full_name": user.full_name}

    def update_profile(self, email: str, full_name: str, password: str | None) -> None:
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.full_name = full_name
        if password:
            user.password = hash_password(password)
        self.repo.update(user)

    def delete_profile(self, email: str) -> None:
        user = self.repo.get_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        self.repo.delete(user)

    def list_users(self) -> list[dict]:
        users = self.repo.list_all()
        return [{"id": u.id, "email": u.email, "full_name": u.full_name} for u in users]

    def edit_user(self, user_id: int, full_name: str) -> None:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.full_name = full_name
        self.repo.update(user)

    def delete_user(self, user_id: int) -> None:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        self.repo.delete(user)
