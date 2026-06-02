from sqlalchemy.orm import Session
from app.modules.products.models import Product
from app.modules.customers.models import Customer
from app.modules.orders.models import Order
from app.core.logging import get_logger

logger = get_logger(__name__)

LOW_STOCK_THRESHOLD = 5


def get_dashboard_stats(db: Session) -> dict:
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    low_stock_products = (
        db.query(Product).filter(Product.stock_quantity < LOW_STOCK_THRESHOLD).count()
    )

    logger.info("Dashboard stats fetched")
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products,
    }
