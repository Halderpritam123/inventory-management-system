# Inventory & Order Management System

A production-ready, full-stack Inventory & Order Management System built as a **modular monolith**, designed for future microservice extraction with zero architectural redesign.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Business Requirements](#business-requirements)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Folder Structure](#folder-structure)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)
- [Scalability Strategy](#scalability-strategy)
- [Future Improvements](#future-improvements)
- [Submission](#submission)
- [Screenshots](#screenshots)

---

## Project Overview

This system enables businesses to manage their product catalog, customer registry, and sales orders with automated inventory tracking. It features a React SPA frontend with Redux Toolkit for state management and a FastAPI backend with PostgreSQL, all containerized with Docker.

---

## Business Requirements

- Maintain an accurate product catalog with stock tracking
- Register and manage customers
- Create and cancel orders with automatic inventory updates
- Prevent over-selling via pre-order stock validation
- Provide real-time business metrics on the dashboard

---

## Features

- **Products**: CRUD operations, SKU uniqueness enforcement, price/stock validation
- **Customers**: Create/list/delete with email uniqueness and format validation
- **Orders**: Transactional order creation with stock deduction; cancellation with stock restore
- **Inventory Tracking**: Automatic stock management; 409 Conflict on insufficient stock
- **Dashboard**: Live aggregated stats — total products, customers, orders, and low-stock count
- **Theme System**: Light / Dark / System modes with localStorage persistence
- **Responsive UI**: Desktop, tablet, and mobile layouts
- **Docker**: Single `docker compose up --build` local stack

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui, Redux Toolkit, RTK Query |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x, Pydantic v2, Alembic |
| Database | PostgreSQL 16 |
| Infrastructure | Docker, Docker Compose |
| Frontend Testing | Vitest, @testing-library/react, fast-check |
| Backend Testing | pytest, Hypothesis |

---

## Architecture Overview

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        FE[React SPA<br/>Redux Toolkit + RTK Query]
    end

    subgraph "Backend — FastAPI Modular Monolith"
        API[Routers<br/>thin HTTP layer]
        SVC[Services<br/>business logic]
        REPO[Repositories<br/>data access]
        DB[(PostgreSQL)]
    end

    subgraph "Infrastructure"
        DC[Docker Compose]
    end

    FE -->|HTTP/JSON| API
    API --> SVC
    SVC --> REPO
    REPO -->|SQLAlchemy 2.x| DB
    DC -.->|orchestrates| FE
    DC -.->|orchestrates| API
    DC -.->|orchestrates| DB
```

### Backend Architecture

```mermaid
graph LR
    subgraph "Products Module"
        PR[router.py] --> PS[service.py] --> PREP[repository.py]
    end
    subgraph "Customers Module"
        CR[router.py] --> CS[service.py] --> CREP[repository.py]
    end
    subgraph "Orders Module"
        OR[router.py] --> OS[service.py] --> OREP[repository.py]
        OS -->|stock ops| PREP
    end
    subgraph "Dashboard Module"
        DR[router.py] --> DS[service.py]
    end
    subgraph "Core"
        CFG[config.py]
        DBC[database.py]
        EXC[exceptions.py]
        LOG[logging.py]
    end
```

### Frontend Architecture

```mermaid
graph TD
    App --> BrowserRouter
    BrowserRouter --> MainLayout
    MainLayout --> Sidebar
    MainLayout --> Navbar
    Navbar --> ThemeToggle
    MainLayout --> Pages

    subgraph Pages
        DP[DashboardPage]
        PP[ProductsPage]
        CP[CustomersPage]
        OP[OrdersPage]
        NF[NotFoundPage]
    end

    subgraph "RTK Query Slices"
        PAI[productsApi]
        CAI[customersApi]
        OAI[ordersApi]
        DAI[dashboardApi]
    end

    Pages --> PAI
    Pages --> CAI
    Pages --> OAI
    Pages --> DAI
    PAI --> Redux
    CAI --> Redux
    OAI --> Redux
    DAI --> Redux
```

### Database ER Diagram

```mermaid
erDiagram
    PRODUCTS {
        uuid id PK
        varchar name
        varchar sku UK
        numeric price
        int stock_quantity
        timestamp created_at
        timestamp updated_at
    }
    CUSTOMERS {
        uuid id PK
        varchar full_name
        varchar email UK
        varchar phone
        timestamp created_at
        timestamp updated_at
    }
    ORDERS {
        uuid id PK
        uuid customer_id FK
        numeric total_amount
        timestamp created_at
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        numeric unit_price
        numeric subtotal
    }

    CUSTOMERS ||--o{ ORDERS : "places"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced in"
```

### Order Processing Flow

```mermaid
flowchart TD
    A[POST /api/v1/orders] --> B{Customer exists?}
    B -- No --> C[404 Not Found]
    B -- Yes --> D{All products exist?}
    D -- No --> E[404 Not Found]
    D -- Yes --> F{Sufficient stock?}
    F -- No --> G[409 Insufficient Stock]
    F -- Yes --> H[Begin DB Transaction]
    H --> I[Create Order record]
    I --> J[Create OrderItems]
    J --> K[Decrement stock per item]
    K --> L[Compute & save total_amount]
    L --> M[Commit Transaction]
    M --> N[201 Created — Order Response]
    H -->|exception| O[Rollback Transaction]
    O --> P[Re-raise error]
```

### Inventory Validation Flow

```mermaid
flowchart LR
    A[Order request received] --> B[Pre-check all items]
    B --> C{qty requested > stock?}
    C -- Yes for any item --> D[409 Conflict\nInsufficient stock for product X]
    C -- No for all --> E[Proceed with transaction]
    E --> F[Atomically decrement stock]
    F --> G[Commit]
```

### Order Cancellation Flow

```mermaid
flowchart TD
    A[DELETE /api/v1/orders/id] --> B{Order exists?}
    B -- No --> C[404 Not Found]
    B -- Yes --> D[Fetch order items]
    D --> E[Begin DB Transaction]
    E --> F[Increment stock for each item]
    F --> G[Delete order record\ncascades to order_items]
    G --> H[Commit Transaction]
    H --> I[200 OK]
    E -->|exception| J[Rollback Transaction]
    J --> K[Re-raise error]
```

---

## Folder Structure

```
inventory-management-system/
├── frontend/
│   ├── src/
│   │   ├── app/store/         # Redux store configuration
│   │   ├── features/          # RTK Query API slices
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   └── dashboard/
│   │   ├── components/        # Shared UI components
│   │   ├── layouts/           # Sidebar, Navbar, MainLayout
│   │   ├── pages/             # Route-level page components
│   │   ├── hooks/             # useTheme and other hooks
│   │   ├── lib/               # Zod schemas, cn utility
│   │   ├── routes/            # React Router configuration
│   │   └── utils/             # Pure utility functions
│   ├── Dockerfile
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── modules/
│   │   │   ├── products/      # router, service, repository, schemas, models
│   │   │   ├── customers/     # router, service, repository, schemas, models
│   │   │   ├── orders/        # router, service, repository, schemas, models
│   │   │   └── dashboard/     # router, service
│   │   ├── core/              # config, database, exceptions, logging
│   │   ├── shared/            # PortableUUID type
│   │   └── main.py
│   ├── alembic/               # Alembic migration scripts
│   ├── tests/                 # pytest test suites
│   ├── Dockerfile
│   └── .env.example
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.12+ (for backend development)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url>
cd inventory-management-system

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your values (the defaults work for local Docker)

# 3. Start all services
docker compose up --build

# Frontend: http://localhost
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set DATABASE_URL to a running PostgreSQL instance
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/inventory_db` |
| `POSTGRES_DB` | PostgreSQL database name | `inventory_db` |
| `POSTGRES_USER` | PostgreSQL username | `user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `password` |
| `APP_ENV` | Application environment | `development` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

> The local file `frontend/.env` is ignored by Git. Copy `frontend/.env.example` and update the URL for your local backend or production backend URL.

---

## Docker Setup

The full stack runs with a single command:

```bash
docker compose up --build
```

Services:
- **postgres** — PostgreSQL 16 with named volume `postgres_data`
- **backend** — FastAPI app; runs `alembic upgrade head` then starts Uvicorn
- **frontend** — Nginx serving the built React SPA

To stop and remove containers:
```bash
docker compose down
```

To also remove the database volume:
```bash
docker compose down -v
```

---

## API Documentation

Interactive Swagger UI: `http://localhost:8000/docs`

### Endpoints Summary

| Method | Path | Description | Status |
|---|---|---|---|
| GET | `/health` | Health check | 200 |
| POST | `/api/v1/products` | Create product | 201 |
| GET | `/api/v1/products` | List all products | 200 |
| GET | `/api/v1/products/{id}` | Get product | 200/404 |
| PUT | `/api/v1/products/{id}` | Update product | 200/404/409 |
| DELETE | `/api/v1/products/{id}` | Delete product | 200/404 |
| POST | `/api/v1/customers` | Create customer | 201/409 |
| GET | `/api/v1/customers` | List all customers | 200 |
| GET | `/api/v1/customers/{id}` | Get customer | 200/404 |
| DELETE | `/api/v1/customers/{id}` | Delete customer | 200/404 |
| POST | `/api/v1/orders` | Create order | 201/404/409 |
| GET | `/api/v1/orders` | List all orders | 200 |
| GET | `/api/v1/orders/{id}` | Get order with items | 200/404 |
| DELETE | `/api/v1/orders/{id}` | Cancel order + restore stock | 200/404 |
| GET | `/api/v1/dashboard/stats` | Dashboard stats | 200 |

### Error Response Format

```json
{
  "detail": "Human-readable error message"
}
```

### Insufficient Stock (409)

```json
{
  "detail": "Insufficient stock for product Laptop"
}
```

---

## Deployment Guide

### Frontend → Vercel

1. Connect the GitHub repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. In Vercel project settings, add the environment variable:
   - `VITE_API_URL=https://your-backend.render.com`
4. Add the same variable for both **Preview** and **Production**.
5. Deploy.

> Do not commit `frontend/.env` to source control. Vercel builds will use the environment variable defined in the project settings.

### Backend → Render

1. Create a new **Web Service** on Render
2. Set **Root Directory** to `backend`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `DATABASE_URL`, `APP_ENV=production`

### Database → Neon PostgreSQL

1. Create a new project on [Neon](https://neon.tech)
2. Copy the connection string
3. Set as `DATABASE_URL` in Render backend environment variables

---

## Scalability Strategy

The following capabilities are **architecturally supported** but not yet implemented:

### Authentication & Authorization
- The modular structure allows inserting a JWT middleware layer at the FastAPI router level
- RBAC can be implemented via a `permissions` table and a `current_user` dependency injected into all routes

### WebSockets
- FastAPI natively supports WebSocket endpoints
- Order status updates and inventory changes can be streamed in real-time by adding a WebSocket router to the existing app

### Event-Driven Architecture
- Each service method (e.g., `create_order`, `delete_order`) already produces structured log events — these can be replaced with message broker publishes (RabbitMQ/Kafka) with minimal refactoring
- The repository layer boundaries make it easy to swap synchronous writes for async event publishing

### Microservice Extraction
Because each domain module is fully self-contained (its own models, schemas, repository, service, and router), extraction follows a clear path:

| Service | Extracts from |
|---|---|
| Product Service | `app/modules/products/` |
| Customer Service | `app/modules/customers/` |
| Order Service | `app/modules/orders/` |
| Inventory Service | Subset of `orders/` + `products/` |

The only coupling to resolve is `orders/service.py` reading the products repository — this becomes an API call (HTTP or gRPC) after extraction.

---

## Future Improvements

- Add authentication (JWT) and role-based access control
- Implement pagination for all list endpoints
- Add product search and filtering
- Implement order status tracking (pending → fulfilled → shipped)
- Add bulk import/export for products and customers
- Integrate Stripe for payment processing
- Add email notifications on order creation/cancellation
- Implement audit logging for all data mutations

---

## Submission

| Item | URL |
|---|---|
| GitHub Repository | `<!-- TODO: Add GitHub Repo URL -->` |
| Docker Hub Backend Image | `<!-- TODO: Add Docker Hub Image URL -->` |
| Frontend Live URL | `<!-- TODO: Add Vercel Frontend URL -->` |
| Backend Live URL | `<!-- TODO: Add Render Backend URL -->` |

---

## Screenshots

> Add screenshots here after deployment.

| Page | Screenshot |
|---|---|
| Dashboard | `<!-- TODO: Add screenshot -->` |
| Products | `<!-- TODO: Add screenshot -->` |
| Customers | `<!-- TODO: Add screenshot -->` |
| Orders | `<!-- TODO: Add screenshot -->` |
| Order Details | `<!-- TODO: Add screenshot -->` |
