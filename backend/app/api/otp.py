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

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from ..config import settings

def send_smtp_email(to_email: str, otp_code: str):
    if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
        return False
    try:
        host = settings.EMAIL_HOST or "smtp.gmail.com"
        port = int(settings.EMAIL_PORT or 587)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your KisanMitra OTP Verification Code: {otp_code}"
        msg["From"] = f"KisanMitra <{settings.EMAIL_USER}>"
        msg["To"] = to_email

        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2d6a4f; text-align: center;">🌾 KisanMitra Verification</h2>
            <p>Hello,</p>
            <p>Your one-time verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #1b4332; background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                {otp_code}
            </div>
            <p style="color: #666; font-size: 14px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">© KisanMitra Platform</p>
        </div>
        """
        msg.attach(MIMEText(f"Your KisanMitra OTP is: {otp_code}", "plain"))
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(host, port, timeout=10)
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[OTP] Email successfully sent via SMTP to {to_email}")
        return True
    except Exception as e:
        print(f"[OTP Email Error] Failed to send email to {to_email}: {e}")
        return False

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

    print(f"[OTP Service] Generated OTP for {data.contact}: {otp}")

    # If contact is an email, attempt SMTP delivery if configured
    if "@" in data.contact:
        send_smtp_email(data.contact, otp)

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