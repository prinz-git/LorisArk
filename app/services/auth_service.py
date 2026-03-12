from fastapi import HTTPException

from app.core.security import hash_password, verify_password, create_access_token
from app.repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def register(self, email: str, full_name: str, password: str) -> None:
        if self.repo.get_by_email(email):
            raise HTTPException(status_code=400, detail="User already exists")
        self.repo.create(
            email=email,
            full_name=full_name,
            password=hash_password(password),
        )

    def login(self, email: str, password: str) -> str:
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return create_access_token({"email": user.email})
