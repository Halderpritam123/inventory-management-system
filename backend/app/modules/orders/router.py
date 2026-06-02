from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.orders import service as order_service
from app.modules.orders.schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.get("", response_model=List[OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    return order_service.list_orders(db)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    return order_service.create_order(db, data)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: UUID, db: Session = Depends(get_db)):
    return order_service.get_order(db, order_id)


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
def delete_order(order_id: UUID, db: Session = Depends(get_db)):
    order_service.delete_order(db, order_id)
    return {"message": "Order cancelled and inventory restored successfully"}
