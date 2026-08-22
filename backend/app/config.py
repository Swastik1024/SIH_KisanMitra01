import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "AgriMart"
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agrimart.db")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    SMS_API_KEY = os.getenv("SMS_API_KEY", "")
    EMAIL_HOST = os.getenv("EMAIL_HOST", "")
    EMAIL_PORT = os.getenv("EMAIL_PORT", 587)
    EMAIL_USER = os.getenv("EMAIL_USER", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")

settings = Settings()