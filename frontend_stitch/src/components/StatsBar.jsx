import React from 'react';
import { STATUS_COLORS } from '../utils/constants';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  return (
    <div className="h-16 w-full glass-panel flex items-center justify-between px-6 z-50">
      {/* Brand / Logo Area */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          FasalX <span className="text-gray-400 font-normal">Weather Intelligence</span>
        </h1>
      </div>

      {/* Stats Counters */}
      <div className="flex h-full items-center">
        <div className="flex flex-col items-center justify-center px-6 h-full border-l border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Alerts</span>
          </div>
          <span className="text-xl font-bold font-mono text-white leading-none">{stats.total}</span>
        </div>

        <div className="flex flex-col items-center justify-center px-6 h-full border-l border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.Verified }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: STATUS_COLORS.Verified }}>Verified</span>
          </div>
          <span className="text-xl font-bold font-mono text-white leading-none">{stats.verified}</span>
        </div>

        <div className="flex flex-col items-center justify-center px-6 h-full border-l border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.Emerging }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: STATUS_COLORS.Emerging }}>Emerging</span>
          </div>
          <span className="text-xl font-bold font-mono text-white leading-none">{stats.emerging}</span>
        </div>

        <div className="flex flex-col items-center justify-center px-6 h-full border-l border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.Flagged }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: STATUS_COLORS.Flagged }}>Flagged</span>
          </div>
          <span className="text-xl font-bold font-mono text-white leading-none">{stats.flagged}</span>
        </div>
      </div>
    </div>
  );
}
