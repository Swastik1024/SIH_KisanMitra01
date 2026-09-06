import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

from ..database import get_db
from ..models.user import User, TraderLicense
from ..models.farmer import FarmerProfile
from ..models.otp import OtpVerification
from ..schemas.auth import (
    FarmerRegister, TraderRegister, AdminCreate,
    LoginRequest, TokenResponse, UserOut,
    ForgotPasswordRequest, ResetPasswordRequest
)
from ..core.security import hash_password, verify_password, create_access_token
from ..core.deps import get_current_user, require_role
from .otp import generate_otp

router = APIRouter(prefix="/api/auth", tags=["auth"])


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

def is_otp_verified(contact: str, db: Session) -> bool:
    """Check if a verified OTP record exists for the contact."""
    return db.query(OtpVerification).filter(
        OtpVerification.contact == contact,
        OtpVerification.is_verified == True
    ).first() is not None

# Helper to create user and return token
def create_user_common(db: Session, user_data: dict, role: str) -> User:
    if db.query(User).filter(User.email == user_data["email"]).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == user_data["phone"]).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    user = User(
        name=user_data["name"],
        email=user_data["email"],
        phone=user_data["phone"],
        password_hash=hash_password(user_data["password"]),
        role=role,
        language=user_data.get("language", "en"),
        location=user_data.get("location"),
        pincode=user_data.get("pincode"),
        verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/register/farmer", response_model=TokenResponse)
def register_farmer(data: FarmerRegister, db: Session = Depends(get_db)):
    if not is_otp_verified(data.email, db):
        raise HTTPException(status_code=400, detail="Email must be verified via OTP")

    user = create_user_common(db, {
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": data.password,
        "language": data.language,
        "location": data.location
    }, role="farmer")

    # Create farmer profile with document URLs and dummy verification
    farmer_profile = FarmerProfile(
        user_id=user.id,
        aadhar_document=data.aadhar_document,
        pan_document=data.pan_document,
        farmer_card_document=data.farmer_card_document,
        document_verified=True,   # dummy verification
    )
    db.add(farmer_profile)
    db.commit()

    # Delete used OTP verifications
    db.query(OtpVerification).filter(
        OtpVerification.contact == data.email,
        OtpVerification.is_verified == True
    ).delete(synchronize_session=False)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
        "pincode": user.pincode,
    }

@router.post("/register/trader", response_model=TokenResponse)
def register_trader(data: TraderRegister, db: Session = Depends(get_db)):
    if not is_otp_verified(data.email, db):
        raise HTTPException(status_code=400, detail="Email must be verified via OTP")

    user = create_user_common(db, {
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "password": data.password,
        "language": data.language,
        "location": data.location,
        "pincode": data.pincode,
    }, role="trader")

    license = TraderLicense(
        user_id=user.id,
        licence_number=data.licence_number,
        expiry_date=data.licence_expiry,
        verified=False,
        # Document fields
        aadhar_document=data.aadhar_document,
        pan_document=data.pan_document,
        trading_licence_document=data.trading_licence_document,
        document_verified=True,   # dummy verification
    )
    db.add(license)
    db.commit()

    # Delete used OTP verifications
    db.query(OtpVerification).filter(
        OtpVerification.contact == data.email,
        OtpVerification.is_verified == True
    ).delete(synchronize_session=False)
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
        "pincode": user.pincode,
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    req_email = str(data.email).strip().lower()
    req_password = str(data.password).strip()

    # Dynamic fallback check for Admin configured via environment variables
    env_admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    env_admin_password = os.getenv("ADMIN_PASSWORD", "").strip()

    if env_admin_email and env_admin_password and req_email == env_admin_email and req_password == env_admin_password:
        admin_user = db.query(User).filter(func.lower(User.email) == req_email).first()
        if not admin_user:
            admin_user = db.query(User).filter(User.role == "admin").first()
        if admin_user:
            admin_user.email = req_email
            admin_user.role = "admin"
            admin_user.password_hash = hash_password(req_password)
            admin_user.verified = True
            admin_user.is_active = True
            db.commit()
            db.refresh(admin_user)
        else:
            admin_user = User(
                name="System Admin",
                email=req_email,
                phone=os.getenv("ADMIN_PHONE", "9999999999").strip(),
                password_hash=hash_password(req_password),
                role="admin",
                language="en",
                verified=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": admin_user.role,
            "user_id": admin_user.id,
            "name": admin_user.name,
            "pincode": admin_user.pincode,
        }

    # Standard database authentication with case-insensitive email match
    user = db.query(User).filter(func.lower(User.email) == req_email).first()
    if not user or not verify_password(req_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
    if user.role == "agent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agent role is no longer supported. Please contact admin.")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name,
        "pincode": user.pincode,
    }

class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token (JWT) from frontend

@router.post("/google-login")
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Accept Google user info string (sub|email|name) and return our app JWT."""
    try:
        parts = data.credential.split('|', 2)
        if len(parts) < 2:
            raise ValueError("Invalid format")
        google_email = parts[1].strip()
        google_name = parts[2].strip() if len(parts) > 2 and parts[2].strip() else google_email.split("@")[0]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Google credential format")

    if not google_email or "@" not in google_email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google account")

    # Find existing user or auto-create as farmer
    user = db.query(User).filter(User.email == google_email).first()
    if not user:
        import secrets
        random_pw = secrets.token_hex(16)
        user = User(
            name=google_name,
            email=google_email,
            phone=None,          # Google accounts have no phone; NULL avoids UNIQUE clash
            password_hash=hash_password(random_pw),
            role="farmer",
            language="en",
            location=""
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")

    # Generate OTP and save
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)

    # Delete old unverified OTPs for this email
    db.query(OtpVerification).filter(
        OtpVerification.contact == data.email,
        OtpVerification.is_verified == False
    ).delete()

    record = OtpVerification(
        contact=data.email,
        otp_code=otp,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(record)
    db.commit()

    # For dev: print OTP to server logs. Integrate a real email provider for production.
    print(f"[DEV] Password reset OTP for {data.email}: {otp}")

    return {"message": "OTP sent to email"}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    # Verify OTP
    record = db.query(OtpVerification).filter(
        OtpVerification.contact == data.email,
        OtpVerification.otp_code == data.otp,
        OtpVerification.is_verified == False,
        OtpVerification.expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
    ).first()
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate new password strength (same as change-password)
    password = data.new_password
    if not (6 <= len(password) <= 12):
        raise HTTPException(status_code=400, detail="Password must be 6-12 characters")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    if not any(c in "@$!%*?&#" for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")

    user.password_hash = hash_password(data.new_password)
    record.is_verified = True
    db.commit()
    return {"message": "Password reset successfully"}

@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    password = data.new_password
    if not (6 <= len(password) <= 12):
        raise HTTPException(status_code=400, detail="Password must be 6-12 characters")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not any(c.islower() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    if not any(c in "@$!%*?&#" for c in password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")

    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/verify-token")
def verify_token(current_user: User = Depends(get_current_user)):
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "verified": current_user.verified
    }



@router.post("/admin/admins", response_model=TokenResponse)
def create_admin(data: AdminCreate, db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    user = create_user_common(db, data.dict(), role="admin")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }