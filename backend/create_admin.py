import os
import getpass
from dotenv import load_dotenv

load_dotenv()

from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import hash_password

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Get credentials from environment or interactive prompt
admin_email = os.getenv("ADMIN_EMAIL")
admin_password = os.getenv("ADMIN_PASSWORD")

if not admin_email:
    admin_email = input("Enter Admin Email: ").strip()

if not admin_password:
    admin_password = getpass.getpass("Enter Admin Password: ").strip()

if not admin_email or not admin_password:
    print("[ERROR] Admin email and password cannot be empty.")
    exit(1)

db = SessionLocal()

try:
    existing_admin = db.query(User).filter((User.email == admin_email) | (User.role == "admin")).first()
    if existing_admin:
        existing_admin.email = admin_email
        existing_admin.role = "admin"
        existing_admin.password_hash = hash_password(admin_password)
        existing_admin.verified = True
        existing_admin.is_active = True
        db.commit()
        print(f"[SUCCESS] Admin account '{admin_email}' credentials updated successfully.")
    else:
        admin = User(
            name="System Admin",
            email=admin_email,
            phone=os.getenv("ADMIN_PHONE", "9999999999").strip(),
            password_hash=hash_password(admin_password),
            role="admin",
            language="en",
            verified=True,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[SUCCESS] Admin account '{admin_email}' created successfully.")

finally:
    db.close()