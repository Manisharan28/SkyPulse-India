import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MAP_CENTER, MAP_ZOOM } from '../utils/constants';
import AlertMarker from './AlertMarker';
import ClusterLayer from './ClusterLayer';

export default function MapView({ alerts, clusters, onMarkerClick }) {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={MAP_CENTER} 
        zoom={MAP_ZOOM} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Dark theme tile layer via CSS inversion, we use standard OSM here */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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
