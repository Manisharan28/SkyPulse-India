import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
import config
from database.mongo import init_db, get_collection

init_db()
col = get_collection()
count = col.count_documents({})

print("\n--- DATABASE CHECK ---")
print(f"Total tweets inserted into MongoDB Atlas: {count}")
if count > 0:
    latest = col.find().sort("timestamp", -1).limit(1)[0]
    print(f"Latest tweet ID: {latest.get('tweet_id')}")
    print(f"Username: @{latest.get('username')}")
    print(f"Text: {latest.get('text')}")
    print(f"Coordinates: {latest.get('location', {}).get('coordinates')}")
