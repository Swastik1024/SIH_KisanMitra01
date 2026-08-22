import requests
from math import radians, sin, cos, sqrt, atan2

def haversine(lat1, lon1, lat2, lon2):
    """Straight-line distance in km."""
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def road_distance(lat1, lon1, lat2, lon2):
    """
    Road network distance in km using OSRM public API.
    Falls back to Haversine if OSRM fails.
    """
    try:
        url = "https://router.project-osrm.org/route/v1/driving/{},{};{},{}".format(
            lon1, lat1, lon2, lat2
        )
        params = {"overview": "false"}
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data.get("routes"):
                distance_meters = data["routes"][0]["distance"]
                return round(distance_meters / 1000, 2)  # km
    except Exception:
        pass

    # Fallback to straight-line distance
    return round(haversine(lat1, lon1, lat2, lon2), 2)