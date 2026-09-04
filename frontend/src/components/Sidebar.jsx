import React from 'react';
import { STATUS_COLORS, EVENT_TYPES } from '../utils/constants';
import { Filter, RotateCcw } from 'lucide-react';

export default function Sidebar({ filters, setFilters, alerts = [], onAlertClick }) {
  const toggleStatus = (status) => {
    setFilters(prev => {
      const current = prev.status || [];
      const updated = current.includes(status) 
        ? current.filter(s => s !== status)
        : [...current, status];
      return { ...prev, status: updated };
    });
  };

  const toggleEventType = (et) => {
    setFilters(prev => {
      const current = prev.eventType || [];
      const updated = current.includes(et) 
        ? current.filter(e => e !== et)
        : [...current, et];
      return { ...prev, eventType: updated };
    });
  };

  const setSource = (src) => {
    setFilters(prev => ({ ...prev, source: src }));
  };

  const resetFilters = () => {
    setFilters({ status: [], eventType: [], source: 'All' });
  };

  return (
    <div className="w-80 h-full glass-panel flex flex-col pointer-events-auto overflow-y-auto">
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Global Filters
          </h2>
        </div>
        <button 
          onClick={resetFilters}
          className="text-gray-400 hover:text-white transition-colors"
          title="Reset Filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-5 space-y-8">
        {/* Status Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Verification Status</h3>
          <div className="space-y-2">
            {Object.keys(STATUS_COLORS).map(status => (
              <label key={status} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors
                  ${filters.status?.includes(status) 
                    ? `border-transparent bg-opacity-100` 
                    : 'border-gray-600 bg-transparent group-hover:border-gray-400'}`}
                  style={{ backgroundColor: filters.status?.includes(status) ? STATUS_COLORS[status] : 'transparent' }}
                >
                  {filters.status?.includes(status) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={filters.status?.includes(status) || false}
                  onChange={() => toggleStatus(status)}
                />
                <span className="text-gray-200 group-hover:text-white transition-colors">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Source Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Source Data</h3>
          <div className="flex bg-gray-800 rounded-lg p-1">
            {['All', 'Twitter', 'IMD'].map(src => (
              <button
                key={src}
                onClick={() => setSource(src)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  (filters.source || 'All') === src
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Event Type</h3>
          <div className="space-y-2">
            {EVENT_TYPES.map(type => (
              <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors
                  ${filters.eventType?.includes(type) 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-600 bg-transparent group-hover:border-gray-400'}`}
                >
                  {filters.eventType?.includes(type) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={filters.eventType?.includes(type) || false}
                  onChange={() => toggleEventType(type)}
                />
                <span className="text-gray-200 group-hover:text-white transition-colors">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Alerts Feed */}
      <div className="p-5 border-t border-gray-800 mt-auto">
        <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-3">
          Recent Alerts
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {alerts.slice(0, 20).map(alert => (
            <div key={alert._id}
              onClick={() => onAlertClick && onAlertClick(alert)}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer border border-gray-700/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[alert.status] }} />
                <span className="text-xs font-bold text-gray-300 uppercase">{alert.event_type}</span>
                <span className="text-[10px] text-gray-500 ml-auto">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 line-clamp-2">{alert.text}</div>
              <div className="text-[10px] text-gray-500 mt-1">@{alert.username}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
