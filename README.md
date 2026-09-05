# 🌾 KisanMitra — Smart Agricultural Marketplace & Trading Ecosystem

An end-to-end, full-stack digital agricultural marketplace built with **Next.js 16** (Frontend) and **FastAPI** (Backend). KisanMitra empowers farmers with real-time bidding/auctions, dynamic Mandi price intelligence, AI-assisted produce quality grading, verified trader escrow payments, and multilingual support in 8 Indian languages.

---

## 🌟 Key Features

- 👨‍🌾 **Farmer Dashboard**: Direct crop listings, auction management, live bidding monitoring, automated reserve pricing, and digital wallet earnings.
- 🏪 **Trader Marketplace**: Browse fresh farm listings, place competitive real-time auction bids, instant purchase options, and secured escrow checkout with Razorpay.
- 🛡️ **Escrow Payments & Security**: Buyer funds are securely held in KisanMitra Escrow and released only upon delivery verification with auto-generated PDF tax invoices.
- 🏛️ **e-NAM & Mandi Integration**: Live Agmarknet/e-NAM Mandi benchmark rates and commodity arrivals across 1,000+ APMCs in India.
- 🤖 **AI-Powered Quality Grading**: Automated produce inspection and quality grading based on moisture, texture, defect analysis, and market benchmarks.
- 🌦️ **Agronomic Weather & Advisories**: Hyperlocal weather forecasts, soil condition alerts, and dynamic crop disease prevention tips.
- 🌐 **Full 8-Language Multilingual Engine**: Seamless instant switching across English, Hindi, Marathi, Tamil, Gujarati, Telugu, Kannada, and Bengali.
- 👑 **Comprehensive Admin Command Center**: User verification, trader license validation, listing moderations, dispute handling, revenue tracking, and automated database backups.

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (Pages Router)
- **Styling**: Modern Vanilla CSS Design System (Glassmorphism, Dark/Light palettes, responsive layouts)
- **Icons**: React Icons (`hi`, `hi2`, `fi`, `tb`, `io5`, `bi`)
- **Charting**: Chart.js & React-Chartjs-2
- **State & i18n**: React Context (`LanguageContext`, `AuthContext`)
- **Payments**: Razorpay Standard & Custom Checkout Integration

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: SQLite (Development) / PostgreSQL-ready (SQLAlchemy ORM)
- **Real-time Engine**: WebSockets (`ws_auctions`) for live tick-by-tick bidding
- **Security**: JWT (OAuth2 Password Bearer), Passlib (Bcrypt / PBKDF2), CORS protection
- **Task Scheduling**: Asynchronous background workers for automatic auction closure and notifications

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# or source venv/bin/activate (macOS/Linux)

# Install Python dependencies
pip install -r requirements.txt

# Create/Verify default Administrator
python create_admin.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API docs will be available at: `http://localhost:8000/docs`

---

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend web application will be live at: `http://localhost:3000`

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@kisanmitra.com` | `Admin@1234` |
| **Farmer (Demo)** | `farmer@kisanmitra.com` | `Farmer@1234` |
| **Trader (Demo)** | `trader@kisanmitra.com` | `Trader@1234` |

---

## 🧪 Running Automated Tests
```bash
cd backend
.\venv\Scripts\python.exe test_all_functions.py
```

---

## 📄 License
This project is licensed under the MIT License.
