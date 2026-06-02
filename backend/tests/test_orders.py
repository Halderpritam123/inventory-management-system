"""
Test suite for the Orders module.

Includes:
  - Unit tests: CRUD, validation, error conditions
  - Property-based tests (Hypothesis):
    - Property 2: Insufficient Stock Rejection  — Validates: Requirements 3.6, 4.5
    - Property 3: Order Total Calculation       — Validates: Requirements 3.1, 3.2
    - Property 4: Order Cancellation Restore    — Validates: Requirements 3.12, 4.2
    - Property 9: Transactional Atomicity       — Validates: Requirements 3.8
"""
import uuid
from decimal import Decimal

import pytest
from hypothesis import given, settings as hyp_settings, HealthCheck
from hypothesis import strategies as st


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_sku():
    return f"SKU-{uuid.uuid4().hex[:8].upper()}"


def _unique_email():
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


def _create_product(client, name="Widget", price=10.0, stock=100):
    sku = _unique_sku()
    resp = client.post(
        "/api/v1/products",
        json={"name": name, "sku": sku, "price": price, "stock_quantity": stock},
    )
    assert resp.status_code == 201, f"Product creation failed: {resp.text}"
    return resp.json()


def _create_customer(client, name="John Doe"):
    resp = client.post(
        "/api/v1/customers",
        json={"full_name": name, "email": _unique_email()},
    )
    assert resp.status_code == 201, f"Customer creation failed: {resp.text}"
    return resp.json()


def _create_order(client, customer_id, items):
    """items: list of {product_id, quantity}"""
    resp = client.post(
        "/api/v1/orders",
        json={"customer_id": str(customer_id), "items": items},
    )
    return resp


# ---------------------------------------------------------------------------
# Unit Tests
# ---------------------------------------------------------------------------


