import threading
import time
from datetime import datetime, timedelta, UTC
from database.mongo import get_collection
import config

def cleanup_old_data():
    """Deletes alerts older than DATA_RETENTION_HOURS from MongoDB."""
    collection = get_collection()
    cutoff = datetime.now(UTC) - timedelta(hours=config.DATA_RETENTION_HOURS)
    
    try:
        result = collection.delete_many({"created_at": {"$lt": cutoff}})
        if result.deleted_count > 0:
            print(f"[CLEANUP] Purged {result.deleted_count} alerts older than {config.DATA_RETENTION_HOURS}h")
        else:
            print(f"[CLEANUP] No stale alerts found (retention: {config.DATA_RETENTION_HOURS}h)")
    except Exception as e:
        print(f"[CLEANUP] Error during deletion: {e}")

def cleanup_loop():
    print(f"[CLEANUP] Starting cleanup thread (interval: {config.CLEANUP_INTERVAL}s, retention: {config.DATA_RETENTION_HOURS}h)")
    while True:
        try:
            cleanup_old_data()
        except Exception as e:
            print(f"[CLEANUP] Error: {e}")
        time.sleep(config.CLEANUP_INTERVAL)

def start_cleanup_worker(app):
    thread = threading.Thread(target=cleanup_loop, daemon=True)
    thread.start()
    return thread
