from pydantic import BaseModel

from app.core.roles import RoleEnum


class RoleOption(BaseModel):
    id: RoleEnum
    title: str
    label: str
    copy: str
