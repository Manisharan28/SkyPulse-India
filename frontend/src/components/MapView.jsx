import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { MAP_CENTER, MAP_ZOOM } from '../utils/constants';
import AlertMarker from './AlertMarker';
import ClusterLayer from './ClusterLayer';

/**
 * Compute LatLngBounds that wraps a geographic circle.
 * 1° lat ≈ 111.32 km (constant)
 * 1° lon ≈ 111.32 × cos(lat°) km (varies by latitude)
 */
function computeBounds(lat, lon, radiusKm) {
  const latDelta = radiusKm / 111.32;
  const lonDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return L.latLngBounds(
    [lat - latDelta, lon - lonDelta],
    [lat + latDelta, lon + lonDelta],
  );
}

// Must live inside <MapContainer> to call useMap()
function LocationOverlay({ coords, radiusKm, locationName }) {
  const map = useMap();

  useEffect(() => {
    if (!coords) return;
    try {
      if (radiusKm <= 0) {
        map.flyTo([coords.lat, coords.lon], 13, { animate: true, duration: 0.8 });
      } else {
        const bounds = computeBounds(coords.lat, coords.lon, radiusKm);
        map.flyToBounds(bounds, { padding: [60, 60], animate: true, duration: 0.8 });
      }
    } catch (err) {
      console.error('[MapView] flyToBounds error:', err);
      try { map.setView([coords.lat, coords.lon], 10); } catch (_) { /* ignore */ }
    }
  }, [coords, radiusKm, map, locationName]);

  if (!coords) return null;

  const radiusM = radiusKm * 1000;

  return (
    <>
      {radiusM > 0 && (
        <Circle
          center={[coords.lat, coords.lon]}
          radius={radiusM}
          pathOptions={{
            color: '#16a34a',
            weight: 1.5,
            opacity: 0.8,
            dashArray: '6 4',
            fillColor: '#16a34a',
            fillOpacity: 0.07,
          }}
        />
      )}
      <CircleMarker
        center={[coords.lat, coords.lon]}
        radius={9}
        pathOptions={{
          color: '#334155',    // dark border — visible on both light and dark map tiles
          weight: 2,
          fillColor: '#ffffff', // WHITE — distinct from green verified markers
          fillOpacity: 1,
        }}
        zIndexOffset={1000}
      >
        <Tooltip permanent direction="top" offset={[0, -12]} className="custom-popup">
          <div style={{
            background: 'rgba(10,16,28,0.93)',
            border: '1px solid rgba(22,163,74,0.5)',
            borderRadius: '5px',
            padding: '5px 10px',
            color: '#e2e8f0',
            fontFamily: 'inherit',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontWeight: 600, color: '#4ade80', marginBottom: 1 }}>
              {locationName}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>
              {radiusKm > 0 ? `${radiusKm} km radius` : 'Point location'}
            </div>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export default function MapView({ alerts, clusters, onMarkerClick, filters }) {
  const { locationCoords, location, radius } = filters || {};
  const radiusKm = typeof radius === 'number' ? radius : 0;

  return (
    <div className="w-full h-full relative">
      {/* Status bar shown when a location is active */}
      {locationCoords && location && (
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 800,
          background: 'rgba(10,16,28,0.88)',
          border: '1px solid rgba(22,163,74,0.35)',
          borderRadius: '6px',
          padding: '6px 16px',
          color: '#e2e8f0',
          fontFamily: 'inherit',
          fontSize: '13px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#4ade80', fontWeight: 600 }}>
            {radiusKm > 0 ? `${radiusKm} km around ` : ''}
          </span>
          <span style={{ fontWeight: 500 }}>{location}</span>
        </div>
      )}

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationOverlay
          coords={locationCoords}
          radiusKm={radiusKm}
          locationName={location}
        />
        <ClusterLayer clusters={clusters} />
        {(alerts || []).map(alert => (
          <AlertMarker key={alert._id} alert={alert} onClick={onMarkerClick} />
        ))}
      </MapContainer>
    </div>
  );
}
