import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { STATUS_COLORS } from '../utils/constants';

export default function XAIModal({ alert, onClose }) {
  if (!alert) return null;

  const color = STATUS_COLORS[alert.status];
  const mlConfidencePct = Math.round(alert.ml_confidence * 100);
  const weatherScorePct = Math.round(alert.weather_score * 100);
  const credibilityPct = Math.round(alert.credibility_score * 100);

  const StatusIcon = alert.status === 'Verified' ? CheckCircle 
                   : alert.status === 'Emerging' ? AlertTriangle 
                   : ShieldAlert;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-[500px] max-h-[90vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-bold px-2 py-1 rounded bg-gray-800 text-gray-300 uppercase tracking-wide border border-gray-700">
                {alert.event_type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
            <h2 className="text-gray-100 font-medium text-lg leading-snug">"{alert.text}"</h2>
            <div className="text-gray-400 text-sm mt-2 flex items-center space-x-1">
              <span>@{alert.username}</span>
              <span className="text-gray-600">•</span>
              <span>{alert.followers.toLocaleString()} followers</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Main Score Gauge */}
          <div className="flex flex-col items-center p-4 bg-gray-950 rounded-lg border border-gray-800">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Final Credibility Score</div>
            <div className="flex items-center space-x-3 mb-3">
              <StatusIcon className="w-8 h-8" style={{ color }} />
              <span className="text-4xl font-bold text-white">{credibilityPct}%</span>
            </div>
            
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-1000 ease-out" 
                   style={{ width: `${credibilityPct}%`, backgroundColor: color }}></div>
            </div>
            <div className="mt-3 text-sm font-bold uppercase tracking-widest" style={{ color }}>
              {alert.status}
            </div>
          </div>

          {/* XAI Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Explainable AI Breakdown</h3>
            <div className="space-y-4">
              
              {/* ML */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">🧠 NLP Confidence</span>
                  <span className="text-gray-100 font-semibold">{mlConfidencePct}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${mlConfidencePct}%` }}></div>
                </div>
              </div>

              {/* Weather */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">🌧️ Weather API Match</span>
                  <span className="text-gray-100 font-semibold">{weatherScorePct}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${weatherScorePct}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">📷 Media Attached</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {alert.has_media ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">📍 Cluster Status</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {alert.cluster_id ? (
                      <span className="text-purple-400">Active (Cluster #{alert.cluster_id})</span>
                    ) : (
                      "Not clustered"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">📡 Source</div>
                  <div className="text-sm font-semibold text-gray-200 uppercase">
                    {alert.source}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">📍 Location Extracted</div>
                  <div className="text-sm font-semibold text-gray-200 uppercase">
                    {alert.location_source === 'gps' ? 'Device GPS' : 'NER AI Model'}
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
