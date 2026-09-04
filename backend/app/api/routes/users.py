from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email, get_db_session
from app.core.roles import RoleEnum
from app.repositories.user_repo import UserRepository
from app.services.user_service import UserService


router = APIRouter()


@router.get("/profile")
def get_profile(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = UserService(UserRepository(db))
    return service.get_profile(email)


@router.put("/profile")
def update_profile(
    full_name: str,
    password: str | None = None,
    role: RoleEnum | None = None,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    if role == RoleEnum.superadmin:
        raise HTTPException(status_code=403, detail="Cannot self-assign super admin")
    service = UserService(UserRepository(db))
    service.update_profile(email, full_name, password, role.value if role else None)
    return {"message": "Profile updated successfully"}


@router.delete("/profile")
def delete_own_account(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = UserService(UserRepository(db))
    service.delete_profile(email)
    return {"message": "User account deleted successfully"}


@router.get("/users")
def list_users(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = UserService(UserRepository(db))
    service.require_superadmin(email)
    return service.list_users()


@router.put("/users/{user_id}")
def edit_user(
    user_id: int,
    full_name: str,
    role: RoleEnum | None = None,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = UserService(UserRepository(db))
    service.require_superadmin(email)
    service.edit_user(user_id, full_name, role.value if role else None)
    return {"message": "User updated successfully"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = UserService(UserRepository(db))
    service.require_superadmin(email)
    service.delete_user(user_id)
    return {"message": "User deleted successfully"}
