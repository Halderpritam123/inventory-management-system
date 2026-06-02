from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.products.models import Product


class ProductRepository:
    def get_all(self, db: Session) -> List[Product]:
        return db.query(Product).all()

    def get_by_id(self, db: Session, product_id: UUID) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    def get_by_sku(self, db: Session, sku: str) -> Optional[Product]:
        return db.query(Product).filter(Product.sku == sku).first()

    def create(self, db: Session, data: dict) -> Product:
        product = Product(**data)
        db.add(product)
        db.flush()
        db.refresh(product)
        return product

    def update(self, db: Session, product: Product, data: dict) -> Product:
        for key, value in data.items():
            setattr(product, key, value)
        db.flush()
        db.refresh(product)
        return product

    def delete(self, db: Session, product: Product) -> None:
        db.delete(product)
        db.flush()

    def decrement_stock(self, db: Session, product: Product, qty: int) -> Product:
        product.stock_quantity -= qty
        db.flush()
        db.refresh(product)
        return product

    def increment_stock(self, db: Session, product: Product, qty: int) -> Product:
        product.stock_quantity += qty
        db.flush()
        db.refresh(product)
        return product


product_repository = ProductRepository()
