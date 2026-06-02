from uuid import UUID
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from app.modules.orders.models import Order
from app.modules.orders.repository import order_repository
from app.modules.orders.schemas import OrderCreate
from app.modules.products.repository import product_repository
from app.modules.customers.repository import customer_repository
from app.core.exceptions import NotFoundError, InsufficientStockError
from app.core.logging import get_logger

logger = get_logger(__name__)


def list_orders(db: Session) -> List[Order]:
    logger.info("Listing all orders")
    return order_repository.get_all(db)


def get_order(db: Session, order_id: UUID) -> Order:
    order = order_repository.get_by_id(db, order_id)
    if not order:
        raise NotFoundError(f"Order with id {order_id} not found")
    return order


def create_order(db: Session, data: OrderCreate) -> Order:
    # 1. Verify customer exists
    customer = customer_repository.get_by_id(db, data.customer_id)
    if not customer:
        raise NotFoundError(f"Customer with id {data.customer_id} not found")

    # 2. Verify all products exist and have sufficient stock (pre-check before any writes)
    products = {}
    for item in data.items:
        product = product_repository.get_by_id(db, item.product_id)
        if not product:
            raise NotFoundError(f"Product with id {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise InsufficientStockError(f"Insufficient stock for product {product.name}")
        products[str(item.product_id)] = product

    try:
        # 3. Create order record
        order = order_repository.create_order(db, data.customer_id)

        # 4. Create order items and decrement stock
        total_amount = Decimal("0")
        for item in data.items:
            product = products[str(item.product_id)]
            unit_price = product.price
            subtotal = unit_price * item.quantity
            total_amount += subtotal

            order_repository.create_order_item(
                db, order.id, item.product_id, item.quantity, unit_price
            )
            product_repository.decrement_stock(db, product, item.quantity)
            logger.info(
                "Inventory decremented: product_id=%s qty=%s", item.product_id, item.quantity
            )

        # 5. Update total amount
        order_repository.update_order_total(db, order, total_amount)

        db.commit()
        db.refresh(order)
        logger.info("Order created: id=%s total=%s", order.id, total_amount)
        return order
    except Exception:
        db.rollback()
        raise


def delete_order(db: Session, order_id: UUID) -> None:
    order = get_order(db, order_id)

    # Snapshot items before any deletion
    items = list(order.items)

    try:
        # Restore inventory for each item
        for item in items:
            product = product_repository.get_by_id(db, item.product_id)
            if product:
                product_repository.increment_stock(db, product, item.quantity)
                logger.info(
                    "Inventory restored: product_id=%s qty=%s", item.product_id, item.quantity
                )

        # Delete the order (cascade deletes order_items)
        order_repository.delete_order(db, order)
        db.commit()
        logger.info("Order cancelled: id=%s", order_id)
    except Exception:
        db.rollback()
        raise
