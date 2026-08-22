from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    order_id: int

class PaymentOut(BaseModel):
    id: int
    order_id: int
    gateway_transaction_id: Optional[str]
    amount: float
    currency: str
    status: str
    payment_method: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class GSTInvoiceOut(BaseModel):
    id: int
    order_id: int
    invoice_number: str
    gstin_seller: Optional[str]
    gstin_buyer: Optional[str]
    cgst: float
    sgst: float
    igst: float
    total_amount: float
    invoice_pdf_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True