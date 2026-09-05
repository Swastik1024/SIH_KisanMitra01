from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    language: str = 'en'
    location: Optional[str] = None
    pincode: Optional[str] = None

class FarmerRegister(UserBase):
    password: str
    aadhar_document: Optional[str] = None
    pan_document: Optional[str] = None
    farmer_card_document: Optional[str] = None

class TraderRegister(UserBase):
    password: str
    licence_number: str
    licence_expiry: Optional[datetime] = None
    aadhar_document: Optional[str] = None
    pan_document: Optional[str] = None
    trading_licence_document: Optional[str] = None

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    pincode: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: str
    language: str
    location: Optional[str]
    pincode: Optional[str] = None
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True