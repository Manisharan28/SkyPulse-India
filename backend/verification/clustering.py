import numpy as np
from sklearn.cluster import DBSCAN
from datetime import datetime, timedelta, UTC
import threading
import time

from database.mongo import get_collection
from verification.credibility import calculate_credibility
import config

def update_clusters():
    """
    Runs DBSCAN on recent alerts to group them into spatial clusters.
    Updates the 'cluster_id' and boosts 'credibility_score' for clustered alerts.
    """
    collection = get_collection()
    
    # Get alerts from the last N hours
    time_threshold = datetime.now(UTC) - timedelta(hours=config.CLUSTER_TIME_WINDOW_H)
    
    # We only cluster alerts that have GPS coordinates
    query = {
        "timestamp": {"$gte": time_threshold},
        "location": {"$ne": None}
    }
    
    alerts = list(collection.find(query))
    if len(alerts) < config.DBSCAN_MIN_SAMPLES:
        return
        
    coords = []
    alert_ids = []
    
    for alert in alerts:
        lng, lat = alert["location"]["coordinates"]
        coords.append([lat, lng])
        alert_ids.append(alert["_id"])
        
    coords = np.array(coords)
    
    # Convert coordinates to radians for haversine
    coords_rad = np.radians(coords)
    
    # EPS is in kilometers, Earth radius is ~6371.0088
    eps_rad = config.DBSCAN_EPS_KM / 6371.0088
    
    # Run DBSCAN
    db = DBSCAN(eps=eps_rad, min_samples=config.DBSCAN_MIN_SAMPLES, metric='haversine')
    labels = db.fit_predict(coords_rad)
    
    num_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    print(f"[CLUSTER] DBSCAN complete. Found {num_clusters} active clusters across {len(coords)} recent alerts.")
    
    # Update documents in DB
    for i, label in enumerate(labels):
        cluster_id = str(label) if label != -1 else None
        
        # Retrieve original scores to recalculate credibility
        alert = alerts[i]
        ml_conf = alert.get("ml_confidence", 0.5)
        weather_score = alert.get("weather_score", 0.5)
        
        is_clustered = cluster_id is not None
        
        # Recalculate credibility with clustering taken into account
        new_score, new_status = calculate_credibility(ml_conf, weather_score, is_clustered)
        
        update_data = {
            "$set": {
                "cluster_id": cluster_id,
                "credibility_score": new_score,
                "status": new_status
            }
        }
        
        collection.update_one({"_id": alert_ids[i]}, update_data)

def clustering_loop():
    print(f"[CLUSTER] Starting DBSCAN background thread (interval {config.CLUSTER_RUN_INTERVAL}s)...")
    while True:
        try:
            update_clusters()
        except Exception as e:
            print(f"[CLUSTER] Error running DBSCAN: {e}")
            
        time.sleep(config.CLUSTER_RUN_INTERVAL)

def start_clustering(app):
    thread = threading.Thread(target=clustering_loop, daemon=True)
    thread.start()
    return thread
