# SIH PS26069: National Weather Big Data Analytics Platform

A Hybrid AI Verification System that ingests simulated social media disaster reports, verifies them using NLP + meteorological ground-truth APIs, and displays results on a live geospatial dashboard.

---

## Proposed Folder Structure

```
sih/
├── backend/
│   ├── app.py                    # Flask app factory, CORS, routes registration
│   ├── config.py                 # MongoDB URI, model paths, feature flags
│   ├── requirements.txt          # All Python dependencies
│   ├── data/
│   │   └── mock_tweets.json      # 50 simulated #IMD disaster tweets
│   ├── ingestion/
│   │   ├── __init__.py
│   │   └── stream_simulator.py   # Background thread: reads JSON, pushes 1 record/5s
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── intent_classifier.py  # DistilBERT disaster tweet classifier
│   │   ├── location_ner.py       # BERT-base-NER location extraction
│   │   └── geocoder.py           # City name → [lat, lng] lookup
│   ├── verification/
│   │   ├── __init__.py
│   │   ├── weather_api.py        # Open-Meteo API cross-check
│   │   ├── clustering.py         # DBSCAN spatial clustering engine
│   │   └── credibility.py        # Hybrid credibility scorer (0.0–1.0)
│   ├── database/
│   │   ├── __init__.py
│   │   └── mongo.py              # PyMongo setup, 2dsphere index creation
│   └── routes/
│       ├── __init__.py
│       └── alerts.py             # /api/alerts GET with filtering + /api/stats
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Root component with layout
│       ├── index.css             # Tailwind + custom styles
│       ├── components/
│       │   ├── MapView.jsx       # Full-screen Leaflet map with markers
│       │   ├── AlertMarker.jsx   # Color-coded marker with popup trigger
│       │   ├── XAIModal.jsx      # Explainable AI credibility breakdown modal
│       │   ├── Sidebar.jsx       # Filters: Date, Event Type, Status
│       │   ├── ClusterLayer.jsx  # DBSCAN cluster heatmap visualization
│       │   └── StatsBar.jsx      # Live stats: total alerts, verified, pending
│       ├── hooks/
│       │   └── useAlerts.js      # Polling hook: GET /api/alerts every 5s
│       └── utils/
│           └── constants.js      # Color codes, status labels, API base URL
│
└── README.md                     # Setup instructions, architecture overview
```

---

## Phase Breakdown

---

### Phase 1 — Data Layer & Simulated Ingestion

**Goal:** Create the mock dataset, set up MongoDB with proper indexing, and prove the background ingestion thread pushes records into the DB on a timer.

**Test Criteria:** Run `python app.py`, observe terminal logs showing one record inserted into MongoDB every 5 seconds with correct GeoJSON formatting.

---

#### [NEW] [mock_tweets.json](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/data/mock_tweets.json)
- 50 JSON objects simulating X (Twitter) posts containing `#IMD`
- Fields per object:
  - `id` (string, UUID)
  - `text` (string, realistic disaster report or noise/critique)
  - `timestamp` (ISO 8601, spread across last 48 hours)
  - `username` (string)
  - `followers` (int, range 50–500,000)
  - `has_media` (boolean)
  - `coordinates` (nullable `[lat, lng]` — ~60% will have GPS, ~40% will be `null` so NER must extract location from text)
  - `event_type` (string: "Flood", "Heatwave", "Cyclone", "Heavy Rain", "Wind")
- Mix:
  - ~35 genuine disaster reports (varied severity/language)
  - ~15 noise tweets (sarcasm, political critique of IMD, unrelated)
  - Cover 8+ Indian cities: Mumbai, Chennai, Kolkata, Delhi, Bengaluru, Jaipur, Patna, Guwahati

#### [NEW] [config.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/config.py)
- `MONGO_URI = "mongodb://localhost:27017"`
- `DB_NAME = "sih_weather"`
- `COLLECTION_NAME = "alerts"`
- `INGEST_INTERVAL = 5` (seconds between simulated tweet pushes)
- `DISASTER_MODEL = "aellxx/disaster-tweet-distilbert"`
- `NER_MODEL = "dslim/bert-base-NER"`

#### [NEW] [mongo.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/database/mongo.py)
- `init_db()` function called on Flask startup:
  - Connects to MongoDB using PyMongo
  - Gets/creates the `sih_weather` database and `alerts` collection
  - Creates a `2dsphere` index on the `location` field (GeoJSON)
  - Creates supplementary indexes on `status`, `event_type`, `timestamp`
- Exports `get_collection()` helper for other modules

#### [NEW] [stream_simulator.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/ingestion/stream_simulator.py)
- `start_ingestion(app)`: launches a `threading.Thread(daemon=True)`
- Thread function:
  - Loads `mock_tweets.json` into memory
  - Iterates through records in a loop (wraps around at end)
  - Every 5 seconds, takes the next record and pushes it through the processing pipeline (Phase 2), or in Phase 1 directly inserts a raw record into MongoDB
  - Logs each insert to stdout: `[INGEST] Tweet {id} from @{username} pushed at {timestamp}`

#### [NEW] [app.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/app.py)
- Creates Flask app
- Calls `init_db()` to set up MongoDB + indexes
- Starts the ingestion background thread
- Registers route blueprints (placeholder in Phase 1)
- CORS enabled for `http://localhost:5173` (Vite dev server)

#### [NEW] [requirements.txt](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/requirements.txt)
```
flask==3.1.*
flask-cors==5.*
pymongo==4.*
transformers==4.*
torch==2.*
scikit-learn==1.*
requests==2.*
```

---

### Phase 2 — AI Extraction & Intent Pipeline

**Goal:** Wire up the two HuggingFace models so incoming tweets get classified (incident vs noise) and geolocated (NER + geocoding). Noise tweets are discarded. Incidents proceed into the DB.

**Test Criteria:** Terminal logs should show classification output per tweet: `[NLP] Tweet {id}: label=Incident, confidence=0.94` and `[NER] Extracted location: "Mumbai" → [19.076, 72.8777]`. Noise tweets should log `[DISCARD] Tweet {id}: classified as Noise (0.87)`.

---

#### [NEW] [intent_classifier.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/ml/intent_classifier.py)
- On module load, initializes the HuggingFace pipeline:
  ```python
  from transformers import pipeline
  classifier = pipeline("text-classification", model="aellxx/disaster-tweet-distilbert")
  ```
- `classify_tweet(text) -> dict`:
  - Runs text through the pipeline
  - The model outputs `LABEL_1` (disaster) or `LABEL_0` (not disaster)
  - Returns `{"is_incident": bool, "confidence": float, "raw_label": str}`

> [!IMPORTANT]
> **Model Label Mapping:** The `aellxx/disaster-tweet-distilbert` model is a binary classifier trained on the Kaggle NLP Disaster Tweets dataset. It outputs `LABEL_1` for disaster-related and `LABEL_0` for non-disaster. I'll map `LABEL_1 → Incident` and `LABEL_0 → Noise`. If the model's label mapping is reversed, this is trivially configurable.

#### [NEW] [location_ner.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/ml/location_ner.py)
- Loads `dslim/bert-base-NER` via the HuggingFace `token-classification` pipeline
- `extract_location(text) -> str | None`:
  - Runs NER, filters for entities tagged as `B-LOC` / `I-LOC`
  - Merges sub-word tokens into complete location names
  - Returns the longest/first location entity found, or `None`

#### [NEW] [geocoder.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/ml/geocoder.py)
- Contains a hardcoded dictionary of ~20 major Indian cities mapping `city_name → [lat, lng]`:
  - Mumbai, Delhi, Chennai, Kolkata, Bengaluru, Hyderabad, Jaipur, Patna, Guwahati, Lucknow, Bhopal, Ahmedabad, Pune, Kochi, Visakhapatnam, Chandigarh, Surat, Nagpur, Indore, Thiruvananthapuram
- `geocode(location_name) -> [lat, lng] | None`:
  - Case-insensitive lookup
  - Falls back to `None` if city not found

