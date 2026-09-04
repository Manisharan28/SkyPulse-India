import React from 'react';
import { STATUS_COLORS, EVENT_TYPES } from '../utils/constants';
import { Filter, RotateCcw } from 'lucide-react';

export default function Sidebar({ filters, setFilters, alerts, onAlertClick }) {
  const toggleStatus = (status) => {
    setFilters(prev => {
      const current = prev.status || [];
      return {
        ...prev,
        status: current.includes(status) 
          ? current.filter(s => s !== status)
          : [...current, status]
      };
    });
  };

  const toggleEventType = (type) => {
    setFilters(prev => {
      const current = prev.event_type || [];
      return {
        ...prev,
        event_type: current.includes(type)
          ? current.filter(t => t !== type)
          : [...current, type]
      };
    });
  };

  const resetFilters = () => {
    setFilters({ status: [], event_type: [] });
  };

  return (
    <div className="w-80 h-[calc(100vh-80px)] glass-panel rounded-xl flex flex-col overflow-hidden pointer-events-auto">
      
      {/* Filters Section */}
      <div className="p-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
            <Filter size={14} /> Global Filters
          </h2>
          <button 
            onClick={resetFilters}
            className="text-gray-500 hover:text-white transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Verification Status</div>
            <div className="space-y-2">
              {Object.keys(STATUS_COLORS).map(status => (
                <label key={status} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${(filters.status || []).includes(status) 
                      ? 'border-transparent' 
                      : 'border-gray-700 group-hover:border-gray-500 bg-gray-900/50'}`}
                    style={{ backgroundColor: (filters.status || []).includes(status) ? STATUS_COLORS[status] : undefined }}
                  >
                    {(filters.status || []).includes(status) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Type Filter */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Event Type</div>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(type => {
                const isActive = (filters.event_type || []).includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      isActive 
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Alerts Feed */}
      <div className="p-5 border-t border-gray-800 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3 flex-shrink-0">
          Recent Alerts
        </h3>
        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {alerts.slice(0, 20).map(alert => (
            <div key={alert._id}
              onClick={() => onAlertClick && onAlertClick(alert)}
              className="p-3 rounded-lg bg-gray-900/60 hover:bg-gray-800 cursor-pointer border border-gray-800 hover:border-gray-600 transition-colors group">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: STATUS_COLORS[alert.status], boxShadow: `0 0 8px ${STATUS_COLORS[alert.status]}60` }} />
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{alert.event_type}</span>
                <span className="text-[10px] font-mono text-gray-500 ml-auto">
                  {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="text-xs text-gray-300 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">{alert.text}</div>
              <div className="text-[10px] text-gray-500 mt-2 font-mono">@{alert.username}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
