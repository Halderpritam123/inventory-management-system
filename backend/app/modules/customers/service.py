from uuid import UUID
from typing import List
from sqlalchemy.orm import Session
from app.modules.customers.models import Customer
from app.modules.customers.repository import customer_repository
from app.modules.customers.schemas import CustomerCreate
from app.core.exceptions import NotFoundError, ConflictError
from app.core.logging import get_logger

logger = get_logger(__name__)


def list_customers(db: Session) -> List[Customer]:
    logger.info("Listing all customers")
    return customer_repository.get_all(db)


def get_customer(db: Session, customer_id: UUID) -> Customer:
    customer = customer_repository.get_by_id(db, customer_id)
    if not customer:
        raise NotFoundError(f"Customer with id {customer_id} not found")
    return customer


def create_customer(db: Session, data: CustomerCreate) -> Customer:
    existing = customer_repository.get_by_email(db, data.email)
    if existing:
        raise ConflictError(f"Email '{data.email}' already exists")
    customer = customer_repository.create(db, data.model_dump())
    db.commit()
    db.refresh(customer)
    logger.info("Customer created: id=%s email=%s", customer.id, customer.email)
    return customer


def delete_customer(db: Session, customer_id: UUID) -> None:
    customer = get_customer(db, customer_id)
    customer_repository.delete(db, customer)
    db.commit()
    logger.info("Customer deleted: id=%s", customer_id)
