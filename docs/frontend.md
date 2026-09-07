# Frontend Documentation

## Overview

The frontend is a **React + Vite** single-page application (SPA) for the Inventory & Order Management System. It uses Redux Toolkit Query for data fetching and caching, React Router for navigation, Tailwind CSS for styling, and Zod for form validation.

---

## Architecture

```mermaid
graph TD
    Entry["main.jsx\n(App entry point)"]
    Redux["Redux Store\n(store.js)"]
    App["App.jsx\n(Router + Toast wrapper)"]
    Routes["AppRoutes\n(route definitions)"]

    Dashboard["DashboardPage"]
    Products["ProductsPage"]
    Customers["CustomersPage"]
    Orders["OrdersPage"]

    ProdAPI["productsApi\n(RTK Query slice)"]
    CustAPI["customersApi\n(RTK Query slice)"]
    OrdAPI["ordersApi\n(RTK Query slice)"]
    DashAPI["dashboardApi\n(RTK Query slice)"]

    Backend["FastAPI Backend\n(:8000)"]

    Entry --> Redux
    Entry --> App
    App --> Routes
    Routes --> Dashboard
    Routes --> Products
    Routes --> Customers
    Routes --> Orders

    Dashboard --> DashAPI
    Products --> ProdAPI
    Customers --> CustAPI
    Orders --> OrdAPI & CustAPI & ProdAPI

    ProdAPI --> Backend
    CustAPI --> Backend
    OrdAPI --> Backend
    DashAPI --> Backend
```

---

## Scenario Flow: Deleting a Customer

```mermaid
sequenceDiagram
    participant U as User
    participant Page as CustomersPage
    participant Dialog as ConfirmDialog
    participant Hook as useDeleteCustomerMutation
    participant MW as RTK Query Middleware
    participant API as FastAPI Backend
    participant Cache as Redux Cache

    U->>Page: Clicks Delete button
    Page->>Dialog: Opens confirm dialog
    U->>Dialog: Confirms deletion
    Dialog->>Hook: deleteCustomer(id)
    Hook->>API: DELETE /api/v1/customers/:id
    API-->>Hook: 200 OK
    Hook->>MW: invalidatesTags ['Customer']
    MW->>Cache: Mark Customer cache stale
    MW->>API: GET /api/v1/customers (auto refetch)
    API-->>Cache: Fresh customer list
    Cache-->>Page: Re-renders with updated list
    Page->>U: Shows success Toast
```

---

## Scenario Flow: Creating an Order

```mermaid
sequenceDiagram
    participant U as User
    participant Page as OrdersPage
    participant Form as OrderCreateForm
    participant Zod as Zod Validation
    participant Hook as useCreateOrderMutation
    participant API as FastAPI Backend
    participant Cache as Redux Cache

    U->>Page: Clicks Create Order
    Page->>Form: Opens OrderCreateForm modal
    U->>Form: Fills customer, product, quantity
    Form->>Zod: Validates input on submit
    Zod-->>Form: Validation passed
    Form->>Hook: createOrder(data)
    Hook->>API: POST /api/v1/orders
    API-->>Hook: 201 Created + order JSON
    Hook->>Cache: invalidatesTags ['Order']
    Cache->>API: Refetch GET /api/v1/orders
    API-->>Cache: Updated orders list
    Cache-->>Page: Re-renders orders table
    Page->>U: Shows success Toast + closes modal
```

---

## Folder Structure

