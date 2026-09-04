import os
import json
import asyncio
from datetime import datetime, UTC
from twscrape import API, gather
import config

async def init_scraper():
    """Initializes the twscrape API and logs in the account if necessary."""
    api = API()
    
    # Check if we already have accounts
    accounts = await api.pool.get_all()
    logged_in = [acc for acc in accounts if acc.active]
    
    if not logged_in:
        print("[SCRAPER] No active accounts found. Attempting to add and login...")
        if not config.TWITTER_USERNAME or not config.TWITTER_PASSWORD:
            print("[SCRAPER] Error: Twitter credentials missing in config.")
            return False, None
            
        try:
            await api.pool.add_account(
                config.TWITTER_USERNAME,
                config.TWITTER_PASSWORD,
                config.TWITTER_EMAIL,
                config.TWITTER_EMAIL_PASSWORD,
                cookies=config.TWITTER_COOKIES if config.TWITTER_COOKIES else None
            )
            await api.pool.login_all()
            print("[SCRAPER] Successfully logged into Twitter/X.")
        except Exception as e:
            print(f"[SCRAPER] Failed to login: {e}")
            return False, None
    else:
        print(f"[SCRAPER] Found {len(logged_in)} active account(s).")
        
    return True, api

def infer_event_type(text):
    """Simple heuristic to infer event type from raw tweet text."""
    text_lower = text.lower()
    if "flood" in text_lower or "waterlog" in text_lower:
        return "Flood"
    elif "heat" in text_lower or "hot" in text_lower:
        return "Heatwave"
    elif "cyclone" in text_lower or "hurricane" in text_lower:
        return "Cyclone"
    elif "wind" in text_lower or "gust" in text_lower or "storm" in text_lower:
        return "Wind"
    else:
        return "Heavy Rain"  # Default

async def fetch_live_tweets(api, batch_size=15):
    """Fetches real tweets and maps them to our internal schema."""
    print(f"[SCRAPER] Searching for: '{config.SCRAPE_QUERY}' (limit: {batch_size})")
    
    mapped_tweets = []
    try:
        tweets = await gather(api.search(config.SCRAPE_QUERY, limit=batch_size))
        
        for tweet in tweets:
            coords = None
            if tweet.coordinates:
                # Map to [lat, lng] for internal processing
                coords = [tweet.coordinates.latitude, tweet.coordinates.longitude]
                
            mapped = {
                "id": str(tweet.id),
                "text": tweet.rawContent,
                "timestamp": tweet.date.isoformat() + "Z",
                "username": tweet.user.username,
                "followers": tweet.user.followersCount,
                "has_media": len(tweet.media.photos) > 0 or len(tweet.media.videos) > 0 if tweet.media else False,
                "coordinates": coords,
                "event_type": infer_event_type(tweet.rawContent),
                "source": "live"
            }
            mapped_tweets.append(mapped)
            
        print(f"[SCRAPER] Fetched and mapped {len(mapped_tweets)} live tweets.")
    except Exception as e:
        print(f"[SCRAPER] Error fetching tweets: {e}")
        
    return mapped_tweets

async def record_tweets(tweets, filepath):
    """Appends fetched tweets to a JSON file for offline replay."""
    try:
        existing_data = []
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                try:
                    existing_data = json.load(f)
                except json.JSONDecodeError:
                    pass
                    
        existing_data.extend(tweets)
        
        # Write back
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=2)
            
        print(f"[SCRAPER] Appended {len(tweets)} tweets to {filepath}")
    except Exception as e:
        print(f"[SCRAPER] Failed to record tweets: {e}")
