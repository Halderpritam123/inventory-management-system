# Backend Documentation

## Overview

The backend is a **FastAPI** application that provides a REST API for an Inventory & Order Management System. It uses PostgreSQL as the database, SQLAlchemy as the ORM, and Alembic for database migrations.

---

## Architecture

```mermaid
graph TD
    Client["Frontend / API Client"]
    FastAPI["FastAPI App (main.py)"]
    CORS["CORS Middleware"]
    EH["Exception Handlers"]
    PR["Products Router"]
    CR["Customers Router"]
    OR["Orders Router"]
    DR["Dashboard Router"]
    PS["Products Service"]
    CS["Customers Service"]
    OS["Orders Service"]
    DS["Dashboard Service"]
    PREP["Products Repository"]
    CREP["Customers Repository"]
    OREP["Orders Repository"]
    DB["PostgreSQL Database"]

    Client --> FastAPI
    FastAPI --> CORS
    FastAPI --> EH
    FastAPI --> PR
    FastAPI --> CR
    FastAPI --> OR
    FastAPI --> DR
    PR --> PS --> PREP --> DB
    CR --> CS --> CREP --> DB
    OR --> OS --> OREP --> DB
    DR --> DS --> DB
```

---

## Request Flow (Scenario: Create an Order)

```mermaid
sequenceDiagram
    participant C as Frontend
    participant R as Orders Router
    participant S as Orders Service
    participant Rep as Orders Repository
    participant DB as PostgreSQL

    C->>R: POST /api/v1/orders
    R->>R: Validate request body (Pydantic schema)
    R->>S: create_order(db, data)
    S->>Rep: get customer by id
    Rep->>DB: SELECT customers WHERE id=?
    DB-->>Rep: Customer row
    S->>Rep: get each product by id
    Rep->>DB: SELECT products WHERE id=?
    DB-->>Rep: Product row
    S->>S: Check stock availability
    S->>Rep: Deduct stock, create Order + OrderItems
    Rep->>DB: INSERT order, order_items / UPDATE products
    DB-->>Rep: Saved rows
    S-->>R: OrderResponse
    R-->>C: 201 Created + JSON
```

---

## Folder Structure

```
backend/
├── alembic/                          (database migration engine)
│   ├── env.py                        (migration environment config)
│   ├── script.py.mako                (migration file template)
│   └── versions/
│       └── 001_initial_schema.py     (first migration - creates all tables)
├── alembic.ini                       (alembic configuration file)
├── app/
│   ├── main.py                       (app entry point - registers routers, middleware, startup events)
│   ├── core/
│   │   ├── config.py                 (loads env variables using pydantic-settings)
│   │   ├── database.py               (SQLAlchemy engine, session factory, get_db dependency)
│   │   ├── exceptions.py             (custom exception classes + global exception handlers)
│   │   └── logging.py                (logger setup)
│   ├── modules/
│   │   ├── customers/
│   │   │   ├── models.py             (Customer SQLAlchemy ORM model)
│   │   │   ├── schemas.py            (Pydantic request/response schemas)
│   │   │   ├── repository.py         (raw DB queries for customers)
│   │   │   ├── service.py            (business logic - validation, conflict checks)
│   │   │   └── router.py             (HTTP route definitions for /api/v1/customers)
│   │   ├── products/
│   │   │   ├── models.py             (Product SQLAlchemy ORM model)
│   │   │   ├── schemas.py            (Pydantic request/response schemas)
│   │   │   ├── repository.py         (raw DB queries for products)
│   │   │   ├── service.py            (business logic - SKU uniqueness, stock management)
│   │   │   └── router.py             (HTTP route definitions for /api/v1/products)
│   │   ├── orders/
│   │   │   ├── models.py             (Order + OrderItem SQLAlchemy ORM models)
│   │   │   ├── schemas.py            (Pydantic request/response schemas)
│   │   │   ├── repository.py         (raw DB queries for orders)
│   │   │   ├── service.py            (business logic - stock check, total calculation)
│   │   │   └── router.py             (HTTP route definitions for /api/v1/orders)
│   │   └── dashboard/
│   │       ├── service.py            (aggregates counts for dashboard stats)
│   │       └── router.py             (HTTP route for /api/v1/dashboard/stats)
│   └── shared/
│       └── types.py                  (PortableUUID custom SQLAlchemy type)
├── tests/
│   ├── conftest.py                   (pytest fixtures - test DB setup, client setup)
│   ├── test_customers.py             (customer endpoint tests)
│   ├── test_products.py              (product endpoint tests)
│   ├── test_orders.py                (order endpoint tests)
│   ├── test_dashboard.py             (dashboard endpoint tests)
│   └── test_inventory_conservation.py (property-based tests using Hypothesis)
├── requirements.txt                  (all Python dependencies pinned)
├── pytest.ini                        (pytest config)
├── Dockerfile                        (container build instructions)
└── .env.example                      (example environment variables)
```

