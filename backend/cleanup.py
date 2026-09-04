import os
import config
from database.mongo import get_collection
from ingestion.live_scraper import is_in_india

def clean_db():
    print("Connecting to DB...")
    c = get_collection()
    deleted = 0
    
    for doc in c.find():
        if doc.get('location') and doc['location'].get('coordinates'):
            lon, lat = doc['location']['coordinates']
            
            if not is_in_india(lat, lon):
                c.delete_one({'_id': doc['_id']})
                deleted += 1
                
    print(f"Cleanup complete! Deleted {deleted} old alerts that were outside of India.")

if __name__ == "__main__":
    clean_db()
