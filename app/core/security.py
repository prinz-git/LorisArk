from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    pw_safe = pw_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(pw_safe)


def verify_password(password: str, hashed: str) -> bool:
    pw_bytes = password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    pw_safe = pw_bytes.decode("utf-8", errors="ignore")
    return pwd_context.verify(pw_safe, hashed)


def create_access_token(data: dict, minutes: int | None = None) -> str:
    to_encode = data.copy()
    expire_minutes = minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
