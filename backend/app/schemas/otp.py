from pydantic import BaseModel

class SendOtpRequest(BaseModel):
    contact: str    # email or phone

class VerifyOtpRequest(BaseModel):
    contact: str
    otp: str