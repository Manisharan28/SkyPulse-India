"""
Central configuration for the SIH Weather Analytics Platform.
Reads sensitive values from environment variables / .env file.
"""

import os
from dotenv import load_dotenv

# Load .env file from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ─── MongoDB Atlas ───────────────────────────────────────────────
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority",
)
DB_NAME = "sih_weather"
COLLECTION_NAME = "alerts"

# ─── Ingestion Mode ──────────────────────────────────────────────
INGESTION_MODE = os.getenv("INGESTION_MODE", "MOCK")  # "LIVE" or "MOCK"
INGEST_INTERVAL = 5           # seconds between tweet pushes (MOCK mode)
LIVE_FETCH_INTERVAL = 180     # seconds between live fetch batches (3 min)
LIVE_BATCH_SIZE = 15          # tweets per live fetch batch

# ─── Twitter/X Credentials (for LIVE mode only) ─────────────────
TWITTER_USERNAME = os.getenv("TWITTER_USERNAME", "")
TWITTER_PASSWORD = os.getenv("TWITTER_PASSWORD", "")
TWITTER_EMAIL = os.getenv("TWITTER_EMAIL", "")
TWITTER_EMAIL_PASSWORD = os.getenv("TWITTER_EMAIL_PASSWORD", "")
TWITTER_COOKIES = os.getenv("TWITTER_COOKIES", "")

# ─── Scrape Query ────────────────────────────────────────────────
SCRAPE_QUERY = (
    "(#IMD OR #Mausam OR #RainAlert OR #FloodAlert OR #Cyclone "
    "OR #Heatwave OR #Thunderstorm OR #Fog) "
    "(India OR Mumbai OR Delhi OR Chennai OR Kolkata OR Bengaluru "
    "OR Hyderabad OR Jaipur OR Patna OR Guwahati OR Kerala "
    "OR Maharashtra OR Tamil Nadu OR Gujarat OR Rajasthan) "
    "lang:en -is:retweet"
)

# ─── India Bounding Box ────────────────────────────────────────
INDIA_BBOX = {"sw_lat": 6.0, "sw_lon": 68.0, "ne_lat": 38.5, "ne_lon": 99.5}

# ─── ML Models (HuggingFace) ────────────────────────────────────
DISASTER_MODEL = "aellxx/disaster-tweet-distilbert"
NER_MODEL = "dslim/bert-base-NER"

# ─── Clustering ──────────────────────────────────────────────────
DBSCAN_EPS_KM = 2.0          # cluster radius in km
DBSCAN_MIN_SAMPLES = 3       # minimum reports to form a cluster
CLUSTER_TIME_WINDOW_H = 6    # look-back window in hours
CLUSTER_RUN_INTERVAL = 30    # seconds between DBSCAN re-runs

# ─── Flask ───────────────────────────────────────────────────────
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5000
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
