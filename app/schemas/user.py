from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str

    class Config:
        orm_mode = True
