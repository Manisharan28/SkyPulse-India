import React, { useState } from 'react';
import useAlerts from './hooks/useAlerts';
import StatsBar from './components/StatsBar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import XAIModal from './components/XAIModal';

function App() {
  const [filters, setFilters] = useState({ status: [], event_type: [] });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const { alerts, stats, clusters, error } = useAlerts(filters);

  return (
    <div className="w-full h-screen flex flex-col relative bg-gray-950 overflow-hidden">
      {/* Top Navigation */}
      <StatsBar stats={stats} />
      
      {/* Main Body */}
      <div className="flex-1 w-full relative">
        {/* Absolute Map Layer */}
        <MapView 
          alerts={alerts} 
          clusters={clusters} 
          onAlertClick={setSelectedAlert} 
        />
        
        {/* Floating Sidebar */}
        <div className="absolute top-4 left-4 z-[500] pointer-events-none">
          <Sidebar 
            filters={filters} 
            setFilters={setFilters} 
            alerts={alerts} 
            onAlertClick={setSelectedAlert} 
          />
        </div>
      </div>

      {/* Detail Modal Overlay */}
      {selectedAlert && (
        <XAIModal 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)} 
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-4 right-4 z-[999] bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-xl backdrop-blur-sm text-sm font-medium border border-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
