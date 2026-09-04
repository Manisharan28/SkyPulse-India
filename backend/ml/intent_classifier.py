from transformers import pipeline
import config
import os

print("[ML] Loading Intent Classifier Model (this may take a moment)...")
try:
    try:
        # Try loading from local cache first (no network needed)
        classifier = pipeline("text-classification", model=config.DISASTER_MODEL)
    except Exception:
        # Fallback: download from HuggingFace if not cached
        print("[ML] Cache miss — downloading model from HuggingFace...")
        # aellxx/disaster-tweet-distilbert outputs POSITIVE for disaster, NEGATIVE for not-disaster
        classifier = pipeline("text-classification", model=config.DISASTER_MODEL)
    print("[ML] Intent Classifier Loaded.")
except Exception as e:
    print(f"[ML] Failed to load intent classifier: {e}")
    classifier = None

def classify_tweet(text):
    """
    Classifies a tweet as an Incident or Noise.
    Returns: {"is_incident": bool, "confidence": float, "raw_label": str}
    """
    if not classifier:
        # Fallback if model fails to load
        return {"is_incident": True, "confidence": 1.0, "raw_label": "FALLBACK"}
        
    try:
        # Truncate text to 512 chars to prevent token length errors
        result = classifier(text[:512])[0]
        label = result['label']
        score = result['score']
        
        # The model outputs POSITIVE for disaster-related, NEGATIVE for noise
        is_incident = label == "POSITIVE"
        
        return {
            "is_incident": is_incident,
            "confidence": score,
            "raw_label": label
        }
    except Exception as e:
        print(f"[ML] Classification error: {e}")
        return {"is_incident": True, "confidence": 0.5, "raw_label": "ERROR"}
