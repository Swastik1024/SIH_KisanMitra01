from fastapi import APIRouter, Query
from typing import Dict, Any
from datetime import datetime, timedelta, timezone
import random
import hashlib

router = APIRouter(prefix="/api/weather", tags=["weather-advisory"])

@router.get("/advisory")
def get_weather_advisory(
    pincode: str = Query("411001"),
    location: str = Query("Pune, Maharashtra")
):
    seed_str = f"weather-{pincode}-{location}"
    seed_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed_val)
    
    temp_c = rng.randint(22, 34)
    humidity = rng.randint(45, 82)
    wind_kmh = rng.randint(8, 22)
    rain_chance = rng.choice([5, 12, 28, 65, 80])
    
    condition = "Partly Cloudy"
    icon = "sun-cloud"
    if rain_chance > 60:
        condition = "Light Rain Expected"
        icon = "cloud-rain"
    elif temp_c > 32:
        condition = "Sunny & Warm"
        icon = "sun"

    # Generate 5-day forecast
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    forecast = []
    for i in range(5):
        day_date = now + timedelta(days=i)
        forecast.append({
            "day": day_date.strftime("%a"),
            "date": day_date.strftime("%b %d"),
            "temp_high": temp_c + rng.randint(-2, 3),
            "temp_low": temp_c - rng.randint(8, 12),
            "rain_prob": max(5, rain_chance + rng.randint(-15, 15)),
            "condition": condition
        })
        
    # Generate Agronomic Advisories based on conditions
    advisories = []
    if rain_chance > 50:
        advisories.append({
            "type": "warning",
            "title": "Postpone Pesticide Spraying",
            "message": f"High probability of rain ({rain_chance}%). Delay chemical application to prevent runoff loss."
        })
        advisories.append({
            "type": "info",
            "title": "Drainage Check Required",
            "message": "Ensure field channels are clear to prevent waterlogging around root zones."
        })
    else:
        advisories.append({
            "type": "success",
            "title": "Favorable Spraying Conditions",
            "message": f"Low rain risk ({rain_chance}%) and moderate wind ({wind_kmh} km/h). Ideal for crop protection application."
        })
        advisories.append({
            "type": "info",
            "title": "Scheduled Irrigation",
            "message": "Soil moisture levels moderate. Recommended evening irrigation for standing crops."
        })

    advisories.append({
        "type": "success",
        "title": "Harvesting & Storage Advisory",
        "message": "Store harvested grains in dry, covered storage with relative humidity below 65%."
    })

    return {
        "location": location,
        "pincode": pincode,
        "current": {
            "temperature_c": temp_c,
            "humidity_percent": humidity,
            "wind_speed_kmh": wind_kmh,
            "rain_probability": rain_chance,
            "condition": condition,
            "icon": icon,
            "soil_moisture_estimate": f"{rng.randint(30, 55)}% (Adequate)"
        },
        "forecast": forecast,
        "agronomic_advisories": advisories
    }
