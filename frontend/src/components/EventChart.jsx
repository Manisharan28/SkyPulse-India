import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EVENT_TYPES } from '../utils/constants';

const EVENT_COLORS = {
  "Flood": "#3b82f6",
  "Heatwave": "#ef4444",
  "Cyclone": "#8b5cf6",
  "Heavy Rain": "#0ea5e9",
  "Wind": "#14b8a6",
  "Thunderstorm": "#f59e0b",
  "Fog": "#94a3b8",
  "Dust Storm": "#d97706"
};

const EventChart = ({ alerts }) => {
  const chartData = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    
    // Count events by category
    const counts = {};
    alerts.forEach(alert => {
      const type = alert.event_type || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    
    // Map to array for Recharts and map colors
    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key],
      color: EVENT_COLORS[key] || '#8884d8'
    })).sort((a, b) => b.count - a.count); // Sort by count descending
  }, [alerts]);

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 shadow-xl">
        <h3 className="text-gray-400 text-sm font-semibold mb-2">Event Distribution</h3>
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 shadow-xl">
      <h3 className="text-gray-400 text-sm font-semibold mb-4">Event Distribution</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#374151', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6', fontSize: '12px' }}
              itemStyle={{ color: '#f3f4f6' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EventChart;
