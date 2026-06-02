"""
Test suite for the Products module.

Includes:
  - Unit tests: specific examples, edge cases, error conditions
  - Property-based tests (Hypothesis): universal invariants across generated inputs

Property tests implemented:
  - Property 5:  SKU Uniqueness           — Validates: Requirements 1.7
  - Property 10: Product CRUD Round Trip  — Validates: Requirements 1.1, 1.3
"""
import uuid

import pytest
from hypothesis import given, settings as hyp_settings, HealthCheck
from hypothesis import strategies as st


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_sku() -> str:
    """Generate a guaranteed-unique SKU string."""
    return f"SKU-{uuid.uuid4().hex[:8].upper()}"


def _product_payload(name="Widget", sku=None, price=9.99, stock_quantity=10) -> dict:
    return {
        "name": name,
        "sku": sku or _unique_sku(),
        "price": price,
        "stock_quantity": stock_quantity,
    }


# ---------------------------------------------------------------------------
# Unit Tests
# ---------------------------------------------------------------------------


class TestProductCRUD:
    """Basic CRUD happy-path and error tests."""

    def test_create_product_returns_201(self, client):
        response = client.post("/api/v1/products", json=_product_payload())
        assert response.status_code == 201
        body = response.json()
        assert "id" in body
        assert body["name"] == "Widget"

    def test_create_product_response_contains_timestamps(self, client):
        response = client.post("/api/v1/products", json=_product_payload())
        body = response.json()
        assert "created_at" in body
        assert "updated_at" in body

    def test_list_products_returns_200_and_list(self, client):
        response = client.get("/api/v1/products")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_products_includes_created_product(self, client):
        payload = _product_payload(name="Listing Test")
        client.post("/api/v1/products", json=payload)
        all_products = client.get("/api/v1/products").json()
        skus = [p["sku"] for p in all_products]
        assert payload["sku"] in skus

    def test_get_product_by_id_returns_200(self, client):
        """Requirements 1.3: GET /products/{id} for existing product returns 200."""
        created = client.post("/api/v1/products", json=_product_payload()).json()
        response = client.get(f"/api/v1/products/{created['id']}")
        assert response.status_code == 200
        assert response.json()["id"] == created["id"]

    def test_get_nonexistent_product_returns_404(self, client):
        """Requirements 1.4: GET /products/{id} for non-existent product returns 404."""
        response = client.get(f"/api/v1/products/{uuid.uuid4()}")
        assert response.status_code == 404
        assert "detail" in response.json()

    def test_update_product_returns_200(self, client):
        """Requirements 1.5: PUT /products/{id} updates and returns 200."""
        created = client.post("/api/v1/products", json=_product_payload()).json()
        response = client.put(
            f"/api/v1/products/{created['id']}",
            json={"name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    def test_delete_product_returns_200(self, client):
        """Requirements 1.6: DELETE /products/{id} returns 200."""
        created = client.post("/api/v1/products", json=_product_payload()).json()
        response = client.delete(f"/api/v1/products/{created['id']}")
        assert response.status_code == 200

    def test_deleted_product_is_not_found(self, client):
        created = client.post("/api/v1/products", json=_product_payload()).json()
        client.delete(f"/api/v1/products/{created['id']}")
        assert client.get(f"/api/v1/products/{created['id']}").status_code == 404


class TestProductValidation:
    """Validation error cases (Requirements 1.8, 1.9)."""

    def test_price_zero_rejected_with_422(self, client):
        """Requirements 1.8: price == 0 → 422."""
        response = client.post("/api/v1/products", json=_product_payload(price=0))
        assert response.status_code == 422

    def test_price_negative_rejected_with_422(self, client):
        """Requirements 1.8: price < 0 → 422."""
        response = client.post("/api/v1/products", json=_product_payload(price=-5.0))
        assert response.status_code == 422

    def test_negative_stock_rejected_with_422(self, client):
        """Requirements 1.9: stock_quantity < 0 → 422."""
        response = client.post(
            "/api/v1/products", json=_product_payload(stock_quantity=-1)
        )
        assert response.status_code == 422


class TestProductConflict:
    """Conflict (409) tests (Requirements 1.7)."""

    def test_duplicate_sku_returns_409(self, client):
        """Requirements 1.7: duplicate SKU on create returns 409."""
        sku = _unique_sku()
        client.post("/api/v1/products", json=_product_payload(name="First", sku=sku))
        response = client.post(
            "/api/v1/products", json=_product_payload(name="Second", sku=sku)
        )
        assert response.status_code == 409
        assert "detail" in response.json()


# ---------------------------------------------------------------------------
# Property-Based Tests (Hypothesis)
# ---------------------------------------------------------------------------

# Strategies -----------------------------------------------------------

# Names: printable text, strip to ensure non-empty after filtering
_name_st = st.text(
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd", "Zs"),
        whitelist_characters="-_.()",
    ),
    min_size=1,
    max_size=60,
).filter(lambda s: s.strip())

# Prices: positive floats, two decimal places
_price_st = st.floats(
    min_value=0.01,
    max_value=9_999.99,
    allow_nan=False,
    allow_infinity=False,
).map(lambda v: round(v, 2))

# Stock: non-negative integers
_stock_st = st.integers(min_value=0, max_value=100_000)

# SKUs: alphanumeric + hyphens, 1–30 chars; we generate a *suffix* so each
# run guarantees uniqueness by prepending a uuid hex.
_sku_suffix_st = st.text(
    alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    min_size=1,
    max_size=20,
)


# Property 10 ----------------------------------------------------------

@hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(name=_name_st, price=_price_st, stock=_stock_st, sku_suffix=_sku_suffix_st)
def test_property_10_product_crud_round_trip(name, price, stock, sku_suffix, client):
    """
    Property 10: Product CRUD Round Trip

    For any valid ProductCreate payload, POST then GET by the returned id SHALL
    return data equivalent to the submitted payload.

    Validates: Requirements 1.1, 1.3
    """
    sku = f"{uuid.uuid4().hex[:6].upper()}-{sku_suffix}"
    payload = {"name": name, "sku": sku, "price": price, "stock_quantity": stock}

    create_resp = client.post("/api/v1/products", json=payload)
    assert create_resp.status_code == 201, (
        f"Expected 201 but got {create_resp.status_code}: {create_resp.text}"
    )

    created = create_resp.json()
    product_id = created["id"]

    get_resp = client.get(f"/api/v1/products/{product_id}")
    assert get_resp.status_code == 200

    fetched = get_resp.json()
    assert fetched["name"] == name
    assert fetched["sku"] == sku
    assert abs(float(fetched["price"]) - price) < 0.005  # rounding tolerance
    assert fetched["stock_quantity"] == stock


# Property 5 -----------------------------------------------------------

@hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(sku_suffix=_sku_suffix_st)
def test_property_5_sku_uniqueness(sku_suffix, client):
    """
    Property 5: SKU Uniqueness

    For any two products with the same SKU, the second POST SHALL return 409
    and the database SHALL contain exactly one product with that SKU.

    Validates: Requirements 1.7
    """
    sku = f"DUP-{sku_suffix}"

    r1 = client.post(
        "/api/v1/products",
        json={"name": "Product A", "sku": sku, "price": 10.0, "stock_quantity": 5},
    )
    assert r1.status_code == 201, f"First create failed: {r1.text}"

    r2 = client.post(
        "/api/v1/products",
        json={"name": "Product B", "sku": sku, "price": 20.0, "stock_quantity": 3},
    )
    assert r2.status_code == 409, (
        f"Expected 409 for duplicate SKU '{sku}', got {r2.status_code}: {r2.text}"
    )

    all_products = client.get("/api/v1/products").json()
    matching = [p for p in all_products if p["sku"] == sku]
    assert len(matching) == 1, (
        f"Expected exactly 1 product with SKU '{sku}', found {len(matching)}"
    )
