import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from app.shared.types import PortableUUID


class Customer(Base):
    __tablename__ = "customers"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow, server_default=func.now())