class TestOrderCRUD:
    def test_create_order_returns_201(self, client):
        customer = _create_customer(client)
        product = _create_product(client, stock=10)

        resp = _create_order(
            client,
            customer["id"],
            [{"product_id": product["id"], "quantity": 2}],
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body
        assert len(body["items"]) == 1

    def test_order_total_calculated_by_backend(self, client):
        """Requirements 3.2: total_amount is computed server-side."""
        customer = _create_customer(client)
        product = _create_product(client, price=25.0, stock=10)

        resp = _create_order(
            client,
            customer["id"],
            [{"product_id": product["id"], "quantity": 3}],
        )
        assert resp.status_code == 201
        body = resp.json()
        assert abs(float(body["total_amount"]) - 75.0) < 0.01

    def test_create_order_reduces_inventory(self, client):
        """Requirements 3.7: stock decrements after order."""
        customer = _create_customer(client)
        product = _create_product(client, price=10.0, stock=20)

        _create_order(client, customer["id"], [{"product_id": product["id"], "quantity": 5}])

        updated = client.get(f"/api/v1/products/{product['id']}").json()
        assert updated["stock_quantity"] == 15

    def test_list_orders_returns_200(self, client):
        response = client.get("/api/v1/orders")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_order_by_id(self, client):
        """Requirements 3.10: GET /orders/{id} returns full order with items."""
        customer = _create_customer(client)
        product = _create_product(client, stock=10)
        order = _create_order(
            client, customer["id"], [{"product_id": product["id"], "quantity": 1}]
        ).json()

        resp = client.get(f"/api/v1/orders/{order['id']}")
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == order["id"]
        assert len(body["items"]) == 1

    def test_get_nonexistent_order_returns_404(self, client):
        """Requirements 3.11: 404 on non-existent order."""
        resp = client.get(f"/api/v1/orders/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_delete_order_returns_200(self, client):
        """Requirements 3.12: DELETE /orders/{id} returns 200."""
        customer = _create_customer(client)
        product = _create_product(client, stock=10)
        order = _create_order(
            client, customer["id"], [{"product_id": product["id"], "quantity": 2}]
        ).json()

        resp = client.delete(f"/api/v1/orders/{order['id']}")
        assert resp.status_code == 200

    def test_delete_order_restores_inventory(self, client):
        """Requirements 4.2: cancellation restores stock."""
        customer = _create_customer(client)
        product = _create_product(client, price=10.0, stock=20)

        order = _create_order(
            client, customer["id"], [{"product_id": product["id"], "quantity": 7}]
        ).json()
        # After order: stock = 13
        assert client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"] == 13

        client.delete(f"/api/v1/orders/{order['id']}")
        # After cancel: stock restored = 20
        assert client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"] == 20

    def test_delete_nonexistent_order_returns_404(self, client):
        """Requirements 3.13: 404 on cancelling non-existent order."""
        resp = client.delete(f"/api/v1/orders/{uuid.uuid4()}")
        assert resp.status_code == 404


class TestOrderValidation:
    def test_nonexistent_customer_returns_404(self, client):
        """Requirements 3.3: 404 when customer_id does not exist."""
        product = _create_product(client, stock=10)
        resp = _create_order(
            client,
            str(uuid.uuid4()),
            [{"product_id": product["id"], "quantity": 1}],
        )
        assert resp.status_code == 404

    def test_nonexistent_product_returns_404(self, client):
        """Requirements 3.4: 404 when product_id does not exist."""
        customer = _create_customer(client)
        resp = _create_order(
            client,
            customer["id"],
            [{"product_id": str(uuid.uuid4()), "quantity": 1}],
        )
        assert resp.status_code == 404

    def test_quantity_zero_returns_422(self, client):
        """Requirements 3.5: 422 when quantity <= 0."""
        customer = _create_customer(client)
        product = _create_product(client, stock=10)
        resp = _create_order(
            client,
            customer["id"],
            [{"product_id": product["id"], "quantity": 0}],
        )
        assert resp.status_code == 422

    def test_quantity_negative_returns_422(self, client):
        """Requirements 3.5: 422 when quantity < 0."""
        customer = _create_customer(client)
        product = _create_product(client, stock=10)
        resp = _create_order(
            client,
            customer["id"],
            [{"product_id": product["id"], "quantity": -1}],
        )
        assert resp.status_code == 422

    def test_insufficient_stock_returns_409(self, client):
        """Requirements 3.6, 4.5: 409 when qty > stock."""
        customer = _create_customer(client)
        product = _create_product(client, stock=3)
        resp = _create_order(
            client,
            customer["id"],
            [{"product_id": product["id"], "quantity": 5}],
        )
        assert resp.status_code == 409
        assert "Insufficient stock" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Property-Based Tests (Hypothesis)
# ---------------------------------------------------------------------------

_qty_st = st.integers(min_value=1, max_value=50)
_price_st = st.floats(min_value=1.0, max_value=500.0, allow_nan=False, allow_infinity=False).map(
    lambda v: round(v, 2)
)
_stock_st = st.integers(min_value=10, max_value=200)


# Property 2 -----------------------------------------------------------

@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(stock=st.integers(min_value=1, max_value=20), excess=st.integers(min_value=1, max_value=50))
def test_property_2_insufficient_stock_rejection(stock, excess, client):
    """
    Property 2: Insufficient Stock Rejection

    For any order where item.qty > product.stock, the API SHALL return 409
    and stock SHALL remain unchanged.

    Validates: Requirements 3.6, 4.5
    """
    customer = _create_customer(client)
    product = _create_product(client, price=10.0, stock=stock)

    over_qty = stock + excess

    resp = _create_order(
        client,
        customer["id"],
        [{"product_id": product["id"], "quantity": over_qty}],
    )
    assert resp.status_code == 409, (
        f"Expected 409 for qty={over_qty} > stock={stock}, got {resp.status_code}"
    )

    # Stock must be unchanged
    current = client.get(f"/api/v1/products/{product['id']}").json()
    assert current["stock_quantity"] == stock, (
        f"Stock changed after rejected order: expected {stock}, got {current['stock_quantity']}"
    )


# Property 3 -----------------------------------------------------------

@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    price=_price_st,
    qty=_qty_st,
)
def test_property_3_order_total_consistency(price, qty, client):
    """
    Property 3: Order Total Calculation Consistency

    For any valid order, total_amount SHALL equal sum(quantity × unit_price).

    Validates: Requirements 3.1, 3.2
    """
    customer = _create_customer(client)
    product = _create_product(client, price=price, stock=qty + 50)

    resp = _create_order(
        client,
        customer["id"],
        [{"product_id": product["id"], "quantity": qty}],
    )
    assert resp.status_code == 201, f"Order creation failed: {resp.text}"

    body = resp.json()
    expected_total = Decimal(str(price)) * qty
    actual_total = Decimal(str(body["total_amount"]))

    assert abs(actual_total - expected_total) < Decimal("0.05"), (
        f"Total mismatch: expected {expected_total}, got {actual_total}"
    )

    # Also verify via item-level: total == sum(subtotals)
    subtotals_sum = sum(Decimal(str(item["subtotal"])) for item in body["items"])
    assert abs(actual_total - subtotals_sum) < Decimal("0.05")


# Property 4 -----------------------------------------------------------

@hyp_settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    stock=_stock_st,
    qty=_qty_st,
)
def test_property_4_order_cancellation_inventory_restore(stock, qty, client):
    """
    Property 4: Order Cancellation Inventory Restore

    After cancelling an order, each product's stock SHALL be restored to
    its pre-order level.

    Validates: Requirements 3.12, 4.2
    """
    if qty > stock:
        # Skip — would be insufficient stock, not testing property 4 here
        return

    customer = _create_customer(client)
    product = _create_product(client, price=10.0, stock=stock)

    pre_stock = client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"]

    order_resp = _create_order(
        client,
        customer["id"],
        [{"product_id": product["id"], "quantity": qty}],
    )
    assert order_resp.status_code == 201

    # Cancel the order
    del_resp = client.delete(f"/api/v1/orders/{order_resp.json()['id']}")
    assert del_resp.status_code == 200

    post_stock = client.get(f"/api/v1/products/{product['id']}").json()["stock_quantity"]
    assert post_stock == pre_stock, (
        f"Stock not restored: before={pre_stock}, after={post_stock}, qty_ordered={qty}"
    )