---

## Dependency Libraries

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.5 | Web framework - handles routing, validation, dependency injection |
| `uvicorn[standard]` | 0.32.1 | ASGI server that runs the FastAPI app |
| `sqlalchemy` | 2.0.36 | ORM - maps Python classes to database tables |
| `alembic` | 1.14.0 | Database migration tool - tracks and applies schema changes |
| `pydantic[email]` | 2.10.3 | Data validation for request/response schemas |
| `pydantic-settings` | 2.6.1 | Loads config from `.env` files into typed settings class |
| `psycopg2-binary` | 2.9.10 | PostgreSQL database driver |
| `python-dotenv` | 1.0.1 | Reads `.env` files into environment variables |
| `hypothesis` | 6.112.2 | Property-based testing library |
| `pytest` | 8.3.4 | Test runner |
| `pytest-asyncio` | 0.24.0 | Async test support for pytest |
| `httpx` | 0.27.2 | HTTP client used by pytest to call the API in tests |

---

## Module Pattern

Every domain module (customers, products, orders) follows the same 4-layer pattern:

```mermaid
graph LR
    Router["router.py\n(HTTP layer)"]
    Service["service.py\n(Business logic)"]
    Repo["repository.py\n(DB queries)"]
    Model["models.py\n(ORM table)"]
    Schema["schemas.py\n(Validation)"]

    Router -->|calls| Service
    Router -->|validates with| Schema
    Service -->|calls| Repo
    Repo -->|queries| Model
```

- **router.py** — defines HTTP methods and paths, injects `db` session via `Depends(get_db)`
- **service.py** — contains all business rules (e.g. duplicate email check, stock check)
- **repository.py** — only raw database operations, no business logic
- **models.py** — SQLAlchemy ORM class mapping to a DB table
- **schemas.py** — Pydantic models for request body validation and response serialization

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/customers` | List all customers |
| POST | `/api/v1/customers` | Create a customer |
| GET | `/api/v1/customers/{id}` | Get customer by ID |
| DELETE | `/api/v1/customers/{id}` | Delete a customer |
| GET | `/api/v1/products` | List all products |
| POST | `/api/v1/products` | Create a product |
| GET | `/api/v1/products/{id}` | Get product by ID |
| PUT | `/api/v1/products/{id}` | Update a product |
| DELETE | `/api/v1/products/{id}` | Delete a product |
| POST | `/api/v1/orders` | Create an order |
| GET | `/api/v1/orders` | List all orders |
| GET | `/api/v1/orders/{id}` | Get order by ID |
| GET | `/api/v1/dashboard/stats` | Get dashboard statistics |
| GET | `/health` | Health check |

Interactive API docs available at: `http://localhost:8000/docs`

---

## Error Handling

Custom exceptions are mapped to HTTP status codes globally in `exceptions.py`:

| Exception | HTTP Status |
|---|---|
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `InsufficientStockError` | 409 |
| Any other `Exception` | 500 |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
POSTGRES_DB=inventory_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password
APP_ENV=development
```

---

## Running the Backend

```bash
# With Docker (recommended)
docker compose up

# Locally
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Running Tests

```bash
cd backend
pytest
```
