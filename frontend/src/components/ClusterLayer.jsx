import React from 'react';
import { Circle, Tooltip } from 'react-leaflet';

export default function ClusterLayer({ clusters }) {
  if (!clusters || clusters.length === 0) return null;
  
  return (
    <>
      {clusters.map((cluster) => (
        <Circle
          key={cluster.cluster_id}
          center={cluster.center}
          pathOptions={{ 
            color: '#8b5cf6', 
            fillColor: '#8b5cf6', 
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '5, 5'
          }}
          radius={20000} // ~20km visualization radius
        >
          <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
            <div className="font-sans">
              <div className="font-bold text-purple-900">Active Cluster #{cluster.cluster_id}</div>
              <div className="text-gray-700">{cluster.count} correlated alerts</div>
            </div>
          </Tooltip>
        </Circle>
      ))}
    </>
  );
}
