import React from 'react';
import { STATUS_COLORS } from '../utils/constants';

export default function StatsBar({ stats }) {
  return (
    <div className="h-16 glass-panel border-b border-t-0 border-l-0 border-r-0 border-gray-800 flex items-center px-6 justify-between pointer-events-auto shadow-md z-10 relative">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <h1 className="text-xl font-bold tracking-wide text-white">SIH Weather Intelligence</h1>
      </div>
      
      <div className="flex items-center space-x-8">
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Alerts</span>
          <span className="text-xl font-bold text-white">{stats.total || 0}</span>
        </div>
        
        <div className="h-8 w-px bg-gray-700"></div>
        
        <div className="flex space-x-6">
          <StatItem label="Verified" count={stats.verified} color={STATUS_COLORS.Verified} />
          <StatItem label="Emerging" count={stats.emerging} color={STATUS_COLORS.Emerging} />
          <StatItem label="Flagged" count={stats.flagged} color={STATUS_COLORS.Flagged} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, count, color }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-gray-400 leading-tight">{label}</span>
        <span className="text-lg font-bold text-gray-100 leading-tight">{count || 0}</span>
      </div>
    </div>
  );
}
