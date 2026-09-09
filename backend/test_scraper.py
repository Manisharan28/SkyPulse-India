import asyncio
import sys

from ingestion.live_scraper import init_scraper, fetch_live_tweets

async def main():
    print("Testing init_scraper...")
    try:
        ready, api = await init_scraper()
        print(f"Init ready: {ready}")
        if ready:
            print("Fetching tweets...")
            tweets = await fetch_live_tweets(api, 2)
            print(f"Fetched {len(tweets)} tweets.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