> [!NOTE]
> **Why hardcoded geocoding?** For an SIH demo/MVP, a static lookup table avoids rate limits, network failures, and API key dependencies. This is intentional for determinism in demos. A production version would use Nominatim or Google Geocoding API.

#### [MODIFY] [stream_simulator.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/ingestion/stream_simulator.py)
- The processing loop now calls the full pipeline per tweet:
  1. `classify_tweet(text)` → if Noise, discard + log
  2. If Incident: check if `coordinates` exist in the tweet data
  3. If no coordinates: `extract_location(text)` → `geocode(location)` → assign coordinates
  4. If still no coordinates after NER: log warning, skip (or assign a default with low confidence)
  5. Build the alert document and pass to Phase 3 scorer (or insert raw in Phase 2 testing)

---

### Phase 3 — Ground-Truth Verification & Credibility Scoring

**Goal:** Cross-check alerts against real weather data, run DBSCAN clustering for sensor-lag override, and compute the final hybrid credibility score. Each alert gets a status: Verified / Emerging / Flagged.

**Test Criteria:** Terminal logs should show the full credibility math for each alert: `[SCORE] Tweet {id}: base=0.47, +media=0.15, +followers=0.10, +weather=0.30, +cluster=0.00 → final=0.82 → VERIFIED`

---

#### [NEW] [weather_api.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/verification/weather_api.py)
- `check_weather(lat, lng, timestamp) -> dict`:
  - Calls `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&hourly=precipitation,weathercode&timezone=auto`
  - For historical timestamps (>24h ago), uses `https://archive-api.open-meteo.com/v1/archive`
  - Parses the response to find the hourly bucket matching `timestamp`
  - Returns:
    ```python
    {
        "precipitation_mm": float,
        "weather_code": int,  # WMO weather code
        "confirms_disaster": bool,  # True if precip > 2mm or weather_code indicates storm/rain
        "raw_response": dict
    }
    ```
- Uses `requests` with a 5-second timeout and graceful error handling (returns `confirms_disaster: False` on API failure)

> [!NOTE]
> **WMO Weather Codes:** Codes 61-67 (rain), 71-77 (snow), 80-82 (rain showers), 85-86 (snow showers), 95-99 (thunderstorms) all indicate adverse weather. We'll map these to `confirms_disaster=True`.

#### [NEW] [clustering.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/verification/clustering.py)
- `run_dbscan(collection) -> dict`:
  - Queries MongoDB for all alerts from the last 6 hours
  - Extracts `[lat, lng]` coordinates into a numpy array
  - Runs `sklearn.cluster.DBSCAN(eps=0.018, min_samples=3)`:
    - `eps=0.018` radians ≈ 2km at equatorial latitudes (using `haversine` metric)
    - Actually: uses `haversine` metric with `eps` in radians. `2km / 6371km ≈ 0.000314 radians`. We'll use the `ball_tree` algorithm with `haversine` metric.
  - Returns a dict mapping `alert_id → cluster_label` (−1 means no cluster)
- `is_in_cluster(alert_id, cluster_map) -> bool`
- Also returns cluster metadata: `{ cluster_id: { center: [lat,lng], count: int, alert_ids: [...] } }` for frontend visualization

#### [NEW] [credibility.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/verification/credibility.py)
- `compute_credibility(alert_data) -> dict`:
  - Deterministic scoring logic:
    ```
    base_score = nlp_confidence * 0.20  (scale: DistilBERT confidence as fraction of 0.20)
    
    media_boost    = 0.15 if has_media else 0.0
    follower_boost = 0.10 if followers > 10,000 else (0.05 if followers > 1,000 else 0.0)
    weather_boost  = 0.30 if weather_confirms else 0.0
    cluster_boost  = 0.25 if in_cluster else 0.0
    
    raw_score = base_score + media_boost + follower_boost + weather_boost + cluster_boost
    final_score = min(raw_score, 1.0)
    ```
  - Status assignment:
    - `final_score >= 0.75` → `"Verified"` (Green)
    - `0.40 <= final_score < 0.75` → `"Emerging"` (Amber)
    - `final_score < 0.40` → `"Flagged"` (Red)
  - Returns:
    ```python
    {
        "credibility_score": float,
        "status": str,
        "breakdown": {
            "nlp_score": float,
            "nlp_confidence": float,
            "media_confirmed": bool,
            "follower_boost": float,
            "weather_match": bool,
            "cluster_override": bool
        }
    }
    ```

