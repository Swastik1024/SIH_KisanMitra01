import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, SessionLocal
from .config import settings
from .api import auth, products, auctions, orders, payments, uploads, ws_auctions, admin_dashboard, admin_users, admin_listings, admin_revenue, admin_auctions, admin_products
from .models.auction import Auction, Bid
from .models.order import Order
from .models.notification import Notification
from .api import otp
from .api import farmer
from .api import categories
from .api import trader
from .models.settings import PlatformSetting
from .api import admin_analysis, admin_settings
from .api import farmer_orders
from .api import admin_requests
from .api import bids
from .api import farmer_payments
from .api import utils
from .api import farmer_transactions
from .api import support
from .api import ai_inspection, price_prediction, mandi, weather_advisory, db_management, notifications
from .api import doc_verify

from sqlalchemy import text

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

# Ensure backwards-compatible columns exist in SQLite database
try:
    with engine.begin() as conn:
        if settings.DATABASE_URL.startswith("sqlite"):
            # users table columns
            user_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if "is_active" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            if "pincode" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN pincode VARCHAR(6)"))
            if "language" not in user_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en'"))
                
            # products table columns
            prod_cols = [r[1] for r in conn.execute(text("PRAGMA table_info(products)")).fetchall()]
            if "is_active" not in prod_cols and "products" in prod_cols:
                pass
except Exception as e:
    print(f"[DB Auto-Migration] Notice: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate config and launch background tasks
    if settings.SECRET_KEY == "your-secret-key-change-in-production":
        import os
        if os.getenv("ENVIRONMENT", "development") == "production":
            raise RuntimeError("SECRET_KEY must be set to a secure value in production!")
        else:
            print("[WARNING] SECRET_KEY is using the default insecure value. Set SECRET_KEY in your .env file.")
    asyncio.create_task(auction_scheduler())
    yield
    # Shutdown: nothing to clean up

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for uploads)
import os
os.makedirs("storage", exist_ok=True)
app.mount("/static", StaticFiles(directory="storage"), name="static")

# Include API routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(auctions.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(farmer.router)
app.include_router(otp.router)
app.include_router(uploads.router)
app.include_router(ws_auctions.router)
app.include_router(categories.router)
app.include_router(trader.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_users.router)
app.include_router(admin_listings.router)
app.include_router(admin_revenue.router)
app.include_router(admin_auctions.router)
app.include_router(admin_analysis.router)
app.include_router(admin_settings.router)
app.include_router(farmer_orders.router)
app.include_router(admin_products.router)
app.include_router(admin_requests.router)
app.include_router(bids.router)
app.include_router(farmer_payments.router)
app.include_router(utils.router)
app.include_router(farmer_transactions.router)
app.include_router(support.router)
app.include_router(ai_inspection.router)
app.include_router(price_prediction.router)
app.include_router(mandi.router)
app.include_router(weather_advisory.router)
app.include_router(db_management.router)
app.include_router(notifications.router)
app.include_router(doc_verify.router)

from datetime import timezone

async def auction_scheduler():
    while True:
        await asyncio.sleep(10)
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc).replace(tzinfo=None)

            # Scheduled -> Live
            scheduled_auctions = db.query(Auction).filter(
                Auction.status == "scheduled",
                Auction.start_time <= now
            ).all()
            for auction in scheduled_auctions:
                auction.status = "live"

            # Live -> Ended / Completed
            live_auctions = db.query(Auction).filter(
                Auction.status == "live",
                Auction.end_time <= now
            ).all()
            for auction in live_auctions:
                has_reserve = auction.reserve_price is not None and auction.reserve_price > 0
                highest_bid = auction.current_highest_bid or 0.0

                if has_reserve and highest_bid < auction.reserve_price:
                    auction.status = "reserve_not_met"
                    if auction.farmer_id:
                        db.add(Notification(
                            user_id=auction.farmer_id,
                            type="auction_reserve_not_met",
                            message=f"Auction for '{auction.product.name if auction.product else 'Crop'}' ended at ₹{highest_bid}, which did not meet your reserve price of ₹{auction.reserve_price}."
                        ))
                else:
                    auction.status = "ended"

                    winning_bid = db.query(Bid).filter(
                        Bid.auction_id == auction.id,
                        Bid.bid_amount == auction.current_highest_bid
                    ).order_by(Bid.bid_time.desc()).first()

                    if winning_bid:
                        winning_bid.is_winning = True

                    if auction.current_highest_bidder_id:
                        existing_order = db.query(Order).filter(
                            Order.auction_id == auction.id
                        ).first()
                        if not existing_order:
                            # Skip order creation if the product has been deleted
                            if not auction.product:
                                print(f"[Scheduler] Skipping order for auction {auction.id}: product is None")
                                continue
                            order = Order(
                                product_id=auction.product_id,
                                auction_id=auction.id,
                                trader_id=auction.current_highest_bidder_id,
                                quantity=auction.product.quantity,
                                total_price=auction.current_highest_bid,
                                status="pending",
                                payment_status="pending"
                            )
                            db.add(order)

                            if auction.product:
                                auction.product.status = "sold"

                            # Send Winner Notification to Trader
                            db.add(Notification(
                                user_id=auction.current_highest_bidder_id,
                                type="auction_won",
                                message=f"Congratulations! You won the auction for '{auction.product.name if auction.product else 'Crop'}' with a winning bid of ₹{auction.current_highest_bid}."
                            ))

                            # Send Completion Notification to Farmer
                            if auction.farmer_id:
                                db.add(Notification(
                                    user_id=auction.farmer_id,
                                    type="auction_sold",
                                    message=f"Your crop '{auction.product.name if auction.product else 'Crop'}' has been sold in auction for ₹{auction.current_highest_bid}."
                                ))

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Scheduler error: {e}")
        finally:
            db.close()


@app.get("/")
def root():
    return {"message": "AgriMart API is running"}