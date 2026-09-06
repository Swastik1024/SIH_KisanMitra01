import os
import sys
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.farmer import FarmerProfile
from app.models.product import Category, CategoryTranslation
from app.models.settings import PlatformSetting
from app.core.security import hash_password

def reset_database():
    print("🧹 [1/4] Dropping all existing database tables...")
    Base.metadata.drop_all(bind=engine)

    print("🏗️ [2/4] Recreating database schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("🌱 [3/4] Seeding default categories...")
        DEFAULT_CATEGORIES = [
            {"slug": "vegetables", "en": "Vegetables", "hi": "सब्जियां"},
            {"slug": "fruits", "en": "Fruits", "hi": "फल"},
            {"slug": "grains", "en": "Grains", "hi": "अनाज"},
            {"slug": "pulses", "en": "Pulses", "hi": "दालें"},
            {"slug": "herbs", "en": "Herbs & Spices", "hi": "जड़ी-बूटियाँ और मसाले"},
            {"slug": "medical", "en": "Farm Medicine & Seeds", "hi": "कृषि दवाएं और बीज"},
            {"slug": "instruments", "en": "Machinery & Instruments", "hi": "कृषि यंत्र और उपकरण"},
        ]
        for item in DEFAULT_CATEGORIES:
            cat = Category(slug=item["slug"])
            db.add(cat)
            db.commit()
            db.refresh(cat)
            db.add_all([
                CategoryTranslation(category_id=cat.id, language="en", name=item["en"]),
                CategoryTranslation(category_id=cat.id, language="hi", name=item["hi"])
            ])
        db.commit()

        print("👤 [4/4] Seeding default users (Admin, Farmer, Trader)...")
        # 1. Admin
        admin = User(
            name="System Admin",
            email="admin@kisanmitra.com",
            phone="9999999999",
            password_hash=hash_password("Admin@1234"),
            role="admin",
            language="en",
            verified=True,
            is_active=True
        )
        db.add(admin)

        # 2. Demo Farmer
        farmer = User(
            name="Ramesh Patil",
            email="farmer@kisanmitra.com",
            phone="9876543210",
            password_hash=hash_password("Farmer@1234"),
            role="farmer",
            language="en",
            location="Nashik, Maharashtra",
            pincode="422001",
            verified=True,
            is_active=True
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)

        # Farmer profile
        farmer_profile = FarmerProfile(
            user_id=farmer.id,
            land_size_acres=5.5,
            primary_crops="Wheat, Onion, Soybean",
            organic_certified=True
        )
        db.add(farmer_profile)

        # 3. Demo Trader
        trader = User(
            name="Suresh Agarwal",
            email="trader@kisanmitra.com",
            phone="9812345678",
            password_hash=hash_password("Trader@1234"),
            role="trader",
            language="en",
            location="APMC Market, Pune",
            pincode="411001",
            verified=True,
            is_active=True
        )
        db.add(trader)

        # 4. Default Platform Settings
        platform_setting = PlatformSetting(
            platform_name="KisanMitra",
            maintenance_mode=False,
            allow_new_registrations=True,
            commission_rate=2.5,
            max_auction_duration_hours=72,
            support_email="support@kisanmitra.com",
            support_phone="+91 1800 123 4567"
        )
        db.add(platform_setting)

        db.commit()
        print("\n✨ DATABASE HAS BEEN COMPLETELY CLEARED & CLEANLY INITIALIZED!")
        print("---------------------------------------------------------------")
        print("👑 Admin:   admin@kisanmitra.com  / Admin@1234")
        print("👨‍🌾 Farmer:  farmer@kisanmitra.com / Farmer@1234")
        print("🏪 Trader:  trader@kisanmitra.com / Trader@1234")
        print("---------------------------------------------------------------")

    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