```
frontend/
├── public/
│   ├── favicon.svg                   (browser tab icon)
│   └── icons.svg                     (SVG sprite for icons)
├── src/
│   ├── main.jsx                      (app entry - mounts React, wraps with Redux Provider)
│   ├── App.jsx                       (root component - sets up BrowserRouter and ToastProvider)
│   ├── index.css                     (global CSS, Tailwind base imports)
│   ├── App.css                       (app-level scoped styles)
│   │
│   ├── app/
│   │   └── store/
│   │       └── store.js              (Redux store - registers all API reducers and middleware)
│   │
│   ├── features/                     (RTK Query API slices - one per domain)
│   │   ├── products/
│   │   │   ├── productsApi.js        (defines product endpoints + auto-generated hooks)
│   │   │   └── productsApi.test.js   (unit tests for products API)
│   │   ├── customers/
│   │   │   ├── customersApi.js       (defines customer endpoints + auto-generated hooks)
│   │   │   └── customersApi.test.js  (unit tests for customers API)
│   │   ├── orders/
│   │   │   ├── ordersApi.js          (defines order endpoints + auto-generated hooks)
│   │   │   └── ordersApi.test.js     (unit tests for orders API)
│   │   └── dashboard/
│   │       └── dashboardApi.js       (defines dashboard stats endpoint + hook)
│   │
│   ├── pages/                        (full page components - one per route)
│   │   ├── DashboardPage.jsx         (shows stat cards and low stock table)
│   │   ├── ProductsPage.jsx          (product list, create/edit/delete product)
│   │   ├── CustomersPage.jsx         (customer list, create/delete customer)
│   │   ├── OrdersPage.jsx            (order list, create order, view order details)
│   │   └── NotFoundPage.jsx          (404 fallback page)
│   │
│   ├── components/                   (reusable UI components used across pages)
│   │   ├── StatCard.jsx              (dashboard metric card - total orders, revenue etc)
│   │   ├── LowStockTable.jsx         (table showing products below stock threshold)
│   │   ├── ProductForm.jsx           (form for creating and editing a product)
│   │   ├── CustomerForm.jsx          (form for creating a customer)
│   │   ├── OrderCreateForm.jsx       (multi-step form for creating an order)
│   │   ├── OrderDetailModal.jsx      (modal showing full order breakdown)
│   │   ├── ConfirmDialog.jsx         (reusable "are you sure?" confirmation dialog)
│   │   ├── Toast.jsx                 (notification system - success/error popups)
│   │   ├── ThemeToggle.jsx           (dark/light mode toggle button)
│   │   ├── EmptyState.jsx            (shown when a list has no data)
│   │   ├── ErrorState.jsx            (shown when an API call fails)
│   │   └── LoadingSkeleton.jsx       (placeholder UI shown while data loads)
│   │
│   ├── hooks/
│   │   ├── useTheme.js               (custom hook - manages dark/light mode state)
│   │   └── useTheme.test.js          (tests for useTheme hook)
│   │
│   ├── lib/
│   │   ├── schemas.js                (Zod validation schemas for product and customer forms)
│   │   ├── schemas.test.js           (tests for Zod schemas)
│   │   └── utils.js                  (utility functions - className merging etc)
│   │
│   ├── utils/
│   │   ├── orderUtils.js             (order-specific helpers - price formatting, totals)
│   │   └── orderUtils.test.js        (tests for order utilities)
│   │
│   ├── layouts/                      (shared page layout wrappers)
│   ├── routes/                       (React Router route definitions)
│   └── test/
│       └── setup.js                  (vitest global test setup - jest-dom matchers)
│
├── index.html                        (HTML shell - Vite injects the React bundle here)
├── vite.config.js                    (Vite config - @ alias, plugins)
├── vitest.config.js                  (Vitest test runner config)
├── postcss.config.js                 (PostCSS config for Tailwind)
├── eslint.config.js                  (ESLint rules)
├── package.json                      (dependencies and npm scripts)
├── Dockerfile                        (two-stage build: Node build + Nginx serve)
└── .env.example                      (example environment variables)
```

---

## Dependency Libraries