# Property 9 -----------------------------------------------------------

def test_property_9_transactional_atomicity(client):
    """
    Property 9: Transactional Atomicity on Failure

    When order creation fails (e.g. one item has insufficient stock),
    the DB state SHALL be identical to its state before the request.

    Validates: Requirements 3.8

    We test this by creating an order with two items where the second
    item has insufficient stock — the whole order should be rolled back.
    """
    customer = _create_customer(client)
    product_ok = _create_product(client, name="OK Product", price=5.0, stock=100)
    product_low = _create_product(client, name="Low Stock", price=10.0, stock=2)

    stock_ok_before = client.get(f"/api/v1/products/{product_ok['id']}").json()["stock_quantity"]
    stock_low_before = client.get(f"/api/v1/products/{product_low['id']}").json()["stock_quantity"]

    # Request 10 of the low-stock product (only 2 available)
    resp = _create_order(
        client,
        customer["id"],
        [
            {"product_id": product_ok["id"], "quantity": 5},
            {"product_id": product_low["id"], "quantity": 10},
        ],
    )
    assert resp.status_code == 409, f"Expected 409 but got {resp.status_code}: {resp.text}"

    # Stock must be unchanged for both products
    stock_ok_after = client.get(f"/api/v1/products/{product_ok['id']}").json()["stock_quantity"]
    stock_low_after = client.get(f"/api/v1/products/{product_low['id']}").json()["stock_quantity"]
    assert stock_ok_after == stock_ok_before
    assert stock_low_after == stock_low_before

    # No order should have been created
    orders = client.get("/api/v1/orders").json()
    assert len(orders) == 0
