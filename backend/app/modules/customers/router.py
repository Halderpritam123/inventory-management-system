from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.customers import service as customer_service
from app.modules.customers.schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/api/v1/customers", tags=["customers"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(db: Session = Depends(get_db)):
    return customer_service.list_customers(db)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    return customer_service.create_customer(db, data)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: UUID, db: Session = Depends(get_db)):
    return customer_service.get_customer(db, customer_id)


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
def delete_customer(customer_id: UUID, db: Session = Depends(get_db)):
    customer_service.delete_customer(db, customer_id)
    return {"message": "Customer deleted successfully"}