### Runtime Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | Core UI library |
| `react-router-dom` | Client-side routing between pages |
| `@reduxjs/toolkit` | Redux store + RTK Query for data fetching/caching |
| `react-redux` | Connects React components to Redux store |
| `react-hook-form` | Form state management and submission handling |
| `@hookform/resolvers` | Bridges Zod schemas with react-hook-form |
| `zod` | Schema-based form validation |
| `lucide-react` | SVG icon components |
| `tailwindcss` | Utility-first CSS framework |
| `@tailwindcss/vite` | Vite plugin for Tailwind CSS v4 |
| `@radix-ui/react-dialog` | Accessible modal/dialog primitives |
| `@radix-ui/react-alert-dialog` | Accessible confirmation dialog |
| `@radix-ui/react-select` | Accessible dropdown select |
| `@radix-ui/react-toast` | Accessible toast notification |
| `@radix-ui/react-label` | Accessible form label |
| `@radix-ui/react-slot` | Component composition utility |
| `class-variance-authority` | Manages conditional CSS class variants |
| `clsx` + `tailwind-merge` | Merges Tailwind class names without conflicts |
| `axios` | HTTP client (used alongside RTK Query for some requests) |
| `fast-check` | Property-based testing library |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `vite` | Build tool and dev server |
| `vitest` | Unit test runner (Vite-native) |
| `@testing-library/react` | React component testing utilities |
| `@testing-library/user-event` | Simulates real user interactions in tests |
| `@testing-library/jest-dom` | Custom DOM matchers for assertions |
| `jsdom` | DOM simulation environment for tests |
| `eslint` | Code linting |

---

## Redux Store Architecture

```mermaid
graph TD
    Store["Redux Store"]
    PA["productsApi\n(cache: product list, individual products)"]
    CA["customersApi\n(cache: customer list, individual customers)"]
    OA["ordersApi\n(cache: order list, individual orders)"]
    DA["dashboardApi\n(cache: dashboard stats)"]

    Store --> PA
    Store --> CA
    Store --> OA
    Store --> DA

    PA -->|providesTags: Product| PCache["Product Cache"]
    CA -->|providesTags: Customer| CCache["Customer Cache"]
    OA -->|providesTags: Order| OCache["Order Cache"]

    PCache -->|invalidated by| CreateProduct["createProduct mutation"]
    PCache -->|invalidated by| DeleteProduct["deleteProduct mutation"]
    CCache -->|invalidated by| CreateCustomer["createCustomer mutation"]
    CCache -->|invalidated by| DeleteCustomer["deleteCustomer mutation"]
    OCache -->|invalidated by| CreateOrder["createOrder mutation"]
```

---

## RTK Query Cache Flow

```mermaid
flowchart TD
    A[Component mounts] --> B{Is data in cache?}
    B -- Yes + fresh --> C[Return cached data instantly]
    B -- No / stale --> D[Fetch from API]
    D --> E[Store response in Redux cache]
    E --> C
    C --> F[Component renders data]

    G[Mutation fires e.g. DELETE] --> H[API call succeeds]
    H --> I[invalidatesTags runs]
    I --> J[Matching cache marked stale]
    J --> D
```

---

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

This is the base URL for all API calls. It gets baked into the JS bundle at build time by Vite.

---

## The `@` Path Alias

`@` is configured in `vite.config.js` to point to `src/`:

```js
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

So instead of messy relative paths:
```js
import { store } from '../../../app/store/store'
```

You write:
```js
import { store } from '@/app/store/store'
```

---

## Running the Frontend

```bash
# With Docker (recommended)
docker compose up

# Locally
cd frontend
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run test       # watch mode tests
npm run test:run   # single run tests
```

---

## Form Validation Flow

Forms use `react-hook-form` + `zod` together:

```mermaid
flowchart LR
    Schema["schemas.js\n(Zod schema)"]
    Resolver["@hookform/resolvers/zod"]
    Form["useForm() hook"]
    Input["User input"]
    Submit["onSubmit handler"]
    API["RTK Query mutation"]

    Schema --> Resolver --> Form
    Input --> Form
    Form -->|validates on submit| Submit
    Submit --> API
```

Schemas live in `src/lib/schemas.js` and are shared between the form and tests.
