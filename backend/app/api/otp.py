import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.otp import OtpVerification
from ..schemas.otp import SendOtpRequest, VerifyOtpRequest

router = APIRouter(prefix="/api/auth/otp", tags=["otp"])

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

@router.post("/send")
def send_otp(data: SendOtpRequest, db: Session = Depends(get_db)):
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)

    # Remove old unverified OTPs for this contact
    db.query(OtpVerification).filter(
        OtpVerification.contact == data.contact,
        OtpVerification.is_verified == False
    ).delete()

    record = OtpVerification(
        contact=data.contact,
        otp_code=otp,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(record)
    db.commit()

    # In development, print OTP to console (for testing)
    print(f"OTP for {data.contact}: {otp}")

    # TODO: Integrate Twilio/SMTP here for production
    # from ..services.sms_service import send_sms
    # send_sms(data.contact, f"Your KetiKart OTP is {otp}")

    return {"message": "OTP sent successfully", "otp": otp}

@router.post("/verify")
def verify_otp(data: VerifyOtpRequest, db: Session = Depends(get_db)):
    record = db.query(OtpVerification).filter(
        OtpVerification.contact == data.contact,
        OtpVerification.otp_code == data.otp,
        OtpVerification.is_verified == False,
        OtpVerification.expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    record.is_verified = True
    db.commit()
    return {"message": "OTP verified successfully"}