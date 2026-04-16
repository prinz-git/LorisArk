from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func

from app.core.database import Base


class RoostListing(Base):
    __tablename__ = "roosts"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    bedroom_type = Column(String, nullable=False)
    bedroom_count = Column(Integer)
    photos = Column(JSON, default=list)
    wifi_speed_mbps = Column(Float, nullable=False)
    wifi_active = Column(Boolean, nullable=False, default=True)
    nightly_rate = Column(Float)
    place_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
