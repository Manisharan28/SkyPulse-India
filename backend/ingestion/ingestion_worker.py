import json
import os
import threading
import time
import asyncio
from datetime import datetime, UTC
from database.mongo import get_collection
import config
from pymongo.errors import DuplicateKeyError

from ml.intent_classifier import classify_tweet
from ml.location_ner import extract_location
from ml.geocoder import geocode

from verification.weather_api import verify_with_weather_api
from verification.credibility import calculate_credibility

def process_and_insert(tweet):
    """
    Phase 2 & 3: Pipes the tweet through the ML intent classifier and NER location extractor.
    Discards noise tweets. Geocodes missing locations.
    Calculates credibility using ML confidence and Open-Meteo API.
    """
    text = tweet.get("text", "")
    event_type = tweet.get("event_type", "Unknown")
    
    # 1. Intent Classification
    intent = classify_tweet(text)
    
    if not intent["is_incident"]:
        print(f"[DISCARD] Tweet {tweet.get('id')} classified as Noise ({intent['confidence']:.2f})")
        return
        
    print(f"[NLP] Tweet {tweet.get('id')}: label=Incident, confidence={intent['confidence']:.2f}")

    # 2. Location Extraction & Geocoding
    location = None
    loc_source = None
    
    if tweet.get("coordinates"):
        # Original GPS coordinates
        lat, lng = tweet["coordinates"]
        location = {
            "type": "Point",
            "coordinates": [lng, lat]
        }
        loc_source = "gps"
    else:
        # NER fallback
        extracted_city = extract_location(text)
        if extracted_city:
            coords = geocode(extracted_city)
            if coords:
                lat, lng = coords
                location = {
                    "type": "Point",
                    "coordinates": [lng, lat]
                }
                loc_source = "ner"
                print(f"[NER] Extracted location: '{extracted_city}' -> [{lat}, {lng}]")

    # If we couldn't geolocate it, we still store it, but it won't appear on the map
    if not location:
        print(f"[NER] Failed to extract location from tweet {tweet.get('id')}")
        
    # 3. Ground-Truth Verification (Phase 3)
    weather_score = 0.5
    if location:
        lat = location["coordinates"][1]
        lng = location["coordinates"][0]
        weather_score = verify_with_weather_api(lat, lng, event_type)
        
    initial_score, initial_status = calculate_credibility(
        ml_confidence=intent["confidence"], 
        weather_score=weather_score, 
        is_clustered=False
    )
        
    collection = get_collection()
    
    doc = {
        "tweet_id": str(tweet.get("id", "")),
        "text": text,
        "username": tweet.get("username", ""),
        "followers": tweet.get("followers", 0),
        "has_media": tweet.get("has_media", False),
        "media_urls": tweet.get("media_urls", []),
        "tweet_url": f"https://x.com/{tweet.get('username', 'i')}/status/{tweet.get('id', '')}" if tweet.get("id") else None,
        "event_type": event_type,
        "timestamp": datetime.fromisoformat(tweet.get("timestamp", "").replace("Z", "+00:00")),
        "location": location,
        "location_source": loc_source,
        "credibility_score": initial_score,
        "status": initial_status,
        "weather_score": weather_score,
        "cluster_id": None,
        "source": tweet.get("source", "mock"),
        "ml_confidence": intent["confidence"],
        "created_at": datetime.now(UTC)
    }
    
    try:
        collection.insert_one(doc)
        print(f"[INGEST] Incident {doc['tweet_id']} from @{doc['username']} inserted (Score: {initial_score}, Status: {initial_status}).")
    except DuplicateKeyError:
        print(f"[SKIP] Duplicate tweet {doc['tweet_id']}, skipping.")

def mock_ingestion_loop():
    interval = config.INGEST_INTERVAL
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", "mock_tweets.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            tweets = json.load(f)
    except Exception as e:
        print(f"[MOCK] Failed to load mock tweets: {e}")
        return

    if not tweets:
        print("[MOCK] No mock tweets found.")
        return

    print(f"[MOCK] Starting simulated ingestion stream ({interval}s interval)...")
    
    index = 0
    while True:
        tweet = tweets[index]
        process_and_insert(tweet)
        
        index = (index + 1) % len(tweets)
        time.sleep(interval)

def live_ingestion_sync():
    """Runs the asyncio event loop for the live scraper in a background thread."""
    from ingestion.live_scraper import init_scraper, fetch_live_tweets, record_tweets
    
    async def _live_loop():
        ready, api = await init_scraper()
        if not ready:
            print("[LIVE] Scraper initialization failed. Falling back to MOCK mode.")
            return False
            
        record_filepath = os.path.join(os.path.dirname(__file__), "..", "data", "recorded_tweets.json")
        os.makedirs(os.path.dirname(record_filepath), exist_ok=True)
        
        print(f"[LIVE] Starting live ingestion stream (fetching every {config.LIVE_FETCH_INTERVAL}s)...")
        while True:
            try:
                tweets = await fetch_live_tweets(api, batch_size=config.LIVE_BATCH_SIZE)
                if tweets:
                    await record_tweets(tweets, record_filepath)
                    
                    # Drip-feed the fetched tweets to simulate a stream
                    for tweet in tweets:
                        process_and_insert(tweet)
                        await asyncio.sleep(config.INGEST_INTERVAL)
                        
                # Sleep until next batch
                print(f"[LIVE] Sleeping for {config.LIVE_FETCH_INTERVAL} seconds...")
                await asyncio.sleep(config.LIVE_FETCH_INTERVAL)
            except Exception as e:
                print(f"[LIVE] Error during fetch loop: {e}. Falling back to MOCK mode.")
                return False

    try:
        success = asyncio.run(_live_loop())
        if not success:
            mock_ingestion_loop()
    except Exception as e:
        print(f"[LIVE] Unhandled exception: {e}. Falling back to MOCK mode.")
        mock_ingestion_loop()

def start_ingestion(app):
    mode = config.INGESTION_MODE.upper()
    print(f"[APP] Ingestion mode set to: {mode}")
    
    if mode == "LIVE":
        thread = threading.Thread(target=live_ingestion_sync, daemon=True)
    else:
        thread = threading.Thread(target=mock_ingestion_loop, daemon=True)
        
    thread.start()
    return thread
