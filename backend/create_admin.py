from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.core.security import hash_password

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Create a new database session
db = SessionLocal()

try:
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == "admin.khetikart@gmail.com").first()
    if existing_admin:
        print("Admin already exists")
    else:
        admin = User(
            name="Admin",
            email="admin.khetikart@gmail.com",
            phone="7620404109",
            password_hash=hash_password("Swap@1234"),
            role="admin",
            language="en",
            verified=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Default admin created successfully")
        print("Email: admin.khetikart@gmail.com")
        print("Password: Swap@1234")
finally:
    db.close()