export const API_BASE = "http://localhost:5000/api";
export const POLL_INTERVAL = 5000;

export const STATUS_COLORS = {
  Verified: "#22c55e",
  Emerging: "#f59e0b",
  Flagged: "#ef4444",
};

export const EVENT_TYPES = [
  "Flood",
  "Heatwave",
  "Cyclone",
  "Heavy Rain",
  "Wind",
  "Thunderstorm",
  "Fog",
  "Dust Storm"
];

export const MAP_CENTER = [22.5937, 74.0000]; // Shifted further West to push India right
export const MAP_ZOOM = 5;
export const MAP_MIN_ZOOM = 4.5;

// Strict bounding box for India [SouthWest, NorthEast]
// Expanded slightly to allow centering the map properly
export const INDIA_BOUNDS = [
  [5.0, 60.0],
  [40.0, 105.0]
];
