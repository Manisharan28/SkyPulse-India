import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { STATUS_COLORS } from '../utils/constants';

export default function AlertMarker({ alert, onClick }) {
  if (!alert.location || !alert.location.coordinates) return null;

  const color = STATUS_COLORS[alert.status];
  const isVerified = alert.status === 'Verified';

  // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
  const position = [alert.location.coordinates[1], alert.location.coordinates[0]];

  return (
    <CircleMarker
      center={position}
      pathOptions={{
        color: isVerified ? '#ffffff' : color, // white border for verified
        fillColor: color,
        fillOpacity: isVerified ? 0.9 : 0.7,
        weight: isVerified ? 2 : 0,
        className: isVerified ? 'marker-pulse' : ''
      }}
      radius={isVerified ? 8 : 6}
      eventHandlers={{
        click: () => onClick(alert),
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} className="custom-popup" opacity={1}>
        <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg shadow-xl max-w-[200px]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold text-gray-300 uppercase">{alert.event_type}</span>
          </div>
          <div className="text-xs text-gray-400 line-clamp-2">{alert.text}</div>
        </div>
      </Tooltip>
    </CircleMarker>
  );
}
