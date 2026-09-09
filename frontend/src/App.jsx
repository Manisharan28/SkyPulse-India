import React, { useState } from 'react'
import StatsBar from './components/StatsBar'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import XAIModal from './components/XAIModal'
import { useAlerts } from './hooks/useAlerts'

function App() {
  const [filters, setFilters] = useState({
    status: [],
    eventType: [],
    location: '',
    locationCoords: null,
    radius: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState(null);

  const { alerts, stats, clusters, loading, error } = useAlerts(filters);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* Header */}
      <StatsBar stats={stats} />

      {/* Body: sidebar + map side by side */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left filter panel */}
        <Sidebar filters={filters} setFilters={setFilters} />

        {/* Map — takes all remaining space */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapView
            alerts={alerts}
            clusters={clusters}
            onMarkerClick={alert => setSelectedAlert(alert)}
            filters={filters}
          />

          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '5px 10px',
              fontSize: 12,
              color: 'var(--text-secondary)',
              zIndex: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                animation: 'pulse-ring 1s ease infinite',
              }} />
              Loading…
            </div>
          )}

          {/* Error toast */}
          {error && (
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 900,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 5,
              padding: '6px 12px',
              fontSize: 12,
              color: '#fca5a5',
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Alert detail modal */}
      <XAIModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  )
}

export default App
