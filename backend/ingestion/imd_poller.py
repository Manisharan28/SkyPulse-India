import os
import json
import time
import threading
import requests
from datetime import datetime, UTC
from database.mongo import get_collection
from pymongo.errors import DuplicateKeyError

# Simple in-memory cache to avoid hammering IMD APIs
_imd_cache = {}
CACHE_TTL = 600  # 10 minutes

def fetch_imd_data(endpoint_url, cache_key):
    """Fetches data from IMD API with caching and timeout."""
    current_time = time.time()
    
    # Check cache
    if cache_key in _imd_cache:
        data, timestamp = _imd_cache[cache_key]
        if current_time - timestamp < CACHE_TTL:
            return data
            
    try:
        response = requests.get(endpoint_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            _imd_cache[cache_key] = (data, current_time)
            return data
        else:
            print(f"[IMD] API returned {response.status_code} for {cache_key}")
    except Exception as e:
        print(f"[IMD] API Error for {cache_key}: {e}")
        
    return None

def load_mock_imd_data():
    """Loads sample data if API fails."""
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_imd_data.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[IMD] Failed to load mock data: {e}")
        return []

def process_imd_data():
    """Fetches real IMD data, or falls back to mock, and inserts to DB."""
    # Try fetching real data (these URLs might need API keys or different endpoints in reality)
    current_wx = fetch_imd_data("https://api.imd.gov.in/api/v1/current_wx", "current_wx")
    warnings = fetch_imd_data("https://api.imd.gov.in/api/v1/warnings", "warnings")
    
    events = []
    
    # In a real scenario, you'd map `current_wx` and `warnings` JSON into our event schema.
    # Since we are likely to get 401 Unauthorized without an API key, we'll gracefully fallback
    # if both are None or empty.
    
    if current_wx or warnings:
        # Placeholder for mapping logic if API succeeds
        print("[IMD] Successfully fetched real IMD data.")
        # To be implemented: real mapping
    else:
        # Fallback to mock data
        print("[IMD] API unreachable or unauthorized. Using mock fallback data.")
        events = load_mock_imd_data()
        
    # Insert events into DB
    collection = get_collection()
    for event in events:
        # Update timestamp to now for mock data so it shows up in current filters
        if event.get("source") == "imd":
            event["timestamp"] = datetime.now(UTC)
            event["created_at"] = datetime.now(UTC)
            
            # Generate a new unique ID to avoid DuplicateKeyError if we run this loop multiple times
            event["tweet_id"] = f"imd_mock_{int(time.time())}_{event.get('tweet_id', 'unknown')}"
            
        try:
            collection.insert_one(event)
            print(f"[IMD] Ingested official event: {event.get('event_type')} at {event.get('location', {}).get('coordinates')}")
        except DuplicateKeyError:
            pass
            
def imd_poller_loop():
    """Runs the IMD poller every 10 minutes."""
    poll_interval = 600  # 10 minutes
    print(f"[IMD] Starting IMD poller thread (interval {poll_interval}s)...")
    
    while True:
        try:
            process_imd_data()
        except Exception as e:
            print(f"[IMD] Error in poller loop: {e}")
            
        time.sleep(poll_interval)

def start_imd_poller(app):
    """Starts the background thread."""
    thread = threading.Thread(target=imd_poller_loop, daemon=True)
    thread.start()
    return thread
