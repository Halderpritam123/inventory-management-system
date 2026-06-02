from uuid import UUID
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.orders.models import Order, OrderItem


class OrderRepository:
    def get_all(self, db: Session) -> List[Order]:
        return db.query(Order).all()

    def get_by_id(self, db: Session, order_id: UUID) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    def create_order(self, db: Session, customer_id: UUID) -> Order:
        order = Order(customer_id=customer_id, total_amount=Decimal("0"))
        db.add(order)
        db.flush()
        db.refresh(order)
        return order

    def create_order_item(
        self,
        db: Session,
        order_id: UUID,
        product_id: UUID,
        quantity: int,
        unit_price: Decimal,
    ) -> OrderItem:
        subtotal = unit_price * quantity
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        db.add(item)
        db.flush()
        db.refresh(item)
        return item

    def update_order_total(self, db: Session, order: Order, total_amount: Decimal) -> Order:
        order.total_amount = total_amount
        db.flush()
        return order

    def delete_order(self, db: Session, order: Order) -> None:
        db.delete(order)
        db.flush()

    def delete_order_items_by_order(self, db: Session, order_id: UUID) -> None:
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        db.flush()


order_repository = OrderRepository()
