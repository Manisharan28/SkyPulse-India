import React from 'react';
import { MapContainer, TileLayer, Circle, Tooltip as LeafletTooltip } from 'react-leaflet';
import AlertMarker from './AlertMarker';
import { MAP_CENTER, MAP_ZOOM } from '../utils/constants';

function ClusterLayer({ clusters }) {
  if (!clusters || clusters.length === 0) return null;
  
  return (
    <>
      {clusters.map((cluster) => (
        <Circle
          key={`cluster-${cluster.cluster_id}`}
          center={cluster.center}
          radius={20000} // 20km
          pathOptions={{
            color: '#8b5cf6', // violet-500
            fillColor: '#8b5cf6',
            fillOpacity: 0.2,
            dashArray: '5, 5',
            weight: 2
          }}
        >
          <LeafletTooltip direction="top" className="custom-popup" opacity={1}>
            <div className="bg-gray-900 border border-violet-500 p-2 rounded-lg shadow-xl">
              <div className="text-[10px] font-bold text-violet-400 uppercase mb-1">Active Cluster #{cluster.cluster_id}</div>
              <div className="text-xs text-gray-300">{cluster.count} correlated alerts</div>
            </div>
          </LeafletTooltip>
        </Circle>
      ))}
    </>
  );
}

export default function MapView({ alerts, clusters, onAlertClick }) {
  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={MAP_CENTER} 
        zoom={MAP_ZOOM} 
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ClusterLayer clusters={clusters} />
        
        {alerts.map(alert => (
          <AlertMarker 
            key={`marker-${alert._id}`} 
            alert={alert} 
            onClick={onAlertClick} 
          />
        ))}
      </MapContainer>
    </div>
  );
}
