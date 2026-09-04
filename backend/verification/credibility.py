def calculate_credibility(ml_confidence, weather_score, is_clustered=False, followers=0, has_media=False):
    """
    Hybrid scoring engine.
    Weights:
    - ML Confidence: 30%
    - Weather API match: 30%
    - Clustered (Wisdom of crowd): 20%
    - Source Trust (followers): 10%
    - Media Attached: 10%
    """
    # Normalize inputs
    ml_weight = 0.3
    weather_weight = 0.3
    cluster_weight = 0.2
    source_weight = 0.1
    media_weight = 0.1
    
    cluster_score = 1.0 if is_clustered else 0.0
    
    # Logarithmic follower scoring (10K+ = 1.0, 1K = 0.7, 100 = 0.4, <100 = 0.1)
    import math
    if followers >= 10000:
        source_score = 1.0
    elif followers > 0:
        source_score = min(1.0, math.log10(followers) / 4.0)
    else:
        source_score = 0.0

    media_score = 1.0 if has_media else 0.0
    
    final_score = (
        (ml_confidence * ml_weight) +
        (weather_score * weather_weight) +
        (cluster_score * cluster_weight) +
        (source_score * source_weight) +
        (media_score * media_weight)
    )
    
    # Determine status
    if final_score >= 0.75:
        status = "Verified"
    elif final_score >= 0.40:
        status = "Emerging"
    else:
        status = "Flagged"
        
    return round(final_score, 3), status