#### [MODIFY] [stream_simulator.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/ingestion/stream_simulator.py)
- Full pipeline integration: Ingest → Classify → NER/Geocode → Weather Check → Score → Insert into MongoDB
- The document inserted into MongoDB has this shape:
  ```python
  {
      "_id": ObjectId,
      "tweet_id": str,
      "text": str,
      "username": str,
      "followers": int,
      "has_media": bool,
      "event_type": str,
      "timestamp": datetime,
      "location": {
          "type": "Point",
          "coordinates": [lng, lat]  # GeoJSON order: longitude first!
      },
      "location_source": "gps" | "ner",
      "location_name": str | null,
      "credibility_score": float,
      "status": "Verified" | "Emerging" | "Flagged",
      "breakdown": { ... },
      "created_at": datetime
  }
  ```

> [!WARNING]
> **GeoJSON coordinate order:** MongoDB's `2dsphere` index requires `[longitude, latitude]` order, which is the opposite of common `[lat, lng]` conventions. This is enforced consistently across the codebase.

---

### Phase 4 — REST API Endpoints

**Goal:** Expose the scored alerts via a queryable REST API that the frontend will poll.

**Test Criteria:** `curl "http://localhost:5000/api/alerts?status=Verified&event_type=Flood"` returns a valid JSON array of matching alerts. `curl "http://localhost:5000/api/stats"` returns aggregate counts.

---

#### [NEW] [alerts.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/routes/alerts.py)
- Flask Blueprint: `alerts_bp`
- **`GET /api/alerts`**:
  - Query params:
    - `status` (optional): "Verified", "Emerging", "Flagged"
    - `event_type` (optional): "Flood", "Heatwave", "Cyclone", "Heavy Rain", "Wind"
    - `start_date` / `end_date` (optional): ISO 8601 date strings
  - Builds a MongoDB query filter from params
  - Returns JSON array of alert documents (with `_id` serialized to string)
  - Sorted by `created_at` descending
  - Limit: 200 per request

- **`GET /api/alerts/<id>`**:
  - Returns a single alert by `_id` with full breakdown

- **`GET /api/stats`**:
  - Returns aggregate stats:
    ```json
    {
      "total": int,
      "verified": int,
      "emerging": int,
      "flagged": int,
      "by_event_type": { "Flood": int, ... },
      "clusters": [ { "center": [lat, lng], "count": int, "alert_ids": [...] } ]
    }
    ```

- **`GET /api/clusters`**:
  - Runs DBSCAN on current data and returns cluster information for the heatmap layer

#### [MODIFY] [app.py](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/backend/app.py)
- Register the `alerts_bp` blueprint with URL prefix `/api`

---

### Phase 5 — React Frontend & Geospatial Dashboard

**Goal:** Build the full React + TailwindCSS + Leaflet dashboard. Polls the backend every 5 seconds, displays color-coded markers, cluster visualization, filters, and the XAI breakdown modal.

**Test Criteria:** Open `http://localhost:5173`, see a full-screen map of India with markers populating in real-time. Click a pin → XAI modal opens. Use sidebar filters → markers update. Cluster regions are visually grouped.

---

#### [NEW] Frontend Scaffold (Vite + React)
- Initialize with `npx -y create-vite@latest ./ --template react`
- Install dependencies:
  ```
  npm install react-leaflet leaflet axios
  npm install -D tailwindcss @tailwindcss/vite
  ```

#### [NEW] [index.css](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/index.css)
- TailwindCSS v4 import
- Leaflet CSS import
- Custom color tokens for alert status (verified-green, emerging-amber, flagged-red)
- Dark mode support
- Glass morphism card styles
- Smooth animation keyframes for marker pulse

