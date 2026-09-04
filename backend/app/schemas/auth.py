from pydantic import BaseModel, EmailStr

from app.core.roles import RoleEnum


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: RoleEnum = RoleEnum.nomad


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
