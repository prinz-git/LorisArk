from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.repositories.user_repo import UserRepository
from app.schemas import UserRegister, UserLogin
from app.services.auth_service import AuthService


router = APIRouter()


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    service.register(user.email, user.full_name, user.password)
    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db_session)):
    service = AuthService(UserRepository(db))
    token = service.login(user.email, user.password)
    return {"access_token": token}


@router.post("/logout")
def logout():
    return {"message": "Logout successful. Please delete token on client."}
