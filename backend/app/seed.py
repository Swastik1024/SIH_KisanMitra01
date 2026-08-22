from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models.user import User
from .models.product import Category, CategoryTranslation
from .core.security import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Create admin if not exists
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            admin = User(
                name="Admin",
                email="admin.khetikart@gmail.com",
                phone="9999999999",
                password_hash=hash_password("Swap@1234"),
                role="admin",
                language="en",
                location="Mumbai",
                verified=True
            )
            db.add(admin)
            db.commit()
            print("Admin created: admin.khetikart@gmail.com / Swap@1234")
        else:
            print("Admin already exists")

        # Category translations (English only for new categories, other languages can be added later)
        category_translations = {
            "en": {
                # Produce categories
                "vegetables": "Vegetables",
                "fruits": "Fruits",
                "grains": "Grains",
                "pulses": "Pulses",
                "herbs": "Herbs",
                # Medicine subcategories
                "pest_control": "Pest Control",
                "disease_control": "Disease Control",
                "weed_control": "Weed Control",
                "plant_nutrition": "Plant Nutrition",
                "bio_solutions": "Bio Solutions",
                "growth_yield": "Growth & Yield",
                # Instrument subcategories
                "tractors_vehicles": "Tractors & Vehicles",
                "tillage_preparation": "Tillage & Land Preparation",
                "sowing_planting": "Sowing & Planting",
                "irrigation_water": "Irrigation & Water",
                "crop_care": "Crop Care",
                "harvesting": "Harvesting",
                "tools_accessories": "Tools & Accessories",
            },
            # Other languages remain unchanged for existing categories.
            # New categories will fallback to English on the frontend if translation is missing.
            "hi": {
                "vegetables": "सब्ज़ियाँ",
                "fruits": "फल",
                "grains": "अनाज",
                "pulses": "दालें",
                "herbs": "जड़ी-बूटियाँ"
            },
            "mr": {
                "vegetables": "भाज्या",
                "fruits": "फळे",
                "grains": "धान्य",
                "pulses": "डाळी",
                "herbs": "औषधी वनस्पती"
            },
            "ta": {
                "vegetables": "காய்கறிகள்",
                "fruits": "பழங்கள்",
                "grains": "தானியங்கள்",
                "pulses": "பருப்பு வகைகள்",
                "herbs": "மூலிகைகள்"
            },
            "gu": {
                "vegetables": "શાકભાજી",
                "fruits": "ફળો",
                "grains": "અનાજ",
                "pulses": "કઠોળ",
                "herbs": "જડીબુટ્ટીઓ"
            },
            "te": {
                "vegetables": "కూరగాయలు",
                "fruits": "పండ్లు",
                "grains": "ధాన్యాలు",
                "pulses": "పప్పులు",
                "herbs": "మూలికలు"
            },
            "kn": {
                "vegetables": "ತರಕಾರಿಗಳು",
                "fruits": "ಹಣ್ಣುಗಳು",
                "grains": "ಧಾನ್ಯಗಳು",
                "pulses": "ದ್ವಿದಳ ಧಾನ್ಯಗಳು",
                "herbs": "ಗಿಡಮೂಲಿಕೆಗಳು"
            },
            "bn": {
                "vegetables": "সবজি",
                "fruits": "ফল",
                "grains": "শস্য",
                "pulses": "ডাল",
                "herbs": "ভেষজ"
            }
        }

        # Full list of categories
        categories = [
            "vegetables", "fruits", "grains", "pulses", "herbs",
            # Medicine subcategories
            "pest_control", "disease_control", "weed_control",
            "plant_nutrition", "bio_solutions", "growth_yield",
            # Instrument subcategories
            "tractors_vehicles", "tillage_preparation", "sowing_planting",
            "irrigation_water", "crop_care", "harvesting", "tools_accessories"
        ]

        for cat_slug in categories:
            category = db.query(Category).filter(Category.slug == cat_slug).first()
            if not category:
                category = Category(slug=cat_slug)
                db.add(category)
                db.commit()
                db.refresh(category)

                for lang, translations in category_translations.items():
                    name = translations.get(cat_slug)
                    if name:
                        db.add(CategoryTranslation(
                            category_id=category.id,
                            language=lang,
                            name=name
                        ))
                db.commit()
                print(f"Category '{cat_slug}' created with translations")

        print("Seed completed")
    finally:
        db.close()

if __name__ == "__main__":
    seed()