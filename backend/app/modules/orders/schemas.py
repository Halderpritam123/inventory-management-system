from decimal import Decimal
from typing import List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, field_validator


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return v


class OrderCreate(BaseModel):
    customer_id: UUID
    items: List[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def items_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("items must not be empty")
        return v


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse] = []

    model_config = {"from_attributes": True}
