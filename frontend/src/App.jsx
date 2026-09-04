import React, { useState } from 'react'
import StatsBar from './components/StatsBar'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import XAIModal from './components/XAIModal'
import EventChart from './components/EventChart'
import { useAlerts } from './hooks/useAlerts'

function App() {
  const [filters, setFilters] = useState({ status: [], eventType: [], source: 'All' });
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // Custom hook fetches and polls the backend API
  const { alerts, stats, clusters, loading, error } = useAlerts(filters);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 overflow-hidden relative">
      <StatsBar stats={stats} />
      
      <div className="flex-1 flex overflow-hidden relative">
        <div className="absolute top-0 left-0 bottom-0 z-10 pointer-events-none p-4">
          <Sidebar filters={filters} setFilters={setFilters} alerts={alerts} onAlertClick={(alert) => setSelectedAlert(alert)} />
        </div>

        <div className="absolute top-0 right-0 z-10 pointer-events-auto p-4 w-96 mt-2 opacity-95">
          <EventChart alerts={alerts} />
        </div>
        
        <div className="flex-1 z-0">
          <MapView 
            alerts={alerts} 
            clusters={clusters} 
            onMarkerClick={(alert) => setSelectedAlert(alert)} 
          />
        </div>
      </div>

      <XAIModal 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
      />
      
      {/* Loading & Error overlays */}
      {error && (
        <div className="absolute top-20 right-4 bg-red-500/90 text-white px-4 py-2 rounded shadow-lg z-50 pointer-events-none">
          {error}
        </div>
      )}
    </div>
  )
}

export default App
