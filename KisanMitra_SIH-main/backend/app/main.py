import asyncio
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, SessionLocal
from .config import settings
from .api import auth, products, auctions, orders, payments, agent, uploads, ws_auctions, admin_dashboard, admin_users, admin_listings, admin_revenue, admin_auctions, admin_products
from .models.auction import Auction, Bid
from .models.order import Order
from .api import otp
from .api import farmer
from .api import categories
from .api import trader
from .models.settings import PlatformSetting
from .api import admin_analysis, admin_settings
from .api import farmer_orders
from .api import agent_dashboard
from .api import admin_requests
from .api import bids
from .api import farmer_payments
from .api import utils
from .api import farmer_transactions
from .api import support

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for uploads)
app.mount("/static", StaticFiles(directory="storage"), name="static")

# Include API routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(auctions.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(agent.router)
app.include_router(farmer.router)
app.include_router(otp.router)
app.include_router(uploads.router)
app.include_router(ws_auctions.router)
app.include_router(categories.router)
app.include_router(trader.router)
app.include_router(admin_dashboard.router)   # <-- ensure this is here
app.include_router(admin_users.router)
app.include_router(admin_listings.router)
app.include_router(admin_revenue.router)
app.include_router(admin_auctions.router)
app.include_router(admin_analysis.router)
app.include_router(admin_settings.router)
app.include_router(farmer_orders.router)
app.include_router(admin_products.router)
app.include_router(agent_dashboard.router)
app.include_router(admin_requests.router)
app.include_router(bids.router)
app.include_router(farmer_payments.router)
app.include_router(utils.router)
app.include_router(farmer_transactions.router)
app.include_router(support.router)

from datetime import timezone

async def auction_scheduler():
    while True:
        await asyncio.sleep(10)
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc).replace(tzinfo=None)

            scheduled_auctions = db.query(Auction).filter(
                Auction.status == "scheduled",
                Auction.start_time <= now
            ).all()
            for auction in scheduled_auctions:
                auction.status = "live"

            live_auctions = db.query(Auction).filter(
                Auction.status == "live",
                Auction.end_time <= now
            ).all()
            for auction in live_auctions:
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
                        order = Order(
                            product_id=auction.product_id,
                            auction_id=auction.id,
                            trader_id=auction.current_highest_bidder_id,
                            agent_id=auction.agent_id,
                            quantity=auction.product.quantity,
                            total_price=auction.current_highest_bid,
                            status="pending",
                            payment_status="pending"
                        )
                        db.add(order)
                        auction.product.status = "sold"

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Scheduler error: {e}")
        finally:
            db.close()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(auction_scheduler())

@app.get("/")
def root():
    return {"message": "AgriMart API is running"}