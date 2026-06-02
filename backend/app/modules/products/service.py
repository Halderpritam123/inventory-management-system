from uuid import UUID
from typing import List
from sqlalchemy.orm import Session
from app.modules.products.models import Product
from app.modules.products.repository import product_repository
from app.modules.products.schemas import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundError, ConflictError
from app.core.logging import get_logger

logger = get_logger(__name__)


def list_products(db: Session) -> List[Product]:
    logger.info("Listing all products")
    return product_repository.get_all(db)


def get_product(db: Session, product_id: UUID) -> Product:
    product = product_repository.get_by_id(db, product_id)
    if not product:
        raise NotFoundError(f"Product with id {product_id} not found")
    return product


def create_product(db: Session, data: ProductCreate) -> Product:
    existing = product_repository.get_by_sku(db, data.sku)
    if existing:
        raise ConflictError(f"SKU '{data.sku}' already exists")
    product = product_repository.create(db, data.model_dump())
    db.commit()
    db.refresh(product)
    logger.info("Product created: id=%s sku=%s", product.id, product.sku)
    return product


def update_product(db: Session, product_id: UUID, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    update_data = data.model_dump(exclude_unset=True)
    if "sku" in update_data:
        existing = product_repository.get_by_sku(db, update_data["sku"])
        if existing and existing.id != product_id:
            raise ConflictError(f"SKU '{update_data['sku']}' already exists")
    updated = product_repository.update(db, product, update_data)
    db.commit()
    db.refresh(updated)
    logger.info("Product updated: id=%s", product_id)
    return updated


def delete_product(db: Session, product_id: UUID) -> None:
    product = get_product(db, product_id)
    product_repository.delete(db, product)
    db.commit()
    logger.info("Product deleted: id=%s", product_id)
