from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import hash_password

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Create a new database session
db = SessionLocal()

try:
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        existing_admin.password_hash = hash_password("Admin@1234")
        existing_admin.email = "admin@kisanmitra.com"
        db.commit()
        print("[SUCCESS] Admin credentials verified/updated:")
        print(f"Email: {existing_admin.email}")
        print("Password: Admin@1234")
    else:
        admin = User(
            name="System Admin",
            email="admin@kisanmitra.com",
            phone="9999999999",
            password_hash=hash_password("Admin@1234"),
            role="admin",
            language="en",
            verified=True,
        )
        db.add(admin)
        db.commit()
        print("[SUCCESS] Default admin created successfully")
        print("Email: admin@kisanmitra.com")
        print("Password: Admin@1234")

finally:
    db.close()