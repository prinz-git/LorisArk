from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email, get_db_session
from app.repositories.roost_repo import RoostRepository
from app.repositories.root_repo import RootRepository
from app.repositories.user_repo import UserRepository
from app.schemas.inventory import (
    RoostCreate,
    RoostResponse,
    RoostUpdate,
    RoostPage,
    RootCreate,
    RootPage,
    RootResponse,
    RootUpdate,
)
from app.services.roost_service import RoostService
from app.services.root_service import RootServiceManager


router = APIRouter()

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "static" / "uploads"
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


async def _store_image(upload: UploadFile, folder: str) -> str:
    extension = ALLOWED_IMAGE_TYPES.get(upload.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Only image uploads are supported")

    directory = UPLOAD_ROOT / folder
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    destination = directory / filename
    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")
    destination.write_bytes(content)
    return f"/static/uploads/{folder}/{filename}"


@router.get("/roosts", response_model=RoostPage)
def list_roosts(
    page: int = Query(1, ge=1),
    limit: int = Query(6, ge=1, le=50),
    search: str | None = Query(default=None),
    _: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    items, total = service.list_page(page, limit, search)
    return {"items": items, "total": total, "page": page, "limit": limit}


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


@router.post("/roosts/{roost_id}/photos", response_model=RoostResponse)
async def upload_roost_photo(
    roost_id: int,
    image: UploadFile = File(...),
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    service.require_photo_upload_allowed(email, roost_id)
    photo_url = await _store_image(image, "roosts")
    return service.add_photo(email, roost_id, photo_url)


@router.delete("/roosts/{roost_id}")
def delete_roost(
    roost_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RoostService(RoostRepository(db), UserRepository(db))
    service.delete(email, roost_id)
    return {"message": "Roost deleted"}


@router.get("/roots", response_model=RootPage)
def list_roots(
    page: int = Query(1, ge=1),
    limit: int = Query(6, ge=1, le=50),
    search: str | None = Query(default=None),
    _: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    items, total = service.list_page(page, limit, search)
    return {"items": items, "total": total, "page": page, "limit": limit}


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


@router.post("/roots/{root_id}/photos", response_model=RootResponse)
async def upload_root_photo(
    root_id: int,
    image: UploadFile = File(...),
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    service.require_photo_upload_allowed(email, root_id)
    photo_url = await _store_image(image, "roots")
    return service.add_photo(email, root_id, photo_url)


@router.delete("/roots/{root_id}")
def delete_root(
    root_id: int,
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db_session),
):
    service = RootServiceManager(RootRepository(db), UserRepository(db))
    service.delete(email, root_id)
    return {"message": "Root deleted"}
