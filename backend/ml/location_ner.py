from transformers import pipeline
import config

print("[ML] Loading Location NER Model (this may take a moment)...")
try:
    ner_pipeline = pipeline("token-classification", model=config.NER_MODEL, aggregation_strategy="simple")
    print("[ML] NER Model Loaded.")
except Exception as e:
    print(f"[ML] Failed to load NER model: {e}")
    ner_pipeline = None

def extract_location(text):
    """
    Extracts the most prominent location from the text using BERT-base-NER.
    Returns the location string or None.
    """
    if not ner_pipeline:
        return None
        
    try:
        # Extract entities
        entities = ner_pipeline(text[:512])
        
        # Filter for Location (LOC) tags
        locations = [ent['word'] for ent in entities if ent['entity_group'] == 'LOC']
        
        if locations:
            # Simple heuristic: return the longest location found, 
            # or you could just return the first one. Let's return the first one.
            return locations[0]
            
        return None
    except Exception as e:
        print(f"[ML] NER error: {e}")
        return None
