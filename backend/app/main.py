import os

from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.modules.products.router import router as products_router
from app.modules.customers.router import router as customers_router
from app.modules.orders.router import router as orders_router
from app.modules.dashboard.router import router as dashboard_router

app = FastAPI(
    title="Inventory & Order Management API",
    description="A production-ready Inventory & Order Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


def run_migrations() -> None:
    config = Config(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "alembic.ini"))
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    command.upgrade(config, "head")


@app.on_event("startup")
async def startup_event() -> None:
    if settings.APP_ENV != "test":
        run_migrations()


app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
