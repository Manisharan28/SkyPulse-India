# Hardcoded dictionary for MVP of major Indian cities
# Format: "city_name": [latitude, longitude]
INDIAN_CITIES = {
    "mumbai": [19.0760, 72.8777],
    "delhi": [28.7041, 77.1025],
    "new delhi": [28.6139, 77.2090],
    "chennai": [13.0827, 80.2707],
    "kolkata": [22.5726, 88.3639],
    "bengaluru": [12.9716, 77.5946],
    "bangalore": [12.9716, 77.5946],
    "hyderabad": [17.3850, 78.4867],
    "jaipur": [26.9124, 75.7873],
    "patna": [25.5941, 85.1376],
    "guwahati": [26.1445, 91.7362],
    "lucknow": [26.8467, 80.9462],
    "bhopal": [23.2599, 77.4126],
    "ahmedabad": [23.0225, 72.5714],
    "pune": [18.5204, 73.8567],
    "kochi": [9.9312, 76.2673],
    "visakhapatnam": [17.6868, 83.2185],
    "chandigarh": [30.7333, 76.7794],
    "surat": [21.1702, 72.8311],
    "nagpur": [21.1458, 79.0882],
    "indore": [22.7196, 75.8577],
    "thiruvananthapuram": [8.5241, 76.9366],
    "bhubaneswar": [20.2961, 85.8245]
}

def geocode(location_name):
    """
    Looks up coordinates for a given city name.
    Returns [lat, lng] or None if not found.
    """
    if not location_name:
        return None
        
    # Clean the string for matching
    cleaned_name = location_name.lower().strip()
    
    # Direct match
    if cleaned_name in INDIAN_CITIES:
        return INDIAN_CITIES[cleaned_name]
        
    # Partial match (e.g., if NER extracted "Mumbai City")
    for city, coords in INDIAN_CITIES.items():
        if city in cleaned_name:
            return coords
            
    return None
