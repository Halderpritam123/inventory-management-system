from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr


class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class CustomerResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
