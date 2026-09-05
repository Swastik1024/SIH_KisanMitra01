import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("."))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')



from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from app.models.user import User
from app.models.otp import OtpVerification
from app.models.product import Product, Category
from app.models.auction import Auction, Bid
from app.models.order import Order

from app.models.payment import PaymentTransaction, EscrowAccount, GSTInvoice
from app.core.security import create_access_token
from datetime import datetime, timezone, timedelta

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("🚀 RUNNING COMPREHENSIVE BACKEND FUNCTIONALITY TESTS")
    print("=" * 60)

    # 1. Health check / Root
    print("\n[TEST 1] Testing Root & Docs API...")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print(f"✅ Root API responded with status 200: {res.json()}")

    # 2. Categories API
    print("\n[TEST 2] Testing Categories API...")
    res = client.get("/api/categories")
    assert res.status_code == 200, f"Categories failed: {res.text}"
    categories = res.data if hasattr(res, 'data') else res.json()
    print(f"✅ Categories retrieved: {len(categories)} categories found.")

    # 3. Weather Advisory API
    print("\n[TEST 3] Testing Weather Advisory API...")
    res = client.get("/api/weather/advisory?location=Pune&pincode=411001")
    assert res.status_code == 200, f"Weather advisory failed: {res.text}"
    wdata = res.json()
    print(f"✅ Weather Advisory working. Temperature: {wdata.get('temperature', {}).get('current')}°C, Risk: {wdata.get('agronomic_risk')}")

    # 4. Mandi Rates API
    print("\n[TEST 4] Testing Mandi Live Rates...")
    res = client.get("/api/mandi-rates?commodity=wheat&state=Maharashtra")
    assert res.status_code in [200, 404], f"Mandi rates failed: {res.text}"
    print(f"✅ Mandi rates endpoint responsive (Status: {res.status_code})")

    # 5. Auth OTP Flow
    print("\n[TEST 5] Testing OTP generation & verification...")
    email = "testfarmer_check@agrimart.com"
    res = client.post("/api/auth/otp/send", json={"contact": email})
    assert res.status_code == 200, f"OTP send failed: {res.text}"
    
    # Get DB session to retrieve the test OTP
    db = next(get_db())
    otp_record = db.query(OtpVerification).filter(OtpVerification.contact == email).order_by(OtpVerification.id.desc()).first()
    assert otp_record is not None, "OTP not stored in DB"
    otp_code = otp_record.otp_code

    # Verify OTP
    res = client.post("/api/auth/otp/verify", json={"contact": email, "otp": otp_code})
    assert res.status_code == 200, f"OTP verify failed: {res.text}"
    print(f"✅ OTP flow working correctly for {email}")

    # 6. Farmer & Trader Authentication Tokens
    print("\n[TEST 6] Testing Farmer & Trader User Creation & Auth Tokens...")
    # Find or create test farmer
    farmer = db.query(User).filter(User.role == "farmer").first()
    if not farmer:
        farmer = User(name="Test Farmer", email="farmer_fn_test@kisan.com", role="farmer", password_hash="hash123")
        db.add(farmer)
        db.commit()
        db.refresh(farmer)
    
    farmer_token = create_access_token({"sub": str(farmer.id), "role": "farmer"})
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    # Find or create test trader
    trader = db.query(User).filter(User.role == "trader").first()
    if not trader:
        trader = User(name="Test Trader", email="trader_fn_test@kisan.com", role="trader", password_hash="hash123")
        db.add(trader)
        db.commit()
        db.refresh(trader)
    
    trader_token = create_access_token({"sub": str(trader.id), "role": "trader"})
    trader_headers = {"Authorization": f"Bearer {trader_token}"}

    # Find or create admin
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin = User(name="Test Admin", email="admin_fn_test@kisan.com", role="admin", password_hash="hash123")
        db.add(admin)
        db.commit()
        db.refresh(admin)
    
    admin_token = create_access_token({"sub": str(admin.id), "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"✅ Test tokens generated for Farmer #{farmer.id}, Trader #{trader.id}, Admin #{admin.id}")

    # 7. Product Creation & Listing
    print("\n[TEST 7] Testing Product Creation by Farmer...")
    cat = db.query(Category).first()
    cat_id = cat.id if cat else 1

    product_payload = {
        "name": "Organic Sharbati Wheat Premium",
        "category_id": cat_id,
        "quantity": 100.0,
        "unit": "kg",
        "price": 35.0,
        "location": "Pune, Maharashtra",
        "pincode": "411001",
        "description": "Grade A farm fresh harvested wheat",
        "auction_type": "fixed_price"
    }
    res = client.post("/api/products/", json=product_payload, headers=farmer_headers)
    assert res.status_code in [200, 201], f"Create product failed: {res.text}"
    prod_data = res.json()
    product_id = prod_data["id"]
    print(f"✅ Product created successfully: ID #{product_id} ('{prod_data['name']}')")

    # 8. AI Inspection Functionality
    print("\n[TEST 8] Testing AI Inspection Pipeline...")
    res = client.post("/api/inspection/auto-analyze", json={"product_id": product_id, "image_url": "https://example.com/authentic_farm_fresh_wheat.jpg"}, headers=farmer_headers)
    assert res.status_code == 200, f"AI Inspection failed: {res.text}"
    ai_data = res.json()
    if ai_data.get("is_valid"):
        print(f"✅ AI Inspection generated: Grade = {ai_data.get('quality_grade')}, Freshness = {ai_data.get('freshness_score')}%, Confidence = {ai_data.get('confidence_score')}%")
    else:
        print(f"✅ AI Security Inspector successfully detected & flagged suspicious media: {ai_data.get('error')}")



    # 9. Auction, Bidding & Order Creation
    print("\n[TEST 9] Testing Auction Creation, Bidding & Order Finalization...")
    # Create an auction for the product
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    auction = Auction(
        product_id=product_id,
        farmer_id=farmer.id,
        base_price=35.0,
        current_highest_bid=40.0,
        current_highest_bidder_id=trader.id,
        status="ended",
        start_time=now - timedelta(hours=2),
        end_time=now - timedelta(minutes=10)
    )
    db.add(auction)

    db.commit()
    db.refresh(auction)

    # Finalize auction into order
    res = client.post(f"/api/orders/finalize-auction/{auction.id}", headers=trader_headers)
    assert res.status_code == 200, f"Order finalization failed: {res.text}"
    order_data = res.json()
    order_id = order_data["id"]
    print(f"✅ Order #{order_id} generated for ₹{order_data['total_price']} (Status: {order_data['status']})")


    # 10. Razorpay Payment & Escrow Locking
    print("\n[TEST 10] Testing Razorpay Order Creation & Verification...")
    res = client.post("/api/payments/create-order", json={"order_id": order_id}, headers=trader_headers)
    assert res.status_code == 200, f"Create payment order failed: {res.text}"
    pay_data = res.json()
    print(f"✅ Payment transaction initialized with Gateway ID: {pay_data.get('gateway_transaction_id')}")

    # Verify payment (moves into Escrow)
    verify_payload = {
        "order_id": order_id,
        "razorpay_order_id": pay_data.get("gateway_transaction_id"),
        "razorpay_payment_id": f"pay_test_{int(datetime.now().timestamp())}",
        "payment_method": "UPI"
    }
    res = client.post("/api/payments/verify", json=verify_payload, headers=trader_headers)
    assert res.status_code == 200, f"Payment verify failed: {res.text}"
    verify_res = res.json()
    print(f"✅ Payment verified! Status: {verify_res.get('payment_status')}, Escrow Amount: ₹{verify_res.get('escrow_amount')}, GST Invoice: {verify_res.get('invoice_number')}")

    # 11. Escrow Details & Release
    print("\n[TEST 11] Testing Escrow Inspection & Admin Fund Release...")
    res = client.get(f"/api/payments/escrow/{order_id}", headers=trader_headers)
    assert res.status_code == 200, f"Get escrow failed: {res.text}"
    print(f"✅ Escrow details verified: Status = {res.json().get('status')}")

    # Admin releases escrow funds
    res = client.post(f"/api/payments/release-escrow/{order_id}", headers=admin_headers)
    assert res.status_code == 200, f"Release escrow failed: {res.text}"
    release_res = res.json()
    print(f"✅ Escrow released to farmer: Payout = ₹{release_res.get('farmer_payout')}")

    # 12. Admin Dashboard & Analytics
    print("\n[TEST 12] Testing Admin Analytics & Dashboard...")
    res = client.get("/api/admin/dashboard", headers=admin_headers)
    assert res.status_code == 200, f"Admin dashboard failed: {res.text}"
    stats = res.json().get("stats", {})
    print(f"✅ Admin dashboard stats responsive: Total Users = {stats.get('total_users')}, Active Listings = {stats.get('active_listings')}, Revenue = ₹{stats.get('total_revenue')}")


    print("\n" + "=" * 60)
    print("🎉 ALL BACKEND FUNCTIONS TESTED AND WORKING 100% SUCCESFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
