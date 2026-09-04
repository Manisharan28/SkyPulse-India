def calculate_credibility(ml_confidence, weather_score, is_clustered=False):
    """
    Hybrid scoring engine.
    Weights:
    - ML Confidence: 40%
    - Weather API match: 40%
    - Clustered (Wisdom of crowd): 20%
    """
    # Normalize inputs
    ml_weight = 0.4
    weather_weight = 0.4
    cluster_weight = 0.2
    
    cluster_score = 1.0 if is_clustered else 0.0
    
    final_score = (ml_confidence * ml_weight) + (weather_score * weather_weight) + (cluster_score * cluster_weight)
    
    # Determine status
    if final_score >= 0.75:
        status = "Verified"
    elif final_score >= 0.40:
        status = "Emerging"
    else:
        status = "Flagged"
        
    return round(final_score, 3), status
