"""
Test suite for the Dashboard module.

Includes:
  - Unit tests: response structure, basic counts
  - Property-based tests (Hypothesis):
    - Property 8: Dashboard Low-Stock Count Accuracy — Validates: Requirements 5.2
"""
import uuid

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


def _create_product(client, stock=50, price=10.0):
    resp = client.post(
        "/api/v1/products",
        json={"name": "Test Product", "sku": _unique_sku(), "price": price, "stock_quantity": stock},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_customer(client):
    resp = client.post(
        "/api/v1/customers",
        json={"full_name": "Test Customer", "email": _unique_email()},
    )
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Unit Tests
# ---------------------------------------------------------------------------


class TestDashboardStats:
    def test_stats_returns_200(self, client):
        """Requirements 5.1: GET /api/v1/dashboard/stats returns 200."""
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200

    def test_stats_has_all_required_fields(self, client):
        """Requirements 5.1: response must contain all four fields."""
        response = client.get("/api/v1/dashboard/stats")
        body = response.json()
        assert "total_products" in body
        assert "total_customers" in body
        assert "total_orders" in body
        assert "low_stock_products" in body

    def test_empty_db_all_zeros(self, client):
        response = client.get("/api/v1/dashboard/stats")
        body = response.json()
        assert body["total_products"] == 0
        assert body["total_customers"] == 0
        assert body["total_orders"] == 0
        assert body["low_stock_products"] == 0

    def test_total_products_increments(self, client):
        _create_product(client)
        _create_product(client)
        body = client.get("/api/v1/dashboard/stats").json()
        assert body["total_products"] == 2

    def test_total_customers_increments(self, client):
        _create_customer(client)
        body = client.get("/api/v1/dashboard/stats").json()
        assert body["total_customers"] == 1

    def test_total_orders_increments(self, client):
        customer = _create_customer(client)
        product = _create_product(client, stock=10)
        client.post(
            "/api/v1/orders",
            json={
                "customer_id": customer["id"],
                "items": [{"product_id": product["id"], "quantity": 1}],
            },
        )
        body = client.get("/api/v1/dashboard/stats").json()
        assert body["total_orders"] == 1

    def test_low_stock_count_below_threshold(self, client):
        """Requirements 5.2: products with stock < 5 counted as low stock."""
        _create_product(client, stock=4)   # low stock
        _create_product(client, stock=5)   # NOT low (>= 5)
        _create_product(client, stock=10)  # NOT low
        body = client.get("/api/v1/dashboard/stats").json()
        assert body["low_stock_products"] == 1

    def test_zero_stock_is_low_stock(self, client):
        _create_product(client, stock=0)
        body = client.get("/api/v1/dashboard/stats").json()
        assert body["low_stock_products"] == 1

    def test_exactly_5_is_not_low_stock(self, client):
        """Requirements 5.2: threshold is strictly < 5, so 5 is NOT low."""
        _create_product(client, stock=5)
        body = client.get("/api/v1/dashboard/stats").json()
        assert body["low_stock_products"] == 0


# ---------------------------------------------------------------------------
# Property-Based Tests (Hypothesis)
# ---------------------------------------------------------------------------

@hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    stock_levels=st.lists(
        st.integers(min_value=0, max_value=20),
        min_size=1,
        max_size=15,
    )
)
def test_property_8_low_stock_count_accuracy(stock_levels, client):
    """
    Property 8: Dashboard Low-Stock Count Accuracy

    For any set of products with varying stock levels, low_stock_products
    SHALL equal the exact count of products with stock_quantity < 5.

    Validates: Requirements 5.2
    """
    # Snapshot counts BEFORE adding new products
    before = client.get("/api/v1/dashboard/stats").json()
    before_total = before["total_products"]
    before_low = before["low_stock_products"]

    # Create products with given stock levels
    for stock in stock_levels:
        _create_product(client, stock=stock)

    # Compute expected delta
    added_low = sum(1 for s in stock_levels if s < 5)

    body = client.get("/api/v1/dashboard/stats").json()

    assert body["total_products"] == before_total + len(stock_levels)
    assert body["low_stock_products"] == before_low + added_low, (
        f"Expected low_stock_products={before_low + added_low} for stock_levels={stock_levels}, "
        f"got {body['low_stock_products']}"
    )
