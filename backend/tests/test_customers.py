"""
Test suite for the Customers module.

Includes:
  - Unit tests: specific examples, edge cases, error conditions
  - Property-based tests (Hypothesis): universal invariants across generated inputs

Property tests implemented:
  - Property 6:  Email Uniqueness           — Validates: Requirements 2.6
  - Property 11: Customer CRUD Round Trip   — Validates: Requirements 2.1, 2.3
"""
import uuid

import pytest
from hypothesis import given, settings as hyp_settings, HealthCheck
from hypothesis import strategies as st


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_email() -> str:
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


def _customer_payload(full_name="Jane Doe", email=None, phone=None) -> dict:
    payload = {
        "full_name": full_name,
        "email": email or _unique_email(),
    }
    if phone is not None:
        payload["phone"] = phone
    return payload


# ---------------------------------------------------------------------------
# Unit Tests
# ---------------------------------------------------------------------------


class TestCustomerCRUD:
    """Basic CRUD happy-path and error tests."""

    def test_create_customer_returns_201(self, client):
        response = client.post("/api/v1/customers", json=_customer_payload())
        assert response.status_code == 201
        body = response.json()
        assert "id" in body
        assert body["full_name"] == "Jane Doe"

    def test_create_customer_response_contains_timestamps(self, client):
        response = client.post("/api/v1/customers", json=_customer_payload())
        body = response.json()
        assert "created_at" in body
        assert "updated_at" in body

    def test_list_customers_returns_200_and_list(self, client):
        response = client.get("/api/v1/customers")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_customers_includes_created_customer(self, client):
        payload = _customer_payload(full_name="Listed Customer")
        client.post("/api/v1/customers", json=payload)
        all_customers = client.get("/api/v1/customers").json()
        emails = [c["email"] for c in all_customers]
        assert payload["email"] in emails

    def test_get_customer_by_id_returns_200(self, client):
        """Requirements 2.3: GET /customers/{id} for existing customer returns 200."""
        created = client.post("/api/v1/customers", json=_customer_payload()).json()
        response = client.get(f"/api/v1/customers/{created['id']}")
        assert response.status_code == 200
        assert response.json()["id"] == created["id"]

    def test_get_nonexistent_customer_returns_404(self, client):
        """Requirements 2.4: GET /customers/{id} for non-existent returns 404."""
        response = client.get(f"/api/v1/customers/{uuid.uuid4()}")
        assert response.status_code == 404
        assert "detail" in response.json()

    def test_delete_customer_returns_200(self, client):
        """Requirements 2.5: DELETE /customers/{id} returns 200."""
        created = client.post("/api/v1/customers", json=_customer_payload()).json()
        response = client.delete(f"/api/v1/customers/{created['id']}")
        assert response.status_code == 200

    def test_deleted_customer_is_not_found(self, client):
        created = client.post("/api/v1/customers", json=_customer_payload()).json()
        client.delete(f"/api/v1/customers/{created['id']}")
        assert client.get(f"/api/v1/customers/{created['id']}").status_code == 404

    def test_create_customer_with_phone(self, client):
        payload = _customer_payload(phone="+1-555-0100")
        response = client.post("/api/v1/customers", json=payload)
        assert response.status_code == 201
        assert response.json()["phone"] == "+1-555-0100"

    def test_create_customer_without_phone_sets_null(self, client):
        payload = _customer_payload()
        response = client.post("/api/v1/customers", json=payload)
        assert response.status_code == 201
        assert response.json()["phone"] is None


class TestCustomerValidation:
    """Validation error cases (Requirements 2.7)."""

    def test_invalid_email_returns_422(self, client):
        """Requirements 2.7: invalid email format returns 422."""
        payload = {"full_name": "Bad Email", "email": "not-an-email"}
        response = client.post("/api/v1/customers", json=payload)
        assert response.status_code == 422

    def test_missing_email_returns_422(self, client):
        payload = {"full_name": "No Email"}
        response = client.post("/api/v1/customers", json=payload)
        assert response.status_code == 422

    def test_missing_full_name_returns_422(self, client):
        payload = {"email": _unique_email()}
        response = client.post("/api/v1/customers", json=payload)
        assert response.status_code == 422


class TestCustomerConflict:
    """Conflict (409) tests (Requirements 2.6)."""

    def test_duplicate_email_returns_409(self, client):
        """Requirements 2.6: duplicate email on create returns 409."""
        email = _unique_email()
        client.post("/api/v1/customers", json=_customer_payload(full_name="First", email=email))
        response = client.post(
            "/api/v1/customers", json=_customer_payload(full_name="Second", email=email)
        )
        assert response.status_code == 409
        assert "detail" in response.json()


# ---------------------------------------------------------------------------
# Property-Based Tests (Hypothesis)
# ---------------------------------------------------------------------------

_name_st = st.text(
    alphabet=st.characters(
        whitelist_categories=("Lu", "Ll", "Nd", "Zs"),
        whitelist_characters="-_.()'",
    ),
    min_size=1,
    max_size=60,
).filter(lambda s: s.strip())

# Safe local-part for email: alphanumeric + dots + hyphens
_email_local_st = st.text(
    alphabet="abcdefghijklmnopqrstuvwxyz0123456789",
    min_size=3,
    max_size=20,
)

_email_domain_st = st.sampled_from(["example.com", "test.org", "mail.net", "demo.io"])


# Property 11 ----------------------------------------------------------

@hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(name=_name_st, local=_email_local_st, domain=_email_domain_st)
def test_property_11_customer_crud_round_trip(name, local, domain, client):
    """
    Property 11: Customer CRUD Round Trip

    For any valid CustomerCreate payload, POST then GET by the returned id SHALL
    return data equivalent to the submitted payload.

    Validates: Requirements 2.1, 2.3
    """
    email = f"{local}_{uuid.uuid4().hex[:6]}@{domain}"
    payload = {"full_name": name, "email": email}

    create_resp = client.post("/api/v1/customers", json=payload)
    assert create_resp.status_code == 201, (
        f"Expected 201 but got {create_resp.status_code}: {create_resp.text}"
    )

    created = create_resp.json()
    customer_id = created["id"]

    get_resp = client.get(f"/api/v1/customers/{customer_id}")
    assert get_resp.status_code == 200

    fetched = get_resp.json()
    assert fetched["full_name"] == name
    assert fetched["email"] == email


# Property 6 -----------------------------------------------------------

@hyp_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(local=_email_local_st, domain=_email_domain_st)
def test_property_6_email_uniqueness(local, domain, client):
    """
    Property 6: Email Uniqueness

    For any two customers with the same email, the second POST SHALL return 409
    and the database SHALL contain exactly one customer with that email.

    Validates: Requirements 2.6
    """
    email = f"{local}@{domain}"

    r1 = client.post(
        "/api/v1/customers",
        json={"full_name": "Customer A", "email": email},
    )
    assert r1.status_code == 201, f"First create failed: {r1.text}"

    r2 = client.post(
        "/api/v1/customers",
        json={"full_name": "Customer B", "email": email},
    )
    assert r2.status_code == 409, (
        f"Expected 409 for duplicate email '{email}', got {r2.status_code}: {r2.text}"
    )

    all_customers = client.get("/api/v1/customers").json()
    matching = [c for c in all_customers if c["email"] == email]
    assert len(matching) == 1, (
        f"Expected exactly 1 customer with email '{email}', found {len(matching)}"
    )
