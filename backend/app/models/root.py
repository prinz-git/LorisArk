from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class RootListing(Base):
    __tablename__ = "roots"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    service_category = Column(String, nullable=False)
    service_description = Column(String, nullable=False)
    service_capacity = Column(Integer, nullable=False)
    remaining_capacity = Column(Integer)
    available_days = Column(String)
    service_window_start = Column(String)
    service_window_end = Column(String)
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    base_price = Column(Float)
    place_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
