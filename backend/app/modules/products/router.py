from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.products import service as product_service
from app.modules.products.schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.get("", response_model=List[ProductResponse])
def list_products(db: Session = Depends(get_db)):
    return product_service.list_products(db)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db, data)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    return product_service.get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, data: ProductUpdate, db: Session = Depends(get_db)):
    return product_service.update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(product_id: UUID, db: Session = Depends(get_db)):
    product_service.delete_product(db, product_id)
    return {"message": "Product deleted successfully"}
