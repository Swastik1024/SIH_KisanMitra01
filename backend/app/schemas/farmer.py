from pydantic import BaseModel
from typing import Optional

class FarmerProfileUpdate(BaseModel):
    gender: Optional[str] = None
    land_size: Optional[str] = None
    address: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    account_last4: Optional[str] = None
    aadhar_verified: Optional[bool] = None
    pan_verified: Optional[bool] = None
    farmer_id_verified: Optional[bool] = None

class FarmerProfileOut(BaseModel):
    gender: Optional[str]
    land_size: Optional[str]
    address: Optional[str]
    bank_name: Optional[str]
    account_holder: Optional[str]
    account_last4: Optional[str]
    aadhar_verified: bool
    pan_verified: bool
    farmer_id_verified: bool
    rating: float

    class Config:
        from_attributes = True