#### [NEW] [constants.js](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/utils/constants.js)
- `API_BASE = "http://localhost:5000/api"`
- `POLL_INTERVAL = 5000`
- Status color map: `{ Verified: "#22c55e", Emerging: "#f59e0b", Flagged: "#ef4444" }`
- Event type icons/labels
- Map default center: `[20.5937, 78.9629]` (India center), zoom 5

#### [NEW] [useAlerts.js](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/hooks/useAlerts.js)
- Custom React hook:
  - Accepts filter params (status, eventType, dateRange)
  - Uses `setInterval` to poll `GET /api/alerts` every 5 seconds
  - Returns `{ alerts, loading, error, stats }`
  - Also fetches `/api/stats` on each poll cycle

#### [NEW] [MapView.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/components/MapView.jsx)
- Full-screen `<MapContainer>` from `react-leaflet`
- Renders `<TileLayer>` with OpenStreetMap tiles
- Maps each alert to an `<AlertMarker>`
- Renders `<ClusterLayer>` for DBSCAN cluster visualization
- Centers on India with appropriate zoom

#### [NEW] [AlertMarker.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/components/AlertMarker.jsx)
- Renders a `<CircleMarker>` with color based on alert status:
  - Green (#22c55e) for Verified
  - Amber (#f59e0b) for Emerging
  - Red (#ef4444) for Flagged
- Pulsing animation for Verified alerts
- `onClick` → opens the XAI modal with alert data

#### [NEW] [XAIModal.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/components/XAIModal.jsx)
- Overlay modal that opens when a marker is clicked
- Displays the **Explainable AI Credibility Breakdown**:
  - Header: Alert text, username, timestamp
  - Score gauge: visual bar showing 0.0–1.0 with color gradient
  - Breakdown rows:
    - 🧠 NLP Confidence: `{confidence}%` (with progress bar)
    - 📷 Media Confirmed: Yes/No
    - 🌧️ Weather API Match: Confirmed/Pending/No Match
    - 📍 Cluster Override: Active/Inactive
    - 👥 Account Credibility: High/Medium/Low
  - Status badge: "Verified" / "Emerging" / "Flagged" with color
- Close button + click-outside-to-close

#### [NEW] [ClusterLayer.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/components/ClusterLayer.jsx)
- Fetches cluster data from `/api/clusters`
- For each DBSCAN cluster:
  - Renders a semi-transparent `<Circle>` overlay on the map showing the cluster radius
  - Displays cluster count badge
  - Color: purple/blue gradient to distinguish from alert markers
- Alternatively: uses a heatmap layer via `leaflet.heat` for high-density visualization

#### [NEW] [Sidebar.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/components/Sidebar.jsx)
- Collapsible sidebar (left side)
- Filter sections:
  - **Status**: Checkbox group — Verified, Emerging, Flagged
  - **Event Type**: Checkbox group — Flood, Heatwave, Cyclone, Heavy Rain, Wind
  - **Date Range**: Date picker inputs (start, end)
- "Apply Filters" button triggers re-fetch via `useAlerts` hook
- "Reset" button clears all filters

#### [NEW] [StatsBar.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/components/StatsBar.jsx)
- Top bar showing live statistics:
  - Total Alerts | Verified | Emerging | Flagged (with colored dots)
  - Updates every poll cycle
  - Subtle count-up animation when numbers change

#### [NEW] [App.jsx](file:///c:/Users/MOHAMMED%20ARMAAN/prog/sih/frontend/src/App.jsx)
- Layout:
  - `<StatsBar>` at top
  - `<Sidebar>` on left (collapsible)
  - `<MapView>` fills remaining space
  - `<XAIModal>` rendered as overlay (conditionally)
- State management:
  - Filter state lifted to App
  - Selected alert state for modal

---

### Phase 6 — Integration Testing & Polish

**Goal:** End-to-end verification. Start both servers, watch alerts flow from ingestion → ML → scoring → API → map markers. Fix edge cases.

**Test Criteria:** Full E2E flow works. All 6 features in the spec are demonstrably functional.

---

#### Verification Steps

1. **MongoDB Verification**
   - Connect to `mongo` shell → `use sih_weather` → `db.alerts.getIndexes()` → confirm `2dsphere` index exists
   - `db.alerts.find().limit(5).pretty()` → confirm GeoJSON structure

2. **Pipeline Verification**
   - Start backend → observe terminal logs showing full scoring math
   - Verify noise tweets are discarded (logged but not stored)
   - Verify NER geocoding works for tweets without GPS

3. **API Verification**
   - `curl http://localhost:5000/api/alerts` → returns JSON array
   - `curl http://localhost:5000/api/alerts?status=Verified` → filtered results
   - `curl http://localhost:5000/api/stats` → aggregate stats

4. **Frontend Verification**
   - Map loads with India center
   - Markers appear and update every 5 seconds
   - Color coding matches status
   - XAI modal shows correct breakdown
   - Sidebar filters work
   - Cluster visualization renders

5. **DBSCAN Cluster Verification**
   - After enough alerts accumulate from nearby cities → cluster detection triggers
   - Affected alerts get `cluster_override: true` and score boost

---

## Open Questions

> [!IMPORTANT]
> **MongoDB Installation:** This plan assumes MongoDB is already installed and running locally on port 27017. If you don't have MongoDB installed, I have two alternatives:
> 1. Use **MongoDB Atlas** (free tier, cloud-hosted) — requires internet + connection string
> 2. Use **mongomock** or **TinyDB** as a lightweight in-memory substitute for the demo
>
> Which do you prefer, or is local MongoDB already available?

> [!IMPORTANT]
> **GPU vs CPU for ML Models:** The DistilBERT and BERT-NER models can run on CPU but will be slower (~1-2s per inference). If you have a CUDA-compatible GPU with PyTorch CUDA installed, inference will be <100ms. The code will auto-detect and use GPU if available. Do you have a preference, or should I default to CPU-compatible setup (install `torch` without CUDA)?

> [!IMPORTANT]
> **Model Download Size:** First run will download `aellxx/disaster-tweet-distilbert` (~260MB) and `dslim/bert-base-NER` (~430MB) from HuggingFace. These are cached locally after first download. Is this acceptable, or would you prefer I create a lighter mock/fallback classifier option for quick testing?

---

## Suggestions

> [!TIP]
> **Periodic DBSCAN Re-run:** Rather than running DBSCAN on every single tweet insertion (expensive), I recommend running it every 30 seconds on a separate timer thread. This batches the clustering and then updates affected alerts in MongoDB. This is what I'll implement.

> [!TIP]
> **Graceful Degradation:** If MongoDB is down or models fail to load, the app will still start but log errors. The ingestion thread will retry connections. The API will return `503` with a descriptive error. This makes local development smoother.

> [!TIP]
> **Production Path:** For SIH finals, you could swap the `stream_simulator.py` with a real `twscrape` WebSocket integration with minimal code changes — the processing pipeline downstream is identical.

---

## Verification Plan

### Automated Tests
```bash
# Phase 1: Verify MongoDB connection and indexing
cd backend && python -c "from database.mongo import init_db; init_db(); print('DB OK')"

# Phase 2: Verify ML pipeline
cd backend && python -c "from ml.intent_classifier import classify_tweet; print(classify_tweet('Massive flooding in Mumbai #IMD'))"
cd backend && python -c "from ml.location_ner import extract_location; print(extract_location('Heavy rains in Chennai causing floods'))"

# Phase 3: Verify credibility scorer
cd backend && python -c "from verification.credibility import compute_credibility; print(compute_credibility({...}))"

# Phase 4: Verify API
curl http://localhost:5000/api/alerts
curl http://localhost:5000/api/stats

# Phase 5: Visual verification
# Open http://localhost:5173 in browser
```

### Manual Verification
- Watch the backend terminal for real-time scoring logs
- Verify the frontend map populates with markers
- Click markers to verify XAI modal shows correct breakdown
- Test all sidebar filter combinations
- Wait for cluster detection to trigger on nearby alerts
