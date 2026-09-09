import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { STATUS_COLORS } from '../utils/constants';

export default function AlertMarker({ alert, onClick }) {
  if (!alert.location?.coordinates) return null;

  const [lng, lat] = alert.location.coordinates;
  const color      = STATUS_COLORS[alert.status] || '#64748b';
  const verified   = alert.status === 'Verified';

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={verified ? 7 : 5}
      pathOptions={{
        fillColor:   color,
        fillOpacity: 0.9,
        color:       verified ? '#fff' : color,
        weight:      verified ? 1.5 : 0.5,
        opacity:     0.9,
      }}
      className=""
      eventHandlers={{ click: () => onClick(alert) }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={1} className="custom-popup">
        <div style={{
          background:   'var(--bg-panel)',
          border:       '1px solid var(--border)',
          borderRadius: 5,
          padding:      '6px 10px',
          color:        'var(--text-primary)',
          fontFamily:   'inherit',
          maxWidth:     200,
          boxShadow:    '0 4px 14px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              {alert.event_type}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {alert.text}
          </p>
        </div>
      </Tooltip>
    </CircleMarker>
  );
}
