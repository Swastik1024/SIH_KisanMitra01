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
        "User-Agent": "KhetiKart/1.0 (agri platform; contact: support@khetikart.com)"
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