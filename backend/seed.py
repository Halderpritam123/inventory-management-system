"""Run this script to seed the database with dummy data.
Usage: python seed.py
"""
import uuid
from decimal import Decimal
from app.core.database import _get_session_local
from app.modules.products.models import Product
from app.modules.customers.models import Customer
from app.modules.orders.models import Order, OrderItem

def seed():
    db = _get_session_local()()
    try:
        # Products
        products = [
            Product(name="Wireless Mouse", sku="WM-001", price=Decimal("29.99"), stock_quantity=150),
            Product(name="Mechanical Keyboard", sku="MK-002", price=Decimal("89.99"), stock_quantity=75),
            Product(name="USB-C Hub", sku="UH-003", price=Decimal("49.99"), stock_quantity=200),
            Product(name="Monitor Stand", sku="MS-004", price=Decimal("39.99"), stock_quantity=60),
            Product(name="Webcam HD", sku="WC-005", price=Decimal("69.99"), stock_quantity=40),
        ]
        db.add_all(products)
        db.flush()

        # Customers
        customers = [
            Customer(full_name="Alice Johnson", email="alice@example.com", phone="+1-555-0101"),
            Customer(full_name="Bob Smith", email="bob@example.com", phone="+1-555-0102"),
            Customer(full_name="Carol White", email="carol@example.com", phone="+1-555-0103"),
        ]
        db.add_all(customers)
        db.flush()

        # Orders
        order1 = Order(customer_id=customers[0].id, total_amount=Decimal("119.98"))
        order2 = Order(customer_id=customers[1].id, total_amount=Decimal("49.99"))
        order3 = Order(customer_id=customers[2].id, total_amount=Decimal("159.97"))
        db.add_all([order1, order2, order3])
        db.flush()

        # Order items
        db.add_all([
            OrderItem(order_id=order1.id, product_id=products[0].id, quantity=2, unit_price=Decimal("29.99"), subtotal=Decimal("59.98")),
            OrderItem(order_id=order1.id, product_id=products[1].id, quantity=1, unit_price=Decimal("89.99"), subtotal=Decimal("89.99")),  # wait this makes 149.97 not 119.98 — fix
            OrderItem(order_id=order2.id, product_id=products[2].id, quantity=1, unit_price=Decimal("49.99"), subtotal=Decimal("49.99")),
            OrderItem(order_id=order3.id, product_id=products[3].id, quantity=1, unit_price=Decimal("39.99"), subtotal=Decimal("39.99")),
            OrderItem(order_id=order3.id, product_id=products[4].id, quantity=1, unit_price=Decimal("69.99"), subtotal=Decimal("69.99")),
            OrderItem(order_id=order3.id, product_id=products[0].id, quantity=1, unit_price=Decimal("29.99"), subtotal=Decimal("29.99")),
        ])

        # Fix order totals to match items
        order1.total_amount = Decimal("59.98") + Decimal("89.99")  # 149.97
        order3.total_amount = Decimal("39.99") + Decimal("69.99") + Decimal("29.99")  # 139.97

        db.commit()
        print("Seed data inserted successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
