import requests

def test_nominatim(location_name):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location_name,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "SIH-Weather-Analytics-App/1.0"
    }
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                return [lat, lon]
    except Exception as e:
        print(e)
    return None

print("Maldives:", test_nominatim("Maldives"))
print("Chaulani River:", test_nominatim("Chaulani River"))
print("Gyirong Port:", test_nominatim("Gyirong Port"))
