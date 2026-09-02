from pydantic import BaseModel

from app.core.roles import RoleEnum


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: RoleEnum

    class Config:
        orm_mode = True
