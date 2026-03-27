from fastapi import APIRouter

from app.core.roles import ROLE_OPTIONS
from app.schemas.role import RoleOption


router = APIRouter()


@router.get("/roles", response_model=list[RoleOption])
def list_roles() -> list[RoleOption]:
    return [RoleOption(**role) for role in ROLE_OPTIONS]
