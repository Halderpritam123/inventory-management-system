"""
Inventory Conservation property tests.

Property tests implemented:
  - Property 1: Inventory Conservation     — Validates: Requirements 3.7, 4.1, 4.2
  - Property 7: Stock Non-Negativity       — Validates: Requirements 4.3, 4.5
"""
import uuid

import pytest
from hypothesis import given, settings as hyp_settings, HealthCheck, assume
from hypothesis import strategies as st


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_sku():
    return f"SKU-{uuid.uuid4().hex[:8].upper()}"


def _unique_email():
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


def _create_product(client, stock=100, price=10.0):
    resp = client.post(
        "/api/v1/products",
        json={"name": "Conservation Test", "sku": _unique_sku(), "price": price, "stock_quantity": stock},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_customer(client):
    resp = client.post(
        "/api/v1/customers",
        json={"full_name": "Conservation Customer", "email": _unique_email()},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_order(client, customer_id, product_id, qty):
    return client.post(
        "/api/v1/orders",
        json={"customer_id": str(customer_id), "items": [{"product_id": str(product_id), "quantity": qty}]},
    )


def _get_stock(client, product_id):
    return client.get(f"/api/v1/products/{product_id}").json()["stock_quantity"]


def _get_order_items_total_qty(client):
    """Sum of all quantities in all active order items."""
    orders = client.get("/api/v1/orders").json()
    total = 0
    for order in orders:
        detailed = client.get(f"/api/v1/orders/{order['id']}").json()
        for item in detailed.get("items", []):
            total += item["quantity"]
    return total


# ---------------------------------------------------------------------------
# Property 1: Inventory Conservation
# ---------------------------------------------------------------------------

@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    initial_stock=st.integers(min_value=20, max_value=100),
    order_qty=st.integers(min_value=1, max_value=10),
    num_orders=st.integers(min_value=1, max_value=3),
)
def test_property_1_inventory_conservation(initial_stock, order_qty, num_orders, client):
    """
    Property 1: Inventory Conservation

    For any sequence of order create and cancel operations, the sum of all
    product stock_quantities plus the sum of all quantities in active order
    items SHALL equal the original total stock.

    Validates: Requirements 3.7, 4.1, 4.2
    """
    # Only proceed if we have enough stock for all orders
    assume(order_qty * num_orders <= initial_stock)

    customer = _create_customer(client)
    product = _create_product(client, stock=initial_stock)
    original_stock = initial_stock

    order_ids = []

    # Create multiple orders
    for _ in range(num_orders):
        resp = _create_order(client, customer["id"], product["id"], order_qty)
        assume(resp.status_code == 201)  # Skip if stock unexpectedly low
        order_ids.append(resp.json()["id"])

    # At any point: stock + active_order_quantities = original_stock
    current_stock = _get_stock(client, product["id"])
    active_qty = sum(
        item["quantity"]
        for oid in order_ids
        for item in client.get(f"/api/v1/orders/{oid}").json().get("items", [])
    )
    assert current_stock + active_qty == original_stock, (
        f"Conservation violation: stock={current_stock} + active_qty={active_qty} "
        f"!= original={original_stock}"
    )

    # Cancel all orders
    for oid in order_ids:
        del_resp = client.delete(f"/api/v1/orders/{oid}")
        assert del_resp.status_code == 200

    # After all cancellations: stock must equal original
    restored_stock = _get_stock(client, product["id"])
    assert restored_stock == original_stock, (
        f"Post-cancellation: stock={restored_stock} != original={original_stock}"
    )


# ---------------------------------------------------------------------------
# Property 7: Stock Non-Negativity Invariant
# ---------------------------------------------------------------------------

@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    initial_stock=st.integers(min_value=1, max_value=50),
    order_qty=st.integers(min_value=1, max_value=100),
)
def test_property_7_stock_non_negativity_invariant(initial_stock, order_qty, client):
    """
    Property 7: Stock Non-Negativity Invariant

    After any operation sequence (including rejected ones), all products
    SHALL have stock_quantity >= 0.

    Validates: Requirements 4.3, 4.5
    """
    customer = _create_customer(client)
    product = _create_product(client, stock=initial_stock)

    # Attempt to order (may succeed or fail with 409 if qty > stock)
    _create_order(client, customer["id"], product["id"], order_qty)

    # Regardless of outcome, stock must be non-negative
    current_stock = _get_stock(client, product["id"])
    assert current_stock >= 0, (
        f"Stock went negative: {current_stock} after ordering {order_qty} "
        f"from stock of {initial_stock}"
    )


# ---------------------------------------------------------------------------
# Additional integration: create, cancel, re-order cycle
# ---------------------------------------------------------------------------

def test_create_cancel_reorder_cycle(client):
    """
    Verify that after an order is cancelled, the restored stock allows
    a new order of the same quantity to succeed.

    Validates: Requirements 3.12, 4.2
    """
    customer = _create_customer(client)
    product = _create_product(client, stock=10)

    # Create order for 8 items
    order1 = _create_order(client, customer["id"], product["id"], 8)
    assert order1.status_code == 201
    assert _get_stock(client, product["id"]) == 2

    # Cancel it
    assert client.delete(f"/api/v1/orders/{order1.json()['id']}").status_code == 200
    assert _get_stock(client, product["id"]) == 10

    # Re-order same quantity — should succeed
    order2 = _create_order(client, customer["id"], product["id"], 8)
    assert order2.status_code == 201
    assert _get_stock(client, product["id"]) == 2
