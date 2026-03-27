from pydantic import BaseModel, EmailStr

from app.core.roles import RoleEnum


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: RoleEnum

    class Config:
        orm_mode = True
