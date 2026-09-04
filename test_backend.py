import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
"""
Comprehensive Backend Test Suite for SIH Weather Analytics Platform
Tests Phases 1-4: Ingestion, ML Pipeline, Verification, and REST API
"""
import sys
import os
import json
import time
import requests
from datetime import datetime, UTC

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

RESULTS = []
PASS = 0
FAIL = 0

def test(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        RESULTS.append(("PASS", name, detail))
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        RESULTS.append(("FAIL", name, detail))
        print(f"  [FAIL] {name} -- {detail}")

def divider(section):
    print(f"\n{'='*60}")
    print(f"  {section}")
    print(f"{'='*60}")

# ============================================================
#  PHASE 1: Config, Database, Mock Data
# ============================================================
divider("PHASE 1: Config, Database & Mock Data")

# Test 1.1: Config loads
try:
    import config
    test("config.py loads without error", True)
except Exception as e:
    test("config.py loads without error", False, str(e))

# Test 1.2: Required config values exist
test("MONGO_URI is set", bool(config.MONGO_URI) and "<username>" not in config.MONGO_URI)
test("DB_NAME is set", config.DB_NAME == "sih_weather")
test("COLLECTION_NAME is set", config.COLLECTION_NAME == "alerts")
test("FLASK_PORT is set", config.FLASK_PORT == 5000)
test("CORS_ORIGINS includes Vite", "http://localhost:5173" in config.CORS_ORIGINS)
test("DISASTER_MODEL is set", bool(config.DISASTER_MODEL))
test("NER_MODEL is set", bool(config.NER_MODEL))
test("DBSCAN_EPS_KM is reasonable", 0.5 <= config.DBSCAN_EPS_KM <= 50)
test("DBSCAN_MIN_SAMPLES >= 2", config.DBSCAN_MIN_SAMPLES >= 2)

# Test 1.3: MongoDB connection
try:
    from database.mongo import init_db, get_collection
    init_db()
    collection = get_collection()
    test("MongoDB Atlas connection succeeds", collection is not None)
except Exception as e:
    test("MongoDB Atlas connection succeeds", False, str(e))

# Test 1.4: Mock data file exists and is valid
mock_path = os.path.join("backend", "data", "mock_tweets.json")
try:
    with open(mock_path, "r", encoding="utf-8") as f:
        mock_tweets = json.load(f)
    test("mock_tweets.json exists", True)
    test("mock_tweets.json has 50 entries", len(mock_tweets) == 50, f"Found {len(mock_tweets)}")
    
    # Validate schema of first tweet
    sample = mock_tweets[0]
    required_keys = ["id", "text", "timestamp", "username", "followers", "has_media", "event_type"]
    missing = [k for k in required_keys if k not in sample]
    test("Mock tweet has all required fields", len(missing) == 0, f"Missing: {missing}")
    
    # Check coordinate format
    tweets_with_coords = [t for t in mock_tweets if t.get("coordinates")]
    test("Some mock tweets have coordinates", len(tweets_with_coords) > 0, f"Found {len(tweets_with_coords)}")
    if tweets_with_coords:
        coords = tweets_with_coords[0]["coordinates"]
        test("Coordinates are [lat, lng] format (2 elements)", len(coords) == 2)
        test("Latitude is valid (-90 to 90)", -90 <= coords[0] <= 90, f"lat={coords[0]}")
        test("Longitude is valid (-180 to 180)", -180 <= coords[1] <= 180, f"lng={coords[1]}")
except Exception as e:
    test("mock_tweets.json exists and is valid", False, str(e))

# Test 1.5: MongoDB indexes
try:
    indexes = list(collection.list_indexes())
    index_names = [idx["name"] for idx in indexes]
    has_2dsphere = any("location" in str(idx.get("key", {})) for idx in indexes)
    test("2dsphere index exists on 'location'", has_2dsphere, f"Indexes: {index_names}")
    has_status = any("status" in str(idx.get("key", {})) for idx in indexes)
    test("Index on 'status' exists", has_status)
    has_timestamp = any("timestamp" in str(idx.get("key", {})) for idx in indexes)
    test("Index on 'timestamp' exists", has_timestamp)
except Exception as e:
    test("MongoDB indexes verification", False, str(e))

# ============================================================
#  PHASE 2: ML Pipeline
# ============================================================
divider("PHASE 2: ML Pipeline (Intent + NER + Geocoder)")

# Test 2.1: Intent Classifier
try:
    from ml.intent_classifier import classify_tweet
    
    # Disaster tweet
    r1 = classify_tweet("Massive flooding in Mumbai! Streets submerged, people stranded. #IMD")
    test("Intent classifier returns dict", isinstance(r1, dict))
    test("Result has 'is_incident' key", "is_incident" in r1)
    test("Result has 'confidence' key", "confidence" in r1)
    test("Disaster tweet classified as incident", r1["is_incident"] == True, f"Got: {r1}")
    
    # Noise tweet
    r2 = classify_tweet("I had a great breakfast today, feeling wonderful!")
    test("Noise tweet classified as non-incident", r2["is_incident"] == False, f"Got: {r2}")
    
    # Edge case: empty string
    r3 = classify_tweet("")
    test("Empty string doesn't crash classifier", True)
    
except Exception as e:
    test("Intent classifier loads and works", False, str(e))

# Test 2.2: Location NER
try:
    from ml.location_ner import extract_location
    
    loc1 = extract_location("Heavy rains lashing Mumbai since morning")
    test("NER extracts 'Mumbai' from text", loc1 is not None and "Mumbai" in loc1, f"Got: {loc1}")
    
    loc2 = extract_location("I had a great breakfast today")
    test("NER returns None for no-location text", loc2 is None, f"Got: {loc2}")
    
    loc3 = extract_location("Cyclone approaching Chennai coast")
    test("NER extracts 'Chennai' from text", loc3 is not None and "Chennai" in loc3, f"Got: {loc3}")
    
except Exception as e:
    test("Location NER loads and works", False, str(e))

# Test 2.3: Geocoder
try:
    from ml.geocoder import geocode
    
    g1 = geocode("Mumbai")
    test("Geocoder finds Mumbai", g1 is not None)
    test("Mumbai coords are reasonable", g1 and abs(g1[0] - 19.076) < 0.5, f"Got: {g1}")
    
    g2 = geocode("delhi")
    test("Geocoder is case-insensitive", g2 is not None)
    
    g3 = geocode("Mumbai City")
    test("Geocoder handles partial match", g3 is not None, f"Got: {g3}")
    
    g4 = geocode("Timbuktu")
    test("Geocoder returns None for unknown city", g4 is None)
    
    g5 = geocode(None)
    test("Geocoder handles None input", g5 is None)
    
    g6 = geocode("")
    test("Geocoder handles empty string", g6 is None)
    
except Exception as e:
    test("Geocoder works", False, str(e))

# ============================================================
#  PHASE 3: Verification Layer
# ============================================================
divider("PHASE 3: Verification Layer (Weather + Credibility + Clustering)")

# Test 3.1: Weather API
try:
    from verification.weather_api import verify_with_weather_api
    
    # Test with valid coordinates (Mumbai)
    w1 = verify_with_weather_api(19.076, 72.877, "Flood")
    test("Weather API returns float", isinstance(w1, float))
    test("Weather score in [0, 1] range", 0.0 <= w1 <= 1.0, f"Got: {w1}")
    
    # Test with None coordinates
    w2 = verify_with_weather_api(None, None, "Flood")
    test("Weather API handles None coords (returns 0.5)", w2 == 0.5)
    
    # Test different event types
    w3 = verify_with_weather_api(28.7, 77.1, "Heatwave")
    test("Weather API handles Heatwave event", isinstance(w3, float) and 0 <= w3 <= 1)
    
    w4 = verify_with_weather_api(13.08, 80.27, "Cyclone")
    test("Weather API handles Cyclone event", isinstance(w4, float) and 0 <= w4 <= 1)
    
    # Test unknown event type (should return default 0.5)
    w5 = verify_with_weather_api(19.076, 72.877, "Unknown")
    test("Weather API handles Unknown event (returns 0.5)", w5 == 0.5, f"Got: {w5}")
    
except Exception as e:
    test("Weather API works", False, str(e))

# Test 3.2: Credibility Scorer
try:
    from verification.credibility import calculate_credibility
    
    # High confidence + weather match + cluster
    s1, st1 = calculate_credibility(0.95, 0.95, True)
    test("High-all scenario → Verified", st1 == "Verified", f"Score={s1}, Status={st1}")
    test("High-all score > 0.75", s1 > 0.75)
    
    # Low confidence, no weather, no cluster
    s2, st2 = calculate_credibility(0.3, 0.2, False)
    test("Low-all scenario → Flagged", st2 == "Flagged", f"Score={s2}, Status={st2}")
    test("Low-all score < 0.40", s2 < 0.40)
    
    # Middle case
    s3, st3 = calculate_credibility(0.7, 0.5, False)
    test("Mid scenario → Emerging", st3 == "Emerging", f"Score={s3}, Status={st3}")
    
    # Score is always capped at 1.0
    s4, _ = calculate_credibility(1.0, 1.0, True)
    test("Max inputs produce score <= 1.0", s4 <= 1.0, f"Got: {s4}")
    
    # Score always >= 0.0
    s5, _ = calculate_credibility(0.0, 0.0, False)
    test("Min inputs produce score >= 0.0", s5 >= 0.0)
    
except Exception as e:
    test("Credibility scorer works", False, str(e))

# Test 3.3: Clustering module import
try:
    from verification.clustering import update_clusters, start_clustering
    test("Clustering module imports successfully", True)
except Exception as e:
    test("Clustering module imports", False, str(e))

# ============================================================
#  PHASE 4: REST API Endpoints
# ============================================================
divider("PHASE 4: REST API Endpoints")

# Start Flask test server
from app import create_app
app = create_app()

with app.test_client() as client:
    # Test 4.1: Health endpoint
    r = client.get("/api/health")
    test("GET /api/health returns 200", r.status_code == 200)
    data = r.get_json()
    test("Health response has 'status' key", "status" in data)
    
    # Test 4.2: Alerts endpoint
    r = client.get("/api/alerts")
    test("GET /api/alerts returns 200", r.status_code == 200)
    alerts_data = r.get_json()
    test("Alerts response is a list", isinstance(alerts_data, list))
    
    if alerts_data:
        first_alert = alerts_data[0]
        test("Alert has '_id' (serialized)", "_id" in first_alert and isinstance(first_alert["_id"], str))
        test("Alert has 'text'", "text" in first_alert)
        test("Alert has 'username'", "username" in first_alert)
        test("Alert has 'credibility_score'", "credibility_score" in first_alert)
        test("Alert has 'status'", "status" in first_alert)
        test("Alert has 'ml_confidence'", "ml_confidence" in first_alert)
        test("Alert has 'weather_score'", "weather_score" in first_alert)
        test("Alert has 'event_type'", "event_type" in first_alert)
        test("Alert has 'location'", "location" in first_alert)
        test("Alert has 'timestamp' (serialized to string)", "timestamp" in first_alert and isinstance(first_alert["timestamp"], str))
    else:
        test("Alerts list has data", False, "Empty list — DB may be empty, run app.py first")
    
    # Test 4.3: Alerts with filters
    r = client.get("/api/alerts?status=Verified")
    test("GET /api/alerts?status=Verified returns 200", r.status_code == 200)
    
    r = client.get("/api/alerts?event_type=Flood")
    test("GET /api/alerts?event_type=Flood returns 200", r.status_code == 200)
    
    # Test 4.4: Single alert by ID
    if alerts_data:
        alert_id = alerts_data[0]["_id"]
        r = client.get(f"/api/alerts/{alert_id}")
        test("GET /api/alerts/<id> returns 200", r.status_code == 200)
        single = r.get_json()
        test("Single alert has correct ID", single["_id"] == alert_id)
    
    # Invalid ID
    r = client.get("/api/alerts/000000000000000000000000")
    test("GET /api/alerts/<bad_id> returns 404", r.status_code == 404)
    
    r = client.get("/api/alerts/not-a-valid-id")
    test("GET /api/alerts/<invalid_format> returns 400", r.status_code == 400)
    
    # Test 4.5: Stats endpoint
    r = client.get("/api/stats")
    test("GET /api/stats returns 200", r.status_code == 200)
    stats = r.get_json()
    test("Stats has 'total'", "total" in stats)
    test("Stats has 'verified'", "verified" in stats)
    test("Stats has 'emerging'", "emerging" in stats)
    test("Stats has 'flagged'", "flagged" in stats)
    test("Stats has 'by_event_type'", "by_event_type" in stats)
    test("Stats 'total' is int", isinstance(stats.get("total"), int))
    
    # Test 4.6: Clusters endpoint
    r = client.get("/api/clusters")
    test("GET /api/clusters returns 200", r.status_code == 200)
    clusters = r.get_json()
    test("Clusters response is a list", isinstance(clusters, list))

# ============================================================
#  CROSS-CUTTING CHECKS
# ============================================================
divider("CROSS-CUTTING: Data Integrity & Edge Cases")

# Test: GeoJSON coordinate order in DB
if alerts_data:
    geolocated = [a for a in alerts_data if a.get("location")]
    if geolocated:
        loc = geolocated[0]["location"]
        test("DB location uses GeoJSON format", loc.get("type") == "Point")
        coords = loc.get("coordinates", [])
        test("GeoJSON coords are [lng, lat] (lng first)", len(coords) == 2)
        # Longitude should be roughly 68-97 for India, Latitude 8-37
        lng, lat = coords
        test("Longitude is India-range (68-98)", 68 <= lng <= 98, f"lng={lng}")
        test("Latitude is India-range (6-38)", 6 <= lat <= 38, f"lat={lat}")

# Test: Duplicate tweet handling (no unique constraint currently)
dup_count = collection.count_documents({"tweet_id": mock_tweets[0]["id"]})
test("Duplicate tweet_id check (informational)", True, f"tweet_id '{mock_tweets[0]['id']}' appears {dup_count} times in DB")

# ============================================================
#  FINAL REPORT
# ============================================================
divider("FINAL REPORT")
print(f"\n  Total:  {PASS + FAIL}")
print(f"  Passed: {PASS}")
print(f"  Failed: {FAIL}")
print(f"  Score:  {PASS}/{PASS+FAIL} ({100*PASS/(PASS+FAIL):.1f}%)")

if FAIL > 0:
    print(f"\n  FAILED TESTS:")
    for status, name, detail in RESULTS:
        if status == "FAIL":
            print(f"    [FAIL] {name}: {detail}")
