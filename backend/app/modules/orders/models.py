import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.shared.types import PortableUUID


class Order(Base):
    __tablename__ = "orders"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    customer_id = Column(PortableUUID(), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="select")
    customer = relationship("Customer", lazy="select")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    order_id = Column(PortableUUID(), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(PortableUUID(), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", lazy="select")
