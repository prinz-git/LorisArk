from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class Bundle(Base):
    __tablename__ = "bundles"

    id = Column(Integer, primary_key=True, index=True)
    nomad_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    roost_id = Column(Integer, ForeignKey("roosts.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="paid")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class BundleItem(Base):
    __tablename__ = "bundle_items"

    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(
        Integer, ForeignKey("bundles.id"), nullable=False, index=True
    )
    root_id = Column(Integer, ForeignKey("roots.id"), nullable=False, index=True)
    scheduled_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)


class ServiceTicket(Base):
    __tablename__ = "service_tickets"

    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(Integer, ForeignKey("bundles.id"), nullable=False, index=True)
    root_id = Column(Integer, ForeignKey("roots.id"), nullable=False, index=True)
    nomad_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="new")
    note = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RootDailyCapacity(Base):
    __tablename__ = "root_daily_capacity"

    id = Column(Integer, primary_key=True, index=True)
    root_id = Column(Integer, ForeignKey("roots.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    remaining_capacity = Column(Integer, nullable=False)
