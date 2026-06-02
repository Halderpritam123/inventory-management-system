import uuid
from datetime import datetime

from sqlalchemy import Column, String, Numeric, Integer, DateTime, CheckConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base
from app.shared.types import PortableUUID


class Product(Base):
    __tablename__ = "products"

    # PortableUUID works on both PostgreSQL (native UUID) and SQLite (VARCHAR 36).
    # Python-side default ensures SQLite tests don't need gen_random_uuid().
    id = Column(
        PortableUUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False, unique=True, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0, server_default=text("0"))
    # Python-side defaults (datetime.utcnow) cover SQLite; server_default covers PostgreSQL.
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint("price > 0", name="ck_products_price_positive"),
        CheckConstraint("stock_quantity >= 0", name="ck_products_stock_non_negative"),
    )
