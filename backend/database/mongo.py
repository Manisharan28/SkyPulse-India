from pymongo import MongoClient
import os

db = None
alerts_collection = None

def init_db():
    global db, alerts_collection
    
    mongo_uri = os.getenv("MONGO_URI")
    db_name = "sih_weather"
    
    if not mongo_uri or mongo_uri.startswith("mongodb+srv://<username>"):
        raise ValueError("MONGO_URI environment variable not properly set. Please check your .env file.")
        
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    alerts_collection = db["alerts"]
    
    # Create indexes
    try:
        # 2dsphere index requires GeoJSON point format
        alerts_collection.create_index([("location", "2dsphere")])
        alerts_collection.create_index("status")
        alerts_collection.create_index("event_type")
        alerts_collection.create_index([("timestamp", -1)])
        alerts_collection.create_index("tweet_id", unique=True)
        print("MongoDB Indexes verified/created successfully.")
    except Exception as e:
        print(f"Error creating indexes: {e}")

def get_collection():
    if alerts_collection is None:
        init_db()
    return alerts_collection
