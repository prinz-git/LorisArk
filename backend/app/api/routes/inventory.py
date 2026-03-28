from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email, get_db_session
from app.repositories.roost_repo import RoostRepository
from app.repositories.root_repo import RootRepository
from app.repositories.user_repo import UserRepository
from app.schemas.inventory import (
    RoostCreate,
    RoostResponse,
    RoostUpdate,
    RootCreate,
    RootResponse,
    RootUpdate,
)
from app.services.roost_service import RoostService
from app.services.root_service import RootServiceManager


router = APIRouter()


@router.get("/roosts", response_model=list[RoostResponse])
def list_roosts(
    _: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    return service.list_all()


@router.get("/roosts/mine", response_model=list[RoostResponse])
def list_my_roosts(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    return service.list_mine(email)


@router.post("/roosts", response_model=RoostResponse)
def create_roost(
    payload: RoostCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    return service.create(email, payload)


@router.put("/roosts/{roost_id}", response_model=RoostResponse)
def update_roost(
    roost_id: int,
    payload: RoostUpdate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    return service.update(email, roost_id, payload)


@router.delete("/roosts/{roost_id}")
def delete_roost(
    roost_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    service.delete(email, roost_id)
    return {"message": "Roost deleted"}


@router.get("/roots", response_model=list[RootResponse])
def list_roots(
    _: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    return service.list_all()


@router.get("/roots/mine", response_model=list[RootResponse])
def list_my_roots(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    return service.list_mine(email)


@router.post("/roots", response_model=RootResponse)
def create_root(
    payload: RootCreate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    return service.create(email, payload)


@router.put("/roots/{root_id}", response_model=RootResponse)
def update_root(
    root_id: int,
    payload: RootUpdate,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    return service.update(email, root_id, payload)


@router.delete("/roots/{root_id}")
def delete_root(
    root_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    service.delete(email, root_id)
    return {"message": "Root deleted"}
