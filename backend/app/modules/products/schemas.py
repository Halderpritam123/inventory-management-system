from decimal import Decimal
from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, field_validator


class ProductCreate(BaseModel):
    name: str
    sku: str
    price: Decimal
    stock_quantity: int = 0

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v

    @field_validator("stock_quantity")
    @classmethod
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("stock_quantity cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("price must be greater than 0")
        return v

    @field_validator("stock_quantity")
    @classmethod
    def stock_must_be_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("stock_quantity cannot be negative")
        return v


class ProductResponse(BaseModel):
    id: UUID
    name: str
    sku: str
    price: Decimal
    stock_quantity: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
