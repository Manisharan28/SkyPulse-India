import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { STATUS_COLORS } from '../utils/constants';

export default function AlertMarker({ alert, onClick }) {
  // We only render if location exists
  if (!alert.location || !alert.location.coordinates) return null;
  
  // Coordinates in DB are [lng, lat], Leaflet expects [lat, lng]
  const [lng, lat] = alert.location.coordinates;
  const color = STATUS_COLORS[alert.status] || '#94a3b8';
  
  const isVerified = alert.status === 'Verified';

  return (
    <CircleMarker
      center={[lat, lng]}
      pathOptions={{ 
        fillColor: color, 
        fillOpacity: 0.8,
        weight: isVerified ? 2 : 1,
        color: isVerified ? '#ffffff' : color
      }}
      radius={isVerified ? 8 : 6}
      eventHandlers={{
        click: () => onClick(alert),
      }}
      className={isVerified ? 'marker-pulse cursor-pointer' : 'cursor-pointer'}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-popup">
        <div className="bg-gray-900 border border-gray-700 rounded shadow-xl p-2 max-w-[200px] text-white font-sans">
          <div className="font-bold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
            <span>{alert.event_type}</span>
          </div>
          <div className="text-xs text-gray-300 mt-1 line-clamp-2">{alert.text}</div>
        </div>
      </Tooltip>
    </CircleMarker>
  );
}
