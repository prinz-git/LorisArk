from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db


security = HTTPBearer()


def get_current_user_email(
    token=Depends(security),
) -> str:
    try:
        payload = jwt.decode(
            token.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload["email"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_db_session(db: Session = Depends(get_db)) -> Session:
    return db
