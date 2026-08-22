import requests

def geocode(address: str):
    """
    Convert an address string to (latitude, longitude) using OpenStreetMap Nominatim.
    Returns None if the geocoding fails.
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
    }
    headers = {
        "User-Agent": "KisanMitra/1.0 (student project; contact: you@example.com)"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass

    return None