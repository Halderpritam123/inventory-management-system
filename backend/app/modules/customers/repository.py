from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.customers.models import Customer


class CustomerRepository:
    def get_all(self, db: Session) -> List[Customer]:
        return db.query(Customer).all()

    def get_by_id(self, db: Session, customer_id: UUID) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.email == email).first()

    def create(self, db: Session, data: dict) -> Customer:
        customer = Customer(**data)
        db.add(customer)
        db.flush()
        db.refresh(customer)
        return customer

    def delete(self, db: Session, customer: Customer) -> None:
        db.delete(customer)
        db.flush()


customer_repository = CustomerRepository()
