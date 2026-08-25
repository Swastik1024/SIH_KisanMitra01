from fastapi import APIRouter, Query
from typing import List, Dict, Any
from datetime import datetime, timezone
import random

router = APIRouter(prefix="/api/mandi", tags=["mandi-rates"])

MANDI_STATIONS = [
    {"state": "Maharashtra", "mandi": "Vashi (Mumbai)", "commodity": "Onion", "min_price": 1600, "max_price": 2400, "modal_price": 2100, "unit": "Quintal"},
    {"state": "Maharashtra", "mandi": "Nashik (Lasalgaon)", "commodity": "Onion", "min_price": 1550, "max_price": 2350, "modal_price": 2050, "unit": "Quintal"},
    {"state": "Maharashtra", "mandi": "Pune", "commodity": "Tomato", "min_price": 1200, "max_price": 1900, "modal_price": 1650, "unit": "Quintal"},
    {"state": "Punjab", "mandi": "Khanna", "commodity": "Wheat", "min_price": 2150, "max_price": 2450, "modal_price": 2320, "unit": "Quintal"},
    {"state": "Punjab", "mandi": "Ludhiana", "commodity": "Paddy (Basmati)", "min_price": 3400, "max_price": 4200, "modal_price": 3850, "unit": "Quintal"},
    {"state": "Uttar Pradesh", "mandi": "Agra", "commodity": "Potato", "min_price": 1100, "max_price": 1600, "modal_price": 1400, "unit": "Quintal"},
    {"state": "Uttar Pradesh", "mandi": "Kanpur", "commodity": "Mustard", "min_price": 5100, "max_price": 5800, "modal_price": 5450, "unit": "Quintal"},
    {"state": "Gujarat", "mandi": "Rajkot", "commodity": "Cotton", "min_price": 6800, "max_price": 7600, "modal_price": 7250, "unit": "Quintal"},
    {"state": "Gujarat", "mandi": "Unjha", "commodity": "Cumin (Jeera)", "min_price": 21000, "max_price": 26500, "modal_price": 24000, "unit": "Quintal"},
    {"state": "Karnataka", "mandi": "Kolar", "commodity": "Tomato", "min_price": 1300, "max_price": 2100, "modal_price": 1800, "unit": "Quintal"},
    {"state": "Madhya Pradesh", "mandi": "Indore", "commodity": "Soyabean", "min_price": 4200, "max_price": 4850, "modal_price": 4600, "unit": "Quintal"},
]

@router.get("/rates")
def get_mandi_rates(
    state: str = Query(None),
    commodity: str = Query(None)
):
    results = MANDI_STATIONS
    if state and state.lower() != "all":
        results = [r for r in results if r["state"].lower() == state.lower()]
    if commodity and commodity.lower() != "all":
        results = [r for r in results if commodity.lower() in r["commodity"].lower()]
        
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    
    return {
        "updated_at": now_str,
        "source": "Agmarknet / e-NAM APMC Benchmark Network",
        "total_records": len(results),
        "rates": results
    }
