import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { MAP_CENTER, MAP_ZOOM, MAP_MIN_ZOOM, INDIA_BOUNDS } from '../utils/constants';
import AlertMarker from './AlertMarker';
import ClusterLayer from './ClusterLayer';

export default function MapView({ alerts, clusters, onMarkerClick }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/india.json')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Failed to load India GeoJSON:", err));
  }, []);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={MAP_CENTER} 
        zoom={MAP_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Dark theme tile layer via CSS inversion, we use standard OSM here */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render India Border */}
        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={{
              color: '#3b82f6', 
              weight: 1.0,       // Slightly thicker lines
              opacity: 0.4,      // Tweaked down to 0.4 per request
              fillColor: '#0ea5e9',
              fillOpacity: 0.06, // A bit more tint for the landmass
            }}
            interactive={false} // don't block clicks on the map
          />
        )}
        
        {/* Render Clusters First (below markers) */}
        <ClusterLayer clusters={clusters} />
        
        {/* Render Individual Alerts */}
        {alerts.map(alert => (
          <AlertMarker 
            key={alert._id} 
            alert={alert} 
            onClick={onMarkerClick} 
          />
        ))}
        
      </MapContainer>
    </div>
  );
}
