import requests
import time

_weather_cache = {}
CACHE_TTL = 3600  # 1 hour in seconds

def verify_with_weather_api(lat, lng, event_type):
    """
    Calls Open-Meteo API to get current weather and checks if it supports the event_type.
    Returns a score between 0.0 and 1.0.
    """
    if lat is None or lng is None:
        return 0.5  # Neutral score if no location
        
    cache_key = f"{round(lat,2)}_{round(lng,2)}_{event_type.lower()}"
    current_time = time.time()
    
    if cache_key in _weather_cache:
        cached_score, timestamp = _weather_cache[cache_key]
        if current_time - timestamp < CACHE_TTL:
            print(f"[WEATHER] Cache hit for [{round(lat,2)}, {round(lng,2)}] ({event_type})")
            return cached_score
            
    try:
        # Fetch current weather
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true"
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            print(f"[WEATHER] Failed to fetch data: {response.status_code}")
            return 0.5
            
        data = response.json()
        current = data.get("current_weather", {})
        
        # Simple heuristic mapping based on event type
        event = event_type.lower()
        score = 0.5  # default
        
        if "rain" in event or "flood" in event:
            # Open-Meteo WMO Weather interpretation codes
            # > 50 implies drizzle, rain, snow, showers, thunderstorms
            code = current.get("weathercode", 0)
            if code >= 50:
                score = 0.95
            elif code >= 20:
                score = 0.70
            else:
                score = 0.20 # Unlikely to be flooding if it's clear
                
        elif "heat" in event:
            temp = current.get("temperature", 0)
            if temp > 38:
                score = 0.95
            elif temp > 32:
                score = 0.75
            else:
                score = 0.30
                
        elif "wind" in event or "cyclone" in event:
            wind = current.get("windspeed", 0)
            # Windspeed in km/h
            if wind > 50:
                score = 0.95
            elif wind > 30:
                score = 0.70
            else:
                score = 0.40
                
        _weather_cache[cache_key] = (score, current_time)
        return score
    except Exception as e:
        print(f"[WEATHER] API Error: {e}")
        return 0.5
